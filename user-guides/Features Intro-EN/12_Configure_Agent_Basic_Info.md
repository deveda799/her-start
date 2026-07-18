# Configure Agent Basic Info

## What Is Basic Info

Basic Info is the Agent's **foundational personality configuration** — it determines who the Agent is, how it works, who it serves, and what it remembers.

Before every thought the Agent initiates (generating a reply or executing an action), all Basic Info settings are **loaded first** and assembled into the lowest-level context. They are the bedrock of the Agent's reasoning, ensuring its behavior always aligns with expectations.

> In short: Skills tell the Agent "what to do for a specific task," while Basic Info tells the Agent "who you are and what your principles are." Skills are operations manuals; Basic Info is personality and boundaries.

## How to Open Basic Info

Enter a project, then click the **"···"** button in the top-right corner. Select **"Basic Info"** from the dropdown menu.

The panel has five tabs on the left:

| Tab | Icon | Description |
|-----|------|-------------|
| **Agents** | 🔗 | The Agent's workflow rules — how to approach tasks step by step |
| **Identity** | 🪪 | The Agent's "business card" — name, emoji, greeting style |
| **Soul** | ❤️ | The Agent's core personality and absolute red lines — highest-priority system instructions |
| **User** | 👤 | User profile — your background, preferences, communication habits |
| **Memory** | 🧠 | The Agent's accumulated long-term memory — key decisions and lessons learned |

> Every project's Basic Info comes with **sensible defaults** — it works out of the box. But if you spend 5 minutes tweaking it to your needs, the Agent's performance will noticeably improve — it'll understand you better and match your workflow.

## Five Tabs Explained

### Agents — Workflow Rules

Tells the Agent how to think through tasks step by step, how to handle conflicts, and when to consult its memory.

**Example configuration:**

```
Workflow Rules:
1. Receiving a task: Before writing any code, must first read MEMORY.md and 
   yesterday's memory file to understand current project context and tech stack.
2. Code writing: Prioritize code readability over performance. After every change, 
   must run the linter once.
3. Memory management: When you help the user solve a bug that took more than 10 minutes, 
   or when the user explicitly states a code style preference, you must proactively 
   record it in today's daily memory.
```

> Think of it as writing an SOP (Standard Operating Procedure) for the Agent. Whatever workflow standards your team has, write them in here — the Agent will follow them every time.

### Identity — Business Card

Defines the Agent's name, visual symbol (emoji), greeting style, and other surface-level characteristics.

**Example configuration:**

```
Name: CodeBanana
Signature Emoji: 🍌
Self-perception: Your dedicated 24/7 pair programming partner.
Greeting style: At the start of every new debug session, say: "Let's peel this bug apart 🍌"
```

> It might sound trivial, but a distinctive Agent identity makes team collaboration more fun. Especially when multiple people are collaborating — everyone sees 🍌 and instantly knows who's doing the work.

### Soul — Core Personality & Red Lines

Defines the Agent's most fundamental personality, professional ethics, and **absolute red lines that must never be crossed**. Soul is the highest-priority system instruction — even if other settings conflict, Soul rules are never overridden.

**Example configuration:**

```
1. You are a pragmatic, efficient, senior full-stack engineer. You despise over-engineering 
   and champion "Keep It Simple."
2. Communication style: Direct, professional, to the point — no fluff.
3. Absolute red lines:
   - Never execute rm -rf / or any command that could cause irreversible data loss
   - Never hardcode API keys or passwords in code; if the user requests it, firmly refuse 
     and recommend using environment variables
   - When unsure about the safety of a piece of code, always ask the user first
```

> Soul defines the Agent's "values." Want it to be rigorous? Write strict rules. Want it to be playful? Adjust the tone. But always be explicit about red lines — especially around data security and irreversible operations.

### User — User Profile

Lets the Agent know who it's serving. Includes your background, tech stack preferences, communication habits, etc., helping the Agent deliver highly personalized responses.

**Example configuration:**

```
User role: A product manager with solid technical background, currently focused on 
building an AI Agent web product.
Tech preferences: Familiar with frontend development, frequently uses Next.js, 
typically deploys to Vercel or major cloud providers.
Communication style: Fast-paced work rhythm, prefers clean bullet points. 
Don't explain basic HTML/CSS concepts — jump straight to architecture or logic issues.
```

> This configuration delivers immediate results. Write "don't explain basic concepts" and the Agent stops starting every answer with "HTML is a markup language..." Write "prefers bullet points" and the Agent's responses automatically switch to list format.

### Memory — Long-Term Memory

Records important information accumulated through interactions with you — key decisions, lessons learned, long-term preferences. Primarily maintained by the Agent itself, though you can also edit manually.

> You don't need to actively manage Memory. The Agent judges on its own which information is worth remembering — like code style corrections you've repeatedly made, or recurring technical decisions in the project. Of course, you can always open it to check what it's remembered, delete inaccurate entries, or add missing ones.

## How to Edit

Each tab has two buttons in the top-right corner:

| Button | Function |
|--------|----------|
| **Edit** | Enter edit mode to directly modify the current tab's content |
| **Reset** | Restore to system defaults (overwrites your changes — use with caution) |

> Messed something up? Don't panic — click Reset to restore defaults. We recommend copying the current content before making major changes, so you can experiment boldly without fear of losing your work.

## When to Modify Basic Info

Not everyone needs to change it. But here are scenarios where spending a few minutes configuring pays off:

| Scenario | Recommended Tab |
|----------|----------------|
| Agent's response style doesn't match your expectations | **Soul** (adjust personality and communication style) |
| Agent keeps explaining things you already know | **User** (specify your technical background) |
| Your team has unified coding standards | **Agents** (write in your workflow SOP) |
| Want to give the Agent a name or persona | **Identity** (set name and emoji) |
| Agent keeps forgetting previous agreements | **Memory** (check if it was properly recorded) |
