import {
  proxyActivities,
  CancellationScope,
  isCancellation,
} from "@temporalio/workflow";
import type * as activities from "./activities.js";

const { status, processJob } = proxyActivities<typeof activities>({
  scheduleToCloseTimeout: "1 hours",
  startToCloseTimeout: "10 minutes",
  heartbeatTimeout: "10 seconds",
});

export async function workflow(id: string): Promise<void> {
  try {
    await status(id, "processing");
    await processJob(id);
    await status(id, "completed");
  } catch (error) {
    await CancellationScope.nonCancellable(() =>
      status(id, isCancellation(error) ? "canceled" : "failed"),
    );
    throw error;
  }
}
