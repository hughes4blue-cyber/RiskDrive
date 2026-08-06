export default function Slide02Problem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F4F7FA] flex flex-col px-[7vw] py-[6vh]">
      {/* Header */}
      <div className="flex items-start gap-[1.5vw] mb-[3.5vh]">
        <div className="w-[0.5vw] h-[6.5vh] bg-[#E8511A] flex-shrink-0 mt-[0.5vh]" />
        <div>
          <p className="text-[1.3vw] text-[#E8511A] font-bold tracking-[0.22em] uppercase font-body mb-[0.8vh]">
            The Challenge
          </p>
          <h2 className="text-[4.5vw] font-black text-[#0D3D56] leading-tight tracking-tight font-display [text-wrap:balance]">
            Towing Insurance Is Broken
          </h2>
        </div>
      </div>

      {/* 2×2 card grid */}
      <div className="grid grid-cols-2 gap-[2.5vw] flex-1">
        {/* Card 1 */}
        <div className="bg-white border-l-[0.45vw] border-[#E8511A] px-[2.5vw] py-[2.5vh] flex flex-col gap-[1.2vh] rounded-r-xl shadow-sm">
          <span className="text-[3.8vw] font-black text-[#E8511A] font-display leading-none">01</span>
          <h3 className="text-[1.9vw] font-bold text-[#0D3D56] font-display leading-tight">
            Premiums Based on Estimates
          </h3>
          <p className="text-[1.5vw] text-[#6B7F8F] font-body leading-relaxed [text-wrap:pretty]">
            Carriers rely on guesswork, not your drivers' actual behavior behind the wheel.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white border-l-[0.45vw] border-[#0D3D56] px-[2.5vw] py-[2.5vh] flex flex-col gap-[1.2vh] rounded-r-xl shadow-sm">
          <span className="text-[3.8vw] font-black text-[#0D3D56] font-display leading-none">02</span>
          <h3 className="text-[1.9vw] font-bold text-[#0D3D56] font-display leading-tight">
            One Bad Year Cuts Carrier Access
          </h3>
          <p className="text-[1.5vw] text-[#6B7F8F] font-body leading-relaxed [text-wrap:pretty]">
            A single difficult year can lock your network out of preferred markets for years.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white border-l-[0.45vw] border-[#0D3D56] px-[2.5vw] py-[2.5vh] flex flex-col gap-[1.2vh] rounded-r-xl shadow-sm">
          <span className="text-[3.8vw] font-black text-[#0D3D56] font-display leading-none">03</span>
          <h3 className="text-[1.9vw] font-bold text-[#0D3D56] font-display leading-tight">
            1099 Compliance Is a Legal Risk
          </h3>
          <p className="text-[1.5vw] text-[#6B7F8F] font-body leading-relaxed [text-wrap:pretty]">
            Contractor relationships expose clubs to costly misclassification penalties.
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-white border-l-[0.45vw] border-[#E8511A] px-[2.5vw] py-[2.5vh] flex flex-col gap-[1.2vh] rounded-r-xl shadow-sm">
          <span className="text-[3.8vw] font-black text-[#E8511A] font-display leading-none">04</span>
          <h3 className="text-[1.9vw] font-bold text-[#0D3D56] font-display leading-tight">
            Exoneration Evidence Disappears
          </h3>
          <p className="text-[1.5vw] text-[#6B7F8F] font-body leading-relaxed [text-wrap:pretty]">
            Claims drag on for months — and the telematics data that could clear your driver is gone.
          </p>
        </div>
      </div>
    </div>
  );
}
