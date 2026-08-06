import { motion } from 'framer-motion';

export function Scene1Intro() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#071C28] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0D3D56] via-[#071C28] to-[#071C28]"></div>
      
      {/* Grid background pattern */}
      <motion.div 
        className="absolute inset-0" 
        style={{
          backgroundImage: 'linear-gradient(to right, #0D3D56 1px, transparent 1px), linear-gradient(to bottom, #0D3D56 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.3
        }}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.3 }}
        transition={{ duration: 4, ease: "easeOut" }}
      />
      
      <motion.div 
        className="z-10 text-center"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.h1 
          className="font-display font-black text-[12vw] text-white leading-none tracking-tight uppercase"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 3, ease: "easeOut" }}
        >
          RiskDrive<span className="text-accent text-[6vw] align-top relative top-[1vw]">™</span>
        </motion.h1>
        
        <motion.div
          className="h-[0.5vw] w-0 bg-accent mx-auto mt-[2vw]"
          animate={{ width: "40vw" }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
        />
        
        <motion.p 
          className="font-body font-medium text-[2.5vw] text-[#8FB5CB] mt-[3vw] tracking-wide"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          TELEMATICS FOR AAA CLUBS
        </motion.p>
      </motion.div>
      
      {/* Accent light sweep */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-30deg]"
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
