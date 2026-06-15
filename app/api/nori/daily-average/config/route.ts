import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import DailyAverageConfig from "@/models/DailyAverageConfig";

export async function GET() {
  try {
    await dbConnect();
    const config = await DailyAverageConfig.findOne({});
    return NextResponse.json(config || { selectedCategories: [] });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch configuration", details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { selectedCategories } = await request.json();
    if (!Array.isArray(selectedCategories)) {
      return NextResponse.json({ error: "selectedCategories must be an array of strings" }, { status: 400 });
    }

    await dbConnect();
    const updatedConfig = await DailyAverageConfig.findOneAndUpdate(
      {},
      { selectedCategories, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json(updatedConfig);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to save configuration", details: error.message }, { status: 500 });
  }
}
