export interface Anime {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  genres: string[];
  rating?: string | number;
  releaseYear?: string | number;
  contentType: 'TV Series' | 'Movie' | string;
  availableDubs: string[];
  status?: string;
  totalEpisodes?: number;
  views?: number;
  trending?: boolean;
}

export interface Episode {
  id: string;
  animeId: string;
  animeTitle?: string;
  title: string;
  episodeNumber: number;
  seasonNumber?: number;
  thumbnailUrl?: string;
  durationFormatted?: string;
  duration?: string | number;
  availableDubs?: string[];
  createdAt?: any;
}

export interface Banner {
  id: string;
  title?: string;
  imageUrl?: string;
  bannerUrl?: string;
  backdropUrl?: string;
  animeId?: string;
  episodeId?: string;
  linkType?: 'anime' | 'episode' | 'external';
  description?: string;
  order?: number;
  active?: boolean;
}

export interface AppSettings {
  apkDownloadUrl?: string;
  appName?: string;
  latestVersion?: string;
  systemNotice?: {
    enabled?: boolean;
    title?: string;
    message?: string;
    type?: 'info' | 'warning' | 'alert';
  };
  packageName?: string;
}
