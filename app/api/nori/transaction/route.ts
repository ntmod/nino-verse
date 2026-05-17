import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";

export async function GET() {
  try {
    await dbConnect();
    const transactions = await Transaction.find({}).sort({ date: -1, createdAt: -1 });
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, subCategory, amount, date, paymentMethod } = body;

    if (!name || !category || amount === undefined || !date || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();
    const newTransaction = new Transaction({
      name,
      category,
      subCategory,
      amount,
      date: new Date(date),
      paymentMethod,
    });

    const savedTransaction = await newTransaction.save();
    return NextResponse.json(savedTransaction, { status: 201 });
  } catch (error: any) {
    console.error("SAVE TRANSACTION ERROR:", error);
    return NextResponse.json({ error: "Failed to save transaction", details: error.message }, { status: 500 });
  }
}
