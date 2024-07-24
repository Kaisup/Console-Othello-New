const readline = require('readline');

class Player {
    constructor(playerToken) {
        this.player = playerToken;
    }

    playerInput(availableMove) {
        return new Promise((resolve, reject) => {
            const userInput = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            userInput.question("What is your next move (in format [Y, X]): ", (answer) => {
                let ansMove;
                try {
                    ansMove = JSON.parse(answer);
                } catch {
                    console.log("Invalid input. Please input in the form \"[Y, X]\"");
                    userInput.close();
                    reject("Invalid input");
                    return;
                }

                let trueMove = [ansMove[0], ansMove[1]];
                if (availableMove.some(move => move[0] === trueMove[0] && move[1] === trueMove[1])) {
                    userInput.close();
                    resolve(ansMove);
                } else {
                    console.log("Invalid move. Please select one of the available moves.");
                    userInput.close();
                    this.playerInput(availableMove).then(resolve).catch(reject);
                }
            });
        });
    }
}

class Bot {
    constructor(botToken, difficulty) {
        this.player = botToken;
        this.difficulty = difficulty;
        this.boardMoveScore = [[100, -10, 1, 1, 1, 1, -10, 100],
                            [-10, -20, -2, -2, -2, -2, -20, -10],
                            [1, -2, -2, -2, -2, -2, -2, 1],
                            [1, -2, -2, -1, -1, -2, -2, 1],
                            [1, -2, -2, -1, -1, -2, -2, 1],
                            [1, -2, -2, -2, -2, -2, -2, 1],
                            [-10, -20, -2, -2, -2, -2, -20, -10],
                            [100, -10, 1, 1, 1, 1, -10, 100]];
    }

    bestMove(availableMove) {
        return availableMove[Math.floor(Math.random() * availableMove.length)];
    }
}

class OthelloBoard {
    constructor() {
        this.player2 = ""; //Black is player 2
        this.difficulty = "";
        this.player_1 = new Player("O");
        this.current_player = ["O", "X"][Math.floor(Math.random() * 2)];
        this.board = [
            ["B", "B", "B", "B", "B", "B", "B", "B", "B", "B"],
            ["B", "N", "N", "N", "N", "N", "N", "N", "N", "B"],
            ["B", "N", "N", "N", "N", "N", "N", "N", "N", "B"],
            ["B", "N", "N", "N", "N", "N", "N", "N", "N", "B"],
            ["B", "N", "N", "N", "O", "X", "N", "N", "N", "B"],
            ["B", "N", "N", "N", "X", "O", "N", "N", "N", "B"],
            ["B", "N", "N", "N", "N", "N", "N", "N", "N", "B"],
            ["B", "N", "N", "N", "N", "N", "N", "N", "N", "B"],
            ["B", "N", "N", "N", "N", "N", "N", "N", "N", "B"],
            ["B", "B", "B", "B", "B", "B", "B", "B", "B", "B"]
        ];

        this.initPlayer2()
            .then(() => {
                console.log(`Game Start\nBlack : X || White : O`);
                this.player_2 = this.player2 === "P" ? new Player("X") : new Bot("X", this.difficulty);
                this.game();
            })
            .catch((error) => {
                console.error("Error initializing player 2:", error);
            });
    }

    initPlayer2() {
        return new Promise((resolve, reject) => {
            const selectPlayer2 = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
    
            selectPlayer2.question("Select player 2 (P - player/B - bot): ", async (answer) => {
                if (answer === 'P') {
                    this.player2 = 'P';
                    selectPlayer2.close();
                    resolve();
                } else if (answer === "B") {
                    selectPlayer2.close();
                    await this.selectBotDifficulty();
                    resolve();
                } else {
                    console.log("Invalid user type");
                    selectPlayer2.close();
                    await this.initPlayer2();
                    resolve();
                }
            });
        });
    }
    
    async selectBotDifficulty() {
        const difficultySelect = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    
        try {
            const answer = await new Promise((resolve, reject) => {
                difficultySelect.question("Select difficulty (easy/normal/hard): ", resolve);
            });
    
            if (answer === "easy" || answer === "normal" || answer === "hard") {
                this.difficulty = answer;
                this.player2 = "B";
                difficultySelect.close();
            } else {
                console.log("Invalid difficulty");
                difficultySelect.close();
                await this.selectBotDifficulty();
            }
        } catch (error) {
            console.error("Error selecting difficulty:", error);
            difficultySelect.close();
            throw error;
        }
    }

    game() {
        let availableMove = this.checkBoard();
        if (availableMove.length > 0) {
            this.printBoard(availableMove);
            console.log(`Current Player : ${this.showPlayer(this.current_player)}`);
            console.log(`${this.showPlayer(this.current_player)}'s available move(s) : `, availableMove);

            if (this.current_player === "X" && this.player2 === "B") {
                let ans = this.player_2.bestMove(availableMove);
                this.placePiece(ans);
                this.switchPlayer();
                this.game();
            } else if (this.current_player === "X") {
                this.player_2.playerInput(availableMove).then((ans) => {
                    this.placePiece(ans);
                    this.switchPlayer();
                    this.game();
                }).catch((error) => {
                    console.error("Move failed:", error);
                });
            } else {
                this.player_1.playerInput(availableMove).then((ans) => {
                    this.placePiece(ans);
                    this.switchPlayer();
                    this.game();
                }).catch((error) => {
                    console.error("Move failed:", error);
                });
            }
        } else {
            this.switchPlayer();
            if (this.checkBoard().length > 0) {
                this.game();
            } else {
                let score = this.gameOver();
                console.log(`Game Over: White - ${score[0]} : Black ${score[1]}`);
            }
        }
    }

    gameOver() {
        let scorewhite = 0;
        let scoreblack = 0;
        for (let row = 1; row < 9; row++) {
            for (let column = 1; column < 9; column++) {
                let unit = this.board[row][column];
                if (unit == "O") {
                    scorewhite++;
                } else if (unit == "X") {
                    scoreblack++;
                }
            }
        }
        return [scorewhite, scoreblack];
    }

    placePiece(move) {
        let [y, x] = move;
        let opponent = this.opponent(this.current_player);
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                if (i === 0 && j === 0) {
                    continue;
                }
                let toChange = [];
                let currentCheckX = x + j;
                let currentCheckY = y + i;
                let enemyInbetween = false;

                if (currentCheckY < 1 || currentCheckY > 8 || currentCheckX < 1 || currentCheckX > 8) {
                    continue;
                }

                while (this.board[currentCheckY][currentCheckX] === opponent) {
                    enemyInbetween = true;
                    toChange.push([currentCheckY, currentCheckX]);
                    currentCheckX += j;
                    currentCheckY += i;

                    if (currentCheckY < 1 || currentCheckY > 8 || currentCheckX < 1 || currentCheckX > 8) {
                        break;
                    }
                }

                if (enemyInbetween && this.board[currentCheckY][currentCheckX] === this.current_player) {
                    for (let k = 0; k < toChange.length; k++) {
                        let changePos = toChange[k];
                        this.board[changePos[0]][changePos[1]] = this.current_player;
                    }
                }
            }
        }
        // Set the current move
        this.board[y][x] = this.current_player;
    }

    isValidMove(axis) {
        let [original_y, original_x] = axis;
        let opponent = this.opponent(this.current_player);
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                let currentCheckX = original_x;
                let currentCheckY = original_y;
                let enemyInbetween = false;
                while (this.board[currentCheckY + i][currentCheckX + j] == opponent) {
                    enemyInbetween = true;
                    currentCheckX = currentCheckX + j;
                    currentCheckY = currentCheckY + i;
                }
                if ((this.board[currentCheckY + i][currentCheckX + j] == this.current_player) & enemyInbetween) {
                    return true;
                }
            }
        }
    }

    checkBoard() {
        let available = [];
        for (let row = 1; row < 9; row++) {
            for (let column = 1; column < 9; column++) {
                if (this.board[row][column] == "N") {
                    if (this.isValidMove([row, column])) {
                        available.push([row, column]);
                    }
                }
            }
        }
        return available;
    }

    opponent(player) {
        return player === "O" ? "X" : "O";
    }

    switchPlayer() {
        this.current_player = this.opponent(this.current_player);
    }

    showPlayer(player) {
        return player === "X" ? "Black" : "White";
    }

    printBoard(allAvailableMove) {
        let vs = "+ 1 2 3 4 5 6 7 8\n";
        for (let row = 1; row < 9; row++) {
            vs = vs + `${row} `;
            for (let column = 1; column < 9; column++) {
                let stat = this.board[row][column];
                if (allAvailableMove.some(availableMove => availableMove[0] === row && availableMove[1] === column)) {
                    stat = "!";
                } else if (stat == "N") {
                    stat = "#";
                }
                vs = vs + stat + " ";
            }
            vs = vs + "\n";
        }
        console.log(vs);
    }
}

let othello = new OthelloBoard();