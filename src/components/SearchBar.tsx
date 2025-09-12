import React, { useState } from "react";
import { SpotifyAPI } from "../lib/spotify/api";
import { FaSearch, FaPlus } from "react-icons/fa";

const SearchBar: React.FC = () => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SpotifyApi.SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await SpotifyAPI.search(q, ["track", "artist", "album"], 8);
      setResults(res);
    } finally {
      setLoading(false);
    }
  };

  const playTrack = async (uri: string) => {
    await SpotifyAPI.play({ uris: [uri] });
  };

  return (
    <section aria-labelledby="search" className="border border-neon-dim rounded p-3">
      <form onSubmit={doSearch} className="flex gap-2 items-center">
        <label htmlFor="search" className="sr-only">
          Search
        </label>
        <div className="flex items-center gap-2 flex-1 bg-black/40 border border-neon-dim rounded px-2">
          <FaSearch aria-hidden />
          <input
            id="search"
            className="flex-1 bg-transparent outline-none py-2"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tracks, albums, artists"
          />
        </div>
        <button
          className="px-3 py-2 border border-neon-dim rounded hover:bg-neon-green/10"
          type="submit"
          aria-label="Search"
        >
          Search
        </button>
      </form>
      {loading && <div className="mt-2 animate-pulse">Scanning…</div>}
      {results?.tracks && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {results.tracks.items.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-2 p-2 bg-black/30 border border-neon-dim rounded"
            >
              <div className="flex items-center gap-2">
                {t.album.images?.[2]?.url && (
                  <img
                    src={t.album.images[2].url}
                    alt=""
                    className="w-10 h-10 rounded"
                    loading="lazy"
                  />
                )}
                <div>
                  <div className="text-sm">{t.name}</div>
                  <div className="text-xs opacity-75">
                    {(t.artists || []).map((a) => a.name).join(", ")}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-2 py-1 text-xs border border-neon-dim rounded hover:bg-neon-green/10"
                  onClick={() => playTrack(t.uri)}
                  aria-label={`Play ${t.name}`}
                >
                  Play
                </button>
                <button
                  className="px-2 py-1 text-xs border border-neon-dim rounded hover:bg-neon-green/10"
                  onClick={async () => {
                    await SpotifyAPI.addTracksToPlaylist("queue", [t.uri] as any);
                  }}
                  aria-label={`Queue ${t.name}`}
                  title="Add to Queue"
                >
                  <FaPlus aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default SearchBar;