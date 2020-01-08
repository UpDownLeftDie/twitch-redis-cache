FROM mhart/alpine-node:12
LABEL maintainer="https://twitch.tv/UpDownLeftDie"

WORKDIR /app
COPY . /app
RUN cd /app
RUN apk add --no-cache redis
RUN npm install
RUN chmod +x dockerstart.sh
CMD ./dockerstart.sh