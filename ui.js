
let highestZIndex = 10;
let aitJaFoiAberto = false;

function openWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;

    // Gestão de restrições da aplicação principal AIT
    if (id === 'tasks') {
        if (acabou) return;

        if (!isIntroFinished) {
            showPeeps("Patience! Please wait for me to finish my introduction.", "apprehensive", 3000);
            return;
        }

        if (isAITOnCooldown) {
            showPeeps("Take a rest and relax for a bit!", "happy", 4000);
            return;
        }
    }

    // Tocar som de abertura se a janela estiver a abrir pela primeira vez
    if (win.style.display === 'none' && id === 'tasks') {
        playSound(soundTask);
    }

win.classList.remove('minimized');

    // Lógica específica para a aplicação de desenho
    if (id === 'paint-app' && win.style.display === 'none') {
        if (!currentPaintFile) clearCanvas();

        // O Peeps comenta baseado no estado da aplicação de tarefas
        const aitVisible = document.getElementById('tasks')?.style.display !== 'none';
        
        if (aitVisible) {
            showPeeps("Are you sure you should be drawing right now? There's still tasks to do...", "apprehensive");
        } else {
            showPeeps("Express your creativity! We love seeing what you draw.", "happy", 4000);
        }
    }

    // Lógica específica para a aplicação AIT
    if (id === 'tasks') {
        if (win.style.display === 'none') renderCurrentTask();

        if (!aitJaFoiAberto) {
            aitJaFoiAberto = true;
            setTimeout(() => triggerNewEmail("dont_trust"), 1000);
        }
    }

    // Comandos finais de exibição
    win.style.display = 'flex';
    updateTaskbar();
    bringToFront(win);
}

// Função para fechar
function closeWindow(id) {
    const win = document.getElementById(id);
    if (win) {
        win.classList.remove('minimized'); 
        win.style.display = 'none';       
        updateTaskbar();
    }
}

// Função para minimizar
function minimizeWindow(id) {
    const win = document.getElementById(id);
    if (win) {
        win.classList.add('minimized');
        win.style.display = 'none'; 
        updateTaskbar(); 
    }
}

 // Posiciona o menu de contexto dentro dos limites do ecrã CRT
function positionContextMenu(e, ctxMenu) {
    ctxMenu.style.display = 'block';
    const crt = document.getElementById('crt-container');
    const crtRect = crt.getBoundingClientRect();

    // Coordenadas relativas ao ecrã CRT
    let relX = e.clientX - crtRect.left;
    let relY = e.clientY - crtRect.top;

    // Ajuste para o menu não sair pela direita
    if (relX + ctxMenu.offsetWidth > crtRect.width) {
        relX -= ctxMenu.offsetWidth;
    }

    // Ajuste para o menu não sair por baixo ou por cima
    let menuTop = relY;
    if (relY + ctxMenu.offsetHeight > crtRect.height) {
        menuTop = relY - ctxMenu.offsetHeight;
    }
    
    // Garante que não fica com valor negativo (fora do topo)
    if (menuTop < 0) menuTop = 0;

    ctxMenu.style.left = relX + 'px';
    ctxMenu.style.top = menuTop + 'px';
    ctxMenu.style.zIndex = 100000;
}

function bringToFront(element) {
    highestZIndex++;
    element.style.zIndex = highestZIndex;
}


 //Gere o arraste das janelas dentro do contentor CRT
function dragWindow(e, id) {
    const win = document.getElementById(id);
    if (!win) return;

    bringToFront(win);

    const crtRect = document.getElementById('crt-container').getBoundingClientRect();
    const winRect = win.getBoundingClientRect();

    // Calcula o offset inicial do clique dentro da janela
    const shiftX = e.clientX - winRect.left;
    const shiftY = e.clientY - winRect.top;

    function onMouseMove(event) {
        // Remove seleção de texto durante o arraste para evitar glitch
        window.getSelection().removeAllRanges();

        // Atualiza a posiçao relativa ao ecrã CRT
        win.style.left = (event.clientX - crtRect.left - shiftX) + 'px';
        win.style.top = (event.clientY - crtRect.top - shiftY) + 'px';
    }

    document.addEventListener('mousemove', onMouseMove);

    // Remove os eventos ao soltar o clique
    document.onmouseup = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.onmouseup = null;
    };
}

document.querySelectorAll('.window').forEach(win => {
    win.addEventListener('mousedown', () => bringToFront(win));
});


//Mantém o relógio da barra de tarefas atualizado 
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12; // Simplificação para garantir que 0h torna se 12h
    minutes = minutes.toString().padStart(2, '0'); // adicionar o zero à esquerda

    const clockEl = document.getElementById('taskbar-clock');
    if (clockEl) clockEl.innerText = `${hours}:${minutes} ${ampm}`;
}
setInterval(updateClock, 1000);
updateClock();


function toggleStartMenu() {
    const menu = document.getElementById('start-menu');
    menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
}

document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});

document.addEventListener('mousedown', (e) => {
    const startMenu = document.getElementById('start-menu');
    const startBtn = document.getElementById('start-btn');
    const ctxMenu = document.getElementById('context-menu');

    if (startMenu.style.display !== 'none' && !startMenu.contains(e.target) && !startBtn.contains(e.target)) {
        startMenu.style.display = 'none';
    }

    if (ctxMenu.style.display !== 'none' && !ctxMenu.contains(e.target)) {
        ctxMenu.style.display = 'none';
    }
});

function resetWindowSize(win) {
    win.style.width = ''; 
    win.style.height = ''; 

    if (win.id === 'notepad-app') {
        win.style.width = '400px';
        win.style.height = '300px';
    } else if (win.id === 'paint-app' || win.id === 'file-explorer') {
        win.style.width = '450px';
        win.style.height = '400px';
    } else if (win.id === 'tasks') {
        win.style.width = '500px';
    } else if (win.id === 'txt-log') {
        win.style.width = '350px';
    }
}


// Atualiza os botões da barra de tarefas com base nas janelas abertas/minimizadas
function updateTaskbar() {
    const container = document.getElementById('taskbar-apps');
    if (!container) return;
    container.innerHTML = ''; 

    document.querySelectorAll('.window').forEach(win => {
        const isOpen = win.style.display !== 'none' || win.classList.contains('minimized');
        const isDialog = ['percepta-dialog', 'save-as-dialog'].includes(win.id);

        if (isOpen && !isDialog) {
            const btn = document.createElement('button');
            btn.className = 'taskbar-app-btn';
            btn.innerHTML = win.querySelector('.window-title').innerHTML;

            // Define botão como ativo se a janela estiver no topo e não minimizada
            if (win.style.zIndex == highestZIndex && !win.classList.contains('minimized')) {
                btn.classList.add('active');
            }

            btn.onclick = () => {
                if (win.classList.contains('minimized')) {
                    win.classList.remove('minimized');
                    win.style.display = 'flex'; 
                    bringToFront(win);
                } else if (btn.classList.contains('active')) {
                    minimizeWindow(win.id);
                } else {
                    bringToFront(win);
                }
                updateTaskbar();
            };

            btn.oncontextmenu = (e) => {
                e.preventDefault();
                const ctxMenu = document.getElementById('context-menu');
                ctxMenu.innerHTML = '';

                // Restore/Minimize 
                const optRestore = document.createElement('div');
                optRestore.innerText = win.classList.contains('minimized') ? 'Restore' : 'Minimize';
                optRestore.onclick = () => { ctxMenu.style.display = 'none'; btn.click(); };
                ctxMenu.appendChild(optRestore);

                ctxMenu.appendChild(document.createElement('hr'));

                // Opção Close com verificação de aplicação
                const optClose = document.createElement('div');
                optClose.innerText = 'Close';
                optClose.onclick = () => {
                    ctxMenu.style.display = 'none';
                    if (win.id === 'paint-app') tryClosePaint();
                    else if (win.id === 'notepad-app') tryCloseNotepad();
                    else closeWindow(win.id);
                };
                ctxMenu.appendChild(optClose);

                positionContextMenu(e, ctxMenu);
            };

            container.appendChild(btn);
        }
    });
}

const originalBringToFront = bringToFront;
bringToFront = function (element) {
    originalBringToFront(element);
    updateTaskbar();
};




//Mostra diálogo "Guardar Como" pra navegar em pastas e nomear ficheiros
function osSaveAs(defaultName) {
    return new Promise((resolve) => {
        const dialog = document.getElementById('save-as-dialog');
        const pathDisplay = document.getElementById('save-as-path-display');
        const folderList = document.getElementById('save-as-folder-list');
        const filenameInput = document.getElementById('save-as-filename');
        const btnUp = document.getElementById('save-as-up-btn');
        const btnOk = document.getElementById('save-as-btn-ok');
        const btnCancel = document.getElementById('save-as-btn-cancel');
        const btnCloseX = document.getElementById('save-as-close-x');

        let navPath = "C:\\Users\\Participant\\Documents";
        filenameInput.value = defaultName;

        // Atualiza a lista de pastas
        function renderList() {
            folderList.innerHTML = '';
            pathDisplay.value = navPath;
            
            const folder = getFolderByPath(navPath);
            if (!folder) return;

            Object.entries(folder).forEach(([name, data]) => {
                if (data.type === 'folder') {
                    const item = document.createElement('div');
                    item.className = 'save-as-item'; // Estilo de hover no CSS
                    item.style.cursor = 'pointer';
                    item.style.padding = '2px 5px';
                    item.innerHTML = `📁 ${name}`;

                    // Entra na pasta com double clique
                    item.ondblclick = () => {
                        navPath += "\\" + name;
                        renderList();
                    };
                    folderList.appendChild(item);
                }
            });
        }

        // Sobe um nível no path das pastas
        btnUp.onclick = () => {
            if (navPath === "C:") return;
            navPath = navPath.substring(0, navPath.lastIndexOf('\\')) || "C:";
            renderList();
        };

        // Fecha a janela e devolve o resultado
        function closeAndResolve(result) {
            dialog.style.display = 'none';
            // evita cliques duplicados no futuro
            btnUp.onclick = btnOk.onclick = btnCancel.onclick = btnCloseX.onclick = null;
            resolve(result);
        }

        // Botão Guardar
        btnOk.onclick = () => {
            const name = filenameInput.value.trim();
            if (!name) return osAlert("Introduza um nome para o ficheiro.", "Erro", "❌");
            closeAndResolve({ path: navPath, fileName: name });
        };

        // Botões de Cancelar e Fechar
        btnCancel.onclick = btnCloseX.onclick = () => closeAndResolve(null);

        //Inicialização
        renderList();
        dialog.style.display = 'block';
        bringToFront(dialog);
        filenameInput.focus();
    });
}




//Exibe um diálogo personalizado (Alert,Confirm ou Prompt)
function showDialog({ type, title, message, defaultValue = "", icon = "⚠️" }) {
    return new Promise((resolve) => {
        const dialog = document.getElementById('percepta-dialog');
        const inputEl = document.getElementById('dialog-input');
        const btnCancel = document.getElementById('dialog-btn-cancel');
        const btnOk = document.getElementById('dialog-btn-ok');
        const btnClose = document.getElementById('dialog-btn-close');

        // Configuração de texto e ícone base
        document.getElementById('dialog-title').innerText = title || "Percepta OS";
        document.getElementById('dialog-message').innerText = message;
        document.getElementById('dialog-icon').innerText = icon;

        // Ajusta a interface com base no tipo de diálogo
        if (type === 'prompt') {
            inputEl.style.display = 'block';
            inputEl.value = defaultValue;
            btnCancel.style.display = 'block';
        } 
        else if (type === 'confirm') {
            inputEl.style.display = 'none';
            btnCancel.style.display = 'block';
        } 
        else { 
            inputEl.style.display = 'none';
            btnCancel.style.display = 'none';
        }

        dialog.style.display = 'block';
        bringToFront(dialog);
        if (type === 'prompt') inputEl.focus();

        // Fecha a janela e limpa os eventos
        function closeAndResolve(result) {
            dialog.style.display = 'none';
            btnOk.onclick = btnCancel.onclick = btnClose.onclick = null;
            resolve(result);
        }

        btnOk.onclick = () => {
            if (type === 'prompt') closeAndResolve(inputEl.value);
            else closeAndResolve(true);
        };

        //cancelar e fechar devolvem falso
        btnCancel.onclick = btnClose.onclick = () => closeAndResolve(false);
    });
}

const osAlert = (msg, title = "Information", icon = "ℹ️") => showDialog({ type: 'alert', message: msg, title, icon });
const osConfirm = (msg, title = "Confirm", icon = "❓") => showDialog({ type: 'confirm', message: msg, title, icon });
const osPrompt = (msg, defaultVal = "", title = "Input Required", icon = "📝") => showDialog({ type: 'prompt', message: msg, defaultValue: defaultVal, title, icon });


const gridSize = 100; 

//Encontra as coordenadas livres mais próximas numa grelha para evitar sobreposição de icons
function getNearestFreeSpot(startX, startY) {
    const occupied = new Set();
    
    // Regista as posições de todos os ícones atualmente no desktop
    document.querySelectorAll('.desktop-icon').forEach(i => {
        occupied.add(`${parseInt(i.style.left || 0)},${parseInt(i.style.top || 0)}`);
    });

    const queue = [{ x: startX, y: startY }];
    const visited = new Set([`${startX},${startY}`]);
    const crt = document.getElementById('crt-container');

    while (queue.length > 0) {
        const { x, y } = queue.shift();

        // Se a posição atual não estiver ocupada devolve a
        if (!occupied.has(`${x},${y}`)) return { x, y };

        // Define direções de busca (Cima,Baixo,Direita,Esquerda)
        const directions = [{ dx: 0, dy: -gridSize }, { dx: 0, dy: gridSize }, { dx: gridSize, dy: 0 }, { dx: -gridSize, dy: 0 }];

        for (const d of directions) {
            const nx = x + d.dx;
            const ny = y + d.dy;

            // Verifica se a nova posição está dentro dos limites do ecrã
            if (nx >= 20 && ny >= 20 && nx < crt.clientWidth - gridSize && ny < crt.clientHeight - gridSize) {
                const key = `${nx},${ny}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push({ x: nx, y: ny });
                }
            }
        }
    }
    return { x: startX + gridSize, y: startY + gridSize }; // Fallback de emergência
}



//Move um ficheiro para dentro de uma pasta.
async function handleDropIntoFolder(targetFolderName, draggedFileName) {
    // Impede mover um ficheiro para ele próprio/se o nome for inválido
    if (!draggedFileName || draggedFileName === targetFolderName) return;

    let currentFolder = getFolderByPath(currentPath);
    let targetFolder = currentFolder[targetFolderName].children;

    if (!targetFolder) return;

    // Verifica se já existe um ficheiro com o mesmo nome no destino
    if (targetFolder[draggedFileName]) {
        const isSure = await osConfirm(`A file named "${draggedFileName}" already exists in "${targetFolderName}".\nDo you want to overwrite it?`, "Confirm Move", "⚠️");
        if (!isSure) return;
    }

    // Transfere o ficheiro para o novo destino e remove-o da origem
    targetFolder[draggedFileName] = currentFolder[draggedFileName];
    delete currentFolder[draggedFileName];

    // atualiza
    saveVFS();
    renderFileExplorer();
    renderDesktop(); 
}


// Configura o arraste, seleção e menu de contexto de um icon no desktop
function setupIconDrag(icon, vfsName = null) {
    icon.ondragstart = () => false; // Impede o drag padrão do browser

    // drag
    icon.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return; // Só funciona com o botão esquerdo

        const desktop = document.getElementById('desktop').getBoundingClientRect();
        const iconRect = icon.getBoundingClientRect();
        const shiftX = e.clientX - iconRect.left;
        const shiftY = e.clientY - iconRect.top;

        function onMouseMove(event) {
            // Remove seleção de texto para o movimento ser limpo
            window.getSelection().removeAllRanges();
            
            let x = event.clientX - desktop.left - shiftX;
            let y = event.clientY - desktop.top - shiftY;
            
            // Impede que o ícone saia pelas bordas superiores
            icon.style.left = (x < 0 ? 0 : x) + 'px';
            icon.style.top = (y < 0 ? 0 : y) + 'px';
        }

        document.addEventListener('mousemove', onMouseMove);

        document.onmouseup = function () {
            document.removeEventListener('mousemove', onMouseMove);
            document.onmouseup = null;

            // snap na grelha
            let curX = parseInt(icon.style.left || 0);
            let curY = parseInt(icon.style.top || 0);

            let snapX = Math.round(curX / gridSize) * gridSize + 20;
            let snapY = Math.round(curY / gridSize) * gridSize + 20;

            // colisao
            let overlapping = null;
            document.querySelectorAll('.desktop-icon').forEach(other => {
                if (other !== icon && parseInt(other.style.left) === snapX && parseInt(other.style.top) === snapY) {
                    overlapping = other;
                }
            });

            icon.style.left = snapX + 'px';
            icon.style.top = snapY + 'px';

            const desktopVFS = getFolderByPath("C:\\Users\\Participant\\Desktop");

            // Se cair em cima de outro, move o outro para o lugar livre mais próximo
            if (overlapping) {
                let spot = getNearestFreeSpot(snapX, snapY);
                overlapping.style.left = spot.x + 'px';
                overlapping.style.top = spot.y + 'px';

                let otherName = overlapping.getAttribute('data-vfs-name');
                if (otherName && desktopVFS[otherName]) {
                    desktopVFS[otherName].x = spot.x;
                    desktopVFS[otherName].y = spot.y;
                }
            }

            // Guarda a nova posição do ícone arrastado no VFS
            if (vfsName && desktopVFS[vfsName]) {
                desktopVFS[vfsName].x = snapX;
                desktopVFS[vfsName].y = snapY;
                saveVFS();
            }
        };
    });

    // seleçao
    icon.addEventListener('mousedown', (e) => {
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected-icon'));
        icon.classList.add('selected-icon');
        e.stopPropagation();
    });

    // right click menu de contexto
    if (vfsName) {
        icon.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();

            icon.dispatchEvent(new Event('mousedown')); // Força a seleção do ícone

            const ctxMenu = document.getElementById('context-menu');
            ctxMenu.innerHTML = '';

            const addOption = (text, action) => {
                const opt = document.createElement('div');
                opt.innerText = text;
                opt.onclick = () => { ctxMenu.style.display = 'none'; action(); };
                ctxMenu.appendChild(opt);
            };

            addOption('Open', () => icon.ondblclick());

            const df = getFolderByPath("C:\\Users\\Participant\\Desktop");
            if (df[vfsName] && df[vfsName].type !== 'locked_folder') {
                ctxMenu.appendChild(document.createElement('hr'));
                
                addOption('Copy', () => {
                    vfsClipboard = { action: 'copy', path: "C:\\Users\\Participant\\Desktop", name: vfsName, data: JSON.parse(JSON.stringify(df[vfsName])) };
                });
                
                addOption('Cut', () => {
                    vfsClipboard = { action: 'cut', path: "C:\\Users\\Participant\\Desktop", name: vfsName, data: df[vfsName] };
                });
                
                addOption('Delete', async () => {
                    if (await osConfirm(`Move "${vfsName}" to the Recycle Bin?`, "Confirm Delete", "🗑️")) {
                        moveToTrash("C:\\Users\\Participant\\Desktop", vfsName, df[vfsName]);
                    }
                });
            }
            positionContextMenu(e, ctxMenu);
        };
    }
}

document.querySelectorAll('.desktop-icon').forEach(icon => { setupIconDrag(icon); });


//Menu de contexto do Desktop (right click no fundo)

document.getElementById('desktop').addEventListener('contextmenu', (e) => {
    // Se clicar num icon ou numa janela, não abre o menu do desktop
    if (e.target.closest('.desktop-icon') || e.target.closest('.window')) return;

    e.preventDefault();
    const ctxMenu = document.getElementById('context-menu');
    ctxMenu.innerHTML = '';

    // adicionar opções ao menu
    const addOption = (text, action) => {
        const opt = document.createElement('div');
        opt.innerText = text;
        opt.onclick = () => { ctxMenu.style.display = 'none'; action(); };
        ctxMenu.appendChild(opt);
    };

    // Criar novo documento de Texto
    addOption('New Text Document', async () => {
        let name = await osPrompt("File name:", "New File.txt", "Create Text File", "📝");
        if (!name) return;
        if (!name.endsWith('.txt')) name += '.txt';
        createFileOnDesktop(name, { type: 'text', content: '' }, e.clientX, e.clientY);
    });

    // Criar novo ficheiro de Paint
    addOption('New Paint File', async () => {
        let name = await osPrompt("File name:", "New Drawing.png", "Create Image File", "🎨");
        if (!name) return;
        if (!name.endsWith('.png')) name += '.png';

        // imagem branca por defeito
        const canvas = document.createElement('canvas');
        canvas.width = 400; canvas.height = 300;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "white"; ctx.fillRect(0, 0, 400, 300);

        createFileOnDesktop(name, { type: 'image', content: canvas.toDataURL() }, e.clientX, e.clientY);
    });

    // criar nova pasta
    addOption('New Folder', async () => {
        let name = await osPrompt("Folder name:", "New Folder", "Create Folder", "📁");
        if (name) createFileOnDesktop(name, { type: 'folder', children: {} }, e.clientX, e.clientY);
    });

    // Opção de Colar (se houver coisas no clipboard)
    if (vfsClipboard) {
        ctxMenu.appendChild(document.createElement('hr'));
        addOption('Paste', () => {
            executePaste("C:\\Users\\Participant\\Desktop", e.clientX, e.clientY);
        });
    }

    positionContextMenu(e, ctxMenu);
});

function createFileOnDesktop(name, dataObj, mouseX, mouseY) {
    let desktopFolder = getFolderByPath("C:\\Users\\Participant\\Desktop");
    if (desktopFolder[name]) {
        osAlert("A file with this name already exists.", "Error", "❌");
        return;
    }
    const desktopRect = document.getElementById('desktop').getBoundingClientRect();
    let gridX = Math.round((mouseX - desktopRect.left) / gridSize) * gridSize;
    let gridY = Math.round((mouseY - desktopRect.top) / gridSize) * gridSize;
    let spot = getNearestFreeSpot(gridX || 20, gridY || 20);

    dataObj.x = spot.x; dataObj.y = spot.y;
    desktopFolder[name] = dataObj;
    saveVFS();
    renderDesktop();
}


//Executa a colagem de ficheiros ou pastas do clipboard para um destino
async function executePaste(targetPath, mouseX = null, mouseY = null) {
    if (!vfsClipboard) return;

    let targetFolder = getFolderByPath(targetPath);
    let pastedData = JSON.parse(JSON.stringify(vfsClipboard.data));
    let finalName = vfsClipboard.name;

    // CASO ESPECIAL MOVER NO MESMO DESTINO (cut)
    if (targetPath === vfsClipboard.path && vfsClipboard.action === 'cut') {
        if (targetPath === "C:\\Users\\Participant\\Desktop" && mouseX !== null) {
            const desktopRect = document.getElementById('desktop').getBoundingClientRect();
            let spot = getNearestFreeSpot(
                Math.round((mouseX - desktopRect.left) / gridSize) * gridSize || 20,
                Math.round((mouseY - desktopRect.top) / gridSize) * gridSize || 20
            );
            let source = getFolderByPath(vfsClipboard.path);
            source[vfsClipboard.name].x = spot.x;
            source[vfsClipboard.name].y = spot.y;
            saveVFS();
        }
        vfsClipboard = null;
        renderDesktop(); renderFileExplorer();
        return;
    }

    // renomear (copy no msmo destino)
    if (targetPath === vfsClipboard.path && vfsClipboard.action === 'copy') {
        let baseName = finalName;
        let ext = "";
        let nameParts = finalName.split('.');

        if (nameParts.length > 1 && vfsClipboard.data.type !== 'folder') {
            ext = "." + nameParts.pop();
            baseName = nameParts.join('.');
        }

        finalName = baseName + " - Copy" + ext;
        let counter = 2;
        while (targetFolder[finalName]) {
            finalName = `${baseName} - Copy (${counter})${ext}`;
            counter++;
        }
    }

    // verificar sobreposiçao
    if (targetFolder[finalName]) {
        const isSure = await osConfirm(`A file named "${finalName}" already exists here.\nOverwrite?`, "Confirm", "⚠️");
        if (!isSure) {
            if (vfsClipboard.action === 'cut') vfsClipboard = null;
            renderDesktop(); renderFileExplorer();
            return;
        }
    }

    // posicionamento do desktop
    if (targetPath === "C:\\Users\\Participant\\Desktop") {
        const desktopRect = document.getElementById('desktop').getBoundingClientRect();
        
        // Define as coordenadas iniciais baseadas no clique ou valor padrão
        let startX = mouseX ? Math.round((mouseX - desktopRect.left) / gridSize) * gridSize : 20;
        let startY = mouseY ? Math.round((mouseY - desktopRect.top) / gridSize) * gridSize : 20;
        
        let spot = getNearestFreeSpot(startX || 20, startY || 20);
        pastedData.x = spot.x;
        pastedData.y = spot.y;
    }

    // finalizar
    targetFolder[finalName] = pastedData;

    if (vfsClipboard.action === 'cut') {
        let source = getFolderByPath(vfsClipboard.path);
        delete source[vfsClipboard.name];
        vfsClipboard = null;
    }

    saveVFS();
    renderFileExplorer();
    renderDesktop();
}

//render dos icons com base no vfs
function renderDesktop() {
    const desktop = document.getElementById('desktop');
    // Remove icons antigos para evitar duplicados ao redesenhar
    document.querySelectorAll('.vfs-desktop-icon').forEach(el => el.remove());

    const desktopPath = "C:\\Users\\Participant\\Desktop";
    const desktopFolder = getFolderByPath(desktopPath);
    if (!desktopFolder) return;

    Object.entries(desktopFolder).forEach(([name, data]) => {
        // Se o ficheiro estiver a ser cut não o mostra no desktop
        if (vfsClipboard?.action === 'cut' && vfsClipboard.path === desktopPath && vfsClipboard.name === name) {
            return;
        }

        let iconSrc = "media/bloco.png";
        let action = `openTextFile('${name}', '${data.content}')`;
        let extraStyles = "";

        // Define icon e ação baseada no tipo de ficheiro
        if (data.type === 'image') {
            iconSrc = data.content;
            action = `loadDrawing('${data.content}', '${name}')`;
            extraStyles = "background:white; border:1px solid black; object-fit:contain; box-sizing:border-box;";
        } else if (data.type === 'folder') {
            iconSrc = "media/pasta.png";
            action = `openWindow('file-explorer'); currentPath = '${desktopPath.replace(/\\/g, '\\\\')}\\\\${name}'; renderFileExplorer();`;
        } else if (data.type === 'locked_folder') {
            iconSrc = "media/pasta lock.png";
            action = `promptLogPassword()`;
        }

        const iconDiv = document.createElement('div');
        iconDiv.className = 'desktop-icon vfs-desktop-icon';
        iconDiv.setAttribute('data-vfs-name', name); 

        // Posicionamento - usa o gravado ou encontra um lugar livre
        let left = data.x, top = data.y;
        if (!left || !top) {
            let spot = getNearestFreeSpot(20, 20);
            left = data.x = spot.x; 
            top = data.y = spot.y; 
            saveVFS();
        }

        iconDiv.style.left = left + 'px';
        iconDiv.style.top = top + 'px';
        iconDiv.ondblclick = new Function(action);
        iconDiv.innerHTML = `<img src="${iconSrc}" alt="${data.type}" style="${extraStyles}"><span>${name}</span>`;

        desktop.appendChild(iconDiv);
        setupIconDrag(iconDiv, name); // Ativa o movimento do icon
    });

    updateTrashIcon();
}

window.addEventListener('load', renderDesktop);

document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.desktop-icon')) {
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.classList.remove('selected-icon');
        });
    }
});
