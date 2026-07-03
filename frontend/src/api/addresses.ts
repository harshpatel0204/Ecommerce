import { apiClient } from "@/api/client";
import type { Address } from "@/types/order";

export type AddressPayload = Omit<Address, "id" | "is_default"> & { is_default?: boolean };

export async function getAddresses(): Promise<Address[]> {
  const { data } = await apiClient.get<Address[]>("/me/addresses");
  return data;
}

export async function createAddress(payload: AddressPayload): Promise<Address> {
  const { data } = await apiClient.post<Address>("/me/addresses", payload);
  return data;
}

export async function updateAddress(id: string, payload: Partial<AddressPayload>): Promise<Address> {
  const { data } = await apiClient.patch<Address>(`/me/addresses/${id}`, payload);
  return data;
}

export async function deleteAddress(id: string): Promise<void> {
  await apiClient.delete(`/me/addresses/${id}`);
}

export async function setDefaultAddress(id: string): Promise<Address> {
  const { data } = await apiClient.patch<Address>(`/me/addresses/${id}/set-default`);
  return data;
}
