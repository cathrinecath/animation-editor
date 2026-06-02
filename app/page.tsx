"use client";

import { useEffect } from "react";
import { EditorLayout } from "@/components/editor/editor-layout";
import { useEditorStore } from "@/lib/editor/store";

export default function EditorPage() {
  // Apply any persisted project after mount (avoids a localStorage hydration mismatch).
  useEffect(() => {
    useEditorStore.getState().hydrate();
  }, []);

  return <EditorLayout />;
}
