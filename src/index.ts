import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";

const app: Express = express();
const PORT = 8080;

app.use("/app", express.static("src/app"));

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

app.get("/healthz", (_req: Request, res: Response) => {
  res.set({
    "Content-Type": "text/plain",
    charset: "utf8",
  });
  res.status(200).send("OK");
});

app.listen(8080, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.use("/", middlewareLogResponse);
