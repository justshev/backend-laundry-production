import { createAuditLog } from "../../lib/audit";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/http-error";
import { hashPassword } from "../../utils/password";
import { normalizePhone } from "../../utils/phone";
import { buildInitials, serializeUser } from "../../utils/user";
import { staffModel } from "./staff.model";

export const staffService = {
  async listStaff() {
    const staff = await staffModel.list();
    return staff.map(serializeUser);
  },

  async createStaff(
    data: {
      name: string;
      email: string;
      phone: string;
      password: string;
      role: "staff_pos";
      branchId: string;
      status: "active" | "inactive";
    },
    actorUserId: string,
  ) {
    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branch) {
      throw new AppError("Cabang tidak ditemukan", 404);
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    const normalizedPhone = normalizePhone(data.phone);
    const existingUser = await staffModel.findByEmailOrPhone({
      email: normalizedEmail,
      normalizedPhone,
    });

    if (existingUser) {
      throw new AppError("Email atau nomor telepon sudah digunakan", 409);
    }

    const createdStaff = await staffModel.create({
      name: data.name.trim(),
      email: normalizedEmail,
      phone: data.phone.trim(),
      normalizedPhone,
      passwordHash: await hashPassword(data.password),
      role: data.role,
      branchId: data.branchId,
      status: data.status,
      avatar: buildInitials(data.name),
    });

    await createAuditLog({
      actorUserId,
      action: "CREATE_STAFF",
      entityType: "User",
      entityId: createdStaff.id,
      description: `Staff ${createdStaff.email} dibuat`,
    });

    return serializeUser(createdStaff);
  },

  async updateStaff(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      password: string;
      branchId: string;
      status: "active" | "inactive";
    }>,
    actorUserId: string,
  ) {
    const staff = await staffModel.findById(id);
    if (!staff || staff.role !== "staff_pos") {
      throw new AppError("Staff tidak ditemukan", 404);
    }

    if (data.branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
      if (!branch) {
        throw new AppError("Cabang tidak ditemukan", 404);
      }
    }

    const nextEmail = data.email?.trim().toLowerCase();
    const nextPhone = data.phone ? normalizePhone(data.phone) : undefined;
    const duplicateUser = await staffModel.findByEmailOrPhone({
      email: nextEmail,
      normalizedPhone: nextPhone,
      excludeId: id,
    });

    if (duplicateUser) {
      throw new AppError("Email atau nomor telepon sudah digunakan", 409);
    }

    const updatedStaff = await staffModel.update(id, {
      ...(data.name ? { name: data.name.trim(), avatar: buildInitials(data.name) } : {}),
      ...(nextEmail ? { email: nextEmail } : {}),
      ...(data.phone ? { phone: data.phone.trim(), normalizedPhone: nextPhone } : {}),
      ...(data.password ? { passwordHash: await hashPassword(data.password) } : {}),
      ...(data.branchId ? { branchId: data.branchId } : {}),
      ...(data.status ? { status: data.status } : {}),
    });

    await createAuditLog({
      actorUserId,
      action: "UPDATE_STAFF",
      entityType: "User",
      entityId: id,
      description: `Staff ${updatedStaff.email} diperbarui`,
    });

    return serializeUser(updatedStaff);
  },
};
