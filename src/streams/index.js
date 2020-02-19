const Router = require("koa-router");
const streamsController = require("./controller");

function init(server) {
  const router = new Router({ prefix: "/streams" });
  router.get("/:username", streamsController.getStreams);
  router.delete("/:username", streamsController.deleteStreams);
  router.get("/islive/:username", streamsController.getLiveStatus);

  server.use(router.routes());
}

exports.init = init;
