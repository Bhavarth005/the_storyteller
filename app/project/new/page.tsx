"use client"

import { useCallback, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Check, Loader2, ArrowLeft, AlertCircle, RotateCcw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  generateCore,
  analyzeEpisode,
  finalizeVersion,
  ApiError,
} from "@/src/lib/api"
import { toast } from "sonner"

// ---------------------------------------------------------------------------
// Types for the multi-step progress UI
// ---------------------------------------------------------------------------
type StepStatus = "pending" | "loading" | "complete" | "error"

interface PipelineStep {
  id: string
  label: string
  status: StepStatus
  errorMsg?: string
}

function buildSteps(episodeIds: string[]): PipelineStep[] {
  return [
    { id: "core", label: "Generating Episode Scripts", status: "complete" },
    ...episodeIds.map((epId, i) => ({
      id: `ep-${epId}`,
      label: `Analyzing Episode ${i + 1}`,
      status: "pending" as StepStatus,
    })),
    { id: "finalize", label: "Finalizing Version Metrics", status: "pending" },
  ]
}

// Max retries for 504 Gateway Timeout on analyze-episode
const MAX_RETRIES = 3

async function analyzeWithRetry(episodeId: string): Promise<void> {
  let lastError: unknown
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await analyzeEpisode({ episode_id: episodeId })
      return
    } catch (err) {
      lastError = err
      const is504 = err instanceof ApiError && err.status === 504
      if (!is504 || attempt === MAX_RETRIES - 1) throw err
      // brief back-off before retry
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
  throw lastError
}

export default function GenesisFlowPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState("")
  const [isFullDraft, setIsFullDraft] = useState(false)
  const [content, setContent] = useState("")

  // Pipeline state
  const [steps, setSteps] = useState<PipelineStep[]>([])
  const [pipelineError, setPipelineError] = useState<string | null>(null)
  const pipelineRef = useRef<{
    projectId: string
    versionId: string
    episodeIds: string[]
  } | null>(null)

  const isRunning = steps.length > 0 && !pipelineError && !steps.every((s) => s.status === "complete")
  const isComplete = steps.length > 0 && steps.every((s) => s.status === "complete")

  // Helper to update a single step
  const updateStep = useCallback(
    (id: string, patch: Partial<PipelineStep>) =>
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
      ),
    []
  )

  // -------------------------------------------------------------------------
  // Step 1: POST /api/generate-core
  // -------------------------------------------------------------------------
  const generateCoreMutation = useMutation({
    mutationFn: generateCore,
    onError: (err: Error) => {
      setPipelineError(err.message)
      toast.error("Generation failed", { description: err.message })
    },
  })

  // -------------------------------------------------------------------------
  // The full orchestration pipeline
  // -------------------------------------------------------------------------
  const runPipeline = useCallback(async () => {
    setPipelineError(null)
    setSteps([{ id: "core", label: "Generating Episode Scripts", status: "loading" }])

    try {
      // ---- Step 1: generate-core ----
      const coreResult = await generateCoreMutation.mutateAsync({
        title: title.trim(),
        input_type: isFullDraft ? "draft" : "idea",
        raw_story: content.trim(),
      })

      const { project_id, version_id, episode_ids } = coreResult
      pipelineRef.current = { projectId: project_id, versionId: version_id, episodeIds: episode_ids }

      // Build the full step list now that we know episode count
      const fullSteps = buildSteps(episode_ids)
      setSteps(fullSteps)

      // ---- Step 2: analyze each episode sequentially ----
      for (const epId of episode_ids) {
        const stepId = `ep-${epId}`
        updateStep(stepId, { status: "loading" })
        try {
          await analyzeWithRetry(epId)
          updateStep(stepId, { status: "complete" })
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Analysis failed"
          updateStep(stepId, { status: "error", errorMsg: msg })
          throw err // abort pipeline
        }
      }

      // ---- Step 3: finalize-version ----
      updateStep("finalize", { status: "loading" })
      await finalizeVersion({ version_id })
      updateStep("finalize", { status: "complete" })

      // Invalidate projects cache so dashboard/sidebar update
      queryClient.invalidateQueries({ queryKey: ["projects"] })

      // Small pause so user can see the completed checklist
      await new Promise((r) => setTimeout(r, 600))

      // ---- Step 4: redirect ----
      router.push(`/project/${project_id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong"
      setPipelineError(msg)
      toast.error("Pipeline failed", { description: msg })
    }
  }, [title, isFullDraft, content, generateCoreMutation, updateStep, queryClient, router])

  // Retry the pipeline from scratch
  const handleRetry = useCallback(() => {
    setSteps([])
    setPipelineError(null)
    pipelineRef.current = null
    runPipeline()
  }, [runPipeline])

  const isBusy = isRunning || generateCoreMutation.isPending

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
              disabled={isBusy}
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
                disabled={isBusy}
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
              disabled={isBusy}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={runPipeline}
            disabled={isBusy || !title.trim() || !content.trim()}
            className="w-full bg-purple-500 hover:bg-purple-400 text-white font-medium py-6 glow-purple transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Generate Engine
          </Button>
        </div>
      </motion.div>

      {/* Generation Overlay */}
      <AnimatePresence>
        {(isBusy || isComplete || pipelineError) && steps.length > 0 && (
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
                  {pipelineError ? (
                    <AlertCircle className="w-8 h-8 text-white" />
                  ) : (
                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                  )}
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  {pipelineError
                    ? "Pipeline Error"
                    : isComplete
                    ? "Engine Ready!"
                    : "Building Your Intelligence Engine"}
                </h2>
                <p className="text-muted-foreground">
                  {pipelineError
                    ? pipelineError
                    : isComplete
                    ? "Redirecting to your workspace..."
                    : "Analyzing narrative structure and computing metrics..."}
                </p>
              </div>

              <div className="glass-card rounded-xl p-6 space-y-4">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
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
                      ) : step.status === "error" ? (
                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                          <AlertCircle className="w-3 h-3 text-white" />
                        </div>
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
                          : step.status === "error"
                          ? "text-red-400"
                          : "text-muted-foreground"
                      }
                    >
                      {step.label}
                    </span>
                  </motion.div>
                ))}

                {/* Progress bar */}
                {!pipelineError && steps.length > 0 && (
                  <div className="pt-2">
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(steps.filter((s) => s.status === "complete").length / steps.length) * 100}%`,
                        }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {steps.filter((s) => s.status === "complete").length} / {steps.length} steps complete
                    </p>
                  </div>
                )}
              </div>

              {/* Retry button on error */}
              {pipelineError && (
                <div className="mt-6 flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    className="border-white/10"
                    onClick={() => {
                      setSteps([])
                      setPipelineError(null)
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Form
                  </Button>
                  <Button
                    className="bg-purple-500 hover:bg-purple-400 text-white"
                    onClick={handleRetry}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
