import { NextResponse } from "next/server";
import { getArchdeaconry, upsertArchdeaconry } from "@/data/organization";
import { ArchdeaconrySchema } from "@/validators/schemas/organization";

export async function GET() {
  try {
    const archdeaconry = await getArchdeaconry();
    return NextResponse.json(archdeaconry);
  } catch (error) {
    console.error("GET /api/admin/organization/archdeaconry", error);
    return NextResponse.json(
      { error: "Failed to load archdeaconry" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = ArchdeaconrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    const result = await upsertArchdeaconry(parsed.data);
    if (!result.success) {
      const status = result.error === "Unauthorized" ? 401 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("PUT /api/admin/organization/archdeaconry", error);
    return NextResponse.json(
      { error: "Failed to save archdeaconry" },
      { status: 500 }
    );
  }
}
