import "dotenv/config";
import express, { type Express } from "express";
import {
  middlewareMetricsInc,
  middlewareLogResponse,
  middlewareNumReqs,
  handleError,
} from "./Middleware/middlewarefun.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { chirpsRouter } from "./routes/chirps.js";
import { healthRouter } from "./routes/health.js";
import { usersRouter } from "./routes/users.js";

const app: Express = express();
const PORT = 8080;

app.use(express.json());

app.use("/api", healthRouter, chirpsRouter, usersRouter, authRouter);
app.use("/admin", adminRouter);

app.use("/app", middlewareMetricsInc, express.static("src/app"));
app.use("/app/assets", express.static("assets"));
app.use("/", middlewareLogResponse);
app.use("/admin/metrics", middlewareNumReqs);
app.use(handleError);

app.listen(8080, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
