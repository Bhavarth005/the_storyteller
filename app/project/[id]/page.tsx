"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts"
import { AlertTriangle, GitBranch, ChevronRight, User, Sparkles, History, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VersionDiffModal } from "@/components/version-diff-modal"
import { use, useEffect } from "react"
import {
  getProject,
  getProjectVersions,
  type ProjectDetail,
  type ProjectDetailEpisode,
  type VersionListItem,
} from "@/src/lib/api"
import { useProjectStore } from "@/src/store/useProjectStore"

// Deterministic trait colors by hashing the trait name
const TRAIT_PALETTE = [
  "bg-cyan-400/20 text-cyan-400 border-cyan-400/30",
  "bg-purple-400/20 text-purple-400 border-purple-400/30",
  "bg-amber-400/20 text-amber-400 border-amber-400/30",
  "bg-red-400/20 text-red-400 border-red-400/30",
  "bg-emerald-400/20 text-emerald-400 border-emerald-400/30",
  "bg-rose-400/20 text-rose-400 border-rose-400/30",
  "bg-orange-400/20 text-orange-400 border-orange-400/30",
  "bg-blue-400/20 text-blue-400 border-blue-400/30",
  "bg-teal-400/20 text-teal-400 border-teal-400/30",
]

function traitColor(trait: string) {
  let hash = 0
  for (let i = 0; i < trait.length; i++) hash = (hash * 31 + trait.charCodeAt(i)) | 0
  return TRAIT_PALETTE[Math.abs(hash) % TRAIT_PALETTE.length]
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

/** Average engagement score across all segments of an episode */
function episodeEngagement(ep: ProjectDetailEpisode): number {
  const segs = ep.script_segments
  if (!segs || segs.length === 0) return 0
  return segs.reduce((sum, s) => sum + s.engagement_score, 0) / segs.length
}

function retentionStatus(score: number): "strong" | "moderate" | "weak" {
  if (score >= 0.75) return "strong"
  if (score >= 0.6) return "moderate"
  return "weak"
}

export default function SeriesOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [showVersionDiff, setShowVersionDiff] = useState(false)
  const [selectedBaseVersionId, setSelectedBaseVersionId] = useState<string | null>(null)

  // ---------- Data fetching ----------
  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id),
  })

  const { data: versionsData } = useQuery({
    queryKey: ["projectVersions", id],
    queryFn: () => getProjectVersions(id),
    enabled: !!project,
  })

  // Populate the Zustand store when project data arrives
  const setProjectData = useProjectStore((s) => s.setProjectData)
  useEffect(() => {
    if (project) setProjectData(project)
  }, [project, setProjectData])

  // ---------- Derived data ----------
  const vd = project?.version_data
  const episodes = vd?.episodes ?? []
  const characters = vd?.global_characters ?? []
  const versions = versionsData?.versions ?? []

  const radarData = useMemo(() => {
    if (!vd?.version_analysis?.radar_metrics) return []
    const rm = vd.version_analysis.radar_metrics
    return [
      { subject: "Hook Strength", value: Math.round((rm.hook_strength ?? 0) * 100), fullMark: 100 },
      { subject: "Retention Stability", value: Math.round((rm.retention_stability ?? 0) * 100), fullMark: 100 },
      { subject: "Suspense Density", value: Math.round((rm.suspense_density ?? 0) * 100), fullMark: 100 },
    ]
  }, [vd])

  const weakestEpisode = useMemo(() => {
    if (episodes.length === 0) return null
    return episodes.reduce((weakest, ep) =>
      episodeEngagement(ep) < episodeEngagement(weakest) ? ep : weakest
    )
  }, [episodes])

  const avgEngagement = useMemo(() => {
    if (episodes.length === 0) return 0
    return episodes.reduce((sum, ep) => sum + episodeEngagement(ep), 0) / episodes.length
  }, [episodes])

  // ---------- Loading state ----------
  if (loadingProject) {
    return (
      <div className="min-h-screen flex items-center justify-center noise-bg">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (!project || !vd) {
    return (
      <div className="min-h-screen flex items-center justify-center noise-bg">
        <p className="text-muted-foreground">Project not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 noise-bg">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-semibold text-foreground mb-2">{project.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <GitBranch className="w-4 h-4" />
              {vd.commit_message ?? "Initial Generation"}
            </span>
            <span>{episodes.length} Episode{episodes.length !== 1 ? "s" : ""}</span>
            {avgEngagement > 0 && (
              <span className="text-cyan-400">{Math.round(avgEngagement * 100)}% Avg Engagement</span>
            )}
          </div>
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Radar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="col-span-12 lg:col-span-4 glass-card rounded-xl p-6"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
              Narrative Metrics
            </h3>
            {radarData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={radarData}
                    cx="50%"
                    cy="50%"
                    margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
                    outerRadius={80}
                  >
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      tickLine={false}
                    />
                    <Radar
                      name="Metrics"
                      dataKey="value"
                      stroke="#22d3ee"
                      fill="#22d3ee"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-12 text-center">
                Metrics not available yet.
              </p>
            )}
          </motion.div>

          {/* Weakest Link Warning */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="col-span-12 lg:col-span-4 glass-card rounded-xl p-6 border-amber-400/30"
          >
            {weakestEpisode ? (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-foreground mb-1">Weakest Link Detected</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Episode {weakestEpisode.episode_number} ({weakestEpisode.title}) has the lowest engagement at{" "}
                    {Math.round(episodeEngagement(weakestEpisode) * 100)}%.
                  </p>
                  <Link href={`/project/${id}/episode/${weakestEpisode.episode_number}`}>
                    <Button
                      variant="outline"
                      className="border-amber-400/30 text-amber-400 hover:bg-amber-400/10"
                    >
                      Edit Episode {weakestEpisode.episode_number}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No episodes yet.</p>
            )}
          </motion.div>

          {/* Version Control */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="col-span-12 lg:col-span-4 glass-card rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Version History
              </h3>
              {versions.length >= 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground gap-1"
                  onClick={() => {
                    setSelectedBaseVersionId(versions[1]?.id ?? null)
                    setShowVersionDiff(true)
                  }}
                >
                  <History className="w-3.5 h-3.5" />
                  Compare
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {versions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No versions yet.</p>
              ) : (
                versions.map((version, index) => {
                  const isActive = version.id === project.active_version_id
                  return (
                    <button
                      key={version.id}
                      onClick={() => {
                        if (!isActive) {
                          setSelectedBaseVersionId(version.id)
                          setShowVersionDiff(true)
                        }
                      }}
                      className={`relative pl-6 py-2 w-full text-left hover:bg-white/5 rounded-lg transition-all ${
                        index < versions.length - 1 ? "border-l border-white/10 ml-2" : ""
                      }`}
                    >
                      <div
                        className={`absolute left-0 top-3 w-4 h-4 rounded-full -translate-x-1/2 ${
                          isActive ? "bg-cyan-400 glow-cyan" : "bg-white/20"
                        }`}
                      />
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isActive ? "text-cyan-400" : "text-foreground"}`}>
                          {version.commit_message ?? "Version"}
                        </span>
                        <span className="text-xs text-muted-foreground">{timeAgo(version.created_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">{version.analysis_status}</p>
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>

          {/* Story Arc Stepper */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="col-span-12 lg:col-span-8 glass-card rounded-xl p-6"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">
              Story Arc Timeline
            </h3>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-400 via-purple-400 to-cyan-400 opacity-30" />
              <div className="space-y-4">
                {episodes.map((episode) => {
                  const eng = episodeEngagement(episode)
                  const status = retentionStatus(eng)
                  return (
                    <Link
                      key={episode.id}
                      href={`/project/${id}/episode/${episode.episode_number}`}
                      className="group block"
                    >
                      <div className="flex items-center gap-4 pl-12 py-3 rounded-lg hover:bg-white/5 transition-all relative">
                        <div
                          className={`absolute left-4 w-5 h-5 rounded-full border-2 ${
                            status === "strong"
                              ? "border-cyan-400 bg-cyan-400/20"
                              : status === "weak"
                              ? "border-red-400 bg-red-400/20"
                              : "border-amber-400 bg-amber-400/20"
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">EP {episode.episode_number}</span>
                            <span className="text-foreground font-medium group-hover:text-cyan-400 transition-colors">
                              {episode.title}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`text-sm font-medium ${
                            status === "strong" ? "text-cyan-400" : status === "weak" ? "text-red-400" : "text-amber-400"
                          }`}
                        >
                          {Math.round(eng * 100)}%
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* Continuity Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="col-span-12 lg:col-span-4 glass-card rounded-xl p-6"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" />
              Character Cards
            </h3>
            {characters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No characters yet.</p>
            ) : (
              <div className="space-y-4">
                {characters.map((character) => (
                  <div
                    key={character.name}
                    className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-foreground font-medium">{character.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{character.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {character.traits.map((trait) => (
                        <span
                          key={trait}
                          className={`px-2 py-0.5 rounded-full text-xs border ${traitColor(trait)}`}
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Version Diff Modal */}
      {selectedBaseVersionId && (
        <VersionDiffModal
          isOpen={showVersionDiff}
          onClose={() => setShowVersionDiff(false)}
          projectId={id}
          baseVersionId={selectedBaseVersionId}
          targetVersionId={project.active_version_id}
        />
      )}
    </div>
  )
}
