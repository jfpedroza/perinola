import * as express from "express";
import * as http from "http";
import * as socketio from "socket.io";
import * as path from "path";

const app = express();
const server = new http.Server(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, "public")/*, { maxAge: 31557600000 }*/));

const minLaps = 7;
const maxLaps = 12;
const maxImages = 6;
const minPlayers = 2;

let players: Player[] = [];

io.on("connection", function(socket) {
    console.log("A new player has connected");

    socket.on("new-player", function (player: Player) {
        console.log("New player: ", player);
        players.push(player);
        io.sockets.emit("players", players);
    });

    socket.on("update-player", function (player: Player) {
        players.forEach(p => {
            if (p.id == player.id) {
                p.name = player.name;
                p.coins = player.coins;
                return false;
            }
        });
        io.sockets.emit("update-player", player);
    });

    socket.on("start", function () {
        if (players.length < minPlayers) {
            socket.emit("not-enough-players", minPlayers);
        } else {
            io.sockets.emit("start-game");
        }
    });

    socket.on("restart", function () {
        players = [];
        io.sockets.emit("restart");
    });

    socket.on("spin", function(currentPlayer) {
        console.log("Spin message, current player = " + currentPlayer);
        const laps = Math.floor(minLaps + (maxLaps - minLaps) * Math.random());
        const lapPart = Math.floor(maxImages * Math.random());
        const turns = laps * maxImages + lapPart;
        console.log("emitting do-spin, turns = " + turns);
        io.sockets.emit("do-spin", turns);
    });

    /*socket.emit('messages', messages);

    socket.on('new-message', function(data) {
        messages.push(data);

        io.sockets.emit('messages', messages);
    });*/
});

server.listen(3000, function() {
    console.log("Server running at http://localhost:3000");
});