import { createAuditLog } from "../../lib/audit";
import { AppError } from "../../utils/http-error";
import { serviceModel } from "./service.model";

function inferDurationHours(durationLabel: string) {
  const normalized = durationLabel.toLowerCase();

  if (normalized.includes("jam")) {
    const value = Number(normalized.replace(/[^\d]/g, ""));
    return Number.isFinite(value) && value > 0 ? value : 6;
  }

  if (normalized.includes("hari")) {
    const value = Number(normalized.replace(/[^\d]/g, ""));
    return Number.isFinite(value) && value > 0 ? value * 24 : 48;
  }

  return 48;
}

function serializeService(service: {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  durationLabel: string;
  estimatedDurationHours: number;
  status: "active" | "inactive";
  branchLinks: Array<{
    branchId: string;
    branch: {
      name: string;
    };
  }>;
}) {
  const availableBranches = service.branchLinks.map((link) => ({
    id: link.branchId,
    name: link.branch.name,
  }));

  return {
    id: service.id,
    name: service.name,
    category: service.category,
    price: service.price,
    unit: service.unit,
    duration: service.durationLabel,
    durationLabel: service.durationLabel,
    estimatedDurationHours: service.estimatedDurationHours,
    status: service.status,
    availableBranchIds: availableBranches.map((branch) => branch.id),
    availableBranches,
  };
}

export const serviceService = {
  async listServices() {
    const services = await serviceModel.list();
    return services.map(serializeService);
  },

  async createService(
    data: {
      name: string;
      category: string;
      price: number;
      unit: string;
      durationLabel?: string;
      duration?: string;
      estimatedDurationHours?: number;
      status: "active" | "inactive";
      availableBranchIds: string[];
    },
    actorUserId: string,
  ) {
    const durationLabel = data.durationLabel ?? data.duration;
    if (!durationLabel) {
      throw new AppError("Durasi layanan wajib diisi", 422);
    }

    const validBranchCount = await serviceModel.countBranches(data.availableBranchIds);
    if (validBranchCount !== data.availableBranchIds.length) {
      throw new AppError("Salah satu cabang layanan tidak ditemukan", 404);
    }

    const createdService = await serviceModel.create({
      name: data.name.trim(),
      category: data.category.trim(),
      price: data.price,
      unit: data.unit.trim(),
      durationLabel: durationLabel.trim(),
      estimatedDurationHours:
        data.estimatedDurationHours ?? inferDurationHours(durationLabel),
      status: data.status,
      availableBranchIds: data.availableBranchIds,
    });

    await createAuditLog({
      actorUserId,
      action: "CREATE_SERVICE",
      entityType: "LaundryService",
      entityId: createdService.id,
      description: `Layanan ${createdService.name} dibuat`,
    });

    return serializeService(createdService);
  },

  async updateService(
    id: string,
    data: Partial<{
      name: string;
      category: string;
      price: number;
      unit: string;
      durationLabel?: string;
      duration?: string;
      estimatedDurationHours?: number;
      status: "active" | "inactive";
      availableBranchIds: string[];
    }>,
    actorUserId: string,
  ) {
    const service = await serviceModel.findById(id);
    if (!service || service.deletedAt) {
      throw new AppError("Layanan tidak ditemukan", 404);
    }

    if (data.availableBranchIds) {
      const validBranchCount = await serviceModel.countBranches(data.availableBranchIds);
      if (validBranchCount !== data.availableBranchIds.length) {
        throw new AppError("Salah satu cabang layanan tidak ditemukan", 404);
      }
    }

    const durationLabel = data.durationLabel ?? data.duration;
    const updatedService = await serviceModel.update(id, {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.category ? { category: data.category.trim() } : {}),
      ...(typeof data.price === "number" ? { price: data.price } : {}),
      ...(data.unit ? { unit: data.unit.trim() } : {}),
      ...(durationLabel ? { durationLabel: durationLabel.trim() } : {}),
      ...(durationLabel || typeof data.estimatedDurationHours === "number"
        ? {
            estimatedDurationHours:
              data.estimatedDurationHours ?? inferDurationHours(durationLabel!),
          }
        : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.availableBranchIds
        ? { availableBranchIds: data.availableBranchIds }
        : {}),
    });

    await createAuditLog({
      actorUserId,
      action: "UPDATE_SERVICE",
      entityType: "LaundryService",
      entityId: id,
      description: `Layanan ${updatedService.name} diperbarui`,
    });

    return serializeService(updatedService);
  },

  async deleteService(id: string, actorUserId: string) {
    const service = await serviceModel.findById(id);
    if (!service || service.deletedAt) {
      throw new AppError("Layanan tidak ditemukan", 404);
    }

    const deletedService = await serviceModel.update(id, {
      status: "inactive",
      deletedAt: new Date(),
    });

    await createAuditLog({
      actorUserId,
      action: "DELETE_SERVICE",
      entityType: "LaundryService",
      entityId: id,
      description: `Layanan ${deletedService.name} dinonaktifkan`,
    });

    return {
      deleted: true,
    };
  },
};
