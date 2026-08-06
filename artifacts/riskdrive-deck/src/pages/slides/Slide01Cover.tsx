const base = import.meta.env.BASE_URL;

export default function Slide01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <img
        src={`${base}hero.jpg`}
        alt="Tow truck on open highway at dusk"
        className="absolute inset-0 w-full h-full object-cover"
        crossOrigin="anonymous"
      />
      {/* Navy gradient overlay — stronger on left for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0D3D56]/96 via-[#0D3D56]/82 to-[#0D3D56]/25" />

      <div className="absolute inset-0 flex flex-col justify-between px-[7vw] py-[7vh]">
        {/* Top label */}
        <div className="flex items-center gap-[1.5vw]">
          <div className="w-[3vw] h-[0.3vh] bg-[#E8511A]" />
          <span className="text-[1.5vw] font-semibold text-white/55 tracking-[0.22em] uppercase font-body">
            Affinity Risk Solutions
          </span>
        </div>

        {/* Hero copy */}
        <div className="flex flex-col gap-[2.5vh]">
          <div className="flex flex-col gap-[1vh]">
            <span className="text-[1.4vw] font-bold text-[#E8511A] tracking-[0.28em] uppercase font-body">
              Introducing
            </span>
            <h1 className="text-[9vw] font-black text-white leading-none tracking-tight font-display [text-wrap:balance]">
              RiskDrive™
            </h1>
            <h2 className="text-[2.8vw] font-semibold text-white/80 tracking-tight font-display">
              by Affinity Risk
            </h2>
          </div>
          <div className="w-[6vw] h-[0.4vh] bg-[#E8511A]" />
          <p className="text-[1.9vw] text-white/72 font-body leading-relaxed max-w-[42vw] [text-wrap:pretty]">
            Real telematics, real data, right-sized premiums for AAA towing networks.
          </p>
        </div>

        {/* Bottom tagline */}
        <div className="flex items-center justify-between">
          <span className="text-[1.3vw] text-white/38 font-body tracking-widest uppercase">
            Telematics-Based Insurance Intelligence
          </span>
          <span className="text-[1.3vw] text-white/38 font-body">2026</span>
        </div>
      </div>
    </div>
  );
}
