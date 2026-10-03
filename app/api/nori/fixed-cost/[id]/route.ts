import { ownedReferences } from "@/lib/owned-references";
import { requireUser } from "@/lib/current-user";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FixedCost from "@/models/FixedCost";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const { id } = await params;
    const { name, amount, category, paymentMethod, order } = await request.json();
    const body = { name, amount, category, paymentMethod, order };
    if (!await ownedReferences(body, owner.scope)) return NextResponse.json({ error: "Invalid category or payment method" }, { status: 400 });
    
    await dbConnect();
    const updatedFixedCost = await FixedCost.findOneAndUpdate({ $and: [owner.scope, { _id: id }] }, body, { new: true, runValidators: true });
    
    if (!updatedFixedCost) {
      return NextResponse.json({ error: "Fixed cost not found" }, { status: 404 });
    }
    
    return NextResponse.json(updatedFixedCost);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update fixed cost" }, { status: 500 });
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
    const deletedFixedCost = await FixedCost.findOneAndDelete({ $and: [owner.scope, { _id: id }] });
    
    if (!deletedFixedCost) {
      return NextResponse.json({ error: "Fixed cost not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete fixed cost" }, { status: 500 });
  }
}
