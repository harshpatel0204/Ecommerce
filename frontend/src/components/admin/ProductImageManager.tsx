import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Star, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { adminDeleteImage, adminReorderImages, adminUploadImage } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { imageUrl } from "@/lib/image";
import type { ProductImage } from "@/types/product";

interface Props {
  productId: string;
  images: ProductImage[];
}

/**
 * Image upload + management. Reordering uses left/right buttons (kept
 * dependency-light instead of a full drag-and-drop lib).
 */
export function ProductImageManager({ productId, images }: Props) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "product", productId] });

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await adminUploadImage(productId, files[i], images.length === 0 && i === 0);
      }
      toast.success("Image(s) uploaded");
      refresh();
    } catch {
      toast.error("Upload failed (check type/size — max 5MB)");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (id: string) => {
    await adminDeleteImage(productId, id);
    toast.success("Image removed");
    refresh();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...images];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    await adminReorderImages(productId, next.map((i) => i.id));
    refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Images</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" /> {busy ? "Uploading…" : "Upload"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">No images yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img, i) => (
            <div key={img.id} className="group relative overflow-hidden rounded-md border">
              <img src={imageUrl(img, 200)} alt="" className="aspect-square w-full object-cover" />
              {img.is_primary && (
                <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                  <Star className="mr-0.5 inline h-2.5 w-2.5 fill-current" />
                  Primary
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button type="button" onClick={() => move(i, -1)} className="text-white">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => remove(img.id)} className="text-white">
                  <Trash2 className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} className="text-white">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
