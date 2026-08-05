import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { config } from "../config.js";
import {
  checkPasswordHash,
  getBearerToken,
  makeJWT,
  makeRefreshToken,
} from "../auth.js";
import { UnauthorizedError } from "../Middleware/custom_errClases.js";
import {
  createRefreshToken,
  getRefreshToken,
  getUser,
  revokeRefreshToken,
} from "../db/queries/users.js";

const ACCESS_TOKEN_SECONDS = 3600;
const REFRESH_TOKEN_DAYS = 60;

export const authRouter = Router();

authRouter.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const passwordIsValid = await checkPasswordHash(password, email);

  if (!passwordIsValid) {
    return res.status(401).json({ message: "invalid credential" });
  }

  const user = await getUser(email);
  const token = makeJWT(user.id!, ACCESS_TOKEN_SECONDS, config.jwt_secret);
  const refreshToken = makeRefreshToken();

  await createRefreshToken({
    token: refreshToken,
    userId: user.id!,
    expiresAt: refreshTokenExpiresAt(),
    revokedAt: null,
  });

  return res.status(200).json({ result: user, token, refreshToken });
});

authRouter.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = getBearerToken(req);
    const storedToken = await getRefreshToken(refreshToken);

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt < new Date()
    ) {
      return next(new UnauthorizedError("invalid refresh token"));
    }

    const token = makeJWT(
      storedToken.userId,
      ACCESS_TOKEN_SECONDS,
      config.jwt_secret,
    );

    return res.status(200).json({ token });
  },
);

authRouter.post("/revoke", async (req: Request, res: Response) => {
  const refreshToken = getBearerToken(req);
  await revokeRefreshToken(refreshToken);

  return res.sendStatus(204);
});

function refreshTokenExpiresAt(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
}
