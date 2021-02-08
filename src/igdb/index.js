// proxy = require('koa-proxy');

// function init(server) {
//   server.use(
//     proxy({
//       host: 'https://api.igdb.com/v4/',
//       match: /^\/igdb\/.*/,
//       map: function (path) {
//         return path.replace('/igdb', '');
//       },
//     }),
//   );
// }

// exports.init = init;

const Router = require('koa-router');
const IgdbController = require('./controller');

function init(server) {
  const router = new Router({ prefix: '/igdb' });
  router.post('/games', IgdbController.getGames);

  server.use(router.routes());
}

exports.init = init;
