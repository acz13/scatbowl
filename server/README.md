Scatbowl
======

Quiz Bowl but in 2019 with technology from 2015

To run on your own server (before I figure out schemas and get migrations working)

1. Install redis (https://redis.io/) and start it
2. run `npm install` in the `/server` directory
3. copy `.env.example` to `.env` and edit appropriately
4. run `node server-new.js` to start
5. test out the site (no frontend yet) by visiting `localhost:3000/auth/guest` to login and then connecting with socket.io to `'/'` with a query `{ "room": ROOM_TO_JOIN }`

i.e. `io('/', { query: { room: 'mytestingroom' }}))`

You can see the current available commands over in `server-new.js`
