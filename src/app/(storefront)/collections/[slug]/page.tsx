import ProductCard from "@/components/shared/ProductCard";
import Pagination from "@/components/shared/Pagination";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActiveFlashSales, applyFlashToProductList } from "@/lib/flash-sale";
import {
  getCachedFilteredProducts,
  getCachedCollectionBySlug,
  getCachedCategoryTree,
  getCachedNavigationTree,
} from "@/lib/cache";
import { ChevronRight } from "lucide-react";
import InteractiveCategoryShowcase, {
  type SectionGroup,
  type VarietyItem,
} from "@/components/shared/InteractiveCategoryShowcase";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCachedCollectionBySlug(slug);
  if (!collection) return {};

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://myrashoppingmall.com";
  const cleanDescription =
    collection.description?.replace(/<[^>]*>?/gm, "") ||
    `Shop the ${collection.name} collection at Myra Shopping Mall.`;

  return {
    title: `${collection.name} | Myra Shopping Mall`,
    description: cleanDescription,
    alternates: { canonical: `${appUrl}/collections/${collection.slug}` },
    openGraph: {
      title: `${collection.name} | Myra Shopping Mall`,
      description: cleanDescription,
      type: "website",
      images: collection.image ? [{ url: collection.image }] : undefined,
    },
  };
}

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const { prisma } = await import("@/lib/db/prisma");
    const cols = await prisma.collection.findMany({
      select: { slug: true },
      take: 20,
    });
    return cols.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

// ─── Helper: flatten a category tree node into all descendant IDs ────────────
function flattenIds(node: {
  id: string;
  children?: { id: string; children?: { id: string }[] }[];
}): string[] {
  const ids: string[] = [node.id];
  for (const child of node.children ?? []) {
    ids.push(child.id);
    for (const gc of child.children ?? []) ids.push(gc.id);
  }
  return ids;
}

// Extract slug from a /collections/<slug> href
function hrefToSlug(href: string): string {
  return href.replace(/^\/collections\//, "").split("?")[0];
}

// ─── Types ────────────────────────────────────────────────────────────────────
type GrandchildEntry = { id: string; name: string; slug: string };
type ChildEntry = { id: string; name: string; slug: string; children: GrandchildEntry[] };
type TopLevelEntry = { id: string; name: string; slug: string; children: ChildEntry[] };

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    stock?: string;
    priceRange?: string;
    discount?: string;
    rating?: string;
    // category = top-level collection slug to scope within new-arrivals/best-sellers
    category?: string;
    // subcat = child/grandchild collection slug for finer scoping
    subcat?: string;
  }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const currentPage = Math.max(1, parseInt(sp.page || "1", 10));
  const ITEMS_PER_PAGE = 12;

  const sort = sp.sort || "newest";
  const stock = sp.stock || "all";
  const priceRange = sp.priceRange || "all";
  const discount = sp.discount || "all";
  const rating = sp.rating || "all";
  const categoryParam = sp.category || "all"; // top-level category slug filter
  const subcatParam = sp.subcat || "all";     // sub/grandchild category slug filter

  const specialFilter =
    slug === "best-sellers"
      ? "best-sellers"
      : slug === "new-arrivals"
      ? "new-arrivals"
      : undefined;

  const isSpecialCollection = !!specialFilter;

  // ── Parallel fetches ──────────────────────────────────────────────────────
  // getCachedNavigationTree → same cache hit as the layout (1-year cache, already warm).
  // getCachedCategoryTree   → only used for ID resolution, also 1-year cached.
  const [collection, navTree, categoryTree] = await Promise.all([
    getCachedCollectionBySlug(slug),
    isSpecialCollection ? getCachedNavigationTree() : Promise.resolve(null),
    isSpecialCollection ? getCachedCategoryTree() : Promise.resolve([] as TopLevelEntry[]),
  ]);

  // Filter navTree to only real collection pages (skip special /collections?sort=... items)
  const navCategories = (navTree ?? []).filter(
    (item: any) => item.href?.startsWith("/collections/")
  );

  if (!collection) notFound();

  const isMainCategory = !collection.parentId;

  // ── Resolve which collection IDs to query ─────────────────────────────────
  const directChildren = (collection.children as any[]) || [];
  const directChildIds = directChildren.map((c) => c.id);
  const grandchildIds = directChildren.flatMap(
    (c) => c.children?.map((gc: any) => gc.id) || []
  );
  const targetCollectionIds = isMainCategory
    ? [collection.id, ...directChildIds, ...grandchildIds]
    : [collection.id, ...directChildIds];

  // ── For special pages: resolve category/subcat filter → collection IDs ─────
  // We look up the slug in the categoryTree (which has IDs) using the
  // category/subcat params derived from navTree hrefs.
  let categoryIds: string[] | null = null;
  let activeCategoryNode: TopLevelEntry | null = null;
  let activeNavItem: any = null; // nav-tree entry for the active top-level category

  if (isSpecialCollection && categoryTree.length > 0) {
    if (subcatParam !== "all") {
      // Find subcat slug anywhere in the tree
      for (const top of categoryTree) {
        for (const child of top.children) {
          if (child.slug === subcatParam) {
            categoryIds = flattenIds(child);
            activeCategoryNode = top;
            break;
          }
          for (const gc of child.children) {
            if (gc.slug === subcatParam) {
              categoryIds = [gc.id];
              activeCategoryNode = top;
              break;
            }
          }
          if (categoryIds) break;
        }
        if (categoryIds) break;
      }
      // Also find the matching navTree entry for display
      activeNavItem = navCategories.find(
        (n: any) => hrefToSlug(n.href) === (activeCategoryNode?.slug ?? "")
      );
    } else if (categoryParam !== "all") {
      const topNode = categoryTree.find((t) => t.slug === categoryParam);
      if (topNode) {
        categoryIds = flattenIds(topNode);
        activeCategoryNode = topNode;
      }
      activeNavItem = navCategories.find(
        (n: any) => hrefToSlug(n.href) === categoryParam
      );
    }
  }

  // ── Main data fetch (short-cached, varies per filter combination) ──────────
  const [{ products, totalProducts }, flashSales] = await Promise.all([
    getCachedFilteredProducts(
      targetCollectionIds,
      stock,
      priceRange,
      sort,
      currentPage,
      ITEMS_PER_PAGE,
      specialFilter,
      discount,
      rating,
      categoryIds
    ),
    getActiveFlashSales(),
  ]);

  const productsWithReviews = applyFlashToProductList(products, flashSales).map(
    ({ reviews, ...product }) => {
      const reviewCount = reviews?.length || 0;
      const averageRating =
        reviewCount > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
          : 0;
      return { ...product, reviewCount, averageRating };
    }
  );

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  // Build base URL preserving all active params except page
  const buildUrl = (overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    const merged = {
      sort, stock, priceRange, discount, rating, category: categoryParam, subcat: subcatParam,
      ...overrides,
    };
    if (merged.sort !== "newest") params.set("sort", merged.sort);
    if (merged.stock !== "all") params.set("stock", merged.stock);
    if (merged.priceRange !== "all") params.set("priceRange", merged.priceRange);
    if (merged.discount !== "all") params.set("discount", merged.discount);
    if (merged.rating !== "all") params.set("rating", merged.rating);
    if (merged.category !== "all") params.set("category", merged.category);
    if (merged.subcat !== "all") params.set("subcat", merged.subcat);
    const qs = params.toString();
    return `/collections/${slug}${qs ? `?${qs}` : ""}`;
  };

  const baseUrl = buildUrl({});

  // ── Banners ───────────────────────────────────────────────────────────────
  const DEFAULT_BANNERS: Record<string, string> = {
    women: "/displaypics/women-banner.jpg",
    sarees: "/displaypics/sarees-banner.jpg",
    bridal: "/displaypics/bridal-banner.jpg",
    kids: "/displaypics/kids-banner.jpg",
  };
  const defaultBanner =
    DEFAULT_BANNERS[slug.toLowerCase()] ||
    (collection.parent ? DEFAULT_BANNERS[collection.parent.slug.toLowerCase()] : undefined);

  const allBanners =
    collection.banners && collection.banners.length > 0
      ? collection.banners
      : collection.image
      ? [collection.image]
      : defaultBanner
      ? [defaultBanner]
      : [];

  // ── Subcategory pill data (for normal collection pages) ───────────────────
  const mainCategorySlug = isMainCategory ? collection.slug : collection.parent?.slug;
  const mainCategoryName = isMainCategory ? collection.name : collection.parent?.name;
  const subcategoryList = isMainCategory
    ? collection.children
    : collection.parent?.children || [];

  // ── 3-tier hierarchy for InteractiveCategoryShowcase ─────────────────────
  const validChildren = directChildren.filter(
    (c) => c.showInNav !== false || (c.children && c.children.length > 0)
  );
  const hasNestedStructure = validChildren.some(
    (sec) => sec.children && sec.children.length > 0
  );

  const formattedSections: SectionGroup[] = hasNestedStructure
    ? validChildren
        .filter((sec) => sec.children && sec.children.length > 0)
        .map((sec) => ({
          id: sec.id,
          name: sec.name,
          slug: sec.slug,
          image: sec.image,
          sampleImage: sec.products?.[0]?.images?.[0] || null,
          productCount: sec._count?.products || 0,
          varieties: (sec.children || []).map((v: any) => ({
            id: v.id,
            name: v.name,
            slug: v.slug,
            image: v.image,
            sampleImage: v.products?.[0]?.images?.[0] || null,
            productCount: v._count?.products || 0,
            sectionName: sec.name,
            sectionSlug: sec.slug,
          })),
        }))
    : [];

  const flatVarietiesFallback: VarietyItem[] = !hasNestedStructure
    ? validChildren.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        image: child.image,
        sampleImage: child.products?.[0]?.images?.[0] || null,
        productCount: child._count?.products || 0,
        sectionName: collection.name,
        sectionSlug: collection.slug,
      }))
    : [];

  // ── Which subcategory is expanded in the category strip? ──────────────────
  // When user picks a top-level category, show its children as sub-pills.
  // Determine the "expanded" top node to show children for.
  const expandedTop = activeCategoryNode ?? null;

  return (
    <div className="w-full bg-white min-h-screen">

      {/* 1. Breadcrumb */}
      <div className="border-b border-[#7A0B2E]/15 bg-[#F5EFE6]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-xs font-serif lowercase text-gray-500">
            <Link href="/" className="hover:text-[#7A0B2E] transition-colors">home</Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            {collection.parent && (
              <>
                <Link
                  href={`/collections/${collection.parent.slug}`}
                  className="hover:text-[#7A0B2E] transition-colors"
                >
                  {collection.parent.name.toLowerCase()}
                </Link>
                <ChevronRight className="w-3 h-3 text-gray-400" />
              </>
            )}
            <span className="text-[#2D1F2F] font-semibold">{collection.name.toLowerCase()}</span>
            {activeCategoryNode && (
              <>
                <ChevronRight className="w-3 h-3 text-gray-400" />
                <span className="text-[#7A0B2E] font-semibold">
                  {subcatParam !== "all"
                    ? subcatParam.replace(/-/g, " ")
                    : activeCategoryNode.name.toLowerCase()}
                </span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* 2. Hero Banner */}
      {allBanners.length > 0 ? (
        <div className="w-full">
          <div className="relative w-full h-[260px] sm:h-[380px] md:h-[460px] lg:h-[520px] bg-[#111111] overflow-hidden">
            <Image
              src={allBanners[0]}
              alt={collection.name}
              fill
              priority
              sizes="100vw"
              quality={100}
              unoptimized={allBanners[0].startsWith("http")}
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-center pb-8 sm:pb-12 md:pb-16">
              <div className="text-center px-4 max-w-3xl">
                <span className="text-[10px] sm:text-xs text-[#F3E8E8] uppercase tracking-[0.25em] font-bold block mb-2 drop-shadow">
                  {isSpecialCollection
                    ? "Curated Collection"
                    : isMainCategory
                    ? "Exclusive Collection"
                    : `Category / ${collection.parent?.name || "Collection"}`}
                </span>
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif text-white tracking-tight drop-shadow-md capitalize">
                  {collection.name}
                  {activeCategoryNode && categoryParam !== "all" && (
                    <span className="text-[#C3A29B]"> · {activeCategoryNode.name}</span>
                  )}
                </h1>
                {collection.description && (
                  <p className="text-xs sm:text-sm md:text-base text-gray-200 mt-2 font-serif max-w-xl mx-auto drop-shadow leading-relaxed">
                    {collection.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {allBanners.length > 1 && (
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-20">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {allBanners.slice(1).map((bannerUrl, idx) => (
                  <div
                    key={idx}
                    className="relative h-40 sm:h-48 md:h-56 rounded-none overflow-hidden border border-[#7A0B2E]/30 shadow-md group"
                  >
                    <Image
                      src={bannerUrl}
                      alt={`${collection.name} promo banner ${idx + 1}`}
                      fill
                      quality={95}
                      unoptimized={bannerUrl.startsWith("http")}
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border-b border-[#7A0B2E]/15 bg-[#F5EFE6] py-10 md:py-16">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 text-center">
            <span className="text-[10px] text-[#7A0B2E] uppercase tracking-[0.2em] font-bold block mb-1">
              {isSpecialCollection
                ? "Curated Collection"
                : isMainCategory
                ? "Collection"
                : `Category / ${collection.parent?.name || ""}`}
            </span>
            <h1 className="text-3xl md:text-5xl font-serif text-[#333333] tracking-tight capitalize">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="text-xs md:text-sm text-gray-500 max-w-xl mx-auto mt-2.5 font-serif">
                {collection.description}
              </p>
            )}
            <div className="w-16 h-0.5 bg-[#7A0B2E]/40 mx-auto mt-4" />
          </div>
        </div>
      )}

      {/* 3. ── CATEGORY FILTER STRIP (New Arrivals / Best Sellers only) ──────
           Fully server-rendered. Zero JS. Each chip is a plain <Link>.
           Shows exactly the same categories as the "/" navbar (getCachedNavigationTree,
           filtered to real /collections/* hrefs). Clicking scopes products via
           ?category=<slug> / ?subcat=<slug> — resolved to collection IDs server-side.
      */}
      {isSpecialCollection && navCategories.length > 0 && (
        <div className="bg-[#EBDCD9] border-b border-[#C3A29B]/50">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">

            {/* Row 1: Top-level nav categories (same as navbar) */}
            <div
              className="flex items-center gap-2 overflow-x-auto scrollbar-none py-3"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {/* "All" chip */}
              <Link
                href={buildUrl({ category: "all", subcat: "all", page: "1" })}
                scroll={false}
                className={`inline-flex items-center px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 border transition-all duration-150 ${
                  categoryParam === "all"
                    ? "bg-[#7A0B2E] text-white border-[#7A0B2E] shadow-sm"
                    : "bg-white/70 text-[#2D1F2F] border-[#C3A29B]/60 hover:bg-white hover:border-[#7A0B2E]/50"
                }`}
              >
                All
              </Link>

              {navCategories.map((navItem: any) => {
                const catSlug = hrefToSlug(navItem.href);
                const isActive = categoryParam === catSlug && subcatParam === "all";
                const hasChildren =
                  (navItem.children && navItem.children.length > 0) ||
                  (navItem.sections && navItem.sections.length > 0);
                return (
                  <Link
                    key={navItem.href}
                    href={buildUrl({ category: catSlug, subcat: "all", page: "1" })}
                    scroll={false}
                    className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 border transition-all duration-150 font-serif ${
                      isActive
                        ? "bg-[#7A0B2E] text-white border-[#7A0B2E] shadow-sm"
                        : "bg-white/70 text-[#2D1F2F] border-[#C3A29B]/60 hover:bg-white hover:border-[#7A0B2E]/50"
                    }`}
                  >
                    {navItem.label}
                    {hasChildren && !isActive && (
                      <svg className="w-2.5 h-2.5 opacity-50" viewBox="0 0 10 10" fill="none">
                        <path d="M3 4l2 2 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Row 2: Sub-chips — mirrors the selected category's navbar dropdown children */}
            {activeNavItem && (() => {
              // Flatten nav item children: prefer sections items, else flat children
              const subItems: { label: string; href: string }[] =
                activeNavItem.sections && activeNavItem.sections.length > 0
                  ? activeNavItem.sections.flatMap((sec: any) => sec.items)
                  : activeNavItem.children ?? [];

              if (subItems.length === 0) return null;
              const activeCatSlug = hrefToSlug(activeNavItem.href);

              return (
                <div
                  className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-3 pt-0"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  {/* "All [Category]" */}
                  <Link
                    href={buildUrl({ category: activeCatSlug, subcat: "all", page: "1" })}
                    scroll={false}
                    className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shrink-0 border transition-all duration-150 font-serif ${
                      subcatParam === "all"
                        ? "bg-[#2D1F2F] text-white border-[#2D1F2F]"
                        : "bg-[#EBDCD9] text-[#4A3540] border-[#C3A29B]/50 hover:bg-white hover:border-[#7A0B2E]/40"
                    }`}
                  >
                    All {activeNavItem.label}
                  </Link>

                  {subItems.map((child: any) => {
                    const childSlug = hrefToSlug(child.href);
                    const isActive = subcatParam === childSlug;
                    return (
                      <Link
                        key={child.href}
                        href={buildUrl({ category: activeCatSlug, subcat: childSlug, page: "1" })}
                        scroll={false}
                        className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shrink-0 border transition-all duration-150 font-serif ${
                          isActive
                            ? "bg-[#2D1F2F] text-white border-[#2D1F2F]"
                            : "bg-[#EBDCD9] text-[#4A3540] border-[#C3A29B]/50 hover:bg-white hover:border-[#7A0B2E]/40"
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}


      {/* 4. Interactive Showcase (Main Category pages only) */}
      {isMainCategory && (formattedSections.length > 0 || flatVarietiesFallback.length > 0) && (
        <InteractiveCategoryShowcase
          departmentName={collection.name}
          sections={formattedSections}
          flatVarietiesFallback={flatVarietiesFallback}
        />
      )}

      {/* 5. Subcategory Quick-Pills (regular sub-category pages) */}
      {subcategoryList.length > 0 && !isMainCategory && !isSpecialCollection && (
        <div className="sticky top-0 z-30 bg-[#F5EFE6]/95 backdrop-blur-md border-b border-[#7A0B2E]/20 py-3.5 px-4 shadow-xs">
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#2D1F2F] whitespace-nowrap">
              {`More in ${mainCategoryName}:`}
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {mainCategorySlug && (
                <Link
                  href={`/collections/${mainCategorySlug}`}
                  className={`px-4 py-1.5 text-xs font-serif whitespace-nowrap transition-all border ${
                    slug === mainCategorySlug
                      ? "bg-[#7A0B2E] text-white border-[#7A0B2E] shadow-sm font-semibold"
                      : "bg-white text-[#2D1F2F] border-[#7A0B2E]/30 hover:border-[#7A0B2E] hover:text-[#7A0B2E]"
                  }`}
                >
                  All {mainCategoryName}
                </Link>
              )}
              {subcategoryList.map((sub) => {
                const isActive = slug === sub.slug;
                return (
                  <Link
                    key={sub.id}
                    href={`/collections/${sub.slug}`}
                    className={`px-4 py-1.5 text-xs font-serif whitespace-nowrap transition-all border ${
                      isActive
                        ? "bg-[#7A0B2E] text-white border-[#7A0B2E] shadow-sm font-semibold"
                        : "bg-white text-[#2D1F2F] border-[#7A0B2E]/30 hover:border-[#7A0B2E] hover:text-[#7A0B2E]"
                    }`}
                  >
                    {sub.name}
                    {sub._count?.products !== undefined && sub._count.products > 0 && (
                      <span className={`ml-1.5 text-[10px] ${isActive ? "text-white/80" : "text-gray-400"}`}>
                        ({sub._count.products})
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. Products Section */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#7A0B2E]/10">
          <span className="text-xs uppercase tracking-widest font-serif text-gray-500">
            Showing{" "}
            <strong className="text-[#2D1F2F]">{totalProducts}</strong> products
            {activeCategoryNode && (
              <span className="text-[#7A0B2E] ml-1">
                in{" "}
                {subcatParam !== "all"
                  ? subcatParam.replace(/-/g, " ")
                  : activeCategoryNode.name}
              </span>
            )}
            {!activeCategoryNode && !isMainCategory && (
              <span className="text-[#7A0B2E] ml-1">in {collection.name}</span>
            )}
          </span>
        </div>

        {productsWithReviews.length === 0 ? (
          <div className="text-center text-[#7A0B2E] text-xs uppercase tracking-widest font-semibold py-16 md:py-24 border border-dashed border-[#7A0B2E]/20 bg-[#F5EFE6]">
            No products found in this category yet.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {productsWithReviews.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-16">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl={baseUrl}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}