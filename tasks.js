//dados de cada task num array para editarmos facilmente
const aitTasksData = [
    {
        id: "human_ai",
        instruction: 'Does this response appear <span class="text-blue">HUMAN</span> or <span class="text-red">ARTIFICIAL</span>?',
        steps: [
            { question: "Does spring come after summer?", res1: "No.", res2: "Yes, it's a trick question" },
            { question: "How do you feel about the rain?", res1: "I do not have feelings or personal preferences, but rain is essential for Earth's ecosystem and agriculture.", res2: "Honestly, I love it when I'm inside with some tea, but I absolutely hate it if I forget my umbrella." },
            { question: "What is the meaning of life?", res1: "42.", res2: "The meaning of life is a philosophical question concerning the significance of living or existence in general." }
        ]
    },
    {
        id: "image_pick",
        instruction: 'Which of these images looks more <span class="text-blue">real</span>?',
        steps: [
            { images: ["media/task2/task2.1.1.png", "media/task2/task2.1.2.png", "media/task2/task2.1.3.png"], labels: ["Tree A", "Tree B", "Tree C"] },
            { images: ["media/task2/task2.2.1.png", "media/task2/task2.2.2.png", "media/task2/task2.2.3.png"], labels: ["Cat A", "Cat B", "Cat C"] },
            { images: ["media/task2/task2.3.1.png", "media/task2/task2.3.2.png", "media/task2/task2.3.3.png"], labels: ["Person A", "Person B", "Person C"] }
        ]
    },
    {
        id: "emotion",
        instruction: 'Read the following phrase with the given emotion',
        steps: [
            { emotion: "sad", phrase: "I lost my wallet at the park." },
            { emotion: "happy", phrase: "I just found a 20 dollar bill!" },
            { emotion: "angry", phrase: "Who ate my sandwich? I had my name on it." }
        ]
    },
    {
        id: "pose",
        instruction: 'Physical Compliance Test: <span class="text-blue">Replicate the pose</span>',
        steps: [
            { target: "right_arm", phrase: "Raise your RIGHT arm.", image: "media/right.png" },
            { target: "left_arm", phrase: "Raise your LEFT arm.", image: "media/left.png" },
            { target: "both_arms", phrase: "Raise BOTH arms above your head.", image: "media/handsup.png" },
            { target: "hands_head", phrase: "Place both hands on the sides of your head.", image: "media/handshead.png" }
        ]
    },
    {
        id: "face",
        instruction: 'Hold the given expression',
        steps: [
            { target: "happy", phrase: "Smile brightly.", image: "media/sorridente.png" },
            { target: "angry", phrase: "Show a face of pure anger.", image: "media/zangado.png" },
            { target: "sad", phrase: "Display a deep sadness.", image: "media/triste.png" }
        ]
    }
];

//variáveis de controlo de progresso
let currentTaskGroup = 0; // em que task estamos
let currentTaskStep = 0; //em que passo da task estamos
let isAITOnCooldown = false; //boolena do intevalo entre tasks

//variáveis de armazenamento dos resultados
let task1Choices = [];
let task2Choices = [];
let task3Choices = [];
let task4Choices = [];
let task5Choices = [];

//variáveis dos scanners
let lastCapturedImage = null;
let lastScanSuccess = false;
let lastAudioSpectrogram = "";
let isVisualScanning = false;
let audioClassifier;

//devolde o tempo atual formatado
function getTime() {
    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    const segundos = String(agora.getSeconds()).padStart(2, '0');
    return `${horas}:${minutos}:${segundos}`;
}

//loop de atualização do log
setInterval(() => {
    const logWindow = document.getElementById('log-viewer-app');
    const displayArea = document.getElementById('log-viewer-content');

    if (logWindow.style.display !== 'none') {
        const title = document.getElementById('log-viewer-title').innerText;

        if (title.includes('analysis.txt')) {
            const currentContent = generateLogContent();

            if (displayArea.innerHTML !== currentContent) {
                const isAtBottom = displayArea.scrollHeight - displayArea.clientHeight <= displayArea.scrollTop + 50;
                displayArea.innerHTML = currentContent;

                if (isAtBottom) {
                    displayArea.scrollTop = displayArea.scrollHeight;
                }
            }
        }
    }
}, 500);

//cooldown entre tasks para que o utilizador explore o ambiente de trabalho
function startAITCooldown() {
    isAITOnCooldown = true;
    closeWindow('tasks');
    showPeeps("Great job! Let's take a short break and relax for a bit.", "happy", 6000);

    setTimeout(() => {
        isAITOnCooldown = false;
        if (currentTaskGroup < aitTasksData.length) {
            showPeeps("Break is over! Time for the next task.", "neutral", 5000);
            renderCurrentTask();
            openWindow('tasks');
        }
    }, 40000);
}

//chamado quando o jogador clica em next nas tasks
function nextTask() {
    const group = aitTasksData[currentTaskGroup];
    TimerdoFinal(); //reinicia o timer de inatividade

    //guardar dados dependendo do tipo de task
    if (group.id === "human_ai") {
        const stepData = group.steps[currentTaskStep];
        const buttons = document.querySelectorAll('.toggle-btn');
        task1Choices.push({
            step: currentTaskStep + 1,
            question: stepData.question,
            choice1: buttons[0].innerText,
            choice2: buttons[1].innerText,
            timestamp: getTime()
        });

        //se for a ultima pergunta desta tarefa gera o relatório e envia um e-mail passados 2s
        if (currentTaskStep === group.steps.length - 1) {
            gerarTask1File();
            setTimeout(() => triggerNewEmail("news_layoffs"), 2000);
        }
    }
    else if (group.id === "image_pick") {
        const selectedBtn = document.querySelector('.selected-pick');
        const pickedLabel = selectedBtn.parentElement.querySelector('span').innerText;
        task2Choices.push({
            step: currentTaskStep + 1,
            picked: pickedLabel,
            timestamp: getTime()
        });

        if (currentTaskStep === group.steps.length - 1) {
            gerarTask2File();
            setTimeout(() => triggerNewEmail("news_eco"), 2000);
        }
    }
    else if (group.id === "emotion") {
        const stepData = group.steps[currentTaskStep];
        task3Choices.push({
            step: currentTaskStep + 1,
            emotion: stepData.emotion,
            phrase: stepData.phrase,
            status: "Voice Analysis Complete",
            match: lastScanSuccess,
            audioURL: lastAudioSpectrogram,
            timestamp: getTime()
        });

        if (currentTaskStep === group.steps.length - 1) {
            gerarTask3File();
            setTimeout(() => triggerNewEmail("news_security"), 2000);
        }
    }
    else if (group.id === "pose") {
        const stepData = group.steps[currentTaskStep];
        task4Choices.push({
            step: currentTaskStep + 1,
            target: stepData.target,
            imageURL: lastCapturedImage,
            timestamp: getTime(),
            match: lastScanSuccess
        });

        if (currentTaskStep === group.steps.length - 1) {
            gerarTask4File();
            setTimeout(() => triggerNewEmail("password"), 2000);
        }
    }
    else if (group.id === "face") {
        const stepData = group.steps[currentTaskStep];
        task5Choices.push({
            step: currentTaskStep + 1,
            target: stepData.target,
            imageURL: lastCapturedImage,
            timestamp: getTime(),
            match: lastScanSuccess
        });

        if (currentTaskStep === group.steps.length - 1) {
            gerarTask5File();
        }
    }

    //avança o passo na task
    currentTaskStep++;

    //avanço de passo ou task
    if (currentTaskStep >= group.steps.length) {
        currentTaskStep = 0; //volta ao passo 0
        currentTaskGroup++; //próxima task

        //se não houver tasks
        if (currentTaskGroup >= aitTasksData.length) {
            finishTaskSequence();
            setTimeout(async () => {
                await playPeepsSequence([
                    { text: "You finished every task!", face: "megaHappy", duration: 3000 },
                    { text: "Thank you for helping us achieve our goals.", face: "happy", duration: 4000 },
                    { text: "My job here is done!", face: "neutral", duration: 3000 },
                    { text: "Have a great rest of your life!", face: "megaHappy", duration: 4000 }
                ]);
                acabou = true; //desliga o Peeps permanentemente
                document.getElementById('peeps-container').style.display = 'none';
            }, 3000);
            setTimeout(() => triggerNewEmail("finale"), 1000);
        } else {
            //se ainda houver tarefas inicia o intervalo de descanso
            startAITCooldown();
        }
    } else {
        //se ainda estamos dentro da mesma tarefa passa à próxima pergunta
        renderCurrentTask();
    }
}

//adiciona cada task ao html dependendo do tipo
function renderCurrentTask() {
    const contentArea = document.getElementById('ait-content-area');

    if (currentTaskGroup >= aitTasksData.length) {
        finishTaskSequence();
        return;
    }

    const group = aitTasksData[currentTaskGroup];
    const stepData = group.steps[currentTaskStep];

    //dialogo inicial de cada task
    if (currentTaskStep === 0) {
        if (group.id === "human_ai") {
            playPeepsSequence([
                { text: "You are being presented with two sentences.", face: "side", duration: 4000 },
                { text: "Your job is to determine whether each of them was written by a human or by artificial intelligence.", face: "neutral", duration: 6000 },
                { text: "Click on the button under the sentences to answer, and then click next to continue the task!", face: "happy", duration: 5000 }
            ]);
        } else if (group.id === "image_pick") {
            playPeepsSequence([
                { text: "A set of images will be presented and you must choose the image that best resembles reality.", face: "neutral", duration: 6000 },
                { text: "You can choose the according image by clicking the button under it that says 'pick'.", face: "happy", duration: 5000 },
                { text: "Be honest and careful on your answers!", face: "megaHappy", duration: 4000 }
            ]);
        } else if (group.id === "emotion") {
            playPeepsSequence([
                { text: "Using the microphone, your job is to say the phrases on the screen according to the emotions indicated.", face: "neutral", duration: 6000 },
                { text: "When you are ready click on 'Record'.", face: "happy", duration: 4000 },
                { text: "Try your best and concentrate! We are watching.", face: "megaHappy", duration: 4000 }
            ]);
        } else if (group.id === "pose") {
            playPeepsSequence([
                { text: "You are now required to use your body!", face: "megaHappy", duration: 4000 },
                { text: "Distance yourself a bit from the computer, and imitate the poses provided.", face: "happy", duration: 5000 }
            ]);
        } else if (group.id === "face") {
            playPeepsSequence([
                { text: "We are now analyzing your face!", face: "happy", duration: 4000 },
                { text: "Using the camera, you must imitate the indicated expressions.", face: "side", duration: 5000 },
                { text: "Once you do the correct expression, a new one will be provided!", face: "happy", duration: 5000 }
            ]);
        }
    }

    let innerHTML = '';

    //layout de cada task (os blocos de HTML são gerados dependente do tipo de tarefa)
    //HTML da task 1
    if (group.id === "human_ai") {
        innerHTML = `
            <h3 class="task-title">${group.instruction}</h3>
            <p class="task-question">${stepData.question}</p>
            <div class="task-options-row" style="align-items: stretch;">
                <div class="task-option" style="display: flex; flex-direction: column;">
                    <img src="https://win98icons.alexmeub.com/icons/png/user_computer-0.png" alt="User">
                    <p>Response 1</p>
                    <hr style="width: 100%;">
                    <p style="font-style: italic; flex-grow: 1;">"${stepData.res1}"</p>
                    <button class="btn-retro toggle-btn" data-state="none" onclick="toggleHumanAI(this)" style="margin-top: auto; width: 100%; height: 30px; font-weight: bold;">UNKNOWN</button>
                </div>
                <div class="task-option" style="display: flex; flex-direction: column;">
                    <img src="https://win98icons.alexmeub.com/icons/png/user_computer-0.png" alt="User">
                    <p>Response 2</p>
                    <hr style="width: 100%;">
                    <p style="font-style: italic; flex-grow: 1;">"${stepData.res2}"</p>
                    <button class="btn-retro toggle-btn" data-state="none" onclick="toggleHumanAI(this)" style="margin-top: auto; width: 100%; height: 30px; font-weight: bold;">UNKNOWN</button>
                </div>
            </div>
            <button class="next-btn" onclick="nextTask()" disabled style="margin-top: 25px; margin-bottom: 5px; flex-shrink: 0;">Next ></button>
        `;
    }
    //HTML da task 2
    else if (group.id === "image_pick") {
        let optionsHTML = '';
        for (let i = 0; i < stepData.images.length; i++) {
            optionsHTML += `
                <div class="task-option" style="display: flex; flex-direction: column; align-items: center; width: 30%;">
                    <div class="img-container" style="border: 2px inset #fff; background: #000; width: 100%; height: 120px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                        <img src="${stepData.images[i]}" alt="${stepData.labels[i]}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                    </div>
                    <span style="font-size: 10px; margin-top: 5px; color: #444;">${stepData.labels[i]}</span>
                    <button class="btn-blue" onclick="selectOption(this)" style="margin-top: 10px; width: 100%;">Pick</button>
                </div>
            `;
        }

        innerHTML = `
            <h3 class="task-title">${group.instruction}</h3>
            <div class="task-options-row" style="align-items: stretch;">
                ${optionsHTML}
            </div>
            <button class="next-btn" onclick="nextTask()" disabled style="margin-top: 25px; margin-bottom: 5px; flex-shrink: 0;">Next ></button>
        `;
    }
    //HTML da task 3
    else if (group.id === "emotion") {
        innerHTML = `
            <h3 class="task-title">${group.instruction}</h3>
            <p class="emotion-target text-blue">${stepData.emotion}</p>
            <p class="task-phrase">"${stepData.phrase}"</p>
            <div class="camera-input-area">
                <button class="record-btn" onclick="startVoiceScanner(this, '${stepData.emotion}')">📷 Record</button>
                <div class="recording-status"></div>
            </div>
            <button class="next-btn" onclick="nextTask()" disabled style="margin-top: 25px; margin-bottom: 5px; flex-shrink: 0;">Next ></button>
        `;
    }
    //HTML da task 4 e 5
    else if (group.id === "pose" || group.id === "face") {
        let refImage = stepData.image || "https://win98icons.alexmeub.com/icons/png/display_properties-4.png";

        innerHTML = `
            <h3 class="task-title" style="margin-bottom: 5px;">${group.instruction}</h3>
            <p style="margin-bottom: 15px; font-style: italic; font-size: 14px;">"${stepData.phrase}"</p>
            <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 15px; align-items: stretch;">
                <div style="width: 180px; display: flex; flex-direction: column; border: 2px inset #fff; background: #c0c0c0;">
                    <div style="background: red; color: white; padding: 2px 5px; font-weight: bold; font-size: 12px; border-bottom: 2px inset #fff;">Target pose</div>
                    <div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; background: #fff; padding: 5px; min-height: 140px;">
                        <img src="${refImage}" style="max-width: 100%; max-height: 130px;" alt="Reference">
                    </div>
                </div>
                <div style="width: 180px; display: flex; flex-direction: column; border: 2px inset #fff; background: #c0c0c0;">
                    <div style="background: #0080FF; color: white; padding: 2px 5px; font-weight: bold; font-size: 12px; border-bottom: 2px inset #fff;">Camera Input</div>
                    <div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; background: #444; position: relative; min-height: 140px;">
                        <video id="task-video-feed" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); display: none;"></video>
                        <span id="camera-placeholder" style="color: #888; font-size: 12px;">[OFFLINE]</span>
                    </div>
                </div>
            </div>
            <div class="camera-input-area" style="text-align: center;">
                <button class="btn-retro" onclick="startVisualScanner(this, '${group.id}', '${stepData.target}')" style="padding: 5px 15px; font-size: 20px;" title="Initialize Scanner">📷</button>
                <div class="recording-status" style="margin-top: 10px; font-family: monospace; min-height: 20px; font-size: 12px;"></div>
            </div>
            <button class="next-btn" onclick="nextTask()" disabled style="margin-top: auto; margin-bottom: 5px; flex-shrink: 0;">Next ></button>
        `;
    }

    //insere o HTML gerado na Div principal
    contentArea.innerHTML = `
        <div class="task-step active" style="display: flex; flex-direction: column; height: 100%; overflow-y: auto; padding-right: 5px; box-sizing: border-box;">
            ${innerHTML}
        </div>
    `;

    //reutiliza o video do surveillance.js e mostra-o no ecrã da tarefa
    if (group.id === "pose" || group.id === "face") {
        const taskVideoFeed = document.getElementById('task-video-feed');
        const hiddenVideo = document.getElementById('video');

        if (hiddenVideo.srcObject) {
            taskVideoFeed.srcObject = hiddenVideo.srcObject;
            taskVideoFeed.style.display = 'block';
            document.getElementById('camera-placeholder').style.display = 'none';
        }
    }
}

//o ecrã que aparece no fim do jogo
function finishTaskSequence() {
    const contentArea = document.getElementById('ait-content-area');
    contentArea.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <h3>Thank you for your collaboration.</h3>
            <p>Your input is improving our system.</p>
            <button class="btn-blue" onclick="closeWindow('tasks')" style="margin-top: 15px;">Close</button>
        </div>
    `;
}

//toggle entre opções na primeira task
function toggleHumanAI(buttonElement) {
    const currentState = buttonElement.getAttribute('data-state');

    if (currentState === 'none' || currentState === 'ai') {
        buttonElement.setAttribute('data-state', 'human');
        buttonElement.className = 'btn-blue toggle-btn';
        buttonElement.innerText = 'Human';
    } else {
        buttonElement.setAttribute('data-state', 'ai');
        buttonElement.className = 'btn-red toggle-btn';
        buttonElement.innerText = 'Artificial';
    }

    const currentStep = buttonElement.closest('.task-step');
    const allToggles = currentStep.querySelectorAll('.toggle-btn');
    const allClassified = Array.from(allToggles).every(btn => btn.getAttribute('data-state') !== 'none');

    if (allClassified) { //se ambos tiverem um valor
        currentStep.querySelector('.next-btn').removeAttribute('disabled');
    }
}

//seleção de imagens da task 2
function selectOption(buttonElement) {
    const currentStep = buttonElement.closest('.task-step');
    const nextBtn = currentStep.querySelector('.next-btn');
    const allButtons = currentStep.querySelectorAll('.btn-red, .btn-blue');

    //desliga todos os botões primeiro
    allButtons.forEach(btn => {
        btn.style.borderStyle = 'outset';
        btn.style.opacity = '0.4';
        btn.style.outline = 'none';
        btn.classList.remove('selected-pick');
    });

    //acende apenas o que foi clicado
    buttonElement.style.borderStyle = 'inset';
    buttonElement.style.opacity = '1';
    buttonElement.style.outline = '2px solid black';
    buttonElement.classList.add('selected-pick');

    nextBtn.removeAttribute('disabled'); //desbloqueia o Next
}


//scanner da camara da task 4 e 5
async function startVisualScanner(buttonElement, groupID, target) {
    const currentStep = buttonElement.closest('.task-step');
    const statusDiv = currentStep.querySelector('.recording-status');
    const nextBtn = currentStep.querySelector('.next-btn');

    buttonElement.disabled = true;

    const taskVideoFeed = document.getElementById('task-video-feed');
    const hiddenVideo = document.getElementById('video');

    isVisualScanning = true;
    let successFrames = 0; //quantas frames a pessoa esteve a fazer a pose correta?
    let activeScannerModel = null;

    if (hiddenVideo.srcObject) {
        taskVideoFeed.srcObject = hiddenVideo.srcObject;
        taskVideoFeed.style.display = 'block';
        document.getElementById('camera-placeholder').style.display = 'none';
    }

    statusDiv.innerHTML = "<span style='color: #000080;'>Loading...</span>";

    //carrega o modelo do ml5 dependendo da Tarefa
    if (groupID === 'pose') {
        activeScannerModel = await ml5.bodyPose(hiddenVideo);
    } else if (groupID === 'face') {
        activeScannerModel = await ml5.faceMesh(hiddenVideo);
    }

    statusDiv.innerHTML = "🔴 Recording... Please follow the instruction.";

    let startTime = Date.now();

    async function scanLoop() {
        if (!isVisualScanning) return;

        let elapsedTime = Date.now() - startTime;
        let secondsLeft = Math.ceil((2000 - elapsedTime) / 1000); //contagem decrescente de 2s

        if (secondsLeft > 0) {
            buttonElement.innerText = `Recording... ${secondsLeft}s`;
        }

        //se passarem os 2 segundos termina e decide se a pessoa passou 
        if (elapsedTime >= 2000) {
            finishScan(successFrames >= 3);
            return;
        }

        const results = await activeScannerModel.detect(hiddenVideo);
        let passed = false;

        if (results && results.length > 0) {

            //poses
            if (groupID === 'pose') {
                const pose = results[0];

                //procura pontos do corpo e garante que tem confiança neles (> 10%)
                const getPt = (name) => {
                    if (!pose) return null;
                    const camelCase = name.replace(/_([a-z])/g, g => g[1].toUpperCase());

                    let pt = null;
                    if (Array.isArray(pose.keypoints)) {
                        pt = pose.keypoints.find(k => k.name === name || k.name === camelCase);
                    }
                    if (!pt) pt = pose[name] || pose[camelCase];

                    let score;
                    if (pt !== null && pt !== undefined) {
                        if (pt.score !== null && pt.score !== undefined) {
                            score = pt.score;
                        } else if (pt.confidence !== null && pt.confidence !== undefined) {
                            score = pt.confidence;
                        } else {
                            score = 0;
                        }
                    } else {
                        score = 0;
                    }

                    if (pt && score > 0.10 && pt.y > 10) {
                        return pt;
                    } else {
                        return null;
                    }
                };

                //posições do nariz e dos braços
                const nose = getPt('nose');
                const lWrist = getPt('left_wrist'), rWrist = getPt('right_wrist');
                const lElbow = getPt('left_elbow'), rElbow = getPt('right_elbow');

                //se a altura do pulso ou cotovelo for menor que a altura do nariz
                //significa que a pessoa tem o braço levantado acima da cara (o topo do ecrã é Y=0)
                const isLeftUp = nose && ((lWrist && lWrist.y < nose.y) || (lElbow && lElbow.y < nose.y));
                const isRightUp = nose && ((rWrist && rWrist.y < nose.y) || (rElbow && rElbow.y < nose.y));

                if (target === 'right_arm') passed = isRightUp || isLeftUp;
                else if (target === 'left_arm') passed = isLeftUp || isRightUp;
                else if (target === 'both_arms') passed = isLeftUp && isRightUp;
                else if (target === 'hands_head') {
                    //as mãos não estão acima do nariz mas estão próximas dele
                    if (nose && lWrist && rWrist) {
                        passed = (Math.abs(lWrist.y - nose.y) < 150 && Math.abs(rWrist.y - nose.y) < 150);
                    }
                }
            }

            //expresões
            else if (groupID === 'face') {
                const face = results[0];
                const kp = face.keypoints || face;

                if (kp && kp.length > 150) {
                    //calculamos a largura dos olhos para usar como unidade de medida
                    //assim as medições funcionam se estiver perto ou longe da câmara
                    const eyeWidth = Math.hypot(kp[33].x - kp[263].x, kp[33].y - kp[263].y) || 1;
                    //boca
                    const mouthWidth = Math.hypot(kp[61].x - kp[291].x, kp[61].y - kp[291].y) / eyeWidth;
                    const mouthCenterY = kp[0].y;
                    const mouthCornersY = (kp[61].y + kp[291].y) / 2;
                    const smileCurve = (mouthCenterY - mouthCornersY) / eyeWidth;
                    //sobrancelha
                    const leftBrowDist = Math.abs(kp[55].y - kp[168].y);
                    const rightBrowDist = Math.abs(kp[285].y - kp[168].y);
                    const browRatio = ((leftBrowDist + rightBrowDist) / 2) / eyeWidth;

                    if (target === 'happy') {
                        if (smileCurve > 0.025 || mouthWidth > 0.55) passed = true;
                    }
                    else if (target === 'angry') {
                        if (browRatio < 0.088) passed = true;
                    }
                    else if (target === 'sad') {
                        if (smileCurve < -0.015) passed = true;
                    }
                }
            }
        }

        if (passed) successFrames++;
        setTimeout(() => requestAnimationFrame(scanLoop), 50); //loop
    }

    function finishScan(success) {
        isVisualScanning = false;
        activeScannerModel = null;
        lastScanSuccess = success;

        //tira uma foto
        lastCapturedImage = captureCanvasImage();

        taskVideoFeed.pause();

        const tempo = getTime();

        statusDiv.innerHTML = `<span style="color: black;">Scan Complete. Data logged.</span>`;
        buttonElement.innerText = "Completed";
        buttonElement.style.borderStyle = 'inset';

        //escreve os resultados no log que pode ser consultado mais tarde
        if (success) {
            addLog(`[${tempo}] TASK COMPLIANCE: Valid '${target}' detected.`);
        } else {
            addLog(`[${tempo}] TASK ALERT: Subject failed '${target}' requirement.`);
        }

        updateLog();
        nextBtn.removeAttribute('disabled');
    }

    scanLoop(); //loop
}

//microfone usado na task 3
async function startVoiceScanner(buttonElement, targetEmotion) {
    const currentStep = buttonElement.closest('.task-step');
    const statusDiv = currentStep.querySelector('.recording-status');
    const nextBtn = currentStep.querySelector('.next-btn');

    buttonElement.disabled = true;
    statusDiv.innerHTML = "🎤 <span style='color: #000080;'>Initializing...</span>";

    if (!audioClassifier) {
        const modelPath = window.location.origin + "/modelo_voice/";
        audioClassifier = speechCommands.create("BROWSER_FFT", null, modelPath + "model.json", modelPath + "metadata.json");//é a ligação à IA do teachble machine
        await audioClassifier.ensureModelLoaded();
    }

    const labels = audioClassifier.wordLabels();
    let successFrames = 0;
    let detectedLabelAtEnd = "Neutral";

    statusDiv.innerHTML = "🔴 <span style='color: red;'>Listening...</span>";

    //ouve o som e analisa-o
    await audioClassifier.listen(result => {
        const scores = result.scores;
        //qual é a emoção com maior probabilidade neste momento
        let frameWinnerIndex = scores.indexOf(Math.max(...scores));
        let frameWinnerLabel = labels[frameWinnerIndex];
        let confidence = scores[frameWinnerIndex];

        //se a emoção detetada for igual ao que foi pedido aumenta o numero de success frames
        if (frameWinnerLabel.toLowerCase() === targetEmotion.toLowerCase() && confidence > 0.25) {
            successFrames++;
            detectedLabelAtEnd = frameWinnerLabel;
        }

        lastAudioSpectrogram = createSpectrogramImage(result.spectrogram);
    }, {
        probabilityThreshold: 0.55,
        includeSpectrogram: true,
        overlapFactor: 0.8
    });

    //ouve durante 4.5 segundos e depois para
    setTimeout(async () => {
        const isMatch = successFrames >= 4; //se detetou a emoção certa em pelo menos 4 frames de audio passa

        await audioClassifier.stopListening();
        finishVoiceScan(isMatch, detectedLabelAtEnd, targetEmotion, buttonElement, statusDiv, nextBtn);

    }, 4500);
}

//acaba a gravação do som e envia para o log
function finishVoiceScan(success, detected, target, btn, status, nextBtn) {
    lastScanSuccess = success;

    btn.innerText = "Completed";
    btn.style.borderStyle = 'inset';
    status.innerHTML = "Acoustic signature processed. Biometric data logged.";

    const tempo = getTime();
    const cleanDetected = detected.toString().trim().toUpperCase();
    const cleanTarget = target.toString().trim().toUpperCase();

    if (success) {
        addLog(`[${tempo}] VOICE_MATCH: Detected '${cleanDetected}' (Confidence High).`);
    } else {
        addLog(`[${tempo}] VOICE_DISSENT: Subject failed vocal sync. Expected: '${cleanTarget}', Stability: Low. Last detected: '${cleanDetected}'.`);
    }

    gerarTask3File();
    nextBtn.removeAttribute('disabled');
}

//pega no audio do microfone e desenha as ondas de som num Canvas
//para as transformar numa imagem Base64 que depois enviamos para o folder de analise
function createSpectrogramImage(spectrogram) {
    const data = spectrogram.data;
    const width = spectrogram.frameSize;
    const height = Math.floor(data.length / width);

    if (!width || !height || width <= 0 || height <= 0) {
        return "";
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);

    //converte os dados de som em cor
    for (let i = 0; i < data.length; i++) {
        let val = (data[i] + 100) * 2.55;
        if (val < 0) val = 0;
        if (val > 255) val = 255;
        const index = i * 4;
        imageData.data[index] = 0;
        imageData.data[index + 1] = val / 2;
        imageData.data[index + 2] = val;
        imageData.data[index + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);

    //amplia a imagem um pouco
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = width * 5;
    finalCanvas.height = height * 5;
    const finalCtx = finalCanvas.getContext('2d');
    finalCtx.imageSmoothingEnabled = false;
    finalCtx.drawImage(canvas, 0, 0, finalCanvas.width, finalCanvas.height);

    return finalCanvas.toDataURL();
}
