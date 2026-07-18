import type {
  OpportunityDataProvider,
  OpportunityIngestProvider,
} from "./contracts";

/**
 * Migration boundary for a future real Tencent Cloud, Alibaba Cloud,
 * CloudBase, or domestic database adapter. It is intentionally not
 * registered until a backend is selected.
 */
export interface FutureChinaProvider
  extends OpportunityDataProvider, OpportunityIngestProvider {}
