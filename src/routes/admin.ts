import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { config } from "../config.js";
import { ForbiddenError } from "../Middleware/custom_errClases.js";
import { deleteUsers } from "../db/queries/users.js";

export const adminRouter = Router();

adminRouter.delete(
  "/reset",
  async (_req: Request, res: Response, next: NextFunction) => {
    if (config.PLATFORM !== "dev") {
      return next(new ForbiddenError("You are not in local dev environment"));
    }

    await deleteUsers();
    return res.sendStatus(200);
  },
);
