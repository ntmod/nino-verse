import { ownedReferences } from "@/lib/owned-references";
import { requireUser } from "@/lib/current-user";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Budget from "@/models/Budget";

export async function GET() {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    await dbConnect();
    const budgets = await Budget.find(owner.scope).sort({ createdAt: -1 });
    return NextResponse.json(budgets);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const body = await request.json();
    if (!await ownedReferences(body, owner.scope)) return NextResponse.json({ error: "Invalid category or payment method" }, { status: 400 });
    const { category, limit, icon, color } = body;

    if (!category || limit === undefined || !icon || !color) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();
    const newBudget = new Budget({
      userId: owner.id,
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

