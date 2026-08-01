import { NextResponse } from "next/server";
import { createUnit, getUnits } from "@/data/organization";
import { UnitSchema } from "@/validators/schemas/organization";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get("zoneId") ?? undefined;
    const units = await getUnits(zoneId);
    return NextResponse.json(units);
  } catch (error) {
    console.error("GET /api/admin/organization/units", error);
    return NextResponse.json({ error: "Failed to load units" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = UnitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    const result = await createUnit(parsed.data);
    if (!result.success) {
      const status = result.error === "Unauthorized" ? 401 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/organization/units", error);
    return NextResponse.json({ error: "Failed to create unit" }, { status: 500 });
  }
}
