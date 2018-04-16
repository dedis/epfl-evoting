FROM debian:stretch

RUN apt-get update && apt-get install -y curl gnupg2 vim
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . ./

EXPOSE 3000

ENV NODE_PATH=/usr/src/app/node_modules

CMD "./init.sh"
