const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: "new", 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    try {
        // Aumentamos o tempo de espera para o site "estabilizar"
        await page.goto('https://whatsonnow.criterionchannel.com/?t=' + Date.now(), { 
            waitUntil: 'networkidle0', 
            timeout: 60000 
        });
        
        // Espera forçada de 5 segundos para garantir que scripts de tempo carreguem
        await new Promise(r => setTimeout(r, 5000));

        const dados = await page.evaluate(() => {
            const titulo = document.querySelector('.whatson__title')?.innerText.trim() || "DESCONHECIDO";
            
            // Pega TODO o texto da página de uma vez
            const corpoTexto = document.body.innerText;
            
            // Procura por algo como "67 minutes" ou "12 min" (ignorando maiúsculas)
            const regex = /(\d+)\s*(minutes|minute|min)/i;
            const match = corpoTexto.match(regex);
            
            return {
                titulo: titulo,
                minutos: match ? parseInt(match[1]) : null
            };
        });

        // --- CÁLCULO DE HORÁRIO (Brasília UTC-3) ---
        const agoraUTC = new Date();
        const agoraBR = new Date(agoraUTC.getTime() - (3 * 60 * 60 * 1000));
        
        const pad = (n) => n.toString().padStart(2, '0');
        const horaCaptura = `${pad(agoraBR.getUTCHours())}:${pad(agoraBR.getUTCMinutes())}`;
        
        let horaTermino = "---";

        if (dados.minutos) {
            const dataTermino = new Date(agoraBR.getTime() + (dados.minutos * 60 * 1000));
            horaTermino = `${pad(dataTermino.getUTCHours())}:${pad(dataTermino.getUTCMinutes())}`;
        }

        const linha = `"${dados.titulo}","${horaCaptura}","${horaTermino}"\n`;
        fs.appendFileSync('./programacao.csv', linha, 'utf8');
        
        console.log(`✅ [${horaCaptura}] ${dados.titulo} | Faltam ${dados.minutos}min | Termina: ${horaTermino}`);

    } catch (error) {
        console.error("Erro:", error.message);
    } finally {
        await browser.close();
    }
})();
