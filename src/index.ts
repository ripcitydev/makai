import express from "express";
import { Job } from "./db/models/job.js";
import { client } from "./temporal/client.ts";
import { workflow } from "./temporal/workflow.ts";
import * as z from "zod";

const app = express();
app.use(express.json());

// todo implement authentication

app.post("/job", async (req, res) => {
  try {
    const schema = z.object({
      key: z.uuidv4(),
      email: z.email().toLowerCase(),
      users: z
        .array(
          z.object({
            name: z.string().trim().min(1),
            email: z.email().toLowerCase(),
            phone: z.string().trim().nullable(),
          }),
        )
        .min(1),
    });
    const request = schema.parse({
      key: req.get("Idempotency-Key"),
      email: req.body.email,
      users: req.body.users,
    });
    const job: any = await Job.create({
      key: request.key,
      email: request.email,
      users: request.users,
    });
    await client.workflow.start(workflow, {
      taskQueue: "jobs",
      workflowId: job.id,
      args: [job.id],
    });
    return res.status(201).location(`/job/${job.id}`).json({
      id: job.id,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error) {
    return res.sendStatus(500);
  }
});

app.get("/job/:id", async (req, res) => {
  try {
    const schema = z.object({
      id: z.uuidv4(),
    });
    const params = schema.parse({
      id: req.params.id,
    });
    const job: any = await Job.findByPk(params.id);
    if (!job) {
      return res.sendStatus(404);
    }
    return res.json({
      id: job.id,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error) {
    return res.sendStatus(500);
  }
});

app.delete("/job/:id", async (req, res) => {
  try {
    const schema = z.object({
      id: z.uuidv4(),
    });
    const params = schema.parse({
      id: req.params.id,
    });
    const handle = client.workflow.getHandle(params.id);
    await handle.cancel();
  } catch (error) {
    res.sendStatus(500);
  }
  res.sendStatus(204);
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
