export default function Slide04Score() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F4F7FA] flex flex-col px-[7vw] py-[5vh]">
      {/* Header */}
      <div className="flex items-start gap-[1.5vw] mb-[3.5vh]">
        <div className="w-[0.5vw] h-[5.5vh] bg-[#E8511A] flex-shrink-0 mt-[0.5vh]" />
        <div>
          <p className="text-[1.3vw] text-[#E8511A] font-bold tracking-[0.22em] uppercase font-body mb-[0.5vh]">
            How You Are Measured
          </p>
          <h2 className="text-[4vw] font-black text-[#0D3D56] leading-tight tracking-tight font-display [text-wrap:balance]">
            The RiskDrive™ Score
          </h2>
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex gap-[5vw] flex-1">
        {/* Left — 4 weighted components */}
        <div className="flex-1 flex flex-col gap-[2.8vh]">
          {/* Safety */}
          <div className="flex flex-col gap-[0.9vh]">
            <div className="flex justify-between items-baseline">
              <span className="text-[1.75vw] font-bold text-[#0D3D56] font-display">Safety &amp; Behavior</span>
              <span className="text-[2.8vw] font-black text-[#E8511A] font-display leading-none">40%</span>
            </div>
            <p className="text-[1.4vw] text-[#6B7F8F] font-body">Speeding, hard braking, phone use, fatigue events</p>
            <div className="w-full h-[0.9vh] bg-[#EEF3F8] rounded-full">
              <div className="h-full bg-[#E8511A] rounded-full" style={{ width: '40%' }} />
            </div>
          </div>

          {/* Compliance */}
          <div className="flex flex-col gap-[0.9vh]">
            <div className="flex justify-between items-baseline">
              <span className="text-[1.75vw] font-bold text-[#0D3D56] font-display">Compliance &amp; Onboarding</span>
              <span className="text-[2.8vw] font-black text-[#0D3D56] font-display leading-none">30%</span>
            </div>
            <p className="text-[1.4vw] text-[#6B7F8F] font-body">COI currency, driver license status, vehicle inspections</p>
            <div className="w-full h-[0.9vh] bg-[#EEF3F8] rounded-full">
              <div className="h-full bg-[#0D3D56] rounded-full" style={{ width: '30%' }} />
            </div>
          </div>

          {/* Telematics */}
          <div className="flex flex-col gap-[0.9vh]">
            <div className="flex justify-between items-baseline">
              <span className="text-[1.75vw] font-bold text-[#0D3D56] font-display">Telematics Adoption</span>
              <span className="text-[2.8vw] font-black text-[#0D3D56] font-display leading-none">20%</span>
            </div>
            <p className="text-[1.4vw] text-[#6B7F8F] font-body">Consistency and trend over 90-day rolling window</p>
            <div className="w-full h-[0.9vh] bg-[#EEF3F8] rounded-full">
              <div className="h-full bg-[#1A5276] rounded-full" style={{ width: '20%' }} />
            </div>
          </div>

          {/* Training */}
          <div className="flex flex-col gap-[0.9vh]">
            <div className="flex justify-between items-baseline">
              <span className="text-[1.75vw] font-bold text-[#0D3D56] font-display">Training Completion</span>
              <span className="text-[2.8vw] font-black text-[#0D3D56] font-display leading-none">10%</span>
            </div>
            <p className="text-[1.4vw] text-[#6B7F8F] font-body">Assigned module completion rate across all drivers</p>
            <div className="w-full h-[0.9vh] bg-[#EEF3F8] rounded-full">
              <div className="h-full bg-[#6B7F8F] rounded-full" style={{ width: '10%' }} />
            </div>
          </div>
        </div>

        {/* Right — tier table + network stat */}
        <div className="w-[35vw] flex flex-col gap-[2vh]">
          <div className="bg-[#0D3D56] rounded-xl px-[2.5vw] py-[3vh] flex flex-col gap-[0vh]">
            <p className="text-[1.4vw] font-bold text-[#E8511A] font-body uppercase tracking-wider mb-[1.8vh]">
              Score → Carrier Access
            </p>
            <div className="flex justify-between items-center py-[1.4vh] border-b border-white/12">
              <span className="text-[1.55vw] font-bold text-white font-body">Score 80+</span>
              <span className="text-[1.4vw] text-white/75 font-body text-right">Best-available, all markets</span>
            </div>
            <div className="flex justify-between items-center py-[1.4vh] border-b border-white/12">
              <span className="text-[1.55vw] font-bold text-white font-body">Score 70+</span>
              <span className="text-[1.4vw] text-white/75 font-body text-right">Preferred — 6–8 carriers</span>
            </div>
            <div className="flex justify-between items-center py-[1.4vh] border-b border-white/12">
              <span className="text-[1.55vw] font-bold text-white font-body">Score 55–69</span>
              <span className="text-[1.4vw] text-white/75 font-body text-right">Standard — 3–5 carriers</span>
            </div>
            <div className="flex justify-between items-center py-[1.4vh]">
              <span className="text-[1.55vw] font-bold text-white font-body">Score &lt;55</span>
              <span className="text-[1.4vw] text-white/75 font-body text-right">Limited market access</span>
            </div>
          </div>

          {/* Network avg stat */}
          <div className="bg-[#E8511A] rounded-xl px-[2.5vw] py-[2.5vh] flex flex-col gap-[0.6vh]">
            <span className="text-[5vw] font-black text-white font-display leading-none">14%</span>
            <span className="text-[1.5vw] text-white/88 font-body leading-tight [text-wrap:balance]">
              average network savings vs. industry benchmark
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
