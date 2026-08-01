"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/utils/auth";
import {
  ArchdeaconrySchema,
  BranchSchema,
  UnitSchema,
  ZoneSchema,
  type ArchdeaconryFormValues,
  type BranchFormValues,
  type UnitFormValues,
  type ZoneFormValues,
} from "@/validators/schemas/organization";

async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" as const };
  }
  return { session };
}

export type ArchdeaconryUI = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ZoneUI = {
  id: string;
  name: string;
  archdeaconryId: string;
  unitCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type UnitUI = {
  id: string;
  name: string;
  zoneId: string;
  zoneName: string;
  branchCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type BranchUI = {
  id: string;
  name: string;
  unitId: string;
  unitName: string;
  zoneId: string;
  zoneName: string;
  createdAt: Date;
  updatedAt: Date;
};

export type OrgHierarchyZone = {
  id: string;
  name: string;
  units: {
    id: string;
    name: string;
    branches: {
      id: string;
      name: string;
    }[];
  }[];
};

export type OrgHierarchy = {
  archdeaconry: { id: string; name: string } | null;
  zones: OrgHierarchyZone[];
};

export async function getArchdeaconry(): Promise<ArchdeaconryUI | null> {
  const record = await prisma.archdeaconry.findFirst({
    orderBy: { createdAt: "asc" },
  });
  return record;
}

export async function upsertArchdeaconry(input: ArchdeaconryFormValues) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const parsed = ArchdeaconrySchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid archdeaconry data",
      };
    }

    const existing = await prisma.archdeaconry.findFirst({
      orderBy: { createdAt: "asc" },
    });

    const record = existing
      ? await prisma.archdeaconry.update({
          where: { id: existing.id },
          data: { name: parsed.data.name },
        })
      : await prisma.archdeaconry.create({
          data: { name: parsed.data.name },
        });

    return { success: true as const, data: record };
  } catch (error) {
    console.error("upsertArchdeaconry", error);
    return { success: false as const, error: "Failed to save archdeaconry" };
  }
}

export async function getZones(): Promise<ZoneUI[]> {
  const zones = await prisma.zone.findMany({
    include: { _count: { select: { units: true } } },
    orderBy: { name: "asc" },
  });

  return zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    archdeaconryId: zone.archdeaconryId,
    unitCount: zone._count.units,
    createdAt: zone.createdAt,
    updatedAt: zone.updatedAt,
  }));
}

export async function createZone(input: ZoneFormValues) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const parsed = ZoneSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid zone data",
      };
    }

    const archdeaconry = await prisma.archdeaconry.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!archdeaconry) {
      return {
        success: false as const,
        error: "Create the Archdeaconry first before adding zones",
      };
    }

    const zone = await prisma.zone.create({
      data: {
        name: parsed.data.name,
        archdeaconryId: archdeaconry.id,
      },
      include: { _count: { select: { units: true } } },
    });

    return {
      success: true as const,
      data: {
        id: zone.id,
        name: zone.name,
        archdeaconryId: zone.archdeaconryId,
        unitCount: zone._count.units,
        createdAt: zone.createdAt,
        updatedAt: zone.updatedAt,
      } satisfies ZoneUI,
    };
  } catch (error) {
    console.error("createZone", error);
    return { success: false as const, error: "Failed to create zone" };
  }
}

export async function updateZone(id: string, input: ZoneFormValues) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const parsed = ZoneSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid zone data",
      };
    }

    const zone = await prisma.zone.update({
      where: { id },
      data: { name: parsed.data.name },
      include: { _count: { select: { units: true } } },
    });

    return {
      success: true as const,
      data: {
        id: zone.id,
        name: zone.name,
        archdeaconryId: zone.archdeaconryId,
        unitCount: zone._count.units,
        createdAt: zone.createdAt,
        updatedAt: zone.updatedAt,
      } satisfies ZoneUI,
    };
  } catch (error) {
    console.error("updateZone", error);
    return { success: false as const, error: "Failed to update zone" };
  }
}

export async function deleteZone(id: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    await prisma.zone.delete({ where: { id } });
    return { success: true as const };
  } catch (error) {
    console.error("deleteZone", error);
    return { success: false as const, error: "Failed to delete zone" };
  }
}

export async function getUnits(zoneId?: string): Promise<UnitUI[]> {
  const units = await prisma.unit.findMany({
    where: zoneId ? { zoneId } : undefined,
    include: {
      zone: { select: { id: true, name: true } },
      _count: { select: { branches: true } },
    },
    orderBy: { name: "asc" },
  });

  return units.map((unit) => ({
    id: unit.id,
    name: unit.name,
    zoneId: unit.zoneId,
    zoneName: unit.zone.name,
    branchCount: unit._count.branches,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
  }));
}

export async function createUnit(input: UnitFormValues) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const parsed = UnitSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid unit data",
      };
    }

    const zone = await prisma.zone.findUnique({
      where: { id: parsed.data.zoneId },
    });
    if (!zone) {
      return { success: false as const, error: "Selected zone was not found" };
    }

    const unit = await prisma.unit.create({
      data: {
        name: parsed.data.name,
        zoneId: parsed.data.zoneId,
      },
      include: {
        zone: { select: { id: true, name: true } },
        _count: { select: { branches: true } },
      },
    });

    return {
      success: true as const,
      data: {
        id: unit.id,
        name: unit.name,
        zoneId: unit.zoneId,
        zoneName: unit.zone.name,
        branchCount: unit._count.branches,
        createdAt: unit.createdAt,
        updatedAt: unit.updatedAt,
      } satisfies UnitUI,
    };
  } catch (error) {
    console.error("createUnit", error);
    return { success: false as const, error: "Failed to create unit" };
  }
}

export async function updateUnit(id: string, input: UnitFormValues) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const parsed = UnitSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid unit data",
      };
    }

    const zone = await prisma.zone.findUnique({
      where: { id: parsed.data.zoneId },
    });
    if (!zone) {
      return { success: false as const, error: "Selected zone was not found" };
    }

    const unit = await prisma.unit.update({
      where: { id },
      data: {
        name: parsed.data.name,
        zoneId: parsed.data.zoneId,
      },
      include: {
        zone: { select: { id: true, name: true } },
        _count: { select: { branches: true } },
      },
    });

    return {
      success: true as const,
      data: {
        id: unit.id,
        name: unit.name,
        zoneId: unit.zoneId,
        zoneName: unit.zone.name,
        branchCount: unit._count.branches,
        createdAt: unit.createdAt,
        updatedAt: unit.updatedAt,
      } satisfies UnitUI,
    };
  } catch (error) {
    console.error("updateUnit", error);
    return { success: false as const, error: "Failed to update unit" };
  }
}

export async function deleteUnit(id: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    await prisma.unit.delete({ where: { id } });
    return { success: true as const };
  } catch (error) {
    console.error("deleteUnit", error);
    return { success: false as const, error: "Failed to delete unit" };
  }
}

export async function getBranches(unitId?: string): Promise<BranchUI[]> {
  const branches = await prisma.branch.findMany({
    where: unitId ? { unitId } : undefined,
    include: {
      unit: {
        select: {
          id: true,
          name: true,
          zone: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    unitId: branch.unitId,
    unitName: branch.unit.name,
    zoneId: branch.unit.zone.id,
    zoneName: branch.unit.zone.name,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
  }));
}

export async function createBranch(input: BranchFormValues) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const parsed = BranchSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid branch data",
      };
    }

    const unit = await prisma.unit.findUnique({
      where: { id: parsed.data.unitId },
      include: { zone: { select: { id: true, name: true } } },
    });
    if (!unit) {
      return { success: false as const, error: "Selected unit was not found" };
    }

    const branch = await prisma.branch.create({
      data: {
        name: parsed.data.name,
        unitId: parsed.data.unitId,
      },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
            zone: { select: { id: true, name: true } },
          },
        },
      },
    });

    return {
      success: true as const,
      data: {
        id: branch.id,
        name: branch.name,
        unitId: branch.unitId,
        unitName: branch.unit.name,
        zoneId: branch.unit.zone.id,
        zoneName: branch.unit.zone.name,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
      } satisfies BranchUI,
    };
  } catch (error) {
    console.error("createBranch", error);
    return { success: false as const, error: "Failed to create branch" };
  }
}

export async function updateBranch(id: string, input: BranchFormValues) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const parsed = BranchSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid branch data",
      };
    }

    const unit = await prisma.unit.findUnique({
      where: { id: parsed.data.unitId },
    });
    if (!unit) {
      return { success: false as const, error: "Selected unit was not found" };
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        name: parsed.data.name,
        unitId: parsed.data.unitId,
      },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
            zone: { select: { id: true, name: true } },
          },
        },
      },
    });

    return {
      success: true as const,
      data: {
        id: branch.id,
        name: branch.name,
        unitId: branch.unitId,
        unitName: branch.unit.name,
        zoneId: branch.unit.zone.id,
        zoneName: branch.unit.zone.name,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
      } satisfies BranchUI,
    };
  } catch (error) {
    console.error("updateBranch", error);
    return { success: false as const, error: "Failed to update branch" };
  }
}

export async function deleteBranch(id: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    await prisma.branch.delete({ where: { id } });
    return { success: true as const };
  } catch (error) {
    console.error("deleteBranch", error);
    return { success: false as const, error: "Failed to delete branch" };
  }
}

export async function getOrganizationHierarchy(): Promise<OrgHierarchy> {
  const archdeaconry = await prisma.archdeaconry.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      zones: {
        orderBy: { name: "asc" },
        include: {
          units: {
            orderBy: { name: "asc" },
            include: {
              branches: {
                orderBy: { name: "asc" },
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  if (!archdeaconry) {
    return { archdeaconry: null, zones: [] };
  }

  return {
    archdeaconry: { id: archdeaconry.id, name: archdeaconry.name },
    zones: archdeaconry.zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      units: zone.units.map((unit) => ({
        id: unit.id,
        name: unit.name,
        branches: unit.branches,
      })),
    })),
  };
}
