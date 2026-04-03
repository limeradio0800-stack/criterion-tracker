const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    // Configurações específicas para rodar no servidor do GitHub (Linux)
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    try {
        // Aumentamos o tempo de espera para 60 segundos caso o site demore
        await page.goto('https://whatsonnow.criterionchannel.com/', { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });

        const data = await page.evaluate(() => {
            const title = document.querySelector('.whatson__title')?.innerText || "Desconhecido";
            const bodyText = document.body.innerText;
            const match = bodyText.match(/starts in:\s*(\d+)/i) || bodyText.match(/em:\s*(\d+)/i);
            return {
                titulo: title,
                minutosRestantes: match ? parseInt(match[1]) : 0
            };
        });

        const agora = new Date();
        const fim = new Date(agora.getTime() + data.minutosRestantes * 60000);
        
        // Ajuste de fuso horário para Brasília/São Paulo (-3h) se desejar, 
        // ou mantenha o padrão UTC do servidor:
        const linha = `"${data.titulo}","${agora.toISOString()}","${data.minutosRestantes} min"\n`;

        fs.appendFileSync('programacao.csv', linha);
        console.log(`✅ Filme capturado: ${data.titulo}`);

    } catch (error) {
        console.error("❌ Erro detalhado:", error.message);
        process.exit(1); // Força o erro aparecer no log se falhar
    } finally {
        await browser.close();
    }
})();
