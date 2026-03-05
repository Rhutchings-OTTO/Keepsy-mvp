"use client";

import { memo } from "react";
import { GrainSpotlight } from "@/components/GrainSpotlight";

function AuroraBackgroundInner() {
  return (
    <>
      <div className="aurora-container">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
      </div>
      <GrainSpotlight />
    </>
  );
}

export default memo(AuroraBackgroundInner);
