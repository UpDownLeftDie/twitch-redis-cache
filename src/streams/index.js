const Router = require("koa-router");
const streamsController = require("./controller");

function init(server) {
  const router = new Router({ prefix: "/streams" });
  router.get("/islive/:username", streamsController.getLiveStatus);

  server.use(router.routes());
}

exports.init = init;
