const redis = require('../redis.js');
const { idgbReq } = require('../utils.js');
const parse = require('co-body');

const prefix = 'igdb-';

async function getGames(ctx) {
  let cacheLengthS = process.env.CACHE_LENGTH_S || 604800; // 604800 == 7 days
  const body = await parse.text(ctx.req);
  const cacheKey = `${prefix}${Buffer.from(body).toString('base64')}`;
  console.debug(`[${cacheKey}]: Getting game(s) form IDGB`);
  let games = await redis.get(cacheKey).catch((err) => {
    console.error('Redis error: ', err);
  });
  if (games) {
    if (games === '404' || games === '429') games = [];
    ctx.body = {
      games: JSON.parse(games),
    };
    return;
  }
  console.debug(`[${cacheKey}]: games not cached`);

  games = await getGamesFromIDGB(body);
  console.debug(`[${cacheKey}]: done getting GamesFromIDGB`);
  if (!games) {
    console.debug(`[${cacheKey}]: Failed to get games from IDGB`);
    ctx.body = {
      games: [],
    };
    return;
  } else if (games === '429') {
    console.debug(`[${cacheKey}]: API limit hit`);
    cacheLengthS = 60;
  }
  if (games === '404' || games === '429') {
    games = [];
  }
  redis.set(cacheKey, JSON.stringify(games), 'EX', cacheLengthS);
  ctx.body = {
    games,
  };
  return;
}

async function getGamesFromIDGB(body) {
  const url = `https://api.igdb.com/v4/games`;
  const res = await idgbReq(url, body);
  if (res.statusCode === 429) return '429';
  const games = await res.json();

  if (games && games.length) {
    return games;
  } else if (games && games.length === 0) {
    return '404';
  }

  return null;
}

exports.getGames = getGames;
