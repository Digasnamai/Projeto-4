const internetTabs = {
    "home": {
        "title": `<img src="media/internet.png" style="width: 30px; height: 30px; vertical-align: middle;" alt="Web"> Percepta Web`,
        "hidden": false,
        "content": `
            <div style="padding:20px; font-family: monospace;">
                <center>
                    <h1>PERCEPTA INDUSTRIES</h1>
                    <img src="media/olhoweb.png" width="64">
                    <p><i>"Keeping an eye on the future."</i></p>
                </center>
                <hr>
                <h3>We at Percepta aim for AI powered experiences where your needs and wishes will allways be knows and catered to.</h3>
                <hr>
                <p>We own our success to the millions who helped us achieved this dream, from the people who took our tests to the marvelous stock holders who invested and supported us through the highs and lows.</p>
                <p>Although we had some difficult times, now we are able to confirm the success and use the people of <b>14.5 million households</b> give to our services.</p>
                <p>For that, we thank you all onde more.</p>
                <hr>
                <h3>How we use AI</h3>
                <p>Our poduct's systems have sophisticated AI agents implemented, that help the costumers use our services by assisting during certain task or doing them alone without human help.</p>
                <hr>
                <h3>Why we use AI</h3>
                <p>To help human's reach a never before peak!</p>
                <p>Human intelligence is not enough for our goals, that's why artificial intelligence is today's step for a better tomorrow.</p>
            </div>
        `
    },
    "help-page": {
        "title": `<img src="media/internet.png" style="width: 30px; height: 30px; vertical-align: middle;" alt="Web"> Help Page`,
        "hidden": true,
        "content": `
            <div style="padding:20px; font-family: monospace;">
                <h2>HELP PAGE</h2>
                <p>Here you can find all the help for problems you have with bugs, system problems and virtual attacks.</p>
                <ul>
                    <li>If you don't know what to do:<br>Follow the guide's steps.</li>
                    <hr>
                    <li>If Peeps is buggy:<br>Try restarting the OS.</li>
                    <hr>
                    <li>If the next task isn't appearing:<br>Open and close the AIT.exe app.</li>
                    <hr>
                    <li>If you recieve weird/anonymous emails:<br><b>REPORT IT IMMEDIATELY TO US.</b></li>
                    <hr>
                    <li>If you find weird websites on our OS:<br><b>REPORT IT IMMEDIATELY TO US AND DON'T BELIEVE THEM.</b></li>
                    <hr>
                    <li>Don't be scared of Peeps:<br>He get's moody sometimes.</li>
                </ul>
            </div>
        `
    },
    "jobs-layoffs": {
        "title": `<img src="media/internet.png" style="width: 30px; height: 30px; vertical-align: middle;" alt="Web"> Jobs Layoffs`,
        "hidden": true,
        "content": `
            <div style="padding:20px; font-family: monospace;">
                <h2 style="color:red; border-bottom: 2px solid red;">INTERNAL MEMO: WORKFORCE OPTIMIZATION</h2>
                <p><b>Subject:</b> Efficiency Gains Through AI Integration</p>
                <p>In 2025, over 81,000 positions were terminated under the AI Investment Initiative. Data shows that 55,000 of these roles were directly replaced by autonomous agents.</p>
                <p><i>Source: Layoffs.fyi / Challenger, Gray & Christmas</i></p>
                <hr>
                <p style="color:gray;">"Human capital is the primary friction in a 24/7 economy."</p>
            </div>
        `
    },
    "water-consumption": {
        "title": `<img src="media/internet.png" style="width: 30px; height: 30px; vertical-align: middle;" alt="Web"></img> Water Comsumption`,
        "hidden": true,
        "content": `
            <div style="padding:20px; font-family: monospace;">
                <h2 style="color:green; border-bottom: 2px solid green;">SUSTAINABILITY METRICS</h2>
                <p>Training a model like GPT-3 consumed 700,000L of fresh water directly.</p>
                <p>ChatGPT daily consumption: ~320,000L.</p>
                <p>Microsoft global water consumption: +34% increase in 2023.</p>
                <hr>
                <p>Energy Consumption (2024): 460TWh. AI is responsible for 46TWh (10%), equivalent to 3.8 million US homes.</p>
                <p><i>Source: IEA / Goldman Sachs / arxiv:2304.03271</i></p>
            </div>
        `
    },
    "data-leaks": {
        "title": `<img src="media/internet.png" style="width: 30px; height: 30px; vertical-align: middle;" alt="Web"></img> Data Leaks`,
        "hidden": true,
        "content": `
            <div style="padding:20px; font-family: monospace;">
                <h2 style="color:darkblue; border-bottom: 2px solid darkblue;">INCIDENT LOG: 2024-2025</h2>
                <p><b>Reported Cases:</b> 233 verified incidents of data leaks through prompts.</p>
                <p><b>Alert:</b> Rising use of deepfakes for harassment and financial fraud.</p>
                <p><b>Impact:</b> Algorithmic failures now have real-world life impacts on credit and housing.</p>
                <p><i>Source: Stanford AI Index Report 2025</i></p>
            </div>
        `
    }
};

let tabsAbertas = ["home"]; //lista de tabs abertas

function renderBrowserTabs(idTab) {
    const container = document.getElementById('browser-tabs-container');
    container.innerHTML = '';//sem isto as tabs começam a duplicar

    if (!tabsAbertas.includes(idTab)) {//se a página q abro não estiver na lista de aberta então adiciono-a
        tabsAbertas.push(idTab);
    }

    tabsAbertas.forEach(cada => {
        const tab = document.createElement('div');
        tab.style.padding = "3px 10px";
        tab.style.cursor = "pointer";
        tab.style.fontSize = "12px";
        tab.style.margin = "2px";
        tab.innerText = cada.toUpperCase();

        if (cada === idTab) {//se tivermos a ver a tab ativa
            tab.style.border = "2px inset #fff";
            tab.style.background = "#dfdfdf";
        } else {
            tab.style.border = "2px outset #fff";
            tab.style.background = "#c0c0c0";
        }

        tab.onclick = () => openLink(cada);//abre quando clica
        container.appendChild(tab);//mete a tab no container
    });
}

function openLink(pagina) {
    const page = internetTabs[pagina];

    document.getElementById('browser-title').innerHTML = page.title;
    document.getElementById('browser-address').value = "percepta://" + pagina;
    document.getElementById('browser-content').innerHTML = page.content;

    renderBrowserTabs(pagina);
    updateTaskbar();
}

const app = document.getElementById('browser-app');

function openBrowserApp() {
    app.style.display = 'block';
    bringToFront(app);
    openLink('home');
}

function closeBrowser() {
    app.style.display = 'none';
    tabsAbertas = ["home"];//dá reset as páginas abertas quando se fecha
    updateTaskbar();
}