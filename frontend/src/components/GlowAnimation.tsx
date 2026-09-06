import { motion } from 'framer-motion';

export default function GlowAnimation() {
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 60 }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.5 } }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute bottom-0 left-0 right-0 h-[60px] pointer-events-none z-50 overflow-hidden"
            style={{
                // Heavy blur to merge blobs into a unified light source
                filter: 'blur(60px)',
                // Hardware acceleration for smoother morphing
                transform: 'translate3d(0,0,0)',
            }}
        >
            <div className="w-full max-w-4xl mx-auto h-full relative mix-blend-screen opacity-100 overflow-visible">
                {/* Blob 1: Blue - Left drifting */}
                <motion.div
                    animate={{
                        x: ['-10%', '10%', '-10%'],
                        scale: [1, 1.4, 1],
                        opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                        duration: 7,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute bottom-0 left-[20%] w-[350px] h-[250px] bg-blue-500 rounded-full mix-blend-screen"
                />

                {/* Blob 2: Purple - Center Morphing */}
                <motion.div
                    animate={{
                        x: ['-5%', '5%', '-5%'],
                        y: ['5%', '-5%', '5%'],
                        scale: [1.1, 0.9, 1.1],
                        opacity: [0.9, 1, 0.9]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-[450px] h-[300px] bg-purple-500 rounded-full mix-blend-screen"
                />

                {/* Blob 3: Pink - Right/Center Interplay */}
                <motion.div
                    animate={{
                        x: ['10%', '-10%', '10%'],
                        scale: [0.9, 1.1, 0.9],
                        opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute bottom-0 right-[20%] w-[300px] h-[250px] bg-pink-500 rounded-full mix-blend-screen"
                />

                {/* Blob 4: Cyan - Wide Base Ambient */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-cyan-500 rounded-full mix-blend-screen Blur-2xl"
                />
            </div>
        </motion.div>
    );
}
