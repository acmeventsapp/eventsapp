"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { buildAdminEmailVerificationEmail, sendEmail } from "@/lib/send-email";
import { setAuthCookie, getSession, signToken } from "@/utils/auth";
import {
  ChangeAdminPasswordSchema,
  RequestAdminEmailChangeSchema,
  UpdateAdminNameSchema,
  UpdateAdminRoleSchema,
  VerifyAdminEmailChangeSchema,
} from "@/validators/schemas/admin-settings";
import type { AdminRole } from "@prisma/client";

const VERIFICATION_TTL_MS = 15 * 60 * 1000;

export interface AdminProfileUI {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  pendingEmail: string | null;
  emailVerificationPending: boolean;
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function requireAuthenticatedAdmin() {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" as const };
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.adminId },
  });

  if (!admin) {
    return { error: "Unauthorized" as const };
  }

  return { admin, session };
}

async function refreshAdminSession(admin: {
  id: string;
  email: string;
  role: AdminRole;
}) {
  const token = await signToken({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  });
  await setAuthCookie(token);
}

function toAdminProfileUI(admin: {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  pendingEmail: string | null;
  emailVerificationExpiresAt: Date | null;
}): AdminProfileUI {
  const emailVerificationPending = Boolean(
    admin.pendingEmail &&
      admin.emailVerificationExpiresAt &&
      admin.emailVerificationExpiresAt > new Date()
  );

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    pendingEmail: admin.pendingEmail,
    emailVerificationPending,
  };
}

export async function getAdminProfile(): Promise<AdminProfileUI | null> {
  const auth = await requireAuthenticatedAdmin();
  if ("error" in auth) return null;
  return toAdminProfileUI(auth.admin);
}

export async function updateAdminName(input: { name: string }) {
  try {
    const parsed = UpdateAdminNameSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid name",
      };
    }

    const auth = await requireAuthenticatedAdmin();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const admin = await prisma.admin.update({
      where: { id: auth.admin.id },
      data: { name: parsed.data.name },
    });

    await refreshAdminSession(admin);

    return { success: true as const, data: toAdminProfileUI(admin) };
  } catch (error) {
    console.error("updateAdminName", error);
    return { success: false as const, error: "Failed to update name" };
  }
}

export async function requestAdminEmailChange(input: { email: string }) {
  try {
    const parsed = RequestAdminEmailChangeSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid email",
      };
    }

    const auth = await requireAuthenticatedAdmin();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const nextEmail = parsed.data.email.toLowerCase();

    if (nextEmail === auth.admin.email.toLowerCase()) {
      return { success: false as const, error: "That is already your current email" };
    }

    const existing = await prisma.admin.findUnique({ where: { email: nextEmail } });
    if (existing && existing.id !== auth.admin.id) {
      return { success: false as const, error: "That email is already in use" };
    }

    const code = generateVerificationCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

    await prisma.admin.update({
      where: { id: auth.admin.id },
      data: {
        pendingEmail: nextEmail,
        emailVerificationCodeHash: codeHash,
        emailVerificationExpiresAt: expiresAt,
      },
    });

    await sendEmail({
      to: nextEmail,
      subject: "Verify your new ACM admin email",
      html: buildAdminEmailVerificationEmail({
        name: auth.admin.name,
        code,
        expiresMinutes: 15,
      }),
    });

    return { success: true as const, data: { pendingEmail: nextEmail } };
  } catch (error) {
    console.error("requestAdminEmailChange", error);
    return { success: false as const, error: "Failed to send verification email" };
  }
}

export async function verifyAdminEmailChange(input: { code: string }) {
  try {
    const parsed = VerifyAdminEmailChangeSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid verification code",
      };
    }

    const auth = await requireAuthenticatedAdmin();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const admin = auth.admin;

    if (!admin.pendingEmail || !admin.emailVerificationCodeHash || !admin.emailVerificationExpiresAt) {
      return { success: false as const, error: "No pending email change found" };
    }

    if (admin.emailVerificationExpiresAt < new Date()) {
      return { success: false as const, error: "Verification code has expired" };
    }

    const valid = await bcrypt.compare(parsed.data.code, admin.emailVerificationCodeHash);
    if (!valid) {
      return { success: false as const, error: "Invalid verification code" };
    }

    const updated = await prisma.admin.update({
      where: { id: admin.id },
      data: {
        email: admin.pendingEmail,
        pendingEmail: null,
        emailVerificationCodeHash: null,
        emailVerificationExpiresAt: null,
      },
    });

    await refreshAdminSession(updated);

    return { success: true as const, data: toAdminProfileUI(updated) };
  } catch (error) {
    console.error("verifyAdminEmailChange", error);
    return { success: false as const, error: "Failed to verify email" };
  }
}

export async function changeAdminPassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  try {
    const parsed = ChangeAdminPasswordSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid password data",
      };
    }

    const auth = await requireAuthenticatedAdmin();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const valid = await bcrypt.compare(
      parsed.data.currentPassword,
      auth.admin.passwordHash
    );
    if (!valid) {
      return { success: false as const, error: "Current password is incorrect" };
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);

    await prisma.admin.update({
      where: { id: auth.admin.id },
      data: { passwordHash },
    });

    await refreshAdminSession(auth.admin);

    return { success: true as const };
  } catch (error) {
    console.error("changeAdminPassword", error);
    return { success: false as const, error: "Failed to change password" };
  }
}

export async function updateAdminRole(input: { role: AdminRole }) {
  try {
    const parsed = UpdateAdminRoleSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid role",
      };
    }

    const auth = await requireAuthenticatedAdmin();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    if (auth.admin.role !== "SUPER_ADMIN") {
      return { success: false as const, error: "Only super admins can change roles" };
    }

    if (auth.admin.role === "SUPER_ADMIN" && parsed.data.role === "ADMIN") {
      const superAdminCount = await prisma.admin.count({
        where: { role: "SUPER_ADMIN" },
      });
      if (superAdminCount <= 1) {
        return {
          success: false as const,
          error: "You cannot remove the last super admin role",
        };
      }
    }

    const updated = await prisma.admin.update({
      where: { id: auth.admin.id },
      data: { role: parsed.data.role },
    });

    await refreshAdminSession(updated);

    return { success: true as const, data: toAdminProfileUI(updated) };
  } catch (error) {
    console.error("updateAdminRole", error);
    return { success: false as const, error: "Failed to update role" };
  }
}

export async function cancelAdminEmailChange() {
  try {
    const auth = await requireAuthenticatedAdmin();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const updated = await prisma.admin.update({
      where: { id: auth.admin.id },
      data: {
        pendingEmail: null,
        emailVerificationCodeHash: null,
        emailVerificationExpiresAt: null,
      },
    });

    return { success: true as const, data: toAdminProfileUI(updated) };
  } catch (error) {
    console.error("cancelAdminEmailChange", error);
    return { success: false as const, error: "Failed to cancel email change" };
  }
}
