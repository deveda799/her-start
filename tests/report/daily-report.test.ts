import { describe, expect, it } from "vitest";
import {
  createEmptyDailyReport,
  writeDailyReport,
} from "@/lib/report/daily-report";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("daily report", () => {
  it("uses the Asia/Shanghai date and writes an empty report", async () => {
    const now = new Date("2026-06-28T16:30:00.000Z");
    const report = createEmptyDailyReport(true, now);
    const outputDir = join(tmpdir(), `jenny-report-${Date.now()}`);

    const path = await writeDailyReport(report, outputDir);
    const saved = JSON.parse(await readFile(path, "utf8"));

    expect(report.reportDate).toBe("2026-06-29");
    expect(saved).toMatchObject({
      timezone: "Asia/Shanghai",
      dryRun: true,
      totalCollected: 0,
      totalFiltered: 0,
      totalPassed: 0,
      totalWrittenToSupabase: 0,
      totalInserted: 0,
      duplicateUrls: 0,
      machineFieldsUpdated: 0,
      manualFieldsPreserved: 0,
      pendingJennyComments: 0,
      top10Candidates: [],
      recommendedTop3: [],
      highRiskItems: [],
      sourceStats: [],
      errors: [],
    });
  });
});
