# AI-Native Index Dashboard

## What Is the Dashboard

The Organization AI Efficiency Index Dashboard is an organization-level data panel that **comprehensively monitors your organization's AI adoption progress and performance metrics**.

- Organization Owners can assess AI transformation progress and get optimization recommendations
- Members can track their own AI capability growth and ranking

> In one sentence: this dashboard tells you how well your team is using AI — who's using it, how much, what's being produced, and where there's room for improvement.

## How to Access the Dashboard

Click your **avatar in the top-right corner** of the CodeBanana page to enter your profile, then click **"AI-Native Index Dashboard"**.

## Dashboard Top: Filters and Action Bar

Four controls at the top:

| Control | Function |
|---------|----------|
| **Organization selector** | Switch between organizations to view (e.g., Mobvoi) |
| **Department selector** | Filter data by specific department |
| **Date filter** | Select a time range (e.g., 2026/03/05 - 2026/03/11) |
| **EN / 中文** | Language toggle in the top-right; defaults to English, supports Chinese |

## Core Data Cards (Three)

Below the filter bar, three key data cards are displayed:

| Card | Meaning | Example |
|------|---------|---------|
| **Active Members** | Total org size and currently active members | 168 total, 118 active (70%) |
| **Total Token Consumption** | Total token usage within the selected period and per-capita usage | 5.8B Tokens, 34.3M per person |
| **Total Cost** | Total organizational spend and per-capita cost | $29,063, $172.99 per person |

## AI Maturity Radar Chart

The radar chart visually displays your organization's scores across five AI dimensions (max 100 each) — instantly see which dimensions are strong and which need work:

| Dimension | Abbreviation | What It Measures | Core Metrics |
|-----------|-------------|-----------------|--------------|
| **AI First (AI Penetration)** | AIF | How deeply AI is integrated into daily work | Total token consumption, per-capita tokens, AI-generated code ratio |
| **Super Individual Index** | SII | Ability of "one person + AI" to independently complete projects | Super individual ratio |
| **End-to-End Quality Extension** | EPC | Whether projects form a complete loop from requirements to delivery | Extension coverage rate |
| **Organization Flatness Index** | OFI | Whether the org structure is flat and efficient | Average project participants, organizational efficiency ratio |
| **Agent Collaboration Metric** | ACM | Depth of collaboration with AI Agent | Team Agent usage rate, multi-Agent collaboration rate |

> Don't stress about seeing the radar chart for the first time — low scores don't mean you're doing poorly. Think of it more like a steering wheel that helps you see where there's room to grow. Below we'll cover what to do when each dimension scores low.

## Token Usage Trend Chart

A line chart showing the **organization-wide** token usage trend over the selected time range:
- X-axis shows dates, Y-axis shows token count
- Hover to see specific daily values (e.g., 03/09: 958.8M Tokens)
- Use it to determine if AI usage is growing or plateauing

## Department Breakdown Table

Below the chart, detailed data is broken down by department — one row per department:

| Column | Meaning |
|--------|---------|
| **Department Name** | Department name and headcount |
| **Requests** | Number of AI requests initiated by the department |
| **Tokens** | Department token consumption and per-capita tokens |
| **Cost** | Department spend and per-capita cost |

- Supports sorting to quickly find the highest or lowest usage departments
- Click "**View all XX departments**" at the bottom to expand the full list

## Five Dimension Detail Cards

Below the radar chart, five detail cards show the **specific score and detailed metrics** for each dimension:

| Card | Example Score | Details Shown |
|------|--------------|---------------|
| **AI First (AIF)** | 96 | Total token consumption, per-capita tokens, average consumption per shipped project |
| **Super Individual Index (SII)** | 50 | Ratio of members who successfully deployed projects among active users |
| **Organization Flatness Index (OFI)** | 90 | Average project participants, organizational efficiency ratio |
| **End-to-End Quality Extension (EPC)** | 60 | Ratio of projects that successfully deployed |
| **Agent Collaboration Metric (ACM)** | 47 | Team Agent usage rate, multi-Agent collaboration rate |

## AI-Powered Analysis Report

At the bottom of the dashboard, an **AI-generated analysis report** is automatically produced (takes about 10–30 seconds), providing organizational diagnostics and optimization recommendations based on current data.

> No need to analyze the numbers yourself. The dashboard directly tells you "what's going well, what needs improvement, and what to do next" — take this report to your next meeting and save hours of manual preparation.

## What to Do About Low Scores

| Low Dimension | Suggested Actions |
|---------------|-------------------|
| **AI Penetration Low (AIF)** | Set minimum AI usage standards; route requirements to Agent before humans; set a 3-month AI code ratio target |
| **Super Individual Ratio Low (SII)** | Encourage solo + Agent project completion; share Prompt templates; conduct Agent usage training |
| **End-to-End Capability Weak (EPC)** | Push projects through the full loop from requirements to deployment; reduce handoff steps |
| **Organization Flatness Low (OFI)** | Reduce management layers; encourage direct cross-department collaboration |
| **Agent Collaboration Weak (ACM)** | Promote simultaneous Team Agent + Private Agent usage; establish multi-Agent collaboration workflows |
| **High Tokens but Low Output** | Use more structured Prompts; have Agent output a plan before generating code; break tasks into smaller steps |
