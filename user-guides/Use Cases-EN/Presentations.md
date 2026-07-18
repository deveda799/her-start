# CodeBanana Guide for Presentations (PPT)

> The most painful part of making a presentation isn't the final product — it's the process. Staring at a blank slide not knowing what to write, spending ages on each page's content, and then having to prepare speaker notes on top of it all. CodeBanana chains these three steps together: first clarify the structure, then fill in the content, finally write the speaking script. The whole process goes from "one day" to "1 hour."

---

## Scenario 1: Outline Ready in 5 Minutes

### When You'd Use This

- Need to make a presentation but don't know how to organize the structure
- You know what to say, but not what order to say it in
- Need to quickly confirm the framework before filling in content

### How to Do It

If you haven't figured out the organization yet, start in **Private Agent** to think it through — "what am I presenting, where's the focus, what does the boss care about most?" Once your thinking is clear, let the Agent produce the formal outline.

Tell the Agent your scenario:

> "I need to do a Q1 business review presentation for the CEO next week, about 20 minutes"

The Agent produces a complete outline in 5 minutes:

- Recommends 15 slides, time allocated to each section
- **Part 1 (4 min)**: Results overview — key metrics, major projects, team highlights
- **Part 2 (8 min)**: Key project retrospectives — each project's context → approach → results → learnings
- **Part 3 (3 min)**: Problems & challenges — honest assessment + improvement measures
- **Part 4 (4 min)**: Q2 plan — quantified goals + project roadmap + resource asks
- **Closing (1 min)**: One-sentence summary + Q&A

Need to adjust the structure?

> "We only had two major projects — remove Project C, add a team development section"

30 seconds to update. Confirm the outline before moving forward — this avoids scrapping everything halfway through.

---

## Scenario 2: Fill All Slides in 20 Minutes

### When You'd Use This

- The outline is set, but you can't figure out what to put on each slide
- Want a complete presentation generated that you can edit afterward
- Being rushed for the PPT and need the fastest possible first version

### How to Do It

> "Generate PPT content based on the outline we just made"

The Agent generates page by page:

**Cover slide:** Title + Department + Name + Date

**Project retrospective slide:**
```
Summer Campaign Project

Context: Company's first major promotional event
Goal: GMV exceeding $100K

Approach:
→ 2-week pre-launch warmup across 3 channels
→ Daily data monitoring + real-time optimization during event
→ Tiered discounts to increase average order value

Results:
GMV $128K (28% over target) | New customers 42% | ROI 3.2

Lesson: Pre-launch investment directly drives Day 1 performance
```

**Problems & challenges slide:** Lists issues + actions already taken + next steps — not just listing problems

The output is a complete PPT file or HTML presentation. If it's HTML, you can directly **Deploy** for a permanent link — share with colleagues for preview or let the boss view on their phone. The link auto-updates when you make changes.

Need to fix a number?

> "Page 4 — change GMV to $115K"

Updated instantly.

---

## Scenario 3: Speaker Notes in 10 Minutes

### When You'd Use This

- PPT is done but you don't know what to say for each slide
- Worried about running over time or sounding too dry
- Need to control pacing — when to pause, when to look at the audience

### How to Do It

> "The PPT is ready — write me a 20-minute speaking script"

The Agent outputs page-by-page speaker notes, including not just content but presentation technique prompts:

**Cover slide (30 sec):**
> "Good afternoon everyone. I'll be presenting the Marketing team's Q1 results. Let me start with the bottom line: we exceeded 2 out of 3 core targets in Q1. One fell short, but we've identified the root cause and have a fix in place."

**Key metrics slide (1 min 30 sec):**
> "Let's look at the core numbers. (point to first metric) GMV hit $850K, 94% of target…"
> 
> ⏱ Tip: Don't expand on details here — give the big picture first

**Project retrospective slide (3 min):**
> "Let me focus on the Summer Campaign project… We got three things right… (look at the CEO) If we run another major sale in Q2, this playbook is reusable."
> 
> ⏱ Tip: Focus on "why we did this," not a play-by-play

Too long?

> "Compress to 15 minutes"

The Agent trims the script and adjusts timing.

---

## Tips for Presentation Builders

1. **Use Private Agent to organize your thoughts first**: When you don't know how to structure things, chat with the Agent in Private Agent. It helps you sort out the logic. Once you're clear, produce the formal outline.

2. **One core message per slide**: If the Agent's content is too dense, ask it to simplify — "keep only the single most important conclusion on this slide." Good presentations aren't about cramming in more information.

3. **Deploy the HTML version and present on the spot**: If the output is an HTML presentation, Deploy it, get the link, open the browser full-screen, and present. No USB drive needed, no compatibility worries.

4. **Practice the speaker notes**: The Agent's script helps you organize flow and pacing, but you still need to rehearse a couple of times. Especially transitions and pause points — the difference between practiced and unpracticed is massive.

5. **Lock in your presentation style with Basic Info**: In Soul, write "PPT content style: one core message per slide, heavy on data and charts, minimal long paragraphs. Speaker notes style: conversational, rhythmic, with pause markers." In User, note "typical audience is C-suite/VP level; they care about results and recommendations, not process details." Every PPT and script the Agent produces will automatically align with your presentation standards.

6. **Use Scheduled Tasks to prep recurring presentations**: If you do a monthly business review, create a task in Cron Job: "on the 25th of every month, auto-compile this month's key data and generate a PPT outline draft." When it's time to build the deck, the data and framework are already prepared — you just add your judgment and highlights.
