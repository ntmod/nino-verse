# Roadmap

## Ask Nori

**Status:** Planned

Add a read-only AI conversation with Nori, the black-cat budgeting coach. Nori explains recorded spending, prepares a Cycle Briefing, and raises evidence-backed Spending Cautions.

Domain language is defined in [CONTEXT.md](./CONTEXT.md). The analysis boundary is recorded in [ADR 0001](./docs/adr/0001-separate-analysis-from-ai-narration.md).

### Product rules

- Analyze Spending Cycles from the 30th through the 29th in `Asia/Bangkok`.
- Use recorded transactions only; exclude fixed-cost templates until recorded as transactions.
- Treat negative transactions as Spending and report positive transactions as income separately.
- Default undated questions to the current Spending Cycle and state its exact dates.
- Support explicit date ranges, past cycles, and cycle comparisons.
- Keep Nori read-only and session-only; it cannot change Financial Records.
- Reply in the question's language, falling back to the app language.
- Use a warm, concise, slightly playful voice without shame or unsupported financial advice.

### Analysis

- Calculate all authoritative figures in trusted server code.
- Provide cycle totals, category breakdowns, merchant search, daily pace, Cycle Budget status, and historical comparisons.
- Compare an in-progress cycle with the same elapsed portion of the previous three cycles.
- Raise a historical Spending Caution only when spending is at least 20% and THB 500 above the comparable three-cycle average.
- Raise category cautions for exceeded Cycle Budgets and projected cycle overruns.
- Omit historical cautions when prior data is insufficient; never treat missing data as zero.
- Include Analysis Evidence with the date range, totals, baseline, and relevant categories.

### AI boundary

- Use the existing `@google/genai` dependency from a server-only route.
- Send Gemini only the minimum relevant structured analysis, not unrestricted transaction history.
- Treat transaction fields and user questions as untrusted input.
- Do not let Gemini access MongoDB, modify records, or perform authoritative arithmetic.
- If Gemini fails, retain the deterministic Cycle Briefing and show that chat is unavailable.

### Interface

- Add an Ask Nori panel to Analytics and link to it from the dashboard.
- Show the deterministic Cycle Briefing and Spending Cautions without requiring an AI call.
- Call Gemini only when Ask Nori is opened or a question is submitted.
- Return complete responses without streaming.
- Start with these prompts:
  - Summarize this cycle.
  - Where did most of my money go?
  - What should I be cautious about?
  - Compare this cycle with the previous cycle.

### Delivery order

1. Extract the existing Spending Cycle calculation into one shared, tested server-safe function.
2. Add and test the read-only analysis operations.
3. Add the protected Nori chat API with validation and graceful AI failure.
4. Add the Cycle Briefing, cautions, Ask Nori panel, and dashboard link.
5. Verify cycle boundaries, partial-cycle comparisons, missing history, bilingual replies, and AI failure behavior.

### Deferred

- MCP access for external assistants.
- Persistent conversation history.
- Streaming responses.
- AI-created or edited transactions and budgets.
- Multi-user access. Real authentication and per-user ownership are required before this app is shared with other users.

### Done when

- Dashboard and Nori show identical figures for the same Spending Cycle.
- Every monetary claim is produced by server analysis and carries Analysis Evidence.
- No fixed-cost template is counted without a recorded transaction.
- Nori cannot mutate Financial Records or access another user's data.
- The deterministic briefing remains useful when Gemini is unavailable.
