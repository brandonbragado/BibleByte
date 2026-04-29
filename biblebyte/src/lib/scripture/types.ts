export type ScriptureProviderId =
  | "mock"
  | "public_domain"
  | "licensed_niv"
  | "api_bible";

/** Where scripture is rendered — drives policy gates for widgets/push vs in-app. */
export type ScriptureSurface =
  | "bible_reader"
  | "home_daily_verse"
  | "api"
  | "widget"
  | "push";

export type PassageAttribution = {
  translationLabel: string;
  detail: string;
  /** When true, UI must show attribution visibly (footer). */
  requiresVisibleAttribution: boolean;
};

export type VerseLine = {
  verseNumber: number;
  text: string;
};

export type ChapterPassage = {
  bookCode: string;
  bookName: string;
  chapter: number;
  verses: VerseLine[];
  attribution: PassageAttribution;
  providerId: ScriptureProviderId;
  /** True while text is placeholder, stub upstream, or policy-redacted. */
  isPlaceholder: boolean;
  /** Server instructs clients not to cache as offline bundles unless explicitly allowed. */
  suppressOfflineBundle: boolean;
};

/** JSON shape for `GET /api/scripture/chapters` (safe for client `import type`). */
export type ScriptureChapterPayload = {
  bookCode: string;
  bookName: string;
  chapter: number;
  verses: VerseLine[];
  attribution: PassageAttribution;
  providerId: ScriptureProviderId;
  isPlaceholder: boolean;
  suppressOfflineBundle: boolean;
  reference?: string;
  /** True when API.Bible failed and mock placeholder was returned (see env gate). */
  upstreamFallback?: boolean;
  upstreamFallbackNote?: string;
};

/** JSON shape for `GET /api/scripture/passages` and `GET /api/scripture/passage` (client-safe). */
export type ScripturePassagePayload = {
  passageId: string;
  reference: string;
  verses: VerseLine[];
  attribution: PassageAttribution;
  providerId: ScriptureProviderId;
  isPlaceholder: boolean;
  suppressOfflineBundle: boolean;
  copyright?: string;
};

export interface ScriptureProvider {
  readonly id: ScriptureProviderId;
  getChapter(bookCode: string, chapter: number): Promise<ChapterPassage>;
}

// --- API.Bible wire types (response shapes vary slightly by endpoint; extend as needed) ---

export type ApiBibleEnvelope<T> = { data: T };
export type ApiBibleListEnvelope<T> = { data: T[] };

/** https://api.scripture.api.bible/v1/bibles */
export interface Bible {
  id: string;
  dblId?: string;
  abbreviation: string;
  abbreviationLocal?: string;
  name: string;
  nameLocal?: string;
  description?: string;
  language?: {
    id: string;
    name: string;
    nameLocal?: string;
  };
}

/** /v1/bibles/{bibleId}/books */
export interface Book {
  id: string;
  bibleId: string;
  abbreviation: string;
  name: string;
  nameLong?: string;
}

/** /v1/bibles/{bibleId}/books/{bookId}/chapters */
export interface Chapter {
  id: string;
  bibleId: string;
  bookId: string;
  number: string;
  reference?: string;
  content?: string;
  verseCount?: string;
  copyright?: string;
}

/** Verse object when API returns structured verses (e.g. search). */
export interface Verse {
  id: string;
  orgId?: string;
  bookId?: string;
  chapterId?: string;
  bibleId?: string;
  reference: string;
  text?: string;
}

/** /v1/bibles/{bibleId}/passages/{passageId} */
export interface Passage {
  id: string;
  bibleId: string;
  bookId?: string;
  chapterIds?: string[];
  reference: string;
  content: string;
  verseCount?: number;
  copyright?: string;
}

/** /v1/bibles/{bibleId}/search — `data` shape may include verses array */
export interface SearchResult {
  reference: string;
  text: string;
  verseId?: string;
  id?: string;
}

export interface SearchResponseData {
  query?: string;
  total?: number;
  limit?: number;
  offset?: number;
  verses?: Verse[];
}

export class ScriptureApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ScriptureApiError";
  }
}
