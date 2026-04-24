//estrutura default
const defaultFS = {
    "C:": {
        type: "folder",
        children: {
            "Users": {
                type: "folder",
                children: {
                    "Participant": {
                        type: "folder",
                        children: {
                            "Desktop": { type: "folder", children: {} },
                            "Documents": {
                                type: "folder",
                                children: {
                                    "Secret": { type: "folder", children: {} }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

// Carrega o file system do jogador se ele já tiver jogado antes
let vfs = JSON.parse(localStorage.getItem('percepta_vfs')) || defaultFS;
let currentPath = "C:\\Users\\Participant\\Documents";
let selectedFileName = null;
let vfsClipboard = null; //clipboard de copiar e cortar

//Garante que pastas essenciais não desaparecem
let participantDir = vfs["C:"].children["Users"].children["Participant"].children;

//garante que o desktop existe
if (!participantDir["Desktop"]) {
    participantDir["Desktop"] = { type: "folder", children: {} };
    saveVFS();
}

//garante que o lixo existe na raiz do disco C
if (!vfs["C:"].children["Trash"]) {
    vfs["C:"].children["Trash"] = { type: "folder", children: {} };
    saveVFS();
}

//garante que a pasta de analysis existe no Desktop e está trancada
if (!participantDir["Desktop"].children["Analysis"]) {
    participantDir["Desktop"].children["Analysis"] = {
        type: "locked_folder",
        x: 20,
        y: 20
    };
    saveVFS();
}

//grava o estado atual de todos os ficheiros no Browser do utilizador
function saveVFS() {
    localStorage.setItem('percepta_vfs', JSON.stringify(vfs));
}

//atualiza o file system, file explorer e desktop
function refreshVFS() {
    saveVFS();
    renderFileExplorer();
    renderDesktop();
}

//verifica se um ficheiro já existe e dá um pop up de erro
async function checkFileExists(folder, name) {
    if (folder[name]) {
        await osAlert("A file or folder with that name already exists.", "Error", "❌");
        return true;
    }
    return false;
}

//navega pelo file system usando o path e devolve o conteúdo
function getFolderByPath(path) {
    let parts = path.split('\\');
    let current = vfs;

    for (let part of parts) {
        if (part === "") continue;
        if (current[part] && current[part].type === 'folder') {
            current = current[part].children;
        } else {
            return null; //caminho inválido
        }
    }
    return current;
}

//limpa a seleção azul de um item quando clicamos no espaço em branco do explorador de ficheiros
function clearExplorerSelection(containerId = 'explorer-file-list') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('selected');
        item.style.backgroundColor = '';
        item.style.color = '';
    });

    if (containerId === 'explorer-file-list') selectedFileName = null;
}

//botão "Up" na janela
function goUpDirectory() {
    if (currentPath === "C:") return; //não deixa subir do C:
    let parts = currentPath.split('\\');
    parts.pop();    //remove a última pasta do path
    currentPath = parts.join('\\');
    renderFileExplorer();
}

//função que desenha as pastas e ficheiros na janela do Explorador
function renderFileExplorer() {
    const fileList = document.getElementById('explorer-file-list');
    const addressBar = document.getElementById('explorer-address');
    if (!fileList) return;

    fileList.innerHTML = '';
    addressBar.value = currentPath;
    selectedFileName = null;

    let currentFolder = getFolderByPath(currentPath);

    if (!currentFolder) {
        fileList.innerHTML = '<p style="color:red;">Path not found.</p>';
        return;
    }

    //percorre cada ficheiro dentro da pasta atual
    Object.entries(currentFolder).forEach(([name, data]) => {

        //se o ficheiro for cortado e estamos no folder de onde foi cortado esconde-o
        if (vfsClipboard && vfsClipboard.action === 'cut' && vfsClipboard.path === currentPath && vfsClipboard.name === name) {
            return;
        }

        const fileDiv = document.createElement('div');
        fileDiv.className = 'file-item';

        //lógica de drag and drop
        fileDiv.setAttribute('draggable', 'true');
        fileDiv.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', name);
            e.dataTransfer.effectAllowed = 'move';
        };

        //seleção com um click
        fileDiv.onclick = (e) => {
            clearExplorerSelection();
            fileDiv.classList.add('selected');
            fileDiv.style.backgroundColor = '#000080';
            fileDiv.style.color = 'white';
            selectedFileName = name;
            e.stopPropagation();
        };

        //context menu ao dar right click num ficheiro
        fileDiv.oncontextmenu = (e) => {
            e.preventDefault();
            fileDiv.click(); //seleciona o ficheiro antes de abrir o menu

            const ctxMenu = document.getElementById('context-menu');
            ctxMenu.innerHTML = '';

            const optOpen = document.createElement('div');
            optOpen.innerText = 'Open';
            optOpen.onclick = () => { ctxMenu.style.display = 'none'; fileDiv.ondblclick(); };
            ctxMenu.appendChild(optOpen);

            //pastas importantes
            const isSystemFolder = (currentPath === "C:\\Users\\Participant" && (name === "Desktop" || name === "Documents")) || data.type === 'locked_folder';

            //context menu se estivermos dentro do Lixo
            if (currentPath.includes("Trash")) {
                ctxMenu.appendChild(document.createElement('hr'));

                const optRestore = document.createElement('div');
                optRestore.innerText = 'Restore';
                optRestore.onclick = async () => {
                    ctxMenu.style.display = 'none';
                    const result = await osSaveAs(name);
                    if (result) {
                        let targetFolder = getFolderByPath(result.path);
                        if (targetFolder[result.fileName]) {
                            await osAlert("A file with that name already exists in the destination.", "Restore Error", "❌");
                            return;
                        }
                        targetFolder[result.fileName] = data;
                        delete currentFolder[name];
                        saveVFS();
                        renderFileExplorer();
                        renderDesktop();
                    }
                };
                ctxMenu.appendChild(optRestore);

                const optDeletePerm = document.createElement('div');
                optDeletePerm.innerText = 'Delete Permanently';
                optDeletePerm.onclick = () => { ctxMenu.style.display = 'none'; deleteSelectedFile(); };
                ctxMenu.appendChild(optDeletePerm);

            //bloqueia alterar pastas importantes
            } else if (!isSystemFolder) {
                //context menu para ficheiros restantes
                ctxMenu.appendChild(document.createElement('hr'));

                const optRename = document.createElement('div');
                optRename.innerText = 'Rename';
                optRename.onclick = () => { ctxMenu.style.display = 'none'; renameSelectedFile(); };
                ctxMenu.appendChild(optRename);

                const optCopy = document.createElement('div');
                optCopy.innerText = 'Copy';
                optCopy.onclick = () => {
                    ctxMenu.style.display = 'none';
                    let frozenData = JSON.parse(JSON.stringify(data));
                    vfsClipboard = { action: 'copy', path: currentPath, name: name, data: frozenData };
                    renderFileExplorer();
                    renderDesktop();
                };
                ctxMenu.appendChild(optCopy);

                const optCut = document.createElement('div');
                optCut.innerText = 'Cut';
                optCut.onclick = () => {
                    ctxMenu.style.display = 'none';
                    vfsClipboard = { action: 'cut', path: currentPath, name: name, data: data };
                    renderFileExplorer();
                    renderDesktop();
                };
                ctxMenu.appendChild(optCut);

                const optDelete = document.createElement('div');
                optDelete.innerText = 'Delete';
                optDelete.onclick = () => { ctxMenu.style.display = 'none'; deleteSelectedFile(); };
                ctxMenu.appendChild(optDelete);
            }

            positionContextMenu(e, ctxMenu);
        };

        //regras visuais e de duplo clique conforme o tipo de ficheiro
        if (data.type === 'folder') {
            fileDiv.ondragover = (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                fileDiv.style.backgroundColor = 'rgba(0, 0, 128, 0.2)';
                fileDiv.style.outline = '1px dotted white';
            };

            fileDiv.ondragleave = (e) => {
                fileDiv.style.backgroundColor = fileDiv.classList.contains('selected') ? '#000080' : '';
                fileDiv.style.outline = '';
            };

            fileDiv.ondrop = (e) => {
                e.preventDefault();
                fileDiv.style.backgroundColor = '';
                fileDiv.style.outline = '';
                const draggedFileName = e.dataTransfer.getData('text/plain');
                handleDropIntoFolder(name, draggedFileName);
            };

            fileDiv.innerHTML = `<img src="media/pasta.png" alt="Folder" style="width: 32px; height: 32px; margin-bottom: 5px;"><span>${name}</span>`;
            fileDiv.ondblclick = () => {
                currentPath += "\\" + name;
                renderFileExplorer();
            };
        } else if (data.type === 'locked_folder') {
            fileDiv.innerHTML = `<img src="media/pasta lock.png" alt="Locked" style="width: 32px; height: 32px; margin-bottom: 5px;"><span>${name}</span>`;
            fileDiv.ondblclick = () => promptLogPassword();
        } else if (data.type === 'image') {
            fileDiv.innerHTML = `<img src="${data.content}" alt="Image" style="width: 32px; height: 32px; margin-bottom: 5px; background: white; border: 1px solid black; object-fit: contain; box-sizing: border-box;"><span>${name}</span>`;
            fileDiv.ondblclick = () => loadDrawing(data.content, name);
        } else if (data.type === 'text') {
            fileDiv.innerHTML = `<img src="media/bloco.png" alt="Text" style="width: 32px; height: 32px; margin-bottom: 5px;"><span>${name}</span>`;
            fileDiv.ondblclick = () => openTextFile(name, data.content);
        }

        fileList.appendChild(fileDiv);
    });
}
const explorerList = document.getElementById('explorer-file-list');
//configurações da janela do Explorador
if (explorerList) {
    explorerList.onclick = clearExplorerSelection;

    //menu de clique direito na area branca (criar novo ficheiro/pasta)
    explorerList.oncontextmenu = (e) => {
        if (e.target.closest('.file-item')) return;
        e.preventDefault();

        const ctxMenu = document.getElementById('context-menu');
        ctxMenu.innerHTML = '';

        //novo txt
        const optNewText = document.createElement('div');
        optNewText.innerText = 'New Text Document';
        optNewText.onclick = () => { ctxMenu.style.display = 'none'; createNewTextFile(); };
        ctxMenu.appendChild(optNewText);

        //novo paint file
        const optNewPaint = document.createElement('div');
        optNewPaint.innerText = 'New Paint File';
        optNewPaint.onclick = () => { ctxMenu.style.display = 'none'; createNewPaintFile(); };
        ctxMenu.appendChild(optNewPaint);

        //nova pasta
        const optNewFolder = document.createElement('div');
        optNewFolder.innerText = 'New Folder';
        optNewFolder.onclick = () => { ctxMenu.style.display = 'none'; createNewFolder(); };
        ctxMenu.appendChild(optNewFolder);

        //se houver algo no clipboard permite dar paste nesta pasta
        if (vfsClipboard) {
            ctxMenu.appendChild(document.createElement('hr'));
            const optPaste = document.createElement('div');
            optPaste.innerText = 'Paste';
            optPaste.onclick = () => {
                ctxMenu.style.display = 'none';
                executePaste(currentPath);
            };
            ctxMenu.appendChild(optPaste);
        }
        positionContextMenu(e, ctxMenu);
    };
}

//cria um ficheiro de texto novo nessa pasta e dá reload ao file explorer e desktop
async function createNewTextFile() {
    let fileName = await osPrompt("File name:", "New Document.txt", "Create Text File", "📝");
    if (!fileName) return;
    if (!fileName.endsWith('.txt')) fileName += '.txt';

    let currentFolder = getFolderByPath(currentPath);
    if (await checkFileExists(currentFolder, folderName)) return;

    currentFolder[fileName] = { type: "text", content: "" };
    refreshVFS();
}

//cria um ficheiro paint novo nessa pasta e dá reload ao file explorer e desktop
async function createNewPaintFile() {
    let fileName = await osPrompt("File name:", "New Drawing.png", "Create Image File", "🎨");
    if (!fileName) return;
    if (!fileName.endsWith('.png')) fileName += '.png';

    let currentFolder = getFolderByPath(currentPath);
    if (await checkFileExists(currentFolder, fileName)) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 400;
    tempCanvas.height = 300;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, 400, 300);
    
    currentFolder[fileName] = { type: "image", content: tempCanvas.toDataURL('image/png') };
    refreshVFS();
}

//cria uma pasta nova nessa dentro da pasta atual e dá reload ao file explorer e desktop
async function createNewFolder() {
    let folderName = await osPrompt("New Folder Name:", "New Folder", "Create Directory", "📁");
    if (!folderName) return;

    let currentFolder = getFolderByPath(currentPath);
    if (await checkFileExists(currentFolder, folderName)) return;

    currentFolder[folderName] = { type: "folder", children: {} };
    refreshVFS();
}

//deixa o utilizador alterar o nome de um ficheiro fazndo verificação se existe um ficheiro com nome igual nessa pasta
async function renameSelectedFile() {
    if (!selectedFileName) {
        await osAlert("Please select a file or folder to rename.", "Rename Error", "⚠️");
        return;
    }

    const newName = await osPrompt(`Enter a new name for "${selectedFileName}":`, selectedFileName, "Rename");

    if (newName && newName !== selectedFileName) {
        let currentFolder = getFolderByPath(currentPath);

        if (await checkFileExists(currentFolder, newName)) return;

        currentFolder[newName] = currentFolder[selectedFileName];
        delete currentFolder[selectedFileName];
        refreshVFS();
    }
}

//apagar ficheiro com pop ups de confirmação
async function deleteSelectedFile() {
    if (!selectedFileName) return;

    //se estivermos no lixo a eliminação é permanente
    if (currentPath.includes("Trash")) {
        const isSure = await osConfirm(`Permanently delete "${selectedFileName}"?\nThis cannot be undone.`, "Confirm Delete", "🗑️");
        if (isSure) {
            let currentFolder = getFolderByPath(currentPath);
            delete currentFolder[selectedFileName];
            refreshVFS();
        }
        return;
    }
    //se estivermos noutra pasta qualquer move para o lixo
    const isSure = await osConfirm(`Move "${selectedFileName}" to the Recycle Bin?`, "Confirm Delete", "🗑️");
    if (isSure) {
        let currentFolder = getFolderByPath(currentPath);
        moveToTrash(currentPath, selectedFileName, currentFolder[selectedFileName]);
    }
}

function moveToTrash(sourcePath, fileName, fileData) {
    let trashFolder = getFolderByPath("C:\\Trash");
    let finalName = fileName;

    let baseName = finalName;
    let ext = "";
    let nameParts = finalName.split('.');

    if (nameParts.length > 1 && fileData.type !== 'folder' && fileData.type !== 'locked_folder') {
        ext = "." + nameParts.pop();
        baseName = nameParts.join('.');
    }

    //garante que não há conflitos de nomes no lixo adicionando um contador no fim
    let counter = 2;
    while (trashFolder[finalName]) {
        finalName = baseName + " (" + counter + ")" + ext;
        counter++;
    }

    trashFolder[finalName] = JSON.parse(JSON.stringify(fileData));
    let sourceFolder = getFolderByPath(sourcePath);
    delete sourceFolder[fileName];


    playSound(soundTrash);  //dá play ao sound effect do lixo
    refreshVFS();
}

//se o lixo tiver algum item altera o icone
function updateTrashIcon() {
    const trashSpan = Array.from(document.querySelectorAll('.desktop-icon span')).find(s => s.innerText === 'Recycle Bin');
    if (!trashSpan) return;

    const trashImg = trashSpan.previousElementSibling;
    const trashFolder = getFolderByPath("C:\\Trash");

    if (trashFolder && Object.keys(trashFolder).length > 0) {
        trashImg.src = "media/lixo cheio.png";
    } else {
        trashImg.src = "media/lixo.png";
    }
}