# NoriNote

NoriNote is a private, single-person record of income, expenses, budgets, and spending patterns.

## Language

**Financial Record**:
A transaction or budget stored by the user. A fixed-cost template is not spending unless it becomes a recorded transaction.

**Spending Cycle**:
A contiguous period used to group and compare spending. It starts either on a configured day of each month or when the user starts a Manual Spending Cycle.
_Avoid_: Month, billing month

**Cycle Budget**:
A category spending limit that applies to one Spending Cycle.
_Avoid_: Monthly budget, allowance

**Spending**:
The absolute total of recorded negative transactions. Income is reported separately and never subtracted from Spending.
_Avoid_: Net cash flow, fixed-cost projection

**Payment Method**:
The channel used to pay or receive money, such as cash, a bank account, or a credit card. It does not hold a spending budget or track a cash balance.

**Budget Wallet**:
An optional envelope for a spending purpose, such as meals or travel, independent of categories and Payment Methods. Its configured budget starts anew each Spending Cycle; expenses assigned to it consume that cycle's budget, while income does not replenish it.
_Avoid_: Bank account, payment method

**Budget Transfer**:
A movement of available budget between two Budget Wallets in the same Spending Cycle. It preserves their combined allocated budget and is neither Spending nor income; it does not carry into the next cycle.

**Manual Spending Cycle**:
A Spending Cycle whose start is confirmed by the user, typically on payday. It stays open until the next start; changing a start also changes the preceding cycle's end so the periods remain contiguous.


**Recurring Cycle Start**:
The chosen monthly start day, from 1 to 31; shorter months use their last available day. Changing this setting or switching to manual starts preserves existing cycle starts and changes how the next cycle begins.

Budget wallets are optional: expense entry, dashboard, cycle summaries, and refunds must work without creating or choosing a wallet. Refunds adjust the original expense and cycle, retain their audit history, and never count as income. Archived wallets retain all historical records and can be restored.
