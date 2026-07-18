# CodeBanana Guide for Marketing Teams

> What marketing teams lack isn't creativity — it's execution speed. A campaign landing page takes two weeks of design and dev scheduling. A set of marketing assets goes through endless rounds of copy, design, and layout. CodeBanana lets you skip the waiting — build pages, produce assets, and monitor competitors yourself.

---

## Scenario 1: Campaign Landing Page in 1 Hour

### When You'd Use This

- Major sales events need a campaign page, and you can't wait for design/dev scheduling
- The boss needs a product showcase page by this afternoon
- You need to quickly launch a landing page for ad campaigns

### How to Do It

Tell the Agent your campaign details:

> "Build a sale campaign page: title 'Summer Sale — 50% Off Everything,' tech-style hero image at the top, red and gold color scheme, 3 products in the middle (name, original price, sale price, buy button), countdown timer at the bottom, mobile-responsive"

The Agent generates a complete page in 15 minutes — responsive layout, countdown code, everything included. Open the preview link to see it live.

Not happy with something? Fix it on the spot:

> "Make the title font larger, round the button corners"

Refresh and see the changes. Once confirmed:

> "Add analytics tracking code for page views and button clicks"

Tracking code inserted and verified. Finally, click **Deploy** to get a permanent link. This link never expires — share it on social media, paste it in ad platforms, send it to partners. If you update the page later (like adding a last-minute discount), the link auto-updates; no need to redistribute.

### Result

| Step | Traditional Process | With CodeBanana |
|------|-------------------|-----------------|
| Design visual mockup | 2 days | 0 (directly generated) |
| Wait for dev scheduling | 3–5 days | 0 |
| Development | 3 days | 15 minutes |
| Testing & revisions | 1–2 days | 15 minutes |
| Deployment | Half a day | 15 minutes |
| **Total** | **10–14 days** | **1 hour** |

---

## Scenario 2: Batch Marketing Assets in 10 Minutes

### When You'd Use This

- Launching a new product and need multiple copy styles to test
- Need copy + images + PPT as a one-stop deliverable
- Same campaign needs different styles for different channels

### How to Do It

One sentence gets you a full set:

> "Generate promotional assets for Product X"

The Agent automatically produces:
1. **5 copy styles** — tech, emotional, promotional, testimonial, scenario-based
2. **Matching images for each** — 5 style-matched images
3. **Auto-compiled PPT** — title page + one style per page (image + copy) + comparison page

Open the PPT, pick your favorite version, and launch.

Need a tweak?

> "Change the emotional copy to 'Fifteen Years of Dedication,' regenerate the image"

30 seconds and it's updated.

### Result

Previously, one set of marketing assets required 3–5 days of back-and-forth between copy, design, and layout. Now: one sentence produces 5 complete options. Don't like one? 30-second revision.

---

## Scenario 3: Automated Competitive Monitoring

### When You'd Use This

- Weekly meetings require competitive updates, but you don't have time to check daily
- Want to know if competitors have released updates, cut prices, or signed big clients
- Need regular competitive comparison reports

### How to Do It

Set it once, benefit forever:

> "Create a competitive monitoring task: every Friday at 5 PM, search for the latest news on Competitors A, B, and C, and compile a comparison table"

The Agent creates a scheduled task. Every Friday before you leave:

```
Competitive Weekly Report - This Week's Updates

| Competitor | This Week | Link | Key Info |
|-----------|-----------|------|----------|
| Competitor A | Released v3.0 | [link] | Added AI features, 10% price cut |
| Competitor B | No major updates | - | - |
| Competitor C | Signed a bank | [link] | Entering financial sector |

Key Takeaways:
- Competitor A's price cut may impact Q2 sales — worth monitoring
- Competitor C entering finance overlaps with our target market
```

Ready for Monday's meeting — no last-minute scrambling.

---

## Tips for Marketing Teams

1. **Start with an MVP landing page**: Don't aim for perfection right away. Let the Agent produce a basic version, see if it feels right, then refine. The deploy link auto-updates anyway — changes go live instantly.

2. **Build your asset library over time**: Save every piece of copy and every image generated. Over time, you'll have a growing library. Next time you run a similar campaign, iterate on existing assets.

3. **Use Scheduled Tasks for competitive monitoring**: Create a scheduled task in Cron Job, like "search for competitor updates every Friday at 5 PM." For high-frequency monitoring — like checking competitor prices every 2 hours during a major sale — use Heartbeat instead. Add check items to HEARTBEAT.md and set the interval.

4. **Share deploy links freely**: Deploy generates a permanent link that auto-updates when you change the page. Feel free to post it anywhere — social media, ad platforms, partner documents — without worrying about it expiring.

5. **Let Basic Info give the Agent a marketing mindset**: In Basic Info's User tab, write "marketing team member, output content is customer-facing." In Soul, write "copy style: engaging, highlights key points, uses data comparisons." The Agent's copy and reports will naturally carry a marketing tone — no need to keep saying "don't make it too technical."

6. **Push results to IM**: In Agent Config → Channel, connect to Slack, Feishu, or DingTalk. Competitive reports and campaign data from scheduled tasks get pushed directly to the group — the boss and teammates see it immediately without logging into CodeBanana.
