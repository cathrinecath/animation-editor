import type { Project } from "@/lib/animation/types";
import { emitAllInOne } from "./all-in-one";
import { emitMultiFile } from "./multi-file";

export type ExportMode = "single-file" | "multi-file";

/** A single emitted file, ready to drop into a project. */
export type ExportFile = {
  name: string;
  language: string;
  code: string;
};

/** Back-compat: the self-contained single-file component as a string. */
export function exportProject(project: Project): string {
  return emitAllInOne(project);
}

/** Returns the emitted files for the given mode (one for single-file, several for multi-file). */
export function exportFiles(project: Project, mode: ExportMode): ExportFile[] {
  switch (mode) {
    case "multi-file":
      return emitMultiFile(project);
    case "single-file":
      return [
        { name: "Animation.tsx", language: "tsx", code: emitAllInOne(project) },
      ];
  }
}
