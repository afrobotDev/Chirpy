import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { config } from "../config.js";
import { hashPassword, getBearerToken, validateJWT } from "../auth.js";
import {
  createUser,
  getUsers,
  updateUserCredentials,
  deleteUser,
  upgradeUser,
} from "../db/queries/users.js";
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "../Middleware/custom_errClases.js";

export const usersRouter = Router();

usersRouter.post("/users", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const hashedPassword = await hashPassword(password);
  const user = await createUser(email, hashedPassword);

  return res.status(201).json(user);
});

usersRouter.post(
  "/polka/webhooks",
  async (req: Request, res: Response, next: NextFunction) => {
    const { event, data } = req.body;
    try {
      if (event !== "user.upgrade") {
        return res.status(204);
      }
      const userId = data.userId;
      await upgradeUser(userId);
      return res.status(204).json();
    } catch {
      return next(new NotFoundError("user not found"));
    }
  },
);

usersRouter.get("/users", async (_req: Request, res: Response) => {
  const users = await getUsers();
  return res.status(200).json({ result: users });
});

usersRouter.put(
  "/users",
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const hashedPassword = await hashPassword(password);

    let userId: string;
    try {
      const token = getBearerToken(req);
      userId = validateJWT(token, config.jwt_secret);
    } catch {
      return next(new UnauthorizedError("invalid or missing token"));
    }

    const userCredentials = await updateUserCredentials(
      userId,
      email,
      hashedPassword,
    );
    return res.status(200).json(userCredentials);
  },
);

usersRouter.delete(
  "/users/:userId",
  async (req: Request, res: Response, next: NextFunction) => {
    let userId: string;
    try {
      const token = getBearerToken(req);
      userId = validateJWT(token, config.jwt_secret);
    } catch {
      return next(new UnauthorizedError("invalid or missing token"));
    }

    if (userId !== req.params.userId) {
      return next(
        new ForbiddenError("you are not authorized to delete this user"),
      );
    }

    await deleteUser(userId);
    return res.sendStatus(204);
  },
);
