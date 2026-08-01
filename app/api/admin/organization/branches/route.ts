import { NextResponse } from "next/server";
import { createBranch, getBranches } from "@/data/organization";
import { BranchSchema } from "@/validators/schemas/organization";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get("unitId") ?? undefined;
    const branches = await getBranches(unitId);
    return NextResponse.json(branches);
  } catch (error) {
    console.error("GET /api/admin/organization/branches", error);
    return NextResponse.json(
      { error: "Failed to load branches" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = BranchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    const result = await createBranch(parsed.data);
    if (!result.success) {
      const status = result.error === "Unauthorized" ? 401 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/organization/branches", error);
    return NextResponse.json(
      { error: "Failed to create branch" },
      { status: 500 }
    );
  }
}
