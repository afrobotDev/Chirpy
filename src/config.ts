import "dotenv/config";

export type APIConfig = {
  fileServerHits: number;
  dbURL: string;
  PLATFORM: string;
  jwt_secret: string;
};

export const config: APIConfig = {
  fileServerHits: 0,
  dbURL: process.env.DB_URL ?? "",
  PLATFORM: process.env.PLATFORM ?? "",
  jwt_secret: process.env.SECRET_JWT ?? "",
};
