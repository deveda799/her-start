# Configure IM Bot (Channel)

## What Is Channel

Channel lets you connect your project's Agent to your everyday IM apps — chat with the Agent directly on Feishu, DingTalk, Slack, and other platforms without switching to the CodeBanana page.

Supported IM platforms:

| Platform | Description |
|----------|-------------|
| **Feishu** | Popular in Chinese teams |
| **DingTalk** | Popular in Chinese teams |
| **Wecom (WeCom)** | Popular in Chinese teams |
| **QQ** | Suitable for lightweight scenarios |
| **Slack** | Popular in international teams |
| **Discord** | Popular with developer communities |
| **Telegram** | Popular for international individuals and small teams |
| **Mattermost** | Self-hosted IM solution |

> Once connected, the experience is seamless: @mention the bot in your Feishu group, and the Agent in CodeBanana responds and executes. Cron job results, data alerts, and weekly reports are pushed directly to your IM group — no need to open CodeBanana to receive them.

## How to Open Channel Configuration

Two entry points — either one works:

| Entry Point | Path |
|-------------|------|
| **Inside a project** | Enter a project → click **"···"** in the top-right → select **"Channels"** |
| **Profile settings** | Click avatar in top-right → Profile → **"IM Setting"** |

> The difference: the in-project entry lets you bind a Bot directly to the current project; the profile entry is better for managing all your Bots in one place.

## Creating a Bot

1. Go to Agent Config → **Channel** → **"+ Add Bot"** (if it's your first time, the button reads "+ Add Your First Bot")
2. Select the **IM platform** you want to connect
3. Enter the platform's corresponding **ID** and **Secret** (each platform has its own process — follow the platform's documentation)
4. Click confirm to complete creation

After creation, the Bot will display a connection status:

| Status | Meaning |
|--------|---------|
| **Connected** | ID and Secret are correct; Bot is successfully connected |
| **Disconnect** | Information was entered incorrectly or connection failed; check and reconfigure |

> You can create multiple Bots for the same IM platform. For example, if you have multiple Feishu groups that need to connect to different project Agents, create multiple Feishu Bots and bind them separately.

## Binding a Bot to a Project

After creating a Bot, you need to bind it to a specific project for it to work:

1. Enter a project → click **"···"** in the top-right → **"Channels"**
2. Select the Bot you want to bind and **toggle the switch on** to complete binding

### Binding Rules

| Rule | Description |
|------|-------------|
| **One project, one Bot** | Ensures messages don't get mixed up |
| **One Bot, one project** | A bound Bot won't appear in other projects' selection lists |
| **Only Connected Bots can be bound** | Bots in Disconnect status must be fixed first |

> It's a simple one-to-one relationship: one project gets one Bot, one Bot serves one project. If you have 3 projects that all need Feishu integration, create 3 Feishu Bots and bind them individually.

## Complete Workflow Summary

```
Create Bot: Agent Config → Channel → Add Bot → Select platform → Enter ID and Secret → Confirm

Bind to project: Agent Config → Channel → Select Bot → Toggle on → Binding complete

Use in IM: @mention the bot in the corresponding IM platform → Agent responds and executes
```
