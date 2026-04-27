import "dotenv/config";

import { createPrismaClient } from "../src/lib/create-prisma-client";
import { hashPassword } from "../src/utils/password";
import { normalizePhone } from "../src/utils/phone";

const connectionString = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is required to run prisma seed.");
}

const prisma = createPrismaClient(connectionString);

async function resetDatabase() {
  await prisma.whatsAppMessage.deleteMany();
  await prisma.whatsAppRatingSession.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.otpRequest.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.serviceBranch.deleteMany();
  await prisma.laundryService.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.appSetting.deleteMany();
}

async function seedAppSettings() {
  await prisma.appSetting.create({
    data: {
      id: 1,
      businessName: "LaundryPro",
      whatsappAutoNotifyEnabled: true,
      requestRatingEnabled: true,
      otpExpiryMinutes: 5,
      otpResendCooldownSeconds: 60,
    },
  });
}

async function seedBranches() {
  await prisma.branch.createMany({
    data: [
      {
        id: "branch-1",
        name: "Cabang Menteng",
        address: "Jl. Menteng Raya No. 12, Jakarta Pusat",
        phone: "021-3456789",
        hours: "07:00 - 21:00",
        status: "active",
      },
      {
        id: "branch-2",
        name: "Cabang Kemang",
        address: "Jl. Kemang Raya No. 45, Jakarta Selatan",
        phone: "021-7890123",
        hours: "08:00 - 22:00",
        status: "active",
      },
      {
        id: "branch-3",
        name: "Cabang Kelapa Gading",
        address: "Jl. Boulevard Raya No. 78, Jakarta Utara",
        phone: "021-4567890",
        hours: "07:00 - 21:00",
        status: "active",
      },
      {
        id: "branch-4",
        name: "Cabang BSD",
        address: "Jl. BSD Raya No. 23, Tangerang Selatan",
        phone: "021-5678901",
        hours: "08:00 - 21:00",
        status: "inactive",
      },
    ],
  });
}

async function seedUsers() {
  await prisma.user.createMany({
    data: [
      {
        id: "1",
        name: "Ahmad Rizki",
        email: "admin@laundry.com",
        phone: "085157028633",
        normalizedPhone: normalizePhone("085157028633"),
        role: "super_admin",
        status: "active",
        passwordHash: await hashPassword("admin123"),
        avatar: "AR",
      },
      {
        id: "2",
        name: "Budi Santoso",
        email: "staff@laundry.com",
        phone: "089900000002",
        normalizedPhone: normalizePhone("089900000002"),
        role: "staff_pos",
        status: "active",
        passwordHash: await hashPassword("staff123"),
        avatar: "BS",
        branchId: "branch-1",
      },
      {
        id: "3",
        name: "Citra Dewi",
        email: "citra@laundry.com",
        phone: "089900000003",
        normalizedPhone: normalizePhone("089900000003"),
        role: "staff_pos",
        status: "active",
        passwordHash: await hashPassword("staff123"),
        avatar: "CD",
        branchId: "branch-1",
      },
      {
        id: "4",
        name: "Dian Permana",
        email: "dian@laundry.com",
        phone: "089900000004",
        normalizedPhone: normalizePhone("089900000004"),
        role: "staff_pos",
        status: "active",
        passwordHash: await hashPassword("staff123"),
        avatar: "DP",
        branchId: "branch-2",
      },
    ],
  });
}

async function seedServices() {
  const services = [
    {
      id: "svc-1",
      name: "Cuci Kering",
      category: "Reguler",
      price: 7000,
      unit: "kg",
      durationLabel: "2 hari",
      estimatedDurationHours: 48,
      status: "active" as const,
    },
    {
      id: "svc-2",
      name: "Cuci Setrika",
      category: "Reguler",
      price: 10000,
      unit: "kg",
      durationLabel: "2 hari",
      estimatedDurationHours: 48,
      status: "active" as const,
    },
    {
      id: "svc-3",
      name: "Setrika Saja",
      category: "Reguler",
      price: 5000,
      unit: "kg",
      durationLabel: "1 hari",
      estimatedDurationHours: 24,
      status: "active" as const,
    },
    {
      id: "svc-4",
      name: "Express Service",
      category: "Express",
      price: 20000,
      unit: "kg",
      durationLabel: "6 jam",
      estimatedDurationHours: 6,
      status: "active" as const,
    },
    {
      id: "svc-5",
      name: "Laundry Sepatu",
      category: "Spesial",
      price: 35000,
      unit: "pasang",
      durationLabel: "3 hari",
      estimatedDurationHours: 72,
      status: "active" as const,
    },
    {
      id: "svc-6",
      name: "Laundry Bed Cover",
      category: "Spesial",
      price: 45000,
      unit: "pcs",
      durationLabel: "3 hari",
      estimatedDurationHours: 72,
      status: "active" as const,
    },
    {
      id: "svc-7",
      name: "Laundry Karpet",
      category: "Spesial",
      price: 50000,
      unit: "m2",
      durationLabel: "4 hari",
      estimatedDurationHours: 96,
      status: "active" as const,
    },
  ];

  for (const service of services) {
    await prisma.laundryService.create({
      data: {
        ...service,
        branchLinks: {
          createMany: {
            data: ["branch-1", "branch-2", "branch-3"].map((branchId) => ({ branchId })),
          },
        },
      },
    });
  }
}

async function seedCustomersAndOrders() {
  const customers = [
    {
      id: "customer-1",
      name: "Siti Rahayu",
      phone: "08123456789",
    },
    {
      id: "customer-2",
      name: "Andi Wijaya",
      phone: "08234567890",
    },
    {
      id: "customer-3",
      name: "Dewi Kartika",
      phone: "08345678901",
    },
    {
      id: "customer-4",
      name: "Rudi Hermawan",
      phone: "08456789012",
    },
    {
      id: "customer-5",
      name: "Maya Putri",
      phone: "08567890123",
    },
  ];

  await prisma.customer.createMany({
    data: customers.map((customer) => ({
      ...customer,
      normalizedPhone: normalizePhone(customer.phone),
    })),
  });

  await prisma.order.create({
    data: {
      id: "ord-1",
      code: "LD-20250411-001",
      customerId: "customer-1",
      branchId: "branch-1",
      createdByUserId: "2",
      customerName: "Siti Rahayu",
      customerPhone: "08123456789",
      normalizedCustomerPhone: normalizePhone("08123456789"),
      paymentMethod: "Cash",
      status: "Dicuci",
      subtotalAmount: 35000,
      totalAmount: 35000,
      estimatedDoneAt: new Date("2025-04-13T08:30:00"),
      createdAt: new Date("2025-04-11T08:30:00"),
      items: {
        create: [
          {
            serviceId: "svc-2",
            serviceName: "Cuci Setrika",
            qty: 3.5,
            unit: "kg",
            price: 10000,
            subtotal: 35000,
          },
        ],
      },
      statusHistories: {
        create: [
          { status: "Baru Masuk", createdAt: new Date("2025-04-11T08:30:00"), changedByUserId: "2" },
          { status: "Diproses", createdAt: new Date("2025-04-11T09:00:00"), changedByUserId: "2" },
          { status: "Dicuci", createdAt: new Date("2025-04-11T10:00:00"), changedByUserId: "2" },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      id: "ord-2",
      code: "LD-20250411-002",
      customerId: "customer-2",
      branchId: "branch-1",
      createdByUserId: "2",
      customerName: "Andi Wijaya",
      customerPhone: "08234567890",
      normalizedCustomerPhone: normalizePhone("08234567890"),
      paymentMethod: "Transfer",
      status: "Siap Diambil",
      subtotalAmount: 40000,
      totalAmount: 40000,
      estimatedDoneAt: new Date("2025-04-11T13:00:00"),
      createdAt: new Date("2025-04-11T07:00:00"),
      items: {
        create: [
          {
            serviceId: "svc-4",
            serviceName: "Express Service",
            qty: 2,
            unit: "kg",
            price: 20000,
            subtotal: 40000,
          },
        ],
      },
      statusHistories: {
        create: [
          { status: "Baru Masuk", createdAt: new Date("2025-04-11T07:00:00"), changedByUserId: "2" },
          { status: "Diproses", createdAt: new Date("2025-04-11T07:15:00"), changedByUserId: "2" },
          { status: "Dicuci", createdAt: new Date("2025-04-11T08:00:00"), changedByUserId: "2" },
          { status: "Dikeringkan", createdAt: new Date("2025-04-11T10:00:00"), changedByUserId: "2" },
          { status: "Disetrika", createdAt: new Date("2025-04-11T11:30:00"), changedByUserId: "2" },
          { status: "Siap Diambil", createdAt: new Date("2025-04-11T12:30:00"), changedByUserId: "2" },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      id: "ord-3",
      code: "LD-20250410-003",
      customerId: "customer-3",
      branchId: "branch-2",
      createdByUserId: "4",
      customerName: "Dewi Kartika",
      customerPhone: "08345678901",
      normalizedCustomerPhone: normalizePhone("08345678901"),
      paymentMethod: "QRIS",
      status: "Disetrika",
      subtotalAmount: 95000,
      totalAmount: 95000,
      estimatedDoneAt: new Date("2025-04-13T14:00:00"),
      createdAt: new Date("2025-04-10T14:00:00"),
      items: {
        create: [
          {
            serviceId: "svc-2",
            serviceName: "Cuci Setrika",
            qty: 5,
            unit: "kg",
            price: 10000,
            subtotal: 50000,
          },
          {
            serviceId: "svc-6",
            serviceName: "Laundry Bed Cover",
            qty: 1,
            unit: "pcs",
            price: 45000,
            subtotal: 45000,
          },
        ],
      },
      statusHistories: {
        create: [
          { status: "Baru Masuk", createdAt: new Date("2025-04-10T14:00:00"), changedByUserId: "4" },
          { status: "Diproses", createdAt: new Date("2025-04-10T14:30:00"), changedByUserId: "4" },
          { status: "Dicuci", createdAt: new Date("2025-04-10T16:00:00"), changedByUserId: "4" },
          { status: "Dikeringkan", createdAt: new Date("2025-04-11T08:00:00"), changedByUserId: "4" },
          { status: "Disetrika", createdAt: new Date("2025-04-11T10:00:00"), changedByUserId: "4" },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      id: "ord-4",
      code: "LD-20250411-004",
      customerId: "customer-4",
      branchId: "branch-3",
      customerName: "Rudi Hermawan",
      customerPhone: "08456789012",
      normalizedCustomerPhone: normalizePhone("08456789012"),
      paymentMethod: "Cash",
      status: "Baru Masuk",
      subtotalAmount: 70000,
      totalAmount: 70000,
      estimatedDoneAt: new Date("2025-04-14T11:00:00"),
      createdAt: new Date("2025-04-11T11:00:00"),
      items: {
        create: [
          {
            serviceId: "svc-5",
            serviceName: "Laundry Sepatu",
            qty: 2,
            unit: "pasang",
            price: 35000,
            subtotal: 70000,
          },
        ],
      },
      statusHistories: {
        create: [
          { status: "Baru Masuk", createdAt: new Date("2025-04-11T11:00:00"), changedByUserId: "1" },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      id: "ord-5",
      code: "LD-20250409-005",
      customerId: "customer-5",
      branchId: "branch-1",
      createdByUserId: "2",
      customerName: "Maya Putri",
      customerPhone: "08567890123",
      normalizedCustomerPhone: normalizePhone("08567890123"),
      paymentMethod: "Cash",
      status: "Sudah Diambil",
      subtotalAmount: 28000,
      totalAmount: 28000,
      estimatedDoneAt: new Date("2025-04-11T09:00:00"),
      pickedUpAt: new Date("2025-04-10T17:00:00"),
      createdAt: new Date("2025-04-09T09:00:00"),
      items: {
        create: [
          {
            serviceId: "svc-1",
            serviceName: "Cuci Kering",
            qty: 4,
            unit: "kg",
            price: 7000,
            subtotal: 28000,
          },
        ],
      },
      statusHistories: {
        create: [
          { status: "Baru Masuk", createdAt: new Date("2025-04-09T09:00:00"), changedByUserId: "2" },
          { status: "Diproses", createdAt: new Date("2025-04-09T09:30:00"), changedByUserId: "2" },
          { status: "Dicuci", createdAt: new Date("2025-04-09T11:00:00"), changedByUserId: "2" },
          { status: "Dikeringkan", createdAt: new Date("2025-04-09T15:00:00"), changedByUserId: "2" },
          { status: "Disetrika", createdAt: new Date("2025-04-10T08:00:00"), changedByUserId: "2" },
          { status: "Siap Diambil", createdAt: new Date("2025-04-10T10:00:00"), changedByUserId: "2" },
          { status: "Sudah Diambil", createdAt: new Date("2025-04-10T17:00:00"), changedByUserId: "2" },
        ],
      },
    },
  });

  await prisma.whatsAppMessage.createMany({
    data: [
      {
        type: "order_status_ready",
        direction: "outbound",
        targetPhone: "08234567890",
        normalizedPhone: normalizePhone("08234567890"),
        message: "Order siap diambil",
        orderId: "ord-2",
        userId: "2",
        providerMessageId: "seed-msg-ord-2",
        status: "delivered",
        sentAt: new Date("2025-04-11T12:31:00"),
        deliveredAt: new Date("2025-04-11T12:33:00"),
      },
      {
        type: "order_status_completed",
        direction: "outbound",
        targetPhone: "08567890123",
        normalizedPhone: normalizePhone("08567890123"),
        message: "Order sudah diambil",
        orderId: "ord-5",
        userId: "2",
        providerMessageId: "seed-msg-ord-5",
        status: "delivered",
        sentAt: new Date("2025-04-10T17:01:00"),
        deliveredAt: new Date("2025-04-10T17:02:00"),
      },
    ],
  });

  await prisma.rating.createMany({
    data: [
      {
        id: "r-1",
        orderId: "ord-2",
        customerId: "customer-2",
        branchId: "branch-1",
        customerName: "Andi Wijaya",
        branchName: "Cabang Menteng",
        rating: 5,
        feedback: "Pelayanan sangat cepat dan bersih!",
        createdAt: new Date("2025-04-11T13:00:00"),
      },
      {
        id: "r-2",
        orderId: "ord-5",
        customerId: "customer-5",
        branchId: "branch-1",
        customerName: "Maya Putri",
        branchName: "Cabang Menteng",
        rating: 4,
        feedback: "Bersih, tapi agak lama.",
        createdAt: new Date("2025-04-10T18:00:00"),
      },
      {
        id: "r-3",
        customerName: "Lisa Permata",
        branchId: "branch-2",
        branchName: "Cabang Kemang",
        rating: 5,
        feedback: "Wangi dan rapi. Sangat puas!",
        createdAt: new Date("2025-04-10T15:00:00"),
      },
      {
        id: "r-4",
        customerName: "Hendra Gunawan",
        branchId: "branch-3",
        branchName: "Cabang Kelapa Gading",
        rating: 3,
        feedback: "Ada baju yang masih kotor.",
        createdAt: new Date("2025-04-09T19:00:00"),
      },
      {
        id: "r-5",
        customerName: "Oka Surya",
        branchId: "branch-2",
        branchName: "Cabang Kemang",
        rating: 2,
        feedback: "Baju kusut, tidak disetrika dengan baik.",
        createdAt: new Date("2025-04-08T16:00:00"),
      },
    ],
  });
}

async function main() {
  await resetDatabase();
  await seedAppSettings();
  await seedBranches();
  await seedUsers();
  await seedServices();
  await seedCustomersAndOrders();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
