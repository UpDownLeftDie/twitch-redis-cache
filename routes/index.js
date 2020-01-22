const combineRouters = require("koa-combine-routers");
const userImageRouter = require("./userImage");

const router = combineRouters(userImageRouter);

module.exports = router;
