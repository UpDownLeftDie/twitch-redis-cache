const redis = require("../redis.js");
const { twitchReq } = require("../utils");

const prefix = "streams-";

async function getLiveStatus(ctx) {
  const username = ctx.params.username.toLowerCase().trim();
  const stream = await getStreams(username);
  const isLive = !!(stream && stream.id);
  ctx.body = {
    isLive
  };
}

async function getStreams(username) {
  let cacheLengthS = 60; // 60 == 1min
  const cacheKey = `${prefix}${username}`;
  console.debug(`[${cacheKey}]: Getting stream status`);
  const data = await redis.get(cacheKey).catch(err => {
    console.error("Redis error: ", err);
  });
  let twitchStream = JSON.parse(data);
  if (twitchStream) {
    return twitchStream;
  }

  console.debug(`[${cacheKey}]: isLive not cached`);
  twitchStream = await getStreamFromTwitch(username);
  console.debug(`[${cacheKey}]: done getting stream`);
  if (!twitchStream) {
    console.debug(`[${cacheKey}]: Failed to get stream from Twitch`);
    return;
  } else if (twitchStream === "429") {
    console.debug(`[${cacheKey}]: API limit hit`);
  }

  redis.set(cacheKey, JSON.stringify(twitchStream), "EX", cacheLengthS);
  if (twitchStream === "429") {
    return {};
  }
  return twitchStream;
}

async function getStreamFromTwitch(username) {
  const url = `https://api.twitch.tv/helix/streams?user_login=${username}`;
  const res = await twitchReq(url);
  if (res.statusCode === 429) return "429";
  const twitchStreams = JSON.parse(res);

  if (twitchStreams && twitchStreams.data) {
    return twitchStreams.data[0] || {};
  }
  return {};
}

exports.getLiveStatus = getLiveStatus;
