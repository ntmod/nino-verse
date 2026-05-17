import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Budget from "@/models/Budget";

export async function GET() {
  try {
    await dbConnect();
    const budgets = await Budget.find({}).sort({ createdAt: -1 });
    return NextResponse.json(budgets);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, limit, icon, color } = body;

    if (!category || limit === undefined || !icon || !color) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();
    const newBudget = new Budget({
      category,
      limit: Number(limit),
      icon,
      color,
    });

    const savedBudget = await newBudget.save();
    return NextResponse.json(savedBudget, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save budget" }, { status: 500 });
  }
}

