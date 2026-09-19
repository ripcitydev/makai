import { Worker } from "@temporalio/worker";
import * as activities from "./activities.ts";

const worker = await Worker.create({
  workflowsPath: new URL("./workflow.ts", import.meta.url).pathname,
  activities,
  taskQueue: "jobs",
});

await worker.run();
