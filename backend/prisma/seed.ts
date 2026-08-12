import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Demo users for local development only. Do not reuse these credentials in production.
  const users = [
    { name: 'Admin User', email: 'admin@erp.com', password: 'Admin@123', role: 'ADMIN' as const },
    { name: 'Sales User', email: 'sales@erp.com', password: 'Sales@123', role: 'SALES' as const },
    {
      name: 'Warehouse User',
      email: 'warehouse@erp.com',
      password: 'Warehouse@123',
      role: 'WAREHOUSE' as const,
    },
    {
      name: 'Accounts User',
      email: 'accounts@erp.com',
      password: 'Accounts@123',
      role: 'ACCOUNTS' as const,
    },
  ];

  const createdUsers: Record<string, string> = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        password: await hashPassword(u.password),
        role: u.role,
      },
    });
    createdUsers[u.role] = user.id;
  }

  const customers = [
    {
      name: 'Rajesh Kumar',
      mobile: '9876543210',
      email: 'rajesh@techmart.in',
      businessName: 'TechMart Retail',
      gstNumber: '27AABCT1234F1Z5',
      customerType: 'RETAIL' as const,
      address: '12 MG Road, Pune, Maharashtra',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Priya Sharma',
      mobile: '9876543211',
      email: 'priya@wholesalehub.com',
      businessName: 'Wholesale Hub India',
      gstNumber: '29AABCP5678G1Z2',
      customerType: 'WHOLESALE' as const,
      address: '45 Industrial Area, Bangalore, Karnataka',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Amit Patel',
      mobile: '9876543212',
      email: 'amit@distripower.com',
      businessName: 'DistriPower Solutions',
      customerType: 'DISTRIBUTOR' as const,
      address: '78 Ring Road, Ahmedabad, Gujarat',
      status: 'LEAD' as const,
      followUpDate: new Date('2026-08-15'),
    },
    {
      name: 'Sneha Reddy',
      mobile: '9876543213',
      email: 'sneha@electrozone.in',
      businessName: 'ElectroZone',
      customerType: 'RETAIL' as const,
      address: '23 Hitech City, Hyderabad, Telangana',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Vikram Singh',
      mobile: '9876543214',
      businessName: 'Singh Traders',
      customerType: 'WHOLESALE' as const,
      address: '56 Chandni Chowk, Delhi',
      status: 'INACTIVE' as const,
    },
    {
      name: 'Meera Nair',
      mobile: '9876543215',
      email: 'meera@keralastore.com',
      businessName: 'Kerala Store Chain',
      customerType: 'DISTRIBUTOR' as const,
      address: '89 Marine Drive, Kochi, Kerala',
      status: 'LEAD' as const,
      followUpDate: new Date('2026-08-20'),
    },
  ];

  const createdCustomers = [];
  for (const c of customers) {
    const existing = await prisma.customer.findFirst({
      where: { mobile: c.mobile },
    });
    if (existing) {
      createdCustomers.push(existing);
    } else {
      const customer = await prisma.customer.create({ data: c });
      createdCustomers.push(customer);
    }
  }

  const products = [
    { name: 'Laptop Dell Inspiron 15', sku: 'LAP-DELL-001', category: 'Electronics', unitPrice: 45000, currentStock: 50, minimumStock: 10, warehouse: 'WH-A' },
    { name: 'Wireless Mouse Logitech', sku: 'ACC-MOU-001', category: 'Accessories', unitPrice: 899, currentStock: 200, minimumStock: 50, warehouse: 'WH-A' },
    { name: 'USB-C Hub 7-in-1', sku: 'ACC-HUB-001', category: 'Accessories', unitPrice: 2499, currentStock: 75, minimumStock: 20, warehouse: 'WH-A' },
    { name: 'Office Chair Ergonomic', sku: 'FUR-CHA-001', category: 'Furniture', unitPrice: 8500, currentStock: 30, minimumStock: 5, warehouse: 'WH-B' },
    { name: 'Standing Desk 120cm', sku: 'FUR-DES-001', category: 'Furniture', unitPrice: 12000, currentStock: 15, minimumStock: 3, warehouse: 'WH-B' },
    { name: 'A4 Paper Ream 500 sheets', sku: 'STN-PAP-001', category: 'Stationery', unitPrice: 350, currentStock: 500, minimumStock: 100, warehouse: 'WH-C' },
    { name: 'Ballpoint Pen Pack 10', sku: 'STN-PEN-001', category: 'Stationery', unitPrice: 120, currentStock: 8, minimumStock: 50, warehouse: 'WH-C' },
    { name: 'Whiteboard Marker Set', sku: 'STN-MRK-001', category: 'Stationery', unitPrice: 180, currentStock: 5, minimumStock: 30, warehouse: 'WH-C' },
    { name: 'Network Switch 24-Port', sku: 'NET-SWT-001', category: 'Networking', unitPrice: 15000, currentStock: 20, minimumStock: 5, warehouse: 'WH-A' },
    { name: 'Cat6 Ethernet Cable 305m', sku: 'NET-CAB-001', category: 'Networking', unitPrice: 4500, currentStock: 40, minimumStock: 10, warehouse: 'WH-A' },
    { name: 'HP LaserJet Printer', sku: 'PRN-HP-001', category: 'Electronics', unitPrice: 18500, currentStock: 12, minimumStock: 3, warehouse: 'WH-A' },
    { name: 'Toner Cartridge HP 85A', sku: 'PRN-TON-001', category: 'Accessories', unitPrice: 3200, currentStock: 3, minimumStock: 10, warehouse: 'WH-A' },
  ];

  const createdProducts = [];
  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
    createdProducts.push(product);
  }

  const movementCount = await prisma.stockMovement.count();
  if (movementCount === 0) {
    await prisma.stockMovement.createMany({
      data: [
        { productId: createdProducts[0].id, quantity: 50, type: 'IN', reason: 'Initial stock', createdBy: createdUsers.WAREHOUSE },
        { productId: createdProducts[1].id, quantity: 200, type: 'IN', reason: 'Initial stock', createdBy: createdUsers.WAREHOUSE },
        { productId: createdProducts[6].id, quantity: 100, type: 'IN', reason: 'Purchase received', createdBy: createdUsers.WAREHOUSE },
        { productId: createdProducts[6].id, quantity: 92, type: 'OUT', reason: 'Sales dispatch', createdBy: createdUsers.WAREHOUSE },
      ],
    });
  }

  const challanCount = await prisma.challan.count();
  if (challanCount === 0) {
    const draftChallan = await prisma.challan.create({
      data: {
        challanNumber: `CH-${new Date().getFullYear()}-0001`,
        customerId: createdCustomers[0].id,
        totalQuantity: 3,
        status: 'DRAFT',
        createdBy: createdUsers.SALES,
        items: {
          create: [
            {
              productId: createdProducts[0].id,
              productName: createdProducts[0].name,
              sku: createdProducts[0].sku,
              unitPrice: createdProducts[0].unitPrice,
              quantity: 2,
            },
            {
              productId: createdProducts[1].id,
              productName: createdProducts[1].name,
              sku: createdProducts[1].sku,
              unitPrice: createdProducts[1].unitPrice,
              quantity: 1,
            },
          ],
        },
      },
    });

    await prisma.challan.create({
      data: {
        challanNumber: `CH-${new Date().getFullYear()}-0002`,
        customerId: createdCustomers[1].id,
        totalQuantity: 5,
        status: 'CONFIRMED',
        createdBy: createdUsers.SALES,
        items: {
          create: [
            {
              productId: createdProducts[5].id,
              productName: createdProducts[5].name,
              sku: createdProducts[5].sku,
              unitPrice: createdProducts[5].unitPrice,
              quantity: 5,
            },
          ],
        },
      },
    });

    console.log(`Created sample challans including draft ${draftChallan.challanNumber}`);
  }

  if (createdCustomers[2]) {
    const followUpCount = await prisma.customerFollowUp.count({
      where: { customerId: createdCustomers[2].id },
    });
    if (followUpCount === 0) {
      await prisma.customerFollowUp.create({
        data: {
          customerId: createdCustomers[2].id,
          note: 'Initial contact made. Interested in bulk order.',
          followUpDate: new Date('2026-08-15'),
          createdBy: createdUsers.SALES,
        },
      });
    }
  }

  console.log('Seed completed successfully!');
  console.log('Demo development credentials:');
  console.log('  admin@erp.com / Admin@123');
  console.log('  sales@erp.com / Sales@123');
  console.log('  warehouse@erp.com / Warehouse@123');
  console.log('  accounts@erp.com / Accounts@123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
