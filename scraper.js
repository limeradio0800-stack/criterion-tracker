const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: "new", 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://whatsonnow.criterionchannel.com/', { waitUntil: 'networkidle2', timeout: 60000 });

        const data = await page.evaluate(() => {
            const title = document.querySelector('.whatson__title')?.innerText || "Desconhecido";
            const bodyText = document.body.innerText;
            const match = bodyText.match(/starts in:\s*(\d+)/i) || bodyText.match(/em:\s*(\d+)/i);
            return {
                titulo: title,
                minutosRestantes: match ? parseInt(match[1]) : 0
            };
        });

        // Cálculos de tempo (Horário de Brasília)
        const agora = new Date();
        const fim = new Date(agora.getTime() + data.minutosRestantes * 60000);
        
        const opcoes = { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' };
        const hCaptura = agora.toLocaleTimeString('pt-BR', opcoes);
        const hFim = fim.toLocaleTimeString('pt-BR', opcoes);

        // Estrutura Simples: Titulo, Horario_Captura, Fim_Estimado
        const linha = `"${data.titulo}","${hCaptura}","${hFim}"\n`;

        fs.appendFileSync('./programacao.csv', linha, 'utf8');
        console.log(`✅ Sucesso: ${data.titulo} salvo.`);

    } catch (error) {
        console.error("Erro na captura:", error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
