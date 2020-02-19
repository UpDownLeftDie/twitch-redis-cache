const redis = require("../redis.js");
const { twitchReq, getUsername } = require("../utils");

const prefix = "streams-";

async function getStreams(ctx) {
  const username = ctx.params.username.toLowerCase().trim();
  const streams = await cacheOrGetStreams(username);
  ctx.body = {
    streams
  };
}

async function getLiveStatus(ctx) {
  const username = ctx.params.username.toLowerCase().trim();
  const streams = await cacheOrGetStreams(username);
  const isLive = !!(streams && streams.id);
  ctx.body = {
    isLive
  };
}

async function deleteStreams(ctx) {
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

async function cacheOrGetStreams(username) {
  let cacheLengthS = 60; // 60 == 1min
  const cacheKey = `${prefix}${username}`;
  console.debug(`[${cacheKey}]: Getting streams status`);
  const data = await redis.get(cacheKey).catch(err => {
    console.error("Redis error: ", err);
  });
  let twitchStreams = JSON.parse(data);
  if (twitchStreams) {
    return twitchStreams;
  }

  console.debug(`[${cacheKey}]: isLive not cached`);
  twitchStreams = await getStreamsFromTwitch(username);
  console.debug(`[${cacheKey}]: done getting stream`);
  if (!twitchStreams) {
    console.debug(`[${cacheKey}]: Failed to get streams from Twitch`);
    return;
  } else if (twitchStreams === "429") {
    console.debug(`[${cacheKey}]: API limit hit`);
  }

  redis.set(cacheKey, JSON.stringify(twitchStreams), "EX", cacheLengthS);
  if (twitchStreams === "429") {
    return {};
  }
  return twitchStreams;
}

async function getStreamsFromTwitch(username) {
  const url = `https://api.twitch.tv/helix/streams?user_login=${username}`;
  const res = await twitchReq(url);
  if (res.statusCode === 429) return "429";
  const twitchStreams = JSON.parse(res);

  if (twitchStreams && twitchStreams.data) {
    return twitchStreams.data[0] || {};
  }
  return {};
}

exports.getStreams = getStreams;
exports.getLiveStatus = getLiveStatus;
exports.deleteStreams = deleteStreams;
