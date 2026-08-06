import { motion } from 'framer-motion';

export function Scene2Connect() {
  return (
    <motion.div
      className="absolute inset-0 bg-[#071C28] overflow-hidden flex items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background Image (generated map nodes) */}
      <motion.div
        className="absolute inset-0 z-0 mix-blend-screen opacity-40"
        initial={{ scale: 1.2, rotate: -2 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 4, ease: "easeOut" }}
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/map_nodes.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Left side content */}
      <div className="w-1/2 z-10 pl-[8vw] pr-[4vw]">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center gap-[1vw] mb-[2vw]"
        >
          <div className="w-[4vw] h-[4vw] rounded-full bg-accent flex items-center justify-center font-display font-bold text-[2vw] text-white">1</div>
          <h2 className="font-display font-bold text-[6vw] text-white uppercase tracking-tight leading-none">Connect</h2>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="font-body text-[2.5vw] text-[#8FB5CB] leading-tight"
        >
          Plug telematics devices into fleet vehicles at AAA member shops.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          style={{ transformOrigin: "left" }}
          className="h-[2px] w-[15vw] bg-accent mt-[3vw]"
        />
      </div>
      
      {/* Right side visual (Device plugging in abstract) */}
      <div className="w-1/2 h-full relative z-10 flex items-center justify-center">
        <motion.div
          className="relative w-[30vw] h-[30vw]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 100 }}
        >
          {/* Base port */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20vw] h-[10vw] border-4 border-[#0D3D56] rounded-xl overflow-hidden backdrop-blur-sm bg-[#071C28]/80 flex items-center justify-center">
             <div className="w-[16vw] h-[6vw] bg-[#0D3D56]/50 rounded flex gap-[1vw] p-[1vw] items-center">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-full flex-1 bg-[#071C28] rounded-sm" />
                ))}
             </div>
          </div>
          
          {/* Device sliding in */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-[18vw] h-[25vw] bg-gradient-to-b from-accent to-[#9c340f] rounded-lg shadow-[0_0_50px_rgba(232,81,26,0.5)] z-20"
            initial={{ y: "80%", x: "-50%" }}
            animate={{ y: "-40%", x: "-50%" }}
            transition={{ duration: 1, delay: 0.8, type: "spring", stiffness: 150, damping: 20 }}
          >
            <div className="w-full h-[4vw] bg-black/30 rounded-t-lg mb-[2vw]" />
            <div className="px-[2vw] space-y-[1vw]">
               <div className="w-full h-[0.5vw] bg-white/30 rounded" />
               <div className="w-[80%] h-[0.5vw] bg-white/30 rounded" />
               <div className="w-[90%] h-[0.5vw] bg-white/30 rounded" />
            </div>
            {/* Glowing indicator */}
            <motion.div
              className="absolute bottom-[2vw] right-[2vw] w-[2vw] h-[2vw] rounded-full bg-[#10b981] shadow-[0_0_20px_#10b981]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1] }}
              transition={{ duration: 2, delay: 1.5, repeat: Infinity }}
            />
          </motion.div>
          
          {/* Data rings expanding out once connected */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[15vw] h-[15vw] border-2 border-accent rounded-full z-10"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 2, delay: 1.8, repeat: Infinity, repeatDelay: 1 }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[15vw] h-[15vw] border-2 border-white rounded-full z-10"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 2, delay: 2.1, repeat: Infinity, repeatDelay: 1 }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}