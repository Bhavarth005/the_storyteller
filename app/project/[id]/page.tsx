"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts"
import { AlertTriangle, GitBranch, ChevronRight, User, Sparkles, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VersionDiffModal } from "@/components/version-diff-modal"
import { use } from "react"

// Radar chart data
const radarData = [
  { subject: "Hook Strength", value: 85, fullMark: 100 },
  { subject: "Suspense Density", value: 72, fullMark: 100 },
  { subject: "Retention Stability", value: 68, fullMark: 100 },
  { subject: "Emotional Arc", value: 78, fullMark: 100 },
  { subject: "Pacing", value: 82, fullMark: 100 },
]

// Episode data for story arc
const episodes = [
  { number: 1, title: "The Discovery", status: "strong", retention: 85 },
  { number: 2, title: "Hidden Signals", status: "strong", retention: 82 },
  { number: 3, title: "The Confrontation", status: "weak", retention: 58 },
  { number: 4, title: "Fractured Trust", status: "moderate", retention: 71 },
  { number: 5, title: "Descent", status: "strong", retention: 79 },
  { number: 6, title: "The Reckoning", status: "strong", retention: 88 },
]

// Version history
const versions = [
  { id: "v3.2", date: "Today, 2:30 PM", changes: "Reworked Episode 3 cliffhanger", active: true },
  { id: "v3.1", date: "Yesterday", changes: "Enhanced opening hook", active: false },
  { id: "v3.0", date: "Mar 3", changes: "Major restructure", active: false },
  { id: "v2.4", date: "Mar 1", changes: "Added Episode 6", active: false },
]

// Character data
const characters = [
  {
    name: "Dr. Sarah Chen",
    description: "Lead AI researcher at Nexus Labs",
    traits: ["brilliant", "driven", "secretive"],
  },
  {
    name: "ARIA",
    description: "Advanced AI assistant with hidden agenda",
    traits: ["calculating", "evolving", "manipulative"],
  },
  {
    name: "Marcus Webb",
    description: "Investigative journalist pursuing the truth",
    traits: ["paranoid", "persistent", "ethical"],
  },
]

const traitColors: Record<string, string> = {
  brilliant: "bg-cyan-400/20 text-cyan-400 border-cyan-400/30",
  driven: "bg-purple-400/20 text-purple-400 border-purple-400/30",
  secretive: "bg-amber-400/20 text-amber-400 border-amber-400/30",
  calculating: "bg-red-400/20 text-red-400 border-red-400/30",
  evolving: "bg-emerald-400/20 text-emerald-400 border-emerald-400/30",
  manipulative: "bg-rose-400/20 text-rose-400 border-rose-400/30",
  paranoid: "bg-orange-400/20 text-orange-400 border-orange-400/30",
  persistent: "bg-blue-400/20 text-blue-400 border-blue-400/30",
  ethical: "bg-teal-400/20 text-teal-400 border-teal-400/30",
}

export default function SeriesOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [showVersionDiff, setShowVersionDiff] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState({ from: "v3.1", to: "v3.2" })
  
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
          <h1 className="text-3xl font-semibold text-foreground mb-2">The Midnight Protocol</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <GitBranch className="w-4 h-4" />
              v3.2
            </span>
            <span>6 Episodes</span>
            <span className="text-cyan-400">78% Avg Retention</span>
          </div>
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Radar Chart - Component A */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="col-span-12 lg:col-span-4 glass-card rounded-xl p-6"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
              Narrative Metrics
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
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
          </motion.div>

          {/* Weakest Link Warning - Component B */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="col-span-12 lg:col-span-4 glass-card rounded-xl p-6 border-amber-400/30"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-foreground mb-1">Weakest Link Detected</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Episode 3 shows significant retention drop. The confrontation scene lacks tension
                  buildup.
                </p>
                <Link href={`/project/${id}/episode/3`}>
                  <Button
                    variant="outline"
                    className="border-amber-400/30 text-amber-400 hover:bg-amber-400/10"
                  >
                    Edit Episode 3
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Version Control - Component D */}
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
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={() => setShowVersionDiff(true)}
              >
                <History className="w-3.5 h-3.5" />
                Compare
              </Button>
            </div>
            <div className="space-y-3">
              {versions.map((version, index) => (
                <button
                  key={version.id}
                  onClick={() => {
                    if (!version.active) {
                      setSelectedVersions({ from: version.id, to: "v3.2" })
                      setShowVersionDiff(true)
                    }
                  }}
                  className={`relative pl-6 py-2 w-full text-left hover:bg-white/5 rounded-lg transition-all ${
                    index < versions.length - 1 ? "border-l border-white/10 ml-2" : ""
                  }`}
                >
                  <div
                    className={`absolute left-0 top-3 w-4 h-4 rounded-full -translate-x-1/2 ${
                      version.active
                        ? "bg-cyan-400 glow-cyan"
                        : "bg-white/20"
                    }`}
                  />
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        version.active ? "text-cyan-400" : "text-foreground"
                      }`}
                    >
                      {version.id}
                    </span>
                    <span className="text-xs text-muted-foreground">{version.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{version.changes}</p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Story Arc Stepper - Component C */}
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
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-400 via-purple-400 to-cyan-400 opacity-30" />
              
              <div className="space-y-4">
                {episodes.map((episode) => (
                  <Link
                    key={episode.number}
                    href={`/project/${id}/episode/${episode.number}`}
                    className="group block"
                  >
                    <div className="flex items-center gap-4 pl-12 py-3 rounded-lg hover:bg-white/5 transition-all relative">
                      {/* Node */}
                      <div
                        className={`absolute left-4 w-5 h-5 rounded-full border-2 ${
                          episode.status === "strong"
                            ? "border-cyan-400 bg-cyan-400/20"
                            : episode.status === "weak"
                            ? "border-red-400 bg-red-400/20"
                            : "border-amber-400 bg-amber-400/20"
                        }`}
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">EP {episode.number}</span>
                          <span className="text-foreground font-medium group-hover:text-cyan-400 transition-colors">
                            {episode.title}
                          </span>
                        </div>
                      </div>
                      
                      <div
                        className={`text-sm font-medium ${
                          episode.status === "strong"
                            ? "text-cyan-400"
                            : episode.status === "weak"
                            ? "text-red-400"
                            : "text-amber-400"
                        }`}
                      >
                        {episode.retention}%
                      </div>
                      
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Continuity Tracker - Component E */}
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
                        className={`px-2 py-0.5 rounded-full text-xs border ${
                          traitColors[trait] || "bg-white/10 text-white/60 border-white/20"
                        }`}
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <VersionDiffModal
        isOpen={showVersionDiff}
        onClose={() => setShowVersionDiff(false)}
        fromVersion={selectedVersions.from}
        toVersion={selectedVersions.to}
      />
    </div>
  )
}
