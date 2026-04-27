import { AppError } from "../../utils/http-error";
import { customerModel } from "./customer.model";

export const customerService = {
  async listCustomers(input: {
    scopeBranchId?: string | null;
    search?: string;
  }) {
    const customers = await customerModel.list(input.scopeBranchId);
    const search = input.search?.toLowerCase() ?? "";

    return customers
      .filter((customer) => customer.orders.length > 0)
      .map((customer) => {
        const latestOrder = customer.orders[0];
        const branches = Array.from(
          new Set(customer.orders.map((order) => order.branch.name)),
        );

        return {
          id: customer.id,
          name: customer.name ?? latestOrder?.customerName ?? "Pelanggan",
          phone: customer.phone,
          orderCount: customer.orders.length,
          lastOrder: latestOrder?.createdAt.toISOString() ?? null,
          branches,
        };
      })
      .filter(
        (customer) =>
          !search ||
          customer.name.toLowerCase().includes(search) ||
          customer.phone.includes(search),
      );
  },

  async getCustomerOrders(input: {
    customerId: string;
    scopeBranchId?: string | null;
  }) {
    const customer = await customerModel.findById(
      input.customerId,
      input.scopeBranchId,
    );

    if (!customer || customer.orders.length === 0) {
      throw new AppError("Customer tidak ditemukan", 404);
    }

    return {
      id: customer.id,
      name: customer.name ?? customer.orders[0]?.customerName ?? "Pelanggan",
      phone: customer.phone,
      orders: customer.orders.map((order) => ({
        id: order.id,
        code: order.code,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        status: order.status,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt.toISOString(),
        estimatedDoneAt: order.estimatedDoneAt?.toISOString() ?? null,
        branchId: order.branch.id,
        branchName: order.branch.name,
      })),
    };
  },
};
