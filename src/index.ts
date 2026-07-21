import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { type APIConfig } from "./config.js";

const app: Express = express();
const PORT = 8080;
const requestNum: APIConfig = { fileServerHits: 0 };

app.use(express.json());

// middleware functions
const middlewareMetricsInc = function (
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  requestNum.fileServerHits++;

  next();
};

const middlewareLogResponse = function (
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.on("finish", () => {
    if (res.statusCode !== 200) {
      console.log(
        `[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`,
      );
    }
  });

  next();
};

const middlewareNumReqs = function (
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  res.set({
    "Content-Type": "text/html",
    charset: "utf8",
  });

  res.send(`
<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${requestNum.fileServerHits} times!</p>
  </body>
</html>
  `);
};

const middlewareresetReqs = function (
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  requestNum.fileServerHits = 0;
  res.sendStatus(200);
};

// api endpoints
app.get("/api/healthz", (_req: Request, res: Response) => {
  res.set({
    "Content-Type": "text/plain",
    charset: "utf8",
  });
  res.status(200).send("OK");
});

app.use("/app", middlewareMetricsInc, express.static("src/app"));
app.use("/app/assets", express.static("assets"));
app.use("/", middlewareLogResponse);
app.use("/admin/metrics", middlewareNumReqs);
app.post("/admin/reset", middlewareresetReqs);

app.post("/api/validate_chirp", (req: Request, res: Response) => {
  if (!req.body || typeof req.body.body !== "string") {
    return res.status(400).send({ error: "something went wrong" });
  }
  const MAX_CHIRP_LENGTH: number = 140;
  if (req.body.body.length > MAX_CHIRP_LENGTH)
    return res.status(400).send({ error: "Chirp is too long" });

  const BANNED_WORDS: string[] = ["kerfuffle", "sharbert", "fornax"];
  const cleanedBody: string = req.body.body
    .toLowerCase()
    .split(" ")
    .map((word: string) => (BANNED_WORDS.includes(word) ? "****" : word))
    .join(" ");

  return res.status(200).send({ cleanedBody: `${cleanedBody}` });
});

app.listen(8080, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
