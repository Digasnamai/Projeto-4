//Notepad

const notepadTextarea = document.getElementById('notepad-textarea');
let isTextDirty = false;    //o texto tem alterações não guardadas?
let currentTextFile = "untitled";   //nome do ficheiro

//sempre que o jogador alterar conteúdo no notepad
notepadTextarea.addEventListener('input', () => {
    isTextDirty = true;
});

//altera o nome da janela de acordo com o nome do ficheiro
function updateNotepadTitle(fileName) {
    currentTextFile = fileName;
    const titleSpan = document.querySelector('#notepad-app .window-title');
    if (titleSpan) {
        titleSpan.innerHTML = `<img src="media/bloco.png" style="width: 30px; height: 30px; vertical-align: middle;">${currentTextFile} - Notepad`;
    }
}

//força a abertura de um bloco limpo
function forceNewText() {
    const notepadApp = document.getElementById('notepad-app');
    if (!notepadTextarea) return;

    notepadTextarea.value = "";
    isTextDirty = false;
    notepadTextarea.readOnly = false;
    notepadTextarea.disabled = false;
    notepadTextarea.style.backgroundColor = "white";
    notepadTextarea.style.cursor = "text";

    updateNotepadTitle('untitled');
    notepadApp.style.display = 'flex';
    bringToFront(notepadApp);

    setTimeout(() => notepadTextarea.focus(), 10);
}

//opção de novo ficheiro
async function newText() {
    if (isTextDirty) {
        const isSure = await osConfirm("Are you sure you want to clear the document?\nUnsaved work will be lost.", "Notepad");
        if (!isSure) return;
    }
    notepadTextarea.value = '';
    isTextDirty = false;
    updateNotepadTitle('untitled');
}

//guarda o ficheiro de texto usando a função de osSaveAS do ficheiro ui.js
async function saveText() {
    const textContent = notepadTextarea.value;
    let suggestion = currentTextFile === "untitled" ? "my_notes.txt" : currentTextFile;

    const result = await osSaveAs(suggestion);

    if (result) {
        const finalName = result.fileName.endsWith('.txt') ? result.fileName : result.fileName + '.txt';

        let targetFolder = getFolderByPath(result.path);
        targetFolder[finalName] = { type: "text", content: textContent };
        saveVFS();

        isTextDirty = false;
        updateNotepadTitle(finalName);

        await osAlert(`File saved successfully to:\n${result.path}`, "Save Complete", "💾");

        if (currentPath === result.path) renderFileExplorer();

        if (result.path === "C:\\Users\\Participant\\Desktop") renderDesktop();
    }
}

//abrir o ficheiro
function openTextFile(name, content) {
    const txtWindow = document.getElementById('notepad-app');

    if (txtWindow) {
        if (txtWindow.style.display !== 'none' && isTextDirty) {
            osConfirm("Opening a new file will discard unsaved changes.\nContinue?", "Notepad").then(isSure => {
                if (isSure) executeLoadText(name, content);
            });
        } else {
            executeLoadText(name, content);
        }
    } else {
        osAlert(content, name, "📝"); 
    }
}

//carrega texto
function executeLoadText(name, content) {
    notepadTextarea.value = content;
    isTextDirty = false;
    updateNotepadTitle(name);
    openWindow('notepad-app');
}

//fecha o notepad e pede confirmação caso haja alterações não gravadas
async function tryCloseNotepad() {
    if (isTextDirty) {
        const isSure = await osConfirm("Exit without saving?\nAll unsaved work will be lost.", "Exit Notepad");
        if (!isSure) return;
    }
    notepadTextarea.value = '';
    isTextDirty = false;
    updateNotepadTitle('untitled');
    closeWindow('notepad-app');
}


//Paint

const canvas = document.getElementById('paint-canvas');
const ctx = canvas.getContext('2d');
const paintWorkspace = document.getElementById('paint-workspace');

let currentPaintFile = "untitled";

let currentPaintTool = 'brush';
let paintZoomLevel = 1;

let isPanning = false;
let isDrawing = false;
let isCanvasDirty = false;  //caso haja alterações não guardadas
let panStartX, panStartY;
let canvasPosX = 0; 
let canvasPosY = 0; 

//ajusta o titulo da janela de acordo com o nome do ficheiro
function updatePaintTitle(fileName) {
    currentPaintFile = fileName;
    const titleSpan = document.querySelector('#paint-app .window-title');
    if (titleSpan) {
        titleSpan.innerText = `🎨 ${currentPaintFile} - Paint`;
    }
}

//pinta a folha de branco inicialmente
function initCanvas() {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
}

//limpa o canvas
function clearCanvas() {
    initCanvas();
    isCanvasDirty = false;
    updatePaintTitle("untitled");
}

//troca entre o pincel e a borracha
function setPaintTool(tool) {
    currentPaintTool = tool;

    const btnBrush = document.getElementById('tool-brush');
    const btnEraser = document.getElementById('tool-eraser');

    if (tool === 'brush') {
        btnBrush.style.background = '#000080';
        btnBrush.style.color = 'white';
        btnEraser.style.background = '#c0c0c0';
        btnEraser.style.color = 'black';
        canvas.style.cursor = 'crosshair';
    } else { 
        btnEraser.style.background = '#000080';
        btnEraser.style.color = 'white';
        btnBrush.style.background = '#c0c0c0';
        btnBrush.style.color = 'black';
        canvas.style.cursor = 'cell'; 
    }
}

//ajuste de zoom do canvas
function zoomPaint(change) {
    paintZoomLevel += change;

    //limita o zoom entre 50% e 400%
    if (paintZoomLevel < 0.5) paintZoomLevel = 0.5;
    if (paintZoomLevel > 4) paintZoomLevel = 4;

    document.getElementById('zoom-level-display').innerText = Math.round(paintZoomLevel * 100) + '%';

    canvas.style.transform = `scale(${paintZoomLevel})`;
}


//bloqueia desenhar ao usar o botão do meio
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1) e.preventDefault();
});

//ao premir o botão do meio do rato o jogador começa a arrasta o canvas
paintWorkspace.addEventListener('mousedown', (e) => {
    if (e.button === 1) {
        isPanning = true;
        canvas.style.cursor = 'grabbing';
        paintWorkspace.style.cursor = 'grabbing';

        panStartX = e.clientX;
        panStartY = e.clientY;
        e.preventDefault();
    }
});

//arrasta o canvas
paintWorkspace.addEventListener('mousemove', (e) => {
    if (!isPanning) return;

    const dx = e.clientX - panStartX;
    const dy = e.clientY - panStartY;

    canvasPosX += dx;
    canvasPosY += dy;

    canvas.style.left = canvasPosX + 'px';
    canvas.style.top = canvasPosY + 'px';

    panStartX = e.clientX;
    panStartY = e.clientY;
});

//ao levantar o botão do meio ou ao sair da tela, para de arrastar o canvas
paintWorkspace.addEventListener('mouseup', (e) => { if (e.button === 1) stopPanning(); });
paintWorkspace.addEventListener('mouseleave', stopPanning);

//para de arrastar o canvas
function stopPanning() {
    if (isPanning) {
        isPanning = false;
        paintWorkspace.style.cursor = 'auto';
        canvas.style.cursor = currentPaintTool === 'eraser' ? 'cell' : 'crosshair';
    }
}

// Eventos de Desenho (Botão esquerdo do rato)
canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDrawing = true;
    isCanvasDirty = true;
    draw(e);
});

canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', () => { isDrawing = false; ctx.beginPath(); });
canvas.addEventListener('mouseout', () => { isDrawing = false; ctx.beginPath(); });

//função de pintar
function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / paintZoomLevel;
    const y = (e.clientY - rect.top) / paintZoomLevel;

    ctx.lineWidth = document.getElementById('brush-size').value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    //a borracha pinta de branco
    ctx.strokeStyle = currentPaintTool === 'eraser' ? "white" : document.getElementById('brush-color').value;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

//limpar o canvas
async function newDrawing() {
    if (isCanvasDirty) {
        const isSure = await osConfirm("Are you sure you want to clear the canvas?\nUnsaved work will be lost.", "Paint");
        if (!isSure) return;
    }
    clearCanvas();
}

//guardar um desenho
async function saveDrawing() {
    const dataURL = canvas.toDataURL('image/png'); //converte a imagem em dados Base64
    const suggestion = currentPaintFile === "untitled" ? "my_art.png" : currentPaintFile;
    const result = await osSaveAs(suggestion);

    if (result) {
        const finalName = result.fileName.endsWith('.png') ? result.fileName : result.fileName + '.png';
        let targetFolder = getFolderByPath(result.path);

        targetFolder[finalName] = { type: "image", content: dataURL };
        saveVFS();

        isCanvasDirty = false;
        updatePaintTitle(finalName);

        await osAlert(`File saved successfully to:\n${result.path}`, "Save Complete", "💾");
        if (currentPath === result.path) renderFileExplorer();
        if (result.path === "C:\\Users\\Participant\\Desktop") renderDesktop();
    }
}

//abrir uma imagem 
function loadDrawing(dataURL, name) {
    if (document.getElementById('paint-app').style.display !== 'none' && isCanvasDirty) {
        osConfirm("Opening a new file will discard unsaved changes.\nContinue?", "Paint").then(isSure => {
            if (isSure) executeLoad(dataURL, name);
        });
    } else {
        executeLoad(dataURL, name);
    }
}

//carrega uma imagem
function executeLoad(dataURL, name) {
    openWindow('paint-app');
    const img = new Image();
    img.onload = function () {
        ctx.drawImage(img, 0, 0);
        isCanvasDirty = false;
        updatePaintTitle(name);
    };
    img.src = dataURL;
}

//fechar a aplicação verifica se o desenho atual tem alterações, se sim confirma com o utilizador para fechar
async function tryClosePaint() {
    if (isCanvasDirty) {
        const isSure = await osConfirm("Exit without saving?\nAll unsaved work will be lost.", "Exit Paint");
        if (!isSure) return;
    }
    clearCanvas();
    closeWindow('paint-app');
}
