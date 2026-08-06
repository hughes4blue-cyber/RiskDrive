export default function Slide07Compliance() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F4F7FA] flex flex-col px-[7vw] py-[6vh]">
      {/* Header */}
      <div className="flex items-start gap-[1.5vw] mb-[4vh]">
        <div className="w-[0.5vw] h-[6.5vh] bg-[#E8511A] flex-shrink-0 mt-[0.5vh]" />
        <div>
          <p className="text-[1.3vw] text-[#E8511A] font-bold tracking-[0.22em] uppercase font-body mb-[0.5vh]">
            Compliance
          </p>
          <h2 className="text-[4.5vw] font-black text-[#0D3D56] leading-tight tracking-tight font-display [text-wrap:balance]">
            Compliance on Autopilot
          </h2>
        </div>
      </div>

      {/* 2×2 feature grid */}
      <div className="grid grid-cols-2 gap-[2.5vw] flex-1">
        {/* Feature 1 */}
        <div className="bg-white rounded-xl px-[2.5vw] py-[3vh] flex flex-col gap-[1.5vh] border-t-[0.45vh] border-[#E8511A] shadow-sm">
          <div className="flex items-center gap-[1.2vw]">
            <div className="w-[3.5vw] h-[3.5vw] rounded-lg bg-[#E8511A]/12 flex items-center justify-center">
              <div className="w-[1.5vw] h-[1.5vw] rounded bg-[#E8511A]" />
            </div>
            <h3 className="text-[2vw] font-bold text-[#0D3D56] font-display leading-tight">
              AI-Powered COI Extraction
            </h3>
          </div>
          <p className="text-[1.5vw] text-[#6B7F8F] font-body leading-relaxed [text-wrap:pretty]">
            Upload certificates and AI automatically extracts policy fields — no manual data entry required.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="bg-white rounded-xl px-[2.5vw] py-[3vh] flex flex-col gap-[1.5vh] border-t-[0.45vh] border-[#0D3D56] shadow-sm">
          <div className="flex items-center gap-[1.2vw]">
            <div className="w-[3.5vw] h-[3.5vw] rounded-lg bg-[#0D3D56]/10 flex items-center justify-center">
              <div className="w-[1.5vw] h-[1.5vw] rounded bg-[#0D3D56]" />
            </div>
            <h3 className="text-[2vw] font-bold text-[#0D3D56] font-display leading-tight">
              Automatic Expiration Alerts
            </h3>
          </div>
          <p className="text-[1.5vw] text-[#6B7F8F] font-body leading-relaxed [text-wrap:pretty]">
            Automated alerts fire before any certificate expires — never let coverage lapse again.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="bg-white rounded-xl px-[2.5vw] py-[3vh] flex flex-col gap-[1.5vh] border-t-[0.45vh] border-[#0D3D56] shadow-sm">
          <div className="flex items-center gap-[1.2vw]">
            <div className="w-[3.5vw] h-[3.5vw] rounded-lg bg-[#0D3D56]/10 flex items-center justify-center">
              <div className="w-[1.5vw] h-[1.5vw] rounded bg-[#1A5276]" />
            </div>
            <h3 className="text-[2vw] font-bold text-[#0D3D56] font-display leading-tight">
              Continuous MVR Monitoring
            </h3>
          </div>
          <p className="text-[1.5vw] text-[#6B7F8F] font-body leading-relaxed [text-wrap:pretty]">
            Violations and CDL status changes trigger instant alerts — catch risks before they become claims.
          </p>
        </div>

        {/* Feature 4 */}
        <div className="bg-white rounded-xl px-[2.5vw] py-[3vh] flex flex-col gap-[1.5vh] border-t-[0.45vh] border-[#E8511A] shadow-sm">
          <div className="flex items-center gap-[1.2vw]">
            <div className="w-[3.5vw] h-[3.5vw] rounded-lg bg-[#E8511A]/12 flex items-center justify-center">
              <div className="w-[1.5vw] h-[1.5vw] rounded bg-[#E8511A]" />
            </div>
            <h3 className="text-[2vw] font-bold text-[#0D3D56] font-display leading-tight">
              Onboarding Checklists
            </h3>
          </div>
          <p className="text-[1.5vw] text-[#6B7F8F] font-body leading-relaxed [text-wrap:pretty]">
            Every operator is verified road-ready before dispatch — structured requirements for every new driver.
          </p>
        </div>
      </div>
    </div>
  );
}
