import { Job, type Status } from "../db/models/job.ts";
import { Context } from "@temporalio/activity";
import { User } from "../db/models/user.ts";
import { UniqueConstraintError, ValidationError } from "sequelize";
import nodemailer from "nodemailer";
// import { setTimeout as sleep } from "node:timers/promises";

export async function status(id: string, status: Status): Promise<void> {
  const job: any = await Job.findByPk(id);
  await job.update({ status });
  switch (status) {
    case "canceled":
    case "completed":
    case "failed":
      const mailer = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await mailer.sendMail({
        from: `"Jobs" <${process.env.SMTP_USER}>`,
        to: job.email,
        subject: `Job ${status}`,
        text: `Job ${status} (${id}).`,
      });
      break;
  }
}

export async function processJob(id: string): Promise<void> {
  const job: any = await Job.findByPk(id);
  const context = Context.current();
  const start = (context.info.heartbeatDetails as number | undefined) ?? 0;
  for (const [index, user] of job.users.entries()) {
    if (index < start) continue;
    context.heartbeat(index);
    try {
      await User.create({
        name: user.name,
        email: user.email,
        phone: user.phone,
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
    // await sleep(1000);
  }
}
