export type APIConfig = {
  fileServerHits: number;
  dbURL: string;
};

export const config: APIConfig = {
  fileServerHits: 0,
  dbURL: process.env.DB_URL ?? "",
};
