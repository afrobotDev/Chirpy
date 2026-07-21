import express, { type Request, type Response } from "express";
const app = express();
const PORT = 8080;

app.use("/app", express.static("src/app"));

app.get("/healthz", (req: Request, res: Response) => {
  res.set({
    "Content-Type": "text/plain",
    charset: "utf8",
  });
  res.status(200).send("OK");
});

app.listen(8080, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
