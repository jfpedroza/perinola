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
let coinsInTable = 0;
let currentPlayer: Player = null;
let currentImage = 1;
let winner: Player = null;

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
            coinsInTable = players.length;
            players.forEach(p => {
                p.coins--;
            });
            currentPlayer = players[0];
            currentImage = 1;
            winner = null;
        }
    });

    socket.on("ready", function () {
        players.forEach(p => {
            socket.emit("update-player", p);
        });

        socket.emit("update-coins-in-table", coinsInTable);
        socket.emit("set-current-player", currentPlayer);
    });

    socket.on("restart", function () {
        players = [];
        io.sockets.emit("restart");
    });

    socket.on("spin", function() {
        console.log(players);
        const laps = Math.floor(minLaps + (maxLaps - minLaps) * Math.random());
        const lapPart = Math.floor(maxImages * Math.random());
        const turns = laps * maxImages + lapPart;
        io.sockets.emit("do-spin", turns);
        console.log("Before calculating", currentImage);
        currentImage = 1 + (currentImage - 1 + turns) % maxImages;
        console.log("After calculating", currentImage);
        processResult();
    });

    socket.on("spinning-complete", function () {

        players.forEach(p => {
            socket.emit("update-player", p);
        });

        socket.emit("update-coins-in-table", coinsInTable);

        if (winner != null) {
            setTimeout(function () {
                socket.emit("winner", winner);
            }, 800);
        } else {
            socket.emit("set-current-player", currentPlayer);
        }
    });
});

server.listen(3000, function() {
    console.log("Server running at http://localhost:3000");
});

function processResult() {
    console.log("Current Player", currentPlayer);
    let count: number;
    let result: string;
    switch (currentImage) {
        case 1: // Todos Ponen
            result = "Todos ponen";
            count = 0;
            players.forEach(p => {
                if (p.coins > 0) {
                    p.coins--;
                    count++;
                }
            });

            coinsInTable += count;
            break;
        case 2: // Toma 2
            result = "Toma 2";
            count = 2;
            if (coinsInTable < 2) {
                count = coinsInTable;
                coinsInTable = 0;
            } else {
                coinsInTable -= 2;
            }

            currentPlayer.coins += count;
            break;
        case 3: // Pon 1
            result = "Pon 1";
            coinsInTable++;
            currentPlayer.coins--;
            break;
        case 4: // Toma Todo
            result = "Toma Todo";
            currentPlayer.coins += coinsInTable;
            coinsInTable = 0;
            break;
        case 5: // Pon 2
            result = "Pon 2";
            count = 2;
            if (currentPlayer.coins < 2) {
                count = currentPlayer.coins;
                currentPlayer.coins = 0;
            } else {
                currentPlayer.coins -= 2;
            }

            coinsInTable += count;
            break;
        case 6: // Toma 1
            result = "Toma 1";
            count = 1;
            if (coinsInTable < 1) {
                count = coinsInTable;
                coinsInTable = 0;
            } else {
                coinsInTable -= 1;
            }

            currentPlayer.coins += count;
            break;
    }

    count = 0;
    let w: Player = null;
    players.forEach(p => {
        if (p.coins > 0) {
            w = p;
            count++;
            if (count > 1) {
                return false;
            }
        }
    });

    console.log("count", count);

    if (count <= 1) {
        winner = w;
    } else {
        let player = currentPlayer;
        let pos = 0;
        players.forEach((p, index) => {
            if (p.id == player.id) {
                pos = index;
                return false;
            }
        });
        console.log("pos", pos);

        do {
            pos = pos + 1;
            if (pos == players.length) {
                pos = 0;
            }
            player = players[pos];
            console.log("pos", pos, "player", player);
        } while (player.coins == 0);
        currentPlayer = player;
        console.log("Current Player", currentPlayer);
    }

    console.log("End of process result", result);
}