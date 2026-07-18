# CodeBanana Guide for HR (Recruiting)

> The most time-consuming part of recruiting isn't the interviews themselves — it's the prep work before and after. Writing JDs means piecing together templates, screening resumes means reading each one individually, and preparing interview questions means thinking them up on the fly. These are all tasks with clear standards that can be handled in a structured way. CodeBanana compresses these steps from "hours" to "minutes," so you can focus your energy on evaluating and connecting with candidates.

---

## Scenario 1: Write a Job Description in 5 Minutes

### When You'd Use This

- A department says "we need to hire someone" and you need a JD published quickly
- The current JD has been live for a week with barely any applicants — needs better appeal
- Same role needs to go on multiple platforms, each with a different tone

### How to Do It

Tell the Agent the key details:

> "Write a JD for a Senior Frontend Engineer. We build AI products, team of 10, tech stack is React + TypeScript"

The Agent delivers a complete JD in 5 minutes:

- **Why join us** — not a copy-paste company intro, but genuinely compelling reasons for candidates
- **What you'll do** — specific responsibilities, not "other tasks assigned by management"
- **What we're looking for** — required and nice-to-have qualifications clearly separated
- **What we offer** — salary range, benefit highlights

Need it for multiple platforms?

> "Create a shorter version for LinkedIn"

The Agent condenses it to 300 words, emphasizing compensation and highlights, matching platform conventions.

### Result

Previously: reference templates, piece together content, revise repeatedly — half a day. Now: a professional JD in 5 minutes, instantly adaptable to different platforms.

---

## Scenario 2: Screen 50 Resumes in 10 Minutes

### When You'd Use This

- The job post generated a flood of resumes and reading each one takes too long
- Need to quickly identify the best candidates and schedule interviews
- Need to compare a few candidates and decide who to interview first

### How to Do It

Resumes contain personal information, so use **Private Agent** — only visible to you, won't appear in team conversations.

Send the resumes along with the JD:

> "Screen these 50 resumes against this JD"

The Agent produces a structured screening report in 10 minutes:

**Recommended for Interview (Top 5):**
- 🥇 Alex 92 pts — 7 years React, AI product experience, open-source project with 2.5k stars → Strongly Recommended
- 🥈 Jamie 85 pts — Big tech background, strong performance optimization skills, no AI experience but trainable → Recommended
- 🥉 Morgan 78 pts…

**Rejected (with reasons):**
- Candidate A: Insufficient experience (only 2 years)
- Candidate B: Tech stack mismatch (primarily Vue)
- Candidate C: Salary expectations exceed budget

Want a deeper comparison?

> "Compare Alex and Jamie in detail"

The Agent produces a side-by-side comparison of tech stack, project experience, and soft skills.

### Result

Previously: 50 resumes took an entire day, with the risk of fatigue causing you to miss good candidates. Now: screening results in 10 minutes, each candidate scored with reasoning. You just review the top 5.

---

## Scenario 3: Complete Interview Kit in 5 Minutes

### When You'd Use This

- Interview is tomorrow and you need targeted questions
- Different candidates have different backgrounds — you don't want the same template
- Need a complete interview plan covering technical, scenario, and soft-skill questions

### How to Do It

Send the candidate's resume and role requirements to the Agent:

> "Tomorrow I'm interviewing Alex for the Senior Frontend role. Their resume highlights strong React and performance optimization experience"

The Agent delivers a complete 60-minute interview plan in 5 minutes:

- **Technical Foundation (15 min)** — tests depth of understanding, with evaluation points and expected answers
- **Project Deep Dive (20 min)** — targeted follow-ups on specific resume projects, testing practical ability
- **Scenario Questions (15 min)** — hypothetical problems testing solution design + team collaboration
- **Candidate Q&A (10 min)** — reserved time
- **Scoring Rubric** — technical depth, project experience, design skills, communication — weighted

Each question is tagged with **evaluation focus** and **follow-up directions**, so the interviewer knows where to probe.

> "Add two AI-related questions — we are an AI company after all"

30 seconds, done.

### Result

Previously: 1 hour preparing questions before an interview, and sometimes drawing a blank on good ones. Now: a complete targeted interview kit in 5 minutes with scoring rubric — higher interview quality.

---

## Tips for HR

1. **Screen resumes in Private Agent**: Candidate information is sensitive — Private Agent is the right choice. Once you've confirmed the shortlist, share the recommendations with the hiring manager.

2. **Use Scheduled Tasks for interview reminders**: Create one-time tasks in Cron Job (select "Once") — e.g., "1 hour before tomorrow's 2 PM interview, remind me with the candidate's resume summary and interview questions." For recurring tasks like "compile this week's interview schedule every Monday," use the Weekly type.

3. **Connect IM for interview updates**: In Agent Config → Channel, connect the Agent to Slack, Feishu, or DingTalk. Interview schedules and candidate evaluations get pushed directly to the recruiting channel. Hiring managers don't need to ask you "where are we with interviews?"

4. **Build your interview question library**: Save every interview kit, categorized by role. Next time you hire for a similar position, have the Agent customize based on your existing library — it gets better over time.

5. **Set confidentiality standards in Basic Info**: In Soul, write "candidate information is strictly confidential — never disclose personal data in team conversations" and "salary data must not appear in Discussion." In User, note "HR role, output targets internal recruiting processes." The Agent will automatically follow confidentiality rules when handling candidate-related tasks.
