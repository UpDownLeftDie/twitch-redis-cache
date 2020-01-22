require("dotenv").config();
const oauth = process.env.OAUTH;
const clientId = process.env.CLIENT_ID;
if (!oauth && !clientId) {
  console.error("Add your OAuth (prefered) or Client-Id to a .env file.");
  return;
}

module.exports = {
  oauth,
  clientId
};
