const puppeteer = require('puppeteer');
const fs = require('fs');

async function getTMDBData(title) {
    const API_KEY = 'SUA_API_KEY_AQUI'; // <--- COLOQUE SUA CHAVE AQUI
    try {
        // 1. Busca o ID do filme
        const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}`;
        const searchRes = await fetch(searchUrl).then(res => res.json());
        if (!searchRes.results || searchRes.results.length === 0) return null;

        const movieId = searchRes.results[0].id;

        // 2. Busca Detalhes + Créditos (para pegar o Diretor)
        const detailsUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`;
        const movie = await fetch(detailsUrl).then(res => res.json());

        // Filtra o Diretor na lista da equipe
        const director = movie.credits?.crew?.find(person => person.job === 'Director')?.name || "N/A";

        return {
            ano: movie.release_date ? movie.release_date.split('-')[0] : "N/A",
            diretor: director,
            poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : ""
        };
    } catch (e) {
        return null;
    }
}

(async () => {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://whatsonnow.criterionchannel.com/', { waitUntil: 'networkidle2', timeout: 60000 });

        const dataWeb = await page.evaluate(() => {
            const title = document.querySelector('.whatson__title')?.innerText || "Desconhecido";
            const txt = document.body.innerText;
            const match = txt.match(/starts in:\s*(\d+)/i) || txt.match(/em:\s*(\d+)/i);
            return { titulo: title, minRestantes: match ? parseInt(match[1]) : 0 };
        });

        const movieInfo = await getTMDBData(dataWeb.titulo);

        // Cálculos de Tempo
        const agora = new Date();
        const fim = new Date(agora.getTime() + dataWeb.minRestantes * 60000);
        
        // Formatação para o CSV (Horário de Brasília)
        const opcoes = { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' };
        const hCaptura = agora.toLocaleTimeString('pt-BR', opcoes);
        const hFim = fim.toLocaleTimeString('pt-BR', opcoes);
        const hInicio = "Captura Live"; // Como não sabemos quando começou, marcamos como o momento que vimos

        // Ordem Final: Titulo, Ano, Diretor, Poster_URL, Horario_Captura, Inicio_Estimado, Fim_Estimado
        const linha = `"${dataWeb.titulo}","${movieInfo?.ano || 'N/A'}","${movieInfo?.diretor || 'N/A'}","${movieInfo?.poster || ''}","${hCaptura}","${hInicio}","${hFim}"\n`;

        fs.appendFileSync('programacao.csv', linha);
        console.log(`✅ Sucesso: ${dataWeb.titulo} capturado com Diretor: ${movieInfo?.diretor}`);

    } catch (error) {
        console.error("Erro:", error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
