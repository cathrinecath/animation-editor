"use client";

import { useRef, useEffect, useState } from "react";
import { useEditorStore } from "@/lib/editor/store";
import { useDrag } from "@/lib/editor/drag";
import { runAnimation } from "@/lib/animation/runner";

type CircleProps = {
  elementId: string;
};

type Delta = { dx: number; dy: number };

export function Circle({ elementId }: CircleProps) {
  const element = useEditorStore((s) =>
    s.project.elements.find((e) => e.id === elementId),
  );
  const animation = useEditorStore((s) =>
    s.project.animations.find((a) => a.elementId === elementId),
  );
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const playToken = useEditorStore((s) => s.playToken);
  const stopPlaying = useEditorStore((s) => s.stopPlaying);
  const setTranslateEnd = useEditorStore((s) => s.setTranslateEnd);

  const ref = useRef<HTMLDivElement>(null);
  const [dragDelta, setDragDelta] = useState<Delta | null>(null);

  const { handlers } = useDrag({
    onMove: (dx, dy) => setDragDelta({ dx, dy }),
    onEnd: (dx, dy) => {
      if (animation) setTranslateEnd(animation.id, Math.round(dx), Math.round(dy));
      setDragDelta(null);
    },
  });

  useEffect(() => {
    if (!isPlaying || !ref.current || !animation) return;
    const node = ref.current;
    // When the animation finishes, return to the resting view (start position +
    // overlay) by stopping playback — the cleanup below clears the transform.
    // stopPlaying (not reset) so the user's design is preserved.
    const cancel = runAnimation(animation, node, () => stopPlaying());
    return () => {
      cancel();
      // The runner leaves the circle at the animation's end transform. On stop
      // (Reset, finish, or a re-play) clear it so the circle returns to its start.
      node.style.transform = "";
    };
    // playToken is a dependency so pressing Play again restarts the animation
    // (the cleanup above resets the transform, then the runner replays).
  }, [isPlaying, animation, playToken, stopPlaying]);

  if (!element) return null;

  // The configured end translation lives on the animation's last waypoints.
  const tx = animation?.tracks.find((t) => t.property === "translateX");
  const ty = animation?.tracks.find((t) => t.property === "translateY");
  const endDelta: Delta = {
    dx: tx?.waypoints[tx.waypoints.length - 1].value ?? 0,
    dy: ty?.waypoints[ty.waypoints.length - 1].value ?? 0,
  };

  const dragging = dragDelta !== null;
  // While dragging the live pointer delta is the prospective landing; at rest
  // the configured end delta is what Play will animate toward.
  const liveDelta = dragDelta ?? endDelta;

  const homeCenter = {
    x: element.position.x + element.size.width / 2,
    y: element.position.y + element.size.height / 2,
  };
  // The dashed line always spans home -> target (live while dragging, end at rest).
  const targetCenter = {
    x: homeCenter.x + liveDelta.dx,
    y: homeCenter.y + liveDelta.dy,
  };
  // The ghost marks whichever endpoint the real circle is NOT occupying:
  // home while dragging (circle follows the pointer), end at rest.
  const ghostPos = dragging
    ? element.position
    : { x: element.position.x + endDelta.dx, y: element.position.y + endDelta.dy };

  // The ghost + path are always visible so the start/target is always clear;
  // they're hidden only while the animation is playing.
  const showOverlay = !isPlaying;

  return (
    <>
      {showOverlay && (
        <svg
          data-testid={`circle-path-${element.id}`}
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
        >
          <line
            x1={homeCenter.x}
            y1={homeCenter.y}
            x2={targetCenter.x}
            y2={targetCenter.y}
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="6 6"
          />
        </svg>
      )}
      {showOverlay && (
        <div
          data-testid={`circle-ghost-${element.id}`}
          style={{
            position: "absolute",
            left: ghostPos.x,
            top: ghostPos.y,
            width: element.size.width,
            height: element.size.height,
            border: "2px dashed #9ca3af",
            borderRadius: element.style.borderRadius,
            background: "transparent",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        />
      )}
      <div
        ref={ref}
        data-testid={`editor-circle-${element.id}`}
        {...handlers}
        style={{
          position: "absolute",
          left: element.position.x,
          top: element.position.y,
          width: element.size.width,
          height: element.size.height,
          background: element.style.background,
          borderRadius: element.style.borderRadius,
          cursor: "grab",
          touchAction: "none",
          // Follow the pointer live during a drag; at rest leave transform unset
          // so the animation runner owns it during Play.
          transform: dragging
            ? `translate(${dragDelta.dx}px, ${dragDelta.dy}px)`
            : undefined,
        }}
      />
    </>
  );
}
