"use client";

import { memo } from "react";

function AuroraBackgroundInner() {
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

export default memo(AuroraBackgroundInner);
