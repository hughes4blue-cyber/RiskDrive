export default function Slide03Steps() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0D3D56] flex flex-col px-[7vw] py-[7vh]">
      {/* Header */}
      <div className="mb-[5vh]">
        <p className="text-[1.3vw] text-[#E8511A] font-bold tracking-[0.22em] uppercase font-body mb-[1.5vh]">
          How It Works
        </p>
        <h2 className="text-[4vw] font-black text-white leading-tight tracking-tight font-display [text-wrap:balance]">
          From Telematics Data to Lower Premiums — in Three Steps
        </h2>
      </div>

      {/* Three columns */}
      <div className="flex gap-[0] flex-1 items-start pt-[2vh]">
        {/* Step 1 — Connect */}
        <div className="flex-1 flex flex-col gap-[2.2vh] pr-[4vw]">
          <div className="flex items-center gap-[1.5vw]">
            <div className="w-[5.5vw] h-[5.5vw] rounded-full bg-[#E8511A] flex items-center justify-center flex-shrink-0">
              <span className="text-[2.8vw] font-black text-white font-display leading-none">1</span>
            </div>
            <div className="flex-1 h-[0.2vh] bg-white/20" />
          </div>
          <h3 className="text-[3vw] font-black text-[#E8511A] font-display leading-tight">Connect</h3>
          <p className="text-[1.75vw] text-white/78 font-body leading-relaxed [text-wrap:pretty]">
            Link your Samsara or Geotab account in minutes. RiskDrive™ validates credentials and pulls
            live vehicle, driver, and safety-event data immediately.
          </p>
        </div>

        {/* Divider */}
        <div className="w-[0.15vw] h-[45vh] bg-white/18 flex-shrink-0 mt-[1vh]" />

        {/* Step 2 — Score */}
        <div className="flex-1 flex flex-col gap-[2.2vh] px-[4vw]">
          <div className="flex items-center gap-[1.5vw]">
            <div className="w-[5.5vw] h-[5.5vw] rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
              <span className="text-[2.8vw] font-black text-white font-display leading-none">2</span>
            </div>
            <div className="flex-1 h-[0.2vh] bg-white/20" />
          </div>
          <h3 className="text-[3vw] font-black text-white font-display leading-tight">Score</h3>
          <p className="text-[1.75vw] text-white/78 font-body leading-relaxed [text-wrap:pretty]">
            RiskDrive™ turns live fleet data into a composite risk score — weighted across safety,
            compliance, telematics adoption, and training completion.
          </p>
        </div>

        {/* Divider */}
        <div className="w-[0.15vw] h-[45vh] bg-white/18 flex-shrink-0 mt-[1vh]" />

        {/* Step 3 — Save */}
        <div className="flex-1 flex flex-col gap-[2.2vh] pl-[4vw]">
          <div className="flex items-center gap-[1.5vw]">
            <div className="w-[5.5vw] h-[5.5vw] rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
              <span className="text-[2.8vw] font-black text-white font-display leading-none">3</span>
            </div>
            <div className="flex-1 h-[0.2vh] bg-white/20" />
          </div>
          <h3 className="text-[3vw] font-black text-white font-display leading-tight">Save</h3>
          <p className="text-[1.75vw] text-white/78 font-body leading-relaxed [text-wrap:pretty]">
            Higher scores unlock 6–8 preferred carrier markets simultaneously — creating competition
            for your business and reducing premiums by up to 22%.
          </p>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="flex items-center gap-[2vw] mt-[4vh]">
        <div className="w-[3vw] h-[0.3vh] bg-[#E8511A]" />
        <span className="text-[1.3vw] text-white/35 font-body tracking-widest uppercase">
          Telematics-Based Insurance Intelligence
        </span>
      </div>
    </div>
  );
}
