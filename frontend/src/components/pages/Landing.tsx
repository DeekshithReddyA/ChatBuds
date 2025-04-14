import HeroSection from "../ui/Hero/HeroSection"
import { motion } from "framer-motion";

export const Landing = () => {
    return(
            <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-900/95">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-2xl font-bold bg-gradient-to-r from-neutral-800 to-neutral-950 bg-clip-text text-transparent"
            >
              Chatbuds
            </motion.div>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <motion.li
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-muted-foreground hover:scale-[1.01] transition-colors"
              >
                <a href="#features">Sign In</a>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-muted-foreground hover:scale-[1.01] transition-colors"
              >
                <a href="#signup">Sign Up</a>
              </motion.li>
            </ul>
          </nav>
        </div>
      </header>


            <HeroSection />
        </div>
    )
}