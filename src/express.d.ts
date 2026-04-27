import type { AccountStatus, UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        name: string;
        email: string;
        phone: string;
        role: UserRole;
        status: AccountStatus;
        avatar: string;
        branchId: string | null;
        branchName: string | null;
      };
    }
  }
}

export {};
