const fetch = require('node-fetch');
const { getSessionStorage } = require('./twitchSession');

const twitchReq = async (url, method = 'GET') => {
  const { twitch } = await getSessionStorage();
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${twitch.accessToken}`,
      'Client-ID': twitch.clientId,
    },
  };

  return await fetch(url, options).catch((err) => {
    console.error(err);
    throw new Error('Failed to make request to twitch');
  });
};

const getUsername = (ctx) => {
  return ctx.params.username.toLowerCase().trim();
};

const idgbReq = async (url, body) => {
  const { twitch } = await getSessionStorage();
  const options = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${twitch.clientCredentials}`,
      'Client-ID': twitch.clientId,
    },
    body,
  };

  return await fetch(url, options).catch((err) => {
    console.error(err);
    throw new Error('Failed to make request to IDGB');
  });
};

exports.twitchReq = twitchReq;
exports.getUsername = getUsername;
exports.idgbReq = idgbReq;
