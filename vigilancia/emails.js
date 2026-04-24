const listaEmails = [
    {
        id: "email_intro",
        sender: "Percepta",
        subject: "In case of problems",
        body: 'If you have any problems using our OS, please checkout the help page (link below) where we provide solutions to our most common problems.\n\nIf you have unforseen problems, then please contact us and report it.\n\n<a href="#" onclick="openBrowserApp(); openLink(\'help-page\');" style="color: blue; text-decoration: underline; cursor: pointer;">Help Page</a>',
        read: false,
        visible: true,
        time: ""
    },
    {
        id: "dont_trust",
        sender: "▚▛▚▚▒▛▜▞▟",
        subject: "don't do it",
        body: "don't trust them\n\nI'll show you why",
        read: false,
        visible: false,
        time: ""
    },
    {
        id: "news_layoffs",
        sender: "▒▟▚▙▜▚▒_",
        subject: "Terrible layoffs: 55,000 Replaced",
        body: 'Take a look at how many lives they ruined. Human redundancy reduction is what they\'re calling it.\n\n<a href="#" onclick="openBrowserApp(); openLink(\'jobs-layoffs\');" style="color: blue; text-decoration: underline; cursor: pointer;">Efficiency Report</a>',
        read: false,
        visible: false,
        time: ""
    },
    {
        id: "news_eco",
        sender: "▚▒_▞█▒▙▚",
        subject: "This water usage is insane",
        body: 'Do you have any idea how much water those servers are drinking? 320,000L A DAY just for chatbots and videos of talking food?\n\n<a href="#" onclick="openBrowserApp(); openLink(\'water-consumption\');" style="color: blue; text-decoration: underline; cursor: pointer;">Take a look at this</a>',
        read: false,
        visible: false,
        time: ""
    },
    {
        id: "news_security",
        sender: "▚▜▞_▒█",
        subject: "They are hijaking faces",
        body: 'Look how many people got harrassed or stolen from because of this type of studies.\n\n<a href="#" onclick="openBrowserApp(); openLink(\'data-leaks\');" style="color: blue; text-decoration: underline; cursor: pointer;">Security Bulletin</a>',
        read: false,
        visible: false,
        time: ""
    },
    {
        id: "password",
        sender: "▚▒_▞▛▜▞_▒▟",
        subject: "They are spying on you",
        body: "You probably already saw the analysis folder, the password is <b>admin</b>, go see for yourself how you've been spied.",
        read: false,
        visible: false,
        time: ""
    },
    {
        id: "finale",
        sender: "▒_▞▛▞▛_▒▟",
        subject: "I warned you, but you ignored me",
        body: "Nothing I can do now.\n\nI tried to help you.\n\nYou're by yourself now.\n\nGoodbye",
        read: false,
        visible: false,
        time: ""
    }
];

function getTime() {//vê a hora atual para meter no email
    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    const segundos = String(agora.getSeconds()).padStart(2, '0');
    return `${horas}:${minutos}:${segundos}`;
}

const dot = document.getElementById('email-notif-dot');

function renderEmailList() {
    const tableBody = document.getElementById('email-table-body');

    if (tableBody) tableBody.innerHTML = '';//dá reset a lista pra n duplicar emails

    let unreadCount = 0;//contador de emails não lidos para aparecer na notificação
    const reversedEmails = [...listaEmails].reverse();//cria uma lista ao contrario para o mais recente ficar no topo

    reversedEmails.forEach(email => {
        if (!email.visible) return;
        if (!email.read) unreadCount++;//só conta as que ja tao visiveis pq em cima da return das invisiveis

        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.style.background = email.read ? 'white' : '#f0f0f0';
        tr.style.fontWeight = email.read ? 'normal' : 'bold';
        tr.className = 'email-row';
        tr.innerHTML = `
            <td style="border-bottom: 1px solid #dfdfdf; padding: 5px; width: 20%; color: #666; font-size: 11px;">
                ${email.time}
            </td>
            <td style="border-bottom: 1px solid #dfdfdf; padding: 5px; width: 30%;">
                ${email.sender}
            </td>
            <td style="border-bottom: 1px solid #dfdfdf; padding: 5px;">
                ${email.subject}
            </td>
            `;

        tr.onclick = () => openEmail(email.id);
        tableBody.appendChild(tr);//adiciona a linha a tabela
    });

    if (unreadCount > 0) {
        dot.style.display = 'block';
        dot.innerText = unreadCount;
    } else {
        dot.style.display = 'none';
    }
}

function openEmail(id) {
    const email = listaEmails.find(e => e.id === id);//procura na lista

    if (!email.read) {
        if (id === "email_intro") {
            email.read = true;
        }
        if (id === "dont_trust") {
            playPeepsSequence([
                { text: "Well that is... weird. I don't know where that came from but it’s better to keep yourself focused on the tasks!",
                face: "apprehensive",
                duration: 7000 }
            ], true);
            email.read = true;
        }
        else if (id === "news_layoffs") {
            playPeepsSequence([
                { text: "What a terrible misunderstanding, those people were lazy bums! We had no choice but to fire them if we wanted to meet the quota.", 
                face: "apprehensive", 
                duration: 8000 }
            ], true);
            email.read = true;
        } else if (id === "news_eco") {
            playPeepsSequence([
                { text: "This guy again? These hackers and scammers are getting better. Well, let’s ignore them and go back work!", 
                face: "angry", 
                duration: 7000 }
            ], true);
            email.read = true;
        } else if (id === "news_security") {
            playPeepsSequence([
                { text: "Internet these days... We can't trust it can we? Our company is working to protect everyone from fakenews! Let's go back to completing the tasks.", 
                face: "side", 
                duration: 8000 }
            ], true);
            email.read = true;
        } else if (id === "password") {
            playPeepsSequence([
                { text: "DON'T LOOK AT THAT! IGNORE IT! GO BACK TO YOUR TASKS!", 
                face: "evil", 
                duration: 6000 }
            ], true);
            email.read = true;
        } else if (id === "finale") {
            playPeepsSequence([
                { text: "It's too late now.", 
                face: "happy", 
                duration: 3000 }
            ], true);
            email.read = true;
        }
    }

    document.getElementById('inbox-view').style.display = 'none';
    document.getElementById('reading-view').style.display = 'block';
    document.getElementById('email-toolbar').style.display = 'block';

    document.getElementById('view-from').innerText = email.sender;
    document.getElementById('view-subject').innerText = email.subject;
    document.getElementById('view-body').innerHTML = email.body;

    renderEmailList();
}

function showInbox() {
    document.getElementById('inbox-view').style.display = 'block';
    document.getElementById('reading-view').style.display = 'none';
    document.getElementById('email-toolbar').style.display = 'none';
}

function openEmailApp() {
    openWindow('email-app');
    showInbox();
    renderEmailList();
}

function closeEmailApp() {
    document.getElementById('email-app').style.display = 'none';
    updateTaskbar();
}

function triggerNewEmail(id) {
    const email = listaEmails.find(e => e.id === id);//encontra na lista

    if (!email.visible) {
        email.visible = true;
        email.read = false;

        playSound(soundNotif);
        dot.style.display = 'block';

        email.time = getTime();

        renderEmailList();
    }
}

window.addEventListener('load', () => {//para no inicio aparecer o primeiro email com a hora certa
    listaEmails.find(e => e.id === "email_intro").time = getTime();
    renderEmailList();
});