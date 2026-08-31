import { readFile } from "node:fs/promises";
import { Command } from "commander";
import { analyzeDenueRecords } from "@/lib/analysis/quality";
import type { DenueRawRecord } from "@/lib/denue/types";

const program = new Command().requiredOption("--fixture <path>", "DENUE-shaped JSON fixture to analyze");
program.parse();
const options = program.opts<{ fixture: string }>();

const records = JSON.parse(await readFile(options.fixture, "utf8")) as DenueRawRecord[];
console.log(JSON.stringify(analyzeDenueRecords(records), null, 2));
