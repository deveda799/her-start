# Configure Scheduled Tasks (Cron Job)

## What Is Cron Job

Cron Job lets the Agent **wake up and work automatically** at times you specify — no manual trigger needed. It runs on schedule and can send results back to the chat automatically.

Whether you want "a daily report every morning at 9 AM," "an email check every 30 minutes," or "a reminder in 20 minutes about my meeting" — Cron Job is the mechanism for all of these.

> Simple way to think about it: normally you chat with the Agent in a "you say one thing, it does one thing" pattern. With Cron Job, it's "you set the rules, it acts on schedule."

## How to Open Cron Job

Enter a project, then click the **"···"** button in the top-right corner. Select **"Cron Job"** from the dropdown menu.

The page is divided into two sections:

| Section | Description |
|---------|-------------|
| **Heartbeat** | Top half — batch-executes a set of tasks at fixed time intervals |
| **Scheduled Tasks** | Bottom half — executes individual tasks at precise time points |

## Heartbeat vs. Scheduled Tasks: How to Choose

The two approaches serve different scenarios. Not sure which to use? Follow this decision tree:

```
1. Is this a one-time reminder?
   Yes → Use Scheduled Tasks
   No → Continue...

2. Does the task need to run at a precise time?
   Yes → Use Scheduled Tasks
   No → Continue...

3. Can this task be batch-processed with other periodic checks?
   Yes → Use Heartbeat (add to HEARTBEAT.md)
   No → Use Scheduled Tasks
```

| Type | Best For | Example |
|------|----------|---------|
| **Heartbeat** | Multiple small tasks needing regular batch checks | Check email every 30 min + check data anomalies + check service status |
| **Scheduled Tasks** | Precise timing, one-time reminders | Read email at 7 AM daily, remind me at 3 PM next Friday |

> The difference is simple: Heartbeat is "run through the entire checklist every X minutes." Scheduled Tasks is "do this one thing at this exact time."

## Heartbeat — Recurring Batch Tasks

### How to Configure

1. In the top section of the Cron Job page, set the **interval** (e.g., Run every 30 Minutes)
2. Click **Apply** to save the setting
3. **Toggle the switch on** — Heartbeat starts running

Once enabled, the system will automatically execute **all tasks listed in HEARTBEAT.md** every time the interval elapses.

### Editing the Task Checklist

HEARTBEAT.md is the Heartbeat task checklist. Two buttons in the top-right corner:

| Button | Function |
|--------|----------|
| **Edit** | Edit the checklist — add or modify tasks to run periodically |
| **Reset** | Restore to system default state |

> Just write whatever you need checked regularly into HEARTBEAT.md. For example, "check if there are new emails" or "check the dashboard for anomalous metrics" — the Agent will run through the entire checklist every interval.

## Scheduled Tasks — Precise Timing

### How to Create

1. In the bottom section of the Cron Job page, click **"+ New Task"**
2. A creation panel appears with these fields:

| Field | Description |
|-------|-------------|
| **Task Name** | Give the task a name (required), e.g., "Daily Morning Report" or "Friday Competitive Analysis" |
| **Trigger Conditions** | When the task should trigger (click "+ Add Condition" to add) |
| **Execution Flow** | What to execute when triggered (required) |

3. Click **"Create Task"** to finish

### Trigger Conditions

Two trigger methods are supported:

**Method 1: Scheduled (Time-Based)**

| Option | Meaning | Example |
|--------|---------|---------|
| **Daily** | At a specific time every day | Every day at 7:00 AM |
| **Weekly** | At a specific time on a specific day of the week | Every Friday at 5:00 PM |
| **Monthly** | At a specific time on a specific day of the month | 1st of every month at 9:00 AM |
| **Once** | One-time execution | April 5, 2026 at 3:00 PM |
| **Every** | Fixed interval execution | Every 2 hours |

**Method 2: File Watch (File Change Trigger)**

Automatically triggers a task when files in a specified folder change. You can select which folder to monitor and which event types to watch (created, modified, deleted).

> For example, "when a new Excel file is uploaded to the /data directory, automatically analyze it and generate a report" — that's a classic File Watch use case.

### Execution Flow

Describe what the Agent should do when triggered. Write it in natural language:

- "Read unread emails, sort by urgency, generate a summary and send it back to the chat"
- "Search for the latest updates on Competitors A, B, and C, and compile a comparison table"
- "Check the /data directory for newly uploaded files, auto-categorize them, and update the index"

## Complete Workflow Summary

```
Heartbeat: Set interval → Apply → Toggle on → Edit HEARTBEAT.md with task checklist → Auto-executes all tasks on schedule

Scheduled Tasks: New Task → Enter task name → Set trigger conditions (time or file change) → Describe execution flow → Create Task → Auto-executes on schedule
```
