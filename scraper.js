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
        
        await new Promise(r => setTimeout(r, 15000));

        const dados = await page.evaluate(() => {
            const titulo = document.querySelector('.whatson__title')?.innerText.trim() || "DESCONHECIDO";
            
            // SELETOR AJUSTADO COM BASE NO HTML QUE VOCÊ ENVIOU
            const linkElement = document.querySelector('a.whatson__channel-link--more');
            const link = linkElement ? linkElement.href : "Link não encontrado";

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
        const pad = (n) => n.toString().padStart(2, '0');
        
        // Formato solicitado: DD-MM-AAAA
        const dataFormatada = `${pad(agoraBR.getUTCDate())}-${pad(agoraBR.getUTCMonth() + 1)}-${agoraBR.getUTCFullYear()}`;
        const horaCaptura = `${pad(agoraBR.getUTCHours())}:${pad(agoraBR.getUTCMinutes())}`;
        
        let horaTermino = "---";
        if (minutosRestantes > 0) {
            const dataTermino = new Date(agoraBR.getTime() + (minutosRestantes * 60 * 1000));
            horaTermino = `${pad(dataTermino.getUTCHours())}:${pad(dataTermino.getUTCMinutes())}`;
        }

        // Criando a nova linha
        const novaLinha = `${dataFormatada},${dados.titulo},${horaCaptura},${horaTermino},${dados.link}`;

        // --- LÓGICA DE LIMPEZA (24 HORAS) ---
        const arquivo = './programacao.csv';
        let conteudoFinal = "Data,Filme,Captura,Termino,Link\n"; // Cabeçalho corrigido

        if (fs.existsSync(arquivo)) {
            const linhas = fs.readFileSync(arquivo, 'utf8').split('\n');
            const umDiaAtras = new Date(agora.getTime() - (24 * 60 * 60 * 1000));

            for (let i = 1; i < linhas.length; i++) {
                if (!linhas[i].trim() || linhas[i].startsWith('Data')) continue;
                
                const colunas = linhas[i].split(',');
                if (colunas.length < 3) continue;

                // Reconstroi a data DD-MM-AAAA para o motor de comparação
                const parts = colunas[0].split('-');
                const dataIso = `${parts[2]}-${parts[1]}-${parts[0]}T${colunas[2]}:00Z`;
                const dataRegistro = new Date(dataIso);
                
                if (dataRegistro > umDiaAtras) {
                    conteudoFinal += linhas[i] + '\n';
                }
            }
        }

        conteudoFinal += novaLinha + '\n';
        fs.writeFileSync(arquivo, conteudoFinal, 'utf8');

        console.log(`✅ Salvo: ${dados.titulo} | Link: ${dados.link}`);

    } catch (e) {
        console.error("Erro:", e.message);
    } finally {
        await browser.close();
    }
})();
