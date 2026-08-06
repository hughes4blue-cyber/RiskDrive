import { motion } from 'framer-motion';

export function Scene4Save() {
  return (
    <motion.div
      className="absolute inset-0 bg-[#071C28] overflow-hidden flex flex-col items-center justify-center"
      initial={{ opacity: 0, y: "10%" }}
      animate={{ opacity: 1, y: "0%" }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Background flare */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-[radial-gradient(circle,_rgba(232,81,26,0.15)_0%,_transparent_60%)]" />
      
      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="absolute top-[8vw] w-full text-center flex flex-col items-center z-20"
      >
        <div className="flex items-center justify-center gap-[1vw] mb-[2vw]">
          <div className="w-[4vw] h-[4vw] rounded-full bg-accent flex items-center justify-center font-display font-bold text-[2vw] text-white">3</div>
          <h2 className="font-display font-bold text-[6vw] text-white uppercase tracking-tight leading-none">Save</h2>
        </div>
        
        <p className="font-body text-[2.5vw] text-[#8FB5CB] max-w-[60%] leading-tight">
          Unlock lower Workers' Comp premiums based on verified safe driving.
        </p>
      </motion.div>

      {/* Main visualization: Premium dropping */}
      <div className="relative w-full max-w-[70vw] h-[30vw] mt-[10vw] z-10 flex items-end justify-center gap-[4vw]">
        
        {/* Before Bar */}
        <div className="relative w-[15vw] h-full flex flex-col justify-end items-center">
          <motion.div 
            className="w-full bg-[#1A4A63] rounded-t-lg relative flex items-start justify-center pt-[2vw]"
            initial={{ height: "10%" }}
            animate={{ height: "90%" }}
            transition={{ duration: 1, delay: 0.5, type: "spring" }}
          >
            <motion.div 
              className="font-display font-bold text-[3vw] text-white/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              PREMIUM
            </motion.div>
          </motion.div>
          <div className="font-display text-[2vw] text-[#8FB5CB] mt-[1vw] uppercase">Without RiskDrive</div>
        </div>

        {/* Arrow/Transition */}
        <motion.div 
          className="h-[10vw] flex items-center mb-[4vw]"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1.5 }}
        >
          <svg className="w-[6vw] h-[6vw] text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </motion.div>

        {/* After Bar */}
        <div className="relative w-[15vw] h-full flex flex-col justify-end items-center">
          <motion.div 
            className="w-full bg-gradient-to-b from-accent to-[#9c340f] rounded-t-lg relative flex flex-col items-center justify-start pt-[2vw] shadow-[0_0_40px_rgba(232,81,26,0.3)]"
            initial={{ height: "10%" }}
            animate={{ height: "50%" }}
            transition={{ duration: 1, delay: 1.8, type: "spring" }}
          >
             <motion.div 
              className="font-display font-bold text-[3.5vw] text-white"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.3, type: "spring" }}
            >
              -30%
            </motion.div>
            <motion.div 
              className="font-display text-[1.5vw] text-white/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
            >
              SAVINGS
            </motion.div>
          </motion.div>
          <div className="font-display text-[2vw] text-white mt-[1vw] uppercase font-bold">With RiskDrive</div>
        </div>

      </div>
      
      {/* Logos footer */}
      <motion.div 
        className="absolute bottom-[4vw] flex items-center justify-center gap-[4vw] w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2.8 }}
      >
        <div className="font-display font-bold text-[3vw] text-[#8FB5CB] tracking-widest border border-[#8FB5CB]/30 px-[2vw] py-[0.5vw] rounded">AAA</div>
        <div className="w-[1px] h-[3vw] bg-[#8FB5CB]/30" />
        <div className="font-display font-bold text-[3vw] text-[#8FB5CB] tracking-widest border border-[#8FB5CB]/30 px-[2vw] py-[0.5vw] rounded">AmTrust</div>
      </motion.div>

    </motion.div>
  );
}