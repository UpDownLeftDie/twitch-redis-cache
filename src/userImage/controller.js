const redis = require("../redis.js");
const { twitchReq } = require("../utils.js");

const prefix = "userimage-";
const placeholderImage =
  process.env.PLACEHOLDER_IMAGE ||
  "https://static-cdn.jtvnw.net/user-default-pictures/4cbf10f1-bb9f-4f57-90e1-15bf06cfe6f5-profile_image-300x300.jpg";

async function getUserImageUrl(ctx) {
  let cacheLengthS = process.env.CACHE_LENGTH_S || 604800; // 604800 == 7 days
  const username = ctx.params.username.toLowerCase().trim();
  const cacheKey = `${prefix}${username}`;
  console.debug(`[${cacheKey}]: Getting image`);
  let userImage = await redis.get(cacheKey).catch(err => {
    console.error("Redis error: ", err);
  });
  if (userImage) {
    if (userImage === "404" || userImage === "429")
      userImage = placeholderImage;
    ctx.body = {
      userImage
    };
    return;
  }
  console.debug(`[${cacheKey}]: userImage not cached`);

  userImage = await getUserImageUrlFromTwitch(username);
  console.debug(`[${cacheKey}]: done getting userImage`);
  if (!userImage) {
    console.debug(`[${cacheKey}]: Failed to get image from Twitch`);
    ctx.body = {
      userImage: placeholderImage
    };
    return;
  } else if (userImage === "429") {
    console.debug(`[${cacheKey}]: API limit hit`);
    cacheLengthS = 60;
  }

  redis.set(cacheKey, userImage, "EX", cacheLengthS);
  if (userImage === "404" || userImage === "429") {
    userImage = placeholderImage;
  }
  ctx.body = {
    userImage
  };
  return;
}

async function deleteUserImageUrl(ctx) {
  const username = ctx.params.username.toLowerCase().trim();
  const cacheKey = `${prefix}${username}`;
  console.debug(`[${cacheKey}]: Deleting cached data`);
  await redis
    .del(cacheKey)
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

async function getUserImageUrlFromTwitch(username) {
  const url = `https://api.twitch.tv/helix/users?login=${username}`;
  const res = await twitchReq(url);
  if (res.statusCode === 429) return "429";
  const twitchUser = JSON.parse(res);

  if (twitchUser.data && twitchUser.data.length) {
    return twitchUser.data[0].profile_image_url;
  } else if (twitchUser.data && twitchUser.data.length === 0) {
    return "404";
  }

  return null;
}

exports.getUserImageUrl = getUserImageUrl;
exports.deleteUserImageUrl = deleteUserImageUrl;
