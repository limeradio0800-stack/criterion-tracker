const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: "new", 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://whatsonnow.criterionchannel.com/?t=' + Date.now(), { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });
        
        await page.waitForSelector('.whatson__title', { timeout: 20000 });

        const dadosRaw = await page.evaluate(() => {
            const titulo = document.querySelector('.whatson__title')?.innerText.trim();
            const tempoTexto = document.querySelector('.whatson__time')?.innerText.trim() || "";
            // Extrai apenas os números do texto (ex: "ENDS IN 22 MIN" -> 22)
            const minutosRestantes = tempoTexto.match(/\d+/);
            return { titulo, minutos: minutosRestantes ? parseInt(minutosRestantes[0]) : null };
        });

        // --- LÓGICA DE HORÁRIO ---
        const agora = new Date();
        // Ajuste para o fuso de Brasília (UTC-3)
        const agoraBR = new Date(agora.getTime() - (3 * 60 * 60 * 1000));
        
        const formatarHora = (data) => data.toISOString().substr(11, 5);
        
        const horaInicioCaptura = formatarHora(agoraBR);
        let horaTerminoEstimada = "---";

        if (dadosRaw.minutos) {
            const dataTermino = new Date(agoraBR.getTime() + (dadosRaw.minutos * 60 * 1000));
            horaTerminoEstimada = formatarHora(dataTermino);
        }

        // --- SALVAMENTO NO CSV ---
        const linha = `"${dadosRaw.titulo}","${horaInicioCaptura}","${horaTerminoEstimada}"\n`;
        
        fs.appendFileSync('./programacao.csv', linha, 'utf8');
        console.log(`🎬 ${dadosRaw.titulo} | Início: ${horaInicioCaptura} | Fim: ${horaTerminoEstimada}`);

    } catch (error) {
        console.error("Erro:", error.message);
    } finally {
        await browser.close();
    }
})();
