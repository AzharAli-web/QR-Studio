"use client";

import dynamic from "next/dynamic";
import LoadingSurface from "../loading-surface";

const QrGenerator = dynamic(() => import("../qr-generator/qr-generator"), {
  ssr: false,
  loading: () => (
    <LoadingSurface title="Loading generator…" subtitle="Preparing the QR workspace." />
  ),
});

export default function HomeClient() {
  return <QrGenerator />;
}

