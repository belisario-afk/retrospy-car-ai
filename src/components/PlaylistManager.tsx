import React, { useEffect, useState } from "react";
import { SpotifyAPI } from "../lib/spotify/api";
import type {
  CurrentUsersProfileResponse,
  ListOfCurrentUsersPlaylistsResponse,
  PlaylistFull,
  PlaylistSimplified,
  Device
} from "../lib/spotify/types";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

const PlaylistManager: React.FC<{
  fallbackDevices: Device[] | null;
}> = ({ fallbackDevices }) => {
  const [playlists, setPlaylists] = useState<ListOfCurrentUsersPlaylistsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [me, setMe] = useState<CurrentUsersProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const meRes = await SpotifyAPI.me();
        setMe(meRes);
        const pls = await SpotifyAPI.myPlaylists(20);
        setPlaylists(pls);
      } catch (e: unknown) {
        setError(getErrorMessage(e) || "Failed to load playlists. Check authentication and scopes.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const createPlaylist = async () => {
    if (!newName.trim() || !me) return;
    const pl = (await SpotifyAPI.createPlaylist(me.id, newName, "Created from RetroSpy", false)) as PlaylistFull;
    setPlaylists((prev: ListOfCurrentUsersPlaylistsResponse | null) => {
      const simplified: PlaylistSimplified = {
        id: pl.id,
        name: pl.name,
        uri: pl.uri,
        images: pl.images,
        tracks: pl.tracks
      };
      if (prev) {
        return { ...prev, items: [simplified, ...prev.items] };
      }
      return { href: "", items: [simplified], limit: 1, next: null, offset: 0, previous: null, total: 1 };
    });
    setNewName("");
  };

  return (
    <section aria-labelledby="playlists" className="border border-neon-dim rounded p-3">
      <div className="flex items-center justify-between">
        <h2 id="playlists" className="text-lg">
          Playlists
        </h2>
        <div className="text-xs opacity-70">
          Devices: {fallbackDevices?.map((d) => d.name).join(", ") || "—"}
        </div>
      </div>

      {error && <div className="mt-2 text-red-400 text-sm">{error}</div>}

      <div className="mt-2 flex gap-2">
        <input
          className="flex-1 bg-black/40 border border-neon-dim rounded px-2 py-1"
          placeholder="New playlist name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          aria-label="New playlist name"
        />
        <button
          className="px-3 py-1 border border-neon-dim rounded hover:bg-neon-green/10"
          onClick={createPlaylist}
          aria-label="Create playlist"
        >
          Create
        </button>
      </div>

      {loading && <div className="mt-2 animate-pulse">Loading playlists…</div>}

      <div className="mt-3 max-h-64 overflow-auto space-y-2 pr-1">
        {playlists?.items?.map((pl: PlaylistSimplified) => (
          <div
            key={pl.id}
            className="flex items-center justify-between p-2 bg-black/30 border border-neon-dim rounded"
          >
            <div className="flex items-center gap-2">
              {pl.images?.[0]?.url && (
                <img src={pl.images[0].url} alt="" className="w-10 h-10 rounded" loading="lazy" />
              )}
              <div>
                <div className="text-sm">{pl.name}</div>
                <div className="text-xs opacity-70">{pl.tracks.total} tracks</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="px-2 py-1 text-xs border border-neon-dim rounded hover:bg-neon-green/10"
                onClick={async () => {
                  await SpotifyAPI.play({ context_uri: pl.uri });
                }}
              >
                Play
              </button>
              <button
                className="px-2 py-1 text-xs border border-neon-dim rounded hover:bg-neon-green/10"
                onClick={() => {
                  alert("Add tracks via Search, then save to playlists from track menus.");
                }}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
        {!playlists?.items?.length && !loading && !error && (
          <div className="opacity-75 text-sm">No playlists found.</div>
        )}
      </div>
    </section>
  );
};

export default PlaylistManager;