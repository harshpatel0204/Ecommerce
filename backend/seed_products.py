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
        # Inner lighter circle
        draw.ellipse(
            [cx - r_inner1, cy - r_inner1, cx + r_inner1, cy + r_inner1],
            fill="#e6ca65"
        )
        # Rim outline
        draw.ellipse(
            [cx - r_inner2, cy - r_inner2, cx + r_inner2, cy + r_inner2],
            outline="#b5901c", width=5
        )
    else:
        draw.ellipse(
            [cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer],
            fill="#b0b7bd"
        )
        # Inner lighter circle
        draw.ellipse(
            [cx - r_inner1, cy - r_inner1, cx + r_inner1, cy + r_inner1],
            fill="#d0d6da"
        )
        # Rim outline
        draw.ellipse(
            [cx - r_inner2, cy - r_inner2, cx + r_inner2, cy + r_inner2],
            outline="#8e969c", width=5
        )

    # Draw reeded edge notches (notched rim)
    num_notches = 90
    for i in range(num_notches):
        angle = i * (360 / num_notches)
        rad = math.radians(angle)
        x1 = cx + (r_outer - 15) * math.cos(rad)
        y1 = cy + (r_outer - 15) * math.sin(rad)
        x2 = cx + r_outer * math.cos(rad)
        y2 = cy + r_outer * math.sin(rad)
        draw.line(
            [x1, y1, x2, y2],
            fill="#8a6c11" if color_type == "gold" else "#71797f",
            width=2
        )

    # Draw a decorative pattern or emblem in the center (e.g. star or diamond)
    # 8-pointed star in the center
    points = []
    for i in range(16):
        angle = i * (360 / 16)
        rad = math.radians(angle)
        r = 60 if i % 2 == 0 else 25
        points.append((cx + r * math.cos(rad), cy + r * math.sin(rad)))
    draw.polygon(points, fill="#f2db8a" if color_type == "gold" else "#eef1f3")

    # Add text labels on the coin
    # Draw text manually or fallback to standard font drawing.
    # To keep it extremely robust and clean without external fonts, we will draw stylized text
    # using default font. Default font is small, so we can write labels around center.
    draw.text((250, 200), "HARIOM COINS", fill="#755a0b" if color_type == "gold" else "#4a5054")
    draw.text((285, 375), year, fill="#755a0b" if color_type == "gold" else "#4a5054")
    draw.text((255, 410), value_text, fill="#755a0b" if color_type == "gold" else "#4a5054")

    # Save to bytes
    out_bytes = io.BytesIO()
    img.save(out_bytes, format="PNG")
    return out_bytes.getvalue()


COIN_CATEGORIES = [
    {
        "name": "Ancient Gold & Silver Coins",
        "slug": "ancient-coins",
        "sort_order": 1,
    },
    {
        "name": "British India Coins",
        "slug": "british-india",
        "sort_order": 2,
    },
    {
        "name": "Republic of India Coins",
        "slug": "republic-india",
        "sort_order": 3,
    },
    {
        "name": "Foreign & Global Coins",
        "slug": "foreign-global",
        "sort_order": 4,
    },
    {
        "name": "Commemorative Coins",
        "slug": "commemorative-coins",
        "sort_order": 5,
    },
]

COIN_PRODUCTS = [
    {
        "category_slug": "british-india",
        "name": "1918 George V British India Gold Sovereign",
        "slug": "1918-george-v-sovereign",
        "sku": "HC-BI-1918-SOV",
        "brand": "Royal Mint",
        "base_price": 75000.0,
        "selling_price": 68500.0,
        "description": "A highly rare and collectible gold sovereign minted in India during World War I under the reign of King George V. Minted at the Bombay Mint and features the distinctive 'I' mintmark. Excellent grade and luster, high gold purity (22 Karat / 91.6%). Ideal for serious collectors and numismatic investors.",
        "short_desc": "Highly rare 1918 Gold Sovereign minted in Bombay during WWI. 22K Gold, excellent luster.",
        "is_featured": True,
        "coin_color": "gold",
        "coin_year": "1918",
        "coin_value": "1 SOVEREIGN",
        "weight_g": 8,
    },
    {
        "category_slug": "ancient-coins",
        "name": "Ancient Roman Emperor Constantine Silver Coin",
        "slug": "roman-constantine-silver",
        "sku": "HC-ANC-ROM-CONST",
        "brand": "Roman Empire",
        "base_price": 15000.0,
        "selling_price": 12500.0,
        "description": "Authentic ancient Roman silver coin featuring the detailed bust of Emperor Constantine the Great (Constantine I). Dated circa 307–337 AD. Reverse shows Roman legionary standards and goddess Victoria. Verified authentic, comes with certificate of authenticity.",
        "short_desc": "Authentic silver coin from the era of Constantine the Great. Circa 307-337 AD.",
        "is_featured": True,
        "coin_color": "silver",
        "coin_year": "320 AD",
        "coin_value": "DENARIUS",
        "weight_g": 3,
    },
    {
        "category_slug": "british-india",
        "name": "1947 Last British India One Rupee Silver Coin",
        "slug": "1947-last-rupee-silver",
        "sku": "HC-BI-1947-RUPEE",
        "brand": "Government of India",
        "base_price": 6000.0,
        "selling_price": 4500.0,
        "description": "The historic last silver rupee coin minted in British India before independence in August 1947. Minted at the Bombay Mint. Features the profile of King George VI on the obverse and stylized floral carvings on the reverse. High collectible value due to the historic year.",
        "short_desc": "Historic final silver rupee minted in British India in 1947. King George VI portrait.",
        "is_featured": False,
        "coin_color": "silver",
        "coin_year": "1947",
        "coin_value": "ONE RUPEE",
        "weight_g": 12,
    },
    {
        "category_slug": "commemorative-coins",
        "name": "75th Independence Commemorative Gold Proof Coin",
        "slug": "75th-independence-gold-proof",
        "sku": "HC-COM-75IND-GOLD",
        "brand": "India Government Mint",
        "base_price": 110000.0,
        "selling_price": 98000.0,
        "description": "Limited edition proof gold coin released by the India Government Mint to commemorate 75 years of Independence (Azadi Ka Amrit Mahotsav). Struck in 99.9% pure gold. High-relief frosting with a perfect mirror-like background. Includes official wooden velvet presentation box and certificate of authenticity.",
        "short_desc": "99.9% Pure Gold Commemorative Proof Coin. Limited edition with velvet presentation box.",
        "is_featured": True,
        "coin_color": "gold",
        "coin_year": "2022",
        "coin_value": "100 RUPEES",
        "weight_g": 10,
    },
    {
        "category_slug": "british-india",
        "name": "1840 Queen Victoria One Rupee Silver Coin",
        "slug": "1840-queen-victoria-silver",
        "sku": "HC-BI-1840-VIC",
        "brand": "East India Company",
        "base_price": 12000.0,
        "selling_price": 8900.0,
        "description": "Superb silver rupee coin from the early reign of Queen Victoria, issued by the East India Company in 1840. Divided legend type with excellent detail in Victoria's young portrait. 0.917 Silver purity. Highly prized by history and colonial coin collectors.",
        "short_desc": "1840 silver rupee coin from early Victorian era. Divided legend type.",
        "is_featured": True,
        "coin_color": "silver",
        "coin_year": "1840",
        "coin_value": "ONE RUPEE",
        "weight_g": 11,
    },
    {
        "category_slug": "ancient-coins",
        "name": "Alexander the Great Silver Drachm",
        "slug": "alexander-the-great-drachm",
        "sku": "HC-ANC-GRK-ALEX",
        "brand": "Ancient Greece",
        "base_price": 38000.0,
        "selling_price": 32000.0,
        "description": "Rare ancient Greek silver drachm minted during the lifetime or shortly after the reign of Alexander the Great (circa 336–323 BC). Features Hercules wearing the Nemean Lion skin on the obverse and seated Zeus holding an eagle on the reverse. Masterpiece of classical numismatic art.",
        "short_desc": "Classical Greek silver drachm. Features Hercules & Zeus. Circa 323 BC.",
        "is_featured": False,
        "coin_color": "silver",
        "coin_year": "323 BC",
        "coin_value": "DRACHM",
        "weight_g": 4,
    },
    {
        "category_slug": "republic-india",
        "name": "1970 Republic of India 10 Rupees Silver Proof Coin",
        "slug": "1970-india-10-rupees-silver",
        "sku": "HC-RI-1970-FAO",
        "brand": "Kolkata Mint",
        "base_price": 7000.0,
        "selling_price": 5500.0,
        "description": "Collectible high-purity silver coin issued in 1970 under the Food and Agriculture Organization (FAO) 'Food for All' campaign. Proof strike with beautiful frosted details. A prized addition to any Republic of India numismatic collection.",
        "short_desc": "FAO Food for All commemorative silver proof coin. Kolkata Mint, 1970.",
        "is_featured": False,
        "coin_color": "silver",
        "coin_year": "1970",
        "coin_value": "10 RUPEES",
        "weight_g": 15,
    },
    {
        "category_slug": "ancient-coins",
        "name": "Rare Mughal Emperor Akbar Silver Rupee",
        "slug": "mughal-akbar-silver-rupee",
        "sku": "HC-ANC-MUG-AKBAR",
        "brand": "Mughal Empire",
        "base_price": 28000.0,
        "selling_price": 24000.0,
        "description": "Superb historical silver rupee minted during the reign of Akbar the Great (circa 1556–1605 AD). Features beautiful Persian inscriptions on both sides detailing the mint name and date. Clean strikes with complete borders. Highly sought-after piece of Indian history.",
        "short_desc": "Persian-inscribed silver rupee from Akbar the Great's reign. Circa 1600 AD.",
        "is_featured": True,
        "coin_color": "silver",
        "coin_year": "1600 AD",
        "coin_value": "RUPEE",
        "weight_g": 11,
    },
]


async def seed_products() -> None:
    async with AsyncSessionLocal() as db:
        # 1. Clean existing products/categories
        # Due to cascades, deleting categories will delete products, variants, etc.
        # But we do it cleanly
        print("Cleaning up old product tables...")
        from sqlalchemy import text
        await db.execute(text("TRUNCATE TABLE categories, products, product_variants, product_images CASCADE"))
        await db.commit()

        # 2. Insert Categories
        category_map = {}
        print("Seeding Categories...")
        for cat_data in COIN_CATEGORIES:
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
        for prod_data in COIN_PRODUCTS:
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
                meta_title=f"{prod_data['name']} - Buy Online at HariomCoins",
                meta_desc=prod_data["short_desc"],
            )
            db.add(prod)

            # Create default variant (so customers can add it to cart)
            variant = ProductVariant(
                id=uuid.uuid4(),
                product_id=product_id,
                sku=f"{prod_data['sku']}-STD",
                size="Standard Grade" if prod_data["coin_color"] == "silver" else "Proof Grade",
                color="Gold" if prod_data["coin_color"] == "gold" else "Silver",
                color_hex="#ffd700" if prod_data["coin_color"] == "gold" else "#c0c0c0",
                price_delta=0.0,
                stock_quantity=10,
                low_stock_threshold=2,
                is_active=True,
            )
            db.add(variant)
            await db.flush()

            # Generate coin image
            print(f"Generating coin image for {prod_data['name']}...")
            img_bytes = generate_coin_image(
                color_type=prod_data["coin_color"],
                year=prod_data["coin_year"],
                value_text=prod_data["coin_value"]
            )

            # Create ProductImage
            image = ProductImage(
                id=uuid.uuid4(),
                product_id=product_id,
                variant_id=variant.id,
                image_data=img_bytes,
                content_type="image/png",
                file_size=len(img_bytes),
                width=600,
                height=600,
                alt_text=prod_data["name"],
                display_order=0,
                is_primary=True,
                is_deleted=False,
            )
            db.add(image)

        await db.commit()
        print(f"Successfully seeded {len(COIN_PRODUCTS)} coin products.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_products())
