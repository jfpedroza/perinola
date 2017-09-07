/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../../node_modules/@types/socket.io-client/index.d.ts" />
///<reference path="../models/Player.ts"/>

import Socket = SocketIOClient.Socket;

let player: Player = null;
let players: Player[] = [];
let currentPlayer: Player = null;

let stage = 1;
let currentImage = 1;
const maxImages = 6;
let coinsInTable = 0;
let spinButton: any;
let socket: Socket;

socket = io.connect(`http://${document.location.hostname}:${document.location.port}`, { "forceNew": true });

socket.on("players", function (plys: Player[]) {
    players = plys;
    renderPlayers();
});

socket.on("update-player", function (ply: Player) {
    let p = getPlayer(ply.id);
    if (p != null) {
        p.name = ply.name;
        p.coins = ply.coins;
    }

    if (player.id != ply.id || stage > 2) {
        updatePlayer(ply, true);
    }
});

socket.on("not-enough-players", function (minPlayers: number) {
    alert(`No hay suficientes jugadores. Mínimo ${minPlayers} jugadores`);
});

socket.on("start-game", function () {
    setStage(3);
});

socket.on("restart", function () {
    location.reload(true);
});

socket.on("update-coins-in-table", function (coins: number) {
    coinsInTable = coins;
    animateNumber($("#table-coins"), coinsInTable, 100);
});

socket.on("set-current-player", function (current: Player) {
    setCurrentPlayer(current);
});

socket.on("do-spin", function(turns: number) {
    if (stage == 3) {
        startAnimation(turns, 0, function () {
            spinButton.removeClass("disabled");
            spinningComplete();
        });
    }
});

socket.on("winner", function (winner: Player) {
    if (player.id == winner.id) {
        $("#img-win-lose").attr("src", "img/win.png");
        $("#winner-player").text(`Ganaste con ${winner.coins} monedas`);
    } else {
        $("#img-win-lose").attr("src", "img/lose.png");
        $("#winner-player").text(`${winner.name} ganó con ${winner.coins} monedas`);
    }
    setStage(4);
});

$(function() {
    btnEnterClick();
    btnSetClick();
    btnStartClick();
    btnSpinClick();
    btnPlayAgainClick();
    btnHomeClick();
    setStage(1);
});

function btnEnterClick() {
    $("#btn-enter").click(function(e) {
        player = new Player(new Date().getTime(), "New Player", 2);
        socket.emit("new-player", player);
        setStage(2);
    });
}

function btnSetClick() {
    $("#player-table").on('click', '#btn-set', () => {
        player.name = <string>$("#player-name").val();
        player.coins = <number>$("#player-coins").val();
        socket.emit("update-player", player);
    });
}

function btnStartClick() {
    $("#btn-start").click(function(e) {
        socket.emit("start");
    });
}

function btnSpinClick() {
    spinButton = $("#btn-spin");
    spinButton.click(function(e: any) {
        if (!spinButton.hasClass("disabled")) {
            spinButton.addClass("disabled");
            socket.emit('spin', currentPlayer);
        }
    });
}

function btnPlayAgainClick() {
    $("#btn-play-again").click(function(e) {
        restart();
    });
}

function btnHomeClick() {
    $("#btn-home").click(function(e) {
        setStage(1);
    });
}

function setStage(s: number) {
    $("#stage-" + stage).hide(1000);
    stage = s;
    $("#stage-" + stage).show(1000, onStageChange);
}

function onStageChange() {
    if (stage === 3) {
        spinButton.addClass("disabled");
        renderPlayers();

        setImage(1);

        $("#table-coins").text("0");

        socket.emit("ready");
    }
}

function setImage(imageNumber: number) {
    currentImage = imageNumber;
    $(".image").hide();
    $("#image-" + currentImage).show();
}

function setCurrentPlayer(current: Player) {
    if (currentPlayer != null) {
        $(`#player-${currentPlayer.id}`).removeClass("active");
    }
    currentPlayer = current;
    $(`#player-${currentPlayer.id}`).addClass("active");

    if (currentPlayer.id == player.id) {
        spinButton.removeClass("disabled");
    } else {
        spinButton.addClass("disabled");
    }
}

function startAnimation(turns: number, i: number, complete: Function) {

    if (i == turns) {
        complete();
        return;
    }

    currentImage++;
    if (currentImage > maxImages) {
        currentImage = 1;
    }

    setImage(currentImage);

    let time;
    if (turns - i > 3 * maxImages) {
        time = 150;
    } else {
        const laps = turns - 3 * maxImages;
        time = 150 + (i - laps) * 50;
    }

    setTimeout(function() {
        startAnimation(turns, i + 1, complete);
    }, time);
}

function renderPlayers() {
    if (stage == 2) {
        const table = $("#player-table tbody");
        table.html("");
        players.forEach(p => {

            if (player.id == p.id) {
                table.append(`<tr id="player-stg2-${p.id}">
                                <td><input value="${p.name}" class="input" id="player-name" autofocus></td>
                                <td><input type="number" value="${p.coins}" class="input" id="player-coins" min="2" width="4"></td>
                                <td><button id="btn-set">Set</button></td>
                              </tr>`);
            } else {
                table.append(`<tr id="player-stg2-${p.id}"><td>${p.name}</td><td>${p.coins}</td></tr>`);
            }
        });
    } else if (stage == 3) {
        $(".player").remove();
        let plys = $(".players");
        players.forEach(p => {
            plys.append(`<div class="player" id="player-${p.id}">
                            <h5>${p.name}</h5>
                            <h3>${p.coins}</h3>
                        </div>`);
        });
    }
}

function updatePlayer(p: Player, animate: boolean) {
    if (stage == 2) {
        $(`#player-stg2-${p.id}`).html(`<td>${p.name}</td><td>${p.coins}</td>`);
    } else if (stage == 3) {
        if (animate) {
            animateNumber($(`#player-${p.id} h3`), p.coins, 300);
        } else {
            $(`#player-${p.id}`).html(`<h5>${p.name}</h5><h3>${p.coins}</h3>`);
        }
    }
}

function spinningComplete() {
    socket.emit("spinning-complete");
}

function restart() {
    socket.emit("restart");
}

function getPlayer(id: number): Player {
    const result = players.filter(p => p.id == id);
    if (result.length > 0) {
        return result[0];
    } else {
        return null;
    }
}

function animateNumber(el: any, newValue: number, time: number) {
    const value = parseInt(el.text());
    let duration = (newValue - value) * time;
    if (duration < 0) duration = -duration;

    el.prop('Counter', value).animate({
        Counter: newValue
    }, {
        duration: duration,
        easing: 'swing',
        step: function (now: number) {
            el.text(Math.ceil(now));
        }
    });
}