// Ensure minimal Spotify API typings for this component in case of missing global types
declare namespace SpotifyApi {
  interface TrackObjectFull {
    id: string;
    name: string;
    uri: string;
    artists: { name: string }[];
    album: { images: { url: string }[] };
    duration_ms: number;
  }
}