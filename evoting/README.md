# Evoting

This package is split into two parts:

* Frontend - made using [Vue](https://vuejs.org/)
* Server - written in node. Responsible for managing auth with Tequila,
and also for serving the HTML/JS/CSS files during development.

# Setup

## Environmental Variables

The authentication server requires an environment variable

* `PRIVATE_KEY` - ed25519 private key to generate schnorr signature (64 hex digits)

## Common steps

Copy `frontend/src/config.example.js` and `server/config.example.js` to `config.js` and
update `masterID` to match the one from the `evoting-admin` tool.

Copy/Symlink the `public.toml` file from the leader node to `frontend/src`. This
will be the WebSocket endpoint where all requests from the frontend to the
cothority are transmitted.

```
cd frontend
npm install
npm run build
cd ../server
npm install
```

On the frontend, `config.js` and `public.toml` are transpiled into the final
app, so each change to them must be followed by `npm run build`.

## Dev

By default, the destination for `npm run build` is set to `../server/dist`. The
node server will manage the auth and *serve the static files* as well in a dev
environemnt (unlike production where nginx/apache does the latter). Therefore,
just run `npm run build` in the `frontend` directory. Then run the server by:

```
cd server
PRIVATE_KEY=723765abc node index.js
```

You can then access the frontend on: http://localhost:3000/

The frontend will detect that you are not logged in and send you
to Tequila. Tequila will return your browser to http://localhost/auth/verify
(because Tequila does not allow redirecting to non-standard ports).
This will result in an error, because the dev server is on port 3000.
You should now edit the URL to add the missing
`:3000` in. The authentication signature cookie will be written into your
browser, and then the frontend can start running.

It is more comfortable to develop the frontend when the Vue-aware webserver
is running, so that hot-reload works. To do so, you can stop the dev server
and instead run run "PORT=3000 npm start" from the `frontend` directory.

Debugging authentication problems resulting in endless redirect loops
through Tequila is much easier if you set the JavaScript console to *not*
clear on navigation to a new page. In this way, you can see the log messages
and/or failed network accesses that resulted in the redirect back to
the `/auth/login` endpoint, and onwards to Tequila.

## Production

The production setup is to use nginx as a reverse proxy that would redirect all
requests to `/auth/(login|verify)` to the node process while all other requests
will be served by the Vue frontend.

You might want to change `frontend/config/index.js`. Search for the `build` key and
change the `index` and `assetsRoot` keys

```
  ...
  build: {
    // Template for index.html
    index: /path/to/server/root/index.html

    // Paths
    assetsRoot: /path/to/server/root,

	...
```

Make sure node can write to the server root.

Running `cd frontend && npm run build` will now output the transpiled files to
the server root. Run the server in production mode by executing

```
cd server
PRIVATE_KEY=723765abc node index.js
```

### Nginx configuration

Here's a sample nginx configuration

```
server {
        listen 80;
        server_name <hostname>;
        return 301 https://<hostname>$request_uri;
}

server {
        listen 443 ssl;
        server_name <hostname>;
        ssl_certificate <path/to/cert>;
        ssl_certificate_key <path/to/key>;

        location ~ ^/auth/(login|verify)$ {
				proxy_set_header Host $host;
				proxy_pass http://localhost:3000;
                proxy_set_header X-Forwarded-Host $host:$server_port;
                proxy_set_header X-Forwarded-Server $host;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_cache_bypass $http_upgrade;
        }

        location / {
                root <path/to/server/root>;
                index index.html;
        }
}
```
