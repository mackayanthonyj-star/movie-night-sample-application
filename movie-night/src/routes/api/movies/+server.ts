import { TMDB_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

export async function GET({ url }) {
    const endpoint = url.searchParams.get('endpoint');
    const res = await fetch(`https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}`);
    const data = await res.json();
    return json(data);
    
}