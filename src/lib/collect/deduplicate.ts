import type { RawItem } from "@/lib/types";

const trackingKeys = new Set(["spm", "from", "source", "ref"]);

export function normalizeUrl(input: string): string {
  const url = new URL(input);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }

  url.hostname = url.hostname.toLowerCase();
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_") || trackingKeys.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }
  return url.toString();
}

export function deduplicateByUrl(items: RawItem[]) {
  const seen = new Set<string>();
  const unique: RawItem[] = [];
  const duplicates: RawItem[] = [];

  for (const item of items) {
    const url = normalizeUrl(item.url);
    const normalized = { ...item, url };
    if (seen.has(url)) {
      duplicates.push(normalized);
      continue;
    }
    seen.add(url);
    unique.push(normalized);
  }

  return { items: unique, duplicates };
}
