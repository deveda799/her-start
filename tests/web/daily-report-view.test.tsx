// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DailyReportEmpty } from "@/components/reports/daily-report-empty";
import { DailyReportView } from "@/components/reports/daily-report-view";
import type { PublicDailyReport } from "@/lib/types";

const report: PublicDailyReport = {
  id: "report-1",
  reportDate: "2026-07-02",
  title: "珍妮35+女性职业机会日报",
  subtitle: "每日筛选适合35+女性、宝妈和职场转型者的机会",
  summary: "今日重点关注灵活就业。",
  totalCollected: 28,
  totalSelected: 10,
  totalRecommended: 3,
  totalHighRisk: 1,
  totalLowBarrier: 6,
  totalAiAssisted: 8,
  trendAnalysis: {
    opportunityTypes: { 工作机会: 6, 副业案例: 4 },
    audiences: { 宝妈: 7 },
    riskLevels: { 低: 7, 中: 2, 高: 1 },
    observations: ["远程和灵活机会增加"],
    focusDirections: ["关注可验证的小项目"],
    riskWarnings: ["警惕先交费后就业"],
  },
  actionSuggestions: {
    jobSeeker: "今天更新一版简历",
    fullTimeMom: "先看每天2小时的机会",
    sideHustle: "先访谈3位客户",
    aiEfficiency: "用AI拆解岗位要求",
  },
  jennyDailyComment: "今天优先看低成本可验证方向。",
  publishedAt: "2026-07-02T01:00:00.000Z",
  items: [
    {
      id: "item-1",
      opportunityId: "opportunity-1",
      rank: 1,
      title: "远程内容顾问",
      source: "公开来源",
      sourceUrl: "https://example.com/one",
      opportunityType: "工作机会",
      audiences: ["35+女性", "宝妈"],
      skillLevel: "低门槛",
      timeRequirement: "每天2小时",
      riskLevel: "低",
      score: 92,
      aiSummary: "可从小项目开始验证。",
      reasonForSelection: "时间灵活且行动路径清晰。",
      actionStep: "今天整理一个作品案例。",
      jennyComment: "适合先用一周试跑。",
      jennyRecommended: true,
      tags: ["远程"],
    },
    {
      id: "item-2",
      opportunityId: null,
      rank: 2,
      title: "AI资料整理服务",
      source: "公开来源",
      sourceUrl: "https://example.com/two",
      opportunityType: "AI提效",
      audiences: ["职场转型者"],
      skillLevel: "低门槛",
      timeRequirement: "每周5小时",
      riskLevel: "中",
      score: 86,
      aiSummary: "先从熟悉行业切入。",
      reasonForSelection: "启动成本较低。",
      actionStep: "做一个演示样例。",
      jennyComment: null,
      jennyRecommended: false,
      tags: ["AI"],
    },
  ],
};

describe("DailyReportView", () => {
  it("renders the report structure and only optional editorial comments", () => {
    render(<DailyReportView report={report} />);

    expect(screen.getByRole("heading", { name: report.title })).toBeVisible();
    expect(screen.getByText("今日Top机会榜单")).toBeVisible();
    expect(screen.getByText("珍妮推荐")).toBeVisible();
    expect(screen.getByText("适合先用一周试跑。")).toBeVisible();
    expect(screen.getAllByText("珍妮点评")).toHaveLength(1);
    expect(screen.getByText("今日趋势分析")).toBeVisible();
    expect(screen.getByRole("heading", { name: "今日行动建议" })).toBeVisible();
    expect(screen.getByRole("link", { name: "查看全部机会库" }))
      .toHaveAttribute("href", "/opportunities");
  });

  it("uses a calm empty state", () => {
    render(<DailyReportEmpty />);

    expect(screen.getByText("今日情报正在整理中，请稍后查看。"))
      .toBeVisible();
    expect(screen.queryByText(/无法加载/)).not.toBeInTheDocument();
  });
});
