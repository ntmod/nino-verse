import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FixedCost from "@/models/FixedCost";

export async function GET() {
  try {
    await dbConnect();
    const fixedCosts = await FixedCost.find({}).sort({ order: 1, createdAt: -1 });
    return NextResponse.json(fixedCosts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch fixed costs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, amount, category, paymentMethod, order } = body;

    if (!name || amount === undefined || !category || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();
    const newFixedCost = new FixedCost({
      name,
      amount: Number(amount),
      category,
      paymentMethod,
      order: order || 0,
    });

    console.log(newFixedCost);

    const savedFixedCost = await newFixedCost.save();
    return NextResponse.json(savedFixedCost, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Failed to save fixed cost" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orders } = body;

    if (!Array.isArray(orders)) {
      return NextResponse.json({ error: "Invalid orders format" }, { status: 400 });
    }

    await dbConnect();
    
    const updatePromises = orders.map((o: { id: string, order: number }) => 
      FixedCost.findByIdAndUpdate(o.id, { order: o.order })
    );
    
    await Promise.all(updatePromises);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update orders" }, { status: 500 });
  }
}

