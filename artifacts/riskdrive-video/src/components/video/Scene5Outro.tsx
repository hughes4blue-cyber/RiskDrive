import { motion } from 'framer-motion';

export function Scene5Outro() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D3D56] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background sweep */}
      <motion.div
        className="absolute inset-0 bg-[#071C28]"
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      />
      
      {/* Central Content */}
      <motion.div 
        className="z-10 text-center flex flex-col items-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
      >
        <motion.div
          className="font-display font-black text-[10vw] text-white leading-none tracking-tight uppercase mb-[2vw]"
        >
          RiskDrive<span className="text-accent text-[5vw] align-top relative top-[1vw]">™</span>
        </motion.div>

        <div className="flex gap-[3vw] mb-[4vw]">
          {['CONNECT', 'SCORE', 'SAVE'].map((word, i) => (
            <motion.div
              key={word}
              className="flex items-center gap-[1vw]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.5 + (i * 0.2) }}
            >
              <span className="font-display font-bold text-[3vw] text-[#8FB5CB] uppercase">{word}</span>
              {i < 2 && <span className="w-[1vw] h-[1vw] rounded-full bg-accent" />}
            </motion.div>
          ))}
        </div>

        <motion.div
          className="bg-accent text-white font-display font-bold text-[2.5vw] px-[4vw] py-[1vw] rounded-full tracking-wide uppercase"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 2.5, type: "spring", stiffness: 200 }}
        >
          Built for AAA Clubs
        </motion.div>
      </motion.div>

      {/* Grid lines growing out */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <motion.div
          className="w-[1px] h-full bg-white/5"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
        />
        <motion.div
          className="absolute h-[1px] w-full bg-white/5"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
        />
      </div>
    </motion.div>
  );
}