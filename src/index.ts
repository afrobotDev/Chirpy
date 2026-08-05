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
  createRefreshToken,
  getRefreshToken,
  revokeRefreshToken,
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
  UnauthorizedError,
} from "./Middleware/custom_errClases.js";
import {
  hashPassword,
  checkPasswordHash,
  makeJWT,
  getBearerToken,
  validateJWT,
  makeRefreshToken,
} from "./auth.js";

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
  const { email, password } = req.body;
  const passwordIsValid = await checkPasswordHash(password, email);
  if (!passwordIsValid) {
    return res.status(401).json({ message: "invalid credential" });
  }
  const result = await getUser(email);

  const accessToken = makeJWT(result.id!, 3600, process.env.SECRET_JWT ?? "");

  const refreshToken = makeRefreshToken();
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  await createRefreshToken({
    token: refreshToken,
    userId: result.id!,
    expiresAt,
    revokedAt: null,
  });

  return res.status(200).json({ result, token: accessToken, refreshToken });
});

// Refresh access token
app.post("/api/refresh", async (req: Request, res: Response, next: NextFunction) => {
  const refreshToken = getBearerToken(req);
  const storedToken = await getRefreshToken(refreshToken);

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
    return next(new UnauthorizedError("invalid refresh token"));
  }

  const accessToken = makeJWT(storedToken.userId, 3600, process.env.SECRET_JWT ?? "");
  return res.status(200).json({ token: accessToken });
});

// Revoke refresh token
app.post("/api/revoke", async (req: Request, res: Response) => {
  const refreshToken = getBearerToken(req);
  await revokeRefreshToken(refreshToken);
  return res.sendStatus(204);
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
