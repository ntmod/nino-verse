import { ownedReferences } from "@/lib/owned-references";
import { requireUser } from "@/lib/current-user";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const { id } = await params;
    const { name, category, subCategory, amount, date, paymentMethod } = await request.json();
    const body = { name, category, subCategory, amount, date, paymentMethod };
    if (!await ownedReferences(body, owner.scope)) return NextResponse.json({ error: "Invalid category or payment method" }, { status: 400 });
    
    await dbConnect();
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { $and: [owner.scope, { _id: id }] },
      { ...body, date: body.date ? new Date(body.date) : undefined },
      { new: true, runValidators: true }
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
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const { id } = await params;
    await dbConnect();
    const deletedTransaction = await Transaction.findOneAndDelete({ $and: [owner.scope, { _id: id }] });
    if (!deletedTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Transaction deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
