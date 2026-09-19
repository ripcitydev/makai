import express from "express";
import { Job } from "./db/models/job.js";
import { Client, Connection } from "@temporalio/client";
import { workflow } from "./temporal/workflow.ts";

const app = express();
app.use(express.json());

// todo implement authentication

const connection = await Connection.connect({ address: "localhost:7233" });
const client = new Client({ connection });

app.post("/job", async (req, res) => {
  // todo implement validation
  try {
    //const key = req.get("Idempotency-Key");
    const job: any = await Job.create({
      key: req.get("Idempotency-Key"),
      data: req.body.data,
    });
    await client.workflow.start(workflow, {
      taskQueue: "jobs",
      workflowId: job.id,
      args: [job.id],
    });
    return res.status(201).location(`/job/${job.id}`).json({
      id: job.id,
      // data: job.data,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

app.get("/job/:id", async (req, res) => {
  try {
    const job: any = await Job.findByPk(req.params.id);
    if (!job) {
      return res.sendStatus(404);
    }
    return res.json({
      id: job.id,
      // data: job.data,
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
    const handle = client.workflow.getHandle(req.params.id);
    await handle.cancel();
  } catch (error) {
    res.sendStatus(500);
  }
  res.sendStatus(204);
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
