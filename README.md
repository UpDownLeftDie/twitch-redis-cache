# Twitch Redis Cache

Simple API to proxy and cache calls to Twitch's API to create a long term buffer and allow high volume of requests.

## Method 1: Docker Setup

1. `cp example.env .env`
2. Edit `.env` accordingly
   1. You only need OAuth OR Client-ID tokens. OAuth allow for high volume of requests per minute.
3. `docker build -t twitch-redis-cache .`
4. `docker run -d -p 3000:<port in .env> twitch-redis-cache`

## Method 2: Local Setup

### 1. Dependencies

1. Install Redis-Server
   1. Linux: `apt install redis-server`
   2. Mac (via [homebrew](https://brew.sh/)): `brew install redis`
   3. Windows: [https://redis.io/download](https://redis.io/download)
2. git clone `https://github.com/UpDownLeftDie/twitch-redis-cache.git && cd twitch-redis-cache`
3. `npm install`
4. `cp example.env .env`
5. Edit `.env` accordingly
   1. You only need OAuth OR Client-ID tokens
   2. OAuth allow for high volume of requests per minute.
6. `npm start`

### 2. Service

1. Clone or move the project to `/opt` (or where you like and edit the `.service` file)
   1. `mv twitch-redis-cache /opt/twitch-redis-cache`
2. Move the service file to `/lib/systemd/system`
   1. `cd /opt/twitch-redis-cache && mv twitch-redis-cache.service /lib/systemd/system`
   2. Edit the service file as needed
3. Enable and start the service
   1. `sudo systemctl enable twitch-redis-cache.service && sudo systemctl start twitch-redis-cache.service`
   2. Optional: make sure its running `sudo systemctl status twitch-redis-cache.service`

## Hosting Setup

Depending on where you're calling this API from you'll probably need it to be behind SSL.
You could use [Let's encrypt](https://letsencrypt.org/) to get a certificate if you know how to set that up.
A simpler method is using [Cloudflare](https://www.cloudflare.com/).

1. Add a domain you purchased to Cloudflare.
2. Cypto > SSL > **Flexible**
   1. This is because the server we're running the API on does not have a cert.
   2. Alternatively, if you can use a `Page Rule` to change the SSL setting if youre using a subdomain for this API.
3. Set the port in the `.env` to `80` (Docker: use `-p 80:<port in .env>`)
4. Now you should be able to call it via `https://domain.com/userimage/TwitchUserNameHere`

## TODO

* Replace `request` package with `node-fetch` (or equivalent package)
* Add in request queuing to Twitch if rate-limit is hit
* Switch to TypeScript (or even Golang)
