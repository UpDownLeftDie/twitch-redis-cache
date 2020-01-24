const Router = require("koa-router");
const UserController = require("./controller");

function init(server) {
  const router = new Router({ prefix: "/userimage" });
  router.get("/:username", UserController.getUserImageUrl);
  router.delete("/:username", UserController.deleteUserImageUrl);

  server.use(router.routes());
}

exports.init = init;
