/**
 * Design Vault — localStorage-backed store for previously generated designs.
 * Persists across sessions. Capped at MAX_DESIGNS to avoid quota issues.
 */

const STORAGE_KEY = "keepsy_design_vault_v1";
const MAX_DESIGNS = 15;
const MAX_TOTAL_BYTES = 8 * 1024 * 1024; // 8MB cap

export type DesignVaultEntry = {
  id: string;
  imageUrl: string;
  designUrl?: string;
  prompt?: string;
  createdAt: number;
};

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function loadVault(): DesignVaultEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveVault(entries: DesignVaultEntry[]) {
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(entries);
    if (json.length > MAX_TOTAL_BYTES) {
      const trimmed = entries.slice(-Math.floor(entries.length / 2));
      return saveVault(trimmed);
    }
    window.localStorage.setItem(STORAGE_KEY, json);
  } catch {
    // quota exceeded — drop oldest
    if (entries.length > 1) {
      saveVault(entries.slice(1));
    }
  }
}

export function getDesignVault(): DesignVaultEntry[] {
  return loadVault();
}

export function addToDesignVault(entry: Omit<DesignVaultEntry, "id" | "createdAt">): void {
  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `vault-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const full: DesignVaultEntry = {
    ...entry,
    id,
    createdAt: Date.now(),
  };
  const vault = loadVault();
  const filtered = vault.filter((e) => e.id !== id && e.imageUrl !== entry.imageUrl);
  const next = [full, ...filtered].slice(0, MAX_DESIGNS);
  saveVault(next);
  emit();
}

export function removeFromDesignVault(id: string): void {
  const vault = loadVault().filter((e) => e.id !== id);
  saveVault(vault);
  emit();
}

export function subscribeDesignVault(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
