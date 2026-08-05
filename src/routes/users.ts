import { Router, type Request, type Response } from "express";
import { hashPassword } from "../auth.js";
import { createUser, getUsers } from "../db/queries/users.js";

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
