"use client";

import { useRef, useEffect } from "react";
import { useEditorStore } from "@/lib/editor/store";
import { useDrag } from "@/lib/editor/drag";
import { runAnimation } from "@/lib/animation/runner";

type CircleProps = {
  elementId: string;
};

export function Circle({ elementId }: CircleProps) {
  const element = useEditorStore((s) =>
    s.project.elements.find((e) => e.id === elementId),
  );
  const animation = useEditorStore((s) =>
    s.project.animations.find((a) => a.elementId === elementId),
  );
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setTranslateEnd = useEditorStore((s) => s.setTranslateEnd);

  const ref = useRef<HTMLDivElement>(null);

  const { handlers } = useDrag({
    onEnd: (dx, dy) => {
      if (!animation) return;
      setTranslateEnd(animation.id, Math.round(dx), Math.round(dy));
    },
  });

  useEffect(() => {
    if (!isPlaying || !ref.current || !animation) return;
    const cancel = runAnimation(animation, ref.current);
    return cancel;
  }, [isPlaying, animation]);

  if (!element) return null;

  return (
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
      }}
    />
  );
}
