"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Sparkles, ChevronLeft, ChevronRight, Loader2, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { use } from "react"
import { toast } from "sonner"

import {
  getProject,
  getEpisode,
  getEpisodeTensionCurve,
  getEpisodeExplain,
  analyzeEpisode,
  type EpisodeDetail,
} from "@/src/lib/api"
import { useRegenerateEpisode } from "@/src/hooks/useRegenerateEpisode"
import { ScriptEditor } from "@/src/components/editor/ScriptEditor"
import { EpisodeHeatmap } from "@/src/components/heatmaps/EpisodeHeatmap"
import { TensionCurveChart } from "@/src/components/charts/TensionCurveChart"

export default function EpisodeWorkspacePage({
  params,
}: {
  params: Promise<{ id: string; no: string }>
}) {
  const { id, no } = use(params)
  const episodeNumber = parseInt(no, 10)
  const router = useRouter()
  const queryClient = useQueryClient()

  // ---------- Data: project (to resolve episode ID from number) ----------
  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id),
  })

  const episodes = project?.version_data?.episodes ?? []
  const currentEp = episodes.find((e) => e.episode_number === episodeNumber)
  const episodeId = currentEp?.id ?? null

  // ---------- Data: episode detail ----------
  const { data: episode, isLoading: loadingEpisode } = useQuery({
    queryKey: ["episode", episodeId],
    queryFn: () => getEpisode(episodeId!),
    enabled: !!episodeId,
  })

  // ---------- Data: tension curve ----------
  const { data: tensionData } = useQuery({
    queryKey: ["tensionCurve", episodeId],
    queryFn: () => getEpisodeTensionCurve(episodeId!),
    enabled: !!episodeId,
  })

  // ---------- Data: AI explanations ----------
  const { data: explainData } = useQuery({
    queryKey: ["episodeExplain", episodeId],
    queryFn: () => getEpisodeExplain(episodeId!),
    enabled: !!episodeId,
  })

  // ---------- Regenerate mutation ----------
  const regenerate = useRegenerateEpisode()
  const [isRegenerating, setIsRegenerating] = useState(false)

  async function handleApplyAiFix() {
    if (!project || !episodeId) return
    setIsRegenerating(true)
    try {
      const res = await regenerate.mutateAsync({
        project_id: id,
        parent_version_id: project.active_version_id,
        episode_id: episodeId,
        instruction: "Apply AI-recommended optimizations to improve retention and engagement.",
      })

      // Run analysis on the new episode
      toast.info("Analyzing regenerated episode…")
      await analyzeEpisode({ version_id: res.new_version_id, episode_id: res.new_episode_id })

      // Invalidate caches and redirect to new version's episode
      queryClient.invalidateQueries({ queryKey: ["project", id] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Episode regenerated successfully")
      router.push(`/project/${id}/episode/${episodeNumber}`)
      // Force refetch after navigation
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["project", id] })
      }, 500)
    } catch {
      // Error toast handled by useRegenerateEpisode hook
    } finally {
      setIsRegenerating(false)
    }
  }

  // ---------- Derived ----------
  const segments = episode?.script_segments ?? []
  const hookMetrics = episode?.hook_and_cliffhanger_metrics
  const optimizationSuggestions = useMemo(() => {
    const raw = episode?.optimization_suggestions
    if (!Array.isArray(raw)) return []
    return raw.filter((s): s is string => typeof s === "string")
  }, [episode])

  const explanation = explainData?.explanations

  // ---------- Navigation helpers ----------
  const prevEpNumber = episodeNumber > 1 ? episodeNumber - 1 : null
  const nextEpNumber = episodeNumber < episodes.length ? episodeNumber + 1 : null

  // ---------- Loading ----------
  if (loadingEpisode || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07080B]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (!episode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07080B]">
        <p className="text-muted-foreground">Episode not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#07080B] flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-white/10 bg-[#0a0c10]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/project/${id}`}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Series
              </Button>
            </Link>
            <div className="h-6 w-px bg-white/10" />
            <div>
              <span className="text-xs text-muted-foreground">Episode {episodeNumber}</span>
              <h1 className="text-foreground font-medium">{episode.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {prevEpNumber ? (
              <Link href={`/project/${id}/episode/${prevEpNumber}`}>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="ghost" size="sm" className="text-muted-foreground" disabled>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              EP {episodeNumber} of {episodes.length}
            </span>
            {nextEpNumber ? (
              <Link href={`/project/${id}/episode/${nextEpNumber}`}>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="ghost" size="sm" className="text-muted-foreground" disabled>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Timeline Heatmap */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground">Timeline Heatmap</span>
            {segments.length > 0 && (
              <span className="text-xs text-muted-foreground">
                0s – {segments[segments.length - 1].end_sec}s
              </span>
            )}
          </div>
          <EpisodeHeatmap segments={segments} />
          {segments.length > 0 && (
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">0s</span>
              <span className="text-xs text-muted-foreground">
                {Math.round(segments[segments.length - 1].end_sec / 2)}s
              </span>
              <span className="text-xs text-muted-foreground">
                {segments[segments.length - 1].end_sec}s
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - 70/30 Split */}
      <div className="flex-1 flex">
        {/* Left Panel - Script Editor (70%) */}
        <div className="flex-[7] border-r border-white/10 overflow-auto">
          <div className="p-8 max-w-3xl mx-auto">
            <ScriptEditor
              content={episode.script_content}
              segments={segments}
              optimizationSuggestions={optimizationSuggestions}
              explanation={explanation}
              onApplyAiFix={() => handleApplyAiFix()}
              isApplyingAiFix={isRegenerating}
              className="font-serif text-lg leading-relaxed"
            />
          </div>
        </div>

        {/* Right Panel - Intelligence Dashboard (30%) */}
        <div className="flex-[3] bg-[#0a0c10]/50 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Narrative Tension Curve */}
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Narrative Tension Curve
              </h3>
              {tensionData?.curve && tensionData.curve.length > 0 ? (
                <TensionCurveChart data={tensionData.curve} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Tension curve not available yet.
                </p>
              )}
            </div>

            {/* AI Commentary - from explain endpoint */}
            {explanation && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  AI Commentary
                </h3>

                {explanation.cliffhanger_logic && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-foreground font-medium text-sm">Cliffhanger Logic</span>
                      {hookMetrics && (
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            hookMetrics.cliffhanger_score >= 0.7
                              ? "bg-cyan-400/20 text-cyan-400"
                              : hookMetrics.cliffhanger_score >= 0.5
                              ? "bg-amber-400/20 text-amber-400"
                              : "bg-red-400/20 text-red-400"
                          }`}
                        >
                          {Math.round(hookMetrics.cliffhanger_score * 10)}/10
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {explanation.cliffhanger_logic}
                    </p>
                  </motion.div>
                )}

                {explanation.retention_risk_reason && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card rounded-lg p-4"
                  >
                    <span className="text-foreground font-medium text-sm">Retention Risk</span>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                      {explanation.retention_risk_reason}
                    </p>
                  </motion.div>
                )}

                {explanation.optimization_rationale && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card rounded-lg p-4"
                  >
                    <span className="text-foreground font-medium text-sm">Optimization Rationale</span>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                      {explanation.optimization_rationale}
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Hook & Cliffhanger Metrics */}
            {hookMetrics && (
              <div className="glass-card rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Episode Metrics</h3>
                <div className="space-y-2">
                  <MetricRow label="Hook Strength" value={hookMetrics.hook_strength} />
                  <MetricRow label="Cliffhanger Score" value={hookMetrics.cliffhanger_score} />
                  <MetricRow label="Open Loops" value={hookMetrics.open_loops} isRaw />
                  <MetricRow label="Threat Level" value={hookMetrics.threat_level} />
                </div>
              </div>
            )}

            {/* Regenerate Button */}
            <div className="glass-card rounded-lg p-4">
              <Button
                className="w-full bg-purple-500 hover:bg-purple-400 text-white glow-purple gap-2"
                onClick={handleApplyAiFix}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                {isRegenerating ? "Regenerating…" : "Regenerate Episode"}
              </Button>
            </div>

            {/* Legend */}
            <div className="glass-card rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Highlight Legend</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500/40" />
                  <span className="text-xs text-muted-foreground">Drop Risk – High viewer exit probability (&gt;70%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-400/40" />
                  <span className="text-xs text-muted-foreground">Emotional Flatline – Neutral emotion, low engagement</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Small metric display row */
function MetricRow({ label, value, isRaw }: { label: string; value: number; isRaw?: boolean }) {
  const display = isRaw ? value : Math.round(value * 100) + "%"
  const color = isRaw
    ? "text-foreground"
    : value >= 0.7
    ? "text-cyan-400"
    : value >= 0.5
    ? "text-amber-400"
    : "text-red-400"

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${color}`}>{display}</span>
    </div>
  )
}
