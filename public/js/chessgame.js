const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let clickSource = null;

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

            squareElement.addEventListener('dragover', function(e) {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", function(e) {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };
                    handleMove(sourceSquare, targetSource);
                }
            });

            // Click-to-move support
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

    if(playerRole === 'b'){
        boardElement.classList.add('flipped');
    }else {
        boardElement.classList.remove('flipped');
    }
};

const handleMove = (sourceSquare, targetSource) => {
    const move = {
        from: `${String.fromCharCode(97 + sourceSquare.col)}${8 - sourceSquare.row}`,
        to: `${String.fromCharCode(97 + targetSource.col)}${8 - targetSource.row}`,
        promotion: 'q' // Promote to queen
    };
    socket.emit('move', move);
};

const getPieceUnicode = (piece) => {
    const unicodePiece = {
        K: "♔",  // King
        Q: "♕",  // Queen
        R: "♖",  // Rook
        B: "♗",  // Bishop
        N: "♘",  // Knight
        P: "♙",  // Pawn
        k: "♚",  // King
        q: "♛",  // Queen
        r: "♜",  // Rook
        b: "♝",  // Bishop
        n: "♞",  // Knight
        p: "♟"   // Pawn
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

socket.on('invalidMove', (move) => {
    alert("Invalid move attempted!");
});

// Checkmate detection
socket.on('checkmate', (winner) => {
    alert(`Checkmate! ${winner} wins!`);
});

// Opponent left detection and reset
socket.on('opponentLeft', () => {
    alert("Opponent has left the match. Game will restart.");
    chess.reset();
    renderBoard();
});

// Draw
socket.on('draw', () => {
    alert("The game ended in a draw.");
    chess.reset();
    renderBoard();
});

// Stalemate
socket.on('stalemate', () => {
    alert("The game ended in stalemate.");
    chess.reset();
    renderBoard();
});

socket.on('invalidClaim', (msg) => {
    alert(msg);
});


// Resign
socket.on('resigned', (player) => {
    alert(`${player} resigned. Game over.`);
    chess.reset();
    renderBoard();
});

const addControlButtons = () => {
    const controls = document.createElement('div');
    controls.classList.add('controls');

    const resignBtn = document.createElement('button');
    resignBtn.innerText = 'Resign';
    resignBtn.classList.add('control-btn');
    resignBtn.onclick = () => socket.emit('resign', playerRole);

    const drawBtn = document.createElement('button');
    drawBtn.innerText = 'Offer Draw';
    drawBtn.classList.add('control-btn');
    drawBtn.onclick = () => socket.emit('offerDraw');

    controls.appendChild(resignBtn);
    controls.appendChild(drawBtn);

    boardElement.parentNode.insertBefore(controls, boardElement.nextSibling);
};


addControlButtons();
