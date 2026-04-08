const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: "new", 
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'] 
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        await page.goto('https://whatsonnow.criterionchannel.com/?t=' + Date.now(), { 
            waitUntil: 'networkidle0', 
            timeout: 60000 
        });
        
        await new Promise(r => setTimeout(r, 12000));

        const dados = await page.evaluate(() => {
            const titulo = document.querySelector('.whatson__title')?.innerText.trim() || "DESCONHECIDO";
            
            // CAPTURA DO LINK (Botão MORE)
            // Geralmente é um <a> com a classe 'whatson__link' ou similar
            const linkElement = document.querySelector('a[href*="criterionchannel.com/"]');
            const link = linkElement ? linkElement.href : "Sem Link";

            // CAPTURA DO TEMPO
            let txt = "";
            const spans = Array.from(document.querySelectorAll('span'));
            const alvo = spans.find(s => s.innerText.toLowerCase().includes('min'));
            if (alvo) txt = alvo.innerText;

            return { titulo, txt, link };
        });

        const match = dados.txt ? dados.txt.match(/(\d+)\s*min/i) : null;
        const minutosRestantes = match ? parseInt(match[1]) : 0;

        // --- GESTÃO DE TEMPO (BRASÍLIA) ---
        const agora = new Date();
        const agoraBR = new Date(agora.getTime() - (3 * 60 * 60 * 1000));
        const dataHoje = agoraBR.getUTCFullYear() + '-' + 
                         String(agoraBR.getUTCMonth() + 1).padStart(2, '0') + '-' + 
                         String(agoraBR.getUTCDate()).padStart(2, '0');
        
        const pad = (n) => n.toString().padStart(2, '0');
        const horaCaptura = `${pad(agoraBR.getUTCHours())}:${pad(agoraBR.getUTCMinutes())}`;
        
        let horaTermino = "---";
        if (minutosRestantes > 0) {
            const dataTermino = new Date(agoraBR.getTime() + (minutosRestantes * 60 * 1000));
            horaTermino = `${pad(dataTermino.getUTCHours())}:${pad(dataTermino.getUTCMinutes())}`;
        }

        const novaLinha = `${dataHoje},${dados.titulo},${horaCaptura},${horaTermino},${dados.link}\n`;

        // --- LÓGICA DE LIMPEZA (24 HORAS) ---
        const arquivo = './programacao.csv';
        let conteudoFinal = "Data,Filme,Inicio,Termino,Link\n"; // Cabeçalho

        if (fs.existsSync(arquivo)) {
            const linhas = fs.readFileSync(arquivo, 'utf8').split('\n');
            const umDiaAtras = new Date(agora.getTime() - (24 * 60 * 60 * 1000));

            // Filtra linhas antigas (pula o cabeçalho)
            for (let i = 1; i < linhas.length; i++) {
                if (!linhas[i].trim()) continue;
                
                const colunas = linhas[i].split(',');
                const dataRegistro = new Date(colunas[0] + 'T' + colunas[2] + ':00Z'); // Tenta reconstruir a data
                
                // Se o registro for mais novo que 24h, mantém
                if (dataRegistro > umDiaAtras) {
                    conteudoFinal += linhas[i] + '\n';
                }
            }
        }

        // Adiciona a nova captura e salva (sobrescrevendo o arquivo com a lista limpa)
        conteudoFinal += novaLinha;
        fs.writeFileSync(arquivo, conteudoFinal, 'utf8');

        console.log(`✅ Adicionado: ${dados.titulo} | Link: ${dados.link}`);

    } catch (e) {
        console.error("Erro:", e.message);
    } finally {
        await browser.close();
    }
})();
