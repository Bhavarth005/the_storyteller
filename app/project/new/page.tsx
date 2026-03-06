"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Check, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface GenerationStep {
  id: string
  label: string
  status: "pending" | "loading" | "complete"
}

const initialSteps: GenerationStep[] = [
  { id: "scripts", label: "Generating Episode Scripts", status: "pending" },
  { id: "sentiment", label: "Running Sentiment Math", status: "pending" },
  { id: "retention", label: "Computing Retention Risks", status: "pending" },
  { id: "cliffhangers", label: "Scoring Cliffhangers", status: "pending" },
  { id: "optimization", label: "Building Optimization Map", status: "pending" },
]

export default function GenesisFlowPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [isFullDraft, setIsFullDraft] = useState(false)
  const [content, setContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [steps, setSteps] = useState<GenerationStep[]>(initialSteps)

  const handleGenerate = async () => {
    if (!title.trim() || !content.trim()) return

    setIsGenerating(true)

    // Simulate step-by-step generation
    for (let i = 0; i < steps.length; i++) {
      setSteps((prev) =>
        prev.map((step, index) =>
          index === i ? { ...step, status: "loading" } : step
        )
      )

      await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800))

      setSteps((prev) =>
        prev.map((step, index) =>
          index === i ? { ...step, status: "complete" } : step
        )
      )
    }

    // Redirect to the new project
    setTimeout(() => {
      router.push("/project/1")
    }, 500)
  }

  return (
    <div className="min-h-screen p-8 noise-bg relative">
      {/* Back button */}
      <div className="max-w-3xl mx-auto mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-foreground mb-3">Create New Series</h1>
          <p className="text-muted-foreground">
            Paste your story idea or full draft and let the engine analyze it
          </p>
        </div>

        <div className="space-y-8">
          {/* Title Input */}
          <div className="space-y-3">
            <Label htmlFor="title" className="text-sm text-muted-foreground">
              Series Title
            </Label>
            <Input
              id="title"
              placeholder="The Midnight Protocol"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background/50 border-white/10 focus:border-cyan-400 focus:ring-cyan-400/20 text-lg py-6 transition-all"
              disabled={isGenerating}
            />
          </div>

          {/* Draft Type Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl glass-card">
            <div>
              <p className="text-foreground font-medium">Input Type</p>
              <p className="text-sm text-muted-foreground">
                {isFullDraft ? "Full Draft" : "Brief Idea"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Brief Idea</span>
              <Switch
                checked={isFullDraft}
                onCheckedChange={setIsFullDraft}
                disabled={isGenerating}
              />
              <span className="text-sm text-muted-foreground">Full Draft</span>
            </div>
          </div>

          {/* Content Textarea */}
          <div className="space-y-3">
            <Label htmlFor="content" className="text-sm text-muted-foreground">
              {isFullDraft ? "Paste your full draft" : "Describe your story idea"}
            </Label>
            <textarea
              id="content"
              placeholder={
                isFullDraft
                  ? "Paste your complete story draft here..."
                  : "A tech startup founder discovers that her AI assistant has been secretly manipulating her decisions for years, leading her down a rabbit hole of conspiracy that blurs the line between human agency and artificial control..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-80 p-4 rounded-xl bg-background/50 border border-white/10 focus:border-purple-400 focus:ring-purple-400/20 focus:outline-none text-foreground font-serif text-lg leading-relaxed resize-none transition-all"
              disabled={isGenerating}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !title.trim() || !content.trim()}
            className="w-full bg-purple-500 hover:bg-purple-400 text-white font-medium py-6 glow-purple transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Generate Engine
          </Button>
        </div>
      </motion.div>

      {/* Generation Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#07080B]/95 backdrop-blur-md z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full mx-4"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Building Your Intelligence Engine
                </h2>
                <p className="text-muted-foreground">
                  Analyzing narrative structure and computing metrics...
                </p>
              </div>

              <div className="glass-card rounded-xl p-6 space-y-4">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 flex items-center justify-center">
                      {step.status === "complete" ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-black" />
                        </motion.div>
                      ) : step.status === "loading" ? (
                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-white/20" />
                      )}
                    </div>
                    <span
                      className={
                        step.status === "complete"
                          ? "text-foreground"
                          : step.status === "loading"
                          ? "text-purple-400"
                          : "text-muted-foreground"
                      }
                    >
                      {step.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
