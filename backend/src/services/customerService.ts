import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AppError, isPrismaForeignKeyError } from '../utils/helpers';

interface CustomerInput {
  name: string;
  mobile: string;
  email?: string;
  businessName: string;
  gstNumber?: string;
  customerType: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
  address: string;
  status?: 'LEAD' | 'ACTIVE' | 'INACTIVE';
  followUpDate?: string | null;
  notes?: string;
}

interface CustomerQuery {
  page: number;
  limit: number;
  search?: string;
  status?: 'LEAD' | 'ACTIVE' | 'INACTIVE';
  customerType?: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
}

function buildWhere(query: CustomerQuery): Prisma.CustomerWhereInput {
  const where: Prisma.CustomerWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.customerType) where.customerType = query.customerType;

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { mobile: { contains: query.search, mode: 'insensitive' } },
      { businessName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

export async function listCustomers(query: CustomerQuery) {
  const where = buildWhere(query);
  const skip = (query.page - 1) * query.limit;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      followUps: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!customer) throw new AppError('Customer not found', 404);
  return customer;
}

export async function createCustomer(data: CustomerInput) {
  return prisma.customer.create({
    data: {
      ...data,
      email: data.email || null,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
    },
  });
}

export async function updateCustomer(id: string, data: CustomerInput) {
  await getCustomer(id);
  return prisma.customer.update({
    where: { id },
    data: {
      ...data,
      email: data.email || null,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
    },
  });
}

export async function deleteCustomer(id: string) {
  await getCustomer(id);

  const referencedChallans = await prisma.challan.count({ where: { customerId: id } });
  if (referencedChallans > 0) {
    throw new AppError(
      'Customer cannot be deleted because it is referenced by existing challans.',
      409
    );
  }

  try {
    await prisma.customer.delete({ where: { id } });
  } catch (error) {
    if (isPrismaForeignKeyError(error)) {
      throw new AppError(
        'Customer cannot be deleted because it is referenced by existing records.',
        409
      );
    }
    throw error;
  }
}

export async function addFollowUp(
  customerId: string,
  note: string,
  followUpDate: string,
  createdBy: string
) {
  await getCustomer(customerId);

  const [followUp] = await prisma.$transaction([
    prisma.customerFollowUp.create({
      data: {
        customerId,
        note,
        followUpDate: new Date(followUpDate),
        createdBy,
      },
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.customer.update({
      where: { id: customerId },
      data: { followUpDate: new Date(followUpDate) },
    }),
  ]);

  return followUp;
}

export async function getFollowUps(customerId: string) {
  await getCustomer(customerId);
  return prisma.customerFollowUp.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true } } },
  });
}
