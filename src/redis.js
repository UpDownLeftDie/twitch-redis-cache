const redis = require("redis");
const { promisify } = require("util");

const client = redis.createClient();
const get = promisify(client.get).bind(client);
const set = promisify(client.set).bind(client);
const del = promisify(client.del).bind(client);

module.exports = { get, set, del };
