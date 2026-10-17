import { requireUser } from "@/lib/current-user";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PaymentMethod from "@/models/PaymentMethod";

export async function GET() {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    await dbConnect();
    const methods = await PaymentMethod.find(owner.scope).sort({ order: 1, createdAt: -1 }).lean();
    return NextResponse.json(methods.map(method => {
      const data = { ...method };
      delete data.initialBalance;
      return data;
    }));
  } catch {
    return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const body = await request.json();
    const { name, icon, color, desc, order } = body;

    if (!name || !icon || !color) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();
    const newMethod = new PaymentMethod({
      userId: owner.id,
      name,
      icon,
      color,
      order: order || 0,
      desc,
    });

    const savedMethod = await newMethod.save();
    const data = savedMethod.toObject?.() ?? { ...savedMethod };
    delete data.initialBalance;
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save payment method" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const body = await request.json();
    const { orders } = body;

    if (!Array.isArray(orders)) {
      return NextResponse.json({ error: "Invalid orders format" }, { status: 400 });
    }

    await dbConnect();
    
    const updatePromises = orders.map((o: { id: string, order: number }) => 
      PaymentMethod.findOneAndUpdate({ $and: [owner.scope, { _id: o.id }] }, { order: o.order })
    );
    
    await Promise.all(updatePromises);
    
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update orders" }, { status: 500 });
  }
}

