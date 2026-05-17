import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FixedCost from "@/models/FixedCost";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    await dbConnect();
    const updatedFixedCost = await FixedCost.findByIdAndUpdate(id, body, { new: true });
    
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
    const { id } = await params;
    await dbConnect();
    const deletedFixedCost = await FixedCost.findByIdAndDelete(id);
    
    if (!deletedFixedCost) {
      return NextResponse.json({ error: "Fixed cost not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete fixed cost" }, { status: 500 });
  }
}
