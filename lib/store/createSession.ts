/**
 * Create session store — single source of truth for the design generation flow.
 * Persists to sessionStorage for refresh resilience.
 */

const STORAGE_KEY = "keepsy_create_session_v1";
const MAX_REFINEMENTS = 3;

export type CreateSessionState = {
  sessionId: string;
  basePrompt: string;
  currentPrompt: string;
  currentImageUrl: string | null;
  history: Array<{ prompt: string; imageUrl: string; createdAt: number }>;
  refinementCount: number;
  maxRefinements: number;
};

type Listener = () => void;

let state: CreateSessionState = {
  sessionId: "",
  basePrompt: "",
  currentPrompt: "",
  currentImageUrl: null,
  history: [],
  refinementCount: 0,
  maxRefinements: MAX_REFINEMENTS,
};

const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    const toStore = {
      sessionId: state.sessionId,
      basePrompt: state.basePrompt,
      currentPrompt: state.currentPrompt,
      currentImageUrl: state.currentImageUrl,
      refinementCount: state.refinementCount,
      historyLength: state.history.length,
    };
    let json = JSON.stringify(toStore);
    if (json.length > 4 * 1024 * 1024) {
      toStore.currentImageUrl = null;
      json = JSON.stringify(toStore);
    }
    window.sessionStorage.setItem(STORAGE_KEY, json);
  } catch {
    try {
      const fallback = {
        sessionId: state.sessionId,
        basePrompt: state.basePrompt,
        currentPrompt: state.currentPrompt,
        currentImageUrl: null,
        refinementCount: state.refinementCount,
      };
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    } catch {
      // ignore storage errors (quota, private mode, etc.)
    }
  }
}

function hydrate() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<CreateSessionState>;
    if (parsed.sessionId && typeof parsed.currentPrompt === "string") {
      state = {
        sessionId: parsed.sessionId,
        basePrompt: parsed.basePrompt ?? parsed.currentPrompt ?? "",
        currentPrompt: parsed.currentPrompt,
        currentImageUrl: typeof parsed.currentImageUrl === "string" ? parsed.currentImageUrl : null,
        history: [],
        refinementCount: typeof parsed.refinementCount === "number" ? parsed.refinementCount : 0,
        maxRefinements: MAX_REFINEMENTS,
      };
      emit();
    }
  } catch {
    // ignore malformed stored data
  }
}

hydrate();

export function getCreateSessionSnapshot(): CreateSessionState {
  return state;
}

export function subscribeCreateSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setInitialGeneration(args: { prompt: string; imageUrl: string }): void {
  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  state = {
    sessionId: id,
    basePrompt: args.prompt,
    currentPrompt: args.prompt,
    currentImageUrl: args.imageUrl,
    history: [{ prompt: args.prompt, imageUrl: args.imageUrl, createdAt: Date.now() }],
    refinementCount: 0,
    maxRefinements: MAX_REFINEMENTS,
  };
  persist();
  emit();
}

export function applyRefinementResult(args: { imageUrl: string; prompt: string }): void {
  if (state.refinementCount >= state.maxRefinements) return;
  state = {
    ...state,
    currentPrompt: args.prompt,
    currentImageUrl: args.imageUrl,
    history: [
      ...state.history,
      { prompt: args.prompt, imageUrl: args.imageUrl, createdAt: Date.now() },
    ],
    refinementCount: state.refinementCount + 1,
  };
  persist();
  emit();
}

export function canRefine(): boolean {
  return state.refinementCount < state.maxRefinements;
}

export function getRefinementsLeft(): number {
  return Math.max(0, state.maxRefinements - state.refinementCount);
}

export function resetSession(): void {
  state = {
    sessionId: "",
    basePrompt: "",
    currentPrompt: "",
    currentImageUrl: null,
    history: [],
    refinementCount: 0,
    maxRefinements: MAX_REFINEMENTS,
  };
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
  emit();
}

export function hasActiveSession(): boolean {
  return Boolean(state.sessionId && state.currentImageUrl);
}
