const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    // Inicia um navegador invisível no servidor do GitHub
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://whatsonnow.criterionchannel.com/', { waitUntil: 'networkidle2' });

        // Extrai o título e o tempo restante do HTML da página
        const data = await page.evaluate(() => {
            const title = document.querySelector('.whatson__title')?.innerText || "Desconhecido";
            const bodyText = document.body.innerText;
            const match = bodyText.match(/starts in:\s*(\d+)/i);
            return {
                titulo: title,
                minutosRestantes: match ? parseInt(match[1]) : 0
            };
        });

        const agora = new Date();
        const fim = new Date(agora.getTime() + data.minutosRestantes * 60000);
        
        // Formata a linha para a planilha (CSV)
        const linha = `"${data.titulo}","${agora.toLocaleString('pt-BR')}","${agora.toLocaleTimeString('pt-BR')}","${fim.toLocaleTimeString('pt-BR')}"\n`;

        // Salva a linha no arquivo
        fs.appendFileSync('programacao.csv', linha);
        console.log(`Sucesso: ${data.titulo} capturado.`);

    } catch (error) {
        console.error("Erro na captura:", error);
    } finally {
        await browser.close();
    }
})();
