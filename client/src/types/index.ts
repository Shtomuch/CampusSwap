export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string;
  studentId: string;
  university: string;
  faculty: string;
  yearOfStudy: number;
  profileImageUrl?: string;
  rating: number;
  reviewsCount: number;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: ListingCategory;
  status: ListingStatus;
  condition: string;
  isbn?: string;
  courseCode?: string;
  author?: string;
  publicationYear?: number;
  location: string;
  isNegotiable: boolean;
  viewsCount: number;
  userId: string;
  sellerName: string;
  imageUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum ListingCategory {
  Textbooks = 0,
  StudyMaterials = 1,
  Electronics = 2,
  Furniture = 3,
  Clothing = 4,
  Accessories = 5,
  Transportation = 6,
  Other = 7,
}

export enum ListingStatus {
  Draft = 0,
  Active = 1,
  Reserved = 2,
  Sold = 3,
  Cancelled = 4,
  Expired = 5,
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  notes?: string;
  confirmedAt?: Date;
  completedAt?: Date;
  meetingLocation: string;
  meetingTime: Date;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  listingId: string;
  listingTitle: string;
  createdAt: Date;
}

export enum OrderStatus {
  Pending = 0,
  Confirmed = 1,
  InProgress = 2,
  Completed = 3,
  Cancelled = 4,
  Refunded = 5,
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  isRead: boolean;
  createdAt: Date;
  conversationId: string;
}

export interface Conversation {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserImage?: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Notification {
  id: string;
  type: 'order' | 'message' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  data?: string;
  createdAt: Date;
  orderId?: string;
  conversationId?: string;
  listingId?: string;
}

export interface UnreadCounts {
  unreadNotificationCount: number;
  unreadChatCount: number;
}