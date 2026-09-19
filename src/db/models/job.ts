import { sequelize } from "../sequelize.ts";
import { DataTypes } from "sequelize";

export const status = [
  "queued",
  "processing",
  "canceled",
  "completed",
] as const;
export type Status = (typeof status)[number];

export const Job = sequelize.define("job", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  key: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  status: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: "queued",
    validate: { isIn: [status] },
  },
});
