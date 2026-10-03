import { requireUser } from "@/lib/current-user";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import DailyAverageConfig from "@/models/DailyAverageConfig";

export async function GET() {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    await dbConnect();
    const config = await DailyAverageConfig.findOne(owner.scope);
    return NextResponse.json(config || { selectedCategories: [] });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch configuration", details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const { selectedCategories } = await request.json();
    if (!Array.isArray(selectedCategories) || selectedCategories.some(value => typeof value !== "string")) {
      return NextResponse.json({ error: "selectedCategories must be an array of strings" }, { status: 400 });
    }

    await dbConnect();
    const ownedCategories = await Category.find(owner.scope).select("_id").lean();
    const allowed = new Set(ownedCategories.map(category => String(category._id)));
    if (selectedCategories.some(value => !allowed.has(value))) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    const updatedConfig = await DailyAverageConfig.findOneAndUpdate(
      owner.scope,
      { selectedCategories, userId: owner.id, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json(updatedConfig);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to save configuration", details: error.message }, { status: 500 });
  }
}
