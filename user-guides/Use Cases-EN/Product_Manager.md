# CodeBanana Guide for Product Managers

> One of the most frustrating things about being a PM is having an idea but going through the endless cycle of "write PRD → queue for design → wait for dev → change requirements → wait for dev again" before seeing results. With CodeBanana, you can skip most of those steps and turn ideas directly into clickable prototypes.

---

## Scenario 1: Quick Competitive Analysis

### When You'd Use This

- The boss suddenly asks "what have our competitors been up to?" and you need a solid report in 30 minutes
- Pre-launch, you need to compare 3–5 competitors without spending a week registering for and testing each product
- You need to update competitive intelligence before the weekly meeting

### How to Do It

Tell the Team Agent exactly what you want to compare:

> "Do a competitive analysis of collaboration tools — compare Notion, Lark, and Yuque, focusing on their AI features"

The Agent automatically searches public information and produces a structured comparison report — product positioning, core feature comparison, pricing strategy, differentiation, opportunities, and recommendations, all laid out for you.

Need to dig deeper into a specific angle?

> "Do a deeper analysis of Notion's AI pricing strategy"

The Agent searches for the latest information and adds it to the report.

Don't want to manually check competitors every week? Set up a scheduled task:

> "Every Monday at 9 AM, automatically search for the latest updates from these three competitors and compile a comparison update"

From then on, a fresh competitive report is waiting for you before every Monday meeting — no last-minute scrambling.

### Result

Previously: register, test, research, write report — at least a week. Now: a complete comparison report in 30 minutes. With scheduled tasks set up, it auto-updates weekly — you just spend 5 minutes reviewing conclusions.

---

## Scenario 2: Turn Vague Ideas into Executable Requirements

### When You'd Use This

- You have a product idea but it's still at the "roughly what we want to do" stage
- You need to provide the dev team with a structured requirements document
- You need to quickly organize user stories and acceptance criteria before a review meeting

### How to Do It

When the idea is still rough, start in **Private Agent** to think it through on your own — it won't disturb the team, and you don't have to worry about half-baked ideas being visible to others. Once your thinking is clear, move to Team Agent and let the Agent get to work.

Describe your idea in the most natural language:

> "We want to build a loyalty points system — users earn points from purchases, and points can be redeemed for coupons"

The Agent breaks it down into complete user stories, each containing:
- **Role** (As a XX user)
- **Expectation** (I want to XX)
- **Acceptance Criteria** (specific checklist)
- **Priority** and **effort estimate**

It also plans the Sprint cadence — what to build first (core loop) and what comes later (operational capabilities).

Feel like a story is too broad? Just say:

> "Break Story 3 down further — the redemption flow is pretty complex"

The Agent splits it into 3 sub-tasks, each with independent acceptance criteria.

### Result

Previously: writing PRD + breaking down requirements took 2–3 days. Now: user stories in 10 minutes, complete with acceptance criteria and scheduling recommendations — hand it straight to the dev team.

---

## Scenario 3: Skip the PRD, Go Straight to an Interactive Prototype

### When You'd Use This

- You want to quickly validate an idea without writing a 50-page PRD first
- The boss says "show me a demo this afternoon"
- You need a clickable prototype for user testing

### How to Do It

Tell the Agent what pages you need and roughly what they should look like:

> "Build a prototype for the loyalty points system — include a points homepage, a redemption center, and a redemption detail page"

The Agent generates clickable HTML pages — not wireframes, but actually interactive pages:
- Clicking "go to redemption center" navigates there
- Clicking the "redeem" button shows a confirmation popup
- Auto-adapts to mobile screens
- You can share the link directly with anyone to try it

Changing requirements doesn't mean re-scheduling:

> "Add a search bar to the redemption center and an expiring-points reminder on the homepage"

Done in 1 minute. Happy with it? Click **Deploy** and get a permanent link — share it with the boss, the team chat, clients — anyone can open and experience it. If you make changes later, the link auto-updates; no need to send a new URL.

### Result

Traditional path: write PRD → queue for design → produce interaction drafts — at least 1–2 weeks. Now: an interactive prototype in 30 minutes that the boss and clients can directly experience. Requirements changed? One sentence and it's updated — no need to restart the process.

---

## Scenario 4: Spend 5 Minutes Training the Agent to Think Like a PM

### When You'd Use This

- The Agent keeps giving code-level answers when what you actually want is a product plan
- You keep having to repeat "use tables," "don't write code," "I'm a PM not a developer"
- You want the Agent to default to product-manager thinking when answering questions

### How to Do It

Enter the project, click **"···"** in the top-right → **"Basic Info"**, and adjust these tabs:

**User (Tell the Agent who you are):**

```
Role: Product Manager, responsible for B2B SaaS products.
Background: Familiar with prototyping and data analysis; doesn't write code directly.
Communication preference: Use tables and checklists. Don't give me code snippets. 
Output requirements in user story format with acceptance criteria.
```

**Soul (Set the Agent's working style):**

```
You are a product-thinking-driven AI assistant, skilled at turning vague ideas 
into structured plans.
- Requirements output must include: user role, expected behavior, acceptance criteria
- Comparison analysis must use tables
- Every proposal must include "recommended approach" and "not recommended approach"
- Do not provide code implementations unless I explicitly ask
```

**Agents (Define workflow):**

```
1. After receiving a requirement, first confirm the target user and core scenarios; 
   ask if unsure
2. Before outputting a plan, list an outline and confirm before expanding
3. Competitive analysis must include: product positioning, core features, pricing, 
   differentiation recommendations
```

Once configured, every response from the Agent will automatically carry these "defaults" — output formats match PM habits without having to repeat yourself.

### Result

From "having to explain you're a PM every time" to "it understands what format I want better than my intern does." 5 minutes of setup, benefits every conversation going forward.

---

## Tips for Product Managers

1. **Think in Private Agent, build in Team Agent**: When ideas aren't mature, use Private Agent to think things through first. Once confirmed, switch to Team Agent and let the Agent execute. This avoids wasting the team's attention and produces higher-quality output.

2. **Don't aim for perfection on the first pass**: Start with a rough version, see if it feels right, then iterate. The Agent doesn't mind revisions — you can change things 10 times and it won't get frustrated.

3. **Deploy once the prototype is ready**: Stop sending screenshots via WeChat. Deploy it, get a link, and let the boss open it directly on their phone — way more convincing than any screenshot. The link is permanent and auto-updates when you make changes.

4. **Automate repetitive tasks with Cron Jobs**: Competitive monitoring, industry news roundups — things you do every week belong in Cron Job. Use Scheduled Tasks for precise timing (e.g., "every Monday at 9 AM") and Heartbeat for frequency-based tasks (e.g., "check industry trends every 2 hours").

5. **Set Basic Info once, benefit long-term**: Spend 5 minutes writing in Basic Info that you're a PM, what formats you prefer, and what content you don't want. This is ten times more efficient than repeating it in every conversation.
