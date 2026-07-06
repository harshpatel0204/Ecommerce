import { useState, useEffect } from "react";
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Tag,
  ChevronRight,
  ShieldCheck,
  Truck,
  Award,
  Lock,
  ChevronLeft,
  Star,
  Users,
  Search,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories, useFeatured } from "@/hooks/useProducts";


const CAROUSEL_SLIDES = [
  {
    badge: "⭐ ROYAL COIN COLLECTION",
    title: "Gold Sovereigns & Historic Coins",
    description: "Discover genuine gold sovereigns and ancient dynasty coinage. Each piece holds centuries of history, graded and certified by global authorities.",
    bgClass: "from-amber-950 via-slate-900 to-amber-950/80",
    buttonText: "Explore Sovereign Coins",
    link: "/products?search=Sovereign",
    emoji: "🪙",
    stat: "100% Genuine Gold",
    accentColor: "text-amber-400 border-amber-400/30 bg-amber-400/10"
  },
  {
    badge: "👑 BRITISH INDIA NUMISMATICS",
    title: "Silver Rupees of the Empire",
    description: "Explore the rare silver coins of British India. Exquisite craftsmanship from the times of Queen Victoria, Edward VII, and King George V.",
    bgClass: "from-indigo-950 via-slate-900 to-indigo-950/80",
    buttonText: "Browse Silver Rupees",
    link: "/products?category_slug=indian-coins",
    emoji: "👑",
    stat: "Silver & Copper Classics",
    accentColor: "text-indigo-400 border-indigo-400/30 bg-indigo-400/10"
  },
  {
    badge: "💵 RARE PAPER CURRENCY",
    title: "Historic Banknotes & Bills",
    description: "Collectible banknotes from the Reserve Bank of India and rare foreign notes. Perfect condition graded currency for serious numismatists.",
    bgClass: "from-emerald-950 via-slate-900 to-emerald-950/80",
    buttonText: "Browse Rare Notes",
    link: "/products?category_slug=world-banknotes",
    emoji: "💵",
    stat: "RBI & Global Rare Paper",
    accentColor: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
  }
];

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: "100% Lifetime Authenticity",
    desc: "Every item is expert-verified with a lifetime money-back guarantee.",
    colorClass: "text-amber-500 bg-amber-50 dark:bg-amber-950/20"
  },
  {
    icon: Truck,
    title: "Insured Express Delivery",
    desc: "Shipped in secured tamper-proof packaging via insured express courier.",
    colorClass: "text-blue-500 bg-blue-50 dark:bg-blue-950/20"
  },
  {
    icon: Award,
    title: "Grading Certificates",
    desc: "Detailed report of historic grade, origin, and weight dimensions.",
    colorClass: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
  },
  {
    icon: Lock,
    title: "Encrypted Secure Payment",
    desc: "Safe and instant payments powered by industry-grade encryption.",
    colorClass: "text-purple-500 bg-purple-50 dark:bg-purple-950/20"
  }
];

const TESTIMONIALS = [
  {
    name: "Dr. Aditya Sen",
    role: "Collector for 14 Years",
    rating: 5,
    comment: "The quality of service and accuracy of grading at HariomCoins is unmatched. I secured a 1918 Sovereign Gold coin in stellar condition. Delivery was fully insured and fast.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100"
  },
  {
    name: "Rajesh K. Verma",
    role: "Numismatic Society Member",
    rating: 5,
    comment: "Finding authentic RBI bank notes from the 1960s with Governor signatures is extremely hard. HariomCoins has become my go-to store. Highly recommended.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100"
  },
  {
    name: "Milind Deshmukh",
    role: "Ancient Coin Hobbyist",
    rating: 5,
    comment: "Excellent customer service and transparent pricing. The product images match the exact coin received. Will definitely purchase more historic gold coins.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100"
  }
];

const CATEGORY_THEMES: Record<string, { icon: any; gradient: string; border: string; desc: string }> = {
  "indian-coins": {
    icon: Sparkles,
    gradient: "from-amber-500/10 to-yellow-600/10 dark:from-amber-500/5 dark:to-yellow-600/5",
    border: "border-amber-500/20 group-hover:border-amber-500/50",
    desc: "Ancient, Mughal, and Princely States"
  },
  "world-banknotes": {
    icon: Tag,
    gradient: "from-emerald-500/10 to-teal-600/10 dark:from-emerald-500/5 dark:to-teal-600/5",
    border: "border-emerald-500/20 group-hover:border-emerald-500/50",
    desc: "RBI issues, emergency money, world bills"
  },
  "default": {
    icon: TrendingUp,
    gradient: "from-purple-500/10 to-pink-600/10 dark:from-purple-500/5 dark:to-pink-600/5",
    border: "border-purple-500/20 group-hover:border-purple-500/50",
    desc: "Curated historical collectibles"
  }
};

export default function Home() {
  const { data: featured, isLoading } = useFeatured();
  const { data: categories } = useCategories();
  const navigate = useNavigate();

  // Carousel State
  const [activeSlide, setActiveSlide] = useState(0);

  // Countdown State (Deal of the week)
  const [timeLeft, setTimeLeft] = useState({ hours: 17, minutes: 42, seconds: 15 });

  // Testimonials State
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Tab Filtering State
  const [activeTab, setActiveTab] = useState("all");

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");

  // Slide Auto-play Effect
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, []);

  // Countdown timer loop (48 hours loop)
  useEffect(() => {
    let totalSeconds = 17 * 3600 + 42 * 60 + 15;
    const timer = setInterval(() => {
      if (totalSeconds <= 0) {
        totalSeconds = 48 * 3600;
      } else {
        totalSeconds--;
      }
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      setTimeLeft({ hours: h, minutes: m, seconds: s });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Filter products by tab
  const getFilteredProducts = () => {
    if (!featured) return [];
    if (activeTab === "all") return featured;
    if (activeTab === "coins") {
      return featured.filter((p) => p.slug.includes("coin") || p.brand?.toLowerCase().includes("coin"));
    }
    if (activeTab === "notes") {
      return featured.filter((p) => p.slug.includes("note") || p.brand?.toLowerCase().includes("note"));
    }
    return featured;
  };

  return (
    <div className="space-y-16 pb-16 bg-mesh">
      {/* 1. Hero Section: Auto-playing Carousel */}
      <section className="relative h-[560px] md:h-[620px] w-full overflow-hidden rounded-b-[2.5rem] shadow-xl">
        {CAROUSEL_SLIDES.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-gradient-to-r ${slide.bgClass} flex items-center transition-all duration-1000 ease-in-out ${
              activeSlide === index ? "opacity-100 translate-x-0 scale-100 z-10" : "opacity-0 translate-x-12 scale-95 -z-10"
            }`}
          >
            {/* Background elements */}
            <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />

            <div className="container mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-8 items-center h-full pt-10">
              {/* Content */}
              <div className="space-y-6 text-white text-left max-w-xl">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider ${slide.accentColor}`}>
                  <Sparkles className="h-3.5 w-3.5" />
                  {slide.badge}
                </span>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight font-display tracking-tight text-white drop-shadow-md">
                  {slide.title}
                </h1>

                <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-lg">
                  {slide.description}
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Link
                    to={slide.link}
                    className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-primary text-white font-semibold hover:bg-primary/95 transition-all shadow-glow hover:shadow-lg hover:-translate-y-0.5"
                  >
                    {slide.buttonText} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-sm font-medium">
                    <span className="text-xl">{slide.emoji}</span> {slide.stat}
                  </div>
                </div>
              </div>

              {/* Graphic Representation */}
              <div className="hidden md:flex justify-center relative">
                <div className="w-80 h-80 rounded-full bg-gradient-to-tr from-white/10 to-white/5 border border-white/10 shadow-2xl flex items-center justify-center relative animate-float">
                  <div className="absolute inset-4 rounded-full bg-slate-900/90 flex flex-col items-center justify-center text-center p-6 border border-white/5">
                    <div className="text-[6.5rem] mb-3 leading-none filter drop-shadow-[0_8px_16px_rgba(245,158,11,0.3)]">{slide.emoji}</div>
                    <span className="text-gradient-gold text-lg font-bold tracking-widest font-display">HARIOM COINS</span>
                    <span className="text-xs text-gray-400 tracking-wider mt-1 uppercase">ESTD 2012</span>
                  </div>
                </div>
                {/* Float badges */}
                <div className="absolute top-10 -right-6 px-4.5 py-2.5 rounded-2xl bg-white dark:bg-gray-900 shadow-card border border-border text-xs font-bold text-foreground">
                  ⭐ Museum Quality Grades
                </div>
                <div className="absolute bottom-10 -left-6 px-4.5 py-2.5 rounded-2xl bg-white dark:bg-gray-900 shadow-card border border-border text-xs font-bold text-foreground">
                  🛡️ Securely Vaulted
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
          {CAROUSEL_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                activeSlide === i ? "w-8 bg-primary" : "w-2.5 bg-white/40 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Left/Right buttons */}
        <button
          onClick={() => setActiveSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-slate-900/20 backdrop-blur-md hover:bg-slate-900/40 text-white border border-white/10 flex items-center justify-center z-20 transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => setActiveSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-slate-900/20 backdrop-blur-md hover:bg-slate-900/40 text-white border border-white/10 flex items-center justify-center z-20 transition-all"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </section>

      {/* Live Search Banner */}
      <section className="container mx-auto px-4 -mt-24 relative z-30">
        <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto bg-white dark:bg-gray-950 rounded-2xl md:rounded-3xl p-3 shadow-2xl border border-border/80 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-3 px-3">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search vintage coins, gold sovereigns, historic notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground placeholder-muted-foreground text-sm py-2"
            />
          </div>
          <button type="submit" className="h-12 px-8 rounded-xl bg-primary text-white font-semibold hover:bg-primary/95 shadow-md flex items-center justify-center gap-2">
            Search Catalog
          </button>
        </form>
      </section>

      {/* 2. Visual Category Grid */}
      {categories && categories.length > 0 && (
        <section className="container mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold text-primary tracking-widest uppercase">Explore History</span>
            <h2 className="text-3xl font-extrabold text-foreground mt-1">Shop by Historical Era</h2>
            <p className="text-muted-foreground text-sm mt-2">Discover curated collectibles categorized by region, era, and vintage value.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {categories.map((c) => {
              const slugKey = c.slug === "indian-coins" || c.slug === "world-banknotes" ? c.slug : "default";
              const theme = CATEGORY_THEMES[slugKey];
              const IconComp = theme.icon;

              return (
                <Link
                  key={c.id}
                  to={`/products?category_slug=${c.slug}`}
                  className="group relative rounded-2xl border border-border/60 bg-white dark:bg-gray-950 p-6 flex items-start gap-4 transition-all duration-300 hover:shadow-xl hover:border-primary/45 hover:-translate-y-1"
                >
                  {/* Decorative background accent */}
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br rounded-bl-[4rem] opacity-20 transition-all group-hover:scale-110 ${theme.gradient}`} />

                  {/* Icon */}
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center border border-border shadow-sm flex-shrink-0 ${theme.gradient} transition-transform duration-300 group-hover:scale-110`}>
                    <IconComp className="h-6 w-6 text-primary" />
                  </div>

                  {/* Text details */}
                  <div className="space-y-1 relative z-10">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                      {c.name}
                      <ChevronRight className="h-4 w-4 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-primary" />
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {theme.desc}
                    </p>
                    <span className="inline-block text-xs font-semibold text-primary pt-2.5">
                      View Collection &rarr;
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Limited-Time Deal of the Week (Urgency Banner) */}
      <section className="container mx-auto px-4">
        <div className="relative rounded-3xl bg-slate-900 border border-slate-800 text-white overflow-hidden shadow-2xl p-8 sm:p-12 max-w-5xl mx-auto">
          {/* Background visuals */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400 via-transparent to-transparent" />
          <div className="absolute left-10 bottom-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />

          <div className="grid md:grid-cols-5 gap-8 items-center">
            {/* Promo text & Countdown */}
            <div className="md:col-span-3 space-y-6">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider">
                ⚡ DEAL OF THE WEEK
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display leading-tight">
                Get the <span className="text-gradient-gold">1918 George V Gold Sovereign</span> at 15% Off
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                An exceptional British-Indian mint gold sovereign coin. Features the iconic St. George slaying the dragon design. Certified 22ct authentic gold.
              </p>

              {/* Countdown timer */}
              <div className="space-y-2">
                <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Offer Ending In:</span>
                <div className="flex items-center gap-2 sm:gap-3">
                  {[
                    { label: "Hours", val: timeLeft.hours },
                    { label: "Mins", val: timeLeft.minutes },
                    { label: "Secs", val: timeLeft.seconds },
                  ].map((unit, idx) => (
                    <div key={unit.label} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl sm:text-2xl font-black text-amber-400 shadow-inner">
                          {unit.val.toString().padStart(2, "0")}
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">{unit.label}</span>
                      </div>
                      {idx < 2 && (
                        <span className="text-xl sm:text-2xl font-bold text-slate-700 px-1 sm:px-1.5 mb-5">:</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Product card shortcut & CTA */}
            <div className="md:col-span-2 flex flex-col items-center sm:items-stretch bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-center sm:text-left space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">HC-IN-GS-1918</span>
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md text-[10px] font-extrabold uppercase">Save 15%</span>
              </div>
              <h3 className="font-bold text-white text-base">1918 George V Gold Sovereign Coin</h3>
              <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                <span className="text-2xl font-black text-amber-400">₹83,300</span>
                <span className="text-xs text-gray-500 line-through">₹98,000</span>
              </div>
              <Link
                to="/products?search=Sovereign"
                className="w-full h-11 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                Claim Deal Now <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Products Section (with Tab Filters) */}
      <section className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 max-w-5xl mx-auto">
          <div>
            <span className="text-xs font-bold text-primary tracking-widest uppercase">Featured Catalog</span>
            <h2 className="text-3xl font-extrabold text-foreground mt-1">Numismatist Favorites</h2>
            <p className="text-muted-foreground text-sm mt-1">Our most popular and highly rated coins, certified authentic.</p>
          </div>

          {/* Filtering Tabs */}
          <div className="flex bg-white dark:bg-gray-950 border border-border p-1 rounded-xl shadow-sm self-start">
            {[
              { id: "all", label: "Show All" },
              { id: "coins", label: "Rare Coins" },
              { id: "notes", label: "Banknotes" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4.5 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border bg-white dark:bg-gray-950" style={{ animationDelay: `${i * 0.05}s` }}>
                  <Skeleton className="aspect-square w-full shimmer" />
                  <div className="p-3.5 space-y-2">
                    <Skeleton className="h-3 w-16 shimmer" />
                    <Skeleton className="h-4 w-full shimmer" />
                    <Skeleton className="h-5 w-20 shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : getFilteredProducts().length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {getFilteredProducts().map((p, i) => (
                <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-3xl bg-white dark:bg-gray-950">
              <div className="text-4xl mb-3">🪙</div>
              <p className="text-sm font-semibold">No items match this category.</p>
              <p className="text-xs text-muted-foreground mt-0.5">Please check our other collections!</p>
            </div>
          )}
        </div>
      </section>

      {/* 5. Trust / Value Propositions Badges */}
      <section className="bg-white dark:bg-gray-950/40 border-y border-border py-14">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {TRUST_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex flex-col items-center text-center space-y-3 p-2 group">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner ${item.colorClass} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Testimonials Carousel */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">TESTIMONIALS</span>
          <h2 className="text-3xl font-extrabold text-foreground mt-1">Trusted by Collectors</h2>
        </div>

        <div className="relative bg-white dark:bg-gray-950 border border-border p-8 sm:p-10 rounded-3xl shadow-xl flex flex-col md:flex-row gap-8 items-center">
          {/* Quote mark decoration */}
          <div className="absolute top-6 left-6 text-7xl font-serif text-slate-100 dark:text-slate-900 select-none z-0 pointer-events-none">“</div>

          {/* Review Avatar & Rating */}
          <div className="flex-shrink-0 flex flex-col items-center text-center space-y-3 relative z-10">
            <img
              src={TESTIMONIALS[activeTestimonial].avatar}
              alt={TESTIMONIALS[activeTestimonial].name}
              className="w-20 h-20 rounded-full border-4 border-primary/20 object-cover shadow-md"
            />
            <div>
              <h4 className="font-bold text-sm text-foreground">{TESTIMONIALS[activeTestimonial].name}</h4>
              <p className="text-[11px] text-muted-foreground">{TESTIMONIALS[activeTestimonial].role}</p>
            </div>
            <div className="flex items-center gap-0.5 justify-center">
              {Array.from({ length: TESTIMONIALS[activeTestimonial].rating }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </div>

          {/* Testimonial comments */}
          <div className="flex-1 text-center md:text-left space-y-4 relative z-10">
            <p className="text-base font-medium italic text-foreground leading-relaxed">
              "{TESTIMONIALS[activeTestimonial].comment}"
            </p>
            <div className="flex items-center gap-1.5 justify-center md:justify-start text-xs text-primary font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Verified Purchase
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-6 right-8 flex items-center gap-2">
            <button
              onClick={() => setActiveTestimonial((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
              className="h-9 w-9 rounded-full bg-muted hover:bg-primary hover:text-white transition-all border border-border flex items-center justify-center text-muted-foreground"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length)}
              className="h-9 w-9 rounded-full bg-muted hover:bg-primary hover:text-white transition-all border border-border flex items-center justify-center text-muted-foreground"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 7. Promotional Signup / Footer Call to Action */}
      <section className="container mx-auto px-4 max-w-5xl">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-600 to-orange-600 p-8 sm:p-12 shadow-2xl text-white">
          <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative max-w-2xl mx-auto text-center space-y-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 rounded-full border border-white/20 text-[10px] font-extrabold uppercase tracking-wider">
              <Users className="h-3.5 w-3.5" /> JOIN THE COLLECTOR'S CLUB
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display">Get 10% Off Your First Order</h2>
            <p className="opacity-90 text-sm leading-relaxed max-w-lg mx-auto">
              Subscribe to get exclusive access to newly cataloged rare coins, historic banknotes releases, and collector discount codes.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Thank you for joining our VIP Collectors newsletter!");
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2"
            >
              <input
                type="email"
                placeholder="Enter your email address"
                required
                className="flex-1 h-12 px-4 rounded-xl text-slate-900 border-0 focus:ring-2 focus:ring-amber-300 font-medium placeholder-slate-400 text-sm"
              />
              <button
                type="submit"
                className="h-12 px-8 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-sm transition-all shadow-md hover:-translate-y-0.5"
              >
                Join VIP Club
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

