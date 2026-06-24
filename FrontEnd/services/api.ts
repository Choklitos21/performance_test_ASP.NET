import { getToken, logout } from "@/lib/auth";
import type {
  AuthResponse,
  RegisterDto,
  LoginDto,
  Property,
  CreatePropertyDto,
  UpdatePropertyDto,
  Reservation,
  CreateReservationDto,
  WishlistItem,
  KycStatus,
  DashboardData,
  Notification,
} from "@/types";

// Empty BASE_URL → requests go to Next.js dev server, which proxies to backend via next.config.ts rewrites
const BASE_URL = "";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    logout();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const data = await res.json();
      // Backend returns errors as { error: "..." }, { message: "..." }, or { title: "..." }
      message = data.error || data.message || data.title || message;
    } catch {
      // ignore json parse error
    }
    const err = new Error(message) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  }

  return res.blob() as unknown as T;
}

// Auth
export const auth = {
  register: (body: RegisterDto) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: LoginDto) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// Properties
export const properties = {
  list: (params?: { location?: string; checkIn?: string; checkOut?: string }) => {
    const qs = new URLSearchParams();
    if (params?.location) qs.set("location", params.location);
    if (params?.checkIn) qs.set("checkIn", params.checkIn);
    if (params?.checkOut) qs.set("checkOut", params.checkOut);
    const query = qs.toString() ? `?${qs}` : "";
    return request<Property[]>(`/api/properties${query}`);
  },
  get: (id: number) => request<Property>(`/api/properties/${id}`),
  myProperties: () => request<Property[]>("/api/properties/my"),
  create: (body: CreatePropertyDto) =>
    request<Property>("/api/properties", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: number, body: UpdatePropertyDto) =>
    request<Property>(`/api/properties/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: (id: number) =>
    request<void>(`/api/properties/${id}`, { method: "DELETE" }),
  uploadPhoto: (id: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string }>(`/api/properties/${id}/photos`, {
      method: "POST",
      body: form,
    });
  },
};

// Reservations
export const reservations = {
  create: (body: CreateReservationDto) =>
    request<Reservation>("/api/reservations", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  myReservations: () => request<Reservation[]>("/api/reservations/my"),
  cancel: (id: number) =>
    request<void>(`/api/reservations/${id}`, { method: "DELETE" }),
  getByProperty: (propertyId: number) =>
    request<Reservation[]>(`/api/reservations/property/${propertyId}`),
};

// Wishlist
export const wishlist = {
  list: () => request<WishlistItem[]>("/api/wishlist"),
  add: (propertyId: number) =>
    request<WishlistItem>(`/api/wishlist/${propertyId}`, { method: "POST" }),
  remove: (propertyId: number) =>
    request<void>(`/api/wishlist/${propertyId}`, { method: "DELETE" }),
};

// KYC
export const kyc = {
  submit: (file: File) => {
    const form = new FormData();
    form.append("document", file);
    return request<KycStatus>("/api/kyc/submit", {
      method: "POST",
      body: form,
    });
  },
  status: () => request<KycStatus>("/api/kyc/status"),
};

// Dashboard
export const dashboard = {
  get: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const query = qs.toString() ? `?${qs}` : "";
    return request<DashboardData>(`/api/dashboard${query}`);
  },
};

// Reports
export const reports = {
  downloadExcel: async (propertyId?: number, from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (propertyId) qs.set("propertyId", String(propertyId));
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const query = qs.toString() ? `?${qs}` : "";
    const blob = await request<Blob>(`/api/reports/excel${query}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reservations.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  },
};

// Notifications
export const notifications = {
  list: () => request<Notification[]>("/api/notifications"),
  markRead: (id: number) =>
    request<void>(`/api/notifications/${id}/read`, { method: "PATCH" }),
};
