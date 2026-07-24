import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { createUser, deleteUsers } from "./db/queries/users.js";
import { type APIConfig, config } from "./config.js";

import {
  middlewareMetricsInc,
  middlewareLogResponse,
  middlewareNumReqs,
  handleError,
} from "./Middleware/middlewarefun.js";
import { ForbiddenError } from "./Middleware/custom_errClases.js";

const app: Express = express();
const PORT = 8080;
const MAX_CHIRP_LENGTH = 140;
const BANNED_WORDS = ["kerfuffle", "sharbert", "fornax"];

app.use(express.json());

// api endpoints
app.get("/api/healthz", (_req: Request, res: Response) => {
  res.set({
    "Content-Type": "text/plain",
    charset: "utf8",
  });
  res.status(200).send("OK");
});

app.post(
  "/api/validate_chirp",
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || typeof req.body.body !== "string") {
      return res.status(400).send({ error: "something went wrong" });
    }
    if (req.body.body.length > MAX_CHIRP_LENGTH) {
      const err = new Error("Chirp is too long");
      return next(err);
    }

    const cleanedBody = req.body.body
      .toLowerCase()
      .split(" ")
      .map((word: string) => (BANNED_WORDS.includes(word) ? "****" : word))
      .join(" ");

    return res.status(200).send({ cleanedBody });
  },
);

// Create a user
app.post("/api/users", async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await createUser({ email });
  res.status(201).json(result);
});

// Delete all users
app.post("/admin/reset", async (_req: Request, res: Response, next: NextFunction) => {
  if ((config as APIConfig).PLATFORM !== "dev") {
    return next(new ForbiddenError("You are not in local dev environment"));
  }
  await deleteUsers();
  res.sendStatus(200);
});

app.use("/app", middlewareMetricsInc, express.static("src/app"));
app.use("/app/assets", express.static("assets"));
app.use("/", middlewareLogResponse);
app.use("/admin/metrics", middlewareNumReqs);
app.use(handleError);

app.listen(8080, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
