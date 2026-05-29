import type { Project } from "@/lib/animation/types";
import type { ExportFile } from "./index";
import {
  ANIM_NAME,
  PARENT_CLASS,
  durationSec,
  easingString,
  keyframeStatements,
  parentCss,
} from "./shared";

/**
 * Emits the animation as separate, project-ready files: a React component that
 * imports a plain CSS file. The component wraps the user's content in a parent
 * container so motion can be measured relative to it.
 */
export function emitMultiFile(project: Project): ExportFile[] {
  if (!project.animations[0]) {
    return [{ name: "Animation.tsx", language: "tsx", code: "// no animation to export\n" }];
  }

  const keyframes = keyframeStatements(project)
    .map((s) => `  ${s}`)
    .join("\n");

  const css = `${parentCss(project)}

@keyframes ${ANIM_NAME} {
${keyframes}
}

.${ANIM_NAME} {
  animation: ${ANIM_NAME} ${durationSec(project)}s ${easingString(project)} forwards;
}
`;

  const component = `import "./animation.css";

export function Animation({ children }: { children?: React.ReactNode }) {
  return (
    <div className="${PARENT_CLASS}">
      <div className="${ANIM_NAME}">{children}</div>
    </div>
  );
}
`;

  return [
    { name: "Animation.tsx", language: "tsx", code: component },
    { name: "animation.css", language: "css", code: css },
  ];
}
