# Portable Data Provider and Supabase Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Feishu runtime path with protected Supabase ingestion while isolating all storage access behind portable read and ingest provider interfaces.

**Architecture:** `collect` depends only on `OpportunityIngestProvider`; Next.js API routes depend only on `OpportunityDataProvider`; H5 pages fetch those API routes. `SupabaseProvider` is the current implementation, `LocalJsonProvider` is test-only, and `FutureChinaProvider` is an unimplemented interface marker for a later domestic-cloud adapter.

**Tech Stack:** TypeScript, Next.js App Router, Supabase PostgreSQL RPC, Supabase JS, Zod, Vitest

## Global Constraints

- `source_url` is the canonical unique key.
- Automated ingestion may update only machine-generated and synchronization fields.
- Ingestion must never update `status`, `is_public`, `jenny_comment`, `jenny_comment_status`, `jenny_comment_updated_at`, `review_note`, or `published_at`.
- Public reads require `status = 'published'`, `is_public = true`, `jenny_comment_status = 'approved'`, and a non-empty `jenny_comment`.
- `SupabaseProvider` is the default MVP provider.
- `LocalJsonProvider` is test-only and must not be selected in production workflow configuration.
- `FutureChinaProvider` defines a migration boundary but has no fake runtime implementation.
- Supabase SDK imports are limited to `src/lib/providers/supabase-provider.ts`.
- H5 pages fetch `/api/opportunities` and `/api/opportunities/[id]`; they never instantiate a database client.
- Feishu code may remain only under `src/lib/feishu` as an unused future adapter.
- No real credentials are added to source, tests, examples, logs, or reports.

---

### Task 1: Database review workflow and protected ingestion RPC

**Files:**
- Create: `supabase/migrations/002_supabase_review_workflow.sql`
- Create: `tests/providers/supabase-migration.test.ts`

**Interfaces:**
- Produces: `public.ingest_opportunity(p_payload jsonb)`
- Produces: RPC result `{ record_id, action, needs_jenny_comment }`
- Enforces: `source_url` unique index and complete anon RLS policy

- [ ] **Step 1: Write the failing migration contract tests**

Read the migration as text and assert exact safety properties:

```ts
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const migrationPath = "supabase/migrations/002_supabase_review_workflow.sql";

describe("Supabase review migration", () => {
  it("keeps source_url unique and restricts public reads", async () => {
    const sql = await readFile(migrationPath, "utf8");
    expect(sql).toMatch(/unique index[\s\S]+source_url/i);
    expect(sql).toContain("jenny_comment_status = 'approved'");
    expect(sql).toMatch(/nullif\s*\(\s*btrim\(jenny_comment\)/i);
  });

  it("never updates protected manual fields in the duplicate branch", async () => {
    const sql = await readFile(migrationPath, "utf8");
    const updateBranch = sql.split("-- MACHINE_UPDATE_START")[1]
      ?.split("-- MACHINE_UPDATE_END")[0];
    expect(updateBranch).toBeTruthy();
    for (const field of [
      "status",
      "is_public",
      "jenny_comment",
      "jenny_comment_status",
      "jenny_comment_updated_at",
      "review_note",
      "published_at",
    ]) {
      expect(updateBranch).not.toMatch(new RegExp(`\\b${field}\\s*=`));
    }
  });
});
```

- [ ] **Step 2: Run RED**

Run:

```powershell
npm.cmd test -- tests/providers/supabase-migration.test.ts
```

Expected: FAIL because migration `002_supabase_review_workflow.sql` does not exist.

- [ ] **Step 3: Add the migration**

The migration must:

1. Add `jenny_comment_status`, `jenny_comment_updated_at`, `review_note`, `ai_comment_suggestion`, and `raw_payload`.
2. Replace the old status check with `pending`, `published`, and `unpublished`.
3. Create `opportunities_source_url_unique_idx`.
4. Replace anon RLS with:

```sql
using (
  is_public = true
  and status = 'published'
  and jenny_comment_status = 'approved'
  and nullif(btrim(jenny_comment), '') is not null
);
```

5. Create a `security definer` RPC that:
   - first inserts with `status='pending'`, `is_public=false`, and `jenny_comment_status='ai_draft'`;
   - uses `on conflict (source_url) do nothing`;
   - if insert returned no row, updates only the machine allowlist between `-- MACHINE_UPDATE_START` and `-- MACHINE_UPDATE_END`;
   - returns the record id, `inserted|updated`, and whether the resulting `jenny_comment_status` is not `approved`;
   - revokes execute from `public`, `anon`, and `authenticated`, then grants execute to `service_role`.

- [ ] **Step 4: Run GREEN**

Run:

```powershell
npm.cmd test -- tests/providers/supabase-migration.test.ts
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```text
git add supabase/migrations/002_supabase_review_workflow.sql tests/providers/supabase-migration.test.ts
git commit -m "feat: add protected opportunity ingestion RPC"
```

---

### Task 2: Portable provider contracts and implementations

**Files:**
- Create: `src/lib/providers/contracts.ts`
- Create: `src/lib/providers/query.ts`
- Create: `src/lib/providers/supabase-provider.ts`
- Create: `src/lib/providers/local-json-provider.ts`
- Create: `src/lib/providers/future-china-provider.ts`
- Create: `src/lib/providers/provider-factory.ts`
- Create: `tests/providers/supabase-provider.test.ts`
- Create: `tests/providers/local-json-provider.test.ts`
- Modify: `src/lib/config/env.ts`
- Modify: `tests/config/env.test.ts`

**Interfaces:**
- Produces: `OpportunityDataProvider`
- Produces: `OpportunityIngestProvider`
- Produces: `createOpportunityDataProvider(env)`
- Produces: `createOpportunityIngestProvider(env)`
- Consumes: RPC from Task 1

- [ ] **Step 1: Write failing provider contract and behavior tests**

Test the desired API:

```ts
const provider: OpportunityDataProvider = new LocalJsonProvider([
  approvedPublicRow,
  { ...approvedPublicRow, id: "pending", status: "pending" },
]);
const result = await provider.listPublicOpportunities({
  page: 1,
  pageSize: 20,
  keyword: "顾问",
});
expect(result.items.map((item) => item.id)).toEqual([approvedPublicRow.id]);
```

For Supabase ingestion, inject a client with `rpc` and verify the payload:

```ts
const rpc = vi.fn(async () => ({
  data: [{
    record_id: "row-1",
    action: "updated",
    needs_jenny_comment: false,
  }],
  error: null,
}));
const provider = new SupabaseProvider(undefined, { rpc } as never);
const result = await provider.ingestOpportunity(card);
const payload = rpc.mock.calls[0][1].p_payload;

expect(result.action).toBe("updated");
expect(payload.ai_comment_suggestion).toBe(card.jennyComment);
expect(payload).not.toHaveProperty("jenny_comment");
expect(payload).not.toHaveProperty("status");
expect(payload).not.toHaveProperty("is_public");
```

Also test that Supabase public list/detail calls contain all four publication filters, keyword filtering, and that Local JSON duplicate ingestion preserves every protected manual field.

- [ ] **Step 2: Run RED**

Run:

```powershell
npm.cmd test -- tests/providers tests/config/env.test.ts
```

Expected: FAIL because provider modules and `DATA_PROVIDER` configuration do not exist.

- [ ] **Step 3: Implement contracts and query parsing**

`contracts.ts` must define:

```ts
export interface OpportunityQuery {
  page: number;
  pageSize: number;
  tag?: string;
  type?: string;
  risk?: string;
  keyword?: string;
}

export interface OpportunityListResult {
  items: PublicOpportunity[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface OpportunityDataProvider {
  listPublicOpportunities(query: OpportunityQuery): Promise<OpportunityListResult>;
  getPublicOpportunity(id: string): Promise<PublicOpportunity | null>;
}

export interface OpportunityIngestResult {
  recordId: string;
  action: "inserted" | "updated";
  needsJennyComment: boolean;
}

export interface OpportunityIngestProvider {
  ingestOpportunity(card: CaseCard): Promise<OpportunityIngestResult>;
}
```

`query.ts` owns URL parameter parsing and caps `pageSize` at 50.

- [ ] **Step 4: Implement SupabaseProvider**

Only `supabase-provider.ts` imports `@supabase/supabase-js`.

Expose:

```ts
export class SupabaseProvider
  implements OpportunityDataProvider, OpportunityIngestProvider {
  constructor(readClient?: SupabaseClient, ingestClient?: SupabaseClient);
  static forRead(url: string, anonKey: string): SupabaseProvider;
  static forIngest(url: string, serviceRoleKey: string): SupabaseProvider;
  listPublicOpportunities(query: OpportunityQuery): Promise<OpportunityListResult>;
  getPublicOpportunity(id: string): Promise<PublicOpportunity | null>;
  ingestOpportunity(card: CaseCard): Promise<OpportunityIngestResult>;
}
```

Read methods add:

```ts
.eq("status", "published")
.eq("is_public", true)
.eq("jenny_comment_status", "approved")
.not("jenny_comment", "is", null)
.neq("jenny_comment", "")
```

Ingest calls:

```ts
client.rpc("ingest_opportunity", {
  p_payload: {
    source_url: card.sourceUrl,
    title: card.title,
    source: card.source,
    published_date: card.publishedDate,
    opportunity_type: card.opportunityType,
    audiences: card.audiences,
    time_requirement: card.timeRequirement,
    skill_threshold: card.skillThreshold,
    risk_level: card.riskLevel,
    ai_assistance: card.aiAssistance,
    summary: card.summary,
    action_suggestion: card.actionSuggestion,
    score: card.score,
    tags: card.tags,
    ai_comment_suggestion: card.jennyComment,
    raw_payload: {
      scoreBreakdown: card.scoreBreakdown,
      riskReason: card.riskReason,
    },
  },
});
```

- [ ] **Step 5: Implement LocalJsonProvider and future marker**

`LocalJsonProvider` stores rows in a provided JSON file or injected in-memory array, applies the same public filter, and on duplicate writes only the machine allowlist. It must preserve manual fields by spreading the existing row first and assigning only allowed machine fields afterward.

`future-china-provider.ts` contains only:

```ts
/**
 * Migration boundary for a future real Tencent Cloud, Alibaba Cloud,
 * CloudBase, or domestic database adapter. It is intentionally not
 * registered in the provider factory until a backend is selected.
 */
export interface FutureChinaProvider
  extends OpportunityDataProvider, OpportunityIngestProvider {}
```

- [ ] **Step 6: Implement provider factory and environment validation**

Add:

```ts
DATA_PROVIDER: z.enum(["supabase", "local-json"]).default("supabase"),
LOCAL_JSON_DATA_PATH: z.string().min(1).default("output/local-opportunities.json"),
```

Rules:

- Add provider selection and Local JSON path without changing the existing mode-specific credential validation yet.
- Task 3 switches collect validation and removes Feishu configuration after the old sync runtime is deleted.
- Task 4 switches web validation after API consumers use the provider factory.

- [ ] **Step 7: Run GREEN and commit**

```powershell
npm.cmd test -- tests/providers tests/config/env.test.ts
npm.cmd run typecheck
```

Expected: provider/config tests and typecheck PASS. Existing Supabase compatibility modules remain until their consumers are migrated in Tasks 3 and 4.

```text
git add src/lib/providers src/lib/config/env.ts tests/providers tests/config/env.test.ts
git commit -m "feat: add portable opportunity providers"
```

---

### Task 3: Collect through OpportunityIngestProvider and update reports

**Files:**
- Modify: `src/lib/collect/pipeline.ts`
- Modify: `scripts/collect.ts`
- Modify: `src/lib/report/daily-report.ts`
- Modify: `src/lib/config/env.ts`
- Modify: `tests/collect/pipeline.test.ts`
- Modify: `tests/report/daily-report.test.ts`
- Modify: `tests/config/env.test.ts`
- Modify: `.github/workflows/collect.yml`
- Modify: `.env.example`
- Modify: `package.json`
- Delete: `.github/workflows/sync-published.yml`
- Delete: `scripts/sync-published.ts`
- Delete: `src/lib/sync/published-sync.ts`
- Delete: `src/lib/report/sync-report.ts`
- Delete: `src/lib/supabase/service-client.ts`
- Delete: `tests/sync/published-sync.test.ts`
- Delete: `tests/report/sync-report.test.ts`

**Interfaces:**
- Consumes: `OpportunityIngestProvider.ingestOpportunity(card)`
- Produces: Supabase/provider-neutral daily report counters

- [ ] **Step 1: Write failing collect and report tests**

Replace Feishu fixtures with:

```ts
const ingestProvider = {
  ingestOpportunity: vi.fn()
    .mockResolvedValueOnce({
      recordId: "new",
      action: "inserted",
      needsJennyComment: true,
    })
    .mockResolvedValueOnce({
      recordId: "existing",
      action: "updated",
      needsJennyComment: false,
    }),
};
```

Assert:

```ts
expect(report.totalWrittenToSupabase).toBe(2);
expect(report.totalInserted).toBe(1);
expect(report.duplicateUrls).toBe(1);
expect(report.machineFieldsUpdated).toBe(1);
expect(report.manualFieldsPreserved).toBe(1);
expect(report.pendingJennyComments).toBe(1);
```

Retain a dry-run test asserting `ingestOpportunity` is never called.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd test -- tests/collect/pipeline.test.ts tests/report/daily-report.test.ts
```

Expected: FAIL because pipeline/report still use Feishu fields.

- [ ] **Step 3: Migrate pipeline and CLI**

Change dependency:

```ts
ingestProvider?: OpportunityIngestProvider;
```

For each card outside dry-run:

```ts
const outcome = await deps.ingestProvider.ingestOpportunity(card);
report.totalWrittenToSupabase += 1;
if (outcome.action === "inserted") {
  report.totalInserted += 1;
} else {
  report.duplicateUrls += 1;
  report.machineFieldsUpdated += 1;
  report.manualFieldsPreserved += 1;
}
if (outcome.needsJennyComment) report.pendingJennyComments += 1;
```

Record individual failures with scope `data-write` and continue.

`scripts/collect.ts` creates the ingest provider through the factory only when `dryRun === false`.

- [ ] **Step 4: Migrate daily report**

Remove `totalWrittenToFeishu`; add the six counters defined above and update console labels. Keep the JSON filename and Shanghai timezone behavior unchanged.

- [ ] **Step 5: Remove sync runtime and update workflow/config**

- Remove `sync:published` from `package.json`.
- Delete the sync workflow, CLI, sync module, sync report, and their tests.
- Change `collect` validation to selected AI key plus Supabase URL/service role for `DATA_PROVIDER=supabase`; `collect-dry` still needs only the selected AI key.
- Delete all `FEISHU_*` fields from the environment schema and returned environment object.
- Collect workflow removes all `FEISHU_*` values and adds:

```yaml
DATA_PROVIDER: supabase
SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

- `.env.example` removes Feishu values and adds provider selection plus Local JSON test path.

- [ ] **Step 6: Run GREEN and commit**

```powershell
npm.cmd test -- tests/collect/pipeline.test.ts tests/report/daily-report.test.ts tests/config/env.test.ts
npm.cmd run typecheck
```

Expected: tests and typecheck PASS. The old web reader modules remain available until Task 4 migrates their consumers.

```text
git add src/lib/collect/pipeline.ts scripts/collect.ts src/lib/report/daily-report.ts src/lib/config/env.ts tests/collect/pipeline.test.ts tests/report/daily-report.test.ts tests/config/env.test.ts .github/workflows/collect.yml .env.example package.json
git rm .github/workflows/sync-published.yml scripts/sync-published.ts src/lib/sync/published-sync.ts src/lib/report/sync-report.ts src/lib/supabase/service-client.ts tests/sync/published-sync.test.ts tests/report/sync-report.test.ts
git commit -m "feat: write collected opportunities through provider"
```

---

### Task 4: Provider-backed APIs and API-only H5 pages

**Files:**
- Modify: `src/app/api/opportunities/route.ts`
- Create: `src/app/api/opportunities/[id]/route.ts`
- Modify: `src/app/opportunities/page.tsx`
- Modify: `src/app/opportunities/[id]/page.tsx`
- Create: `src/lib/api/opportunities-api-client.ts`
- Modify: `src/lib/config/env.ts`
- Modify: `tests/config/env.test.ts`
- Delete: `src/lib/supabase/opportunities.ts`
- Delete: `src/lib/supabase/public-client.ts`
- Modify: `tests/web/opportunities-api.test.ts`
- Create: `tests/web/opportunity-detail-api.test.ts`
- Create: `tests/web/opportunities-api-client.test.ts`

**Interfaces:**
- Consumes: `OpportunityDataProvider`
- Produces: `GET /api/opportunities`
- Produces: `GET /api/opportunities/[id]`
- Produces: H5 API client with unchanged `PublicOpportunity` display model

- [ ] **Step 1: Write failing API handler tests**

Extract injectable handlers:

```ts
export async function handleListRequest(
  request: NextRequest,
  provider: OpportunityDataProvider,
): Promise<NextResponse>;

export async function handleDetailRequest(
  id: string,
  provider: OpportunityDataProvider,
): Promise<NextResponse>;
```

Test list query forwarding including `keyword`, detail 200, and detail 404. The tests must use plain provider fakes and must not import Supabase types.

- [ ] **Step 2: Write failing H5 API client tests**

Test that:

```ts
await fetchOpportunityList(query, fetchImpl, "https://example.test");
expect(fetchImpl).toHaveBeenCalledWith(
  expect.stringContaining("/api/opportunities?"),
  expect.any(Object),
);

await fetchOpportunityDetail("row-1", fetchImpl, "https://example.test");
expect(fetchImpl).toHaveBeenCalledWith(
  "https://example.test/api/opportunities/row-1",
  expect.any(Object),
);
```

- [ ] **Step 3: Run RED**

```powershell
npm.cmd test -- tests/web/opportunities-api.test.ts tests/web/opportunity-detail-api.test.ts tests/web/opportunities-api-client.test.ts
```

Expected: FAIL because the provider handlers, detail API route, and API client are absent.

- [ ] **Step 4: Implement provider-backed API routes**

`GET` functions construct `OpportunityDataProvider` through the factory. Injectable handlers contain request parsing and response mapping.

Update `web` environment validation so `DATA_PROVIDER=supabase` requires Supabase URL/anon key while `DATA_PROVIDER=local-json` requires neither.

List response keeps:

```ts
{ items, page, pageSize, total, hasMore }
```

Detail returns `PublicOpportunity` or:

```ts
NextResponse.json({ error: "情报不存在或尚未发布" }, { status: 404 });
```

- [ ] **Step 5: Make H5 pages call only Next.js API**

`opportunities-api-client.ts` owns URL construction and JSON validation. Server pages determine their request origin from `x-forwarded-host`/`host` and `x-forwarded-proto`, then call the API client.

Remove every Supabase import from `src/app`. Preserve current loading, empty, error, filter, pagination, and detail UI.

- [ ] **Step 6: Run GREEN and commit**

```powershell
npm.cmd test -- tests/web
npm.cmd run typecheck
```

Expected: all web tests and typecheck PASS; `rg -n "supabase" src/app` returns no matches.

```text
git add src/app src/lib/api src/lib/config/env.ts tests/web tests/config/env.test.ts
git rm src/lib/supabase/opportunities.ts src/lib/supabase/public-client.ts
git commit -m "refactor: route H5 data access through provider API"
```

---

### Task 5: Documentation, safety audit, and full verification

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-06-29-career-intelligence-platform-design.md`
- Modify: `docs/superpowers/specs/2026-06-30-supabase-review-workflow-design.md`

**Interfaces:**
- Documents: manual Supabase review, provider replacement, domestic deployment, workflow secrets
- Verifies: no Feishu runtime dependency and no leaked credentials

- [ ] **Step 1: Update README**

README must state:

- Current MVP uses `SupabaseProvider`.
- `LocalJsonProvider` is only for local tests.
- A real `FutureChinaProvider` implementation can replace storage without rewriting H5 pages or collect.
- Vercel/Supabase are suitable for testing but not guaranteed stable in mainland China.
- Formal mainland deployment should evaluate Tencent Cloud, Alibaba Cloud, or CloudBase and ICP filing requirements.
- GitHub Actions collect can later move to a domestic cloud scheduled function.
- GitHub Secrets no longer include any `FEISHU_*` values.

Manual review steps must be exact:

1. View `status=pending`.
2. Edit or confirm `jenny_comment`.
3. Set `jenny_comment_status=approved`.
4. Set `status=published`.
5. Set `is_public=true`.

- [ ] **Step 2: Remove stale runtime documentation**

Search README, workflow, package scripts, env config, and CLI:

```powershell
rg -n "FEISHU_|sync:published|飞书" README.md .env.example package.json scripts src/lib/config .github/workflows
```

Expected: no runtime or README matches. Matches are allowed only in `src/lib/feishu` and historical design context clearly marked as superseded.

- [ ] **Step 3: Run full verification**

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

Expected: all commands exit 0.

- [ ] **Step 4: Verify dry-run without storage credentials**

Run with `.env` loading disabled, selected AI key represented by a non-secret test value, all data sources disabled by the checked-in config, and `--dry-run`.

Expected:

- CLI does not request Supabase or Feishu credentials.
- No provider write occurs.
- A Shanghai-date daily report is produced.

- [ ] **Step 5: Audit provider boundaries and secrets**

```powershell
rg -n "@supabase/supabase-js|\\.from\\(|\\.rpc\\(" src --glob '!src/lib/providers/supabase-provider.ts'
rg -n "Supabase|supabase" src/app
git grep -l -E 'sk-(proj-)?[A-Za-z0-9_-]{20,}|Bearer[[:space:]]+[A-Za-z0-9._-]{20,}' -- ':!package-lock.json'
```

Expected:

- no Supabase SDK/query usage outside the provider implementation;
- no Supabase references in H5/app routes except provider-neutral factory calls in API routes;
- no credential-like tracked values.

- [ ] **Step 6: Commit**

```text
git add README.md docs/superpowers/specs/2026-06-29-career-intelligence-platform-design.md docs/superpowers/specs/2026-06-30-supabase-review-workflow-design.md
git commit -m "docs: describe portable domestic-friendly deployment"
```

- [ ] **Step 7: Push feature branch**

```text
git push -u origin codex/add-deepseek-provider
```
