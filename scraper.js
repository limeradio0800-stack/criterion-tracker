const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: "new", 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://whatsonnow.criterionchannel.com/?t=' + Date.now(), { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });
        
        await page.waitForSelector('.whatson__title', { timeout: 20000 });

        const dadosRaw = await page.evaluate(() => {
            const titulo = document.querySelector('.whatson__title')?.innerText.trim();
            
            // Lista de possíveis locais onde o tempo "67 minutes" pode estar
            const seletores = [
                '.whatson__eyebrow--bold', 
                '.whatson__time', 
                '.whatson__subtitle'
            ];
            
            let minutosEncontrados = null;

            for (let s of seletores) {
                const el = document.querySelector(s);
                if (el && el.innerText.toLowerCase().includes('min')) {
                    const numeros = el.innerText.match(/\d+/);
                    if (numeros) {
                        minutosEncontrados = parseInt(numeros[0]);
                        break;
                    }
                }
            }
            return { titulo, minutos: minutosEncontrados };
        });

        // --- CÁLCULO DE HORÁRIO (Brasília UTC-3) ---
        const agoraUTC = new Date();
        const agoraBR = new Date(agoraUTC.getTime() - (3 * 60 * 60 * 1000));
        
        const pad = (n) => n.toString().padStart(2, '0');
        const horaCaptura = `${pad(agoraBR.getUTCHours())}:${pad(agoraBR.getUTCMinutes())}`;
        
        let horaTermino = "---";

        if (dadosRaw.minutos) {
            const dataTermino = new Date(agoraBR.getTime() + (dadosRaw.minutos * 60 * 1000));
            horaTermino = `${pad(dataTermino.getUTCHours())}:${pad(dataTermino.getUTCMinutes())}`;
        }

        // --- REGISTRO NO CSV ---
        const linha = `"${dadosRaw.titulo}","${horaCaptura}","${horaTermino}"\n`;
        fs.appendFileSync('./programacao.csv', linha, 'utf8');
        
        console.log(`✅ [${horaCaptura}] ${dadosRaw.titulo} -> Termina às ${horaTermino} (${dadosRaw.minutos} min restantes)`);

    } catch (error) {
        console.error("Erro na captura:", error.message);
    } finally {
        await browser.close();
    }
})();
