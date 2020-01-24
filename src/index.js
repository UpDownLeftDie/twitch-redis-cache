const Koa = require("koa");
const app = new Koa();
const cors = require("@koa/cors");
const userImageRouter = require("./userImage/index");
require("./config.js");

app.use(cors());
userImageRouter.init(app);

const server = app.listen(process.env.PORT || 3000, () => {
  var host = server.address().address;
  var port = server.address().port;
  console.log("twitch-redis-cache listening at http://%s:%s", host, port);
});
