// Minimal shared types to stabilize builds across @types/spotify-api versions.

export type CurrentPlayback = {
  is_playing: boolean;
  progress_ms: number;
  item: SpotifyApi.TrackObjectFull | null;
  device?: SpotifyApi.DeviceObject;
  shuffle_state?: boolean;
  repeat_state?: "off" | "track" | "context" | string;
};