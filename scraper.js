const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: "new", 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    try {
        // Acessa o site e espera o título carregar
        await page.goto('https://whatsonnow.criterionchannel.com/', { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });
        
        await page.waitForSelector('.whatson__title', { timeout: 10000 });

        const data = await page.evaluate(() => {
            const titleEl = document.querySelector('.whatson__title');
            const bodyText = document.body.innerText;
            // Busca o tempo restante (ex: "starts in: 45")
            const match = bodyText.match(/starts in:\s*(\d+)/i) || bodyText.match(/em:\s*(\d+)/i);
            
            return {
                titulo: titleEl ? titleEl.innerText.trim() : "DESCONHECIDO",
                minutosRestantes: match ? parseInt(match[1]) : 0
            };
        });

        console.log(`Título detectado: ${data.titulo}`);

        if (data.titulo !== "DESCONHECIDO") {
            // 1. Verificar se o último filme salvo é o mesmo
            let ultimoFilme = "";
            const arquivoPath = './programacao.csv';

            if (fs.existsSync(arquivoPath)) {
                const linhas = fs.readFileSync(arquivoPath, 'utf8').trim().split('\n');
                if (linhas.length > 0) {
                    const ultimaLinha = linhas[linhas.length - 1];
                    // Extrai o título entre as primeiras aspas
                    ultimoFilme = ultimaLinha.split('","')[0].replace(/"/g, '');
                }
            }

            // 2. Só salvar se for um filme novo
            if (data.titulo !== ultimoFilme) {
                const agora = new Date();
                const fim = new Date(agora.getTime() + data.minutosRestantes * 60000);
                
                const opcoes = { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' };
                const hCaptura = agora.toLocaleTimeString('pt-BR', opcoes);
                const hFim = fim.toLocaleTimeString('pt-BR', opcoes);

                const novaLinha = `"${data.titulo}","${hCaptura}","${hFim}"\n`;
                
                fs.appendFileSync(arquivoPath, novaLinha, 'utf8');
                console.log("✅ Novo filme adicionado ao CSV!");
            } else {
                console.log("ℹ️ O filme ainda é o mesmo. Nada foi alterado.");
            }
        }

    } catch (error) {
        console.error("❌ Erro fatal:", error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
