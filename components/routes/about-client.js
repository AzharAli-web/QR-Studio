"use client";

import dynamic from "next/dynamic";
import LoadingSurface from "../loading-surface";

const AboutLanding = dynamic(() => import("../about/about-landing"), {
  ssr: false,
  loading: () => <LoadingSurface title="Loading About…" subtitle="Rendering the landing page." />,
});

export default function AboutClient() {
  return <AboutLanding />;
}

