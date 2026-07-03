import { apiClient } from "@/api/client";
import type {
  Category,
  PaginatedProducts,
  ProductDetail,
  ProductFilters,
  ProductListItem
} from "@/types/product";

// ---- Fallback Mock Coin Database for Premium Offline/Static Presentation ----
const MOCK_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Ancient Gold & Silver Coins", slug: "ancient-coins", parent_id: null, sort_order: 1, is_active: true, children: [] },
  { id: "cat-2", name: "British India Coins", slug: "british-india", parent_id: null, sort_order: 2, is_active: true, children: [] },
  { id: "cat-3", name: "Republic of India Coins", slug: "republic-india", parent_id: null, sort_order: 3, is_active: true, children: [] },
  { id: "cat-4", name: "Foreign & Global Coins", slug: "foreign-global", parent_id: null, sort_order: 4, is_active: true, children: [] },
  { id: "cat-5", name: "Commemorative Coins", slug: "commemorative-coins", parent_id: null, sort_order: 5, is_active: true, children: [] },
];

const MOCK_PRODUCTS: ProductDetail[] = [
  {
    id: "prod-1",
    category_id: "cat-2",
    name: "1918 George V British India Gold Sovereign",
    slug: "1918-george-v-sovereign",
    sku: "HC-BI-1918-SOV",
    brand: "Royal Mint",
    base_price: 75000,
    selling_price: 68500,
    tax_percent: 18,
    weight_grams: 8,
    length_cm: 2,
    width_cm: 2,
    height_cm: 0.2,
    is_active: true,
    is_featured: true,
    meta_title: "1918 George V British India Gold Sovereign",
    meta_desc: "Rare 1918 Gold Sovereign minted in Bombay during WWI. 22K Gold.",
    created_at: "2026-07-01T00:00:00Z",
    description: "A highly rare and collectible gold sovereign minted in India during World War I under the reign of King George V. Minted at the Bombay Mint and features the distinctive 'I' mintmark. Excellent grade and luster, high gold purity (22 Karat / 91.6%). Ideal for serious collectors and numismatic investors.",
    short_desc: "Highly rare 1918 Gold Sovereign minted in Bombay during WWI. 22K Gold, excellent luster.",
    variants: [
      { id: "var-1", sku: "HC-BI-1918-SOV-STD", size: "Proof Grade", color: "Gold", color_hex: "#ffd700", price_delta: 0, stock_quantity: 10, low_stock_threshold: 2, is_active: true }
    ],
    images: [
      { id: "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80", is_primary: true, display_order: 0, alt_text: "1918 George V Gold Sovereign", width: 600, height: 600, url: "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80" }
    ],
    avg_rating: 4.9,
    review_count: 14,
    discount_percent: 8
  },
  {
    id: "prod-2",
    category_id: "cat-1",
    name: "Ancient Roman Emperor Constantine Silver Coin",
    slug: "roman-constantine-silver",
    sku: "HC-ANC-ROM-CONST",
    brand: "Roman Empire",
    base_price: 15000,
    selling_price: 12500,
    tax_percent: 18,
    weight_grams: 3,
    length_cm: 1.5,
    width_cm: 1.5,
    height_cm: 0.1,
    is_active: true,
    is_featured: true,
    meta_title: "Ancient Roman Emperor Constantine Silver Coin",
    meta_desc: "Authentic silver coin from the era of Constantine the Great. Circa 307-337 AD.",
    created_at: "2026-07-01T00:00:00Z",
    description: "Authentic ancient Roman silver coin featuring the detailed bust of Emperor Constantine the Great (Constantine I). Dated circa 307–337 AD. Reverse shows Roman legionary standards and goddess Victoria. Verified authentic, comes with certificate of authenticity.",
    short_desc: "Authentic silver coin from the era of Constantine the Great. Circa 307-337 AD.",
    variants: [
      { id: "var-2", sku: "HC-ANC-ROM-CONST-STD", size: "Standard Grade", color: "Silver", color_hex: "#c0c0c0", price_delta: 0, stock_quantity: 8, low_stock_threshold: 2, is_active: true }
    ],
    images: [
      { id: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=600&q=80", is_primary: true, display_order: 0, alt_text: "Constantine Silver Coin", width: 600, height: 600, url: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=600&q=80" }
    ],
    avg_rating: 4.8,
    review_count: 9,
    discount_percent: 16
  },
  {
    id: "prod-3",
    category_id: "cat-2",
    name: "1947 Last British India One Rupee Silver Coin",
    slug: "1947-last-rupee-silver",
    sku: "HC-BI-1947-RUPEE",
    brand: "Government of India",
    base_price: 6000,
    selling_price: 4500,
    tax_percent: 18,
    weight_grams: 12,
    length_cm: 3,
    width_cm: 3,
    height_cm: 0.15,
    is_active: true,
    is_featured: false,
    meta_title: "1947 Last British India One Rupee Silver Coin",
    meta_desc: "Historic final silver rupee minted in British India in 1947.",
    created_at: "2026-07-02T00:00:00Z",
    description: "The historic last silver rupee coin minted in British India before independence in August 1947. Minted at the Bombay Mint. Features the profile of King George VI on the obverse and stylized floral carvings on the reverse. High collectible value due to the historic year.",
    short_desc: "Historic final silver rupee minted in British India in 1947. King George VI portrait.",
    variants: [
      { id: "var-3", sku: "HC-BI-1947-RUPEE-STD", size: "Standard Grade", color: "Silver", color_hex: "#c0c0c0", price_delta: 0, stock_quantity: 12, low_stock_threshold: 2, is_active: true }
    ],
    images: [
      { id: "https://images.unsplash.com/photo-1621527710313-0504cf10a26d?auto=format&fit=crop&w=600&q=80", is_primary: true, display_order: 0, alt_text: "1947 Silver Rupee", width: 600, height: 600, url: "https://images.unsplash.com/photo-1621527710313-0504cf10a26d?auto=format&fit=crop&w=600&q=80" }
    ],
    avg_rating: 4.7,
    review_count: 5,
    discount_percent: 25
  },
  {
    id: "prod-4",
    category_id: "cat-5",
    name: "75th Independence Commemorative Gold Proof Coin",
    slug: "75th-independence-gold-proof",
    sku: "HC-COM-75IND-GOLD",
    brand: "India Government Mint",
    base_price: 110000,
    selling_price: 98000,
    tax_percent: 18,
    weight_grams: 10,
    length_cm: 2.5,
    width_cm: 2.5,
    height_cm: 0.2,
    is_active: true,
    is_featured: true,
    meta_title: "75th Independence Commemorative Gold Proof Coin",
    meta_desc: "99.9% Pure Gold Commemorative Proof Coin. Limited edition.",
    created_at: "2026-07-03T00:00:00Z",
    description: "Limited edition proof gold coin released by the India Government Mint to commemorate 75 years of Independence (Azadi Ka Amrit Mahotsav). Struck in 99.9% pure gold. High-relief frosting with a perfect mirror-like background. Includes official wooden velvet presentation box and certificate of authenticity.",
    short_desc: "99.9% Pure Gold Commemorative Proof Coin. Limited edition with velvet presentation box.",
    variants: [
      { id: "var-4", sku: "HC-COM-75IND-GOLD-STD", size: "Proof Grade", color: "Gold", color_hex: "#ffd700", price_delta: 0, stock_quantity: 4, low_stock_threshold: 1, is_active: true }
    ],
    images: [
      { id: "https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&w=600&q=80", is_primary: true, display_order: 0, alt_text: "75th Gold Proof Coin", width: 600, height: 600, url: "https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&w=600&q=80" }
    ],
    avg_rating: 5.0,
    review_count: 8,
    discount_percent: 10
  },
  {
    id: "prod-5",
    category_id: "cat-2",
    name: "1840 Queen Victoria One Rupee Silver Coin",
    slug: "1840-queen-victoria-silver",
    sku: "HC-BI-1840-VIC",
    brand: "East India Company",
    base_price: 12000,
    selling_price: 8900,
    tax_percent: 18,
    weight_grams: 11,
    length_cm: 3,
    width_cm: 3,
    height_cm: 0.15,
    is_active: true,
    is_featured: true,
    meta_title: "1840 Queen Victoria One Rupee Silver Coin",
    meta_desc: "1840 silver rupee coin from early Victorian era.",
    created_at: "2026-07-02T12:00:00Z",
    description: "Superb silver rupee coin from the early reign of Queen Victoria, issued by the East India Company in 1840. Divided legend type with excellent detail in Victoria's young portrait. 0.917 Silver purity. Highly prized by history and colonial coin collectors.",
    short_desc: "1840 silver rupee coin from early Victorian era. Divided legend type.",
    variants: [
      { id: "var-5", sku: "HC-BI-1840-VIC-STD", size: "Standard Grade", color: "Silver", color_hex: "#c0c0c0", price_delta: 0, stock_quantity: 7, low_stock_threshold: 2, is_active: true }
    ],
    images: [
      { id: "https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&w=600&q=80", is_primary: true, display_order: 0, alt_text: "1840 Queen Victoria Rupee", width: 600, height: 600, url: "https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&w=600&q=80" }
    ],
    avg_rating: 4.6,
    review_count: 12,
    discount_percent: 25
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
    console.warn("API failed, using fallback mock coin data", error);
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
    console.warn(`API failed for ${slug}, using fallback mock coin detail`, error);
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
    console.warn("API failed for featured, using fallback mock coin data", error);
    return MOCK_PRODUCTS.filter(p => p.is_featured).map(toListItem);
  }
}

export async function searchProducts(q: string, page = 1): Promise<PaginatedProducts> {
  try {
    const { data } = await apiClient.get<PaginatedProducts>("/search", { params: { q, page } });
    return data;
  } catch (error) {
    console.warn(`API failed for search query "${q}", using fallback mock coin data`, error);
    return getProducts({ search: q, page });
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const { data } = await apiClient.get<Category[]>("/categories");
    return data;
  } catch (error) {
    console.warn("API failed for categories, using fallback mock coin data", error);
    return MOCK_CATEGORIES;
  }
}
