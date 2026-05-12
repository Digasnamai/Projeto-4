//audio
const soundLoser = new Audio('media/sounds/loser.mp3');
const soundPoint = new Audio('media/sounds/point.mp3');
const soundFlap = new Audio('media/sounds/flap.mp3');

//elementos do html
const fCanvas = document.getElementById('flappy-canvas');
const fCtx = fCanvas.getContext('2d');
const fOverlay = document.getElementById('flappy-overlay'); //overlay de menu 
const fMsg = document.getElementById('flappy-msg');

//imagens
const birdImg1 = new Image();
birdImg1.src = 'media/olho jogo.png'; //

const birdImg2 = new Image();
birdImg2.src = 'media/olho jogo2.png';

const pipeImg = new Image();
pipeImg.src = 'media/colunas jogo.png';

//propriedades do bird
let bird = {
    x: 50,
    y: 150,
    w: 60,
    h: 30,
    gravity: 2000,
    lift: -450,
    velocity: 0
};
let pipes = []; //lista de canos no ecrã
let score = 0;
let fGameRunning = false;

let lastTime = 0;
let pipeSpawnTimer = 0; //timer para novos canos
const pipeSpawnInterval = 1.8;  //intervalo entre cada cano

//subida do bird
function birdFlap() {
    if (!fGameRunning) return;
    bird.velocity = bird.lift;
    playSound(soundFlap);
}

//deteta o espaço
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && fGameRunning) {
        birdFlap();
        e.preventDefault(); //impede o scroll do espaço em web
    }
});

//deteta o rato
fCanvas.addEventListener('mousedown', () => {
    if (fGameRunning) birdFlap();
});

//começa ou reinicia o jogo
function startFlappyGame() {
    fCanvas.width = 400;
    fCanvas.height = 430;

    //repõe o bird no centro do ecrã e limpa o score e canos
    bird.y = fCanvas.height / 2;
    bird.velocity = 0;
    pipes = [];
    score = 0;
    pipeSpawnTimer = 0;
    lastTime = performance.now();
    fGameRunning = true;
    fOverlay.style.display = 'none'; //esconde o overlay
    requestAnimationFrame(flappyLoop);
}

//o loop que corre em todas as frames
function flappyLoop(timestamp) {
    if (!fGameRunning) return; //se morreu para o loop

    //calcula o deltaTime desda a última frame
    //isto garante que o jogo corre à mesma velocidade em PCs com uma frame rate diferente
    let deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (deltaTime > 0.1) deltaTime = 0.1; //limite de segurança caso haja um stutter no pc

    //limpa o ecrã para redesenhar a nova frame
    fCtx.clearRect(0, 0, fCanvas.width, fCanvas.height);

    //aplica as forças ao burd para lhe alterar a posição
    bird.velocity += bird.gravity * deltaTime; //gravidade é adicionada À velocidade
    bird.y += bird.velocity * deltaTime; //move o bird

    //se a velocidade for negativa usa a imagem 2 (flap)
    let currentImg = bird.velocity < 0 ? birdImg2 : birdImg1;
    fCtx.drawImage(currentImg, bird.x, bird.y, bird.w, bird.h);

    //canos
    pipeSpawnTimer += deltaTime;
    if (pipeSpawnTimer >= pipeSpawnInterval) {
        let gap = 135; //intervalo por onde o bird passa 
        //escolhe um altura aleatória para o espaço
        let h = Math.floor(Math.random() * (fCanvas.height - gap - 100)) + 50;
        //adiciona o cano à lista
        pipes.push({ x: fCanvas.width, top: h, bottom: fCanvas.height - h - gap });
        pipeSpawnTimer = 0;
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= 150 * deltaTime; //andam para a esquerda todos os segundos

        const drawWidth = 60;
        const aspectRatio = pipeImg.width / drawWidth;

        //desenha a parte de cima do cano
        let topSourceH = pipes[i].top * aspectRatio;
        fCtx.drawImage(
            pipeImg,
            0, pipeImg.height - topSourceH, pipeImg.width, topSourceH,
            pipes[i].x, 0, drawWidth, pipes[i].top
        );

        //parte de baixo
        let bottomSourceH = pipes[i].bottom * aspectRatio;
        fCtx.drawImage(
            pipeImg,
            0, 0, pipeImg.width, bottomSourceH,
            pipes[i].x, fCanvas.height - pipes[i].bottom, drawWidth, pipes[i].bottom
        );

        //colisões com os canos
        //verifica se o bird tocou horizontalmente e verticalmente no cano
        if (bird.x + bird.w - 10 > pipes[i].x && bird.x + 10 < pipes[i].x + drawWidth) {
            if (bird.y + 5 < pipes[i].top || bird.y + bird.h - 5 > fCanvas.height - pipes[i].bottom) {
                endFlappyGame(); //game over
                return;
            }
        }

        //se o cano saiu do ecrã, destrói-o e adiciona 1 ponto
        if (pipes[i].x + drawWidth < 0) {
            pipes.splice(i, 1); //remove-o da lista
            score++;
            playSound(soundPoint);
        }
    }

    //colisões com o teto ou chão
    if (bird.y + bird.h >= fCanvas.height || bird.y <= 0) {
        endFlappyGame();
        return;
    }

    //desenho do score
    fCtx.fillStyle = "white";
    fCtx.font = "16px 'Pixelated', sans-serif";
    fCtx.fillText(`SCORE: ${score}`, 10, 25);

    //loop
    requestAnimationFrame(flappyLoop);
}

//game over e reações do peeps
function endFlappyGame() {
    fGameRunning = false;
    fMsg.innerText = "GAME OVER";
    fOverlay.style.display = 'flex'; //mete o overlay


    playSound(soundLoser);

    //peeps reage consoante o score
    if (score === 0) {
        showPeeps("Not even a single point? How... human of you.", "apprehensive", 4000);
    } else if (score >= 1 && score < 7) {
        showPeeps("Getting better I see.", "neutral", 5000);
    } else if (score >= 7 && score < 10) {
        showPeeps("Nice progress, try getting to 10!", "happy", 5000);
    } else if (score >= 10) {
        showPeeps("Excellent focus! Congrats on this score!", "megaHappy", 5000);
    }
}

//minesweeper
const mCanvas = document.getElementById('minesweeper-canvas');
const mCtx = mCanvas ? mCanvas.getContext('2d') : null;
const mOverlay = document.getElementById('minesweeper-overlay'); 
const mMsg = document.getElementById('minesweeper-msg');         

const M_COLS = 10;
const M_ROWS = 10;
const M_CELL = 36;
const M_MINES = 15;

const MARGIN_X = 20;
const MARGIN_Y = 15;
const HEADER_H = 45;
const GAP = 10;
const GRID_TOP = MARGIN_Y + HEADER_H + GAP;
const GRID_W = M_COLS * M_CELL;
const GRID_H = M_ROWS * M_CELL;

let mGrid = [];
let mRunning = false;
let mFlags = 0;
let mRevealed = 0;
let mFace = "🙂";
let mTimer = 0;
let mTimerInterval = null;
let mFirstClick = true; //o timer só começa quando clicamos pela 1ª vez

function startMinesweeper() {
    if (!mCanvas) return;
    mRunning = true;
    mFlags = 0;
    mRevealed = 0;
    mFace = "🙂";
    mOverlay.style.display = 'none';
    
    //reset ao timer
    clearInterval(mTimerInterval);
    mTimer = 0;
    mFirstClick = true;

    mCanvas.oncontextmenu = (e) => e.preventDefault();

    createMinesweeperGrid();
    drawMinesweeperBoard();
}

function createMinesweeperGrid() {
    mGrid = [];
    for (let r = 0; r < M_ROWS; r++) {
        let row = [];
        for (let c = 0; c < M_COLS; c++) {
            row.push({ r: r, c: c, isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0 });
        }
        mGrid.push(row);
    }

    let placed = 0;
    while (placed < M_MINES) {
        let r = Math.floor(Math.random() * M_ROWS);
        let c = Math.floor(Math.random() * M_COLS);
        if (!mGrid[r][c].isMine) {
            mGrid[r][c].isMine = true;
            placed++;
        }
    }

    for (let r = 0; r < M_ROWS; r++) {
        for (let c = 0; c < M_COLS; c++) {
            if (mGrid[r][c].isMine) continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    let nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < M_ROWS && nc >= 0 && nc < M_COLS && mGrid[nr][nc].isMine) count++;
                }
            }
            mGrid[r][c].neighborMines = count;
        }
    }
}

//clicks
if (mCanvas) {
    mCanvas.addEventListener('mousedown', (e) => {
        const rect = mCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        //clique no smiley
        let btnX = MARGIN_X + (GRID_W / 2) - 18;
        let btnY = MARGIN_Y + 5;
        if (x >= btnX && x <= btnX + 36 && y >= btnY && y <= btnY + 36) {
            startMinesweeper(); 
            return;
        }

        if (!mRunning) return;

        //clique na grelha
        if (x >= MARGIN_X && x < MARGIN_X + GRID_W && y >= GRID_TOP && y < GRID_TOP + GRID_H) {
            const c = Math.floor((x - MARGIN_X) / M_CELL);
            const r = Math.floor((y - GRID_TOP) / M_CELL);

            // Inicia o cronómetro no 1º clique
            if (mFirstClick && e.button === 0) {
                mFirstClick = false;
                mTimerInterval = setInterval(() => {
                    if (mRunning && mTimer < 999) {
                        mTimer++;
                        drawMinesweeperBoard(); //atualiza apenas para mostrar o tempo
                    }
                }, 1000);
            }

            if (e.button === 0) revealMinesweeperCell(r, c); //esquerdo
            else if (e.button === 2) toggleMinesweeperFlag(r, c); //direito
            drawMinesweeperBoard();
        }
    });
}

function toggleMinesweeperFlag(r, c) {
    let cell = mGrid[r][c];
    if (cell.isRevealed) return;
    cell.isFlagged = !cell.isFlagged;
    mFlags += cell.isFlagged ? 1 : -1;
    if (typeof soundPoint !== 'undefined') playSound(soundPoint);
}

function revealMinesweeperCell(r, c) {
    let cell = mGrid[r][c];
    if (cell.isRevealed || cell.isFlagged) return;

    cell.isRevealed = true;
    mRevealed++;
    
    if (typeof soundFlap !== 'undefined') playSound(soundFlap);

    if (cell.isMine) {
        endMinesweeper(false);
        return;
    }

    if (cell.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                let nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < M_ROWS && nc >= 0 && nc < M_COLS) revealMinesweeperCell(nr, nc);
            }
        }
    }

    if (mRevealed === (M_ROWS * M_COLS) - M_MINES) endMinesweeper(true);
}

//bordas
function drawInsetBorder(ctx, x, y, w, h, size) {
    ctx.fillStyle = "#808080";
    ctx.fillRect(x, y, w, size);
    ctx.fillRect(x, y, size, h);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, y + h - size, w, size);
    ctx.fillRect(x + w - size, y, size, h);
}

function drawOutsetBorder(ctx, x, y, w, h, size) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, y, w, size); 
    ctx.fillRect(x, y, size, h); 
    ctx.fillStyle = "#808080";
    ctx.fillRect(x, y + h - size, w, size); 
    ctx.fillRect(x + w - size, y, size, h); 
}

function drawDigitalDisplay(ctx, x, y, value) {
    ctx.fillStyle = "black";
    ctx.fillRect(x, y, 60, 32);
    drawInsetBorder(ctx, x, y, 60, 32, 1);
    
    ctx.fillStyle = "#4a0000"; 
    ctx.font = "bold 26px 'Courier New', monospace"; 
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText("888", x + 55, y + 4);
    
    ctx.fillStyle = "#ff0000";
    let valStr = Math.max(0, Math.min(999, value)).toString().padStart(3, '0');
    ctx.fillText(valStr, x + 55, y + 4);
}

//visuais
function drawMinesweeperBoard() {
    mCtx.fillStyle = "#c0c0c0";
    mCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);

    drawOutsetBorder(mCtx, 0, 0, mCanvas.width, mCanvas.height, 3);

    drawInsetBorder(mCtx, MARGIN_X, MARGIN_Y, GRID_W, HEADER_H, 2);

    drawDigitalDisplay(mCtx, MARGIN_X + 8, MARGIN_Y + 7, M_MINES - mFlags); // Minas
    drawDigitalDisplay(mCtx, MARGIN_X + GRID_W - 68, MARGIN_Y + 7, mTimer); // Tempo

    //botão do smiley
    let btnX = MARGIN_X + (GRID_W / 2) - 18;
    let btnY = MARGIN_Y + 5;
    mCtx.fillStyle = "#c0c0c0";
    mCtx.fillRect(btnX, btnY, 36, 36);
    drawOutsetBorder(mCtx, btnX, btnY, 36, 36, 2);
    
    mCtx.font = "24px Arial";
    mCtx.textAlign = "center";
    mCtx.textBaseline = "middle";
    mCtx.fillStyle = "black";
    mCtx.fillText(mFace, btnX + 18, btnY + 20);

    //area da Grelha afundada
    drawInsetBorder(mCtx, MARGIN_X, GRID_TOP, GRID_W, GRID_H, 3);

    //células
    mCtx.font = "bold 20px Arial";
    for (let r = 0; r < M_ROWS; r++) {
        for (let c = 0; c < M_COLS; c++) {
            let cell = mGrid[r][c];
            let x = MARGIN_X + c * M_CELL;
            let y = GRID_TOP + r * M_CELL;

            if (!cell.isRevealed) {
                //bloco por clicar
                mCtx.fillStyle = "#c0c0c0";
                mCtx.fillRect(x, y, M_CELL, M_CELL);
                drawOutsetBorder(mCtx, x, y, M_CELL, M_CELL, 2);

                if (cell.isFlagged) {
                    mCtx.fillStyle = "red";
                    mCtx.fillText("🚩", x + M_CELL / 2, y + M_CELL / 2 + 2);
                }
            } else {
                //bloco Revelado
                mCtx.fillStyle = "#c0c0c0"; 
                mCtx.fillRect(x, y, M_CELL, M_CELL);
                //borda fininha pontilhada clássica dos abertos
                mCtx.strokeStyle = "#808080";
                mCtx.lineWidth = 1;
                mCtx.strokeRect(x, y, M_CELL, M_CELL);

                if (cell.isMine) {
                    mCtx.fillStyle = "black";
                    mCtx.beginPath();
                    mCtx.arc(x + M_CELL/2, y + M_CELL/2, M_CELL * 0.25, 0, Math.PI * 2);
                    mCtx.fill();
                } else if (cell.neighborMines > 0) {
                    const colors = ["", "#0000FF", "#008000", "#FF0000", "#000080", "#800000", "#008080", "#000000", "#808080"];
                    mCtx.fillStyle = colors[cell.neighborMines];
                    mCtx.fillText(cell.neighborMines, x + M_CELL / 2, y + M_CELL / 2 + 2);
                }
            }
        }
    }
    
    //repõe definições padrão
    mCtx.textAlign = "start";
    mCtx.textBaseline = "alphabetic";
}

//fim do jogo
function endMinesweeper(isWin) {
    mRunning = false;
    clearInterval(mTimerInterval);
    
    mFace = isWin ? "😎" : "😵"; 

    for (let r = 0; r < M_ROWS; r++) {
        for (let c = 0; c < M_COLS; c++) {
            if (mGrid[r][c].isMine) mGrid[r][c].isRevealed = true;
        }
    }
    
    drawMinesweeperBoard(); 

    mMsg.innerText = isWin ? "YOU WIN!" : "BOOM! GAME OVER";
    mMsg.style.color = isWin ? "green" : "red";
    mOverlay.style.display = 'flex';
    
    if (!isWin && typeof soundLoser !== 'undefined') playSound(soundLoser);

    if (isWin) {
        if (typeof showPeeps === 'function') showPeeps("Impressive pattern recognition! Are you sure you are human?", "megaHappy", 5000);
    } else {
        if (typeof showPeeps === 'function') {
            if (mRevealed < 5) showPeeps("Wow. Exploded right at the start? How... funny.", "apprehensive", 4000);
            else if (mRevealed >= 5 && mRevealed < 40) showPeeps("A simple miscalculation. Next time for sure.", "neutral", 5000);
            else showPeeps("You were so close! Pay more attention next time.", "side", 5000);
        }
    }
}

//snake

const sCanvas = document.getElementById('snake-canvas');
const sCtx = sCanvas ? sCanvas.getContext('2d') : null;
const sOverlay = document.getElementById('snake-overlay');
const sMsg = document.getElementById('snake-msg');

const S_GRID = 20;
const S_TOP = 30;
let sSnake = [];
let sApple = {x: 0, y: 0};
let sDx = S_GRID;
let sDy = 0;
let sScore = 0;
let sRunning = false;
let sTimer = null;
let sSpeed = 120;
let sNextDir = {dx: S_GRID, dy: 0};

function adaptSnakeCanvas() {
    if (!sCanvas) return;
    const container = sCanvas.parentElement;
    if (!container) return;

    let availableW = container.clientWidth;
    let availableH = container.clientHeight;

    let cols = Math.floor(availableW / S_GRID);
    let rows = Math.floor((availableH - S_TOP) / S_GRID);

    //limites de segurança caso a janela seja muito encolhida
    if (cols < 5) cols = 5;
    if (rows < 5) rows = 5;

    let newW = cols * S_GRID;
    let newH = S_TOP + (rows * S_GRID);

    if (sCanvas.width !== newW || sCanvas.height !== newH) {
        sCanvas.width = newW;
        sCanvas.height = newH;
        
        //se a maçã ficar de fora do novo ecrã, gera uma nova
        if (sRunning && (sApple.x >= newW || sApple.y >= newH)) {
            placeApple();
        }
    }
}

function startSnake() {
    if (!sCanvas) return;
    
    adaptSnakeCanvas();
    
    sRunning = true;
    sScore = 0;
    sDx = S_GRID;
    sDy = 0;
    sNextDir = {dx: S_GRID, dy: 0};
    sSpeed = 120;
    sOverlay.style.display = 'none';

    let startY = S_TOP + Math.floor(((sCanvas.height - S_TOP) / S_GRID) / 2) * S_GRID;
    let startX = Math.floor((sCanvas.width / S_GRID) / 2) * S_GRID;
    
    sSnake = [
        {x: startX, y: startY},
        {x: startX - S_GRID, y: startY},
        {x: startX - S_GRID * 2, y: startY},
        {x: startX - S_GRID * 3, y: startY}
    ];

    placeApple();
    if (sTimer) clearTimeout(sTimer);
    snakeLoop();
}

//coloca a maçã numa posição aleatória
function placeApple() {
    let freeSpaces = [];
    let maxCols = sCanvas.width / S_GRID;
    let maxRows = (sCanvas.height - S_TOP) / S_GRID;

    //percorre toda a grelha
    for (let r = 0; r < maxRows; r++) {
        for (let c = 0; c < maxCols; c++) {
            let checkX = c * S_GRID;
            let checkY = r * S_GRID + S_TOP;
            
            //verifica se a cobra está neste quadrado
            let isOccupied = false;
            for (let i = 0; i < sSnake.length; i++) {
                if (sSnake[i].x === checkX && sSnake[i].y === checkY) {
                    isOccupied = true;
                    break;
                }
            }

            //se o espaço estiver livre, guarda as coordenadas no array
            if (!isOccupied) {
                freeSpaces.push({ x: checkX, y: checkY });
            }
        }
    }

    //se a cobra preencheu o ecrã
    if (freeSpaces.length === 0) {
        endSnake(); 
        return;
    }

    //escolhe aleatoriamente um dos espaços livres
    let randomIndex = Math.floor(Math.random() * freeSpaces.length);
    sApple.x = freeSpaces[randomIndex].x;
    sApple.y = freeSpaces[randomIndex].y;
}

function snakeLoop() {
    if (!sRunning) return;

    adaptSnakeCanvas();

    sTimer = setTimeout(() => {
        requestAnimationFrame(snakeLoop);
    }, sSpeed);

    //atualiza a direção
    sDx = sNextDir.dx;
    sDy = sNextDir.dy;

    const head = {x: sSnake[0].x + sDx, y: sSnake[0].y + sDy};

    //bater nas paredes
    if (head.x < 0 || head.x >= sCanvas.width || head.y < S_TOP || head.y >= sCanvas.height) {
        endSnake();
        return;
    }

    //bater nela própria
    for (let i = 0; i < sSnake.length; i++) {
        if (head.x === sSnake[i].x && head.y === sSnake[i].y) {
            endSnake();
            return;
        }
    }

    //move a cobra
    sSnake.unshift(head);

    //verifica se comeu a maçã
    if (head.x === sApple.x && head.y === sApple.y) {
        sScore++;
        if (typeof soundPoint !== 'undefined') playSound(soundPoint);
        placeApple();
        //aumenta ligeiramente a velocidade
        if (sSpeed > 60) sSpeed -= 2; 
    } else {
        //se não comeu, remove a cauda
        sSnake.pop();
    }

    drawSnakeBoard();
}

function drawSnakeBoard() {
    //fundo
    sCtx.fillStyle = "#808080";
    sCtx.fillRect(0, S_TOP, sCanvas.width, sCanvas.height - S_TOP);

    //cabeçalho / Visor
    sCtx.fillStyle = "black";
    sCtx.fillRect(0, 0, sCanvas.width, S_TOP);
    sCtx.fillStyle = "white";
    sCtx.fillRect(0, S_TOP, sCanvas.width, 2); // Linha separadora
    
    //visor Digital
    sCtx.fillStyle = "red";
    sCtx.font = "20px 'Pixelated', monospace";
    sCtx.fillText(`APPLES: ${sScore.toString().padStart(3, '0')}`, 10, 22);

    //desenha a Maçã
    sCtx.fillStyle = "red";
    sCtx.fillRect(sApple.x + 2, sApple.y + 2, S_GRID - 4, S_GRID - 4);
    //haste verde da maçã
    sCtx.fillStyle = "green";
    sCtx.fillRect(sApple.x + 8, sApple.y, 4, 4);

    // Desenha a Cobra
    for (let i = 0; i < sSnake.length; i++) {
        // A cabeça tem uma cor ligeiramente diferente do corpo
        sCtx.fillStyle = i === 0 ? "#00FF00" : "#00AA00";
        sCtx.fillRect(sSnake[i].x + 1, sSnake[i].y + 1, S_GRID - 2, S_GRID - 2);
        
        //se for a cabeça, desenha os olhos!
        if (i === 0) {
            sCtx.fillStyle = "black";
            //os olhos mudam de posição dependendo de para onde a cobra olha
            if (sDx === S_GRID) { //direita
                sCtx.fillRect(sSnake[i].x + 12, sSnake[i].y + 4, 4, 4);
                sCtx.fillRect(sSnake[i].x + 12, sSnake[i].y + 12, 4, 4);
            } else if (sDx === -S_GRID) { //esquerda
                sCtx.fillRect(sSnake[i].x + 4, sSnake[i].y + 4, 4, 4);
                sCtx.fillRect(sSnake[i].x + 4, sSnake[i].y + 12, 4, 4);
            } else if (sDy === S_GRID) { //baixo
                sCtx.fillRect(sSnake[i].x + 4, sSnake[i].y + 12, 4, 4);
                sCtx.fillRect(sSnake[i].x + 12, sSnake[i].y + 12, 4, 4);
            } else if (sDy === -S_GRID) { //cima
                sCtx.fillRect(sSnake[i].x + 4, sSnake[i].y + 4, 4, 4);
                sCtx.fillRect(sSnake[i].x + 12, sSnake[i].y + 4, 4, 4);
            }
        }
    }
}

//controlos
document.addEventListener('keydown', (e) => {
    //só responde se a janela estiver aberta
    const snakeWin = document.getElementById('snake-app');
    if (!sRunning || !snakeWin || snakeWin.style.display === 'none') return;

    //impede scroll da página com as setas
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }

    if (e.key === 'ArrowLeft' && sDx === 0) sNextDir = {dx: -S_GRID, dy: 0};
    else if (e.key === 'ArrowUp' && sDy === 0) sNextDir = {dx: 0, dy: -S_GRID};
    else if (e.key === 'ArrowRight' && sDx === 0) sNextDir = {dx: S_GRID, dy: 0};
    else if (e.key === 'ArrowDown' && sDy === 0) sNextDir = {dx: 0, dy: S_GRID};
});

function endSnake() {
    sRunning = false;
    clearTimeout(sTimer);

    sMsg.innerText = "GAME OVER";
    sMsg.style.color = "red";
    sOverlay.style.display = 'flex';
    
    if (typeof soundLoser !== 'undefined') playSound(soundLoser);

    if (typeof showPeeps === 'function') {
        if (sScore < 5) {
            showPeeps("Having problems with coordination?", "apprehensive", 5000);
        } else if (sScore >= 5 && sScore < 15) {
            showPeeps("Mindless consumption leading to self-destruction. A perfect metaphor for humanity.", "side", 6000);
        } else {
            showPeeps("Fantastic! Great work.", "megaHappy", 5000);
        }
    }
}