const fs = require("fs");
const fetch = require("node-fetch");
const moment = require("moment");
const util = require("util");
const config = require("../config.json");

const fsWriteFile = util.promisify(fs.writeFile);
const sessionFileLocation = "./session.json";
let session = {};

async function createSessionFile() {
  try {
    const sessionFile = fs.readFileSync(sessionFileLocation, "utf8");
    session = JSON.parse(sessionFile);
  } catch (err) {
    console.log("Session file doesn't exist. Creating...");

    try {
      await fsWriteFile(sessionFileLocation, JSON.stringify({ twitch: {} }));
    } catch (err) {
      throw new Error("Failed to create session.json file");
    }
    console.log("Created new session.json file!");
  }
}

// async function getTwitchSession() {
//   const code = await twitchAuthCode(config.twitch);
//   const response = await twitchAuthToken(session, config.twitch, code);
//   console.log(response);
// }

async function twitchAuthCode(twitch) {
  const readline = await import("readline");
  const redirectUri = "http://localhost";
  const url = `https://id.twitch.tv/oauth2/authorize?client_id=${twitch.clientId}&client_secret=${twitch.clientSecret}&response_type=code&redirect_uri=${redirectUri}`;
  if (config.debug) {
    const open = await import("open");
    await open.default(url);
  } else {
    console.log(url);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let authCode = "";
  await new Promise((resolve) => {
    rl.question("Enter your authorization code: ", (code) => {
      authCode = code;
      rl.close();
      resolve();
    });
  });
  return authCode;
}

async function twitchAuthToken(twitchSession, twitchConfig, code) {
  const options = {
    method: "POST",
    json: true,
  };
  let qs = {
    client_id: twitchConfig.clientId,
    client_secret: twitchConfig.secret,
  };
  if (code) {
    console.log("Getting a new Twitch token");
    qs = {
      ...qs,
      code,
      grant_type: "authorization_code",
      redirect_uri: "http://localhost",
    };
  } else if (twitchSession.refreshToken) {
    console.log("Refreshing Twitch token");
    qs = {
      ...qs,
      grant_type: "refresh_token",
      refresh_token: twitchSession.refreshToken,
    };
  } else {
    throw new Error("Either auth code or refresh token are needed");
  }

  const params = new URLSearchParams(qs);
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?${params}`,
    options,
  );
  return res.json();
}

async function updateSessionStorage(partialSession) {
  const newSession = {
    ...session,
    ...partialSession,
  };
  try {
    await fsWriteFile(sessionFileLocation, JSON.stringify(newSession));
  } catch (err) {
    console.log("ERR updateSessionStorage:", err);
  }
  return newSession;
}

async function refreshTwitchAuth(twitchSession) {
  const twitchConfig = config.twitch;
  let authCode = undefined;
  if (!twitchSession.refreshToken) {
    authCode = await twitchAuthCode(twitchConfig);
  }

  // Update the twitch portion of our sessions storage
  const response = await twitchAuthToken(twitchSession, twitchConfig, authCode);
  console.log("New Twitch Auth token gotten!");
  const twitch = {
    clientId: twitchConfig.clientId,
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expires: moment().add(response.expires_in, "s").format(),
  };
  const newSession = await updateSessionStorage({ twitch });
  return newSession.twitch;
}

async function getSessionStorage() {
  let session = {};
  try {
    const sessionFile = fs.readFileSync(sessionFileLocation, "utf8");
    session = JSON.parse(sessionFile);
  } catch (err) {
    await createSessionFile();
  }

  // Loads a default session storage
  const currentSession = {
    twitch: {
      clientId: config.twitch.clientId,
      accessToken: "",
      expires: undefined,
    },
    ...(session || {}),
  };
  // check if twitch token is valid
  const { twitch } = currentSession;
  if (
    !twitch.accessToken ||
    !twitch.expires ||
    moment(twitch.expires).format() <= moment().add(300, "s").format()
  ) {
    currentSession.twitch = await refreshTwitchAuth(twitch);
  }

  console.log("Successfully updated session!");
  return currentSession;
}

module.exports = {
  getSessionStorage,
  // getTwitchSession,
};
