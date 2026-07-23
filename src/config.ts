export type APIConfig = {
  fileServerHits: number;
  dbURL: string;
  PLATFORM: string;
};

export const config: APIConfig = {
  fileServerHits: 0,
  dbURL: process.env.DB_URL ?? "",
  PLATFORM: process.env.PLATFORM ?? "",
};
