import { requireUser } from "@/lib/current-user";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { validInitialBalance } from "@/lib/payment-balance.mjs";
import PaymentMethod from "@/models/PaymentMethod";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const { id } = await params;
    const body = await request.json();

    if (!validInitialBalance(body.initialBalance)) {
      return NextResponse.json({ error: "Invalid initial balance" }, { status: 400 });
    }
    const { name, icon, color, desc, order, initialBalance } = body;
    const updates = { name, icon, color, desc, order, ...(initialBalance !== undefined ? {
      initialBalance: initialBalance === null ? null : Math.round(initialBalance * 100) / 100,
    } : {}) };
    await dbConnect();
    const updatedMethod = await PaymentMethod.findOneAndUpdate({ $and: [owner.scope, { _id: id }] }, updates, { new: true, runValidators: true });
    
    if (!updatedMethod) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
    }
    
    return NextResponse.json(updatedMethod);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update payment method" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const { id } = await params;
    await dbConnect();
    const deletedMethod = await PaymentMethod.findOneAndDelete({ $and: [owner.scope, { _id: id }] });
    
    if (!deletedMethod) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete payment method" }, { status: 500 });
  }
}
