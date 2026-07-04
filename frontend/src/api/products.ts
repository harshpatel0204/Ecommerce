import { apiClient } from "@/api/client";
import type {
  Category,
  PaginatedProducts,
  ProductDetail,
  ProductFilters,
  ProductListItem
} from "@/types/product";

// ---- Fallback Mock Database for HariomCoins — Coins & Banknotes ----
const MOCK_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Indian Coins", slug: "indian-coins", parent_id: null, sort_order: 1, is_active: true, children: [] },
  { id: "cat-2", name: "Foreign Coins", slug: "foreign-coins", parent_id: null, sort_order: 2, is_active: true, children: [] },
  { id: "cat-3", name: "Indian Notes", slug: "indian-notes", parent_id: null, sort_order: 3, is_active: true, children: [] },
  { id: "cat-4", name: "Foreign Notes", slug: "foreign-notes", parent_id: null, sort_order: 4, is_active: true, children: [] },
];

const MOCK_PRODUCTS: ProductDetail[] = [
  // ======== INDIAN COINS ========
  {
    id: "prod-1",
    category_id: "cat-1",
    name: "1918 George V British India Gold Sovereign",
    slug: "1918-george-v-sovereign",
    sku: "HC-IC-1918-SOV",
    brand: "Royal Mint — Bombay",
    base_price: 75000,
    selling_price: 68500,
    tax_percent: 0,
    weight_grams: 8,
    length_cm: 2.2,
    width_cm: 2.2,
    height_cm: 0.2,
    is_active: true,
    is_featured: true,
    meta_title: "1918 George V British India Gold Sovereign | HariomCoins",
    meta_desc: "Rare 1918 Gold Sovereign minted in Bombay during WWI. 22K Gold.",
    created_at: "2026-07-01T00:00:00Z",
    description: "A highly rare and collectible gold sovereign minted in India during World War I under the reign of King George V. Minted at the Bombay Mint and features the distinctive 'I' mintmark. Excellent grade and luster, high gold purity (22 Karat / 91.6%). Ideal for serious collectors and numismatic investors.",
    short_desc: "Highly rare 1918 Gold Sovereign minted in Bombay during WWI. 22K Gold, excellent luster.",
    variants: [
      { id: "var-1a", sku: "HC-IC-1918-SOV-PF", size: "Proof Grade", color: "Gold", color_hex: "#ffd700", price_delta: 0, stock_quantity: 3, low_stock_threshold: 1, is_active: true },
      { id: "var-1b", sku: "HC-IC-1918-SOV-VF", size: "Very Fine", color: "Gold", color_hex: "#daa520", price_delta: -8000, stock_quantity: 7, low_stock_threshold: 2, is_active: true }
    ],
    images: [
      { id: "img-1", is_primary: true, display_order: 0, alt_text: "1918 George V Gold Sovereign", width: 600, height: 600, url: "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80" }
    ],
    avg_rating: 4.9,
    review_count: 14,
    discount_percent: 8
  },
  {
    id: "prod-2",
    category_id: "cat-1",
    name: "1840 Queen Victoria One Rupee Silver Coin",
    slug: "1840-queen-victoria-silver",
    sku: "HC-IC-1840-VIC",
    brand: "East India Company",
    base_price: 12000,
    selling_price: 8900,
    tax_percent: 0,
    weight_grams: 11,
    length_cm: 3,
    width_cm: 3,
    height_cm: 0.15,
    is_active: true,
    is_featured: true,
    meta_title: "1840 Queen Victoria One Rupee Silver | HariomCoins",
    meta_desc: "1840 silver rupee coin from early Victorian era. Divided legend type.",
    created_at: "2026-07-02T12:00:00Z",
    description: "Superb silver rupee coin from the early reign of Queen Victoria, issued by the East India Company in 1840. Divided legend type with excellent detail in Victoria's young portrait. 0.917 Silver purity. Highly prized by history and colonial coin collectors.",
    short_desc: "1840 silver rupee coin from early Victorian era. Divided legend type.",
    variants: [
      { id: "var-2", sku: "HC-IC-1840-VIC-STD", size: "Fine Grade", color: "Silver", color_hex: "#c0c0c0", price_delta: 0, stock_quantity: 7, low_stock_threshold: 2, is_active: true }
    ],
    images: [
      { id: "img-2", is_primary: true, display_order: 0, alt_text: "1840 Queen Victoria Rupee", width: 600, height: 600, url: "https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&w=600&q=80" }
    ],
    avg_rating: 4.6,
    review_count: 12,
    discount_percent: 25
  },
  {
    id: "prod-3",
    category_id: "cat-1",
    name: "Mughal Emperor Akbar Silver Rupee — Circa 1600 AD",
    slug: "mughal-akbar-silver-rupee",
    sku: "HC-IC-MUG-AKB",
    brand: "Mughal Empire",
    base_price: 28000,
    selling_price: 24000,
    tax_percent: 0,
    weight_grams: 11,
    length_cm: 2.5,
    width_cm: 2.5,
    height_cm: 0.15,
    is_active: true,
    is_featured: true,
    meta_title: "Mughal Akbar Silver Rupee c.1600 AD | HariomCoins",
    meta_desc: "Rare silver rupee from Emperor Akbar's reign. Persian inscriptions.",
    created_at: "2026-07-01T10:00:00Z",
    description: "An authentic silver rupee from the court of Mughal Emperor Akbar the Great, circa 1600 AD. Features beautiful Persian calligraphy with the Kalima on the obverse and the Emperor's name and mint on the reverse. Excellent patina and well-struck. Includes certificate of authenticity.",
    short_desc: "Rare silver rupee from Emperor Akbar's reign. Beautiful Persian calligraphy.",
    variants: [
      { id: "var-3", sku: "HC-IC-MUG-AKB-STD", size: "Good-Very Fine", color: "Silver", color_hex: "#b0b0b0", price_delta: 0, stock_quantity: 5, low_stock_threshold: 1, is_active: true }
    ],
    images: [
      { id: "img-3", is_primary: true, display_order: 0, alt_text: "Mughal Akbar Silver Rupee", width: 600, height: 600, url: "https://images.unsplash.com/photo-1621527710313-0504cf10a26d?auto=format&fit=crop&w=600&q=80" }
    ],
    avg_rating: 4.8,
    review_count: 9,
    discount_percent: 14
  },
  // ======== FOREIGN COINS ========
  {
    id: "prod-4",
    category_id: "cat-2",
    name: "Ancient Roman Emperor Constantine Silver Denarius",
    slug: "roman-constantine-silver",
    sku: "HC-FC-ROM-CONST",
    brand: "Roman Empire",
    base_price: 15000,
    selling_price: 12500,
    tax_percent: 0,
    weight_grams: 3,
    length_cm: 1.5,
    width_cm: 1.5,
    height_cm: 0.1,
    is_active: true,
    is_featured: true,
    meta_title: "Roman Constantine Silver Denarius | HariomCoins",
    meta_desc: "Authentic silver coin from the era of Constantine the Great. Circa 307-337 AD.",
    created_at: "2026-07-01T06:00:00Z",
    description: "Authentic ancient Roman silver coin featuring the detailed bust of Emperor Constantine the Great (Constantine I). Dated circa 307–337 AD. Reverse shows Roman legionary standards and goddess Victoria. Verified authentic with certificate of authenticity.",
    short_desc: "Authentic silver coin from the era of Constantine the Great. Circa 307-337 AD.",
    variants: [
      { id: "var-4", sku: "HC-FC-ROM-CONST-STD", size: "Standard Grade", color: "Silver", color_hex: "#c0c0c0", price_delta: 0, stock_quantity: 8, low_stock_threshold: 2, is_active: true }
    ],
    images: [
      { id: "img-4", is_primary: true, display_order: 0, alt_text: "Constantine Silver Denarius", width: 600, height: 600, url: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=600&q=80" }
    ],
    avg_rating: 4.8,
    review_count: 9,
    discount_percent: 16
  },
  {
    id: "prod-5",
    category_id: "cat-2",
    name: "1921 USA Morgan Silver Dollar",
    slug: "1921-usa-morgan-silver-dollar",
    sku: "HC-FC-USA-MORG",
    brand: "United States Mint",
    base_price: 18000,
    selling_price: 15500,
    tax_percent: 0,
    weight_grams: 27,
    length_cm: 3.8,
    width_cm: 3.8,
    height_cm: 0.3,
    is_active: true,
    is_featured: true,
    meta_title: "1921 Morgan Silver Dollar | HariomCoins",
    meta_desc: "Classic 1921 Morgan Silver Dollar. 90% silver, iconic American coin.",
    created_at: "2026-07-02T00:00:00Z",
    description: "The iconic Morgan Silver Dollar — minted in 1921 at the Philadelphia Mint. 90% silver content (26.73g fine silver). Features Lady Liberty on the obverse and the American bald eagle on the reverse. One of the most collected American coins worldwide. Excellent luster.",
    short_desc: "Classic 1921 Morgan Silver Dollar. 90% silver, iconic American coin.",
    variants: [
      { id: "var-5", sku: "HC-FC-USA-MORG-AU", size: "About Uncirculated", color: "Silver", color_hex: "#d0d0d0", price_delta: 0, stock_quantity: 6, low_stock_threshold: 2, is_active: true }
    ],
    images: [
      { id: "img-5", is_primary: true, display_order: 0, alt_text: "1921 Morgan Silver Dollar", width: 600, height: 600, url: "https://images.unsplash.com/photo-1622656275587-85591fc5ce14?auto=format&fit=crop&w=600&q=80" }
    ],
    avg_rating: 4.7,
    review_count: 11,
    discount_percent: 13
  },
  {
    id: "prod-6",
    category_id: "cat-2",
    name: "Alexander the Great Silver Drachm — c. 330 BC",
    slug: "alexander-great-silver-drachm",
    sku: "HC-FC-GRK-ALEX",
    brand: "Macedonian Kingdom",
    base_price: 38000,
    selling_price: 32000,
    tax_percent: 0,
    weight_grams: 4,
    length_cm: 1.8,
    width_cm: 1.8,
    height_cm: 0.15,
    is_active: true,
    is_featured: false,
    meta_title: "Alexander the Great Silver Drachm | HariomCoins",
    meta_desc: "Rare ancient Greek silver drachm from Alexander's conquests. c. 330 BC.",
    created_at: "2026-07-01T08:00:00Z",
    description: "Extremely rare silver drachm from the era of Alexander the Great, King of Macedon. Circa 330 BC. Obverse shows Hercules wearing a lion's skin headdress, reverse depicts Zeus seated on a throne. Museum-quality piece with stunning detail for its age.",
    short_desc: "Rare ancient Greek silver drachm. Hercules obverse, Zeus reverse.",
    variants: [
      { id: "var-6", sku: "HC-FC-GRK-ALEX-STD", size: "Fine Grade", color: "Silver", color_hex: "#b0b0b0", price_delta: 0, stock_quantity: 3, low_stock_threshold: 1, is_active: true }
    ],
    images: [
      { id: "img-6", is_primary: true, display_order: 0, alt_text: "Alexander Silver Drachm", width: 600, height: 600, url: "https://images.unsplash.com/photo-1624365169364-0a768bba9dab?auto=format&fit=crop&w=600&q=80" }
    ],
    avg_rating: 4.9,
    review_count: 6,
    discount_percent: 15
  },
  // ======== INDIAN NOTES ========
  {
    id: "prod-7",
    category_id: "cat-3",
    name: "1943 Burma WWII Japanese Invasion 10 Rupees Note",
    slug: "1943-burma-japanese-invasion-note",
    sku: "HC-IN-JIM-10R",
    brand: "Japanese Government",
    base_price: 3500,
    selling_price: 2800,
    tax_percent: 0,
    weight_grams: 1,
    length_cm: 16,
    width_cm: 7.5,
    height_cm: 0.01,
    is_active: true,
    is_featured: true,
    meta_title: "1943 Japanese Invasion 10 Rupees Note | HariomCoins",
    meta_desc: "WWII-era Japanese Invasion Money (JIM) 10 Rupees note used in occupied Burma.",
    created_at: "2026-07-02T08:00:00Z",
    description: "Original World War II-era Japanese Invasion Money (JIM) — a 10 Rupees note issued by the Japanese Government for use in occupied Burma (Myanmar). Circa 1943. Features ornate border designs and bilingual text (English and Japanese). Uncirculated condition with original crispness. A fascinating piece of wartime history.",
    short_desc: "WWII Japanese Invasion Money. 10 Rupees note from occupied Burma, circa 1943.",
    variants: [
      { id: "var-7", sku: "HC-IN-JIM-10R-UNC", size: "Uncirculated", color: "Beige", color_hex: "#f5deb3", price_delta: 0, stock_quantity: 15, low_stock_threshold: 3, is_active: true }
    ],
    images: [
      { id: "img-7", is_primary: true, display_order: 0, alt_text: "1943 Japanese Invasion 10 Rupees", width: 600, height: 400, url: "https://images.unsplash.com/photo-1554672723-b208dc85134f?auto=format&fit=crop&w=600&q=80" }
    ],
    avg_rating: 4.5,
    review_count: 7,
    discount_percent: 20
  },
  {
    id: "prod-8",
    category_id: "cat-3",
    name: "1962 Reserve Bank of India ₹100 Note — PC Bhattacharyya",
    slug: "1962-rbi-100-rupee-note",
    sku: "HC-IN-RBI-100-62",
    brand: "Reserve Bank of India",
    base_price: 8500,
    selling_price: 6500,
    tax_percent: 0,
    weight_grams: 1,
    length_cm: 17.3,
    width_cm: 7.3,
    height_cm: 0.01,
    is_active: true,
    is_featured: true,
    meta_title: "1962 RBI ₹100 Note PC Bhattacharyya | HariomCoins",
    meta_desc: "Rare 1962 Reserve Bank of India 100 Rupee banknote. Dam watermark.",
    created_at: "2026-07-02T14:00:00Z",
    description: "Rare 1962 Reserve Bank of India One Hundred Rupees banknote, signed by Governor P.C. Bhattacharyya. Features the Hirakud Dam watermark and the Ashoka Pillar emblem. Collectible condition with original colors intact. A prized specimen of early post-independence Indian currency.",
    short_desc: "Rare 1962 RBI ₹100 note signed by PC Bhattacharyya. Hirakud Dam watermark.",
    variants: [
      { id: "var-8a", sku: "HC-IN-RBI-100-62-VF", size: "Very Fine", color: "Green", color_hex: "#228b22", price_delta: 0, stock_quantity: 4, low_stock_threshold: 1, is_active: true },
      { id: "var-8b", sku: "HC-IN-RBI-100-62-F", size: "Fine", color: "Green", color_hex: "#228b22", price_delta: -1500, stock_quantity: 8, low_stock_threshold: 2, is_active: true }
    ],
    images: [
      { id: "img-8", is_primary: true, display_order: 0, alt_text: "1962 RBI 100 Rupee Note", width: 600, height: 400, url: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80" }
    ],
    avg_rating: 4.7,
    review_count: 5,
    discount_percent: 23
  },
  {
    id: "prod-9",
    category_id: "cat-3",
    name: "1917 King George V 10 Rupees — Signed H. Denning",
    slug: "1917-george-v-10-rupees-note",
    sku: "HC-IN-GV-10R-17",
    brand: "Government of India",
    base_price: 45000,
    selling_price: 38000,
    tax_percent: 0,
    weight_grams: 1,
    length_cm: 18,
    width_cm: 11,
    height_cm: 0.01,
    is_active: true,
    is_featured: false,
    meta_title: "1917 George V 10 Rupees Note H. Denning | HariomCoins",
    meta_desc: "Extremely rare 1917 British India 10 Rupees banknote signed by H. Denning.",
    created_at: "2026-07-01T18:00:00Z",
    description: "Extremely rare 1917 British India Ten Rupees banknote issued under King George V, signed by Controller of Currency H. Denning. Features ornate Victorian-era watermarks and engraving. Only a handful of surviving examples are known in collectible condition. A museum-worthy piece of Indian monetary history.",
    short_desc: "Extremely rare 1917 British India ₹10 note. Signed H. Denning. Museum-worthy.",
    variants: [
      { id: "var-9", sku: "HC-IN-GV-10R-17-VG", size: "Very Good", color: "Brown", color_hex: "#8b4513", price_delta: 0, stock_quantity: 2, low_stock_threshold: 1, is_active: true }
    ],
    images: [
      { id: "img-9", is_primary: true, display_order: 0, alt_text: "1917 George V 10 Rupees Note", width: 600, height: 400, url: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=600&q=80" }
    ],
    avg_rating: 5.0,
    review_count: 3,
    discount_percent: 15
  },
  // ======== FOREIGN NOTES ========
  {
    id: "prod-10",
    category_id: "cat-4",
    name: "1935 Bank of England £5 White Note — Peppiatt",
    slug: "1935-bank-of-england-5-pound-white-note",
    sku: "HC-FN-BOE-5-35",
    brand: "Bank of England",
    base_price: 55000,
    selling_price: 45000,
    tax_percent: 0,
    weight_grams: 2,
    length_cm: 21,
    width_cm: 12,
    height_cm: 0.01,
    is_active: true,
    is_featured: true,
    meta_title: "1935 Bank of England £5 White Note | HariomCoins",
    meta_desc: "Rare 1935 Bank of England £5 white banknote signed by Peppiatt.",
    created_at: "2026-07-03T00:00:00Z",
    description: "An extremely rare 1935 Bank of England Five Pound 'White Note' signed by Chief Cashier K.O. Peppiatt. Printed on high-quality linen paper with elaborate black-and-white intaglio engraving. Includes Britannia seal. One of the most iconic British banknotes ever produced. Excellent collector condition.",
    short_desc: "Rare 1935 Bank of England £5 white note. Elaborate intaglio engraving.",
    variants: [
      { id: "var-10", sku: "HC-FN-BOE-5-35-VF", size: "Very Fine", color: "White", color_hex: "#fafafa", price_delta: 0, stock_quantity: 2, low_stock_threshold: 1, is_active: true }
    ],
    images: [
      { id: "img-10", is_primary: true, display_order: 0, alt_text: "1935 Bank of England £5 White Note", width: 600, height: 400, url: "https://images.unsplash.com/photo-1553729459-uj7d8b8e756a?auto=format&fit=crop&w=600&q=80" }
    ],
    avg_rating: 4.9,
    review_count: 4,
    discount_percent: 18
  },
  {
    id: "prod-11",
    category_id: "cat-4",
    name: "1914 German Empire 100 Mark Reichsbanknote",
    slug: "1914-german-empire-100-mark-note",
    sku: "HC-FN-GER-100M-14",
    brand: "Reichsbank",
    base_price: 5500,
    selling_price: 4200,
    tax_percent: 0,
    weight_grams: 1,
    length_cm: 17,
    width_cm: 10,
    height_cm: 0.01,
    is_active: true,
    is_featured: false,
    meta_title: "1914 German 100 Mark Reichsbanknote | HariomCoins",
    meta_desc: "Pre-WWI German Empire 100 Mark Reichsbanknote. Exceptional condition.",
    created_at: "2026-07-02T04:00:00Z",
    description: "A pre-World War I German Empire 100 Mark Reichsbanknote, dated 1914. Features the imperial German eagle and ornate guilloche borders. Printed on high-quality rag paper. A fascinating piece of European monetary history from the eve of the Great War. Crisp and well-preserved.",
    short_desc: "Pre-WWI German 100 Mark note. Imperial eagle design, crisp condition.",
    variants: [
      { id: "var-11", sku: "HC-FN-GER-100M-14-AU", size: "About Uncirculated", color: "Blue", color_hex: "#4169e1", price_delta: 0, stock_quantity: 6, low_stock_threshold: 2, is_active: true }
    ],
    images: [
      { id: "img-11", is_primary: true, display_order: 0, alt_text: "1914 German 100 Mark Note", width: 600, height: 400, url: "https://images.unsplash.com/photo-1561414927-6d86591d0c4f?auto=format&fit=crop&w=600&q=80" }
    ],
    avg_rating: 4.5,
    review_count: 8,
    discount_percent: 23
  },
  {
    id: "prod-12",
    category_id: "cat-4",
    name: "1928 USA $2 Red Seal United States Note",
    slug: "1928-usa-2-dollar-red-seal",
    sku: "HC-FN-USA-2D-28",
    brand: "United States Treasury",
    base_price: 12000,
    selling_price: 9800,
    tax_percent: 0,
    weight_grams: 1,
    length_cm: 15.6,
    width_cm: 6.6,
    height_cm: 0.01,
    is_active: true,
    is_featured: true,
    meta_title: "1928 USA $2 Red Seal Note | HariomCoins",
    meta_desc: "Classic 1928 US $2 Red Seal note. Thomas Jefferson portrait. Collectible.",
    created_at: "2026-07-03T04:00:00Z",
    description: "A classic 1928 Series United States $2 Red Seal Legal Tender Note featuring Thomas Jefferson's portrait on the obverse and the Monticello estate on the reverse. Red serial numbers and Treasury seal. Highly sought after by American currency collectors. Crisp and original.",
    short_desc: "1928 US $2 Red Seal note. Thomas Jefferson portrait. Crisp condition.",
    variants: [
      { id: "var-12", sku: "HC-FN-USA-2D-28-VF", size: "Very Fine", color: "Green", color_hex: "#006400", price_delta: 0, stock_quantity: 5, low_stock_threshold: 2, is_active: true }
    ],
    images: [
      { id: "img-12", is_primary: true, display_order: 0, alt_text: "1928 USA $2 Red Seal Note", width: 600, height: 400, url: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=600&q=80" }
    ],
    avg_rating: 4.6,
    review_count: 10,
    discount_percent: 18
  }
];

const toListItem = (p: ProductDetail): ProductListItem => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  brand: p.brand,
  base_price: p.base_price,
  selling_price: p.selling_price,
  is_active: p.is_active,
  is_featured: p.is_featured,
  primary_image: p.images.find(img => img.is_primary) || p.images[0] || null,
  total_stock: p.variants.reduce((acc, v) => acc + v.stock_quantity, 0),
  avg_rating: p.avg_rating,
  review_count: p.review_count,
  discount_percent: p.discount_percent
});

// ---- API Functions ----

export async function getProducts(filters: ProductFilters = {}): Promise<PaginatedProducts> {
  try {
    const { data } = await apiClient.get<PaginatedProducts>("/products", { params: filters });
    return data;
  } catch (error) {
    console.warn("API failed, using fallback mock data", error);
    let items = MOCK_PRODUCTS.map(toListItem);

    if (filters.category_slug) {
      const cat = MOCK_CATEGORIES.find(c => c.slug === filters.category_slug);
      if (cat) {
        items = items.filter(item => {
          const detail = MOCK_PRODUCTS.find(p => p.id === item.id);
          return detail?.category_id === cat.id;
        });
      } else {
        items = [];
      }
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        (item.brand && item.brand.toLowerCase().includes(q))
      );
    }

    if (filters.sort === "price_asc") {
      items.sort((a, b) => a.selling_price - b.selling_price);
    } else if (filters.sort === "price_desc") {
      items.sort((a, b) => b.selling_price - a.selling_price);
    } else {
      // newest
      items.sort((a, b) => {
        const ad = MOCK_PRODUCTS.find(p => p.id === a.id)?.created_at || "";
        const bd = MOCK_PRODUCTS.find(p => p.id === b.id)?.created_at || "";
        return bd.localeCompare(ad);
      });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const total = items.length;
    const pages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total,
      page,
      pages,
      limit
    };
  }
}

export async function getProduct(slug: string): Promise<ProductDetail> {
  try {
    const { data } = await apiClient.get<ProductDetail>(`/products/${slug}`);
    return data;
  } catch (error) {
    console.warn(`API failed for ${slug}, using fallback mock data`, error);
    const detail = MOCK_PRODUCTS.find(p => p.slug === slug);
    if (!detail) {
      throw new Error("Product not found");
    }
    return detail;
  }
}

export async function getFeatured(): Promise<ProductListItem[]> {
  try {
    const { data } = await apiClient.get<ProductListItem[]>("/products/featured");
    return data;
  } catch (error) {
    console.warn("API failed for featured, using fallback mock data", error);
    return MOCK_PRODUCTS.filter(p => p.is_featured).map(toListItem);
  }
}

export async function searchProducts(q: string, page = 1): Promise<PaginatedProducts> {
  try {
    const { data } = await apiClient.get<PaginatedProducts>("/search", { params: { q, page } });
    return data;
  } catch (error) {
    console.warn(`API search failed for "${q}", using fallback mock data`, error);
    return getProducts({ search: q, page });
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const { data } = await apiClient.get<Category[]>("/categories");
    return data;
  } catch (error) {
    console.warn("API failed for categories, using fallback mock data", error);
    return MOCK_CATEGORIES;
  }
}
