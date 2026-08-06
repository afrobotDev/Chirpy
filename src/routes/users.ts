import { Router, type Request, type Response } from "express";
import { config } from "../config.js";
import { hashPassword, getBearerToken, validateJWT } from "../auth.js";
import {
  createUser,
  getUsers,
  updateUserCredentials,
} from "../db/queries/users.js";

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

usersRouter.put("/users", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const hashedPassword = await hashPassword(password);
  const token = getBearerToken(req);
  const userId = validateJWT(token, config.jwt_secret);
  const userCredentials = await updateUserCredentials(
    userId,
    email,
    hashedPassword,
  );
  return res.status(200).json(userCredentials);
});
