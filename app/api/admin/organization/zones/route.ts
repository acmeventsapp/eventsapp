import { NextResponse } from "next/server";
import { createZone, getZones } from "@/data/organization";
import { ZoneSchema } from "@/validators/schemas/organization";

export async function GET() {
  try {
    const zones = await getZones();
    return NextResponse.json(zones);
  } catch (error) {
    console.error("GET /api/admin/organization/zones", error);
    return NextResponse.json({ error: "Failed to load zones" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ZoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    const result = await createZone(parsed.data);
    if (!result.success) {
      const status = result.error === "Unauthorized" ? 401 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/organization/zones", error);
    return NextResponse.json({ error: "Failed to create zone" }, { status: 500 });
  }
}
