import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AppError, isPrismaForeignKeyError } from '../utils/helpers';

interface ProductInput {
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock?: number;
  minimumStock: number;
  warehouse: string;
}

interface ProductQuery {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  lowStock?: boolean;
}

function buildWhere(query: ProductQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  if (query.category) where.category = query.category;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { sku: { contains: query.search, mode: 'insensitive' } },
      { category: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

export async function listProducts(query: ProductQuery) {
  const where = buildWhere(query);
  const skip = (query.page - 1) * query.limit;

  let products = await prisma.product.findMany({
    where,
    skip: query.lowStock ? 0 : skip,
    take: query.lowStock ? undefined : query.limit,
    orderBy: { createdAt: 'desc' },
  });

  if (query.lowStock) {
    products = products.filter((p) => p.currentStock <= p.minimumStock);
    const total = products.length;
    products = products.slice(skip, skip + query.limit);
    return {
      products: products.map(enrichProduct),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  const total = await prisma.product.count({ where });
  return {
    products: products.map(enrichProduct),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

function enrichProduct(product: {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: Prisma.Decimal;
  currentStock: number;
  minimumStock: number;
  warehouse: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...product,
    unitPrice: Number(product.unitPrice),
    isLowStock: product.currentStock <= product.minimumStock,
  };
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Product not found', 404);
  return enrichProduct(product);
}

export async function createProduct(data: ProductInput) {
  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) throw new AppError('SKU already exists', 409);

  const product = await prisma.product.create({
    data: {
      ...data,
      unitPrice: data.unitPrice,
      currentStock: data.currentStock ?? 0,
    },
  });
  return enrichProduct(product);
}

export async function updateProduct(id: string, data: ProductInput) {
  await getProduct(id);

  const existing = await prisma.product.findFirst({
    where: { sku: data.sku, NOT: { id } },
  });
  if (existing) throw new AppError('SKU already exists', 409);

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      unitPrice: data.unitPrice,
    },
  });
  return enrichProduct(product);
}

export async function deleteProduct(id: string) {
  await getProduct(id);

  const referencedChallanItems = await prisma.challanItem.count({ where: { productId: id } });
  if (referencedChallanItems > 0) {
    throw new AppError(
      'Product cannot be deleted because it is referenced by existing challans.',
      409
    );
  }

  try {
    await prisma.product.delete({ where: { id } });
  } catch (error) {
    if (isPrismaForeignKeyError(error)) {
      throw new AppError(
        'Product cannot be deleted because it is referenced by existing records.',
        409
      );
    }
    throw error;
  }
}

export async function addStockMovement(
  productId: string,
  quantity: number,
  type: 'IN' | 'OUT',
  reason: string,
  createdBy: string
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Product not found', 404);

    if (type === 'IN') {
      await tx.product.update({
        where: { id: productId },
        data: { currentStock: { increment: quantity } },
      });
    } else {
      if (product.currentStock < quantity) {
        throw new AppError(
          `Insufficient stock. Available: ${product.currentStock}, Requested: ${quantity}`,
          400
        );
      }

      const updateResult = await tx.product.updateMany({
        where: {
          id: productId,
          currentStock: { gte: quantity },
        },
        data: { currentStock: { decrement: quantity } },
      });

      if (updateResult.count !== 1) {
        const latestProduct = await tx.product.findUnique({ where: { id: productId } });
        throw new AppError(
          `Insufficient stock. Available: ${latestProduct?.currentStock ?? product.currentStock}, Requested: ${quantity}`,
          400
        );
      }
    }

    const movement = await tx.stockMovement.create({
        data: { productId, quantity, type, reason, createdBy },
        include: { user: { select: { id: true, name: true } } },
    });

    return movement;
  });
}

export async function getStockMovements(productId: string) {
  await getProduct(productId);
  return prisma.stockMovement.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, sku: true } },
    },
  });
}

export async function listAllStockMovements(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, sku: true } },
      },
    }),
    prisma.stockMovement.count(),
  ]);

  return {
    movements,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getCategories() {
  const categories = await prisma.product.findMany({
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  return categories.map((c) => c.category);
}
