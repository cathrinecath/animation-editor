import type { Project } from "@/lib/animation/types";
import {
  ANIM_NAME,
  durationSec,
  easingString,
  keyframeStatements,
} from "./shared";

export function emitAllInOne(project: Project): string {
  const anim = project.animations[0];
  if (!anim) return "// no animation to export\n";

  const keyframes = keyframeStatements(project)
    .map((s) => `          ${s}`)
    .join("\n");

  return `export function Animation({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <style>{\`
        @keyframes ${ANIM_NAME} {
${keyframes}
        }
        .${ANIM_NAME} {
          animation: ${ANIM_NAME} ${durationSec(project)}s ${easingString(project)} forwards;
        }
      \`}</style>
      <div className="${ANIM_NAME}">{children}</div>
    </>
  );
}
`;
}
