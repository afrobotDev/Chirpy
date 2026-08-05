import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { config } from "../config.js";
import { getBearerToken, validateJWT } from "../auth.js";
import { BadRequestError } from "../Middleware/custom_errClases.js";
import { createChirp, getChirps, getOneChirp } from "../db/queries/users.js";

const MAX_CHIRP_LENGTH = 140;
const BANNED_WORDS = ["kerfuffle", "sharbert", "fornax"];

export const chirpsRouter = Router();

chirpsRouter.post(
  "/chirps",
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || typeof req.body.body !== "string") {
      return next(new BadRequestError("something went wrong"));
    }

    if (req.body.body.length > MAX_CHIRP_LENGTH) {
      return next(new BadRequestError("Chirp is too long"));
    }

    const token = getBearerToken(req);
    const userId = validateJWT(token, config.jwt_secret);
    const cleanedBody = cleanChirp(req.body.body);
    const chirp = await createChirp({ body: cleanedBody, userId });

    return res.status(201).json(chirp);
  },
);

chirpsRouter.get("/chirps", async (_req: Request, res: Response) => {
  const chirps = await getChirps();
  return res.status(200).json(chirps);
});

chirpsRouter.get("/chirps/:chirpId", async (req: Request, res: Response) => {
  const chirp = await getOneChirp(req.params.chirpId as string);
  return res.status(200).json(chirp);
});

function cleanChirp(body: string): string {
  return body
    .toLowerCase()
    .split(" ")
    .map((word) => (BANNED_WORDS.includes(word) ? "****" : word))
    .join(" ");
}
