const express = require('express');
const socket = require('socket.io');
const http = require("http");
const Chess = require('chess.js').Chess;
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socket(server); 

let chess = new Chess();
let players = {};

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => {
    res.render('index', { title: "Chess Game" });
});

io.on('connection', function(socket) {
    console.log("New player connected:", socket.id);

    socket.on('joinGame', (name) => {
        socket.data.playerName = name;

        if (!players.white) {
            players.white = socket;
            socket.emit('playerRole', 'w');
        } else if (!players.black) {
            players.black = socket;
            socket.emit('playerRole', 'b');

            players.white.emit('playerJoined', name);
            socket.emit('playerJoined', players.white.data.playerName || 'White Player');
        } else {
            socket.emit('spectatorRole');
        }
    });

    socket.on('move', (move) => {
        try {
            const from = move.from;
            const to = move.to;
            const piece = chess.get(from);

            if (piece && piece.type === 'p') {
                const lastRank = piece.color === 'w' ? '8' : '1';
                if (to[1] === lastRank && !move.promotion) {
                    move.promotion = 'q';
                }
            }

            if (chess.turn() === 'w' && socket.id !== players.white?.id) {
                return socket.emit('invalidTurn');
            }
            if (chess.turn() === 'b' && socket.id !== players.black?.id) {
                return socket.emit('invalidTurn');
            }

            const result = chess.move(move);

            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());

                if (chess.isCheckmate()) {
                    const winner = chess.turn() === 'w' ? 'Black' : 'White';
                    io.emit("checkmate", winner);
                    chess.reset();
                } else if (chess.isStalemate()) {
                    io.emit("stalemate");
                    chess.reset();
                }
            } else {
                socket.emit('invalidMove', move);
            }
        } catch (error) {
            console.error("Error in move validation:", error);
            socket.emit('invalidMove', move);
        }
    });

    socket.on('resign', (player) => {
        const playerColor = player === 'w' ? 'White' : 'Black';
        io.emit('resigned', playerColor);
        chess.reset();
    });

    socket.on('offerDraw', () => {
        let opponent = null;
        if (players.white?.id === socket.id) {
            opponent = players.black;
        } else if (players.black?.id === socket.id) {
            opponent = players.white;
        }
        if (opponent) {
            opponent.emit('drawOffered');
        }
    });

    socket.on('drawAccepted', () => {
        io.emit('draw');
        chess.reset();
    });

    socket.on('drawDeclined', () => {
        let opponent = null;
        if (players.white?.id === socket.id) {
            opponent = players.black;
        } else if (players.black?.id === socket.id) {
            opponent = players.white;
        }
        if (opponent) {
            opponent.emit('drawDeclinedNotification');
        }
    });

    socket.on("disconnect", function() {
        let wasPlayer = false;

        if (players.white && socket.id === players.white.id) {
            delete players.white;
            wasPlayer = true;
        }
        if (players.black && socket.id === players.black.id) {
            delete players.black;
            wasPlayer = true;
        }

        if (wasPlayer) {
            chess.reset();
            io.emit("opponentLeft");
        }
    });
});

server.listen(3000, function () {
    console.log("Listening on port 3000");
});
