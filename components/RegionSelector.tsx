"use client";

/**
 * Compatibility shim. The old region modal has been replaced by
 * components/DestinationSelector.tsx (delivery country, not "region").
 * This keeps the previous prop shape working for any remaining import site.
 */
import type { Region } from "@/lib/region";
import { getCountry } from "@/lib/commerce/markets";
import { DestinationSelector } from "@/components/DestinationSelector";

type RegionSelectorProps = {
  open: boolean;
  onSelect: (region: Region) => void;
  onClose?: () => void;
  currentRegion?: Region;
};

export default function RegionSelector({
  open,
  onSelect,
  onClose,
}: RegionSelectorProps) {
  return (
    <DestinationSelector
      open={open}
      onClose={() => onClose?.()}
      onSelect={(code) => {
        const region = getCountry(code)?.region;
        if (region) onSelect(region);
      }}
    />
  );
}
