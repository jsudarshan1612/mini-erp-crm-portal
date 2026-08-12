import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AppError, isPrismaUniqueConstraintError } from '../utils/helpers';

interface ChallanItemInput {
  productId: string;
  quantity: number;
}

interface ChallanQuery {
  page: number;
  limit: number;
  search?: string;
  status?: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  fromDate?: string;
  toDate?: string;
}

const MAX_CHALLAN_NUMBER_ATTEMPTS = 5;

async function generateChallanNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CH-${year}-`;

  const lastChallan = await prisma.challan.findFirst({
    where: { challanNumber: { startsWith: prefix } },
    orderBy: { challanNumber: 'desc' },
  });

  let nextNum = 1;
  if (lastChallan) {
    const parts = lastChallan.challanNumber.split('-');
    const lastNum = parseInt(parts[2], 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

function ensureUniqueProductIds(items: ChallanItemInput[]) {
  const seen = new Set<string>();

  for (const item of items) {
    if (seen.has(item.productId)) {
      throw new AppError('Duplicate product in challan items.', 400);
    }
    seen.add(item.productId);
  }
}

function buildWhere(query: ChallanQuery): Prisma.ChallanWhereInput {
  const where: Prisma.ChallanWhereInput = {};

  if (query.status) where.status = query.status;

  if (query.fromDate || query.toDate) {
    where.createdAt = {};
    if (query.fromDate) where.createdAt.gte = new Date(query.fromDate);
    if (query.toDate) {
      const to = new Date(query.toDate);
      to.setHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }

  if (query.search) {
    where.OR = [
      { challanNumber: { contains: query.search, mode: 'insensitive' } },
      { customer: { name: { contains: query.search, mode: 'insensitive' } } },
      { customer: { businessName: { contains: query.search, mode: 'insensitive' } } },
    ];
  }

  return where;
}

function formatChallan(challan: {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: { id: string; name: string; businessName: string };
  user?: { id: string; name: string };
  items?: Array<{
    id: string;
    productId: string;
    productName: string;
    sku: string;
    unitPrice: Prisma.Decimal;
    quantity: number;
  }>;
}) {
  return {
    ...challan,
    items: challan.items?.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
    })),
  };
}

export async function listChallans(query: ChallanQuery) {
  const where = buildWhere(query);
  const skip = (query.page - 1) * query.limit;

  const [challans, total] = await Promise.all([
    prisma.challan.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, businessName: true } },
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.challan.count({ where }),
  ]);

  return {
    challans: challans.map(formatChallan),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getChallan(id: string) {
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: {
      customer: true,
      user: { select: { id: true, name: true, email: true } },
      items: true,
    },
  });

  if (!challan) throw new AppError('Challan not found', 404);
  return formatChallan(challan);
}

export async function createChallan(
  customerId: string,
  items: ChallanItemInput[],
  createdBy: string
) {
  ensureUniqueProductIds(items);

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new AppError('Customer not found', 404);

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    throw new AppError('One or more products not found', 404);
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  for (let attempt = 1; attempt <= MAX_CHALLAN_NUMBER_ATTEMPTS; attempt += 1) {
    const challanNumber = await generateChallanNumber();

    try {
      const challan = await prisma.challan.create({
        data: {
          challanNumber,
          customerId,
          totalQuantity,
          status: 'DRAFT',
          createdBy,
          items: {
            create: items.map((item) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: item.productId,
                productName: product.name,
                sku: product.sku,
                unitPrice: product.unitPrice,
                quantity: item.quantity,
              };
            }),
          },
        },
        include: {
          customer: { select: { id: true, name: true, businessName: true } },
          user: { select: { id: true, name: true } },
          items: true,
        },
      });

      return formatChallan(challan);
    } catch (error) {
      const canRetry =
        isPrismaUniqueConstraintError(error, 'challanNumber') &&
        attempt < MAX_CHALLAN_NUMBER_ATTEMPTS;

      if (canRetry) continue;

      if (isPrismaUniqueConstraintError(error, 'challanNumber')) {
        throw new AppError('Could not generate a unique challan number. Please retry.', 409);
      }

      throw error;
    }
  }

  throw new AppError('Could not generate a unique challan number. Please retry.', 409);
}

export async function updateChallan(
  id: string,
  customerId: string,
  items: ChallanItemInput[]
) {
  ensureUniqueProductIds(items);

  const challan = await prisma.challan.findUnique({ where: { id } });
  if (!challan) throw new AppError('Challan not found', 404);
  if (challan.status !== 'DRAFT') {
    throw new AppError('Only draft challans can be updated', 400);
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new AppError('Customer not found', 404);

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    throw new AppError('One or more products not found', 404);
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.challanItem.deleteMany({ where: { challanId: id } });

    return tx.challan.update({
      where: { id },
      data: {
        customerId,
        totalQuantity,
        items: {
          create: items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
              productId: item.productId,
              productName: product.name,
              sku: product.sku,
              unitPrice: product.unitPrice,
              quantity: item.quantity,
            };
          }),
        },
      },
      include: {
        customer: { select: { id: true, name: true, businessName: true } },
        user: { select: { id: true, name: true } },
        items: true,
      },
    });
  });

  return formatChallan(updated);
}

export async function confirmChallan(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) throw new AppError('Challan not found', 404);
    if (challan.status !== 'DRAFT') {
      throw new AppError('Only draft challans can be confirmed', 400);
    }

    ensureUniqueProductIds(challan.items);

    const productIds = challan.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of challan.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new AppError(`Product not found for item: ${item.productName}`, 404);
      }
      if (product.currentStock < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name}. Available: ${product.currentStock}, Requested: ${item.quantity}`,
          400
        );
      }
    }

    const statusUpdate = await tx.challan.updateMany({
      where: { id, status: 'DRAFT' },
      data: { status: 'CONFIRMED' },
    });

    if (statusUpdate.count !== 1) {
      throw new AppError('Only draft challans can be confirmed', 400);
    }

    for (const item of challan.items) {
      const updateResult = await tx.product.updateMany({
        where: {
          id: item.productId,
          currentStock: { gte: item.quantity },
        },
        data: { currentStock: { decrement: item.quantity } },
      });

      if (updateResult.count !== 1) {
        const latestProduct = await tx.product.findUnique({ where: { id: item.productId } });
        const product = latestProduct ?? productMap.get(item.productId)!;
        throw new AppError(
          `Insufficient stock for ${product.name}. Available: ${product.currentStock}, Requested: ${item.quantity}`,
          400
        );
      }
    }

    for (const item of challan.items) {
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: 'OUT',
          reason: `Challan ${challan.challanNumber} confirmed`,
          createdBy: userId,
        },
      });
    }

    const confirmed = await tx.challan.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, businessName: true } },
        user: { select: { id: true, name: true } },
        items: true,
      },
    });

    if (!confirmed) throw new AppError('Challan not found', 404);
    return formatChallan(confirmed);
  });
}

export async function cancelChallan(id: string) {
  const challan = await prisma.challan.findUnique({ where: { id } });
  if (!challan) throw new AppError('Challan not found', 404);
  if (challan.status !== 'DRAFT') {
    throw new AppError('Only draft challans can be cancelled', 400);
  }

  const cancelled = await prisma.challan.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: {
      customer: { select: { id: true, name: true, businessName: true } },
      user: { select: { id: true, name: true } },
      items: true,
    },
  });

  return formatChallan(cancelled);
}
