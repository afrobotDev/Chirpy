import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";

import * as schema from "./schema.js";
import { config } from "../config.js";

// App connection
const conn = postgres(config.dbURL);
export const db = drizzle(conn, { schema });

// Migration connection
const migrationClient = postgres(config.dbURL, { max: 1 });
await migrate(drizzle(migrationClient), {
  migrationsFolder: "./drizzle",
});
