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

    if (!players.white) {
        players.white = socket.id;
        socket.emit('playerRole', 'w');
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit('playerRole', 'b');
    } else {
        socket.emit('spectatorRole');
    }

    socket.on("disconnect", function() {
        let wasPlayer = false;
        if (socket.id === players.white) {
            delete players.white;
            wasPlayer = true;
        } else if (socket.id === players.black) {
            delete players.black;
            wasPlayer = true;
        }

        if (wasPlayer) {
            chess.reset();
            io.emit("opponentLeft");
        }
    });

    socket.on('move', (move) => {
        try {
            if (chess.turn() === "w" && socket.id !== players.white) {
                return socket.emit('invalidTurn');
            }
            if (chess.turn() === "b" && socket.id !== players.black) {
                return socket.emit('invalidTurn');
            }

            const result = chess.move(move);
            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());

                if (chess.in_checkmate()) {
                    const winner = chess.turn() === 'w' ? 'Black' : 'White';
                    io.emit("checkmate", winner);
                    chess.reset();
                }
            } else {
                socket.emit('invalidMove', move);
            }
        } catch (error) {
            console.log("Error in move validation:", error);
            socket.emit('invalidMove', move);
        }
    });

    socket.on('resign', (player) => {
        io.emit('resigned', player === 'w' ? 'White' : 'Black');
        chess.reset();
    });

    socket.on('offerDraw', () => {
        io.emit('draw');
        chess.reset();
    });

});

server.listen(3000, function () {
    console.log("Listening on port 3000");
});
