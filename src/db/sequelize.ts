import { Sequelize } from "sequelize";

// todo implement env?
export const sequelize = new Sequelize("postgresql://localhost:5432/makai", {
  dialect: "postgres",
  logging: false,
  define: {
    underscored: true,
  },
  pool: {
    max: 10,
  },
});
