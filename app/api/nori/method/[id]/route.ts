import { requireUser } from "@/lib/current-user";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
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

    const { name, icon, color, desc, order } = body;
    const updates = { name, icon, color, desc, order };
    await dbConnect();
    const updatedMethod = await PaymentMethod.findOneAndUpdate({ $and: [owner.scope, { _id: id }] }, updates, { new: true, runValidators: true });
    
    if (!updatedMethod) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
    }
    
    const data = updatedMethod.toObject?.() ?? { ...updatedMethod };
    delete data.initialBalance;
    return NextResponse.json(data);
  } catch {
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
  } catch {
    return NextResponse.json({ error: "Failed to delete payment method" }, { status: 500 });
  }
}
