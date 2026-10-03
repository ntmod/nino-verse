import { ownedReferences } from "@/lib/owned-references";
import { requireUser } from "@/lib/current-user";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";

export async function GET(request: Request) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    const query: any = { ...owner.scope };
    if (startDateStr && endDateStr) {
      query.date = {
        $gte: new Date(startDateStr),
        $lte: new Date(endDateStr),
      };
    }

    await dbConnect();
    const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 });
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const body = await request.json();
    if (!await ownedReferences(body, owner.scope)) return NextResponse.json({ error: "Invalid category or payment method" }, { status: 400 });
    const { name, category, subCategory, amount, date, paymentMethod } = body;

    if (!name || !category || amount === undefined || !date || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();
    const newTransaction = new Transaction({
      userId: owner.id,
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
