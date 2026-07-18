// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  OpportunityFilters,
  buildOpportunityUrl,
} from "@/components/opportunities/opportunity-filters";

describe("OpportunityFilters", () => {
  it("builds a filtered URL and resets page to one", () => {
    expect(buildOpportunityUrl({
      type: "工作机会",
      tag: "远程",
      risk: "低",
      keyword: "顾问",
      page: 8,
    }, { risk: "中" })).toBe(
      "/opportunities?type=%E5%B7%A5%E4%BD%9C%E6%9C%BA%E4%BC%9A&tag=%E8%BF%9C%E7%A8%8B&risk=%E4%B8%AD&keyword=%E9%A1%BE%E9%97%AE&page=1",
    );
  });

  it("renders accessible filters and a clear link", () => {
    render(<OpportunityFilters query={{ type: "工作机会" }} />);

    expect(screen.getByLabelText("机会类型")).toBeInTheDocument();
    expect(screen.getByLabelText("标签")).toBeInTheDocument();
    expect(screen.getByLabelText("风险等级")).toBeInTheDocument();
    expect(screen.getByLabelText("关键词")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "清除筛选" }))
      .toHaveAttribute("href", "/opportunities");
  });
});
