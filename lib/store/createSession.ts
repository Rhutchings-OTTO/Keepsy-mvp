/**
 * Create session store — single source of truth for the design flow.
 *
 * The session is a TREE of design nodes. Every generation, refinement or
 * uploaded original photo becomes a node; refinements point at the node they
 * were made from (`parentId`). Selecting an earlier node makes it current, so
 * the next refinement branches from that exact image and previews/basket/print
 * all use it. Nothing is ever deleted by a failed generation.
 *
 * Persisted to sessionStorage for refresh resilience. Data URLs are dropped
 * from persistence when a permanent https URL exists for the node.
 */

const STORAGE_KEY = "keepsy_create_session_v2";
const LEGACY_STORAGE_KEY = "keepsy_create_session_v1";
const MAX_REFINEMENTS = 3;

export type DesignNodeKind = "generation" | "refinement" | "original";

export type DesignNode = {
  id: string;
  parentId: string | null;
  kind: DesignNodeKind;
  prompt: string;
  /** Preview URL (https when available, otherwise a data URL). */
  imageUrl: string;
  /** Permanent https URL for checkout/fulfilment, when hosting succeeded. */
  designUrl: string | null;
  /** Pixel size of the print source when known (original photos). */
  width?: number;
  height?: number;
  createdAt: number;
};

export type CreateSessionState = {
  sessionId: string;
  basePrompt: string;
  nodes: DesignNode[];
  currentNodeId: string | null;
  refinementCount: number;
  maxRefinements: number;
  // Derived, kept for backwards compatibility with existing consumers.
  currentPrompt: string;
  currentImageUrl: string | null;
  currentDesignUrl: string | null;
  currentNode: DesignNode | null;
};

type Listener = () => void;

function emptyState(): CreateSessionState {
  return {
    sessionId: "",
    basePrompt: "",
    nodes: [],
    currentNodeId: null,
    refinementCount: 0,
    maxRefinements: MAX_REFINEMENTS,
    currentPrompt: "",
    currentImageUrl: null,
    currentDesignUrl: null,
    currentNode: null,
  };
}

let state: CreateSessionState = emptyState();
const listeners = new Set<Listener>();

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function rootOf(nodes: DesignNode[], id: string | null): string | null {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let cursor = id ? byId.get(id) ?? null : null;
  while (cursor && cursor.parentId && byId.has(cursor.parentId)) cursor = byId.get(cursor.parentId)!;
  return cursor?.id ?? null;
}

/** "3 edits per design": refinements are counted per root design, not per session. */
function refinementsUsedFor(nodes: DesignNode[], currentNodeId: string | null): number {
  const root = rootOf(nodes, currentNodeId);
  if (!root) return 0;
  return nodes.filter((n) => n.kind === "refinement" && rootOf(nodes, n.id) === root).length;
}

function withDerived(
  next: Omit<CreateSessionState, "currentPrompt" | "currentImageUrl" | "currentDesignUrl" | "currentNode" | "refinementCount"> & {
    refinementCount?: number;
  }
): CreateSessionState {
  const current = next.nodes.find((n) => n.id === next.currentNodeId) ?? null;
  return {
    ...next,
    refinementCount: refinementsUsedFor(next.nodes, next.currentNodeId),
    currentNode: current,
    currentPrompt: current?.prompt ?? next.basePrompt,
    currentImageUrl: current?.imageUrl ?? null,
    currentDesignUrl: current?.designUrl ?? null,
  };
}

function emit() {
  listeners.forEach((l) => l());
}

function serialisable(): unknown {
  return {
    v: 2,
    sessionId: state.sessionId,
    basePrompt: state.basePrompt,
    currentNodeId: state.currentNodeId,
    refinementCount: state.refinementCount,
    nodes: state.nodes.map((n) => ({
      ...n,
      // Keep a data URL only when there is no permanent URL to fall back to.
      imageUrl: n.imageUrl.startsWith("data:") && n.designUrl ? n.designUrl : n.imageUrl,
    })),
  };
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    let json = JSON.stringify(serialisable());
    if (json.length > 4 * 1024 * 1024) {
      // Too big (several data URLs): keep only the current node's data URL.
      const slim = serialisable() as { nodes: DesignNode[]; currentNodeId: string | null };
      slim.nodes = slim.nodes.map((n) =>
        n.id !== slim.currentNodeId && n.imageUrl.startsWith("data:") ? { ...n, imageUrl: n.designUrl ?? "" } : n
      );
      json = JSON.stringify(slim);
    }
    window.sessionStorage.setItem(STORAGE_KEY, json);
  } catch {
    // ignore storage errors (quota, private mode, etc.)
  }
}

function isNode(value: unknown): value is DesignNode {
  if (!value || typeof value !== "object") return false;
  const n = value as Record<string, unknown>;
  return typeof n.id === "string" && typeof n.imageUrl === "string" && typeof n.prompt === "string";
}

function hydrate() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<{
        sessionId: string;
        basePrompt: string;
        currentNodeId: string | null;
        refinementCount: number;
        nodes: unknown[];
      }>;
      if (parsed.sessionId && Array.isArray(parsed.nodes)) {
        const nodes = parsed.nodes.filter(isNode).filter((n) => n.imageUrl);
        const currentNodeId =
          nodes.find((n) => n.id === parsed.currentNodeId)?.id ?? nodes[nodes.length - 1]?.id ?? null;
        state = withDerived({
          sessionId: parsed.sessionId,
          basePrompt: parsed.basePrompt ?? "",
          nodes,
          currentNodeId,
          refinementCount: typeof parsed.refinementCount === "number" ? parsed.refinementCount : 0,
          maxRefinements: MAX_REFINEMENTS,
        });
        emit();
        return;
      }
    }
    // Legacy v1 shape (single current image) → seed a one-node tree.
    const legacy = window.sessionStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as Partial<{
        sessionId: string;
        basePrompt: string;
        currentPrompt: string;
        currentImageUrl: string | null;
        currentDesignUrl: string | null;
        refinementCount: number;
      }>;
      const imageUrl = parsed.currentImageUrl || parsed.currentDesignUrl || null;
      if (parsed.sessionId && imageUrl) {
        const node: DesignNode = {
          id: newId("node"),
          parentId: null,
          kind: "generation",
          prompt: parsed.currentPrompt ?? parsed.basePrompt ?? "",
          imageUrl,
          designUrl: parsed.currentDesignUrl ?? null,
          createdAt: Date.now(),
        };
        state = withDerived({
          sessionId: parsed.sessionId,
          basePrompt: parsed.basePrompt ?? node.prompt,
          nodes: [node],
          currentNodeId: node.id,
          refinementCount: typeof parsed.refinementCount === "number" ? parsed.refinementCount : 0,
          maxRefinements: MAX_REFINEMENTS,
        });
        persist();
        window.sessionStorage.removeItem(LEGACY_STORAGE_KEY);
        emit();
      }
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

function ensureSession(): void {
  if (!state.sessionId) {
    state = withDerived({ ...state, sessionId: newId("sess") });
  }
}

function pushNode(node: Omit<DesignNode, "id" | "createdAt">): DesignNode {
  ensureSession();
  const full: DesignNode = { ...node, id: newId("node"), createdAt: Date.now() };
  state = withDerived({
    ...state,
    nodes: [...state.nodes, full],
    currentNodeId: full.id,
  });
  persist();
  emit();
  return full;
}

/**
 * A brand-new generation from a prompt (and optionally an uploaded photo).
 * Previous nodes are KEPT so the customer can go back to them; the new node
 * becomes a new root.
 */
export function setInitialGeneration(args: {
  prompt: string;
  imageUrl: string;
  designUrl?: string | null;
  width?: number;
  height?: number;
}): DesignNode {
  ensureSession();
  state = withDerived({ ...state, basePrompt: args.prompt });
  return pushNode({
    parentId: null,
    kind: "generation",
    prompt: args.prompt,
    imageUrl: args.imageUrl,
    designUrl: args.designUrl || null,
    width: args.width,
    height: args.height,
  });
}

/** A refinement of the CURRENT node. */
export function applyRefinementResult(args: {
  imageUrl: string;
  prompt: string;
  designUrl?: string | null;
  width?: number;
  height?: number;
}): DesignNode | null {
  if (state.refinementCount >= state.maxRefinements) return null;
  return pushNode({
    parentId: state.currentNodeId,
    kind: "refinement",
    prompt: args.prompt,
    imageUrl: args.imageUrl,
    designUrl: args.designUrl || null,
    width: args.width,
    height: args.height,
  });
}

/** A customer photo to be printed unchanged (never sent to the AI). */
export function addOriginalPhoto(args: {
  imageUrl: string;
  designUrl: string;
  width?: number;
  height?: number;
  fileName?: string;
}): DesignNode {
  ensureSession();
  if (!state.basePrompt) state = withDerived({ ...state, basePrompt: args.fileName ?? "Your photo" });
  return pushNode({
    parentId: null,
    kind: "original",
    prompt: args.fileName ? `Your photo · ${args.fileName}` : "Your photo",
    imageUrl: args.imageUrl,
    designUrl: args.designUrl,
    width: args.width,
    height: args.height,
  });
}

/** Make an earlier node the current design (previews, basket and future refinements use it). */
export function selectNode(id: string): boolean {
  if (!state.nodes.some((n) => n.id === id)) return false;
  state = withDerived({ ...state, currentNodeId: id });
  persist();
  emit();
  return true;
}

/** Attach a permanent URL to a node once hosting succeeds (e.g. a late upload). */
export function setNodeDesignUrl(id: string, designUrl: string): void {
  state = withDerived({
    ...state,
    nodes: state.nodes.map((n) => (n.id === id ? { ...n, designUrl } : n)),
  });
  persist();
  emit();
}

/** Legacy API: apply a saved design (from the vault) as a new root node. */
export function applyVaultDesign(args: { imageUrl: string; designUrl?: string | null; prompt?: string }): DesignNode {
  const existing = state.nodes.find(
    (n) => n.designUrl === (args.designUrl ?? null) && (n.designUrl || n.imageUrl === args.imageUrl)
  );
  if (existing) {
    selectNode(existing.id);
    return existing;
  }
  return pushNode({
    parentId: null,
    kind: "generation",
    prompt: args.prompt ?? "Saved design",
    imageUrl: args.imageUrl,
    designUrl: args.designUrl || null,
  });
}

export function canRefine(): boolean {
  return state.refinementCount < state.maxRefinements;
}

export function getRefinementsLeft(): number {
  return Math.max(0, state.maxRefinements - state.refinementCount);
}

export function resetSession(): void {
  state = emptyState();
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
  emit();
}

export function hasActiveSession(): boolean {
  return Boolean(state.sessionId && state.currentImageUrl);
}

/** Ancestors of a node, root first. */
export function getLineage(id: string): DesignNode[] {
  const byId = new Map(state.nodes.map((n) => [n.id, n]));
  const out: DesignNode[] = [];
  let cursor = byId.get(id) ?? null;
  while (cursor) {
    out.unshift(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) ?? null : null;
  }
  return out;
}

/** Depth of a node in its tree (0 = root). Used for indentation in the history panel. */
export function getDepth(id: string): number {
  return Math.max(0, getLineage(id).length - 1);
}

/** Test helper: replace state wholesale. */
export function __setStateForTests(next: Partial<CreateSessionState>): void {
  state = withDerived({ ...emptyState(), ...next, maxRefinements: MAX_REFINEMENTS });
  emit();
}

export function __getRootIdForTests(id: string): string | null {
  return rootOf(state.nodes, id);
}
