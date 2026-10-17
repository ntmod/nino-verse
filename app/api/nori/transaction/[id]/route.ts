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
    await dbConnect();
    const original = await Transaction.findOne({ $and: [owner.scope, { _id: id }] });
    if (!original) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    if (original.refunds?.length) return NextResponse.json({ error: 'Refunded expenses cannot be edited' }, { status: 409 });
    const { name, category, subCategory, amount, date, paymentMethod, walletId } = await request.json();
    const body = { name, category, subCategory, amount, date, paymentMethod, walletId };
    if (!await ownedReferences({ ...body, walletId: walletId === original.walletId ? undefined : walletId }, owner.scope)) return NextResponse.json({ error: "Invalid category, payment method or wallet" }, { status: 400 });
    
    await dbConnect();
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { $and: [owner.scope, { _id: id, 'refunds.0': { $exists: false } }] },
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
