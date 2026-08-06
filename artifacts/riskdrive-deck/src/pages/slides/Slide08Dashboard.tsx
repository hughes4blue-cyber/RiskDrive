export default function Slide08Dashboard() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F4F7FA] flex">
      {/* Left — headline and bullets */}
      <div className="flex-1 flex flex-col px-[7vw] py-[7vh] justify-center gap-[3.5vh]">
        <div>
          <p className="text-[1.3vw] text-[#E8511A] font-bold tracking-[0.22em] uppercase font-body mb-[1.5vh]">
            Network Management
          </p>
          <h2 className="text-[3.8vw] font-black text-[#0D3D56] leading-tight tracking-tight font-display [text-wrap:balance]">
            Your Entire AAA Network, One Dashboard
          </h2>
        </div>

        <div className="flex flex-col gap-[2.5vh]">
          <div className="flex items-start gap-[1.5vw]">
            <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-[#E8511A] flex-shrink-0 mt-[1.1vh]" />
            <p className="text-[1.85vw] text-[#0F1F2E] font-body leading-relaxed [text-wrap:pretty]">
              Club-level view across all affiliated tow facilities
            </p>
          </div>
          <div className="flex items-start gap-[1.5vw]">
            <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-[#E8511A] flex-shrink-0 mt-[1.1vh]" />
            <p className="text-[1.85vw] text-[#0F1F2E] font-body leading-relaxed [text-wrap:pretty]">
              Per-facility RiskDrive™ scores, incident trends, and training completion
            </p>
          </div>
          <div className="flex items-start gap-[1.5vw]">
            <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-[#6B7F8F] flex-shrink-0 mt-[1.1vh]" />
            <p className="text-[1.85vw] text-[#0F1F2E] font-body leading-relaxed [text-wrap:pretty]">
              Finn AI guide answers WC, compliance, and score questions instantly
            </p>
          </div>
          <div className="flex items-start gap-[1.5vw]">
            <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-[#6B7F8F] flex-shrink-0 mt-[1.1vh]" />
            <p className="text-[1.85vw] text-[#0F1F2E] font-body leading-relaxed [text-wrap:pretty]">
              Demo mode lets you explore with real sample data before going live
            </p>
          </div>
        </div>
      </div>

      {/* Right — navy score panel */}
      <div className="w-[38vw] bg-[#0D3D56] flex flex-col px-[3vw] py-[7vh] justify-center">
        <p className="text-[1.3vw] text-[#E8511A] font-bold tracking-[0.22em] uppercase font-body mb-[2.5vh]">
          Facility Scores — Network View
        </p>

        <div className="flex flex-col gap-[1.5vh]">
          <div className="bg-white/10 rounded-lg px-[2vw] py-[1.6vh] flex justify-between items-center">
            <span className="text-[1.5vw] text-white font-body font-medium">Detroit — A</span>
            <span className="text-[2.2vw] font-black text-[#E8511A] font-display leading-none">84</span>
          </div>
          <div className="bg-white/10 rounded-lg px-[2vw] py-[1.6vh] flex justify-between items-center">
            <span className="text-[1.5vw] text-white font-body font-medium">Cleveland — B</span>
            <span className="text-[2.2vw] font-black text-white font-display leading-none">76</span>
          </div>
          <div className="bg-white/10 rounded-lg px-[2vw] py-[1.6vh] flex justify-between items-center">
            <span className="text-[1.5vw] text-white font-body font-medium">Columbus — C</span>
            <span className="text-[2.2vw] font-black text-white font-display leading-none">71</span>
          </div>
          <div className="bg-white/10 rounded-lg px-[2vw] py-[1.6vh] flex justify-between items-center">
            <span className="text-[1.5vw] text-white font-body font-medium">Toledo — D</span>
            <span className="text-[2.2vw] font-black text-[#6B7F8F] font-display leading-none">63</span>
          </div>
          <div className="bg-white/10 rounded-lg px-[2vw] py-[1.6vh] flex justify-between items-center">
            <span className="text-[1.5vw] text-white font-body font-medium">Akron — E</span>
            <span className="text-[2.2vw] font-black text-[#6B7F8F] font-display leading-none">58</span>
          </div>
        </div>

        <div className="mt-[3vh] pt-[2.5vh] border-t border-white/18 flex justify-between items-center">
          <span className="text-[1.4vw] text-white/55 font-body">Network Average</span>
          <span className="text-[2.8vw] font-black text-[#E8511A] font-display leading-none">70.4</span>
        </div>
      </div>
    </div>
  );
}
