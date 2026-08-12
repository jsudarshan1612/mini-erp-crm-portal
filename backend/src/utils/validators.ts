import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['SALES', 'WAREHOUSE', 'ACCOUNTS']),
});

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().min(1, 'Mobile is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  businessName: z.string().min(1, 'Business name is required'),
  gstNumber: z.string().optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().min(1, 'Address is required'),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
  followUpDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
});

export const followUpSchema = z.object({
  note: z.string().min(1, 'Note is required'),
  followUpDate: z.string().datetime({ message: 'Valid follow-up date is required' }),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().min(1, 'Category is required'),
  unitPrice: z.number().min(0, 'Unit price must be >= 0'),
  currentStock: z.number().int().min(0, 'Current stock must be >= 0').optional(),
  minimumStock: z.number().int().min(0, 'Minimum stock must be >= 0'),
  warehouse: z.string().min(1, 'Warehouse is required'),
});

export const stockMovementSchema = z.object({
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  type: z.enum(['IN', 'OUT']),
  reason: z.string().min(1, 'Reason is required'),
});

export const challanItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
});

export const challanSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  items: z.array(challanItemSchema).min(1, 'At least one item is required'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().optional(),
});

export const customerQuerySchema = paginationSchema.extend({
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).optional(),
});

export const productQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  lowStock: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

export const challanQuerySchema = paginationSchema.extend({
  status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});
