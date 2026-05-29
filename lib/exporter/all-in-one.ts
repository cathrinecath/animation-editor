import type {
  Animation,
  Project,
  PropertyTrack,
  Waypoint,
} from "@/lib/animation/types";

export function emitAllInOne(project: Project): string {
  const anim = project.animations[0];
  if (!anim) return "// no animation to export\n";

  const durationSec = anim.input.type === "mount" ? anim.input.duration / 1000 : 1;
  const tx = anim.tracks.find((t) => t.property === "translateX");
  const ty = anim.tracks.find((t) => t.property === "translateY");
  const easing = tx?.easing ?? ty?.easing;

  const keyframes = buildKeyframes(tx, ty);
  const easingStr = easing && easing.type === "cubic-bezier"
    ? `cubic-bezier(${easing.control.join(", ")})`
    : "linear";

  return `export function Animation({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <style>{\`
        @keyframes animation-anim {
${keyframes}
        }
        .animation-anim {
          animation: animation-anim ${durationSec}s ${easingStr} forwards;
        }
      \`}</style>
      <div className="animation-anim">{children}</div>
    </>
  );
}
`;
}

function buildKeyframes(
  tx: PropertyTrack | undefined,
  ty: PropertyTrack | undefined,
): string {
  const txWaypoints: Waypoint[] = tx?.waypoints ?? [
    { progress: 0, value: 0 },
    { progress: 1, value: 0 },
  ];
  const tyWaypoints: Waypoint[] = ty?.waypoints ?? [
    { progress: 0, value: 0 },
    { progress: 1, value: 0 },
  ];

  // For v0 we assume both tracks have the same progress points (2-point).
  // Arc support (3+ points) will require merging progress sets; deferred.
  const lines: string[] = [];
  const count = Math.max(txWaypoints.length, tyWaypoints.length);
  for (let i = 0; i < count; i++) {
    const txWp = txWaypoints[Math.min(i, txWaypoints.length - 1)];
    const tyWp = tyWaypoints[Math.min(i, tyWaypoints.length - 1)];
    const pct = Math.round(txWp.progress * 100);
    lines.push(
      `          ${pct}% { transform: translate(${txWp.value}px, ${tyWp.value}px); }`,
    );
  }
  return lines.join("\n");
}
