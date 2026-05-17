function Blob({ className, duration = 18, delay = 0, scale = 1 }) {
  return (
    <div
      className={`${className} floating-blob`}
      style={{
        "--base-scale": scale,
        "--blob-duration": `${duration}s`,
        "--blob-delay": `${delay}s`,
      }}
    />
  );
}

export default function FloatingBlobs() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.85] dark:opacity-100">
        <Blob
          duration={22}
          scale={1}
          className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl"
        />
        <Blob
          duration={19}
          delay={0.8}
          scale={1.05}
          className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl"
        />
        <Blob
          duration={21}
          delay={0.2}
          scale={0.98}
          className="absolute left-1/2 top-28 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-400/16 blur-3xl"
        />
        <Blob
          duration={24}
          delay={1.1}
          scale={1.02}
          className="absolute bottom-[-220px] left-24 h-[520px] w-[520px] rounded-full bg-emerald-400/14 blur-3xl"
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),transparent_55%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.06),transparent_55%)]" />
    </div>
  );
}

