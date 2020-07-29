const Koa = require("koa");
const app = new Koa();
const cors = require("@koa/cors");
const userImageRouter = require("./streams/index");
const streamsRouter = require("./userImage/index");
const igdbProxy = require("./igdb/index");
proxy = require("koa-proxy");

async function main() {
  const config = await require("./config.js");

  // app.use(
  //   proxy({
  //     host: "https://api-v3.igdb.com",
  //     match: /^\/igdb\/.*/,
  //     map: function (path) {
  //       return path.replace("/igdb", "");
  //     },
  //   }),
  // );

  app.use(cors());
  app.proxy = true;
  userImageRouter.init(app);
  streamsRouter.init(app);
  igdbProxy.init(app);

  const server = app.listen(config.port || 3000, () => {
    var host = server.address().address;
    var port = server.address().port;
    console.log("twitch-redis-cache listening at http://%s:%s", host, port);
  });
}

main();
