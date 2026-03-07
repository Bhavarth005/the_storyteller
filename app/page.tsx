"use client"

import { Suspense, useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Sparkles, Zap, LineChart, Film } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthModal } from "@/components/auth-modal"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"

function LandingContent() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Auto-open auth modal when redirected here by middleware (callbackUrl present)
  useEffect(() => {
    const callbackUrl = searchParams.get("callbackUrl")
    if (callbackUrl && status === "unauthenticated") {
      setShowAuthModal(true)
    }
  }, [searchParams, status])

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      const callbackUrl = searchParams.get("callbackUrl")
      router.push(callbackUrl || "/dashboard")
    }
  }, [status, router, searchParams])

  function handleNavigate() {
    if (status === "authenticated") {
      router.push("/dashboard")
    } else {
      setShowAuthModal(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#07080B] noise-bg overflow-hidden">
      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-medium tracking-tight text-foreground">Episodic</span>
          </div>
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleNavigate}
          >
            {status === "authenticated" ? "Go to Dashboard" : "Sign In"}
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative min-h-screen flex items-center justify-center px-6">
        {/* Ambient glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-muted-foreground">AI-Powered Narrative Analysis</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-semibold leading-tight mb-6 text-balance">
              <span className="gradient-text glow-text-cyan">The Intelligence Layer</span>
              <br />
              <span className="text-foreground">for Vertical Storytelling</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed text-pretty">
              Analyze your scripts with mathematical NLP. Predict viewer retention, score cliffhangers, 
              and optimize your narrative structure for maximum engagement.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-medium px-8 py-6 text-base glow-cyan transition-all duration-300"
                onClick={handleNavigate}
              >
                Start Creating
              </Button>
            </div>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: LineChart,
                title: "Retention Prediction",
                description: "AI models predict exactly where viewers will drop off",
              },
              {
                icon: Zap,
                title: "Cliffhanger Scoring",
                description: "Mathematical analysis of suspense and tension curves",
              },
              {
                icon: Sparkles,
                title: "Structural Optimization",
                description: "Smart suggestions to maximize narrative impact",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="glass-card rounded-xl p-6 text-left group hover:border-cyan-400/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:from-cyan-400/30 group-hover:to-purple-500/30 transition-all">
                  <feature.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-foreground font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function LandingPage() {
  return (
    <Suspense>
      <LandingContent />
    </Suspense>
  )
}
