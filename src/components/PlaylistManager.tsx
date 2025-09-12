import React, { useEffect, useState } from "react";
import { SpotifyAPI } from "../lib/spotify/api";

const PlaylistManager: React.FC<{
  fallbackDevices: SpotifyApi.UserDevice[] | null;
}> = ({ fallbackDevices }) => {
  const [playlists, setPlaylists] = useState<SpotifyApi.ListOfCurrentUsersPlaylistsResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [me, setMe] = useState<SpotifyApi.CurrentUsersProfileResponse | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const meRes = await SpotifyAPI.me();
        setMe(meRes);
        const pls = await SpotifyAPI.myPlaylists(20);
        setPlaylists(pls);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const createPlaylist = async () => {
    if (!newName.trim() || !me) return;
    const pl = await SpotifyAPI.createPlaylist(me.id, newName, "Created from RetroSpy", false);
    setPlaylists((prev) =>
      prev
        ? { ...prev, items: [pl as any, ...prev.items] }
        : ({ items: [pl] } as unknown as SpotifyApi.ListOfCurrentUsersPlaylistsResponse)
    );
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
        {playlists?.items?.map((pl) => (
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
                onClick={async () => {
                  // Save a demo track if present (no track picker in this minimal editor)
                  // In real use, this would open track selection
                  alert("Add tracks via Search, then save to playlists from track menus.");
                }}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
        {!playlists?.items?.length && <div className="opacity-75 text-sm">No playlists found.</div>}
      </div>
    </section>
  );
};

export default PlaylistManager;