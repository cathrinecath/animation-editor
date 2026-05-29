import type { Project } from "@/lib/animation/types";
import {
  ANIM_NAME,
  PARENT_CLASS,
  durationSec,
  easingString,
  keyframeStatements,
  parentCss,
} from "./shared";

export function emitAllInOne(project: Project): string {
  const anim = project.animations[0];
  if (!anim) return "// no animation to export\n";

  const keyframes = keyframeStatements(project)
    .map((s) => `          ${s}`)
    .join("\n");
  const parent = parentCss(project)
    .split("\n")
    .map((l) => `        ${l}`)
    .join("\n");

  return `export function Animation({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <style>{\`
${parent}
        @keyframes ${ANIM_NAME} {
${keyframes}
        }
        .${ANIM_NAME} {
          animation: ${ANIM_NAME} ${durationSec(project)}s ${easingString(project)} forwards;
        }
      \`}</style>
      <div className="${PARENT_CLASS}">
        <div className="${ANIM_NAME}">{children}</div>
      </div>
    </>
  );
}
`;
}
