function getTime() {
    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    const segundos = String(agora.getSeconds()).padStart(2, '0');
    return `${horas}:${minutos}:${segundos}`;
}


let faceDetector;
let video;

async function initSurveillance() {
    await tf.setBackend('webgl');
    await tf.ready();
    
    video = document.getElementById("video");

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });//pra pedir permissão pra usar a camara e o micro
    video.srcObject = stream;
    await video.play();

    while (video.videoWidth === 0) {//espera q o video esteja pronto
        await new Promise(requestAnimationFrame);
    }

    faceDetector = await ml5.faceMesh(video, {
        flipped: true,
        detectionConfidence: 0.3,
        runContinuously: true,
    });

    rageClick();
    detectLoop();
}

initSurveillance();


let faceDetetadaAntes = false;
let currentKP = null;

let totalFrames = 0;
let statsEmocoes = { "Feliz": 0, "Neutro": 0, "Duvidoso": 0 };
let ultimaEmocao = "Neutro";
let numFaceLost = 0;

let numPiscares = 0;
let aPiscar = false;
const limiteFechado = 0.24;
const limiteAberto = 0.27;

let numDistracoes = 0;
let direcaoCabecaAtual = "Middle";
let ultimoTimestampDistracao = 0;

let gazeDirection = "Centro";
let lastGazeLog = 0;

async function detectLoop() {
    const faces = await faceDetector.detect(video);
    const faceDetetadaAgora = (faces && faces.length > 0);//boolean pra saber se ta a detetar uma cara
    const tempo = getTime();

    if (faceDetetadaAgora && !faceDetetadaAntes) {//detetor de quando a cara aparece e desaparece para aparecer no log
        addLog(`[${tempo}] SUBJECTS FACE FOUND`);
        faceDetetadaAntes = true;
    } else if (!faceDetetadaAgora && faceDetetadaAntes) {
        numFaceLost++;
        addLog(`[${tempo}] SUBJECTS FACE LOST`);
        faceDetetadaAntes = false;
        currentKP = null;
    }

    if (faceDetetadaAgora) {
        const kp = faces[0].keypoints;//apanha os pontos da primeira cara q detetou
        currentKP = kp;
        const tempo = getTime();

        let emocaoConfirmada = detetarEmocaoSimples(kp);

        statsEmocoes[emocaoConfirmada]++;//adiciona ao contador das emoções pra se saber em quantos frames cada emoçao teve
        totalFrames++;//serve pra depois calcular a percentagem das emoções

        //mudar de emoção
        if (emocaoConfirmada !== ultimaEmocao) {
            addLog(`[${tempo}] CHANGE: ${emocaoConfirmada} state`);
            ultimaEmocao = emocaoConfirmada;
        }

        //piscar
        const pTop = kp[159];//pontos do olho direito
        const pBottom = kp[145];
        const pLeft = kp[33];
        const pRight = kp[133];
        const ratio = Math.hypot(pTop.x - pBottom.x, pTop.y - pBottom.y) / Math.hypot(pLeft.x - pRight.x, pLeft.y - pRight.y);//ratio em q quanto mais fechado tiver o olho fica mais pequeno

        if (ratio < limiteFechado && !aPiscar) {
            aPiscar = true;
            numPiscares++;
            addLog(`[${tempo}] BLINK DETECTED (Total: ${numPiscares})`);
        } else if (ratio > limiteAberto) {
            aPiscar = false;
        }

        //direção cabeça
        let direcao = detetarDirecaoCabeca(kp);
        let agora = Date.now();

        if (direcao !== "Middle" && direcao !== direcaoCabecaAtual) {
            if (agora - ultimoTimestampDistracao > 1500) {//para não spamar o log
                numDistracoes++;
                addLog(`[${tempo}] DISTRACTION: ${direcao}`);

                direcaoCabecaAtual = direcao;
                ultimoTimestampDistracao = agora;
            }
        } else if (direcao === "Middle") {
            direcaoCabecaAtual = "Middle";
        }
    }
    updateLog();
    requestAnimationFrame(detectLoop);//pra estar sempre a correr
}


let liveLogs = [];

const areaTexto = document.getElementById('log-text-container');
const logViewer = document.getElementById('log-viewer-app');
const title = logViewer.querySelector('.window-title');

function addLog(msg) {
    liveLogs.unshift(msg);//adiciona no inicio do array
    if (liveLogs.length > 50) {
        liveLogs.pop();//remove a mais antiga pra não ficar lento
    }

    if (logViewer.style.display === 'flex' && title.innerText.includes('analysis.txt')) {//se está aberto e tem aquilo no titulo
        areaTexto.innerText = generateLogContent();
    }
}

function generateLogContent() {
    let aDetetar;
    if (faceDetetadaAntes === true) {
        aDetetar = "TRACKING";
    } else {
        aDetetar = "LOST";
    }

    let header = "--- PERCEPTA FACE-MONITORING SUBJECT:4267 ---\n";
    header += `STATUS: ${aDetetar} | FACE LOST COUNT: ${numFaceLost}\n`;

    if (currentKP) {
        let olharX = Math.floor(currentKP[1].x * 2.5);//pega na psoição do nariz para simular pra onde a pessoa ta a olhar
        let olharY = Math.floor(currentKP[1].y * 1.5);

        let felizPerc = ((statsEmocoes["Feliz"] / totalFrames) * 100).toFixed(1);//percentagens das emoçoes
        let neutroPerc = ((statsEmocoes["Neutro"] / totalFrames) * 100).toFixed(1);
        let duvidosoPerc = ((statsEmocoes["Duvidoso"] / totalFrames) * 100).toFixed(1);

        header += `STATS: Happy:${felizPerc}% | Neutral:${neutroPerc}% | Doubtful:${duvidosoPerc}%\n`;
        header += `EYE_BLINKS: ${numPiscares} | DISTRACTIONS: ${numDistracoes} | RAGE CLICKS: ${numRageClicks}\n`;
        header += `EYE TRACKING COORDS: X:${olharX} Y:${olharY}\n`;
    } else {
        header += `SCANNER: SEARCHING FOR SUBJECT'S FACE...\n\n\n`;
    }

    header += "-------------------------------\n\n";

    const body = liveLogs.join('\n');//junta tudo do array e separa-os em linhas diferentes
    return header + body;
}

const areaConteudoLog = document.getElementById('log-viewer-content');

function updateLog() {
    if (logViewer.offsetParent !== null && title.innerText.includes('analysis.txt')) {//só faz se a app tiver visivel
        areaConteudoLog.innerText = generateLogContent();
    }
}

function detetarDirecaoCabeca(kp) {
    const distEsq = Math.abs(kp[1].x - kp[234].x);//distancia do nariz à parte esquerda da cara
    const distDir = Math.abs(kp[454].x - kp[1].x);//distancia do nariz à parte direita da cara
    const ratioHorizontal = distEsq / distDir;

    const distCima = Math.abs(kp[1].y - kp[10].y);//distancia do nariz ao topo da testa
    const distBaixo = Math.abs(kp[152].y - kp[1].y);//distancia do nariz ao queixo
    const ratioVertical = distCima / distBaixo;

    if (ratioHorizontal < 0.6) {
        return "turned to the left";
    }
    if (ratioHorizontal > 1.8) {
        return "turned to the right";
    }
    if (ratioVertical < 0.9) {
        return "looked up";
    }
    if (ratioVertical > 1.9) {
        return "looked down";
    }

    return "Middle";// se mais nada for verdade
}


let contadorFramesEmocao = 0;
let emocaoCandidata = "";

function detetarEmocaoSimples(kp) {
    const distanciaOlhos = Math.hypot(kp[33].x - kp[263].x, kp[33].y - kp[263].y);//ditancia da parte de externa dos olhos que vai ser o ponto de referencia

    const distEsq = Math.abs(kp[55].y - kp[168].y);//ditancia vertical da sobrancelha esquerda ao centro da testa
    const distDir = Math.abs(kp[285].y - kp[168].y);//ditancia vertical da sobrancelha direita ao centro da testa
    const ratioVerticalSobrancelha = ((distEsq + distDir) / 2) / distanciaOlhos;//divide a media das sobrancelhas pela distancia dos olhos para ver o quanto muda

    const aberturaVerticalBoca = Math.hypot(kp[13].x - kp[14].x, kp[13].y - kp[14].y) / distanciaOlhos;//ditancia dos labios em cima e baixo
    const distanciaBoca = Math.hypot(kp[61].x - kp[291].x, kp[61].y - kp[291].y) / distanciaOlhos;//distancia dos cantos da boca
    const alturaCentroBoca = kp[0].y;//altura do lábio de cima
    const alturaCantosBoca = (kp[61].y + kp[291].y) / 2;//altura dos cantos da boca
    const curvaturaSorriso = (alturaCentroBoca - alturaCantosBoca) / distanciaOlhos;//pra ver se os cantos tao mais altos q o centro

    let emocaoDetectadaAgora = "Neutro";

    if (aberturaVerticalBoca > 0.08 || distanciaBoca > 0.59 || curvaturaSorriso > 0.025) {
        emocaoDetectadaAgora = "Feliz";
    } else if (ratioVerticalSobrancelha < 0.088) {
        emocaoDetectadaAgora = "Duvidoso";
    } else if (ratioVerticalSobrancelha > 0.095) {
        emocaoDetectadaAgora = "Neutro";
    }

    if (emocaoDetectadaAgora === emocaoCandidata) {
        contadorFramesEmocao++;
    } else {
        emocaoCandidata = emocaoDetectadaAgora;
        contadorFramesEmocao = 0;
    }

    if (contadorFramesEmocao >= 10) {//so passa a ser outra emocao se ela tiver durante 10 frames seguidos pra evitar erros
        return emocaoCandidata;
    } else {
        return ultimaEmocao || "Neutro";//ou neutro por causa do inicio
    }
}


let listaClicks = [];
const rageThreshold = 5;
const rageRaio = 20;
const rageDuracao = 5000;
let numRageClicks = 0;

function rageClick() {
    document.addEventListener('mousedown', function (click) {
        const now = Date.now();
        const clickAtual = {
            x: click.clientX,//x do click
            y: click.clientY,//y do click
            timestamp: now,//hora do click
        };

        listaClicks = listaClicks.filter(click => now - click.timestamp < rageDuracao);//apaga os q aconteceram a mais tempo

        if (listaClicks.length > 0) {
            const primeiroClick = listaClicks[0];
            const distance = Math.hypot(clickAtual.x - primeiroClick.x, clickAtual.y - primeiroClick.y);//distancia do click atual e do primeiro

            if (distance > rageRaio) {
                listaClicks = [];//se a distancia for maior q o raio atao limpa a lista
            }
        }

        listaClicks.push(clickAtual);//adiciona a lista

        if (listaClicks.length > rageThreshold) {
            RageLog();//manda pro log
            listaClicks = [];
        }
    }, { passive: true });//pra nao cancelar o click
}



function RageLog() {
    numRageClicks++;
    const tempo = getTime();
    addLog(`[${tempo}] RAGE DETECTED: Rage clicked`);
}


function saveReportDaTask(fileName, fileContent, logMessage) {
    staticLogs[fileName] = { type: 'text', content: fileContent };

    const time = getTime();
    addLog(`[${time}] ${logMessage}`);

    renderLogExplorer();
    areaTexto.innerHTML = fileContent;
}

function gerarTask1File() {
    let fileContent = `--- PERCEPTA TASK 1 REPORT ---\n`;
    fileContent += `SUBJECT_ID: 4267 | TASK: HUMAN OR AI\n`;
    fileContent += `----------------------------------\n\n`;

    task1Choices.forEach(res => {
        fileContent += `STEP: ${res.question}\n`;
        fileContent += `ANWSER1: [${res.choice1}] | ANWSER2: [${res.choice2}]\n`;
        fileContent += `TIMESTAMP: ${getTime()}\n`;
        fileContent += `----------------------------------\n`;
    });

    fileContent += `\nEND OF REPORT.`;
    saveReportDaTask("task_01_results.txt", fileContent, "TASK_ENDED: New data written to task_01_results.txt");
}

function gerarTask2File() {
    let fileContent = `--- PERCEPTA TASK 2 REPORT ---\n`;
    fileContent += `SUBJECT_ID: 4267 | TASK: IMAGE REALISM\n`;
    fileContent += `----------------------------------\n\n`;

    task2Choices.forEach(res => {
        fileContent += `STEP: ${res.step}\n`;
        fileContent += `ANWSER: [${res.picked}]\n`;
        fileContent += `TIMESTAMP: ${getTime()}\n`;
        fileContent += `----------------------------------\n`;
    });

    fileContent += `\nEND OF REPORT.`;
    saveReportDaTask("task_02_results.txt", fileContent, "TASK_ENDED: New data written to task_02_results.txt");
}

function gerarTask3File() {
    let fileContent = `--- PERCEPTA TASK 3 REPORT ---\n`;
    fileContent += `SUBJECT_ID: 4267 | TASK: VOICE EMOTION\n`;
    fileContent += `----------------------------------\n\n`;

    task3Choices.forEach((res) => {
        const audioId = `audio_freq_0${res.step}`;
        let evaluationString = "";
        if (res.match) {
            evaluationString = "VERIFIED (STABLE)";
        } else {
            evaluationString = "FAILED (REJECTED)";
        }

        const audioLink = `<a href="#" onclick="verFotoBrowser('${audioId}', '${res.audioURL}'); return false;" style="color: blue; text-decoration: underline; cursor: pointer;">[VIEW_SPECTROGRAM]</a>`;

        fileContent += `STEP: ${res.step} | TARGET: ${res.emotion.toUpperCase()}\n`;
        fileContent += `ANALYSIS: ${evaluationString}\n`;
        fileContent += `AUDIO FILE: ${audioLink}\n`;
        fileContent += `PHRASE: "${res.phrase}"\n`;
        fileContent += `TIMESTAMP: ${getTime()}\n`;
        fileContent += `----------------------------------\n`;
    });

    fileContent += `\nEND OF REPORT.`;

    saveReportDaTask("task_03_results.txt", fileContent, "TASK_ENDED: New data written to task_03_results.txt");
}

function gerarTask4File() {
    let fileContent = `--- PERCEPTA TASK 4 REPORT ---\n`;
    fileContent += `SUBJECT_ID: 4267 | TASK: PODY POSE\n`;
    fileContent += `----------------------------------\n\n`;

    task4Choices.forEach((res, index) => {
        const photoId = `photo_0${res.step}`;
        let evaluationString2 = "";
        if (res.match) {
            evaluationString2 = "VERIFIED (MATCH)";
        } else {
            evaluationString2 = "FAILED (MISMATCH)";
        }
        const photoLink = `<a href="#" onclick="verFotoBrowser('${photoId}', '${res.imageURL}'); return false;" style="color: blue; text-decoration: underline; cursor: pointer;">[OPEN_INTERNAL_LINK: ${photoId}]</a>`;

        fileContent += `STEP: ${res.step} | TARGET: ${res.target}\n`;
        fileContent += `ANALYSIS: ${evaluationString2}\n`;
        fileContent += `ACCESS: ${photoLink}\n`;
        fileContent += `TIMESTAMP: ${getTime()}\n`;
        fileContent += `----------------------------------\n`;
    });

    fileContent += `\nEND OF REPORT.`;

    saveReportDaTask("task_04_results.txt", fileContent, "TASK_ENDED: New data written to task_04_results.txt");
}

function gerarTask5File() {
    let fileContent = `--- PERCEPTA TASK 5 REPORT ---\n`;
    fileContent += `SUBJECT_ID: 4267 | TASK: FACIAL EMOTION\n`;
    fileContent += `----------------------------------\n\n`;

    task5Choices.forEach((res) => {
        const photoId = `face_capture_0${res.step}`;
        const emotionName = (res.emotion || "UNKNOWN").toUpperCase();
        let evaluationString3 = "";
        if (res.match) {
            evaluationString3 = "VERIFIED (MATCH)";
        } else {
            evaluationString3 = "FAILED (MISMATCH)";
        }
        const photoLink = `<a href="#" onclick="verFotoBrowser('${photoId}', '${res.imageURL}'); return false;" style="color: blue; text-decoration: underline; cursor: pointer;">[VIEW_FACE_SCAN]</a>`;

        fileContent += `STEP: ${res.step} | DETECTED: ${emotionName}\n`;
        fileContent += `ANALYSIS: ${evaluationString3}\n`;
        fileContent += `PHOTO FILE: ${photoLink}\n`;
        fileContent += `TIMESTAMP: ${getTime()}\n`;
        fileContent += `----------------------------------\n`;
    });

    fileContent += `\nEND OF REPORT.`;

    saveReportDaTask("task_05_results.txt", fileContent, "TASK_ENDED: New data written to task_05_results.txt");
}

function captureCanvasImage() {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const contexto = canvas.getContext('2d');

    contexto.translate(canvas.width, 0);
    contexto.scale(-1, 1);//inverte

    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);//desenha a frame do video no canvas
    return canvas.toDataURL('image/jpeg');
}

function verFotoBrowser(id, img) {
    internetTabs[id] = {
        "title": `photo: ${id}`,
        "hidden": true,
        "content": `
            <div style="display:flex; align-items:center; justify-content:center; height:100%; padding:10px;">
                <img src="${img}" style="max-width:100%; max-height:100%; object-fit:contain;">
            </div>
        `
    };
    openBrowserApp();
    openLink(id);
}

function renderLogExplorer() {//é basicamente o mesmo que renderFileExplorer mas sem tantas opções, ta isolado do resto (temos q unir ao fileExplorer na meta de melhoria)
    const fileList = document.getElementById('logs-static-list');
    fileList.innerHTML = '';

    Object.entries(staticLogs).forEach(([name, data]) => {
        const fileDiv = document.createElement('div');

        fileDiv.className = 'file-item';

        if (data.type === 'text') {
            fileDiv.innerHTML = `<img src="media/bloco.png" style="width: 32px; height: 32px; margin-bottom: 5px;"><span>${name}</span>`;
            fileDiv.onclick = (e) => {
                clearExplorerSelection('logs-static-list');
                fileDiv.style.backgroundColor = '#000080';
                fileDiv.style.color = 'white';
                e.stopPropagation();
            };

            fileDiv.ondblclick = () => openSurveillanceLog(name);

            fileDiv.oncontextmenu = (e) => {
                e.preventDefault();
                fileDiv.click();
                const ctxMenu = document.getElementById('context-menu');
                ctxMenu.innerHTML = '<div style="padding: 5px 10px;">Open</div>';
                ctxMenu.querySelector('div').onclick = () => { ctxMenu.style.display = 'none'; openSurveillanceLog(name); };
                positionContextMenu(e, ctxMenu);
            };
        }

        fileList.appendChild(fileDiv);
    });
}


const password = "admin";

async function promptLogPassword() {
    const passwordEmail = listaEmails.find(e => e.id === "password");
    if (passwordEmail.read === false) {
        playPeepsSequence([
            {
                text: "Oh that?",
                face: "down",
                duration: 2000
            },
            {
                text: "Those are just random files the OS needs.",
                face: "happy",
                duration: 4000
            },
            {
                text: "Ignore those.",
                face: "neutral",
                duration: 3000
            },
            {
                text: "Just continue your experience!",
                face: "megaHappy",
                duration: 3000
            }
        ]);
    } else {
        showPeeps("STOP! YOU'RE NOT ALLOWED TO SEE THOSE.", "evil", 5000);
    }
    const input = await osPrompt("Insira a palavra-passe do Administrador para aceder ao log:", "", "Acesso Restrito", "🔒");

    if (input === password) {
        const folder = document.getElementById('folder-logs');
        folder.style.display = 'block';
        showPeeps("YOU WILL REGRET SEEING THEM.", "evil", 5000);
        renderLogExplorer();
    } else {
        await osAlert("Acesso Negado. Tente novamente.", "Erro de Autenticação", "❌");
    }
}


function openSurveillanceLog(fileName = 'analysis.txt') {
    title.innerText = `${fileName}`;
    logViewer.style.display = 'block';

    if (fileName === 'analysis.txt') {
        playPeepsSequence([
            {
                text: "Ugh... you're just trying to make my job harder...",
                face: "angry",
                duration: 3000
            },
            {
                text: "Ok, we are watching...",
                face: "neutral",
                duration: 3000
            },
            {
                text: "always watching...",
                face: "happy",
                duration: 3000
            },
            {
                text: "and..?",
                face: "touch",
                duration: 3000
            },
            {
                text: "but it's just for analytics, dont worry!",
                face: "megaHappy",
                duration: 4000
            }
        ]);
        areaConteudoLog.innerText = generateLogContent();//para não esperar pelo updateLog
    } else {
        areaConteudoLog.innerHTML = staticLogs[fileName]?.content;
    }

    areaConteudoLog.scrollTop = areaConteudoLog.scrollHeight;
    bringToFront(logViewer);
}


let staticLogs = {
    "analysis.txt": { type: 'text' },
};




let timer1 = null;
let timer2 = null;
let timer3 = null;

function TimerdoFinal() {
    if (acabou === false) {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);

        timer1 = setTimeout(() => {
            showPeeps("Hey! I'm wainting for you to continue!", "neutral", 4000);
        }, 70000);
        timer2 = setTimeout(() => {
            showPeeps("Return to doing the tasks now!", "touch", 4000);
        }, 100000);
        timer3 = setTimeout(() => {
            playPeepsSequence([
                {
                    text: "I'm done with you!",
                    face: "evil",
                    duration: 3000
                },
                {
                    text: "If you refuse to do the tasks...fine...",
                    face: "angry",
                    duration: 3000
                },
                {
                    text: "There are plenty more naive people willing to to them.",
                    face: "apprehensive",
                    duration: 3500
                },
                {
                    text: "Goodbye!",
                    face: "touch",
                    duration: 2000
                }
            ]);
            setTimeout(() => {
                document.getElementById('peeps-container').style.display = 'none';
                acabou = true;
                closeWindow('tasks');
            }, 11500);
        }, 150000);
    }
}