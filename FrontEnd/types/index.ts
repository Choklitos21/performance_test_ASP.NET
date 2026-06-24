export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  role: string;
}

export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
  role: "Guest" | "Owner";
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface Property {
  id: number;
  ownerId: string;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  isActive: boolean;
  photoUrls: string[];
}

export interface CreatePropertyDto {
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
}

export interface UpdatePropertyDto {
  title?: string;
  description?: string;
  location?: string;
  pricePerNight?: number;
  isActive?: boolean;
}

export interface Reservation {
  id: number;
  propertyId: number;
  propertyTitle: string;
  guestId: string;
  guestName: string;
  guestEmail?: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: "Confirmed" | "Cancelled" | "Completed";
  createdAt: string;
}

export interface CreateReservationDto {
  propertyId: number;
  checkInDate: string;
  checkOutDate: string;
}

export interface WishlistItem {
  id: number;
  propertyId: number;
  propertyTitle: string;
  location: string;
  pricePerNight: number;
  createdAt: string;
}

export interface KycStatus {
  status: "Pending" | "Approved" | "Rejected";
  extractedName?: string;
  extractedSurname?: string;
  extractedDocumentNumber?: string;
  extractedBirthDate?: string;
  similarityScore?: number;
  message?: string;
}

export interface DashboardData {
  totalProperties: number;
  totalReservations: number;
  totalRevenue: number;
  occupancyRate: number;
  propertyMetrics: PropertyMetrics[];
}

export interface PropertyMetrics {
  propertyId: number;
  title: string;
  reservationCount: number;
  revenue: number;
  occupancyRate: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
