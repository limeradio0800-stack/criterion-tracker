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

        const info = await page.evaluate(() => {
            const titulo = document.querySelector('.whatson__title')?.innerText.trim();
            // Pega o texto que diz "ENDS IN..." ou "STARTS IN..."
            const tempoFalta = document.querySelector('.whatson__time')?.innerText.trim(); 
            return { titulo, tempoFalta };
        });

        const agora = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
        const horaBR = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        // Salva: "Filme", "Hora da Captura", "Quanto tempo faltava"
        const linha = `"${info.titulo || '??'}","${horaBR}","${info.tempoFalta || 'N/A'}"\n`;
        
        fs.appendFileSync('./programacao.csv', linha, 'utf8');
        console.log(`✅ Registrado: ${info.titulo} (${info.tempoFalta})`);

    } catch (error) {
        console.error("Erro:", error.message);
    } finally {
        await browser.close();
    }
})();
