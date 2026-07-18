# CodeBanana Guide for Operations

> Operations is one of the most data-intensive roles — building dashboards, writing weekly reports, investigating anomalies, all time-consuming. But the core value isn't in tallying numbers — it's in finding insights from the data and making the right decisions. CodeBanana handles the tallying so you can focus on "understanding the data" and "making good calls."

---

## Scenario 1: Build a Data Dashboard in 30 Minutes

### When You'd Use This

- You need a daily monitoring panel for core operational metrics
- Getting engineering to build a dashboard means a 2–3 week queue — can't wait
- Want to consolidate data scattered across multiple spreadsheets into one page

### How to Do It

Tell the Agent what data you want to see:

> "Build me an e-commerce operations dashboard for daily team use"

The Agent designs and generates an interactive dashboard page:

- **Top number cards** — Today's GMV, order count, conversion rate, average order value — big picture at a glance
- **Middle trend charts** — 30-day GMV trend (with YoY), category sales breakdown, conversion funnel
- **Bottom detail tables** — Top 10 products by sales, traffic sources by channel
- **Auto-alert rules** — Conversion rate < 2% turns red, daily GMV < 80% target turns yellow, return rate > 5% turns red

Need to add a metric?

> "Add customer service response time"

30 seconds to update. Once the dashboard is ready, click **Deploy** for a permanent link — share with every team member. They bookmark it and see live data every day. If you add metrics or change the layout later, the link auto-updates; no need to redistribute.

### Result

Previously: building a dashboard meant waiting 2–3 weeks for engineering. Now: build it yourself in 30 minutes, add metrics and change layouts anytime.

---

## Scenario 2: Data Weekly Report in 10 Minutes

### When You'd Use This

- Weekly leadership briefing requires charts, analysis, and conclusions
- You have a pile of data but no time to organize it into a report
- Want to save "report-building time" and spend it "doing operations"

### How to Do It

Don't want to manually do this every week? Set up a scheduled task:

> "Every Friday at 4 PM, auto-generate this week's operations weekly report"

From now on, every Friday there's a ready-made report waiting. If the team uses Slack, Feishu, or DingTalk, connect the Agent to IM — the weekly report gets pushed directly to the group, and leadership sees it right away.

Of course, the first time you'll need to tell the Agent your data source and format preferences:

> "Use this data to generate this week's operations report"

The Agent delivers a complete report in 10 minutes:

- **Overview**: Total visits, conversion orders, GMV, complaints — core numbers + week-over-week changes
- **Trend charts**: Auto-generated 7-day trend lines for DAU, conversion, GMV
- **Highlights**: Wednesday promotion drove traffic peak, new user share increased
- **Issues**: Weekend conversion dipped, return rate rising
- **Next week recommendations**: Add weekend flash sales, investigate return reasons, continue scaling acquisition

Too detailed for the boss?

> "Make a CEO version — more concise"

The Agent condenses to 3 key charts + 5 lines of conclusions.

### Result

Previously: 3 hours weekly making Excel charts + writing Word reports. Now: complete weekly report with charts and recommendations in 10 minutes.

---

## Scenario 3: Metric Anomaly? Root Cause in 5 Minutes

### When You'd Use This

- Conversion rate suddenly dropped and you don't know why
- A metric is swinging wildly and you need a fast attribution analysis
- The boss asks "what happened?" and you need an answer ASAP

### How to Do It

> "Today's conversion rate dropped from 3.2% to 1.5% — help me find the cause"

The Agent automatically performs layered drill-down analysis:

**Layer 1 — By channel:** Organic search normal, direct visits normal, paid traffic anomalous → Problem isolated to paid traffic

**Layer 2 — By campaign:** Brand keywords normal, social normal, feed ads anomalous → Further isolated

**Layer 3 — Feed ads detail:** New creative launched at 10:00 AM today, new landing page load time went from 2s to 8s, bounce rate spiked to 85%

**Conclusion:** Today's new feed ad landing page loads too slowly, causing massive user dropoff.

**Recommendation:** Immediately revert to the previous landing page, fix the new page's performance issues before relaunching.

From anomaly detection to root cause identification: 5 minutes.

### Result

Previously: metric anomalies required ops + engineering + marketing to hold a joint investigation meeting — half a day to a full day. Now: 5-minute layered drill-down pinpoints the root cause for rapid damage control.

---

## Tips for Operations

1. **Bookmark your deployed dashboard**: Deploy generates a permanent link. Every team member bookmarks it, opens it daily for live data. When you update the dashboard, the link auto-refreshes — no announcements needed.

2. **Weekly reports via Scheduled Tasks, anomaly checks via Heartbeat**: In Cron Job, "generate weekly report every Friday at 4 PM" fits Scheduled Tasks (precise timing). Meanwhile, "check core metrics for anomalies every 30 minutes" fits Heartbeat — write checks into HEARTBEAT.md, set the interval, Agent auto-patrols. Use both together for comprehensive coverage of routine reports and real-time alerts.

3. **Push alerts to IM**: In Agent Config → Channel, connect to Slack, Feishu, or DingTalk. When a metric goes anomalous, the Agent notifies the group directly. Faster than you sending the message yourself, and won't be missed because you're in a meeting.

4. **Act fast on anomalies, even faster on damage control**: When you find an issue, stop the bleeding first (revert, pause), then investigate the root cause. Don't spend too long investigating while the problem continues impacting data.

5. **Give the Agent an operations mindset via Basic Info**: In User, write "operations role, daily focus on GMV, conversion rate, retention, average order value." In Soul, write "data reports must include period-over-period changes and trend assessments; anomalous metrics highlighted in red; every report must end with actionable next steps." All of the Agent's analyses will automatically carry an operations perspective — no need to keep saying "I need conclusions and recommendations."
