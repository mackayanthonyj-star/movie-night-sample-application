<script lang="ts">
    import { onMount } from "svelte";

    type Movie = {
        id: number;
        title: string;
        poster_path: string | null;
        vote_average: number;
        release_date: string;
    };

    type MovieDetail = Movie & {
        overview: string;
        runtime: number;
        backdrop_path: string | null;
        genres: { id: number; name: string }[];
        credits: {
            cast: {
                id: number;
                name: string;
                character: string;
                profile_path: string | null;
            }[];
        };
    };

    type Category = {
        label: string;
        endpoint: string;
    };

    const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
    const BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";

    const categories: Category[] = [
        { label: "Popular", endpoint: "movie/popular" },
        { label: "Top Rated", endpoint: "movie/top_rated" },
        { label: "Now Playing", endpoint: "movie/now_playing" },
        { label: "Upcoming", endpoint: "movie/upcoming" },
    ];

    let activeCategory = $state(categories[0]);
    let movies = $state<Movie[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    let selectedMovie = $state<MovieDetail | null>(null);
    let modalLoading = $state(false);

    async function loadMovies(category: Category) {
        loading = true;
        error = null;
        movies = [];
        try {
            const res = await fetch(
                `/api/movies?endpoint=${category.endpoint}`,
            );
            const data = await res.json();
            movies = data.results;
        } catch (e) {
            error = "Failed to load movies.";
        } finally {
            loading = false;
        }
    }

    async function selectCategory(category: Category) {
        activeCategory = category;
        await loadMovies(category);
    }

    onMount(() => loadMovies(activeCategory));

    async function openModal(id: number) {
        modalLoading = true;
        selectedMovie = null;
        const res = await fetch(
            `/api/movies?endpoint=movie/${id}&append_to_response=credits`,
        );
        selectedMovie = await res.json();
        modalLoading = false;
    }

    function closeModal() {
        selectedMovie = null;
        modalLoading = false;
    }

    function onBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) closeModal();
    }

    function onKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") closeModal();
    }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="min-h-screen bg-white">
    <!-- Banner -->
    <div class="p-9 text-white bg-blue-500">
        <h1 class="text-2xl font-bold tracking-tight">Movie Night</h1>
        <p class="text-blue-100 text-sm mt-1">Powered by TMDB</p>
    </div>

    <!-- Tabs -->
    <div class="border-b border-slate-200 bg-white sticky top-0 z-10 px-6">
        <div class="flex gap-1">
            {#each categories as category}
                <button
                    onclick={() => selectCategory(category)}
                    class="px-4 py-3 text-sm font-medium transition-all duration-150 border-b-2 -mb-px
                        {activeCategory.endpoint === category.endpoint
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}"
                >
                    {category.label}
                </button>
            {/each}
        </div>
    </div>

    <!-- Grid -->
    {#if loading}
        <div class="flex justify-center items-center h-64">
            <p class="text-blue-400 text-lg">Loading Movies...</p>
        </div>
    {:else if error}
        <div class="flex justify-center items-center h-64">
            <p class="text-red-400">{error}</p>
        </div>
    {:else}
        <div
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-6"
        >
            {#each movies as movie (movie.id)}
                <button
                    onclick={() => openModal(movie.id)}
                    class="group cursor-pointer text-left"
                >
                    <div
                        class="rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shadow hover:shadow-blue-900/50 hover:border-blue-500 transition-all duration-200"
                    >
                        {#if movie.poster_path}
                            <img
                                src={`${IMAGE_BASE}${movie.poster_path}`}
                                alt={movie.title}
                                class="w-full object-cover group-hover:opacity-80 transition-opacity duration-200"
                            />
                        {:else}
                            <div
                                class="w-full h-64 bg-slate-700 flex items-center justify-center"
                            >
                                <span class="text-slate-400 text-sm"
                                    >No Image</span
                                >
                            </div>
                        {/if}
                        <div class="p-2">
                            <p
                                class="text-slate-100 text-base font-medium truncate"
                            >
                                {movie.title}
                            </p>
                            <div class="flex items-center justify-between mt-1">
                                <p class="text-slate-400 text-sm">
                                    {movie.release_date?.slice(0, 4)}
                                </p>
                                <span
                                    class="text-yellow-400 text-sm font-semibold"
                                >
                                    ★ {movie.vote_average.toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </div>
                </button>
            {/each}
        </div>
    {/if}
</div>

<!-- Modal overlay -->
{#if modalLoading || selectedMovie}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-50 p-4"
        onclick={onBackdropClick}
    >
        <div
            class="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl shadow-blue-950"
        >
            {#if modalLoading}
                <div class="flex items-center justify-center h-64">
                    <p class="text-blue-300">Loading...</p>
                </div>
            {:else if selectedMovie}
                <!-- Backdrop -->
                <div class="relative h-48 w-full">
                    {#if selectedMovie.backdrop_path}
                        <img
                            src={`${BACKDROP_BASE}${selectedMovie.backdrop_path}`}
                            alt={selectedMovie.title}
                            class="w-full h-full object-cover opacity-50"
                        />
                    {/if}
                    <div
                        class="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"
                    />

                    <!-- Close button -->
                    <button
                        onclick={closeModal}
                        class="absolute top-3 right-3 text-white bg-blue-500/70 hover:bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <!-- Content -->
                <div class="flex gap-4 p-5 -mt-12 relative">
                    {#if selectedMovie.poster_path}
                        <img
                            src={`${IMAGE_BASE}${selectedMovie.poster_path}`}
                            alt={selectedMovie.title}
                            class="w-28 rounded-lg shadow-lg shadow-blue-950 shrink-0 self-start"
                        />
                    {/if}

                    <div class="flex flex-col gap-2 pt-12">
                        <h2 class="text-xl font-bold text-white">
                            {selectedMovie.title}
                        </h2>

                        <div class="flex flex-wrap items-center gap-2 text-sm">
                            <span class="text-yellow-400 font-semibold">
                                ★ {selectedMovie.vote_average?.toFixed(1)}
                            </span>
                            <span class="text-slate-400"
                                >{selectedMovie.release_date?.slice(0, 4)}</span
                            >
                            {#if selectedMovie.runtime}
                                <span class="text-slate-400"
                                    >{selectedMovie.runtime} min</span
                                >
                            {/if}
                            {#each selectedMovie.genres ?? [] as genre}
                                <span
                                    class="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full text-xs"
                                >
                                    {genre.name}
                                </span>
                            {/each}
                        </div>

                        <p class="text-slate-300 text-sm leading-relaxed">
                            {selectedMovie.overview}
                        </p>
                    </div>
                </div>

                <!-- Cast -->
                {#if selectedMovie.credits?.cast?.length}
                    <div class="px-5 pb-5">
                        <h3
                            class="text-blue-300 font-semibold mb-3 uppercase tracking-wider text-xs"
                        >
                            Cast
                        </h3>
                        <div class="flex gap-3 overflow-x-auto pb-2">
                            {#each selectedMovie.credits.cast.slice(0, 10) as member (member.id)}
                                <div class="shrink-0 w-16 text-center">
                                    {#if member.profile_path}
                                        <img
                                            src={`${IMAGE_BASE}${member.profile_path}`}
                                            alt={member.name}
                                            class="w-16 h-16 rounded-full object-cover mx-auto ring-2 ring-blue-500/30"
                                        />
                                    {:else}
                                        <div
                                            class="w-16 h-16 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center mx-auto"
                                        >
                                            <span class="text-slate-400 text-xs"
                                                >?</span
                                            >
                                        </div>
                                    {/if}
                                    <p
                                        class="text-slate-200 text-xs mt-1 truncate"
                                    >
                                        {member.name}
                                    </p>
                                    <p class="text-slate-500 text-xs truncate">
                                        {member.character}
                                    </p>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            {/if}
        </div>
    </div>
{/if}
