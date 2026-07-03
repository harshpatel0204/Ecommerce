import { apiClient } from "@/api/client";

export interface CourierOption {
  courier_name: string | null;
  courier_id: number | null;
  rate: number;
  eta_days: number | string | null;
}

export interface Serviceability {
  serviceable: boolean;
  couriers: CourierOption[];
  cheapest: CourierOption | null;
}

export async function checkServiceability(
  pincode: string,
  weightGrams = 500,
): Promise<Serviceability> {
  const { data } = await apiClient.post<Serviceability>("/shipping/check-serviceability", {
    pincode,
    weight_grams: weightGrams,
  });
  return data;
}
