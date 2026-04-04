const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: "new", 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    try {
        // Aumentamos o tempo de espera para garantir que o JS carregue
        await page.goto('https://whatsonnow.criterionchannel.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForSelector('.whatson__title', { timeout: 10000 });

        const data = await page.evaluate(() => {
            const el = document.querySelector('.whatson__title');
            return el ? el.innerText.trim() : "TÍTULO_NÃO_ENCONTRADO";
        });

        console.log("Título detectado:", data);

        if (data !== "TÍTULO_NÃO_ENCONTRADO") {
            const agora = new Date();
            const opcoes = { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' };
            const hCaptura = agora.toLocaleTimeString('pt-BR', opcoes);
            
            const linha = `"${data}","${hCaptura}"\n`;
            fs.appendFileSync('./programacao.csv', linha, 'utf8');
        }

    } catch (error) {
        console.error("Erro na captura:", error.message);
    } finally {
        await browser.close();
    }
})();
