# Plans & Usage Management

## Plans & Pricing

CodeBanana offers four plans:

| Plan | Monthly | Annual (per month) | Included Requests | Best For |
|------|---------|-------------------|-------------------|----------|
| **Free Plan** | $0/month | $0/month | 30 requests | Exploring and experimenting, personal hobby projects |
| **Personal Plan** | $20/month | $16/month | 300 requests | Individual developers, daily development |
| **Professional Plan** | $40/month | $32/month | 1000 requests | Professional developers, high-frequency usage |
| **Team Plan** | Custom | Custom | 300 requests/person/month | Team collaboration, enterprise needs |

> The Free Plan's 30 requests are enough to fully experience a small project — from creation to conversation to deployment. Walk through the entire workflow before deciding whether to upgrade; there's no rush.

### VM Configuration Options
- Personal and Professional plans allow you to choose **different VM specifications**
- Billing is based on your selected VM tier
- You can upgrade your VM anytime from the Usage or Upgrade pages

---

## Non-Team Plans (Free / Personal / Professional)

### Billing Model

Each plan includes a fixed number of requests (30 / 300 / 1000). When they run out, you have two options:

1. **Upgrade your plan**: Switch to a higher-tier plan on the Upgrade page
2. **Usage-based billing**: Enable usage-based billing on the Usage page — set a spending limit, and the system automatically creates a **Stripe** invoice for top-up

> Don't worry about getting cut off suddenly — you'll get alerts as you approach your limit. With usage-based billing enabled, your work continues uninterrupted even after requests run out.

### Billing Attribution

- Billing follows Agent ownership — the project **Owner** manages Agent permissions, and costs are deducted from the Owner's quota
- **Private Agent usage** is also charged to the project Owner's account (because Private Agent conversations are considered work done for the project)

> Simply put: **whoever created the project pays the bill.** Whether you're using Team Agent yourself or a teammate is using Private Agent in your project, it all comes from your (Owner's) quota.

---

## Team Plan

Team Plan is designed for organizations that need team collaboration, with an **admin (Owner) managing** members' plans and usage centrally.

### Billing Model

- Each member added to the Team Plan gets **300 requests per month**
- The admin can assign different VM configurations to each member; seat fees are charged to the Owner's credit card based on the VM tier
- When requests run out, usage-based billing kicks in automatically — the **spending limit is set by the admin**

### Admin Operations

#### Adding Members to Team Plan

1. Go to Profile → **Usage** → **Members** page
2. Click **"Add Member"** and select from organization members
3. Set the member's **VM configuration** and **On-demand Usage limit**
4. Confirm — the seat fee is charged to the Owner's credit card

> Joining an organization ≠ joining the Team Plan. After a member joins your organization, the admin still needs to manually add them to the Team Plan in the Members page for them to receive team benefits. Members not added to the Team Plan will be billed under their own personal plan.

#### Changing Member Configuration

Admins can adjust a member's VM configuration and On-demand Usage limit at any time:

| Action | Effective | Billing |
|--------|-----------|---------|
| **Upgrade VM** | Immediately | Difference charged to Owner's credit card |
| **Downgrade VM** | Immediately | Remaining balance held in Stripe account to offset future invoices |

**How the difference is calculated:**
- Usage amount = (Total value ÷ Total days × Days used) vs. $0.15/request — whichever is **higher**
- Remaining balance = Amount paid - Usage amount
- Difference = New plan price - Remaining balance

> After a downgrade, the remaining balance stays in the Stripe account to offset the next invoice. If you need the balance refunded, submit a request via email.

#### Viewing Invoices

Admins can view all invoice details at Profile → **Billing** page.

### Member Perspective

After being added to the Team Plan by the admin:
- Get **300 requests per month**
- VM configuration and On-demand Usage limit are set by the admin
- **When the limit is reached, contact the admin to increase it**

> As a member, you don't need to worry about billing — quotas and configurations are managed centrally by the admin. When you're approaching your limit, just let the admin know.

### Team Plan Billing Mechanism

| Trigger | Description |
|---------|-------------|
| **When a seat is activated** | Seat fee charged to the Owner's credit card |
| **Automatic settlement** | When all Team Plan members' cumulative On-demand Usage reaches **$2,000**, or when the billing cycle reaches **30 days**, charges are automatically applied to the Owner's credit card |

---

## Viewing Usage

Click your **avatar in the top-right corner** to access your profile:

| Page | Description |
|------|-------------|
| **Usage** | View all token and quota usage details; supports export |
| **Members & Quotas** | View usage details for all organization members (visible to Team Plan admins) |
| **Billing** | View all invoice details (visible to Team Plan admins) |

Every charge has a detailed breakdown — what was spent, where it went, crystal clear.

## Contacts Management

- **Contacts**: View organization join requests, organization members, and added friends
- Currently only shows the organization selected on the Studio page; switch organizations to view others
