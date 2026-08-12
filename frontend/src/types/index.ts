export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  businessName: string;
  gstNumber?: string | null;
  customerType: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
  address: string;
  status: 'LEAD' | 'ACTIVE' | 'INACTIVE';
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  followUps?: CustomerFollowUp[];
}

export interface CustomerFollowUp {
  id: string;
  customerId: string;
  note: string;
  followUpDate: string;
  createdBy: string;
  createdAt: string;
  user?: { id: string; name: string };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  warehouse: string;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  type: 'IN' | 'OUT';
  reason: string;
  createdBy: string;
  createdAt: string;
  user?: { id: string; name: string };
  product?: { id: string; name: string; sku: string };
}

export interface ChallanItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string; businessName: string };
  user?: { id: string; name: string; email?: string };
  items?: ChallanItem[];
}

export interface DashboardData {
  stats: {
    totalCustomers: number;
    totalProducts: number;
    lowStockProducts: number;
    draftChallans: number;
    confirmedChallans: number;
  };
  recentChallans: Challan[];
  lowStockProducts: Product[];
  recentStockMovements: StockMovement[];
}
