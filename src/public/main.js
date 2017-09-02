/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../node_modules/@types/socket.io-client/index.d.ts" />
var playerNumber = 2;
var stage = 1;
var coinNumber = 4;
var currentImage = 1;
var maxImages = 6;
var minLaps = 7;
var maxLaps = 12;
var coinsInTable = 0;
var currentPlayer = 0;
var players;
var spinButton;
var socket;
var Player = (function () {
    function Player(id, name, coins) {
        this.id = id;
        this.name = name;
        this.coins = coins;
    }
    return Player;
}());
socket = io.connect("http://" + document.location.hostname + ":" + document.location.port, { 'forceNew': true });
socket.on('do-spin', function (turns) {
    if (stage == 3) {
        console.log("Received do-spin, turns = " + turns);
        startAnimation(turns, 0, function () {
            spinButton.removeClass("disabled");
            spinningComplete();
        });
    }
});
$(function () {
    btnEnterClick();
    btnStartClick();
    btnSpinClick();
    btnPlayAgainClick();
    btnNewGameClick();
    btnHomeClick();
    setStage(1);
});
function btnEnterClick() {
    $("#btn-enter").click(function (e) {
        setStage(2);
    });
}
function btnStartClick() {
    $("#btn-start").click(function (e) {
        playerNumber = parseInt($("#player-number").val());
        setStage(3);
    });
}
function btnSpinClick() {
    spinButton = $("#btn-spin");
    spinButton.click(function (e) {
        if (!spinButton.hasClass("disabled")) {
            console.log("Spin Button Click", players, currentImage, currentPlayer, coinsInTable);
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
    $("#btn-play-again").click(function (e) {
        setStage(2);
    });
}
function btnNewGameClick() {
    $("#btn-new-game").click(function (e) {
        setStage(2);
    });
}
function btnHomeClick() {
    $("#btn-home").click(function (e) {
        setStage(1);
    });
}
function setStage(s) {
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
        $(".player h3").each(function (i) {
            animateNumber($(this), players[i] - 1, 300);
            players[i]--;
        });
        setTimeout(function () {
            setCurrentPlayer(1);
            spinButton.removeClass("disabled");
        }, 1400);
    }
}
function setImage(imageNumber) {
    currentImage = imageNumber;
    $(".image").hide();
    $("#image-" + currentImage).show();
}
function setCurrentPlayer(player) {
    $("#player-" + currentPlayer).removeClass("active");
    currentPlayer = player;
    $("#player-" + currentPlayer).addClass("active");
}
function startAnimation(turns, i, complete) {
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
    if (turns - i > 3 * maxImages) {
        var time = 150;
    }
    else {
        var laps = turns - 3 * maxImages;
        var time = 150 + (i - laps) * 50;
    }
    setTimeout(function () {
        startAnimation(turns, i + 1, complete);
    }, time);
}
function createPlayerArray() {
    $(".player").remove();
    players = [];
    for (var i = 0; i < playerNumber; i++) {
        players.push(coinNumber);
    }
    for (var i = 0; i < playerNumber; i++) {
        $('<div class="player" id="player-' + (i + 1) + '">'
            + '<h5>P' + (i + 1) + '</h5>'
            + '<h3>' + players[i] + '</h3>'
            + '</div>').appendTo(".players");
    }
}
function spinningComplete() {
    console.log("Spining Complete", players, currentImage, currentPlayer, coinsInTable);
    switch (currentImage) {
        case 1:
            var count = 0;
            for (var i = 0; i < playerNumber; i++) {
                if (players[i] > 0) {
                    players[i]--;
                    animateNumber($("#player-" + (i + 1) + " h3"), players[i], 300);
                    count++;
                }
            }
            coinsInTable += count;
            break;
        case 2:
            var count = 2;
            if (coinsInTable < 2) {
                count = coinsInTable;
                coinsInTable = 0;
            }
            else {
                coinsInTable -= 2;
            }
            players[currentPlayer - 1] += count;
            animateNumber($("#player-" + currentPlayer + " h3"), players[currentPlayer - 1], 300);
            break;
        case 3:
            coinsInTable++;
            players[currentPlayer - 1]--;
            animateNumber($("#player-" + currentPlayer + " h3"), players[currentPlayer - 1], 300);
            break;
        case 4:
            players[currentPlayer - 1] += coinsInTable;
            coinsInTable = 0;
            animateNumber($("#player-" + currentPlayer + " h3"), players[currentPlayer - 1], 300);
            break;
        case 5:
            var count = 2;
            if (players[currentPlayer - 1] < 2) {
                count = players[currentPlayer - 1];
                players[currentPlayer - 1] = 0;
            }
            else {
                players[currentPlayer - 1] -= 2;
            }
            coinsInTable += count;
            animateNumber($("#player-" + currentPlayer + " h3"), players[currentPlayer - 1], 300);
            break;
        case 6:
            var count = 1;
            if (coinsInTable < 1) {
                count = coinsInTable;
                coinsInTable = 0;
            }
            else {
                coinsInTable -= 1;
            }
            players[currentPlayer - 1] += count;
            animateNumber($("#player-" + currentPlayer + " h3"), players[currentPlayer - 1], 300);
            break;
    }
    console.log("Spining Complete, End", players, currentImage, currentPlayer, coinsInTable);
    animateNumber($("#table-coins"), coinsInTable, 100);
    var count = 0;
    var winner = 0;
    for (var i = 0; i < playerNumber; i++) {
        if (players[i] > 0) {
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
    }
    else {
        var player = currentPlayer;
        do {
            var player = player + 1;
            if (player > playerNumber) {
                player = 1;
            }
        } while (players[player - 1] == 0);
        setCurrentPlayer(player);
    }
}
function animateNumber(el, newValue, time) {
    var value = parseInt(el.text());
    var duration = (newValue - value) * time;
    if (duration < 0)
        duration = -duration;
    console.log(value, newValue, duration);
    el.prop('Counter', value).animate({
        Counter: newValue
    }, {
        duration: duration,
        easing: 'swing',
        step: function (now) {
            el.text(Math.ceil(now));
        }
    });
}
