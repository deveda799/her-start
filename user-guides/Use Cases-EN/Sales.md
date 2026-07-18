# CodeBanana Guide for Sales

> Two things salespeople fear most: forgetting to follow up with a client, and getting stumped on competitor questions in meetings. CodeBanana helps you systematize client management — log client info with a single sentence, get automatic weekly reminders on who to contact, and never manually compile a weekly report again. Competitive intelligence is tracked automatically too — ready to go for Monday meetings.

---

## Scenario 1: Client Follow-Up Management in 10 Minutes

### When You'd Use This

- Client information is scattered across spreadsheets, messaging apps, and notebooks — hard to find
- Follow-up reminders depend entirely on your memory, and occasionally things slip
- Weekly reports take 1 hour of trying to recall who you talked to this week

### Step 1: Create the System (3 minutes)

> "Help me create a client follow-up management system"

The Agent automatically sets up: a client list file, a follow-up log file, supporting "add client," "log follow-up," and "generate weekly report" operations.

### Step 2: Set Auto-Reminders (2 minutes)

> "Every Monday at 9 AM, remind me which clients need follow-up this week"

Every Monday morning you'll receive a list — who to call, who needs a proposal, who's due for a check-in. No more flipping through calendars.

If you primarily use Slack, WeChat Work, or DingTalk, connect the Agent to IM (in Agent Config → Channel). Monday reminders get pushed straight to your IM — no need to open CodeBanana.

### Step 3: Daily Use — Just Talk

**Log a client:**

> "Add client: Mr. Zhang at Wanda, head of procurement, last discussed product upgrade needs, next follow-up March 25"

The Agent auto-saves and formats.

**Log a follow-up:**

> "Contacted Mr. Zhang at Wanda today — confirmed budget of $200K, needs a proposal by end of month"

The Agent appends to the follow-up log, auto-tags date and next steps.

**Generate weekly report:**

> "Generate this week's sales report"

The Agent auto-summarizes: how many clients visited, new leads added, confirmed interest, next week's plan. Copy and send to the boss.

### Result

| Dimension | Traditional | With CodeBanana |
|-----------|------------|-----------------|
| Client info | Scattered everywhere, hard to find | Centrally managed in one place |
| Follow-up reminders | Manually set calendar, easy to forget | Auto-reminder every Monday |
| Weekly report | 1 hour recollecting and compiling | 5 seconds, auto-generated |

---

## Scenario 2: Automated Competitive Monitoring

### When You'd Use This

- Weekly meetings require competitive updates, but you don't have time to check daily
- Want to know if competitors have cut prices, released updates, or signed major clients
- Client asks "how are you better than XX?" and you need to answer with confidence

### How to Do It

One-time setup:

> "Create a competitive monitoring task: every Friday at 5 PM, search for the latest updates on Competitors A, B, and C, and compile a comparison table"

Every Friday before you leave:

```
Competitive Weekly Report

| Competitor | This Week | Price Changes | Key Info |
|-----------|-----------|---------------|----------|
| Competitor A | Released new version | 10% price cut | Added AI features |
| Competitor B | No updates | No change | — |
| Competitor C | Signed major client | No change | Entered financial sector |
```

Ready for Monday's meeting — no last-minute searching. When a client asks about the competition, you have the answers.

### Result

- No more manually checking competitor websites weekly
- Key information auto-organized, saving summarization time
- Received Friday, ready for Monday's meeting

---

## Tips for Sales

1. **Log immediately after every meeting**: After a call or visit, take 10 seconds to tell the Agent the key details. Information logged while fresh is most accurate — wait until the weekend and half of it is forgotten.

2. **Make the most of Monday reminders**: After reviewing Monday's reminder, spend 5 minutes planning this week's follow-up order. Planned follow-ups are far more reliable than memory-based ones. Scheduled Tasks in Cron Job supports Weekly type — "every Monday at 9 AM" is a perfect fit for precise timing.

3. **Update competitive intelligence in real-time**: A client shares competitor news? Immediately have the Agent record it. These front-line insights are more valuable than anything you'd find searching online.

4. **Weekly reports aren't just for the boss**: Review your own follow-up records each week and look for clients that have gone quiet for several weeks. Sometimes a neglected client is your biggest opportunity.

5. **Connect IM for on-the-go logging**: In Agent Config → Channel, connect the Agent to your everyday IM. After meeting a client, @mention the bot right there in your IM group: "Log: met with XX client today, confirmed budget XX" — no laptop needed, no logging into CodeBanana. You can capture follow-up data while walking to your next meeting.

6. **Let Basic Info teach the Agent sales language**: In User, write "sales role, focused on client follow-ups, pipeline management, competitive intelligence." In Soul, write "output style: concise and direct, use tables for client lists, weekly reports must include new leads count, follow-ups completed, and confirmed opportunities." Once set, the Agent's output naturally matches your ideal sales report format.
