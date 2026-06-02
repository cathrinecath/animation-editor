"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/editor/store";
import { exportFiles, type ExportMode } from "@/lib/exporter";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type ExportPanelProps = {
  open: boolean;
  onClose: () => void;
};

const TABS: { mode: ExportMode; label: string }[] = [
  { mode: "multi-file", label: "Multi-file" },
  { mode: "single-file", label: "Single file" },
];

export function ExportPanel({ open, onClose }: ExportPanelProps) {
  const project = useEditorStore((s) => s.project);
  const [mode, setMode] = useState<ExportMode>("multi-file");
  const [copied, setCopied] = useState<string | null>(null);

  if (!open) return null;

  const files = exportFiles(project, mode);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      /* ignore */
    }
  };

  const copyAll = () =>
    copy(
      "__all__",
      files.map((f) => `/* ${f.name} */\n${f.code}`).join("\n\n"),
    );

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50"
      onClick={onClose}
    >
      <div
        data-testid="export-modal"
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-neutral-900">Export</h2>
            <div className="flex gap-1 rounded-md bg-neutral-100 p-0.5">
              {TABS.map((t) => (
                <button
                  key={t.mode}
                  onClick={() => setMode(t.mode)}
                  className={
                    "px-3 py-1 rounded text-sm " +
                    (mode === t.mode
                      ? "bg-white shadow text-neutral-900"
                      : "text-neutral-500 hover:text-neutral-800")
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyAll}
              className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
            >
              {copied === "__all__" ? "Copied!" : "Copy all"}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-neutral-800 text-white hover:bg-neutral-700 text-sm"
            >
              Close
            </button>
          </div>
        </div>
        <div data-testid="export-code" className="flex-1 overflow-auto">
          {files.map((file) => (
            <div key={file.name} className="border-b border-neutral-100 last:border-b-0">
              <div className="flex items-center justify-between px-4 py-2 bg-neutral-50 sticky top-0">
                <span className="font-mono text-xs text-neutral-600">{file.name}</span>
                <button
                  onClick={() => copy(file.name, file.code)}
                  className="px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs"
                >
                  {copied === file.name ? "Copied!" : "Copy"}
                </button>
              </div>
              <SyntaxHighlighter
                language={file.language}
                style={vscDarkPlus}
                customStyle={{ margin: 0, fontSize: 13, padding: 16 }}
              >
                {file.code}
              </SyntaxHighlighter>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
