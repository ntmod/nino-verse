import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import Category from "@/models/Category";
import DailyAverageConfig from "@/models/DailyAverageConfig";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const startDate = body?.startDate ? new Date(body.startDate) : new Date();
    const endDate = body?.endDate ? new Date(body.endDate) : new Date();

    await dbConnect();

    const currStart = isNaN(startDate.getTime()) ? new Date() : startDate;
    const currEnd = isNaN(endDate.getTime()) ? new Date(currStart.getTime() + 30 * 24 * 60 * 60 * 1000) : endDate;
    const cycleDuration = Math.max(24 * 60 * 60 * 1000, currEnd.getTime() - currStart.getTime());

    // 1. Fetch categories and config
    const [categories, config] = await Promise.all([
      Category.find({}),
      DailyAverageConfig.findOne({})
    ]);

    const selectedCategories: string[] = config?.selectedCategories || [];
    const selectedCatObjects = selectedCategories.length > 0
      ? categories.filter((c: any) => selectedCategories.includes(c._id.toString()))
      : categories;
    const allowedIds = selectedCatObjects.map((c: any) => c._id.toString());
    const allowedNames = selectedCatObjects.map((c: any) => c.name.toLowerCase());

    // 2. Build 4 cycles range (Current + 3 previous cycles)
    const cycles = [];
    for (let i = 0; i < 4; i++) {
      const cycleStart = new Date(currStart.getTime() - i * cycleDuration);
      const cycleEnd = new Date(currEnd.getTime() - i * cycleDuration);
      cycles.push({
        label: i === 0 ? "Current Cycle" : `Previous Cycle -${i}`,
        startDate: cycleStart,
        endDate: cycleEnd
      });
    }

    // Earliest start date across all 4 cycles
    const earliestStart = cycles[3].startDate;
    const latestEnd = cycles[0].endDate;

    const allTx = await Transaction.find({
      date: { $gte: earliestStart, $lte: latestEnd }
    });

    const now = new Date().getTime();

    // 3. Summarize metrics per cycle
    const cycleSummaries = cycles.map((cycle, index) => {
      const cycleStartMs = cycle.startDate.getTime();
      const cycleEndMs = cycle.endDate.getTime();

      const txs = allTx.filter((tx: any) => {
        const t = new Date(tx.date).getTime();
        return t >= cycleStartMs && t <= cycleEndMs && tx.amount < 0;
      });

      const totalSpent = Math.abs(txs.reduce((sum: number, tx: any) => sum + tx.amount, 0));

      // Elapsed days calculation
      const endLimit = Math.min(cycleEndMs, now);
      const elapsedMs = Math.max(0, endLimit - cycleStartMs);
      const elapsedDays = index === 0 
        ? Math.max(1, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24)))
        : Math.max(1, Math.round(cycleDuration / (1000 * 60 * 60 * 24)));

      // Matched for daily average config
      const matchedTxs = txs.filter((tx: any) => {
        const txCat = tx.category.toLowerCase();
        return allowedIds.includes(tx.category) || allowedNames.includes(txCat);
      });
      const configTotalSpent = Math.abs(matchedTxs.reduce((sum: number, tx: any) => sum + tx.amount, 0));
      const dailyAverage = configTotalSpent / elapsedDays;

      // Category breakdown distribution
      const catDistribution: Record<string, number> = {};
      txs.forEach((tx: any) => {
        const catObj = categories.find((c: any) => c._id.toString() === tx.category || c.name.toLowerCase() === tx.category.toLowerCase());
        const catName = catObj ? catObj.name : tx.category;
        catDistribution[catName] = (catDistribution[catName] || 0) + Math.abs(tx.amount);
      });

      return {
        label: cycle.label,
        startDate: cycle.startDate.toISOString().split("T")[0],
        endDate: cycle.endDate.toISOString().split("T")[0],
        totalSpent,
        dailyAverage: parseFloat(dailyAverage.toFixed(2)),
        elapsedDays,
        spendingDistribution: Object.entries(catDistribution)
          .sort((a, b) => b[1] - a[1])
          .map(([category, amount]) => ({ category, amount }))
      };
    });

    // 4. Construct Prompt for Gemini API
    const systemInstruction = `You are Nori, a cute, playful, intelligent cat financial companion for the app "Nori's Note".
Your job is to analyze the user's current expense situation across the current cycle and past 3 cycles from multiple perspectives (suggestions, compliments, warnings, category pace, projected total savings/overspend, etc.).

Provide EXACTLY 10 detailed, distinct, punchy, and insightful topics. Each topic MUST include the observation AND a concrete, clever consequence or action suggestion!

Rules:
- Must generate EXACTLY 10 items.
- Write in Nori's charming personality (playful, witty, observant cat style with occasional subtle cat emojis 🐾, 🐱, 🐈, 🐟, 🎯).
- Each item MUST state the situation AND the projected consequence or outcome.
- Include actionable cat tips/tricks like **Nori's Tip:** or **Nori's Trick:** in the topics.
- Do NOT include markdown headers or extra text outside the 10 items. Return a plain list of 10 items.`;

    const userPrompt = `Here is the financial dataset across current cycle and past 3 cycles:
${JSON.stringify(cycleSummaries, null, 2)}

Analyze this data as Nori and give 10 comprehensive topic insights with consequences!`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      const models = [
        "gemini-flash-latest",
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash",
        "gemini-1.5-flash"
      ];

      for (const model of models) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "X-goog-api-key": apiKey
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }]
                  }
                ]
              })
            }
          );

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const items = rawText
                .split("\n")
                .map((line: string) => line.replace(/^[\d\s.\-*•]+/, "").trim())
                .filter((line: string) => line.length > 0)
                .slice(0, 10);

              if (items.length > 0) {
                return NextResponse.json({ items, cycleSummaries, isFallback: false, model });
              }
            }
          } else {
            const errText = await geminiRes.text();
            console.error(`Gemini X-goog-api-key fetch error for ${model} status ${geminiRes.status}:`, errText);
          }
        } catch (fetchErr) {
          console.error(`Gemini fetch exception for ${model}:`, fetchErr);
        }
      }
    }

    // Fallback heuristic 10 topics if API key is missing or request fails
    const curr = cycleSummaries[0] || { elapsedDays: 1, totalSpent: 0, dailyAverage: 0, spendingDistribution: [] };
    const prev1 = cycleSummaries[1] || { totalSpent: 0 };
    const prev2Spent = cycleSummaries[2]?.totalSpent || 0;
    const prev3Spent = cycleSummaries[3]?.totalSpent || 0;

    const avgPrevSpent = (prev1.totalSpent + prev2Spent + prev3Spent) / 3;
    const diffVsAvg = avgPrevSpent > 0 ? ((curr.totalSpent - avgPrevSpent) / avgPrevSpent) * 100 : 0;
    const topCat = curr.spendingDistribution[0]?.category || "General";
    const topCatAmt = curr.spendingDistribution[0]?.amount || 0;
    const estEnd = (curr.dailyAverage || 0) * 30;

    const catTopic = topCatAmt > 0
      ? `We spent a lot on ${topCat} (THB ${topCatAmt.toLocaleString()}). At this rate, it will account for ${curr.totalSpent > 0 ? Math.round((topCatAmt / curr.totalSpent) * 100) : 0}% of your total cycle expenses! 🐈 **Nori's Tip:** Enforce a strict 48-hour pause before buying non-essentials in this category.`
      : `No heavy category expenses logged yet. At this pace, your wallet remains extra safe this cycle! 🐱 **Nori's Tip:** Transfer a small amount to savings now while you are under budget!`;

    const prevTopic = prev1.totalSpent > 0
      ? `Current spending is ${curr.totalSpent > prev1.totalSpent ? "higher" : "lower"} by ${Math.abs(Math.round(((curr.totalSpent - prev1.totalSpent) / prev1.totalSpent) * 100))}% compared to last cycle. 🎯 **Nori's Trick:** ${curr.totalSpent < prev1.totalSpent ? "Lock in this win by setting a lower daily target for the remaining days." : "Review yesterday's receipt list and eliminate non-essential impulse buys."}`
      : `Your historical baseline over past cycles averages ~THB ${Math.round(avgPrevSpent).toLocaleString()}. 🐱 **Nori's Tip:** Keep tracking daily to build a clear spending baseline.`;

    const secondCat = curr.spendingDistribution[1];
    const secondCatTopic = secondCat
      ? `Second largest category is ${secondCat.category} (THB ${secondCat.amount.toLocaleString()}). Balancing this category will keep your distribution well-proportioned! ⚖️ **Nori's Trick:** Set a category cap for ${secondCat.category} for the rest of this month.`
      : `Your expenses are currently concentrated in very few categories, keeping overall management simple! 📝 **Nori's Tip:** Continue logging secondary expenses so Nori can track detailed trends.`;

    const fallbackItems = [
      `We're at day ${curr.elapsedDays} of the cycle with THB ${curr.totalSpent.toLocaleString()} spent. If we keep this daily pace of THB ${curr.dailyAverage.toLocaleString()}, we'll finish the cycle at est. THB ${Math.round(estEnd).toLocaleString()}! 🐾 **Nori's Trick:** Stash extra savings into your goal account right now if projected under budget!`,
      catTopic,
      prevTopic,
      `Your 3-cycle historical average baseline is ~THB ${Math.round(avgPrevSpent).toLocaleString()}. Spending currently sits ${diffVsAvg > 0 ? `+${diffVsAvg.toFixed(1)}% above average` : `${Math.abs(diffVsAvg).toFixed(1)}% below average`}. 🐟 **Nori's Tip:** Aim for 3 zero-expense days this week to pull the average back down.`,
      `Fixed costs & essential recurring payments are being tracked. Keeping them settled early prevents late fee penalties! 💳 **Nori's Trick:** Double check auto-pay subscriptions to avoid unexpected renewals.`,
      `Daily spending average is THB ${curr.dailyAverage.toLocaleString()}. Keeping daily purchases under THB ${Math.round((curr.dailyAverage || 100) * 0.9).toLocaleString()} could yield extra end-of-month savings! 🐾 **Nori's Tip:** Cap daily coffee/snack budgets to save effortlessly.`,
      secondCatTopic,
      `Cycle progress is currently at ${Math.round((curr.elapsedDays / 30) * 100)}%. Steady pacing now prevents an unexpected end-of-cycle crunch! ⏱️ **Nori's Trick:** Plan out big purchases for next cycle instead of cramming them into this one.`,
      `Great job tracking your transactions consistently! Regular logging ensures 100% accuracy in your financial health forecasts. 🐱 **Nori's Tip:** Keep this daily habit going!`,
      `Nori's Final Tip: Review your "${topCat}" transactions this weekend to see if any non-essential items can be trimmed! 🐈 **Nori's Trick:** Compare prices before your next grocery or shopping trip.`
    ];

    return NextResponse.json({ items: fallbackItems, cycleSummaries, isFallback: true });
  } catch (error: any) {
    console.error("Nori Think error:", error);
    return NextResponse.json(
      { error: "Failed to run Nori Think analysis", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
