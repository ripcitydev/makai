import { sequelize } from "./sequelize.ts";
import "./models/job.js";
import "./models/user.js";

await sequelize.sync();
await sequelize.close();
