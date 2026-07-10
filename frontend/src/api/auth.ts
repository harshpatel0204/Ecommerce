import { apiClient } from "@/api/client";
import type { LoginRequest, RegisterRequest, TokenResponse, User, GoogleLoginRequest, FirebasePhoneLoginRequest } from "@/types/auth";

export async function register(payload: RegisterRequest): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/auth/register", payload);
  return data;
}

export async function login(payload: LoginRequest): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/auth/login", payload);
  return data;
}

export async function loginWithGoogle(payload: GoogleLoginRequest): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/auth/google", payload);
  return data;
}

export async function loginWithFirebasePhone(payload: FirebasePhoneLoginRequest): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/auth/firebase-phone", payload);
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post("/auth/logout", { refresh_token: refreshToken });
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post("/auth/reset-password", { token, new_password: newPassword });
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>("/auth/me");
  return data;
}

export async function updateProfile(payload: {
  full_name?: string;
  phone?: string;
}): Promise<User> {
  const { data } = await apiClient.patch<User>("/auth/me", payload);
  return data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return data;
}
