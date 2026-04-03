async function getTMDBData(fullTitle) {
    const API_KEY = 'SUA_API_KEY_AQUI';
    // Tenta primeiro o título completo, se falhar, tenta só o que vem antes dos dois pontos (:)
    const titlesToTry = [fullTitle, fullTitle.split(':')[0]];
    
    for (const title of titlesToTry) {
        const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}`;
        const searchRes = await fetch(searchUrl).then(res => res.json());
        
        if (searchRes.results && searchRes.results.length > 0) {
            const movieId = searchRes.results[0].id;
            const detailsUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`;
            const movie = await fetch(detailsUrl).then(res => res.json());
            
            return {
                ano: movie.release_date ? movie.release_date.split('-')[0] : "N/A",
                diretor: movie.credits?.crew?.find(p => p.job === 'Director')?.name || "N/A",
                poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : ""
            };
        }
    }
    return null;
}
