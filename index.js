const Koa = require('koa');
const app = new Koa();
const request = require('request-promise-native');
const redis = require('redis');
const router = require('koa-router')();
const {
    promisify
} = require('util');

const client = redis.createClient();
const redisGet = promisify(client.get).bind(client);
const redisSet = promisify(client.set).bind(client);

require('dotenv').config();
const oauth = process.env.OAUTH;
const clientId = process.env.CLIENT_ID;
if (!oauth && !clientId) {
    console.error("Add your OAuth or Client-Id to a .env file.")
    return;
}
const cacheLengthS = process.env.CACHE_LENGTH_S || 604800; // 604800 = 7 days
const placeholderImage = process.env.PLACEHOLDER_IMAGE || "https://static-cdn.jtvnw.net/user-default-pictures/4cbf10f1-bb9f-4f57-90e1-15bf06cfe6f5-profile_image-70x70.jpg";

router.get('/:username', getUrl);
app.use(router.routes());


async function getUrl(ctx) {
    const username = ctx.params.username.toLowerCase().trim();
    console.debug(`[${username}]: Getting image`)
    let url = await redisGet(username).catch(err => console.error("Redis error: ", err));
    if (url) {
        ctx.body = url;
        return;
    }
    console.debug(`[${username}]: Url not cached`);

    url = await getUrlFromTwitch(username);
    console.debug('done getting url');
    if (!url) {
        console.debug(`[${username}]: Failed to get image from Twitch`);
        ctx.body = placeholderImage;
        return;
    }

    redisSet(username, url, 'EX', cacheLengthS);
    ctx.body = url;
    return;
}

app.listen(process.env.PORT || 3000);

async function getUrlFromTwitch(username) {
    const options = {
        method: 'GET',
        url: `https://api.twitch.tv/helix/users?login=${username}`
    }
    if (oauth) {
        options.headers = {
            "Authorization": `Bearer ${oauth}`
        }
    } else if (clientId) {
        options.headers = {
            'Client-ID': clientId
        }
    }

    const res = await request(options);
    const twitchUser = JSON.parse(res);

    if (twitchUser.data && twitchUser.data.length) {
        return twitchUser.data[0].profile_image_url;
    }
    return null;
}