const request = require("request-promise-native");
const { getSessionStorage } = require("./twitchSession");

const twitchReq = async (url, method = "GET") => {
  const { twitch } = await getSessionStorage();
  const options = {
    method,
    url,
  };

  options.headers = {
    Authorization: `Bearer ${twitch.accessToken}`,
    "Client-ID": twitch.clientId,
  };

  return await request(options).catch((err) => {
    console.error(err);
    throw new Error("Failed to make request to twitch");
  });
};

const getUsername = (ctx) => {
  return ctx.params.username.toLowerCase().trim();
};

exports.twitchReq = twitchReq;
exports.getUsername = getUsername;
