import express from "express";
import path from "path";
const app = express();
const PORT = 8080;

//app.use(express.static("../assets"));

app.get("/assets/logo.png", (req, res) => {
  res.sendFile(path.resolve("../assets/logo.png"));
});

app.listen(8080, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
