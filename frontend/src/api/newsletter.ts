import { apiClient } from "@/api/client";

export async function subscribeNewsletter(email: string): Promise<string> {
  const { data } = await apiClient.post<{ message: string }>("/newsletter/subscribe", { email });
  return data.message;
}

// ---- Admin ----
export interface NewsletterSubscriber {
  id: string;
  email: string;
  created_at: string;
}

export interface NewsletterListResponse {
  items: NewsletterSubscriber[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export async function adminListSubscribers(params: {
  search?: string;
  page?: number;
}): Promise<NewsletterListResponse> {
  const { data } = await apiClient.get<NewsletterListResponse>("/admin/newsletter", { params });
  return data;
}

/** Fetch the subscribers CSV as a blob and trigger a browser download. */
export async function adminDownloadSubscribersCsv(): Promise<void> {
  const { data } = await apiClient.get("/admin/newsletter/export.csv", { responseType: "blob" });
  const url = URL.createObjectURL(data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "newsletter_subscribers.csv";
  a.click();
  URL.revokeObjectURL(url);
}
