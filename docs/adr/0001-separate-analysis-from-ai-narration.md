# Separate financial analysis from AI narration

Nori uses trusted, read-only server operations to calculate spending totals, cycle comparisons, budget status, pace, merchant results, and cautions. Gemini receives only the minimum relevant structured results and turns them into a concise answer with Analysis Evidence; it does not access the database directly, perform authoritative arithmetic, or modify Financial Records. This sacrifices unrestricted agent flexibility to keep financial answers verifiable, private, and usable when the AI provider fails.
