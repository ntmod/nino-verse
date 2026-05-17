import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    await dbConnect();
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      { ...body, date: body.date ? new Date(body.date) : undefined },
      { new: true }
    );

    if (!updatedTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json(updatedTransaction);
  } catch (error: any) {
    console.error("UPDATE TRANSACTION ERROR:", error);
    return NextResponse.json({ error: "Failed to update transaction", details: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const deletedTransaction = await Transaction.findByIdAndDelete(id);
    if (!deletedTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Transaction deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
