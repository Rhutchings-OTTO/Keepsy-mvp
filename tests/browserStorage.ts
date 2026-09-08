/**
 * Minimal browser-storage shims so store modules (cart, create session) can be
 * exercised in the Node test environment without jsdom.
 */
class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  clear() { this.map.clear(); }
  getItem(key: string) { return this.map.has(key) ? this.map.get(key)! : null; }
  key(index: number) { return [...this.map.keys()][index] ?? null; }
  removeItem(key: string) { this.map.delete(key); }
  setItem(key: string, value: string) { this.map.set(key, String(value)); }
}

const g = globalThis as unknown as { window?: unknown; localStorage?: Storage; sessionStorage?: Storage };
if (!g.window) {
  const win = {
    localStorage: new MemoryStorage(),
    sessionStorage: new MemoryStorage(),
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
    location: { origin: "http://localhost:3000" },
  };
  g.window = win;
  g.localStorage = win.localStorage;
  g.sessionStorage = win.sessionStorage;
}
if (typeof (globalThis as { Event?: unknown }).Event === "undefined") {
  (globalThis as { Event: unknown }).Event = class Event { type: string; constructor(type: string) { this.type = type; } };
}
