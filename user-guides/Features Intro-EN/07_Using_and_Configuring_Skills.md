# Using and Configuring Skills

## What Is a Skill

A Skill is a **clear, executable instruction document** that tells the AI Agent — under what conditions (When), following which steps (How), to produce what result (What).

In short: **Skill = an operations manual for the AI.** Write a good Skill once, and the AI can reliably complete that task every time — no need to re-describe your requirements each session.

> For example: if you have the Agent write a weekly report every week, instead of repeating "include these sections, use this format" each time, just create a Skill. From then on, one sentence — "write the weekly report" — and the output format and quality stay consistent every time.

## How to Open Skills Management

The Skills entry point is **inside each project** — every project has its own Skills configuration. Enter a project, then click the "Skill Market" button to open the Skills management panel.

The panel has two tabs at the top:

| Tab | Description |
|-----|-------------|
| **Public** | A public library where you can browse and search community-shared Skills (supports keyword search and category filters) |
| **Private** | Skills you've created yourself |

## Adding a Skill from the Skill Market

1. Open "Skill Market" → switch to the **Public** tab
2. Find a Skill by browsing category tags (e.g., Tools, Development, Business, Data & AI) or searching by keyword
3. Click **"Add to Project"** on the Skill card
4. The Skill is now added to your current project and ready to use

> No additional configuration needed after adding. Next time your conversation triggers that Skill's scenario, the Agent will automatically follow the process defined in the Skill.

## Creating Your Own Skill

You can create Skills directly through conversations with the Agent:

1. Ask the Agent to help you create a Skill — the new Skill will appear in the **Private** tab
2. Once created, add it to any project that needs it
3. You can also publish it to **Public**, making it searchable and usable by others

## How to Write a Good Skill

A good Skill needs three core elements:

| Element | Description | Example |
|---------|-------------|---------|
| **When (Trigger)** | Under what conditions to trigger this Skill | "When the user requests a weekly report" |
| **How (Steps)** | Specific steps to execute | "1. Collect this week's changes 2. Categorize by module 3. Generate summary" |
| **What (Output)** | What the final output should be | "Output a Markdown-formatted weekly report" |

### Core Principles for Writing Skills

- **One Skill, one job** — keep responsibilities singular; don't cram multiple tasks into one Skill
- **Steps must be specific and actionable** — "analyze the code" is too vague; "check if any function exceeds 50 lines" is a good instruction
- **Define failure strategies** — tell the AI what to do when something goes wrong, e.g., "if the file isn't found, prompt the user to verify the path"
- **Avoid ambiguous language** — use "must" and "never" instead of "try to" or "consider"

### Let AI Help You Write Skills (Recommended)

The most efficient approach is to **let the AI write it for you**:

1. **Have the AI execute a real task first** — describe your goal and let the AI try to complete it
2. **Have the AI review** — after completion, ask the AI to summarize successful steps, failure points, and processes that can be standardized
3. **Generate a Skill from the review** — have the AI structure it as When / How / What
4. **Quick review** — just check if boundaries are reasonable and steps are actionable, then save

> You don't need a perfect Skill from the start. Let the Agent do it once — if it goes well, have it codify the process. If not, adjust and try again. After a few iterations, Skill quality gets increasingly stable.

### Common Mistakes (Pitfalls)

| ❌ Don't Do This | ✅ Do This Instead |
|------------------|--------------------|
| Stuff too many features into one Skill | Split into multiple independent Skills |
| "Try to use TypeScript" | "Must use TypeScript; JavaScript is not allowed" |
| Skip failure handling | Explicitly state "if XX fails, then do YY" |
| Vague steps | Make every step specific and verifiable |

## Complete Workflow Summary

```
Add & Use: Skill Market → Public → Add to Project → Available in current project

Create Your Own: Create via conversation → Appears in Private → Add to projects → Optionally publish to Public
```
