const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: "new", 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    try {
        // Força o carregamento de uma versão nova da página (anti-cache)
        await page.goto('https://whatsonnow.criterionchannel.com/?t=' + Date.now(), { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });
        
        await page.waitForSelector('.whatson__title', { timeout: 20000 });

        const data = await page.evaluate(() => {
            const el = document.querySelector('.whatson__title');
            return el ? el.innerText.trim() : "DESCONHECIDO";
        });

        const agora = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
        const horaBR = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        // Escreve SEMPRE, sem verificar duplicatas
        const novaLinha = `"${data}","${horaBR}"\n`;
        fs.appendFileSync('./programacao.csv', novaLinha, 'utf8');
        
        console.log(`✅ Registro efetuado: ${data} às ${horaBR}`);

    } catch (error) {
        console.error("❌ Erro na varredura:", error.message);
        // Registra o erro no CSV para você saber que ele tentou e falhou
        const agora = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
        const horaBR = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
        fs.appendFileSync('./programacao.csv', `"ERRO: ${error.message}","${horaBR}"\n`, 'utf8');
    } finally {
        await browser.close();
    }
})();
