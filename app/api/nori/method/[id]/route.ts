import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PaymentMethod from "@/models/PaymentMethod";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    await dbConnect();
    const updatedMethod = await PaymentMethod.findByIdAndUpdate(id, body, { new: true });
    
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
    const { id } = await params;
    await dbConnect();
    const deletedMethod = await PaymentMethod.findByIdAndDelete(id);
    
    if (!deletedMethod) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete payment method" }, { status: 500 });
  }
}
