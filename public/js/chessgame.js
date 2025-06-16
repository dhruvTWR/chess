const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let clickSource = null;
let pendingPromotionMove = null;

// Ask for name and notify server
const playerName = prompt("Enter your name:");
socket.emit('joinGame', playerName);

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = '';
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add(
                'square',
                (rowIndex + squareIndex) % 2 === 0 ? 'light' : 'dark'
            );

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', square.color === 'w' ? 'white' : 'black');
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener('dragstart', (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData('text/plain', '');
                    }
                });

                pieceElement.addEventListener('dragend', () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener('dragover', (e) => e.preventDefault());

            squareElement.addEventListener("drop", function (e) {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };
                    handleMove(sourceSquare, targetSource);
                }
            });

            squareElement.addEventListener("click", function () {
                const clicked = {
                    row: parseInt(squareElement.dataset.row),
                    col: parseInt(squareElement.dataset.col)
                };

                if (clickSource) {
                    handleMove(clickSource, clicked);
                    clickSource = null;
                } else {
                    const piece = chess.board()[clicked.row][clicked.col];
                    if (piece && piece.color === playerRole) {
                        clickSource = clicked;
                    }
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === 'b') {
        boardElement.classList.add('flipped');
    } else {
        boardElement.classList.remove('flipped');
    }
};

const handleMove = (sourceSquare, targetSquare) => {
    const from = `${String.fromCharCode(97 + sourceSquare.col)}${8 - sourceSquare.row}`;
    const to = `${String.fromCharCode(97 + targetSquare.col)}${8 - targetSquare.row}`;

    const piece = chess.get(from);

    if (piece?.type === 'p' &&
        ((piece.color === 'w' && to.endsWith('8')) ||
            (piece.color === 'b' && to.endsWith('1')))) {
        pendingPromotionMove = { from, to };
        document.getElementById('promotionModal').style.display = 'flex';
    } else {
        socket.emit('move', { from, to });
    }
};

const selectPromotion = (promotion) => {
    if (pendingPromotionMove) {
        socket.emit('move', {
            ...pendingPromotionMove,
            promotion
        });
        pendingPromotionMove = null;
        document.getElementById('promotionModal').style.display = 'none';
    }
};

const getPieceUnicode = (piece) => {
    const unicodePiece = {
        K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
        k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟"
    };
    return unicodePiece[piece.type] || '';
};

socket.on('playerRole', (role) => {
    playerRole = role;
    renderBoard();
});

socket.on('spectatorRole', () => {
    playerRole = null;
    renderBoard();
});

socket.on('move', (move) => {
    chess.move(move);
    renderBoard();

    if (chess.in_check()) {
        alert("Check!");
    }
});

socket.on('boardState', (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on('invalidMove', () => {
    alert("Invalid move attempted!");
});

socket.on('checkmate', (winner) => {
    alert(`Checkmate! ${winner} wins!`);
    chess.reset();
    renderBoard();
});

socket.on('stalemate', () => {
    alert("The game ended in stalemate.");
    chess.reset();
    renderBoard();
});

socket.on('resigned', (playerColor) => {
    alert(`${playerColor} has resigned. Game over.`);
    chess.reset();
    renderBoard();
});

socket.on('playerJoined', (name) => {
    alert(`Player ${name} has joined the game!`);
});

socket.on('drawOffered', () => {
    const response = confirm("Your opponent has offered a draw. Do you accept?");
    if (response) {
        socket.emit('drawAccepted');
    } else {
        socket.emit('drawDeclined');
    }
});
socket.on('draw', () => {
    alert("The game ended in a draw by mutual agreement.");
    chess.reset();
    renderBoard();
});


socket.on('drawDeclinedNotification', () => {
    alert("Your draw offer was declined.");
});

const addControlButtons = () => {
    const controls = document.createElement('div');
    controls.classList.add('controls');

    const resignBtn = document.createElement('button');
    resignBtn.innerText = 'Resign';
    resignBtn.classList.add('control-btn');
    resignBtn.onclick = () => {
        console.log("Resign clicked");
        socket.emit('resign', playerRole);
    };

    const drawBtn = document.createElement('button');
    drawBtn.innerText = 'Offer Draw';
    drawBtn.classList.add('control-btn');
    drawBtn.onclick = () => {
        console.log("Draw clicked");
        socket.emit('offerDraw');
    };

    controls.appendChild(resignBtn);
    controls.appendChild(drawBtn);

    boardElement.parentNode.insertBefore(controls, boardElement.nextSibling);
};

addControlButtons();
