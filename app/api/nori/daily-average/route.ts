import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import Category from "@/models/Category";
import DailyAverageConfig from "@/models/DailyAverageConfig";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    await dbConnect();

    // 1. Fetch categories and daily average configuration
    const [categories, config] = await Promise.all([
      Category.find({}),
      DailyAverageConfig.findOne({})
    ]);

    const selectedCategories = config?.selectedCategories || [];
    
    // Resolve selected categories (both names and IDs for lookup resilience)
    const selectedCatObjects = selectedCategories.length > 0
      ? categories.filter(c => selectedCategories.includes(c._id.toString()))
      : categories; // If nothing selected or config doesn't exist, calculate for all categories

    const allowedIds = selectedCatObjects.map(c => c._id.toString());
    const allowedNames = selectedCatObjects.map(c => c.name.toLowerCase());

    // 2. Fetch transactions in range
    let query: any = {};
    if (startDateStr && endDateStr) {
      query.date = {
        $gte: new Date(startDateStr),
        $lte: new Date(endDateStr),
      };
    }

    const transactions = await Transaction.find(query);

    // 3. Filter transactions based on category selection
    const matchedTransactions = transactions.filter(tx => {
      const txCat = tx.category.toLowerCase();
      return allowedIds.includes(tx.category) || allowedNames.includes(txCat);
    });

    // 4. Calculate total spent (only expenses)
    const totalSpent = Math.abs(matchedTransactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0));

    // 5. Calculate elapsed days
    const today = new Date();
    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    const endLimit = new Date(Math.min(endDate.getTime(), today.getTime()));
    const diffTime = Math.max(0, endLimit.getTime() - startDate.getTime());
    const elapsedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const dailyAverage = totalSpent / elapsedDays;

    // Calculate daily average per category
    const categorySpent: Record<string, number> = {};
    matchedTransactions.filter(tx => tx.amount < 0).forEach(tx => {
      const catObj = categories.find(c => c._id.toString() === tx.category || c.name.toLowerCase() === tx.category.toLowerCase());
      const catId = catObj ? catObj._id.toString() : tx.category;
      categorySpent[catId] = (categorySpent[catId] || 0) + Math.abs(tx.amount);
    });

    const breakdown = selectedCatObjects.map(cat => {
      const spent = categorySpent[cat._id.toString()] || 0;
      return {
        categoryId: cat._id.toString(),
        categoryName: cat.name,
        categoryIcon: cat.icon,
        dailyAverage: spent / elapsedDays
      };
    })
    .filter(item => item.dailyAverage > 0)
    .sort((a, b) => b.dailyAverage - a.dailyAverage);

    return NextResponse.json({
      dailyAverage,
      totalSpent,
      elapsedDays,
      selectedCategories: allowedIds,
      breakdown
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to calculate daily average", details: error.message }, { status: 500 });
  }
}
