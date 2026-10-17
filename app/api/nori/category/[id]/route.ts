import { ownedReferences } from "@/lib/owned-references";
import { requireUser } from "@/lib/current-user";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const { id } = await params;
    const body = await request.json();
    const { name, icon, type, defaultWalletId } = body;
    if (!await ownedReferences({ walletId: defaultWalletId }, owner.scope)) return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 });

    await dbConnect();
    const category = await Category.findOneAndUpdate(
      { $and: [owner.scope, { _id: id }] },
      { name, icon, type, defaultWalletId },
      { new: true, runValidators: true }
    );

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("UPDATE CATEGORY ERROR:", error);
    return NextResponse.json({ error: "Failed to update category", details: error.message }, { status: 500 });
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
    const category = await Category.findOneAndDelete({ $and: [owner.scope, { _id: id }] });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Category deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
