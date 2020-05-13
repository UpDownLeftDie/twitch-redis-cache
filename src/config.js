const config = require("../config.json");
const { getSessionStorage } = require("./twitchSession");
const { clientId, secret } = config.twitch;

async function loadSession() {
  if (!secret || !clientId) {
    console.error("Add your Client-Id and Secret to config.json file.");
    return;
  }

  let session;
  try {
    console.log("trying to get getSessionStorage");
    session = await getSessionStorage();
  } catch (err) {
    console.error(err);
    throw new Error("Failed to getSessionStorage in config.js");
  }
  return session;
}

module.exports = loadSession();
