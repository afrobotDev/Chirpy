/// <reference types="node" />

import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const dbURL = process.env.DB_URL;

if (!dbURL) {
  throw new Error("DB_URL must be set");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: dbURL,
  },
});
