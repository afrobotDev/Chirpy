import "dotenv/config";
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import {
  createUser,
  getUser,
  getUsers,
  deleteUsers,
  createChirp,
  getChirps,
  getOneChirp,
} from "./db/queries/users.js";
import { type APIConfig, config } from "./config.js";

import {
  middlewareMetricsInc,
  middlewareLogResponse,
  middlewareNumReqs,
  handleError,
} from "./Middleware/middlewarefun.js";
import {
  ForbiddenError,
  BadRequestError,
} from "./Middleware/custom_errClases.js";
import { hashPassword, checkPasswordHash, makeJWT, getBearerToken, validateJWT } from "./auth.js";

const app: Express = express();
const PORT = 8080;
const MAX_CHIRP_LENGTH = 140;
const BANNED_WORDS = ["kerfuffle", "sharbert", "fornax"];

app.use(express.json());

// api endpoints
app.get("/api/healthz", (_req: Request, res: Response) => {
  res.set({
    "Content-Type": "text/plain",
    charset: "utf8",
  });
  res.status(200).send("OK");
});

// Chirps resouce
// create new chirp
app.post(
  "/api/chirps",
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || typeof req.body.body !== "string") {
      return next(new BadRequestError("something went wrong"));
    }
    if (req.body.body.length > MAX_CHIRP_LENGTH) {
      const err = new Error("Chirp is too long");
      return next(err);
    }

    const token = getBearerToken(req);
    const userId = validateJWT(token, process.env.SECRET_JWT ?? "");

    const { body } = req.body;
    const cleanedBody = body
      .toLowerCase()
      .split(" ")
      .map((word: string) => (BANNED_WORDS.includes(word) ? "****" : word))
      .join(" ");
    const result = await createChirp({ body: cleanedBody, userId });
    return res.status(201).json(result);
  },
);

// get all chirps
app.get("/api/chirps", async (_req: Request, res: Response) => {
  const result = await getChirps();
  return res.status(200).json(result);
});

// get a single chirp
app.get("/api/chirps/:chirpId", async (req: Request, res: Response) => {
  const result = await getOneChirp(req.params.chirpId as string);
  return res.status(200).json(result);
});

// Users resource
// Create a user
app.post("/api/users", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const hashedPassword = await hashPassword(password);
  const result = await createUser(email, hashedPassword);
  return res.status(201).json(result);
});

// Get all users
app.get("/api/users", async (_req: Request, res: Response) => {
  const result = await getUsers();
  return res.status(200).json({ result });
});

// Login a user
app.post("/api/login", async (req: Request, res: Response) => {
  const { email, password, expiresInSeconds } = req.body;
  const passwordIsValid = await checkPasswordHash(password, email);
  if (!passwordIsValid) {
    return res.status(401).json({ message: "invalid credential" });
  }
  const result = await getUser(email);
  const expiration = Math.min(expiresInSeconds ?? 3600, 3600);
  const token = makeJWT(result.id!, expiration, process.env.SECRET_JWT ?? "");
  return res.status(200).json({ result, token });
});

// Delete all users
app.delete(
  "/admin/reset",
  async (_req: Request, res: Response, next: NextFunction) => {
    if ((config as APIConfig).PLATFORM !== "dev") {
      return next(new ForbiddenError("You are not in local dev environment"));
    }
    await deleteUsers();
    return res.sendStatus(200);
  },
);

app.use("/app", middlewareMetricsInc, express.static("src/app"));
app.use("/app/assets", express.static("assets"));
app.use("/", middlewareLogResponse);
app.use("/admin/metrics", middlewareNumReqs);
app.use(handleError);

app.listen(8080, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
