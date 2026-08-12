import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireAuth, requireRole } from '../src/middleware/auth';
import { login, register } from '../src/services/authService';
import { confirmChallan, createChallan } from '../src/services/challanService';
import { deleteCustomer } from '../src/services/customerService';
import { addStockMovement, deleteProduct } from '../src/services/productService';
import { registerSchema } from '../src/utils/validators';

const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    customerFollowUp: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    stockMovement: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    challan: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    challanItem: {
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
    $disconnect: vi.fn(),
  };

  return { prismaMock };
});

vi.mock('../src/config/database', () => ({
  default: prismaMock,
  prisma: prismaMock,
}));

const now = new Date('2026-08-11T00:00:00.000Z');

function mockResponse() {
  const res = {} as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };

  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prod-1',
    name: 'Widget',
    sku: 'WID-001',
    category: 'General',
    unitPrice: 100,
    currentStock: 10,
    minimumStock: 2,
    warehouse: 'WH-A',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function customer(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cust-1',
    name: 'Test Customer',
    mobile: '9999999999',
    email: null,
    businessName: 'Test Business',
    gstNumber: null,
    customerType: 'RETAIL',
    address: 'Test Address',
    status: 'ACTIVE',
    followUpDate: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
    followUps: [],
    ...overrides,
  };
}

function challanItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item-1',
    productId: 'prod-1',
    productName: 'Widget',
    sku: 'WID-001',
    unitPrice: 100,
    quantity: 4,
    ...overrides,
  };
}

function draftChallan(overrides: Record<string, unknown> = {}) {
  return {
    id: 'challan-1',
    challanNumber: 'CH-2026-0001',
    customerId: 'cust-1',
    totalQuantity: 4,
    status: 'DRAFT',
    createdBy: 'user-1',
    createdAt: now,
    updatedAt: now,
    items: [challanItem()],
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  prismaMock.$transaction.mockImplementation(async (arg: unknown) => {
    if (typeof arg === 'function') {
      return (arg as (tx: typeof prismaMock) => Promise<unknown>)(prismaMock);
    }

    return Promise.all(arg as Promise<unknown>[]);
  });
});

describe('Authentication security', () => {
  it('rejects invalid login', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(login('missing@example.com', 'wrong-password')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    });
  });

  it('rejects protected route without token', () => {
    const req = { headers: {} } as Request;
    const res = mockResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Authentication required',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects role authorization when the role is not allowed', () => {
    const req = {
      user: { userId: 'user-1', role: 'SALES' as Role },
    } as Request;
    const res = mockResponse();
    const next = vi.fn();

    requireRole('ADMIN')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'You do not have permission to perform this action',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('does not allow registration validation to accept ADMIN', () => {
    const result = registerSchema.safeParse({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'ADMIN',
    });

    expect(result.success).toBe(false);
  });

  it('does not allow the register service to create ADMIN users', async () => {
    await expect(
      register('Admin User', 'admin@example.com', 'Admin@123', 'ADMIN' as Role)
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Administrator accounts cannot be created through registration',
    });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });
});

describe('Challan validation and confirmation', () => {
  it('rejects duplicate challan products', async () => {
    await expect(
      createChallan(
        'cust-1',
        [
          { productId: 'prod-1', quantity: 2 },
          { productId: 'prod-1', quantity: 3 },
        ],
        'user-1'
      )
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Duplicate product in challan items.',
    });
    expect(prismaMock.customer.findUnique).not.toHaveBeenCalled();
  });

  it('confirms a draft challan and safely decrements stock when stock is sufficient', async () => {
    const item = challanItem({ quantity: 4 });
    const draft = draftChallan({ items: [item], totalQuantity: 4 });
    const confirmed = {
      ...draft,
      status: 'CONFIRMED',
      customer: { id: 'cust-1', name: 'Test Customer', businessName: 'Test Business' },
      user: { id: 'user-1', name: 'Sales User' },
    };

    prismaMock.challan.findUnique.mockResolvedValueOnce(draft).mockResolvedValueOnce(confirmed);
    prismaMock.product.findMany.mockResolvedValue([product({ currentStock: 10 })]);
    prismaMock.challan.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.product.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.stockMovement.create.mockResolvedValue({
      id: 'move-1',
      productId: 'prod-1',
      quantity: 4,
      type: 'OUT',
      reason: 'Challan CH-2026-0001 confirmed',
      createdBy: 'user-1',
      createdAt: now,
    });

    const result = await confirmChallan('challan-1', 'user-1');

    expect(result.status).toBe('CONFIRMED');
    expect(prismaMock.product.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'prod-1',
        currentStock: { gte: 4 },
      },
      data: { currentStock: { decrement: 4 } },
    });
    expect(prismaMock.stockMovement.create).toHaveBeenCalledWith({
      data: {
        productId: 'prod-1',
        quantity: 4,
        type: 'OUT',
        reason: 'Challan CH-2026-0001 confirmed',
        createdBy: 'user-1',
      },
    });
  });

  it('rejects insufficient challan stock without updating stock or creating movements', async () => {
    const item = challanItem({ quantity: 5 });
    const draft = draftChallan({ items: [item], totalQuantity: 5 });

    prismaMock.challan.findUnique.mockResolvedValue(draft);
    prismaMock.product.findMany.mockResolvedValue([product({ currentStock: 3 })]);

    await expect(confirmChallan('challan-1', 'user-1')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Insufficient stock for Widget. Available: 3, Requested: 5',
    });

    expect(prismaMock.product.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.stockMovement.create).not.toHaveBeenCalled();
  });

  it('keeps the challan draft when confirmation fails for insufficient stock', async () => {
    const item = challanItem({ quantity: 5 });
    const draft = draftChallan({ items: [item], totalQuantity: 5 });

    prismaMock.challan.findUnique.mockResolvedValue(draft);
    prismaMock.product.findMany.mockResolvedValue([product({ currentStock: 3 })]);

    await expect(confirmChallan('challan-1', 'user-1')).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(prismaMock.challan.updateMany).not.toHaveBeenCalled();
  });
});

describe('Manual stock movements', () => {
  it('creates a manual stock IN movement and increments stock', async () => {
    prismaMock.product.findUnique.mockResolvedValue(product({ currentStock: 5 }));
    prismaMock.product.update.mockResolvedValue(product({ currentStock: 8 }));
    prismaMock.stockMovement.create.mockResolvedValue({
      id: 'move-1',
      productId: 'prod-1',
      quantity: 3,
      type: 'IN',
      reason: 'Purchase received',
      createdBy: 'user-1',
      createdAt: now,
    });

    const result = await addStockMovement('prod-1', 3, 'IN', 'Purchase received', 'user-1');

    expect(result.type).toBe('IN');
    expect(prismaMock.product.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { currentStock: { increment: 3 } },
    });
    expect(prismaMock.stockMovement.create).toHaveBeenCalled();
  });

  it('creates a manual stock OUT movement and safely decrements stock', async () => {
    prismaMock.product.findUnique.mockResolvedValue(product({ currentStock: 5 }));
    prismaMock.product.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.stockMovement.create.mockResolvedValue({
      id: 'move-1',
      productId: 'prod-1',
      quantity: 3,
      type: 'OUT',
      reason: 'Damaged stock',
      createdBy: 'user-1',
      createdAt: now,
    });

    const result = await addStockMovement('prod-1', 3, 'OUT', 'Damaged stock', 'user-1');

    expect(result.type).toBe('OUT');
    expect(prismaMock.product.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'prod-1',
        currentStock: { gte: 3 },
      },
      data: { currentStock: { decrement: 3 } },
    });
    expect(prismaMock.stockMovement.create).toHaveBeenCalled();
  });

  it('rejects insufficient manual stock OUT without creating a movement', async () => {
    prismaMock.product.findUnique.mockResolvedValue(product({ currentStock: 5 }));

    await expect(
      addStockMovement('prod-1', 7, 'OUT', 'Damaged stock', 'user-1')
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Insufficient stock. Available: 5, Requested: 7',
    });

    expect(prismaMock.product.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.stockMovement.create).not.toHaveBeenCalled();
  });
});

describe('Delete conflict handling', () => {
  it('returns a conflict when deleting a customer referenced by challans', async () => {
    prismaMock.customer.findUnique.mockResolvedValue(customer());
    prismaMock.challan.count.mockResolvedValue(1);

    await expect(deleteCustomer('cust-1')).rejects.toMatchObject({
      statusCode: 409,
      message: 'Customer cannot be deleted because it is referenced by existing challans.',
    });

    expect(prismaMock.customer.delete).not.toHaveBeenCalled();
  });

  it('returns a conflict when deleting a product referenced by challans', async () => {
    prismaMock.product.findUnique.mockResolvedValue(product());
    prismaMock.challanItem.count.mockResolvedValue(1);

    await expect(deleteProduct('prod-1')).rejects.toMatchObject({
      statusCode: 409,
      message: 'Product cannot be deleted because it is referenced by existing challans.',
    });

    expect(prismaMock.product.delete).not.toHaveBeenCalled();
  });
});
