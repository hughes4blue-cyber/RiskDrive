export default function Slide05WorkersComp() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F4F7FA] flex flex-col px-[7vw] py-[6vh]">
      {/* Header */}
      <div className="flex items-start gap-[1.5vw] mb-[4vh]">
        <div className="w-[0.5vw] h-[6.5vh] bg-[#E8511A] flex-shrink-0 mt-[0.5vh]" />
        <div>
          <p className="text-[1.3vw] text-[#E8511A] font-bold tracking-[0.22em] uppercase font-body mb-[0.5vh]">
            Workers' Compensation
          </p>
          <h2 className="text-[4vw] font-black text-[#0D3D56] leading-tight tracking-tight font-display [text-wrap:balance]">
            Workers' Comp Built for Tow Operators
          </h2>
        </div>
      </div>

      {/* Two columns */}
      <div className="flex gap-[5vw] flex-1">
        {/* Left — bullets */}
        <div className="flex-1 flex flex-col gap-[2.8vh]">
          <div className="flex items-start gap-[1.5vw]">
            <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-[#E8511A] flex-shrink-0 mt-[1.1vh]" />
            <p className="text-[1.85vw] text-[#0F1F2E] font-body leading-relaxed [text-wrap:pretty]">
              Rated on actual payroll by class code — not guesses or unit counts
            </p>
          </div>
          <div className="flex items-start gap-[1.5vw]">
            <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-[#E8511A] flex-shrink-0 mt-[1.1vh]" />
            <p className="text-[1.85vw] text-[#0F1F2E] font-body leading-relaxed [text-wrap:pretty]">
              Covers 1099 contractors alongside W-2 employees
            </p>
          </div>
          <div className="flex items-start gap-[1.5vw]">
            <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-[#0D3D56] flex-shrink-0 mt-[1.1vh]" />
            <p className="text-[1.85vw] text-[#0F1F2E] font-body leading-relaxed [text-wrap:pretty]">
              Exclusively underwritten by AmTrust, the nation's leading towing WC carrier
            </p>
          </div>
          <div className="flex items-start gap-[1.5vw]">
            <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-[#0D3D56] flex-shrink-0 mt-[1.1vh]" />
            <p className="text-[1.85vw] text-[#0F1F2E] font-body leading-relaxed [text-wrap:pretty]">
              Quote turnaround: 24 hours
            </p>
          </div>
          <div className="flex items-start gap-[1.5vw]">
            <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-[#0D3D56] flex-shrink-0 mt-[1.1vh]" />
            <p className="text-[1.85vw] text-[#0F1F2E] font-body leading-relaxed [text-wrap:pretty]">
              Clean telematics data typically saves 8–22% vs. standard market
            </p>
          </div>
        </div>

        {/* Right — callout cards */}
        <div className="w-[28vw] flex flex-col gap-[2.5vh]">
          <div className="bg-[#0D3D56] rounded-xl px-[2.5vw] py-[3.5vh] flex flex-col gap-[1vh]">
            <span className="text-[1.3vw] text-[#E8511A] font-bold font-body uppercase tracking-widest">
              Max Savings
            </span>
            <span className="text-[6.5vw] font-black text-[#E8511A] font-display leading-none">22%</span>
            <span className="text-[1.5vw] text-white/78 font-body leading-tight [text-wrap:balance]">
              with clean telematics data vs. standard market
            </span>
          </div>
          <div className="bg-white rounded-xl px-[2.5vw] py-[3vh] flex flex-col gap-[0.8vh] border-l-[0.45vw] border-[#E8511A] shadow-sm">
            <span className="text-[1.3vw] text-[#6B7F8F] font-body uppercase tracking-wider">
              Quote Turnaround
            </span>
            <span className="text-[4.5vw] font-black text-[#0D3D56] font-display leading-none">24 hrs</span>
            <span className="text-[1.4vw] text-[#6B7F8F] font-body">via AmTrust — exclusively</span>
          </div>
        </div>
      </div>
    </div>
  );
}
