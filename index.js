const Koa = require("koa");
const app = new Koa();
const cors = require("@koa/cors");
const router = require("./routes");
require("./config.js");

app.use(cors());
app.use(router());

const server = app.listen(process.env.PORT || 3000, () => {
  var host = server.address().address;
  var port = server.address().port;
  console.log("twitch-redis-cache listening at http://%s:%s", host, port);
});
