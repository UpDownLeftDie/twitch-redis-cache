const router = require("koa-router")();
const request = require("request-promise-native");
const redis = require("../redis.js");
const { oauth, clientId } = require("../config.js");

router.get("/userimage/:username", getUserImageUrl);
router.delete("/userimage/:username", deleteUserImageUrl);

const placeholderImage =
  process.env.PLACEHOLDER_IMAGE ||
  "https://static-cdn.jtvnw.net/user-default-pictures/4cbf10f1-bb9f-4f57-90e1-15bf06cfe6f5-profile_image-300x300.jpg";

async function getUserImageUrl(ctx) {
  let cacheLengthS = process.env.CACHE_LENGTH_S || 604800; // 604800 == 7 days
  const username = ctx.params.username.toLowerCase().trim();
  console.debug(`[${username}]: Getting image`);
  let url = await redis.get(username).catch(err => {
    console.error("Redis error: ", err);
  });
  if (url) {
    if (url === "404" || url === "429") url = placeholderImage;
    ctx.body = {
      userImage: url
    };
    return;
  }
  console.debug(`[${username}]: Url not cached`);

  url = await getUserImageUrlFromTwitch(username);
  console.debug(`[${username}]: done getting url`);
  if (!url) {
    console.debug(`[${username}]: Failed to get image from Twitch`);
    ctx.body = {
      userImage: placeholderImage
    };
    return;
  } else if (url === "429") {
    console.debug(`[${username}]: API limit hit`);
    cacheLengthS = 60;
  }

  redis.set(username, url, "EX", cacheLengthS);
  if (url === "404" || url === "429") {
    url = placeholderImage;
  }
  ctx.body = {
    userImage: url
  };
  return;
}

async function getUserImageUrlFromTwitch(username) {
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
  if (res.statusCode === 429) return "429";
  const twitchUser = JSON.parse(res);

  if (twitchUser.data && twitchUser.data.length) {
    return twitchUser.data[0].profile_image_url;
  } else if (twitchUser.data && twitchUser.data.length === 0) {
    return "404";
  }

  return null;
}

async function deleteUserImageUrl(ctx) {
  const username = ctx.params.username.toLowerCase().trim();
  console.debug(`Deleting cached url for ${username}`);
  await redis
    .del(username)
    .catch(err => {
      console.error("Redis error: ", err);
      ctx.status = 500;
      return;
    })
    .then(() => {
      ctx.status = 204;
      return;
    });
}

module.exports = router;
