"use client";

import { useEditorStore } from "@/lib/editor/store";
import { exportProject } from "@/lib/exporter";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type ExportPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function ExportPanel({ open, onClose }: ExportPanelProps) {
  const project = useEditorStore((s) => s.project);
  if (!open) return null;

  const code = exportProject(project);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* ignore */
    }
  };

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
          <h2 className="font-semibold text-neutral-900">Exported component</h2>
          <div className="flex gap-2">
            <button
              onClick={copy}
              className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
            >
              Copy
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded border border-neutral-300 hover:bg-neutral-100 text-sm"
            >
              Close
            </button>
          </div>
        </div>
        <div data-testid="export-code" className="flex-1 overflow-auto">
          <SyntaxHighlighter
            language="tsx"
            style={vscDarkPlus}
            customStyle={{ margin: 0, fontSize: 13, padding: 16 }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
