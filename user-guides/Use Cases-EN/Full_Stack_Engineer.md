# CodeBanana Guide for Full-Stack Engineers

> An engineer's day isn't just about writing new features — a huge amount of time goes to scaffolding projects, fixing bugs, and code reviews. CodeBanana isn't replacing you; it's like having a senior colleague who's always online: you share an idea, it implements it; you paste an error, it locates the issue; you commit code, it reviews it for you.

---

## Scenario 1: Build a Complete Project from Scratch

### When You'd Use This

- New project kickoff — need to scaffold frontend + backend + database
- You want to build an internal tool with Next.js + PostgreSQL but don't want to spend half a day configuring the environment
- The boss says "build a XX management system" and you need to ship an MVP as fast as possible

### How to Do It

Just describe your requirements clearly:

> "Build me a task management system — Next.js + PostgreSQL, with CRUD for tasks, status transitions, and filtering by assignee"

The Agent handles the entire stack:

1. **Database design** — automatically creates the PostgreSQL database, builds tables, adds indexes, data structure figured out for you
2. **Backend API** — RESTful endpoints with CRUD + filtering/sorting, error handling included
3. **Frontend pages** — complete UI with tables, forms, filters, responsive layout
4. **Integration** — frontend and backend connected, data flowing from database to page

Not happy with something? Just say:

> "Add batch delete to the table, plus an Excel export"

The Agent makes the changes and you see the results on refresh. Looking good? Click **Deploy** to get a permanent link. This link never expires, and if you change the code later it auto-updates — share it with the team and they can start using it immediately.

### Result

Building a full-stack project from scratch (database + API + frontend + deployment) traditionally takes at least 2–3 days. Now it's done in 30 minutes to 1 hour, and the team can start using it the moment it's deployed.

---

## Scenario 2: Paste the Error, Get It Fixed

### When You'd Use This

- Console full of red text and you can't figure out what went wrong
- There's a logic bug but you can't reproduce it
- Users report a white screen in production and you need to locate the issue fast

### How to Do It

If it's a bug you're hitting personally, use **Private Agent** to debug — it won't affect Team Agent's context, and you won't flood your colleagues with debugging logs.

Paste the error directly:

> "Users are reporting a white screen. Here's the console error:
> `TypeError: Cannot read properties of undefined (reading 'map') at UserList (UserList.tsx:15)`"

The Agent immediately does three things:

1. **Locates the problem** — which file, which line, why the variable is undefined
2. **Provides a fix** — not just patching that one line, but adding loading states, error handling, and empty data displays
3. **Applies the fix directly** — you don't need to manually edit; the Agent handles it

If there are related issues, keep going:

> "It's fixed, but the list is loading really slowly — takes 5 seconds"

The Agent continues investigating — checking API response times, SQL queries for pagination, missing indexes — tracing all the way to the root cause.

### Result

Previously, debugging a bug (especially in an unfamiliar codebase) could take half a day. Now: paste error → locate cause → get fix → code updated, 5 minutes flat.

---

## Scenario 3: Code Review — An Extra Pair of Eyes

### When You'd Use This

- You've finished coding and want to review it yourself before committing
- Your colleague's code review is backed up, but you don't want to merge blindly
- Sensitive logic (payments, permissions) and you want another set of eyes

### How to Do It

Hand the code to the Agent:

> "Review my payment API code"

The Agent reviews line by line like a strict Senior Engineer, with a tiered report:

- **🔴 Critical issues** (must fix): SQL injection, unvalidated amounts, security vulnerabilities
- **🟡 Improvement suggestions** (should fix): incomplete error handling, missing logs, functions too long
- **📊 Summary**: Code quality score + priority order

It doesn't just find problems — it provides fix code too. Want the critical issues addressed?

> "Fix all the critical issues"

The Agent applies the fixes; you just review the changes.

### Result

Previously, waiting for a colleague's review meant scheduling delays; self-review has blind spots. Now you can review anytime — security vulnerabilities, performance issues, readability problems, nothing missed. For high-risk code like payments and permissions, an extra layer of AI review gives real peace of mind.

---

## Scenario 4: Use Basic Info to Build Your Custom Coding Partner

### When You'd Use This

- The Agent's code style doesn't match your project (e.g., you use 4-space indentation but it uses 2)
- You keep reminding it "use TypeScript, not JavaScript"
- You want the Agent to ask before executing sensitive operations rather than just doing it

### How to Do It

Enter the project, click **"···"** in the top-right → **"Basic Info"**, and adjust these tabs:

**Agents (Write your coding workflow SOP):**

```
1. Before writing code, read MEMORY.md to understand the project's tech stack 
   and past decisions
2. Prioritize code readability — functions under 50 lines, files under 300 lines
3. After every change, must run linter and unit tests
4. For architecture-level changes, propose a plan and wait for confirmation before proceeding
```

**Soul (Set security red lines):**

```
1. Pragmatic, efficient senior full-stack engineer; champion "Keep It Simple"
2. Absolute red lines:
   - Never execute rm -rf / or any irreversible deletion commands
   - Never hardcode API Keys or passwords; must use environment variables
   - When unsure about safety, always ask first
3. Code style: 4-space indentation, must use TypeScript, no 'any' type allowed
```

**User (Tell the Agent your technical background):**

```
Senior full-stack engineer. Primary stack: Next.js + TypeScript + PostgreSQL
Deployment: Vercel + Neon
No need to explain basic concepts — go straight to solutions and code
```

**Memory** doesn't need manual setup — the Agent accumulates it through working with you. For example, if you correct it once about "don't use var," it remembers and won't repeat the mistake.

### Result

It's like installing your coding standards into the Agent. Every piece of code it writes automatically follows your conventions — indentation, naming, security red lines — no reminders needed.

---

## Tips for Engineers

1. **Debug in Private Agent, collaborate in Team Agent**: Fix your own bugs in Private Agent without cluttering colleagues' feeds. Use Team Agent for code changes the whole team needs to see.

2. **Let the Agent handle what you don't want to but have to do**: Writing unit tests, adding comments, inserting logs, formatting code — hand these to the Agent and focus on core logic.

3. **Make Code Review a habit**: Have the Agent review every commit before pushing — it's like a free Senior Review. Especially for security and performance-sensitive code.

4. **Automate recurring checks with Cron Job**: Heartbeat is ideal for "run this periodically" tasks — like "run test suite every 30 minutes" or "check production endpoints every hour." Once set, the Agent runs automatically and notifies you if something fails. For precise timing ("run full test suite at 9 AM daily"), use Scheduled Tasks.

5. **Basic Info is your coding standards document**: Spend 10 minutes putting your code style, security red lines, and workflow into Agents and Soul. More reliable than verbal agreements. When new members join the project, the Agent follows the same standards automatically.
