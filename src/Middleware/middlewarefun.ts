import type { Request, Response, NextFunction } from "express";
import type { APIConfig } from "../config.js";

const requestNum: APIConfig = { fileServerHits: 0 };

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

// error handling middleware
function handleError(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.log(err.message);
  return res.status(500).json({ error: "Something went wrong on our end" });
}

export {
  middlewareMetricsInc,
  middlewareLogResponse,
  middlewareNumReqs,
  middlewareresetReqs,
  handleError,
};
