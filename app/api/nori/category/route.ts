import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";

export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find({}).sort({ order: 1, createdAt: -1 });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { orders } = await request.json(); // Array of { id: string, order: number }
    console.time('start')
    if (!Array.isArray(orders)) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }
    console.time('dbConnect')
    await dbConnect();
    console.timeEnd('dbConnect')
    console.time('updates')
    // Bulk update orders
    const updates = orders.map((item: any) => 
      Category.findByIdAndUpdate(item.id, { order: item.order })
    );
    console.timeEnd('updates')
    console.time('promise')
    await Promise.all(updates);
    console.timeEnd('promise')
    console.timeEnd('start')
    return NextResponse.json({ message: "Order updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, icon, type = "expense" } = body;

    if (!name || !icon) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();
    const newCategory = new Category({
      name,
      icon,
      type,
    });

    const savedCategory = await newCategory.save();
    return NextResponse.json(savedCategory, { status: 201 });
  } catch (error: any) {
    console.error("SAVE CATEGORY ERROR:", error);
    return NextResponse.json({ error: "Failed to save category", details: error.message }, { status: 500 });
  }
}


