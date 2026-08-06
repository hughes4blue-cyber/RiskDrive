const base = import.meta.env.BASE_URL;

export default function Slide06Claims() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <img
        src={`${base}dashcam.jpg`}
        alt="Dashcam display inside truck cab"
        className="absolute inset-0 w-full h-full object-cover"
        crossOrigin="anonymous"
      />
      {/* Dark navy overlay — heavier left, fades right */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0D3D56]/97 via-[#0D3D56]/82 to-[#0D3D56]/20" />

      <div className="absolute inset-0 flex px-[7vw] py-[7vh] gap-[5vw]">
        {/* Left — headline + bullets */}
        <div className="flex-1 flex flex-col justify-center gap-[3vh]">
          <div>
            <p className="text-[1.3vw] text-[#E8511A] font-bold tracking-[0.22em] uppercase font-body mb-[1.5vh]">
              Claims Management
            </p>
            <h2 className="text-[4vw] font-black text-white leading-tight tracking-tight font-display [text-wrap:balance]">
              Claims That Pay You Back
            </h2>
          </div>

          <div className="flex flex-col gap-[2.2vh]">
            <div className="flex items-start gap-[1.3vw]">
              <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#E8511A] flex-shrink-0 mt-[1.1vh]" />
              <p className="text-[1.8vw] text-white/82 font-body leading-relaxed [text-wrap:pretty]">
                FNOL to resolution tracked in one pipeline
              </p>
            </div>
            <div className="flex items-start gap-[1.3vw]">
              <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#E8511A] flex-shrink-0 mt-[1.1vh]" />
              <p className="text-[1.8vw] text-white/82 font-body leading-relaxed [text-wrap:pretty]">
                Telematics and dashcam evidence secured immediately on incident
              </p>
            </div>
            <div className="flex items-start gap-[1.3vw]">
              <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#E8511A] flex-shrink-0 mt-[1.1vh]" />
              <p className="text-[1.8vw] text-white/82 font-body leading-relaxed [text-wrap:pretty]">
                TPA partners handle reserves, litigation, and settlement
              </p>
            </div>
            <div className="flex items-start gap-[1.3vw]">
              <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-white/50 flex-shrink-0 mt-[1.1vh]" />
              <p className="text-[1.8vw] text-white/82 font-body leading-relaxed [text-wrap:pretty]">
                Evidence packet is the difference between a $74K claim and $0 exoneration
              </p>
            </div>
          </div>
        </div>

        {/* Right — exoneration stat */}
        <div className="flex flex-col items-center justify-center w-[28vw]">
          <div className="bg-[#E8511A] rounded-2xl px-[3vw] py-[4.5vh] flex flex-col items-center gap-[1.2vh]">
            <span className="text-[8.5vw] font-black text-white font-display leading-none">25%</span>
            <span className="text-[1.65vw] text-white/90 font-body text-center leading-tight [text-wrap:balance]">
              network exoneration rate
            </span>
            <div className="w-full h-[0.2vh] bg-white/30 my-[0.5vh]" />
            <span className="text-[1.35vw] text-white/68 font-body text-center leading-tight [text-wrap:pretty]">
              powered by dashcam and telematics evidence
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
