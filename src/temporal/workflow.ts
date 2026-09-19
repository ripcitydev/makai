import { proxyActivities, CancellationScope } from "@temporalio/workflow";
import type * as activities from "./activities.js";

const { status, process } = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 minutes",
  heartbeatTimeout: "10 seconds",
});

export async function workflow(id: string): Promise<void> {
  try {
    await status(id, "processing");
    await process(id);
    await status(id, "completed");
  } catch (error) {
    await CancellationScope.nonCancellable(() => status(id, "canceled"));
    throw error;
  }
}
