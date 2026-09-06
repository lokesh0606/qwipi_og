import { motion } from 'framer-motion'

import { useBranding } from '../contexts/BrandingContext'

export default function StreamingIndicator() {
    const { appName } = useBranding();
    return (
        <div className="flex flex-col gap-3 ml-12 my-6 max-w-sm">
            <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-5 h-5">
                    <motion.div
                        className="absolute inset-0 rounded-full bg-blue-500/20"
                        animate={{
                            scale: [1, 1.8, 1],
                            opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    <div className="relative w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                </div>

                <div className="flex flex-col gap-1.5 flex-1">
                    <motion.div
                        className="flex items-center gap-1 text-xs font-medium tracking-wider uppercase text-blue-500/70"
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <span>{appName} is thinking</span>
                        <span className="flex">
                            {[0, 1, 2].map((i) => (
                                <motion.span
                                    key={i}
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                    }}
                                >
                                    .
                                </motion.span>
                            ))}
                        </span>
                    </motion.div>

                    <div className="h-1 w-full bg-white/5 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent w-full"
                            animate={{
                                x: ['-100%', '100%']
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
