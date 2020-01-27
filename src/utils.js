const request = require("request-promise-native");
const { oauth, clientId } = require("./config.js");

const twitchReq = async (url, method = "GET") => {
  const options = {
    method,
    url
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

  return await request(options);
};

exports.twitchReq = twitchReq;
