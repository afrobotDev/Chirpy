import "dotenv/config";

export type APIConfig = {
  fileServerHits: number;
  dbURL: string;
  PLATFORM: string;
  jwt_secret: string;
  polkaKey: string;
};

export const config: APIConfig = {
  fileServerHits: 0,
  dbURL: process.env.DB_URL ?? "",
  PLATFORM: process.env.PLATFORM ?? "",
  jwt_secret: process.env.SECRET_JWT ?? "",
  polkaKey: process.env.POLKA_KEY ?? "",
};

if (!config.polkaKey) {
  throw new Error("POLKA_KEY must be set in .env");
}
