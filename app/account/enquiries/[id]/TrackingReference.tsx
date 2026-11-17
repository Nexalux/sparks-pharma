"use client";

import { useState } from "react";

export function TrackingReference({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="tracking-reference">
    <h1>{value}</h1>
    <button type="button" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }}>{copied ? "Copied" : "Copy reference"}</button>
  </div>;
}
