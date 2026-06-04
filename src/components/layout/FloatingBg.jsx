// Injects shared keyframes + soft emerald background blobs that the frosted-glass
// cards refract on top of (glassmorphism needs depth behind the blur).
const blob = (extra) => ({
  position: "fixed", borderRadius: "50%", filter: "blur(70px)", opacity: 0.5,
  pointerEvents: "none", zIndex: 0, ...extra
});

export function FloatingBg() {
  return (
    <>
      <div aria-hidden style={blob({ top: "-120px", right: "-80px", width: "380px", height: "380px", background: "radial-gradient(circle, rgba(52,211,158,0.55), transparent 70%)" })} />
      <div aria-hidden style={blob({ bottom: "-140px", left: "-100px", width: "420px", height: "420px", background: "radial-gradient(circle, rgba(15,185,129,0.45), transparent 70%)", animation: "float 14s ease-in-out infinite" })} />
      <div aria-hidden style={blob({ top: "40%", left: "55%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(52,211,158,0.30), transparent 70%)", animation: "float 18s ease-in-out infinite reverse" })} />
      <style>{`
        @keyframes float {
          0%,100%{transform:translateY(0) rotate(0deg)}
          50%{transform:translateY(-20px) rotate(5deg)}
        }
        @keyframes spin {0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)}}
        @keyframes fadeUp {from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)}}
        @keyframes pulse {0%,100%{opacity:1} 50%{opacity:0.5}}
        @keyframes countUp {from{opacity:0} to{opacity:1}}
        @keyframes typing {0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)}}
        @keyframes shimmer {0%{background-position:-200% 0} 100%{background-position:200% 0}}
        @keyframes ringProgress {from{stroke-dashoffset:251} to{stroke-dashoffset:var(--target)}}
      `}</style>
    </>
  );
}
