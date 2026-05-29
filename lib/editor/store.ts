import { create } from "zustand";
import {
  DEFAULT_PROJECT,
  type Project,
} from "@/lib/animation/types";

const STORAGE_KEY = "animation-editor:project:v0";

function loadFromStorage(): Project | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Project;
    if (parsed.schemaVersion !== 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(project: Project) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch {
    /* quota or privacy mode — ignore */
  }
}

type EditorState = {
  project: Project;
  isPlaying: boolean;

  setTranslateEnd: (animationId: string, x: number, y: number) => void;
  setEasingControl: (
    animationId: string,
    trackIndex: number,
    control: [number, number, number, number],
  ) => void;
  play: () => void;
  reset: () => void;
  loadProject: (project: Project) => void;
  hydrate: () => void;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initialize deterministically so the first client render matches the
  // server (SSR) render. Persisted state is applied after mount via hydrate(),
  // not read here — reading localStorage at init causes a hydration mismatch.
  project: structuredClone(DEFAULT_PROJECT),
  isPlaying: false,

  setTranslateEnd: (animationId, x, y) => {
    set((state) => {
      const project = structuredClone(state.project);
      const anim = project.animations.find((a) => a.id === animationId);
      if (!anim) return state;
      const tx = anim.tracks.find((t) => t.property === "translateX");
      const ty = anim.tracks.find((t) => t.property === "translateY");
      if (tx) tx.waypoints[tx.waypoints.length - 1].value = x;
      if (ty) ty.waypoints[ty.waypoints.length - 1].value = y;
      saveToStorage(project);
      return { project };
    });
  },

  setEasingControl: (animationId, trackIndex, control) => {
    set((state) => {
      const project = structuredClone(state.project);
      const anim = project.animations.find((a) => a.id === animationId);
      if (!anim) return state;
      const track = anim.tracks[trackIndex];
      if (!track) return state;
      track.easing = { type: "cubic-bezier", control };
      saveToStorage(project);
      return { project };
    });
  },

  play: () => set({ isPlaying: true }),
  reset: () => set({ isPlaying: false }),

  loadProject: (project) => {
    saveToStorage(project);
    set({ project, isPlaying: false });
  },

  // Called once from a client-only mount effect to apply any persisted
  // project. Runs after hydration, so it triggers a normal re-render rather
  // than a server/client mismatch.
  hydrate: () => {
    const stored = loadFromStorage();
    if (stored) set({ project: stored });
  },
}));
