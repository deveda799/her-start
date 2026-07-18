import { readFile } from "node:fs/promises";
import { z } from "zod";

const baseSource = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  enabled: z.boolean().default(true),
});

const rssSourceSchema = baseSource.extend({
  type: z.literal("rss"),
  url: z.string().url(),
});

const webSourceSchema = baseSource.extend({
  type: z.literal("web"),
  url: z.string().url(),
});

const manualSourceSchema = baseSource.extend({
  type: z.literal("manual"),
  items: z.array(z.object({
    url: z.string().url(),
    title: z.string().default(""),
    summary: z.string().default(""),
    publishedAt: z.string().datetime().nullable().optional(),
  })).min(1),
});

const searchSourceSchema = baseSource.extend({
  type: z.literal("search"),
  provider: z.literal("brave"),
  keywords: z.array(z.string().min(1)).min(1),
});

const sourceSchema = z.discriminatedUnion("type", [
  rssSourceSchema,
  webSourceSchema,
  manualSourceSchema,
  searchSourceSchema,
]);

const sourcesFileSchema = z.union([
  z.array(sourceSchema),
  z.object({ sources: z.array(sourceSchema) }).transform(({ sources }) => sources),
]);

export type SourceConfig = z.infer<typeof sourceSchema>;
export type RssSourceConfig = z.infer<typeof rssSourceSchema>;
export type WebSourceConfig = z.infer<typeof webSourceSchema>;
export type ManualSourceConfig = z.infer<typeof manualSourceSchema>;
export type SearchSourceConfig = z.infer<typeof searchSourceSchema>;

export function parseSources(input: unknown): SourceConfig[] {
  return sourcesFileSchema.parse(input);
}

export async function loadSources(path: string): Promise<SourceConfig[]> {
  const text = await readFile(path, "utf8");
  return parseSources(JSON.parse(text));
}
