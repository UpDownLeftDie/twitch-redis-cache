proxy = require("koa-proxy");

function init(server) {
  server.use(
    proxy({
      host: "https://api-v3.igdb.com",
      match: /^\/igdb\/.*/,
      map: function (path) {
        return path.replace("/igdb", "");
      },
    }),
  );
}

exports.init = init;
