export default function Slide09CTA() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0D3D56] flex flex-col justify-between px-[7vw] py-[7vh]">
      {/* Top accent */}
      <div className="flex items-center gap-[1.5vw]">
        <div className="w-[3vw] h-[0.3vh] bg-[#E8511A]" />
        <span className="text-[1.3vw] font-bold text-white/38 tracking-[0.22em] uppercase font-body">
          Affinity Risk Solutions
        </span>
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center gap-[4vh] text-center">
        <div className="flex flex-col items-center gap-[2vh]">
          <span className="text-[1.5vw] text-[#E8511A] font-bold tracking-[0.28em] uppercase font-body">
            Get Started
          </span>
          <h2 className="text-[5.5vw] font-black text-white leading-tight tracking-tight font-display [text-wrap:balance]">
            Ready to Lower Your Fleet's Risk?
          </h2>
          <div className="w-[8vw] h-[0.4vh] bg-[#E8511A]" />
          <p className="text-[2vw] text-white/72 font-body leading-relaxed max-w-[55vw] [text-wrap:pretty]">
            Connect your telematics in minutes and get your first RiskDrive™ Score free.
          </p>
        </div>

        <div className="bg-white/8 rounded-2xl px-[5vw] py-[3vh] flex flex-col items-center gap-[1.2vh] border border-white/15">
          <span className="text-[2.5vw] font-black text-[#E8511A] font-display tracking-tight">
            affinity-fleet-analytics.replit.app
          </span>
          <span className="text-[1.5vw] text-white/55 font-body">Powered by Affinity Risk Solutions</span>
        </div>
      </div>

      {/* Bottom */}
      <div className="flex items-center justify-between">
        <span className="text-[1.3vw] text-white/28 font-body tracking-widest uppercase">
          Telematics-Based Insurance Intelligence
        </span>
        <div className="flex items-center gap-[1vw]">
          <div className="w-[0.4vw] h-[3vh] bg-[#E8511A]" />
          <span className="text-[1.4vw] font-bold text-white/55 font-body">RiskDrive™</span>
        </div>
      </div>
    </div>
  );
}
