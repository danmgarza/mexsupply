import { getDataQualityReport } from "@/lib/db/queries";

const report = await getDataQualityReport();

console.log(JSON.stringify(report, null, 2));
