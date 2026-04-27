import { createAuditLog } from "../../lib/audit";
import { AppError } from "../../utils/http-error";
import { branchModel } from "./branch.model";

function serializeBranch(branch: {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  status: "active" | "inactive";
  _count: {
    staff: number;
    orders: number;
  };
}) {
  return {
    id: branch.id,
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    hours: branch.hours,
    status: branch.status,
    staffCount: branch._count.staff,
    transactionCount: branch._count.orders,
  };
}

export const branchService = {
  async listBranches() {
    const branches = await branchModel.list();
    return branches.map(serializeBranch);
  },

  async createBranch(
    data: {
      name: string;
      address: string;
      phone: string;
      hours: string;
      status: "active" | "inactive";
    },
    actorUserId: string,
  ) {
    const existingBranch = await branchModel.findByName(data.name);
    if (existingBranch) {
      throw new AppError("Nama cabang sudah digunakan", 409);
    }

    const branch = await branchModel.create(data);

    await createAuditLog({
      actorUserId,
      action: "CREATE_BRANCH",
      entityType: "Branch",
      entityId: branch.id,
      description: `Cabang ${branch.name} dibuat`,
    });

    const createdBranch = await branchModel.findById(branch.id);
    if (!createdBranch) {
      throw new AppError("Cabang gagal dibuat", 500);
    }

    return serializeBranch(createdBranch);
  },

  async updateBranch(
    id: string,
    data: Partial<{
      name: string;
      address: string;
      phone: string;
      hours: string;
      status: "active" | "inactive";
    }>,
    actorUserId: string,
  ) {
    const branch = await branchModel.findById(id);
    if (!branch) {
      throw new AppError("Cabang tidak ditemukan", 404);
    }

    if (data.name && data.name !== branch.name) {
      const existingBranch = await branchModel.findByName(data.name);
      if (existingBranch) {
        throw new AppError("Nama cabang sudah digunakan", 409);
      }
    }

    const updatedBranch = await branchModel.update(id, data);

    await createAuditLog({
      actorUserId,
      action: "UPDATE_BRANCH",
      entityType: "Branch",
      entityId: id,
      description: `Cabang ${updatedBranch.name} diperbarui`,
    });

    return serializeBranch(updatedBranch);
  },
};
