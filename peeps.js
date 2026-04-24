//peeps

//expressões possíveis do peeps
const peepsFaces = {
    neutral: "media/olho.png",
    apprehensive: "media/olho apreencivo.png",
    down: "media/olho baixo.png",
    evil: "media/olho evil.png",
    happy: "media/olho feliz.png",
    side: "media/olho lado.png",
    megaHappy: "media/olho mega feliz.png",
    angry: "media/olho zangado.png",
    touch: "media/olho toque.png"
};

let começou = false;
let acabou = false;

let peepsTimeout;
let currentPeepsFace = "neutral";
let savedSequenceText = null;   //o que estava a dizer antes de ser interrompido
let savedSequenceFace = "neutral";  //que cara tinha

//interrupções
let isPeepsInterrupted = false;
let peepsClickCount = 0;    //quantas vezes se clicou no peeps
let peepsClickTimer = null; //tempo antes da contagem reiniciar


//como a imagem do Peeps é um PNG transparente de 50 por 50 píxeis, 
//usamos um "Hitmap" da imagem original apenas a vermelho,
//para detetar se o jogador clicou no peeps e náo só no espaço vazio à volta dele.
function updatePeepsHitmap(expressionKey) {
    const hitboxCanvas = document.getElementById('peeps-hitbox');
    if (!hitboxCanvas) return;
    const ctx = hitboxCanvas.getContext('2d', { willReadFrequently: true });

    const imgPath = peepsFaces[expressionKey];
    if (!imgPath) return;

    //procura a versão "hitmap" da imagem atual
    const hitmapPath = imgPath.replace('.png', '_hit_map.png');

    const hitmapImg = new Image();
    hitmapImg.src = hitmapPath;
    hitmapImg.onload = () => {
        hitboxCanvas.width = hitmapImg.width;
        hitboxCanvas.height = hitmapImg.height;
        ctx.clearRect(0, 0, hitboxCanvas.width, hitboxCanvas.height);
        ctx.drawImage(hitmapImg, 0, 0); //desenha o hitmap invisivel
    };
}

//inicia o detetor do rato no peeps     
window.addEventListener('load', () => {
    const hitboxCanvas = document.getElementById('peeps-hitbox');
    if (!hitboxCanvas) return;

    const ctx = hitboxCanvas.getContext('2d', { willReadFrequently: true });
    updatePeepsHitmap("neutral");

    let isHoveringPeeps = false;

    //verifica se o rato está acima do sprite do Peeps
    function isMouseHittingPeeps(e) {
        const container = document.getElementById('peeps-container');
        if (!container || container.style.display === 'none') return false;

        const rect = hitboxCanvas.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
            const scaleX = hitboxCanvas.width / rect.width;
            const scaleY = hitboxCanvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
            return (pixel[0] > 150 && pixel[3] > 100); //se for um píxel do hitmap com cor devolve true
        }
        return false;
    }

    //muda o cursor quando passa por cima
    document.addEventListener('mousemove', (e) => {
        if (isMouseHittingPeeps(e)) {
            if (!isHoveringPeeps) {
                document.body.classList.add('peeps-hover-cursor');
                isHoveringPeeps = true;
            }
        } else if (isHoveringPeeps) {
            document.body.classList.remove('peeps-hover-cursor');
            isHoveringPeeps = false;
        }
    }, true);

    //irrita o Peeps quando clica
    document.addEventListener('mousedown', (e) => {
        if (isMouseHittingPeeps(e)) {
            annoyPeeps();
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);
});


//diálogo

//Faz o falar e mudar de cara
function showPeeps(message, expression = "neutral", duration = 6000, isSystemCall = false) {
    if (começou === false) return; //se o jogo não tiver começado o peeps não aparece mais
    if (acabou === true) return; //se o jogo tiver acabado o peeps não aparece mais

    const container = document.getElementById('peeps-container');
    const bubble = document.getElementById('peeps-bubble');
    const text = document.getElementById('peeps-text');
    const avatar = document.getElementById('peeps-avatar');
    const crtScreen = document.getElementById('crt-container');

    if (!avatar || !container) return;

    container.style.display = 'flex';
    container.style.zIndex = "999999";

    //o peeps abana o ecrã e dá play a um sound effect quando tem esta expressão
    if (expression === "evil") {
        playSound(soundEvil);
        if (crtScreen) crtScreen.classList.add('evil-shake');
    } else {
        if (crtScreen) crtScreen.classList.remove('evil-shake');
    }

    //se for interrompido por algo externo (como o jogador)
    if (!isSystemCall && skipPeepsResolver) {
        if (!isPeepsInterrupted) {
            savedSequenceText = text.innerText; //guarda a sequencia de texto que estava a dizer
            savedSequenceFace = currentPeepsFace;   //bem como a expressão
        }
        isPeepsInterrupted = true;
    } else if (isSystemCall && skipPeepsResolver) {
        savedSequenceText = null;
    }

    //muda de cara
    if (peepsFaces[expression]) {
        avatar.src = peepsFaces[expression];
        currentPeepsFace = expression;
        updatePeepsHitmap(expression);
    }

    //atualiza o texto no balão de fala
    if (message) {
        text.innerText = message;
        bubble.style.display = 'block';
    } else {
        bubble.style.display = 'none';
    }

    //limpa timers antigos
    if (peepsTimeout) clearTimeout(peepsTimeout);

    //timer para o desaparecimento do peeps ou regresso à frase anterior
    if (duration > 0) {
        peepsTimeout = setTimeout(() => {
            if (isPeepsInterrupted && savedSequenceText) {
                //volta à falar que foi interrompida
                text.innerText = savedSequenceText;
                avatar.src = peepsFaces[savedSequenceFace] || peepsFaces["neutral"];
                updatePeepsHitmap(savedSequenceFace);
                currentPeepsFace = savedSequenceFace;
                bubble.style.display = 'block';

                isPeepsInterrupted = false;
                savedSequenceText = null;
            } else {
                //volta ao estado natural
                bubble.style.display = 'none';
                avatar.src = peepsFaces["neutral"];
                updatePeepsHitmap("neutral");
                currentPeepsFace = "neutral";
            }
            if (crtScreen) crtScreen.classList.remove('evil-shake');
        }, duration);
    }
}

//salta a fala se o utilizador clicar na caixa de texto
function skipPeepsSpeech() {
    if (isPeepsInterrupted) return;

    if (skipPeepsResolver) {
        skipPeepsResolver(); //resolve a Promise de tempo
        skipPeepsResolver = null;
        return;
    }

    const bubble = document.getElementById('peeps-bubble');

    if (bubble && bubble.style.display !== 'none') {
        if (peepsTimeout) {
            clearTimeout(peepsTimeout);
            peepsTimeout = null;
        }

        bubble.style.display = 'none';

        const avatar = document.getElementById('peeps-avatar');
        if (avatar && peepsFaces["neutral"]) {
            avatar.src = peepsFaces["neutral"];
            updatePeepsHitmap("neutral");
            currentPeepsFace = "neutral";
        }
    }
}

//função chamada quando o jogador clica no olho do peeps com o rato
function annoyPeeps() {
    peepsClickCount++;

    if (peepsClickTimer) clearTimeout(peepsClickTimer);
    peepsClickTimer = setTimeout(() => { peepsClickCount = 0; }, 2000);

    //se clicar 5 vezes em menos de 2 segundos
    if (peepsClickCount >= 5) {
        peepsClickCount = 0;

        //se já estiver interrompido ignora
        if (isPeepsInterrupted) return;

        const angryFaces = ["angry", "angry", "angry", "touch", "touch", "touch", "evil"];
        const randomFace = angryFaces[Math.floor(Math.random() * angryFaces.length)];

        //não metemos o true no fim para que não seja possível saltar este diálogo com um click
        if (["angry", "touch"].includes(randomFace)) {
            showPeeps("Can you stop that?", randomFace, 4000);
        } else {
            showPeeps("ENOUGH!", randomFace, 4000);
        };

    }
}



//sequências de texto

let peepsSequenceNumber = 0;
let skipPeepsResolver = null;
let peepsSequenceStack = [];
let activeSequence = null;
let activeSequenceIndex = 0;

async function playPeepsSequence(sequence, keepPrevious = false) {

    peepsSequenceNumber++;
    const myToken = peepsSequenceNumber;    //identificador desta sequência

    if (skipPeepsResolver) {
        skipPeepsResolver();
        skipPeepsResolver = null;
    }

    isPeepsInterrupted = false; //garante que o tempo não congela

    if (keepPrevious) {
        //se foi imterrompido guarda a frase anterior para voltar mais tarde
        if (activeSequence && activeSequenceIndex < activeSequence.length) {
            //usamos o +1 para que ele não repita a frase onde foi interrompido
            const remainingSteps = activeSequence.slice(activeSequenceIndex + 1);
            if (remainingSteps.length > 0) {
                peepsSequenceStack.push(remainingSteps);
            }
        }
    } else {
        peepsSequenceStack = [];
    }

    activeSequence = sequence;
    activeSequenceIndex = 0;

    //apresenta as frases à vez
    for (let i = 0; i < sequence.length; i++) {
        //se aparecer outra sequência, retira esta
        if (peepsSequenceNumber !== myToken) return;

        activeSequenceIndex = i;
        const step = sequence[i];

        showPeeps(step.text, step.face, 0, true);

        await new Promise(resolve => {
            let timeRemaining = step.duration;

            let checkInterval = setInterval(() => {
                if (peepsSequenceNumber !== myToken) {
                    clearInterval(checkInterval);
                    resolve();
                    return;
                }
                //se não estiver a ser interrompido desconta o tempo da frase
                if (!isPeepsInterrupted) {
                    timeRemaining -= 100;
                }

                if (timeRemaining <= 0) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);

            //permite saltar a frase com um click
            skipPeepsResolver = () => {
                clearInterval(checkInterval);
                resolve();
            };
        });
    }

    //quando a sequência termina
    if (peepsSequenceNumber === myToken) {
        activeSequence = null;
        activeSequenceIndex = 0;
        skipPeepsResolver = null;

        //verifica se há outra sequência gravada
        if (peepsSequenceStack.length > 0) {
            const previousSequence = peepsSequenceStack.pop();
            playPeepsSequence(previousSequence, true); // true para o caso de haver várias na gaveta
            return;
        }

        //se não houver nada restante volta ao estado neutro
        const bubble = document.getElementById('peeps-bubble');
        const avatar = document.getElementById('peeps-avatar');
        if (bubble) bubble.style.display = 'none';
        if (avatar && peepsFaces["neutral"]) {
            avatar.src = peepsFaces["neutral"];
            updatePeepsHitmap("neutral");
            currentPeepsFace = "neutral";
        }
    }
}

//secção introdutória
let isIntroFinished = false;

//função chamada no fim da boot sequence
function playIntro() {
    playSound(soundStartup);
    setTimeout(async () => {
        começou = true //para o primeiro trigger assim que começa a introdução
        await playPeepsSequence([
            {
                text: "Hello there! Thank you for taking part in our study! My name is Peeps, the A eye assistant, and I will be your helper today.",
                face: "happy",
                duration: 7000
            },
            {
                text: "My job is to guide you through a few tasks we at Percepta developed for you!",
                face: "neutral",
                duration: 5000
            },
            {
                text: "Nonetheless, remember that this study is still being tested and the computer you are using was kindly lent by Percepta, our wonderful company!",
                face: "megaHappy",
                duration: 8000
            },
            {
                text: "Stay aware of your task and strictly follow our instructions. Just to make sure there are no problems of course!",
                face: "side",
                duration: 7000
            }
        ]);

        isIntroFinished = true;
        //abre a a primeira task no fim da sequência
        setTimeout(() => openWindow('tasks'), 500);

    }, 6000);
};

