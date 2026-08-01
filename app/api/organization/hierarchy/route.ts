import { NextResponse } from "next/server";
import { getOrganizationHierarchy } from "@/data/organization";

export async function GET() {
  try {
    const hierarchy = await getOrganizationHierarchy();
    return NextResponse.json(hierarchy);
  } catch (error) {
    console.error("GET /api/organization/hierarchy", error);
    return NextResponse.json(
      { error: "Failed to load organization hierarchy" },
      { status: 500 }
    );
  }
}
