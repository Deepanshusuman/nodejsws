const http = require("http");
const app = require("./app");
const server = http.createServer(app);
const WebSocket = require("ws");
const jwt = require('jsonwebtoken');
function heartbeat() {
  this.isAlive = true;
}
function onlineUsers() {
  //to->system
  online = {};
  online.to = "system";
  online.online = wss.clients.size;
  return JSON.stringify(online);
}
function noop() {}
const wss = new WebSocket.Server({
  server: server,
  path: "/global",
  concurrencyLimit: 7000,
  verifyClient: function (info, cb) {
    var token = info.req.headers.token;
    if (!token) cb(false, 401, "Unauthorized");
    else {
      jwt.verify(token, "decodedstring", function (err, decoded) {
        if (err) {
          cb(false, 401, "Unauthorized");
        } else {
          info.req.user = decoded; //[1]
          cb(true);
        }
      });
    }
  },
});
wss.on("connection", function connection(ws, request, c) {
  ws.send(onlineUsers());
  ws.isAlive = true;
  ws.on("pong", heartbeat);
  let interval = setInterval(function () {
    ws.ping();
  }, 5000);
  wss.clients.forEach(function each(client) {
    client.send(onlineUsers());
    if (client == ws && client.readyState === WebSocket.OPEN) {
      string = {};
      string.to = "global";
      string.from = "Server";
      string.message = "Welcome to Global Chat";
      client.send(JSON.stringify(string));
    }
  });
  ws.on("message", function incoming(data) {
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        ws.send(onlineUsers());

        if (JSON.parse(data).type == 1) {
          client.send(data);
        }
        //2->ping
        // if (JSON.parse(data).type == 2) {
        //   client.send(onlineUsers());
        // }
        
      }
    });
  });
  ws.on("close", function close(ev) {
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        clearInterval(interval);
        client.send(onlineUsers());
      }
    });
  });
});
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping(noop);
  });
}, 1000);
server.listen(3000);
