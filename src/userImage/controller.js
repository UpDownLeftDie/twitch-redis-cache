const redis = require("../redis.js");
const { twitchReq } = require("../utils.js");

const prefix = "userimage-";
const placeholderImage =
  process.env.PLACEHOLDER_IMAGE ||
  "https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-300x300.png";

async function getUserImageUrl(ctx) {
  let cacheLengthS = process.env.CACHE_LENGTH_S || 604800; // 604800 == 7 days
  const username = ctx.params.username.toLowerCase().trim();
  const cacheKey = `${prefix}${username}`;
  console.debug(`[${cacheKey}]: Getting image`);
  let userImage = await redis.get(cacheKey).catch((err) => {
    console.error("Redis error: ", err);
  });
  if (userImage) {
    if (userImage === "404" || userImage === "429")
      userImage = placeholderImage;
    ctx.body = {
      userImage,
    };
    return;
  }
  console.debug(`[${cacheKey}]: userImage not cached`);

  userImage = await getUserImageUrlFromTwitch(username);
  console.debug(`[${cacheKey}]: done getting userImage`);
  if (!userImage) {
    console.debug(`[${cacheKey}]: Failed to get image from Twitch`);
    ctx.body = {
      userImage: placeholderImage,
    };
    return;
  } else if (userImage === "429") {
    console.debug(`[${cacheKey}]: API limit hit`);
    cacheLengthS = 60;
  }
  if (userImage === "404" || userImage === "429") {
    userImage = placeholderImage;
  }
  redis.set(cacheKey, userImage, "EX", cacheLengthS);
  ctx.body = {
    userImage,
  };
  return;
}

async function deleteUserImageUrl(ctx) {
  const username = ctx.params.username.toLowerCase().trim();
  const cacheKey = `${prefix}${username}`;
  console.debug(`[${cacheKey}]: Deleting cached data`);
  await redis
    .del(cacheKey)
    .catch((err) => {
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
  const twitchUser = await res.json();

  console.log(twitchUser);

  if (twitchUser.data && twitchUser.data.length) {
    return twitchUser.data[0].profile_image_url;
  } else if (twitchUser.data && twitchUser.data.length === 0) {
    return "404";
  }

  return null;
}

exports.getUserImageUrl = getUserImageUrl;
exports.deleteUserImageUrl = deleteUserImageUrl;
