# CodeBanana Guide for Growth & Paid Acquisition

> The core competitive advantage in growth is speed — finding high-converting creatives and landing pages faster than your competitors. But in a traditional workflow, building one landing page takes a week of dev time, and running an A/B test plus iteration adds another week. CodeBanana lets you run three rounds of tests in a single day, compressing iteration cycles from weeks to hours.

---

## Scenario 1: 3 Rounds of Landing Page A/B Tests in 1 Day

### When You'd Use This

- New product launch needs ad campaigns, but you're unsure which value proposition converts best
- Current ads have low conversion rates and you want to quickly test new variations
- The boss says "improve the ROI" and you need to find the optimal landing page

### How to Do It

**10:00 AM — Generate test versions**

Tell the Agent what you want to test:

> "Build 3 landing pages to test conversion for an AI writing tool:
> - Version A emphasizes efficiency: headline 'AI Writing — 10x Your Productivity,' red 'Try Now' button
> - Version B emphasizes quality: headline 'AI Writing — Rivaling Professional Copywriters,' blue 'Free Trial' button
> - Version C emphasizes price: headline 'AI Writing — Just $3/Day,' gold 'Limited Offer' button"

The Agent generates 3 independent pages in 30 minutes, each separately **Deployed** with 3 permanent links. Copy the links into your ad platform and allocate budget per version. Links never expire, and page updates auto-sync — so when you iterate, you don't need to swap URLs in the ad backend.

**2:00 PM — Check data, iterate fast**

4 hours later, data is in: Version B converts best (2.5%). Continue:

> "Based on Version B, create 2 optimizations: B-1 makes the price number larger and bold, B-2 adds 'Already used by 100,000 people'"

New versions in 20 minutes, back to running.

**5:00 PM — Lock in the winner**

B-2 converts at 3.2% — go full budget. **In one day, you've completed what traditionally takes 4–6 weeks of optimization.**

### Result

| Metric | Traditional Process | With CodeBanana |
|--------|-------------------|-----------------|
| Test cycle | 2 weeks/round | 1 day/3 rounds |
| Iteration speed | 1 change per week | 1 change per hour |
| Finding optimal version | 4–6 weeks | 1 day |
| ROI improvement | — | Faster path to high-conversion version |

---

## Scenario 2: Automated Daily Campaign Reports

### When You'd Use This

- You log into multiple platforms daily (Google Ads, Meta, TikTok) to compile performance data
- The boss asks daily "how much did we spend, how many conversions?" and you have to manually aggregate
- A channel's performance suddenly drops, but by the time you notice, days of budget have been wasted

### How to Do It

Set it once, receive daily reports automatically:

> "Create a daily campaign report: every day at 8 AM, generate yesterday's data — total spend, clicks per channel, conversions, ROI. Flag any channel with ROI below 1.5 in red"

From now on, every day at 8 AM:

```
Daily Campaign Report - Yesterday's Data

Total Spend: $1,258 | Total Conversions: 156 | Average ROI: 2.1

Channel Performance:
Google Ads  $520  78 conv  ROI 2.5  ✅ Normal
Meta        $480  62 conv  ROI 2.2  ✅ Normal
TikTok      $258  16 conv  ROI 1.1  🔴 Alert

⚠️ TikTok channel ROI only 1.1 — recommend reviewing creatives or pausing spend
```

Forward to the boss in 3 seconds (daily report done), then immediately adjust the flagged channel (anomaly caught early).

If your team uses Slack or another IM tool, bind an IM bot in Agent Config → Channel. Reports get pushed directly to the group — the boss and team see it instantly without you manually forwarding.

### Result

- Save 30 minutes daily on manual data compilation
- Anomalous channels auto-flagged — you don't wait until month-end review to discover problems
- Save 10 hours per month — enough to test 2–3 new channels

---

## Tips for Growth Teams

1. **Test with hypotheses**: Don't just create random variations hoping to get lucky. Each version should test a specific hypothesis (efficiency vs. price vs. social proof) to genuinely build knowledge.

2. **Preserve historical data**: Have the Agent save every test's data and conclusions. Over time, patterns emerge — like "promotional messaging converts better during holidays."

3. **Don't set alert thresholds too tight**: Start loose (e.g., ROI < 1.0 triggers alert), then tighten as data stabilizes to avoid frequent false alarms.

4. **Iterate landing pages and creatives together**: Have the Agent build both simultaneously to maintain visual consistency — this improves conversion rates.

5. **Daily reports via Scheduled Tasks, anomaly checks via Heartbeat**: The daily campaign report fits Scheduled Tasks in Cron Job (every day at 8 AM). But for real-time anomaly monitoring — like "check each channel's ROI every hour, alert if below threshold" — Heartbeat is better. Write it into HEARTBEAT.md and set the interval.

6. **Connect IM so the boss gets reports automatically**: In Agent Config → Channel, bind your Slack/DingTalk/Feishu bot. Daily reports and anomaly alerts push directly to the group — the boss stops asking "what were yesterday's numbers?" and you stop forwarding manually.

7. **Let Basic Info make the Agent fluent in growth metrics**: In User, write "growth/paid acquisition role, focused on ROI, conversion rate, CPC, and other core metrics." In Soul, write "data reports must include period-over-period changes and anomaly flags; metrics below threshold must be marked in red." The Agent's reports will naturally match the format you want.
