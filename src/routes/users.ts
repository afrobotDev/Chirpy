import { Router, type Request, type Response, type NextFunction } from "express";
import { config } from "../config.js";
import { hashPassword, getBearerToken, validateJWT } from "../auth.js";
import {
  createUser,
  getUsers,
  updateUserCredentials,
} from "../db/queries/users.js";
import { UnauthorizedError } from "../Middleware/custom_errClases.js";

export const usersRouter = Router();

usersRouter.post("/users", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const hashedPassword = await hashPassword(password);
  const user = await createUser(email, hashedPassword);

  return res.status(201).json(user);
});

usersRouter.get("/users", async (_req: Request, res: Response) => {
  const users = await getUsers();
  return res.status(200).json({ result: users });
});

usersRouter.put("/users", async (req: Request, res: Response, next: NextFunction) => {
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
});
