import type { Project } from "@/lib/animation/types";
import { emitAllInOne } from "./all-in-one";

export type ExportMode = "all-in-one";

export function exportProject(
  project: Project,
  mode: ExportMode = "all-in-one",
): string {
  switch (mode) {
    case "all-in-one":
      return emitAllInOne(project);
  }
}
