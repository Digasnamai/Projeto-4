// boot-up sequence

// assim que a página HTML carregue
window.addEventListener('load', () => {
    const bootScreen = document.getElementById('boot-screen');
    const bootMenu = document.getElementById('boot-menu');
    const startBtn = document.getElementById('boot-start-btn');
    const aboutBtn = document.getElementById('boot-about-btn');
    const terminal = document.getElementById('boot-terminal');
    const aboutModal = document.getElementById('boot-about-section');
    const aboutClose = document.getElementById('boot-about-close');

    aboutBtn.onclick = () => { aboutModal.style.display = 'flex'; };
    aboutClose.onclick = () => { aboutModal.style.display = 'none'; };


    //recolha de dados do computador do jogador

    //GPU
    let realGPU = "Generic VGA Graphics Adapter"; //fallback
    const tempCanvas = document.createElement('canvas');
    const gl = tempCanvas.getContext('webgl') || tempCanvas.getContext('experimental-webgl');
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) realGPU = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

    //velocidade da internet
    const realNetwork = navigator.connection ? navigator.connection.effectiveType : "Unknown";

    //Sistema operativo
    const ua = navigator.userAgent;
    let realOS = "Unknown OS";
    if (ua.indexOf("Win") !== -1) realOS = "Windows";
    if (ua.indexOf("Mac") !== -1) realOS = "MacOS";
    if (ua.indexOf("Linux") !== -1) realOS = "Linux";
    if (ua.indexOf("Android") !== -1) realOS = "Android";
    if (ua.indexOf("like Mac") !== -1) realOS = "iOS";

    //browser
    let realBrowser = "Unknown Browser";
    let realEngine = "Unknown Engine";
    if (ua.includes("Firefox")) { realBrowser = "Firefox"; realEngine = "Gecko"; }
    else if (ua.includes("OPR") || ua.includes("Opera")) { realBrowser = "Opera"; realEngine = "Blink"; }
    else if (ua.includes("Edg")) { realBrowser = "Edge"; realEngine = "Blink"; }
    else if (ua.includes("Chrome")) { realBrowser = "Chrome"; realEngine = "Blink"; }
    else if (ua.includes("Safari")) { realBrowser = "Safari"; realEngine = "WebKit"; }


    //sequência de texto que aparece ao premir boot up
    const bootSequence = [
        navigator.userAgent,
        new Date().toUTCString(),
        " ",
        "Version: 3.1.1",
        "Cache Version: 26/04/17,17:34:19",
        " ",
        `CPU: ${navigator.hardwareConcurrency || 8} cores`,
        `GPU: ${realGPU}`,
        `Memory: ${navigator.deviceMemory || 8} GB`,
        `Network: ±${realNetwork}`,
        `Languages: ${navigator.languages ? navigator.languages.join(',') : 'en-GB,en,en-US,pt-PT'}`,
        `OS: ${realOS}`,
        `Browser: ${realBrowser.toLowerCase()}`,
        `Engine: ${realEngine.toLowerCase()}`,
        " ",
        "Initializing AIT-Handler Service v.1.1 (Peeps)...",
        "Loading Percepta Desktop Environment...",
        " ",
        "SYSTEM IS READY.",
        "WELCOME, PARTICIPANT 4267."
    ];

    // ao premir boot up
    startBtn.onclick = () => {
        bootMenu.style.display = 'none'; //esconde o menu
        terminal.style.display = 'block'; //dá display ao ecrâ de texto

        let currentLine = 0;

        printNextLine(); //chama a função

        //escreva uma linha de cada vez
        function printNextLine() {
            if (currentLine < bootSequence.length) {
                let textLine = bootSequence[currentLine];

                terminal.innerHTML += textLine + "\n"; //adiciona a linha ao ecrã
                currentLine++; //linha seguinte

                let delay = 40; //delay default

                //delay's especiais para simular o computador a processar
                if (textLine.includes('Initializing') || textLine.includes('Loading')) delay = 800;
                if (textLine === "SYSTEM IS READY.") delay = 1200;
                if (textLine.trim() === "") delay = 200;

                setTimeout(printNextLine, delay); //volta chamar a função
            } else {
                finishBootSequence(); //fim da sequência
            }
        }
    };

    function finishBootSequence() {
        setTimeout(() => {
            bootScreen.style.display = 'none'; //esconde o boot up screen

            playIntro(); //começa a intro do peeps
        }, 2000); //fica parado na última linha de "WELCOME, PARTICIPANT." por 2 segundos
    }
});
