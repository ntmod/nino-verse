import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PaymentMethod from "@/models/PaymentMethod";

export async function GET() {
  try {
    await dbConnect();
    const methods = await PaymentMethod.find({}).sort({ order: 1, createdAt: -1 });
    return NextResponse.json(methods);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, icon, color, desc, order } = body;

    if (!name || !icon || !color) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();
    const newMethod = new PaymentMethod({
      name,
      icon,
      color,
      order: order || 0,
      desc,
    });

    const savedMethod = await newMethod.save();
    return NextResponse.json(savedMethod, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save payment method" }, { status: 500 });
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
      PaymentMethod.findByIdAndUpdate(o.id, { order: o.order })
    );
    
    await Promise.all(updatePromises);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update orders" }, { status: 500 });
  }
}

