import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { Anime, Episode, Banner, AppSettings } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyCzE4Ge6OAxj1IZamnFG71LxvykzD8AvRk",
  authDomain: "anime-trix-734fa.firebaseapp.com",
  databaseURL: "https://anime-trix-734fa-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "anime-trix-734fa",
  storageBucket: "anime-trix-734fa.firebasestorage.app",
  messagingSenderId: "863862205113",
  appId: "1:863862205113:web:910129db6fc8f0f3638968",
  measurementId: "G-LHC0PJXP4X"
};

// Initialize Firebase safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Initialize analytics if supported
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      try {
        getAnalytics(app);
      } catch (e) {
        console.warn('Analytics initialization skipped:', e);
      }
    }
  });
}

/**
 * Normalizes raw Firestore document data to Anime interface
 * with thorough fallbacks per prompt specification
 */
export function normalizeAnimeDoc(id: string, data: DocumentData): Anime {
  // Genres parsing
  let genres: string[] = [];
  if (Array.isArray(data.genres)) {
    genres = data.genres.filter(Boolean);
  } else if (typeof data.genre === 'string') {
    genres = data.genre.split(',').map((g: string) => g.trim()).filter(Boolean);
  } else if (typeof data.category === 'string') {
    genres = data.category.split(',').map((c: string) => c.trim()).filter(Boolean);
  } else if (Array.isArray(data.category)) {
    genres = data.category.filter(Boolean);
  }

  // Available Dubs: strictly use Admin-configured availableDubs / dubs / languages array
  // (do NOT show "Original Audio" unless explicitly present in that array)
  let availableDubs: string[] = [];
  if (Array.isArray(data.availableDubs)) {
    availableDubs = data.availableDubs.filter(Boolean);
  } else if (Array.isArray(data.dubs)) {
    availableDubs = data.dubs.filter(Boolean);
  } else if (Array.isArray(data.languages)) {
    availableDubs = data.languages.filter(Boolean);
  } else if (typeof data.availableDubs === 'string') {
    availableDubs = data.availableDubs.split(',').map((d: string) => d.trim()).filter(Boolean);
  } else if (typeof data.dubs === 'string') {
    availableDubs = data.dubs.split(',').map((d: string) => d.trim()).filter(Boolean);
  }

  const title = (data.title || data.name || data.animeTitle || 'Untitled Anime').toString().trim();
  const description = (data.description || data.synopsis || data.summary || data.overview || 'No synopsis provided.').toString().trim();
  const posterUrl = (data.posterUrl || data.poster || data.thumbnailUrl || data.imageUrl || data.coverUrl || '').toString().trim();
  const backdropUrl = (data.backdropUrl || data.bannerUrl || data.coverImage || posterUrl || '').toString().trim();
  const contentType = (data.type || data.contentType || data.format || 'TV Series').toString();
  const rating = data.rating || data.score || data.imdbRating || '';
  const releaseYear = data.releaseYear || data.year || '';

  return {
    id,
    title,
    description,
    posterUrl,
    backdropUrl,
    genres,
    rating,
    releaseYear,
    contentType,
    availableDubs,
    status: data.status || '',
    totalEpisodes: typeof data.totalEpisodes === 'number' ? data.totalEpisodes : undefined,
    views: typeof data.views === 'number' ? data.views : undefined,
    trending: Boolean(data.trending || data.isTrending || data.featured),
  };
}

/**
 * Normalizes Episode doc data (METADATA ONLY — NEVER STREAMS VIDEO)
 */
export function normalizeEpisodeDoc(id: string, data: DocumentData): Episode {
  let episodeNum = 1;
  if (typeof data.episodeNumber === 'number') {
    episodeNum = data.episodeNumber;
  } else if (data.episodeNumber) {
    const parsed = parseInt(data.episodeNumber, 10);
    if (!isNaN(parsed)) episodeNum = parsed;
  } else if (typeof data.number === 'number') {
    episodeNum = data.number;
  } else if (data.ep) {
    const parsed = parseInt(data.ep, 10);
    if (!isNaN(parsed)) episodeNum = parsed;
  }

  const title = (data.title || data.name || `Episode ${episodeNum}`).toString().trim();
  const animeId = (data.animeId || data.showId || '').toString().trim();
  const animeTitle = (data.animeTitle || data.seriesTitle || '').toString().trim();
  const thumbnailUrl = (data.thumbnailUrl || data.thumbnail || data.posterUrl || data.coverUrl || '').toString().trim();
  const durationFormatted = (data.durationFormatted || data.durationString || (data.duration ? `${data.duration}m` : '')).toString().trim();

  let availableDubs: string[] = [];
  if (Array.isArray(data.availableDubs)) {
    availableDubs = data.availableDubs;
  } else if (Array.isArray(data.dubs)) {
    availableDubs = data.dubs;
  }

  return {
    id,
    animeId,
    animeTitle,
    title,
    episodeNumber: episodeNum,
    seasonNumber: typeof data.seasonNumber === 'number' ? data.seasonNumber : 1,
    thumbnailUrl,
    durationFormatted,
    duration: data.duration,
    availableDubs,
    createdAt: data.createdAt,
  };
}

/**
 * Fetch all anime from 'anime' and 'animes' collections, merged seamlessly
 */
export async function fetchAnimeList(): Promise<Anime[]> {
  try {
    const resultsMap = new Map<string, Anime>();

    // 1. Try 'anime' collection
    try {
      const snap = await getDocs(collection(db, 'anime'));
      snap.forEach((docSnap) => {
        if (docSnap.exists()) {
          resultsMap.set(docSnap.id, normalizeAnimeDoc(docSnap.id, docSnap.data()));
        }
      });
    } catch (e) {
      console.warn('Could not read anime collection', e);
    }

    // 2. Try 'animes' collection if present to merge
    try {
      const snap2 = await getDocs(collection(db, 'animes'));
      snap2.forEach((docSnap) => {
        if (docSnap.exists() && !resultsMap.has(docSnap.id)) {
          resultsMap.set(docSnap.id, normalizeAnimeDoc(docSnap.id, docSnap.data()));
        }
      });
    } catch (e) {
      // Ignore if doesn't exist
    }

    return Array.from(resultsMap.values());
  } catch (err) {
    console.error('Error fetching anime list:', err);
    return [];
  }
}

/**
 * Fetch single anime by ID
 */
export async function fetchAnimeById(animeId: string): Promise<Anime | null> {
  if (!animeId) return null;
  try {
    // Check 'anime' collection
    const docRef = doc(db, 'anime', animeId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return normalizeAnimeDoc(snap.id, snap.data());
    }

    // Check 'animes' collection
    const docRef2 = doc(db, 'animes', animeId);
    const snap2 = await getDoc(docRef2);
    if (snap2.exists()) {
      return normalizeAnimeDoc(snap2.id, snap2.data());
    }

    return null;
  } catch (err) {
    console.error(`Error fetching anime ${animeId}:`, err);
    return null;
  }
}

/**
 * Fetch episodes for a specific anime
 * Queries top-level 'episodes' where animeId == animeId, and subcollection anime/{animeId}/episodes
 */
export async function fetchEpisodesForAnime(animeId: string): Promise<Episode[]> {
  if (!animeId) return [];
  const episodesMap = new Map<string, Episode>();

  try {
    // 1. Query top-level episodes where animeId == animeId
    try {
      const q = query(collection(db, 'episodes'), where('animeId', '==', animeId));
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        if (docSnap.exists()) {
          const ep = normalizeEpisodeDoc(docSnap.id, docSnap.data());
          episodesMap.set(ep.id, ep);
        }
      });
    } catch (e) {
      console.warn('Error querying root episodes collection:', e);
    }

    // 2. Query subcollection anime/{animeId}/episodes
    try {
      const subSnap = await getDocs(collection(db, 'anime', animeId, 'episodes'));
      subSnap.forEach((docSnap) => {
        if (docSnap.exists()) {
          const ep = normalizeEpisodeDoc(docSnap.id, {
            ...docSnap.data(),
            animeId: docSnap.data().animeId || animeId,
          });
          episodesMap.set(ep.id, ep);
        }
      });
    } catch (e) {
      // Subcollection might not exist or need rules
    }

    // Sort by episode number ascending
    return Array.from(episodesMap.values()).sort((a, b) => a.episodeNumber - b.episodeNumber);
  } catch (err) {
    console.error(`Error fetching episodes for anime ${animeId}:`, err);
    return [];
  }
}

/**
 * Fetch a single episode by ID
 * Tries direct 'episodes/{episodeId}', or searches within animeId subcollections
 */
export async function fetchEpisodeById(episodeId: string, animeId?: string): Promise<{ episode: Episode | null; parentAnime: Anime | null }> {
  if (!episodeId) return { episode: null, parentAnime: null };

  try {
    let foundEpisode: Episode | null = null;
    let targetAnimeId = animeId || '';

    // If animeId provided, check subcollection first
    if (targetAnimeId) {
      try {
        const subDoc = await getDoc(doc(db, 'anime', targetAnimeId, 'episodes', episodeId));
        if (subDoc.exists()) {
          foundEpisode = normalizeEpisodeDoc(subDoc.id, {
            ...subDoc.data(),
            animeId: targetAnimeId,
          });
        }
      } catch (e) {
        // Continue to other checks
      }
    }

    // Try root 'episodes/{episodeId}'
    if (!foundEpisode) {
      try {
        const rootDoc = await getDoc(doc(db, 'episodes', episodeId));
        if (rootDoc.exists()) {
          foundEpisode = normalizeEpisodeDoc(rootDoc.id, rootDoc.data());
          if (!targetAnimeId && foundEpisode.animeId) {
            targetAnimeId = foundEpisode.animeId;
          }
        }
      } catch (e) {
        // Continue
      }
    }

    // If still not found and animeId provided, list all subcollection episodes to find by episodeNumber or id
    if (!foundEpisode && targetAnimeId) {
      const episodes = await fetchEpisodesForAnime(targetAnimeId);
      const match = episodes.find((e) => e.id === episodeId || e.episodeNumber.toString() === episodeId);
      if (match) {
        foundEpisode = match;
      }
    }

    // Fetch parent anime if we have targetAnimeId
    let parentAnime: Anime | null = null;
    if (targetAnimeId) {
      parentAnime = await fetchAnimeById(targetAnimeId);
    }

    // If parent anime exists and episode animeTitle is empty, fill it
    if (foundEpisode && parentAnime && !foundEpisode.animeTitle) {
      foundEpisode.animeTitle = parentAnime.title;
    }

    return { episode: foundEpisode, parentAnime };
  } catch (err) {
    console.error(`Error fetching episode ${episodeId}:`, err);
    return { episode: null, parentAnime: null };
  }
}

/**
 * Fetch latest episodes across the app
 */
export async function fetchLatestEpisodes(limitCount: number = 12): Promise<Episode[]> {
  try {
    const q = query(collection(db, 'episodes'), limit(limitCount));
    const snap = await getDocs(q);
    const episodes: Episode[] = [];
    snap.forEach((docSnap) => {
      if (docSnap.exists()) {
        episodes.push(normalizeEpisodeDoc(docSnap.id, docSnap.data()));
      }
    });
    return episodes;
  } catch (err) {
    console.warn('Could not fetch latest episodes root collection:', err);
    return [];
  }
}

/**
 * Fetch homepage hero banners
 */
export async function fetchBanners(): Promise<Banner[]> {
  try {
    const snap = await getDocs(collection(db, 'banners'));
    const banners: Banner[] = [];
    snap.forEach((docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        if (d.active !== false) {
          banners.push({
            id: docSnap.id,
            title: d.title || d.name || '',
            imageUrl: d.imageUrl || d.image || d.bannerUrl || d.backdropUrl || '',
            bannerUrl: d.bannerUrl || d.backdropUrl || d.imageUrl || '',
            backdropUrl: d.backdropUrl || d.imageUrl || '',
            animeId: d.animeId || d.showId || '',
            episodeId: d.episodeId || '',
            linkType: d.linkType || (d.episodeId ? 'episode' : 'anime'),
            description: d.description || d.subtitle || '',
            order: typeof d.order === 'number' ? d.order : 0,
            active: d.active !== false,
          });
        }
      }
    });

    return banners.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (err) {
    console.warn('Error fetching banners:', err);
    return [];
  }
}

/**
 * Fetch app settings from appConfig/settings document
 */
export async function fetchAppSettings(): Promise<AppSettings> {
  try {
    const docRef = doc(db, 'appConfig', 'settings');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as AppSettings;
    }
    return {};
  } catch (err) {
    console.warn('Error fetching appConfig/settings:', err);
    return {};
  }
}
