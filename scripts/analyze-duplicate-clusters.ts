import { getDuplicateClusterReport } from "@/lib/db/queries";

console.log(JSON.stringify(await getDuplicateClusterReport(), null, 2));
