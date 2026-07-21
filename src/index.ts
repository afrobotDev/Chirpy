import express from "express";

const app = express();
const PORT = 8080;

app.use(express.static("/assets/logo.png"));

app.listen(8080, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
