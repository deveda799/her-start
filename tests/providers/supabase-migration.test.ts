import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const migrationPath = "supabase/migrations/002_supabase_review_workflow.sql";
const dailyReportMigrationPath =
  "supabase/migrations/003_create_daily_reports.sql";

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

describe("Supabase daily report migration", () => {
  it("creates reviewable daily reports and ranked snapshot items", async () => {
    const sql = await readFile(dailyReportMigrationPath, "utf8");

    expect(sql).toMatch(/create table if not exists public\.daily_reports/i);
    expect(sql).toMatch(/report_date date not null unique/i);
    expect(sql).toMatch(/create table if not exists public\.daily_report_items/i);
    expect(sql).toMatch(/unique\s*\(\s*report_id\s*,\s*source_url\s*\)/i);
    expect(sql).toContain("status = 'published'");
    expect(sql).toContain("is_public = true");
  });

  it("uses a protected RPC without overwriting editorial fields", async () => {
    const sql = await readFile(dailyReportMigrationPath, "utf8");
    const updateBranch = sql.split("-- REPORT_MACHINE_UPDATE_START")[1]
      ?.split("-- REPORT_MACHINE_UPDATE_END")[0];
    const itemUpdateBranch = sql.split("-- ITEM_MACHINE_UPDATE_START")[1]
      ?.split("-- ITEM_MACHINE_UPDATE_END")[0];

    expect(sql).toContain("function public.ingest_daily_report");
    expect(updateBranch).toBeTruthy();
    expect(itemUpdateBranch).toBeTruthy();
    for (const field of [
      "status",
      "is_public",
      "jenny_daily_comment",
      "published_at",
    ]) {
      expect(updateBranch).not.toMatch(new RegExp(`\\b${field}\\s*=`));
    }
    for (const field of ["jenny_comment", "jenny_recommended"]) {
      expect(itemUpdateBranch).not.toMatch(new RegExp(`\\b${field}\\s*=`));
    }
  });
});
