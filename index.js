const Koa = require("koa");
const app = new Koa();
const cors = require("@koa/cors");
const request = require("request-promise-native");
const redis = require("redis");
const router = require("koa-router")();
const { promisify } = require("util");

const client = redis.createClient();
const redisGet = promisify(client.get).bind(client);
const redisSet = promisify(client.set).bind(client);

require("dotenv").config();
const oauth = process.env.OAUTH;
const clientId = process.env.CLIENT_ID;
if (!oauth && !clientId) {
  console.error("Add your OAuth (prefered) or Client-Id to a .env file.");
  return;
}
const cacheLengthS = process.env.CACHE_LENGTH_S || 604800; // 604800 = 7 days
const placeholderImage =
  process.env.PLACEHOLDER_IMAGE ||
  "https://static-cdn.jtvnw.net/user-default-pictures/4cbf10f1-bb9f-4f57-90e1-15bf06cfe6f5-profile_image-300x300.jpg";

router.get("/userimage/:username", getUrl);
app.use(cors());
app.use(router.routes());

async function getUrl(ctx) {
  const username = ctx.params.username.toLowerCase().trim();
  console.debug(`[${username}]: Getting image`);
  let url = await redisGet(username).catch(err =>
    console.error("Redis error: ", err)
  );
  if (url) {
    if (url === "404") url = placeholderImage;
    ctx.body = { userImage: url };
    return;
  }
  console.debug(`[${username}]: Url not cached`);

  url = await getUrlFromTwitch(username);
  console.debug(`[${username}]: done getting url`);
  if (!url) {
    console.debug(`[${username}]: Failed to get image from Twitch`);
    ctx.body = { userImage: placeholderImage };
    return;
  }

  redisSet(username, url, "EX", cacheLengthS);
  if (url === "404") {
    url = placeholderImage;
  }
  ctx.body = { userImage: url };
  return;
}

const server = app.listen(process.env.PORT || 3000, () => {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Twitch Cache listening at http://%s:%s", host, port);
});

async function getUrlFromTwitch(username) {
  const options = {
    method: "GET",
    url: `https://api.twitch.tv/helix/users?login=${username}`
  };
  if (oauth) {
    options.headers = {
      Authorization: `Bearer ${oauth}`
    };
  } else if (clientId) {
    options.headers = {
      "Client-ID": clientId
    };
  }

  const res = await request(options);
  const twitchUser = JSON.parse(res);

  if (twitchUser.data && twitchUser.data.length) {
    return twitchUser.data[0].profile_image_url;
  } else if (twitchUser.data && twitchUser.data.length === 0) {
    return "404";
  }

  return null;
}
