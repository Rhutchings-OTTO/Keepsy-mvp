"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { UploadCloud, WandSparkles } from "lucide-react";
import Image from "next/image";
import type { Region } from "@/lib/region";
import { CREATE_EXAMPLES } from "@/content/createExamples";

type Mode = "describe" | "upload";

type CreateModePanelProps = {
  region: Region;
  promptValue: string;
  setPromptValue: (value: string) => void;
  hasUserTyped?: boolean;
  onUploadFile?: (file: File) => void;
  uploadedFile?: File | null;
  uploadedPreviewUrl?: string | null;
  uploadedFileName?: string | null;
};

export default function CreateModePanel({
  region,
  promptValue,
  setPromptValue,
  hasUserTyped = false,
  onUploadFile,
  uploadedPreviewUrl,
  uploadedFileName,
}: CreateModePanelProps) {
  const [mode, setMode] = useState<Mode>("describe");
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showIdeasMobile, setShowIdeasMobile] = useState(false);
  const reduceMotion = useReducedMotion();

  const content = CREATE_EXAMPLES[region];
  const activeChips = useMemo(
    () => (mode === "describe" ? content.describeChips : content.uploadTransformChips),
    [content.describeChips, content.uploadTransformChips, mode],
  );

  const requestPrompt = (nextPrompt: string) => {
    if (!hasUserTyped || promptValue.trim().length === 0) {
      setPromptValue(nextPrompt);
      return;
    }
    setPendingPrompt(nextPrompt);
  };

  const acceptReplace = () => {
    if (!pendingPrompt) return;
    setPromptValue(pendingPrompt);
    setPendingPrompt(null);
  };

  return (
    <section className="mb-5 w-full rounded-3xl border border-black/10 bg-white/80 p-4 text-left shadow-sm sm:p-5">
      <h2 className="text-xl font-black text-[#2D241E] sm:text-2xl">Start with a memory or an idea</h2>
      <p className="mt-1 text-sm font-medium text-black/55">
        Describe anything you imagine, or upload a photo and we&apos;ll transform it into a beautiful gift.
      </p>

      <div className="mt-4 inline-flex rounded-2xl border border-black/10 bg-[#F9F4EE] p-1" role="tablist" aria-label="Creation mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "describe"}
          onClick={() => setMode("describe")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
            mode === "describe" ? "bg-white text-black shadow-sm" : "text-black/60"
          }`}
        >
          Describe an idea
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "upload"}
          onClick={() => setMode("upload")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
            mode === "upload" ? "bg-white text-black shadow-sm" : "text-black/60"
          }`}
        >
          Upload a photo
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowIdeasMobile((prev) => !prev)}
        className="mt-3 rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60 sm:hidden"
      >
        {showIdeasMobile ? "Hide ideas" : "Show ideas"}
      </button>

      <div className={`mt-3 ${showIdeasMobile ? "block" : "hidden"} sm:block`}>
        <AnimatePresence mode="wait">
          {mode === "describe" ? (
            <motion.div
              key="describe"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-black/65">
                <WandSparkles size={16} /> Quick prompt ideas
              </div>
              <div className="flex flex-wrap gap-2">
                {activeChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => requestPrompt(chip)}
                    className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black/70 transition hover:bg-black/5"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div
                className={`rounded-2xl border-2 border-dashed p-4 transition ${
                  isDragActive ? "border-black/40 bg-black/[0.03]" : "border-black/15 bg-[#FBF8F4]"
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragActive(true);
                }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragActive(false);
                  const file = event.dataTransfer.files?.[0];
                  if (file && onUploadFile) onUploadFile(file);
                }}
              >
                <p className="text-sm font-semibold text-black/70">Transform your memories into something beautiful.</p>
                <p className="mt-1 text-xs text-black/50">Drag and drop a photo here, or choose a file.</p>
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black/70 hover:bg-black/5">
                  <UploadCloud size={14} />
                  Choose photo
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file && onUploadFile) onUploadFile(file);
                    }}
                    aria-label="Upload photo"
                  />
                </label>
                {uploadedPreviewUrl ? (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-black/10 bg-white p-2">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                      <Image src={uploadedPreviewUrl} alt="Uploaded preview" fill className="object-cover" unoptimized />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-black/70">{uploadedFileName || "Photo selected"}</p>
                    </div>
                  </div>
                ) : null}
              </div>

              <p className="text-xs font-semibold uppercase tracking-wide text-black/45">Transformation examples</p>
              <div className="flex flex-wrap gap-2">
                {activeChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => requestPrompt(chip)}
                    className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black/70 transition hover:bg-black/5"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {pendingPrompt ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
          <span className="font-semibold text-amber-800">Replace your prompt?</span>
          <button type="button" onClick={acceptReplace} className="rounded-full bg-amber-700 px-3 py-1 font-bold text-white">
            Replace
          </button>
          <button
            type="button"
            onClick={() => setPendingPrompt(null)}
            className="rounded-full border border-amber-300 px-3 py-1 font-bold text-amber-800"
          >
            Cancel
          </button>
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-3">
          {content.beforeAfterTiles.map((tile) => (
            <article key={tile.caption} className="w-64 rounded-2xl border border-black/10 bg-white p-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-gradient-to-br from-[#ECE7E1] to-[#DCD3C8] p-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-black/45">Before</p>
                  <p className="mt-6 text-xs font-semibold text-black/65">{tile.beforeLabel}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-[#E9EDF7] to-[#D7DFEE] p-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-black/45">After</p>
                  <p className="mt-6 text-xs font-semibold text-black/65">{tile.afterLabel}</p>
                </div>
              </div>
              <p className="mt-2 text-xs font-semibold text-black/60">{tile.caption}</p>
            </article>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold text-black/55">Tip: The more detail you give, the more personal it feels.</p>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-black/55">
        <span className="rounded-full border border-black/10 bg-white px-3 py-1">Secure checkout</span>
        <span className="rounded-full border border-black/10 bg-white px-3 py-1">Printed & shipped fast</span>
        <span className="rounded-full border border-black/10 bg-white px-3 py-1">Made to make someone smile</span>
      </div>
    </section>
  );
}

