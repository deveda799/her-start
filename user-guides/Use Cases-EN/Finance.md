# CodeBanana Guide for Finance Teams

> Finance work demands extreme accuracy, yet a huge amount of time goes to repetitive reconciliation and tabulation — reconciling ledgers line by line, validating reports item by item, and manually building charts before writing conclusions. CodeBanana accelerates these mechanical tasks so you can focus on spotting anomalies and making judgments.

---

## Scenario 1: Complete Reconciliation in 10 Minutes

### When You'd Use This

- Month-end reconciliation between bank statements and system records
- Two datasets don't match and you need to find the discrepancies
- Need to generate a reconciliation report or bank balance adjustment

### How to Do It

Financial data is sensitive — use **Private Agent**. Only you can see the conversation; it won't appear in the team's Team Agent.

Send both datasets to the Agent:

> "Reconcile these two files — bank statements and our system records"

The Agent automatically does three things:
1. Parses both datasets, standardizes formats
2. Auto-matches by amount + date
3. Identifies discrepancies and analyzes possible causes

10 minutes later, a reconciliation report:

```
Reconciliation Results:
- Bank statements: 156 transactions, System records: 152 transactions
- Matched: 149
- Discrepancies: 7 items, difference: $7,500

Discrepancy Details:
1. 3/15 Bank $5,000, System: missing → Likely omission, please add entry
2. 3/18 Bank $12,000 vs System $12,500 → Amount mismatch, verify contract
3. 3/22 System $2,000, Bank: missing → In-transit payment, expected 3/25
```

Each discrepancy includes cause analysis and recommended action.

> "Generate the adjustment journal entries"

The Agent auto-generates the corresponding entries.

### Result

Previously: manual reconciliation took an entire afternoon — eyes glazing over, possibly missing items. Now: results in 10 minutes, with causes and next steps already analyzed.

---

## Scenario 2: Validate a Financial Report in 5 Minutes

### When You'd Use This

- Report is done, needs a final check before submission
- Not sure if there are formula errors or logic anomalies
- Year-over-year or quarter-over-quarter changes are unusually large — need to confirm real movement vs. data entry error

### How to Do It

Send the report to the Agent:

> "Check this quarterly P&L statement"

The Agent auto-validates and outputs in three categories:

**✅ Passed:**
- Debits and credits balanced: Pass
- Sum formulas: All 15 correct

**⚠️ Anomalies:**
- G&A — Travel expenses this quarter $89,000, up 320% YoY, far exceeding historical variance
- Revenue rows 2 and 5 don't sum to the total row — $1,200 discrepancy
- Other payables ending balance is negative — possible debit/credit reversal

**📊 Trend Alerts:**
- Gross margin dropped from 42% to 35% — monitor cost changes
- Accounts receivable turnover days increased to 45

You confirm the travel expense is valid, have the Agent investigate the missing entry — back and forth, 5 minutes done.

### Result

Previously: manually verifying each item took 1–2 hours, still worried about missing something. Now: complete validation report in 5 minutes, anomalies at a glance.

---

## Scenario 3: Business Analysis Report in 15 Minutes

### When You'd Use This

- Preparing business analysis materials for leadership
- Have a pile of financial data but no time to organize it into a "presentable" report
- Need YoY/QoQ analysis + trend assessment + management recommendations

### How to Do It

Send the data to the Agent:

> "Use this data to build a Q1 business analysis report for the CEO"

The Agent delivers in 15 minutes:

- **Key metrics at a glance**: Revenue, net profit, gross margin — actual vs. target vs. prior year
- **Revenue analysis**: Which products grew, which declined, new customer contribution
- **Cost alerts**: Raw materials up 18%, marketing spend 20% over budget
- **Cash flow**: Operating cash flow healthy, but AR collection period extending
- **Recommendations**: Adjust pricing strategy, control marketing costs, accelerate AR collection

Plus accompanying charts — revenue trend line chart, cost structure pie chart, cash flow bar chart.

> "Add a comparison with last year's Q1"

30 seconds, done.

### Result

Previously: building a business analysis took 1–2 days — Excel for charts, Word for the report, switching back and forth. Now: report + charts in 15 minutes, with data interpretation and recommendations already written. You just review for accuracy.

---

## Tips for Finance Teams

1. **Use Private Agent for sensitive data**: Reconciliation, reports, business analysis — these involve core financial data. Private Agent gives you peace of mind. Only you can see the conversation.

2. **Build reconciliation templates**: Tell the Agent your matching rules (e.g., "amount match within $0.01 and date within 3 days counts as matched"), and it follows your standards consistently. Better yet, write the rules into Basic Info's Agents tab as a fixed reconciliation SOP — like "Steps: 1. Parse files 2. Standardize formats 3. Match by amount + date 4. Output discrepancy analysis."

3. **Monthly reports via Scheduled Tasks**: In Cron Job, create "auto-generate last month's business analysis report on the 1st of every month" (select Monthly type). When the new month starts, a ready-made report framework is waiting — just add your judgment and annotations.

4. **You own the final accuracy check**: The Agent accelerates processing, but the final numbers must be confirmed by you. Especially for external reports — always review. In Basic Info's Soul, write "data reports must label data sources and calculation methodology; any manual adjustments must be highlighted in yellow" — so the Agent's output comes with built-in audit trails.

5. **Monitor anomalous metrics with Heartbeat**: If you need continuous monitoring of certain indicators (like "cash flow below safety threshold" or "AR past due"), write the checks into HEARTBEAT.md and set the interval. Heartbeat runs automatic periodic checks and notifies you immediately when something's off — far more reliable than manually checking spreadsheets.
