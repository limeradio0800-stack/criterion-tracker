const puppeteer = require('puppeteer');
const fs = require('fs');

// Função para buscar dados no TMDB
async function getTMDBData(title) {
    const API_KEY = '78f71c7920108d9657359bbb791e663e';
    try {
        // 1. Busca o ID do filme
        const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}&language=pt-BR`;
        const response = await fetch(searchUrl);
        const searchData = await response.json();

        if (!searchData.results || searchData.results.length === 0) return null;

        const movie = searchData.results[0];
        return {
            ano: movie.release_date ? movie.release_date.split('-')[0] : "N/A",
            nota: movie.vote_average || "N/A",
            poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "",
            resumo: movie.overview || "Sem descrição disponível."
        };
    } catch (e) {
        console.error("Erro na API TMDB:", e.message);
        return null;
    }
}

(async () => {
    const browser = await puppeteer.launch({ 
        headless: "new", 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://whatsonnow.criterionchannel.com/', { waitUntil: 'networkidle2', timeout: 60000 });

        const title = await page.evaluate(() => {
            return document.querySelector('.whatson__title')?.innerText || "Desconhecido";
        });

        // Busca informações extras no TMDB
        const movieInfo = await getTMDBData(title);

        const agora = new Date();
        const dataFormatada = agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

        // Criamos a linha para o CSV com os novos campos
        // Ordem: Titulo, Ano, Nota, Poster_URL, Data_Captura
        const linha = `"${title}","${movieInfo?.ano || 'N/A'}","${movieInfo?.nota || 'N/A'}","${movieInfo?.poster || ''}","${dataFormatada}"\n`;

        fs.appendFileSync('programacao.csv', linha);
        console.log(`✅ Capturado: ${title}`);

    } catch (error) {
        console.error("❌ Erro:", error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
