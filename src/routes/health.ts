import { Router, type Request, type Response } from "express";

export const healthRouter = Router();

healthRouter.get("/healthz", (_req: Request, res: Response) => {
  res.set({
    "Content-Type": "text/plain",
    charset: "utf8",
  });
  res.status(200).send("OK");
});
