"use client";

export default function AuroraBackground() {
  return (
    <>
      <div className="aurora-container">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
      </div>
      <div className="grain-overlay" aria-hidden />
    </>
  );
}
