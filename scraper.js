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
                titulo: title.trim(),
                minutosRestantes: match ? parseInt(match[1]) : 0
            };
        });

        // 1. LER O ÚLTIMO FILME SALVO PARA COMPARAR
        let ultimoFilme = "";
        if (fs.existsSync('./programacao.csv')) {
            const conteudo = fs.readFileSync('./programacao.csv', 'utf8').trim().split('\n');
            const ultimaLinha = conteudo[conteudo.length - 1];
            // Pega o que está entre as primeiras aspas
            ultimoFilme = ultimaLinha.split('","')[0].replace(/"/g, '');
        }

        // 2. SÓ SALVAR SE O TÍTULO FOR DIFERENTE
        if (data.titulo !== ultimoFilme && data.titulo !== "Desconhecido") {
            const agora = new Date();
            const fim = new Date(agora.getTime() + data.minutosRestantes * 60000);
            
            const opcoes = { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' };
            const hCaptura = agora.toLocaleTimeString('pt-BR', opcoes);
            const hFim = fim.toLocaleTimeString('pt-BR', opcoes);

            const linha = `"${data.titulo}","${hCaptura}","${hFim}"\n`;

            fs.appendFileSync('./programacao.csv', linha, 'utf8');
            console.log(`✅ Novo filme detectado: ${data.titulo}. Salvo no CSV.`);
        } else {
            console.log(`ℹ️ O filme "${data.titulo}" já está registrado. Pulando...`);
        }

    } catch (error) {
        console.error("Erro na captura:", error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
