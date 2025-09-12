// Assist TS for Spotify types if missing in environment.
declare namespace SpotifyApi {
  interface SearchResponse {
    tracks?: {
      items: any[];
    };
  }
}