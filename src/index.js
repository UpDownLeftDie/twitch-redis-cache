const Koa = require("koa");
const app = new Koa();
const cors = require("@koa/cors");
const userImageRouter = require("./streams/index");
const streamsRouter = require("./userImage/index");

async function main() {
  const config = await require("./config.js");

  app.use(cors());
  app.proxy = true;
  userImageRouter.init(app);
  streamsRouter.init(app);

  const server = app.listen(config.port || 3000, () => {
    var host = server.address().address;
    var port = server.address().port;
    console.log("twitch-redis-cache listening at http://%s:%s", host, port);
  });
}

main();
