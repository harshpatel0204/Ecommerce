"""Idempotently seed categories, products, variants, and product images.

Usage:
    python seed_products.py
"""
import asyncio
import io
import math
import uuid
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from PIL import Image, ImageDraw

from app.core.database import AsyncSessionLocal, engine
from app.models.product import Category, Product, ProductVariant, ProductImage


def generate_coin_image(color_type="gold", year="1918", value_text="SOVEREIGN"):
    """Programmatically generate a high-quality 600x600 coin image using Pillow."""
    # Create image with a rich light-cream gradient background
    img = Image.new("RGB", (600, 600), "#fbf9f4")
    draw = ImageDraw.Draw(img)

    # Center coords and radii
    cx, cy = 300, 300
    r_outer = 220
    r_inner1 = 205
    r_inner2 = 195

    # Draw outer circular coin shadow/rim highlight
    draw.ellipse(
        [cx - r_outer - 5, cy - r_outer - 5, cx + r_outer + 5, cy + r_outer + 5],
        fill="#e8dec9" if color_type == "gold" else "#d8dcde"
    )

    # Draw main coin circle
    if color_type == "gold":
        draw.ellipse(
            [cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer],
            fill="#d4af37"
        )
        draw.ellipse(
            [cx - r_inner1, cy - r_inner1, cx + r_inner1, cy + r_inner1],
            fill="#e6ca65"
        )
        draw.ellipse(
            [cx - r_inner2, cy - r_inner2, cx + r_inner2, cy + r_inner2],
            outline="#b5901c", width=5
        )
    else:
        draw.ellipse(
            [cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer],
            fill="#b0b7bd"
        )
        draw.ellipse(
            [cx - r_inner1, cy - r_inner1, cx + r_inner1, cy + r_inner1],
            fill="#d0d6da"
        )
        draw.ellipse(
            [cx - r_inner2, cy - r_inner2, cx + r_inner2, cy + r_inner2],
            outline="#8c9499", width=5
        )

    # Reeded edge (notches around the rim)
    notch_count = 72
    for i in range(notch_count):
        angle = 2 * math.pi * i / notch_count
        x0 = cx + (r_outer - 2) * math.cos(angle)
        y0 = cy + (r_outer - 2) * math.sin(angle)
        x1 = cx + (r_outer + 4) * math.cos(angle)
        y1 = cy + (r_outer + 4) * math.sin(angle)
        draw.line([(x0, y0), (x1, y1)], fill="#c0a830" if color_type == "gold" else "#9aa1a6", width=2)

    # Inner pattern — 8-pointed star
    star_points = 8
    points = []
    for i in range(star_points * 2):
        angle = math.pi * i / star_points - math.pi / 2
        r = 65 if i % 2 == 0 else 30
        points.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    draw.polygon(points, fill="#f2db8a" if color_type == "gold" else "#eef1f3")

    # Add text labels on the coin
    draw.text((250, 200), "HARIOM COINS", fill="#755a0b" if color_type == "gold" else "#4a5054")
    draw.text((285, 375), year, fill="#755a0b" if color_type == "gold" else "#4a5054")
    draw.text((255, 410), value_text, fill="#755a0b" if color_type == "gold" else "#4a5054")

    # Save to bytes
    out_bytes = io.BytesIO()
    img.save(out_bytes, format="PNG")
    return out_bytes.getvalue()


def generate_note_image(color_bg="#e8f5e9", year="1962", value_text="100 RUPEES", issuer="RBI"):
    """Programmatically generate a 600x400 banknote image using Pillow."""
    img = Image.new("RGB", (600, 400), color_bg)
    draw = ImageDraw.Draw(img)

    # Ornate border
    draw.rectangle([10, 10, 590, 390], outline="#2e7d32", width=3)
    draw.rectangle([20, 20, 580, 380], outline="#4caf50", width=2)
    draw.rectangle([30, 30, 570, 370], outline="#81c784", width=1)

    # Guilloche pattern (simple concentric ovals)
    for i in range(8):
        offset = i * 15
        draw.ellipse([40 + offset, 60 + offset, 560 - offset, 340 - offset],
                      outline="#a5d6a7", width=1)

    # Corner flourishes
    for (x, y) in [(40, 40), (540, 40), (40, 340), (540, 340)]:
        draw.ellipse([x - 15, y - 15, x + 15, y + 15], outline="#2e7d32", width=2)
        draw.ellipse([x - 8, y - 8, x + 8, y + 8], fill="#4caf50")

    # Central text
    draw.text((220, 100), issuer, fill="#1b5e20")
    draw.text((200, 160), value_text, fill="#1b5e20")
    draw.text((260, 220), year, fill="#2e7d32")
    draw.text((200, 280), "HARIOM COINS", fill="#388e3c")

    # Save to bytes
    out_bytes = io.BytesIO()
    img.save(out_bytes, format="PNG")
    return out_bytes.getvalue()


# ---- Categories ----
CATEGORIES = [
    {"name": "Indian Coins", "slug": "indian-coins", "sort_order": 1},
    {"name": "Foreign Coins", "slug": "foreign-coins", "sort_order": 2},
    {"name": "Indian Notes", "slug": "indian-notes", "sort_order": 3},
    {"name": "Foreign Notes", "slug": "foreign-notes", "sort_order": 4},
]

# ---- Products ----
PRODUCTS = [
    # ======== INDIAN COINS ========
    {
        "category_slug": "indian-coins",
        "name": "1918 George V British India Gold Sovereign",
        "slug": "1918-george-v-sovereign",
        "sku": "HC-IC-1918-SOV",
        "brand": "Royal Mint — Bombay",
        "base_price": 75000.0,
        "selling_price": 68500.0,
        "description": "A highly rare and collectible gold sovereign minted in India during World War I under the reign of King George V. Minted at the Bombay Mint and features the distinctive 'I' mintmark. Excellent grade and luster, high gold purity (22 Karat / 91.6%). Ideal for serious collectors.",
        "short_desc": "Highly rare 1918 Gold Sovereign minted in Bombay during WWI. 22K Gold.",
        "is_featured": True,
        "image_type": "coin",
        "color_type": "gold",
        "img_year": "1918",
        "img_value": "1 SOVEREIGN",
        "weight_g": 8,
    },
    {
        "category_slug": "indian-coins",
        "name": "1840 Queen Victoria One Rupee Silver Coin",
        "slug": "1840-queen-victoria-silver",
        "sku": "HC-IC-1840-VIC",
        "brand": "East India Company",
        "base_price": 12000.0,
        "selling_price": 8900.0,
        "description": "Superb silver rupee coin from the early reign of Queen Victoria, issued by the East India Company in 1840. Divided legend type with excellent detail in Victoria's young portrait. 0.917 Silver purity.",
        "short_desc": "1840 silver rupee coin from early Victorian era. Divided legend type.",
        "is_featured": True,
        "image_type": "coin",
        "color_type": "silver",
        "img_year": "1840",
        "img_value": "ONE RUPEE",
        "weight_g": 11,
    },
    {
        "category_slug": "indian-coins",
        "name": "Mughal Emperor Akbar Silver Rupee — Circa 1600 AD",
        "slug": "mughal-akbar-silver-rupee",
        "sku": "HC-IC-MUG-AKB",
        "brand": "Mughal Empire",
        "base_price": 28000.0,
        "selling_price": 24000.0,
        "description": "An authentic silver rupee from the court of Mughal Emperor Akbar the Great, circa 1600 AD. Features beautiful Persian calligraphy. Excellent patina and well-struck. Includes certificate of authenticity.",
        "short_desc": "Rare silver rupee from Emperor Akbar's reign. Beautiful Persian calligraphy.",
        "is_featured": True,
        "image_type": "coin",
        "color_type": "silver",
        "img_year": "1600 AD",
        "img_value": "RUPEE",
        "weight_g": 11,
    },
    # ======== FOREIGN COINS ========
    {
        "category_slug": "foreign-coins",
        "name": "Ancient Roman Emperor Constantine Silver Denarius",
        "slug": "roman-constantine-silver",
        "sku": "HC-FC-ROM-CONST",
        "brand": "Roman Empire",
        "base_price": 15000.0,
        "selling_price": 12500.0,
        "description": "Authentic ancient Roman silver coin featuring the detailed bust of Emperor Constantine the Great. Circa 307–337 AD. Verified authentic with certificate of authenticity.",
        "short_desc": "Authentic silver coin from the era of Constantine the Great. Circa 307-337 AD.",
        "is_featured": True,
        "image_type": "coin",
        "color_type": "silver",
        "img_year": "320 AD",
        "img_value": "DENARIUS",
        "weight_g": 3,
    },
    {
        "category_slug": "foreign-coins",
        "name": "1921 USA Morgan Silver Dollar",
        "slug": "1921-usa-morgan-silver-dollar",
        "sku": "HC-FC-USA-MORG",
        "brand": "United States Mint",
        "base_price": 18000.0,
        "selling_price": 15500.0,
        "description": "The iconic Morgan Silver Dollar — minted in 1921 at the Philadelphia Mint. 90% silver content (26.73g fine silver). Features Lady Liberty and the American bald eagle. One of the most collected American coins.",
        "short_desc": "Classic 1921 Morgan Silver Dollar. 90% silver, iconic American coin.",
        "is_featured": True,
        "image_type": "coin",
        "color_type": "silver",
        "img_year": "1921",
        "img_value": "ONE DOLLAR",
        "weight_g": 27,
    },
    {
        "category_slug": "foreign-coins",
        "name": "Alexander the Great Silver Drachm — c. 330 BC",
        "slug": "alexander-great-silver-drachm",
        "sku": "HC-FC-GRK-ALEX",
        "brand": "Macedonian Kingdom",
        "base_price": 38000.0,
        "selling_price": 32000.0,
        "description": "Extremely rare silver drachm from the era of Alexander the Great. Circa 330 BC. Obverse shows Hercules wearing a lion's skin headdress, reverse depicts Zeus seated. Museum-quality piece.",
        "short_desc": "Rare ancient Greek silver drachm. Hercules obverse, Zeus reverse.",
        "is_featured": False,
        "image_type": "coin",
        "color_type": "silver",
        "img_year": "330 BC",
        "img_value": "DRACHM",
        "weight_g": 4,
    },
    # ======== INDIAN NOTES ========
    {
        "category_slug": "indian-notes",
        "name": "1943 Burma WWII Japanese Invasion 10 Rupees Note",
        "slug": "1943-burma-japanese-invasion-note",
        "sku": "HC-IN-JIM-10R",
        "brand": "Japanese Government",
        "base_price": 3500.0,
        "selling_price": 2800.0,
        "description": "Original World War II-era Japanese Invasion Money (JIM) — a 10 Rupees note for occupied Burma (Myanmar). Circa 1943. Uncirculated condition. A fascinating piece of wartime history.",
        "short_desc": "WWII Japanese Invasion Money. 10 Rupees note from occupied Burma, circa 1943.",
        "is_featured": True,
        "image_type": "note",
        "color_bg": "#f5f0e1",
        "img_year": "1943",
        "img_value": "10 RUPEES",
        "img_issuer": "JAPANESE GOVT",
        "weight_g": 1,
    },
    {
        "category_slug": "indian-notes",
        "name": "1962 Reserve Bank of India ₹100 Note — PC Bhattacharyya",
        "slug": "1962-rbi-100-rupee-note",
        "sku": "HC-IN-RBI-100-62",
        "brand": "Reserve Bank of India",
        "base_price": 8500.0,
        "selling_price": 6500.0,
        "description": "Rare 1962 RBI One Hundred Rupees banknote, signed by Governor P.C. Bhattacharyya. Features Hirakud Dam watermark and the Ashoka Pillar emblem. Collectible condition.",
        "short_desc": "Rare 1962 RBI ₹100 note signed by PC Bhattacharyya. Hirakud Dam watermark.",
        "is_featured": True,
        "image_type": "note",
        "color_bg": "#e8f5e9",
        "img_year": "1962",
        "img_value": "100 RUPEES",
        "img_issuer": "RESERVE BANK",
        "weight_g": 1,
    },
    {
        "category_slug": "indian-notes",
        "name": "1917 King George V 10 Rupees — Signed H. Denning",
        "slug": "1917-george-v-10-rupees-note",
        "sku": "HC-IN-GV-10R-17",
        "brand": "Government of India",
        "base_price": 45000.0,
        "selling_price": 38000.0,
        "description": "Extremely rare 1917 British India Ten Rupees banknote under King George V, signed by H. Denning. Only a handful of surviving examples known. Museum-worthy.",
        "short_desc": "Extremely rare 1917 British India ₹10 note. Signed H. Denning.",
        "is_featured": False,
        "image_type": "note",
        "color_bg": "#efebe9",
        "img_year": "1917",
        "img_value": "10 RUPEES",
        "img_issuer": "GOVT OF INDIA",
        "weight_g": 1,
    },
    # ======== FOREIGN NOTES ========
    {
        "category_slug": "foreign-notes",
        "name": "1935 Bank of England £5 White Note — Peppiatt",
        "slug": "1935-bank-of-england-5-pound-white-note",
        "sku": "HC-FN-BOE-5-35",
        "brand": "Bank of England",
        "base_price": 55000.0,
        "selling_price": 45000.0,
        "description": "Extremely rare 1935 Bank of England Five Pound 'White Note' signed by K.O. Peppiatt. Elaborate black-and-white intaglio engraving. Includes Britannia seal. Excellent collector condition.",
        "short_desc": "Rare 1935 Bank of England £5 white note. Elaborate intaglio engraving.",
        "is_featured": True,
        "image_type": "note",
        "color_bg": "#fafafa",
        "img_year": "1935",
        "img_value": "5 POUNDS",
        "img_issuer": "BANK OF ENGLAND",
        "weight_g": 2,
    },
    {
        "category_slug": "foreign-notes",
        "name": "1914 German Empire 100 Mark Reichsbanknote",
        "slug": "1914-german-empire-100-mark-note",
        "sku": "HC-FN-GER-100M-14",
        "brand": "Reichsbank",
        "base_price": 5500.0,
        "selling_price": 4200.0,
        "description": "Pre-World War I German Empire 100 Mark Reichsbanknote, dated 1914. Imperial German eagle and ornate guilloche borders. Crisp and well-preserved.",
        "short_desc": "Pre-WWI German 100 Mark note. Imperial eagle design, crisp condition.",
        "is_featured": False,
        "image_type": "note",
        "color_bg": "#e3f2fd",
        "img_year": "1914",
        "img_value": "100 MARK",
        "img_issuer": "REICHSBANK",
        "weight_g": 1,
    },
    {
        "category_slug": "foreign-notes",
        "name": "1928 USA $2 Red Seal United States Note",
        "slug": "1928-usa-2-dollar-red-seal",
        "sku": "HC-FN-USA-2D-28",
        "brand": "United States Treasury",
        "base_price": 12000.0,
        "selling_price": 9800.0,
        "description": "1928 Series United States $2 Red Seal Legal Tender Note. Thomas Jefferson on obverse, Monticello on reverse. Red serial numbers and Treasury seal. Crisp and original.",
        "short_desc": "1928 US $2 Red Seal note. Thomas Jefferson portrait. Crisp condition.",
        "is_featured": True,
        "image_type": "note",
        "color_bg": "#e8f5e9",
        "img_year": "1928",
        "img_value": "TWO DOLLARS",
        "img_issuer": "US TREASURY",
        "weight_g": 1,
    },
]


async def seed_products() -> None:
    async with AsyncSessionLocal() as db:
        # 1. Clean existing products/categories
        print("Cleaning up old product tables...")
        from sqlalchemy import text
        await db.execute(text("TRUNCATE TABLE categories, products, product_variants, product_images CASCADE"))
        await db.commit()

        # 2. Insert Categories
        category_map = {}
        print("Seeding Categories...")
        for cat_data in CATEGORIES:
            cat = Category(
                id=uuid.uuid4(),
                name=cat_data["name"],
                slug=cat_data["slug"],
                sort_order=cat_data["sort_order"],
                is_active=True,
            )
            db.add(cat)
            category_map[cat.slug] = cat.id

        await db.commit()
        print(f"Successfully seeded {len(category_map)} categories.")

        # 3. Insert Products and Variants & Images
        print("Seeding Products...")
        for prod_data in PRODUCTS:
            category_id = category_map[prod_data["category_slug"]]
            product_id = uuid.uuid4()

            # Create product
            prod = Product(
                id=product_id,
                category_id=category_id,
                name=prod_data["name"],
                slug=prod_data["slug"],
                sku=prod_data["sku"],
                description=prod_data["description"],
                short_desc=prod_data["short_desc"],
                brand=prod_data["brand"],
                base_price=prod_data["base_price"],
                selling_price=prod_data["selling_price"],
                weight_grams=prod_data["weight_g"],
                is_active=True,
                is_featured=prod_data["is_featured"],
                meta_title=f"{prod_data['name']} — Buy Online at HariomCoins",
                meta_desc=prod_data["short_desc"],
            )
            db.add(prod)

            # Create default variant
            is_coin = prod_data["image_type"] == "coin"
            variant = ProductVariant(
                id=uuid.uuid4(),
                product_id=product_id,
                sku=f"{prod_data['sku']}-STD",
                size="Proof Grade" if is_coin and prod_data.get("color_type") == "gold" else ("Standard Grade" if is_coin else "Original"),
                color="Gold" if prod_data.get("color_type") == "gold" else ("Silver" if is_coin else "Paper"),
                color_hex="#ffd700" if prod_data.get("color_type") == "gold" else ("#c0c0c0" if is_coin else "#f5f5dc"),
                price_delta=0.0,
                stock_quantity=10,
                low_stock_threshold=2,
                is_active=True,
            )
            db.add(variant)
            await db.flush()

            # Generate image
            print(f"Generating image for {prod_data['name']}...")
            if prod_data["image_type"] == "coin":
                img_bytes = generate_coin_image(
                    color_type=prod_data["color_type"],
                    year=prod_data["img_year"],
                    value_text=prod_data["img_value"]
                )
                img_w, img_h = 600, 600
            else:
                img_bytes = generate_note_image(
                    color_bg=prod_data["color_bg"],
                    year=prod_data["img_year"],
                    value_text=prod_data["img_value"],
                    issuer=prod_data.get("img_issuer", "")
                )
                img_w, img_h = 600, 400

            # Create ProductImage
            image = ProductImage(
                id=uuid.uuid4(),
                product_id=product_id,
                variant_id=variant.id,
                image_data=img_bytes,
                content_type="image/png",
                file_size=len(img_bytes),
                width=img_w,
                height=img_h,
                alt_text=prod_data["name"],
                display_order=0,
                is_primary=True,
                is_deleted=False,
            )
            db.add(image)

        await db.commit()
        print(f"Successfully seeded {len(PRODUCTS)} products (coins & notes).")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_products())
