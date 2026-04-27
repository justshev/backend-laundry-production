import { type Prisma } from "@prisma/client";

import { buildDateRange, endOfDay, formatDateKey, startOfDay } from "../../utils/datetime";
import { reportModel } from "./report.model";

interface Actor {
  role: "super_admin" | "staff_pos";
  branchId: string | null;
}

interface Filters {
  branchId?: string;
  exactDate?: string;
  startDate?: string;
  endDate?: string;
}

function getScopedBranchId(actor: Actor, branchId?: string) {
  return actor.role === "staff_pos" ? actor.branchId ?? undefined : branchId;
}

function buildOrdersWhere(actor: Actor, filters: Filters): Prisma.OrderWhereInput {
  const dateRange = buildDateRange(filters);
  const scopedBranchId = getScopedBranchId(actor, filters.branchId);

  return {
    ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
    ...(dateRange.gte || dateRange.lte
      ? {
          createdAt: {
            ...(dateRange.gte ? { gte: dateRange.gte } : {}),
            ...(dateRange.lte ? { lte: dateRange.lte } : {}),
          },
        }
      : {}),
  };
}

function buildRatingsWhere(actor: Actor, filters: Filters): Prisma.RatingWhereInput {
  const dateRange = buildDateRange(filters);
  const scopedBranchId = getScopedBranchId(actor, filters.branchId);

  return {
    ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
    ...(dateRange.gte || dateRange.lte
      ? {
          createdAt: {
            ...(dateRange.gte ? { gte: dateRange.gte } : {}),
            ...(dateRange.lte ? { lte: dateRange.lte } : {}),
          },
        }
      : {}),
  };
}

function summarizeOrders(orders: Array<{ totalAmount: number; status: string }>) {
  const completed = orders.filter((order) => order.status === "Sudah Diambil");
  const ongoing = orders.filter((order) => order.status !== "Sudah Diambil");

  return {
    totalTransactions: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    completedOrders: completed.length,
    completedRevenue: completed.reduce((sum, order) => sum + order.totalAmount, 0),
    ongoingOrders: ongoing.length,
    ongoingRevenue: ongoing.reduce((sum, order) => sum + order.totalAmount, 0),
  };
}

function groupRevenueByDay(
  orders: Array<{ createdAt: Date; totalAmount: number }>,
  days = 7,
) {
  const now = new Date();
  const grouped = new Map<string, { label: string; revenue: number; orders: number }>();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    const key = formatDateKey(date);
    const label = date.toLocaleDateString("id-ID", { weekday: "short" });
    grouped.set(key, { label, revenue: 0, orders: 0 });
  }

  for (const order of orders) {
    const key = formatDateKey(order.createdAt);
    const current = grouped.get(key);
    if (!current) continue;

    current.revenue += order.totalAmount;
    current.orders += 1;
  }

  return Array.from(grouped.values()).map((item) => ({
    name: item.label,
    revenue: item.revenue,
    orders: item.orders,
  }));
}

function groupOrderTrendByWeek(orders: Array<{ createdAt: Date }>) {
  const now = new Date();
  const result = [0, 0, 0, 0];

  for (const order of orders) {
    const diffDays = Math.floor(
      (endOfDay(now).getTime() - startOfDay(order.createdAt).getTime()) /
        (24 * 60 * 60 * 1000),
    );

    if (diffDays < 0 || diffDays >= 28) {
      continue;
    }

    const bucket = 3 - Math.floor(diffDays / 7);
    result[bucket] += 1;
  }

  return result.map((count, index) => ({
    name: `W${index + 1}`,
    orders: count,
  }));
}

function groupRevenueByBranch(
  orders: Array<{ totalAmount: number; branchId: string; branch: { name: string } }>,
) {
  const grouped = new Map<string, { branchId: string; branchName: string; orders: number; revenue: number }>();

  for (const order of orders) {
    const current = grouped.get(order.branchId) ?? {
      branchId: order.branchId,
      branchName: order.branch.name,
      orders: 0,
      revenue: 0,
    };
    current.orders += 1;
    current.revenue += order.totalAmount;
    grouped.set(order.branchId, current);
  }

  return Array.from(grouped.values()).sort((a, b) => b.revenue - a.revenue);
}

function groupServicePopularity(
  orders: Array<{
    items: Array<{ serviceName: string; qty: number; subtotal: number }>;
  }>,
) {
  const grouped = new Map<string, { name: string; count: number; revenue: number }>();

  for (const order of orders) {
    for (const item of order.items) {
      const current = grouped.get(item.serviceName) ?? {
        name: item.serviceName,
        count: 0,
        revenue: 0,
      };
      current.count += item.qty;
      current.revenue += item.subtotal;
      grouped.set(item.serviceName, current);
    }
  }

  return Array.from(grouped.values()).sort((a, b) => b.count - a.count);
}

export const reportService = {
  async getDashboard(actor: Actor) {
    const [orders, ratings, branches] = await Promise.all([
      reportModel.getOrders(buildOrdersWhere(actor, {})),
      reportModel.getRatings(buildRatingsWhere(actor, {})),
      reportModel.getBranches(),
    ]);

    const today = buildDateRange({ exactDate: new Date().toISOString().slice(0, 10) });
    const todayRevenue = orders
      .filter(
        (order) =>
          (!today.gte || order.createdAt >= today.gte) &&
          (!today.lte || order.createdAt <= today.lte),
      )
      .reduce((sum, order) => sum + order.totalAmount, 0);

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
        : 0;

    const uniqueCustomers = new Set(orders.map((order) => order.normalizedCustomerPhone));
    const scopedBranchPerformance = branches
      .filter((branch) => branch.status === "active")
      .filter((branch) => actor.role === "super_admin" || branch.id === actor.branchId)
      .map((branch) => ({
        id: branch.id,
        name: branch.name,
        status: branch.status,
        staffCount: branch._count.staff,
        transactionCount: branch._count.orders,
      }));

    return {
      summary: {
        todayRevenue,
        activeOrders: orders.filter((order) => order.status !== "Sudah Diambil").length,
        totalCustomers: uniqueCustomers.size,
        averageRating: Number(averageRating.toFixed(1)),
      },
      revenueChart: groupRevenueByDay(orders),
      orderTrendChart: groupOrderTrendByWeek(orders),
      recentOrders: orders.slice(0, 5).map((order) => ({
        id: order.id,
        code: order.code,
        customerName: order.customerName,
        status: order.status,
        totalPrice: order.totalAmount,
      })),
      branchPerformance: scopedBranchPerformance,
      recentRatings: ratings.slice(0, 4).map((rating) => ({
        id: rating.id,
        customerName: rating.customerName,
        branchName: rating.branchName,
        rating: rating.rating,
        feedback: rating.feedback ?? null,
        createdAt: rating.createdAt.toISOString(),
      })),
    };
  },

  async getFinancialReport(actor: Actor, filters: Filters) {
    const orders = await reportModel.getOrders(buildOrdersWhere(actor, filters));
    const summary = summarizeOrders(orders);

    return {
      summary,
      dailyRevenue: groupRevenueByDay(orders, 14),
      branchRevenue: groupRevenueByBranch(orders).map((item) => ({
        name: item.branchName.replace("Cabang ", ""),
        revenue: item.revenue,
        orders: item.orders,
      })),
      recentTransactions: orders.slice(0, 5).map((order) => ({
        id: order.id,
        code: order.code,
        customerName: order.customerName,
        branchName: order.branch.name,
        totalPrice: order.totalAmount,
        paymentMethod: order.paymentMethod,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      })),
    };
  },

  async getAnalyticsReport(actor: Actor, filters: Filters) {
    const [orders, ratings] = await Promise.all([
      reportModel.getOrders(buildOrdersWhere(actor, filters)),
      reportModel.getRatings(buildRatingsWhere(actor, filters)),
    ]);

    const orderSummary = summarizeOrders(orders);
    const uniqueCustomers = new Set(orders.map((order) => order.normalizedCustomerPhone));
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length
        : 0;
    const branchPerformance = groupRevenueByBranch(orders).map((branch) => {
      const branchRatings = ratings.filter((rating) => rating.branchId === branch.branchId);
      const branchAverageRating =
        branchRatings.length > 0
          ? branchRatings.reduce((sum, item) => sum + item.rating, 0) / branchRatings.length
          : 0;

      return {
        id: branch.branchId,
        name: branch.branchName,
        transactions: branch.orders,
        revenue: branch.revenue,
        rating: Number(branchAverageRating.toFixed(1)),
      };
    });

    return {
      summary: {
        totalTransactions: orderSummary.totalTransactions,
        uniqueCustomers: uniqueCustomers.size,
        totalRevenue: orderSummary.totalRevenue,
        averageRating: Number(averageRating.toFixed(1)),
      },
      servicePopularity: groupServicePopularity(orders),
      orderStatusData: [
        { name: "Selesai", value: orderSummary.completedOrders },
        { name: "Berjalan", value: orderSummary.ongoingOrders },
      ],
      branchPerformance,
      ratings: ratings.map((rating) => ({
        id: rating.id,
        orderId: rating.orderId,
        customerName: rating.customerName,
        branchName: rating.branchName,
        rating: rating.rating,
        feedback: rating.feedback ?? null,
        createdAt: rating.createdAt.toISOString(),
      })),
    };
  },
};
