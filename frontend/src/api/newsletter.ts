import { apiClient } from "@/api/client";

export async function subscribeNewsletter(email: string): Promise<string> {
  const { data } = await apiClient.post<{ message: string }>("/newsletter/subscribe", { email });
  return data.message;
}
