import { Job, type Status } from "../db/models/job.ts";
import { Context } from "@temporalio/activity";
import { User } from "../db/models/user.ts";
import { UniqueConstraintError, ValidationError } from "sequelize";
import { setTimeout as sleep } from "node:timers/promises";

export async function status(id: string, status: Status): Promise<void> {
  await Job.update({ status }, { where: { id } });
}

export async function process(id: string): Promise<void> {
  const job: any = await Job.findByPk(id);
  const context = Context.current();
  const start = (context.info.heartbeatDetails as number | undefined) ?? 0;
  for (const [index, record] of job.data.entries()) {
    if (index < start) continue;
    context.heartbeat(index);
    // context.cancellationSignal.throwIfAborted();
    try {
      const user = await User.create({
        name: record.name,
        email: record.email,
        phone: record.phone,
      });
    } catch (error) {
      if (
        error instanceof UniqueConstraintError ||
        error instanceof ValidationError
      ) {
        // todo implement logging
        continue;
      }
      throw error;
    }
    await sleep(1000);
  }
}
