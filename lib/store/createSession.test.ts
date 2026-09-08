import "@/tests/browserStorage";
import { describe, it, expect, beforeEach, vi } from "vitest";

type SessionModule = typeof import("./createSession");

async function freshModule(): Promise<SessionModule> {
  vi.resetModules();
  return import("./createSession");
}

const https = (n: string) => `https://res.cloudinary.com/demo/image/upload/v1/keepsy-designs/${n}.png`;

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("design history tree", () => {
  it("branches refinements from the SELECTED node and keeps descendants", async () => {
    const s = await freshModule();
    const root = s.setInitialGeneration({ prompt: "a fox", imageUrl: https("a"), designUrl: https("a") });
    const edit1 = s.applyRefinementResult({ prompt: "softer", imageUrl: https("b"), designUrl: https("b") })!;
    const edit2 = s.applyRefinementResult({ prompt: "warmer", imageUrl: https("c"), designUrl: https("c") })!;
    expect(edit1.parentId).toBe(root.id);
    expect(edit2.parentId).toBe(edit1.id);

    // Go back to the first edit and branch from it
    expect(s.selectNode(edit1.id)).toBe(true);
    expect(s.getCreateSessionSnapshot().currentImageUrl).toBe(https("b"));
    const branch = s.applyRefinementResult({ prompt: "blue sky", imageUrl: https("d"), designUrl: https("d") })!;
    expect(branch.parentId).toBe(edit1.id);

    // Nothing was destroyed
    const ids = s.getCreateSessionSnapshot().nodes.map((n) => n.id);
    expect(ids).toEqual([root.id, edit1.id, edit2.id, branch.id]);
    expect(s.getLineage(branch.id).map((n) => n.id)).toEqual([root.id, edit1.id, branch.id]);
    expect(s.getDepth(edit2.id)).toBe(2);
  });

  it("a new generation keeps earlier designs and starts a new root", async () => {
    const s = await freshModule();
    const first = s.setInitialGeneration({ prompt: "one", imageUrl: https("1") });
    const second = s.setInitialGeneration({ prompt: "two", imageUrl: https("2") });
    expect(second.parentId).toBeNull();
    expect(s.getCreateSessionSnapshot().nodes).toHaveLength(2);
    expect(s.selectNode(first.id)).toBe(true);
    expect(s.getCreateSessionSnapshot().currentPrompt).toBe("one");
  });

  it("counts the 3-edit limit per root design, not per session", async () => {
    const s = await freshModule();
    s.setInitialGeneration({ prompt: "one", imageUrl: https("1") });
    s.applyRefinementResult({ prompt: "e1", imageUrl: https("e1") });
    s.applyRefinementResult({ prompt: "e2", imageUrl: https("e2") });
    s.applyRefinementResult({ prompt: "e3", imageUrl: https("e3") });
    expect(s.canRefine()).toBe(false);
    expect(s.applyRefinementResult({ prompt: "e4", imageUrl: https("e4") })).toBeNull();

    // A fresh design gets its own 3 edits
    s.setInitialGeneration({ prompt: "two", imageUrl: https("2") });
    expect(s.getRefinementsLeft()).toBe(3);
    expect(s.canRefine()).toBe(true);
  });

  it("an uploaded original photo is a root node with its pixel size and never touches the prompt path", async () => {
    const s = await freshModule();
    const node = s.addOriginalPhoto({ imageUrl: https("orig"), designUrl: https("orig"), width: 4032, height: 3024, fileName: "IMG_1.jpg" });
    expect(node.kind).toBe("original");
    expect(node.parentId).toBeNull();
    expect(node.width).toBe(4032);
    expect(s.getCreateSessionSnapshot().currentDesignUrl).toBe(https("orig"));
    expect(s.hasActiveSession()).toBe(true);
  });

  it("survives a page refresh with the whole tree and the selection intact", async () => {
    const s = await freshModule();
    const root = s.setInitialGeneration({ prompt: "fox", imageUrl: "data:image/png;base64,AAAA", designUrl: https("a"), width: 1024, height: 1024 });
    const edit = s.applyRefinementResult({ prompt: "softer", imageUrl: "data:image/png;base64,BBBB", designUrl: https("b") })!;
    s.selectNode(root.id);

    const reloaded = await freshModule(); // simulates a refresh: re-hydrates from sessionStorage
    const snap = reloaded.getCreateSessionSnapshot();
    expect(snap.nodes.map((n) => n.id)).toEqual([root.id, edit.id]);
    expect(snap.currentNodeId).toBe(root.id);
    // data URLs were swapped for the permanent https copy in storage
    expect(snap.currentImageUrl).toBe(https("a"));
    expect(snap.nodes[1].parentId).toBe(root.id);
    expect(snap.nodes[0].width).toBe(1024);
    expect(reloaded.getRefinementsLeft()).toBe(2);
  });

  it("migrates the legacy v1 single-image session into a one-node tree", async () => {
    window.sessionStorage.setItem(
      "keepsy_create_session_v1",
      JSON.stringify({ sessionId: "old", basePrompt: "cat", currentPrompt: "cat", currentImageUrl: https("cat"), currentDesignUrl: https("cat"), refinementCount: 1 })
    );
    const s = await freshModule();
    const snap = s.getCreateSessionSnapshot();
    expect(snap.sessionId).toBe("old");
    expect(snap.nodes).toHaveLength(1);
    expect(snap.currentImageUrl).toBe(https("cat"));
    expect(window.sessionStorage.getItem("keepsy_create_session_v1")).toBeNull();
  });

  it("selecting an unknown node is a no-op and failed generations leave the tree intact", async () => {
    const s = await freshModule();
    const root = s.setInitialGeneration({ prompt: "fox", imageUrl: https("a") });
    expect(s.selectNode("nope")).toBe(false);
    // A failed generation simply never calls applyRefinementResult/setInitialGeneration:
    expect(s.getCreateSessionSnapshot().nodes).toHaveLength(1);
    expect(s.getCreateSessionSnapshot().currentNodeId).toBe(root.id);
  });
});
