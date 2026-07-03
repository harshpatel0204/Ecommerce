import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getCategories, getFeatured, getProduct, getProducts } from "@/api/products";
import type { ProductFilters } from "@/types/product";

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => getProducts(filters),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProduct(slug),
    enabled: !!slug,
  });
}

export function useFeatured() {
  return useQuery({ queryKey: ["products", "featured"], queryFn: getFeatured });
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: getCategories });
}
