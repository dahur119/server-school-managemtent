const http = require("http");
const app = require("./app");
const mongoose = require("mongoose");

const PORT = 5000;
const MONGO_URL =
  "mongodb+srv://school:XWj3l6II9RVk3U9z@cluster0.gfswrja.mongodb.net/";

const server = http.createServer(app);

mongoose.connection.once("open", () => {
  console.log("MongoDb connection is ready");
});

// hello

mongoose.connection.on("error", (err) => {
  console.error(err);
});

async function startServer() {
  await mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  server.listen(PORT, () => {
    console.log(`Listening at port ${PORT}`);
  });
}
// hello

startServer();
