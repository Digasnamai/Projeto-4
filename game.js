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


