"use client";

import dynamic from "next/dynamic";
import LoadingSurface from "../loading-surface";

const ScannerClient = dynamic(() => import("../scanner/scanner-client"), {
  ssr: false,
  loading: () => <LoadingSurface title="Loading scanner…" subtitle="Preparing camera tools." />,
});

export default function ScannerClientShell() {
  return <ScannerClient />;
}

