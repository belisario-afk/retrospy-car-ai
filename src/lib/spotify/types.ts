// Minimal shared types to stabilize builds across @types/spotify-api versions.

export interface Image {
  url: string;
  height?: number;
  width?: number;
}

export interface Artist {
  id: string;
  name: string;
}

export interface Album {
  images: Image[];
}

export interface Track {
  id: string;
  name: string;
  uri: string;
  artists: Artist[];
  album: Album;
  duration_ms: number;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  is_private_session?: boolean;
  is_restricted?: boolean;
  volume_percent?: number | null;
}

export interface UserDevicesResponse {
  devices: Device[];
}

export interface PlaylistTracksRef {
  total: number;
}

export interface PlaylistSimplified {
  id: string;
  name: string;
  uri?: string;
  images?: Image[];
  tracks: PlaylistTracksRef;
}

export interface PlaylistFull extends PlaylistSimplified {}

export interface ListOfCurrentUsersPlaylistsResponse {
  href?: string;
  items: PlaylistSimplified[];
  limit?: number;
  next?: string | null;
  offset?: number;
  previous?: string | null;
  total?: number;
}

export interface CurrentUsersProfileResponse {
  id: string;
  display_name?: string;
}

export interface SearchResponse {
  tracks?: {
    items: Track[];
  };
}

export interface CurrentlyPlayingResponse {
  item?: Track | null;
  is_playing?: boolean;
  progress_ms?: number;
}

export type CurrentPlayback = {
  is_playing: boolean;
  progress_ms: number;
  item: Track | null;
  device?: Device;
  shuffle_state?: boolean;
  repeat_state?: "off" | "track" | "context" | string;
};