import { motion } from 'framer-motion';

export function Scene3Score() {
  return (
    <motion.div
      className="absolute inset-0 bg-[#0D3D56] overflow-hidden flex items-center"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: "-10%" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Background Image (generated dashboard) */}
      <motion.div
        className="absolute inset-0 z-0 mix-blend-luminosity opacity-30"
        initial={{ x: "-5%" }}
        animate={{ x: "0%" }}
        transition={{ duration: 5, ease: "linear" }}
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/dashboard_ui.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
        }}
      />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(7,28,40,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(7,28,40,0.8)_1px,transparent_1px)] bg-[size:4vw_4vw] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
      
      {/* Right side content */}
      <div className="absolute right-[8vw] top-1/2 -translate-y-1/2 w-[40%] z-20 text-right">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="flex items-center justify-end gap-[1vw] mb-[2vw]"
        >
          <h2 className="font-display font-bold text-[6vw] text-white uppercase tracking-tight leading-none">Score</h2>
          <div className="w-[4vw] h-[4vw] rounded-full bg-accent flex items-center justify-center font-display font-bold text-[2vw] text-white">2</div>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="font-body text-[2.5vw] text-[#8FB5CB] leading-tight"
        >
          AI-driven risk scoring of drivers and vehicles using real behavioral data.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          style={{ transformOrigin: "right" }}
          className="h-[2px] w-[15vw] bg-accent mt-[3vw] ml-auto"
        />
      </div>

      {/* Left side visual - Data/Score UI */}
      <div className="absolute left-[8vw] top-1/2 -translate-y-1/2 w-[45%] h-[60%] z-10 perspective-[1000px]">
        <motion.div 
          className="w-full h-full relative"
          initial={{ rotateY: -30, opacity: 0, z: -200 }}
          animate={{ rotateY: 15, opacity: 1, z: 0 }}
          transition={{ duration: 1.2, delay: 0.3, type: "spring", stiffness: 80, damping: 20 }}
        >
          {/* Main Card */}
          <div className="absolute inset-0 bg-[#071C28]/80 backdrop-blur-md border border-[#3B5F73] rounded-2xl p-[3vw] flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[1.5vw] font-display text-[#8FB5CB] uppercase tracking-wider mb-[0.5vw]">Fleet Safety Index</div>
                <div className="text-[2.5vw] font-display font-bold text-white leading-none">VEHICLE_A042</div>
              </div>
              <div className="w-[4vw] h-[4vw] rounded-full border-2 border-accent flex items-center justify-center">
                 <div className="w-[2vw] h-[2vw] bg-accent rounded-full animate-pulse" />
              </div>
            </div>

            {/* Score dial */}
            <div className="relative w-[20vw] h-[20vw] mx-auto mt-[2vw]">
              {/* Background ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#1A4A63" strokeWidth="8" fill="none" />
                {/* Foreground ring animating */}
                <motion.circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="#10b981" 
                  strokeWidth="8" 
                  fill="none" 
                  strokeLinecap="round"
                  strokeDasharray="251.2"
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 * 0.15 }} /* 85% score */
                  transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div 
                  className="font-display font-black text-[5vw] text-white leading-none"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.5, type: "spring" }}
                >
                  85
                </motion.div>
                <div className="font-display text-[1.5vw] text-[#10b981] uppercase tracking-wider">Low Risk</div>
              </div>
            </div>

            {/* Data bars */}
            <div className="space-y-[1.5vw] mt-[2vw]">
              {[
                { label: "Braking", val: "92%" },
                { label: "Cornering", val: "78%" },
                { label: "Speeding", val: "95%" }
              ].map((stat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[1.2vw] font-display text-[#8FB5CB] uppercase mb-[0.5vw]">
                    <span>{stat.label}</span>
                    <span>{stat.val}</span>
                  </div>
                  <div className="w-full h-[0.5vw] bg-[#1A4A63] rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-white"
                      initial={{ width: 0 }}
                      animate={{ width: stat.val }}
                      transition={{ duration: 1, delay: 1.2 + (i * 0.2), ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Scanning line effect */}
            <motion.div 
              className="absolute top-0 left-0 w-full h-[2vw] bg-gradient-to-b from-transparent via-accent/30 to-transparent"
              initial={{ y: "-100%" }}
              animate={{ y: "800%" }}
              transition={{ duration: 3, delay: 0.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
          
          {/* Floating UI elements in 3D space */}
          <motion.div 
            className="absolute -right-[4vw] top-[4vw] bg-[#E8511A] text-white font-display text-[1.5vw] py-[0.5vw] px-[1.5vw] rounded shadow-lg"
            initial={{ opacity: 0, x: -20, z: 50 }}
            animate={{ opacity: 1, x: 0, z: 50 }}
            transition={{ duration: 0.5, delay: 1.8 }}
            style={{ transform: "translateZ(50px)" }}
          >
            AI VERIFIED
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}