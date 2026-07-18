export type SourceType = "rss" | "web" | "manual" | "search";

export interface RawItem {
  title: string;
  url: string;
  summary: string;
  source: string;
  publishedAt: string | null;
  sourceId: string;
  sourceType: SourceType;
}

export interface ScoreBreakdown {
  audienceFit: number;
  painStrength: number;
  actionability: number;
  timeliness: number;
  riskControl: number;
}

export interface CaseCard {
  title: string;
  source: string;
  sourceUrl: string;
  publishedDate: string | null;
  opportunityType: "工作机会" | "副业案例" | "AI提效" | "灵活就业" | "避坑";
  audiences: string[];
  timeRequirement: string;
  skillThreshold: string;
  riskLevel: "低" | "中" | "高";
  aiAssistance: string;
  summary: string;
  jennyComment: string;
  actionSuggestion: string;
  tags: string[];
  scoreBreakdown: ScoreBreakdown;
  score: number;
  riskReason: string;
  status: "待审核";
  createdAt: string;
}

export interface ReportError {
  scope: string;
  sourceId?: string;
  message: string;
}

export interface SourceStat {
  sourceId: string;
  sourceName: string;
  collected: number;
  passed: number;
  skipped: number;
  errors: number;
}

export interface SourceCollectionResult {
  items: RawItem[];
  errors: ReportError[];
  skipped: string[];
}

export interface SearchBudget {
  remaining: number;
  consumed: number;
}

export interface PublicOpportunity {
  id: string;
  title: string;
  sourceUrl: string;
  opportunityType: string;
  audiences: string[];
  timeRequirement: string | null;
  skillThreshold: string | null;
  riskLevel: string;
  aiAssistance: string | null;
  summary: string;
  jennyComment: string | null;
  actionSuggestion: string | null;
  publishedDate: string | null;
  source: string;
  tags: string[];
  score: number;
  publishedAt: string | null;
}

export interface ReportTrendAnalysis {
  opportunityTypes: Record<string, number>;
  audiences: Record<string, number>;
  riskLevels: Record<string, number>;
  observations: string[];
  focusDirections: string[];
  riskWarnings: string[];
}

export interface ReportActionSuggestions {
  jobSeeker: string;
  fullTimeMom: string;
  sideHustle: string;
  aiEfficiency: string;
}

export interface PublicDailyReportItem {
  id: string;
  opportunityId: string | null;
  rank: number;
  title: string;
  source: string;
  sourceUrl: string;
  opportunityType: string;
  audiences: string[];
  skillLevel: string | null;
  timeRequirement: string | null;
  riskLevel: string;
  score: number;
  aiSummary: string;
  reasonForSelection: string;
  actionStep: string;
  jennyComment: string | null;
  jennyRecommended: boolean;
  tags: string[];
}

export interface PublicDailyReport {
  id: string;
  reportDate: string;
  title: string;
  subtitle: string;
  summary: string;
  totalCollected: number;
  totalSelected: number;
  totalRecommended: number;
  totalHighRisk: number;
  totalLowBarrier: number;
  totalAiAssisted: number;
  trendAnalysis: ReportTrendAnalysis;
  actionSuggestions: ReportActionSuggestions;
  jennyDailyComment: string | null;
  publishedAt: string | null;
  items: PublicDailyReportItem[];
}

export interface DailyReportDraftItem
  extends Omit<
    PublicDailyReportItem,
    "id" | "jennyComment" | "jennyRecommended"
  > {}

export interface DailyReportDraft
  extends Omit<
    PublicDailyReport,
    "id" | "jennyDailyComment" | "publishedAt" | "items"
  > {
  items: DailyReportDraftItem[];
  rawPayload: Record<string, unknown>;
}
