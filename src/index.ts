import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";

import {
  middlewareMetricsInc,
  middlewareLogResponse,
  middlewareNumReqs,
  middlewareresetReqs,
  handleError,
} from "./Middleware/middlewarefun.js";

const app: Express = express();
const PORT = 8080;

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
    const MAX_CHIRP_LENGTH = 140;
    if (req.body.body.length > MAX_CHIRP_LENGTH) {
      const err = new Error("Chirp is too long");
      return next(err);
    }

    const BANNED_WORDS = ["kerfuffle", "sharbert", "fornax"];
    const cleanedBody = req.body.body
      .toLowerCase()
      .split(" ")
      .map((word: string) => (BANNED_WORDS.includes(word) ? "****" : word))
      .join(" ");

    return res.status(200).send({ cleanedBody: `${cleanedBody}` });
  },
);

app.use("/app", middlewareMetricsInc, express.static("src/app"));
app.use("/app/assets", express.static("assets"));
app.use("/", middlewareLogResponse);
app.use("/admin/metrics", middlewareNumReqs);
app.post("/admin/reset", middlewareresetReqs);
app.use(handleError);

app.listen(8080, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
