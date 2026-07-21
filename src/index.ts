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

const middlewareMetricsInc = function (
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  requestNum.fileServerHits++;

  next();
};

app.use("/app", middlewareMetricsInc, express.static("src/app"));
app.use("/app/assets", express.static("assets"));

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
  res.send(`Hits: ${requestNum.fileServerHits}`);
};

const middlewareresetReqs = function (
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  requestNum.fileServerHits = 0;
  res.sendStatus(200);
};

app.get("/api/healthz", (_req: Request, res: Response) => {
  res.set({
    "Content-Type": "text/plain",
    charset: "utf8",
  });
  res.status(200).send("OK");
});

app.use("/", middlewareLogResponse);
app.use("/api/metrics", middlewareNumReqs);
app.use("/api/reset", middlewareresetReqs);

app.listen(8080, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
