# NoriNote

NoriNote is a private, single-person record of income, expenses, budgets, and spending patterns.

## Language

**Nori**:
The black-cat budgeting coach that reads financial records, explains spending patterns, and suggests modest spending adjustments without changing records or providing professional financial advice.
_Avoid_: Financial adviser, autonomous agent

**Financial Record**:
A transaction or budget stored by the user and treated as the source of truth for analysis. A fixed-cost template is not spending unless it becomes a recorded transaction.
_Avoid_: Nori memory, chat data

**Spending Cycle**:
The recurring period from the 30th through the 29th used to group and compare spending, with the boundary shortened to the last available day in shorter months.
_Avoid_: Month, billing month

**Cycle Budget**:
A category spending limit that applies to one Spending Cycle.
_Avoid_: Monthly budget, allowance

**Spending**:
The absolute total of recorded negative transactions. Income is reported separately and never subtracted from Spending.
_Avoid_: Net cash flow, fixed-cost projection

**Spending Caution**:
An evidence-backed notice that recorded spending has exceeded a budget, is paced to exceed a budget within its Spending Cycle, or is materially above comparable recent Spending Cycles.
_Avoid_: Alert, financial advice

**Cycle Briefing**:
An automatically prepared summary of the current Spending Cycle's recorded spending, budget position, notable changes, and Spending Cautions.
_Avoid_: Monthly briefing, report, notification

**Analysis Evidence**:
The date range, totals, comparison baseline, and categories that directly support a Nori answer.
_Avoid_: Citation, reasoning trace

**Conversation**:
A read-only exchange in which the user asks Nori about Financial Records and receives evidence-backed analysis.
_Avoid_: Command, automation
