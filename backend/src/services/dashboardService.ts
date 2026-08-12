import prisma from '../config/database';
import * as productService from './productService';

export async function getDashboardStats() {
  const [
    totalCustomers,
    totalProducts,
    allProducts,
    draftChallans,
    confirmedChallans,
    recentChallans,
    recentMovements,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.product.count(),
    prisma.product.findMany(),
    prisma.challan.count({ where: { status: 'DRAFT' } }),
    prisma.challan.count({ where: { status: 'CONFIRMED' } }),
    prisma.challan.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, businessName: true } },
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.stockMovement.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        user: { select: { id: true, name: true } },
      },
    }),
  ]);

  const lowStockProducts = allProducts
    .filter((p) => p.currentStock <= p.minimumStock)
    .slice(0, 5)
    .map((p) => ({
      ...p,
      unitPrice: Number(p.unitPrice),
      isLowStock: true,
    }));

  const lowStockCount = allProducts.filter((p) => p.currentStock <= p.minimumStock).length;

  return {
    stats: {
      totalCustomers,
      totalProducts,
      lowStockProducts: lowStockCount,
      draftChallans,
      confirmedChallans,
    },
    recentChallans: recentChallans.map((c) => ({
      ...c,
      items: undefined,
    })),
    lowStockProducts,
    recentStockMovements: recentMovements,
  };
}

export { productService };
