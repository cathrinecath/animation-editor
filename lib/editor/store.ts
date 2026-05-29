import { create } from "zustand";
import {
  DEFAULT_PROJECT,
  type MotionUnit,
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
    return normalizeProject(parsed);
  } catch {
    return null;
  }
}

// Backfill fields added after the initial v0 schema so older persisted projects
// keep working. Legacy designs were authored in absolute px, so default any
// missing motionUnit to "px" (NOT the new "container" default) to preserve them.
function normalizeProject(project: Project): Project {
  const next = structuredClone(project);
  if (!next.container) next.container = { width: 400, height: 300 };
  for (const anim of next.animations) {
    if (!anim.motionUnit) anim.motionUnit = "px";
  }
  return next;
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
  // Bumped on every play() so pressing Play again restarts the animation even
  // when isPlaying is already true (e.g. after it has finished).
  playToken: number;

  setTranslateEnd: (animationId: string, x: number, y: number) => void;
  setEasingControl: (
    animationId: string,
    trackIndex: number,
    control: [number, number, number, number],
  ) => void;
  setContainerSize: (width: number, height: number) => void;
  setMotionUnit: (animationId: string, unit: MotionUnit) => void;
  play: () => void;
  // Full reset: clears the project back to defaults (end position + easing) and
  // stops playback. This is the Reset button.
  reset: () => void;
  // Stops playback only, leaving the project untouched. Used when an animation
  // finishes so the editor returns to its resting view without losing the design.
  stopPlaying: () => void;
  loadProject: (project: Project) => void;
  hydrate: () => void;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initialize deterministically so the first client render matches the
  // server (SSR) render. Persisted state is applied after mount via hydrate(),
  // not read here — reading localStorage at init causes a hydration mismatch.
  project: structuredClone(DEFAULT_PROJECT),
  isPlaying: false,
  playToken: 0,

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

  setContainerSize: (width, height) => {
    set((state) => {
      const project = structuredClone(state.project);
      const old = project.container;
      const sx = old.width === 0 ? 1 : width / old.width;
      const sy = old.height === 0 ? 1 : height / old.height;
      project.container = { width, height };
      // In container mode the motion is a fraction of the box, so scale the
      // stored px to keep that fraction. In px mode the motion is fixed — leave it.
      for (const anim of project.animations) {
        if (anim.motionUnit !== "container") continue;
        const tx = anim.tracks.find((t) => t.property === "translateX");
        const ty = anim.tracks.find((t) => t.property === "translateY");
        // waypoints[0] is the value:0 origin; scaling it is a no-op but harmless.
        tx?.waypoints.forEach((w) => (w.value = Math.round(w.value * sx)));
        ty?.waypoints.forEach((w) => (w.value = Math.round(w.value * sy)));
      }
      saveToStorage(project);
      return { project };
    });
  },

  setMotionUnit: (animationId, unit) => {
    set((state) => {
      const project = structuredClone(state.project);
      const anim = project.animations.find((a) => a.id === animationId);
      if (!anim) return state;
      anim.motionUnit = unit;
      saveToStorage(project);
      return { project };
    });
  },

  play: () => set((state) => ({ isPlaying: true, playToken: state.playToken + 1 })),
  reset: () => {
    const project = structuredClone(DEFAULT_PROJECT);
    saveToStorage(project);
    set({ project, isPlaying: false });
  },
  stopPlaying: () => set({ isPlaying: false }),

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
