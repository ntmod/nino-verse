import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Subcategory name is required" }, { status: 400 });
    }

    await dbConnect();
    const category = await Category.findById(id);
    
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    category.subcategories.push({ name } as any);
    await category.save();

    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add subcategory" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const subId = searchParams.get("subId");

    if (!subId) {
      return NextResponse.json({ error: "Subcategory ID is required" }, { status: 400 });
    }

    await dbConnect();
    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Use Mongoose subdocument pull method
    (category.subcategories as any).pull({ _id: subId });
    await category.save();

    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete subcategory" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { subId, name } = body;

    if (!subId || !name) {
      return NextResponse.json({ error: "Subcategory ID and name are required" }, { status: 400 });
    }

    await dbConnect();
    const category = await Category.findOneAndUpdate(
      { _id: id, "subcategories._id": subId },
      { $set: { "subcategories.$.name": name } },
      { new: true }
    );

    if (!category) {
      return NextResponse.json({ error: "Category or subcategory not found" }, { status: 404 });
    }

    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update subcategory" }, { status: 500 });
  }
}


