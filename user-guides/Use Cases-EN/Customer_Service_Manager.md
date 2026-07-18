# CodeBanana Guide for Customer Service Managers

> Customer service teams have very concentrated pain points: complaint records scattered across spreadsheets and chat logs, follow-ups relying entirely on memory, and weekly reports requiring manual tallying. CodeBanana helps you systematize all of this — replace form-filling with conversation-based input, replace manual checks with scheduled tasks, and replace weekend overtime report-building with automated statistics.

---

## Scenario: Build a Complaint Management System in 20 Minutes

### When You'd Use This

- Your team still tracks complaints in Excel and frequently forgets follow-ups
- Every Friday you spend 2 hours compiling complaint stats for the weekly report
- You need a central place to manage all complaints by severity, with zero missed follow-ups

### Step 1: Create the System (10 minutes)

Tell the Agent what you need:

> "Create a complaint management system that can record complaint details (customer name, issue type, severity, assigned rep, resolution deadline), remind daily about pending follow-ups, and auto-generate a weekly report every Friday"

The Agent automatically sets up:
- A structured complaint records file
- An intake template
- Three core operations: log a complaint, view pending follow-ups, generate weekly report

### Step 2: Set Up Scheduled Reminders (5 minutes)

> "Every day at 9 AM, remind me of today's pending follow-ups. Every Friday at 5 PM, generate a weekly report"

The Agent creates two scheduled tasks that run automatically — no action needed from you.

If your team primarily communicates on Slack, Feishu, or DingTalk, you can also connect the Agent to IM — bind your IM bot in Agent Config → Channel. Once connected, daily complaint reminders and weekly reports get pushed directly to the group. Team members don't need to log into CodeBanana.

### Step 3: Daily Use — Just Talk

**Log a complaint:**

> "Log complaint: Mr. Lee from JD.com, product quality issue, received a damaged item, urgent, assigned to Wang, resolve within 3 days"

The Agent auto-formats and saves — severity highlighted in red, deadline calculated.

**Daily 9 AM automatic reminder:**

```
3 complaints need follow-up today:

1. Mr. Lee, JD.com (Critical 🔴) - Damaged item - Rep: Wang - 1 day remaining
2. Ms. Zhang, Taobao (Urgent 🟡) - Shipping delay - Rep: Li - Due today
3. Mr. Wang, TikTok Shop (Normal) - Feature inquiry - Rep: Liu - Planned callback today
```

Forward the reminder directly to the assigned reps — nothing gets missed.

**Friday 5 PM automatic weekly report:**

```
Complaint Weekly Report - Summary
- This week's complaints: 15 cases
- Resolved: 12 (80%)
- Overdue: 1 ⚠️

Top 3 Recurring Issues:
1. Product damage (7 cases) → Recommend improving packaging
2. Shipping delays (5 cases) → Recommend switching carriers
3. Slow response (2 cases) → Recommend adding headcount
```

Copy and use directly for the weekly meeting.

### Before vs. After

| Function | Traditional (Excel) | With CodeBanana |
|----------|-------------------|-----------------|
| Log complaints | Manual form entry, easy to misfile | Say one sentence, auto-formatted |
| Follow-up reminders | Manually check spreadsheet, easy to miss | Daily auto-reminder, zero missed |
| Weekly report | 2 hours of Friday tallying | Auto-generated in 5 seconds |
| Data analysis | Manual filtering, pivot tables | Auto-stats + auto-alerts |

---

## Tips for Customer Service Managers

1. **Define issue categories first**: Tell the Agent your complaint categories (product quality, shipping, service attitude, etc.) so it can auto-classify and tally. Better yet, write a complaint handling SOP in Basic Info's Agents tab — like "critical complaints must be responded to same-day, standard complaints within 3 days." The Agent follows this standard every time.

2. **Use the forward function**: Forward the Agent's daily reminders directly to the assigned reps. Don't be a human reminder system.

3. **Connect IM to lower the barrier**: In Agent Config → Channel, bind your Feishu/DingTalk/Slack bot. The team might not open CodeBanana daily, but they definitely check IM. Complaint reminders pushed directly to the group chat — nobody misses them.

4. **Auto-escalate overdue complaints**: Require "complaints overdue by 2 days auto-escalate to critical." Use Heartbeat with a "check for overdue complaints every 2 hours" task written in HEARTBEAT.md — the system is more reliable than people; it never forgets.

5. **Set service standards in Basic Info**: In Soul, write "tone: professional but empathetic; never use deflecting language when responding to customers." In User, note "customer service manager, focused on complaint resolution efficiency and customer satisfaction." The Agent's drafted replies and reports will automatically align with your standards.
