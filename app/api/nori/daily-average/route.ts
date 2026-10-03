import { requireUser } from "@/lib/current-user";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import Category from "@/models/Category";
import DailyAverageConfig from "@/models/DailyAverageConfig";
import { getSpendingCycle } from "@/lib/spending-cycle.js";

export async function GET(request: Request) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    if (Boolean(startDateStr) !== Boolean(endDateStr)) {
      return NextResponse.json({ error: "startDate and endDate must be provided together" }, { status: 400 });
    }
    const cycle = getSpendingCycle();
    const startDate = startDateStr ? new Date(startDateStr) : cycle.startDate;
    const endDate = endDateStr ? new Date(endDateStr) : cycle.endDate;
    if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || startDate > endDate) {
      return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
    }

    await dbConnect();

    // 1. Fetch categories and daily average configuration
    const [categories, config] = await Promise.all([
      Category.find(owner.scope),
      DailyAverageConfig.findOne(owner.scope)
    ]);

    const selectedCategories = config?.selectedCategories || [];
    
    // Resolve selected categories (both names and IDs for lookup resilience)
    const selectedCatObjects = selectedCategories.length > 0
      ? categories.filter(c => selectedCategories.includes(c._id.toString()))
      : categories; // If nothing selected or config doesn't exist, calculate for all categories

    const allowedIds = selectedCatObjects.map(c => c._id.toString());
    const allowedNames = selectedCatObjects.map(c => c.name.toLowerCase());

    // 2. Fetch transactions in range
    const transactions = await Transaction.find({ ...owner.scope, date: { $gte: startDate, $lte: endDate } });

    // Total spent includes every expense in the period, matching the dashboard card.
    const allExpenses = transactions.filter(tx => tx.amount < 0);
    const totalSpent = Math.abs(allExpenses.reduce((sum, tx) => sum + tx.amount, 0));

    // 3. Filter transactions based on category selection
    const expenseTransactions = allExpenses.filter(tx => {
      const txCat = tx.category.toLowerCase();
      return allowedIds.includes(tx.category) || allowedNames.includes(txCat);
    });

    // 4. The configured categories define the daily-average base.
    const averageBaseSpent = Math.abs(expenseTransactions
      .reduce((sum, tx) => sum + tx.amount, 0));

    // 5. Calculate elapsed days
    const today = new Date();
    const endLimit = new Date(Math.min(endDate.getTime(), today.getTime()));
    const diffTime = Math.max(0, endLimit.getTime() - startDate.getTime());
    const elapsedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const dailyAverage = averageBaseSpent / elapsedDays;

    // 6. Calculate today's spending for selected categories
    const todayKey = today.toISOString().split('T')[0];
    const todaySpent = expenseTransactions
      .filter(tx => new Date(tx.date).toISOString().split('T')[0] === todayKey)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    // Calculate daily average per category
    const categorySpent: Record<string, number> = {};
    expenseTransactions.forEach(tx => {
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
      todayUsage: todaySpent,
      totalSpent,
      elapsedDays,
      selectedCategories: allowedIds,
      breakdown
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to calculate daily average", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
