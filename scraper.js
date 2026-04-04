const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: "new", 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    try {
        // Anti-cache para garantir que lê o filme atualizado da hora
        await page.goto('https://whatsonnow.criterionchannel.com/?t=' + Date.now(), { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });
        
        await page.waitForSelector('.whatson__title', { timeout: 20000 });

        const titulo = await page.evaluate(() => {
            const el = document.querySelector('.whatson__title');
            return el ? el.innerText.trim() : "DESCONHECIDO";
        });

        const agora = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
        const horaBR = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        // Registo simples: Título e Hora
        fs.appendFileSync('./programacao.csv', `"${titulo}","${horaBR}"\n`, 'utf8');
        
        console.log(`✅ Registado às ${horaBR}: ${titulo}`);

    } catch (error) {
        console.error("Erro:", error.message);
    } finally {
        await browser.close();
    }
})();
