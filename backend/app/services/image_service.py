"""Image handling with Pillow. Bytes live in Postgres (BYTEA) — no Cloudinary.

- validate_and_ingest: validate an uploaded file (type + size), strip EXIF,
  record dimensions, and return the normalized bytes to store.
- resize: produce a resized/re-encoded copy on the fly for GET /api/images/{id}
  (replaces Cloudinary transformation URLs).
"""
import io

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.core.config import settings

# Map Pillow format -> mime type used when serving.
_FORMAT_TO_MIME = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp",
}
_MIME_TO_FORMAT = {v: k for k, v in _FORMAT_TO_MIME.items()}


class IngestedImage:
    def __init__(self, data: bytes, content_type: str, width: int, height: int):
        self.data = data
        self.content_type = content_type
        self.width = width
        self.height = height
        self.file_size = len(data)


async def validate_and_ingest(file: UploadFile) -> IngestedImage:
    """Validate an uploaded image and return normalized bytes + metadata.

    Raises HTTPException(400/413) on invalid type or oversize input.
    """
    if file.content_type not in settings.image_allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type: {file.content_type}",
        )

    raw = await file.read()
    if len(raw) > settings.max_image_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds {settings.MAX_IMAGE_UPLOAD_MB}MB limit",
        )

    try:
        img = Image.open(io.BytesIO(raw))
        img.verify()  # integrity check
        img = Image.open(io.BytesIO(raw))  # re-open after verify() exhausts the file
    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or corrupt image"
        )

    fmt = (img.format or "").upper()
    if fmt not in _FORMAT_TO_MIME:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image format"
        )

    # Re-encode without EXIF/metadata (strips orientation/GPS etc.).
    width, height = img.size
    clean = _encode(_strip(img), fmt)
    return IngestedImage(clean, _FORMAT_TO_MIME[fmt], width, height)


def resize(
    image_data: bytes,
    content_type: str,
    width: int | None = None,
    height: int | None = None,
    quality: int | None = None,
) -> tuple[bytes, str]:
    """Return a resized copy of the image, preserving aspect ratio.

    If no dimensions are given, the original bytes are returned unchanged.
    """
    if width is None and height is None and quality is None:
        return image_data, content_type

    img = Image.open(io.BytesIO(image_data))
    fmt = (img.format or _MIME_TO_FORMAT.get(content_type, "JPEG")).upper()

    if width or height:
        target_w = width or img.width
        target_h = height or img.height
        # thumbnail() scales down within the box, keeping aspect ratio.
        img.thumbnail((target_w, target_h), Image.Resampling.LANCZOS)

    out = _encode(img, fmt, quality=quality)
    return out, _FORMAT_TO_MIME.get(fmt, content_type)


def _strip(img: Image.Image) -> Image.Image:
    """Return a copy with pixel data only (no EXIF/ICC metadata)."""
    clean = Image.new(img.mode, img.size)
    clean.putdata(list(img.getdata()))
    return clean


def _encode(img: Image.Image, fmt: str, quality: int | None = None) -> bytes:
    buf = io.BytesIO()
    save_kwargs: dict = {}
    if fmt in ("JPEG", "WEBP"):
        save_kwargs["quality"] = quality or 85
    if fmt == "JPEG" and img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    img.save(buf, format=fmt, **save_kwargs)
    return buf.getvalue()
