

export enum Platform {
  YOUTUBE = 'YOUTUBE',
  INSTAGRAM = 'INSTAGRAM',
  NAVER = 'NAVER',
  DANGGEUN = 'DANGGEUN',
  COUPANG = 'COUPANG'
}

export interface InputField {
  key: string; // 'url', 'url2', 'content', etc.
  label: string;
  type: 'text' | 'textarea';
  placeholder?: string;
}

export interface ServiceOption {
  id: string;
  name: string;
  pricePerUnit: number; // 판매가
  costPrice?: number; // 원가 (Admin Only)
  minQuantity: number;
  description: string;
  platform: Platform;
  inputs?: InputField[]; // Optional custom inputs. If missing, defaults to standard URL input.
}

export interface CouponHistoryItem {
  id: number;
  date: string;
  amount: number; // Points won (0 if lose)
  resultType: 'WIN' | 'LOSE';
}

export interface User {
  id: number;
  email: string;
  name?: string; // Added Name
  password?: string; 
  phone: string; 
  role: 'USER' | 'ADMIN'; 
  referralCode?: string; // Own referral code (if Admin)
  usedReferralCode?: string; // Code used during signup
  isSuperAdmin?: boolean; // New: 권한 분리 (운영 관리자)
  points: number;
  coupons: number; // Current coupon count
  couponHistory?: CouponHistoryItem[]; // History of usage
  source: string;
  date: string;
}

export interface Order {
  id: string;
  userId: string; // Email or ID
  serviceName: string;
  serviceId?: string; // Link to service definition
  amount: number; // Total Sales Price (Points)
  costPrice?: number; // Snapshot of cost per unit at time of order
  quantity: number;
  platform: Platform;
  speed: string;
  details: Record<string, string>;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED';
  hasReviewed?: boolean; // New: Check if review is written
  processedBy?: string; // New: 누가 처리했는지 (Audit)
  date: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  bankName: string;
  accountNumber: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED';
  date: string;
}

export interface Review {
  id: number | string; // Allow string for DB IDs
  userId?: string; // Added for tracking
  orderId?: string; // Added for tracking
  name: string;
  rating: number;
  content: string;
  platform: Platform;
  date: string;
}