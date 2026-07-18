import {
  createEmptyDailyReport,
  getShanghaiDate,
  printDailyReport,
  readDailyReport,
  writeDailyReport,
} from "@/lib/report/daily-report";

async function main() {
  const reportDate = getShanghaiDate(new Date());
  const path = `output/daily-report-${reportDate}.json`;
  try {
    printDailyReport(await readDailyReport(path));
  } catch {
    const report = createEmptyDailyReport(false);
    await writeDailyReport(report);
    printDailyReport(report);
  }
}

void main();
