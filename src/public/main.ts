/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../../node_modules/@types/socket.io-client/index.d.ts" />
///<reference path="../models/Player.ts"/>

import Socket = SocketIOClient.Socket;

let player: Player = null;
let players: Player[] = [];

let playerNumber = 2;
let stage = 1;
let coinNumber = 4;
let currentImage = 1;
const maxImages = 6;
const minLaps = 7;
const maxLaps = 12;
let coinsInTable = 0;
let currentPlayer = 0;
let players2: any[] = [];
let spinButton: any;
let socket: Socket;

socket = io.connect(`http://${document.location.hostname}:${document.location.port}`, { "forceNew": true });

socket.on("players", function (plys: Player[]) {
    players = plys;
    renderPlayers();
});

socket.on("update-player", function (ply: Player) {
    players.forEach(p => {
        if (p.id == ply.id) {
            p.name = ply.name;
            p.coins = ply.coins;
            return false;
        }
    });

    if (player.id != ply.id || stage > 2) {
        updatePlayer(ply);
    }
});

socket.on("do-spin", function(turns: number) {
    if (stage == 3) {
        console.log("Received do-spin, turns = " + turns);
        startAnimation(turns, 0, function () {
            spinButton.removeClass("disabled");
            spinningComplete();
        });
    }
});

$(function() {
    btnEnterClick();
    btnSetClick();
    btnStartClick();
    btnSpinClick();
    btnPlayAgainClick();
    btnNewGameClick();
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
        playerNumber = parseInt(<string>$("#player-number").val());
        setStage(3);
    });
}

function btnSpinClick() {
    spinButton = $("#btn-spin");
    spinButton.click(function(e: any) {
        if (!spinButton.hasClass("disabled")) {
            console.log("Spin Button Click", players2, currentImage, currentPlayer, coinsInTable);
            socket.emit('spin', currentPlayer);
            /*var laps = Math.trunc(minLaps + (maxLaps - minLaps) * Math.random());
            var lapPart = Math.trunc(maxImages * Math.random());
            spinButton.addClass("disabled");
            startAnimation(laps * maxImages + lapPart, 0, function() {
                spinButton.removeClass("disabled");
                spinningComplete();
            });*/
        }
    });
}

function btnPlayAgainClick() {
    $("#btn-play-again").click(function(e) {
        setStage(2);
    });
}

function btnNewGameClick() {
    $("#btn-new-game").click(function(e) {
        setStage(2);
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
        createPlayerArray();

        setImage(1);

        $("#table-coins").text("0");
        coinsInTable = playerNumber;
        animateNumber($("#table-coins"), playerNumber, 100);
        $(".player h3").each(function(i) {
            animateNumber($(this), players2[i] - 1, 300);
            players2[i]--;
        });

        setTimeout(function() {
            setCurrentPlayer(1);
            spinButton.removeClass("disabled");
        }, 1400);
    }
}

function setImage(imageNumber: number) {
    currentImage = imageNumber;
    $(".image").hide();
    $("#image-" + currentImage).show();
}

function setCurrentPlayer(player: number) {
    $("#player-" + currentPlayer).removeClass("active");
    currentPlayer = player;
    $("#player-" + currentPlayer).addClass("active");
}

function startAnimation(turns: number, i: number, complete: Function) {

    if (i == turns) {
        complete();
        return;
    }

    if (i > 0) {
        currentImage++;
        if (currentImage > maxImages) {
            currentImage = 1;
        }

        setImage(currentImage);
    }


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

function createPlayerArray() {
    $(".player").remove();

    players2 = [];
    for (let i = 0; i < playerNumber; i++) {
        players2.push(coinNumber);
    }

    for (let i = 0; i < playerNumber; i++) {
        $('<div class="player" id="player-' + (i + 1) + '">'
            + '<h5>P' + (i + 1) + '</h5>'
            + '<h3>' + players2[i] + '</h3>'
            + '</div>').appendTo(".players2");
    }
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
    }
}

function updatePlayer(p: Player) {
    if (stage == 2) {
        $(`#player-stg2-${p.id}`).html(`<td>${p.name}</td><td>${p.coins}</td>`);
    }
}

function spinningComplete() {
    let count;
    console.log("Spining Complete", players2, currentImage, currentPlayer, coinsInTable);
    switch (currentImage) {
        case 1:
            count = 0;
            for (let i = 0; i < playerNumber; i++) {
                if (players2[i] > 0) {
                    players2[i]--;
                    animateNumber($("#player-" + (i + 1) + " h3"), players2[i], 300);
                    count++;
                }
            }
            coinsInTable += count;
            break;
        case 2:
            count = 2;
            if (coinsInTable < 2) {
                count = coinsInTable;
                coinsInTable = 0;
            } else {
                coinsInTable -= 2;
            }

            players2[currentPlayer - 1] += count;
            animateNumber($("#player-" + currentPlayer + " h3"), players2[currentPlayer - 1], 300);
            break;
        case 3:
            coinsInTable++;

            players2[currentPlayer - 1]--;
            animateNumber($("#player-" + currentPlayer + " h3"), players2[currentPlayer - 1], 300);
            break;
        case 4:

            players2[currentPlayer - 1] += coinsInTable;
            coinsInTable = 0;
            animateNumber($("#player-" + currentPlayer + " h3"), players2[currentPlayer - 1], 300);
            break;
        case 5:
            count = 2;
            if (players2[currentPlayer - 1] < 2) {
                count = players2[currentPlayer - 1];
                players2[currentPlayer - 1] = 0;
            } else {
                players2[currentPlayer - 1] -= 2;
            }

            coinsInTable += count;
            animateNumber($("#player-" + currentPlayer + " h3"), players2[currentPlayer - 1], 300);
            break;
        case 6:
            count = 1;
            if (coinsInTable < 1) {
                count = coinsInTable;
                coinsInTable = 0;
            } else {
                coinsInTable -= 1;
            }

            players2[currentPlayer - 1] += count;
            animateNumber($("#player-" + currentPlayer + " h3"), players2[currentPlayer - 1], 300);
            break;
    }

    console.log("Spining Complete, End", players2, currentImage, currentPlayer, coinsInTable);

    animateNumber($("#table-coins"), coinsInTable, 100);

    count = 0;
    let winner = 0;
    for (let i = 0; i < playerNumber; i++) {
        if (players2[i] > 0) {
            winner = i + 1;
            count++;
            if (count > 1) {
                break;
            }
        }
    }

    if (count <= 1) {
        $("#winner-player").text("Jugador " + winner);
        setStage(4);
    } else {
        let player = currentPlayer;
        do {
            player = player + 1;
            if (player > playerNumber) {
                player = 1;
            }
        } while (players2[player - 1] == 0);
        setCurrentPlayer(player);
    }
}

function animateNumber(el: any, newValue: number, time: number) {
    const value = parseInt(el.text());
    let duration = (newValue - value) * time;
    if (duration < 0) duration = -duration;
    console.log(value, newValue, duration);

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