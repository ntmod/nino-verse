import { requireUser } from "@/lib/current-user";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import { paymentBalance, validInitialBalance } from "@/lib/payment-balance.mjs";
import PaymentMethod from "@/models/PaymentMethod";

export async function GET() {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    await dbConnect();
    const [methods, movements] = await Promise.all([
      PaymentMethod.find(owner.scope).sort({ order: 1, createdAt: -1 }).lean(),
      Transaction.aggregate([{ $match: owner.scope }, { $group: { _id: "$paymentMethod", cents: { $sum: { $round: [{ $multiply: ["$amount", 100] }, 0] } } } }]),
    ]);
    const totals = new Map<string, number>(movements.map(item => [String(item._id), item.cents]));
    return NextResponse.json(methods.map(method => ({ ...method, balance: paymentBalance(method, totals) })));
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const body = await request.json();
    const { name, icon, color, desc, order, initialBalance } = body;

    if (!name || !icon || !color) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!validInitialBalance(initialBalance)) {
      return NextResponse.json({ error: "Invalid initial balance" }, { status: 400 });
    }
    await dbConnect();
    const newMethod = new PaymentMethod({
      userId: owner.id,
      name,
      icon,
      color,
      order: order || 0,
      desc,
      initialBalance: initialBalance == null ? null : Math.round(initialBalance * 100) / 100,
    });

    const savedMethod = await newMethod.save();
    return NextResponse.json(savedMethod, { status: 201 });
  } catch (error) {
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
  } catch (error) {
    return NextResponse.json({ error: "Failed to update orders" }, { status: 500 });
  }
}

