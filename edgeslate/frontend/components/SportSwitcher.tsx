"use client";

import { Segmented } from "@/components/ui";
import { SPORTS, type SportId } from "@/lib/api";

export function SportSwitcher({
  value,
  onChange,
}: {
  value: SportId;
  onChange: (v: SportId) => void;
}) {
  return (
    <Segmented
      value={value}
      onChange={onChange}
      options={SPORTS.map((s) => ({ id: s.id, label: s.label }))}
    />
  );
}
