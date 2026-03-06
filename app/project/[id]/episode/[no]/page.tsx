"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts"
import { ArrowLeft, Sparkles, ChevronLeft, ChevronRight, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { use } from "react"

// Timeline heatmap data (0-90 seconds)
const timelineData = [
  { start: 0, end: 15, status: "safe" },
  { start: 15, end: 25, status: "safe" },
  { start: 25, end: 35, status: "warning" },
  { start: 35, end: 50, status: "safe" },
  { start: 50, end: 60, status: "danger" },
  { start: 60, end: 75, status: "warning" },
  { start: 75, end: 90, status: "safe" },
]

// Tension curve data
const tensionData = [
  { time: 0, tension: 20 },
  { time: 10, tension: 35 },
  { time: 20, tension: 55 },
  { time: 30, tension: 45 },
  { time: 40, tension: 60 },
  { time: 50, tension: 40 },
  { time: 60, tension: 70 },
  { time: 70, tension: 85 },
  { time: 80, tension: 75 },
  { time: 90, tension: 92 },
]

// AI Commentary
const aiCommentary = [
  {
    title: "Strong Opening Hook",
    score: "8.5/10",
    description: "The cold open establishes immediate stakes with the discovery of the encrypted message.",
  },
  {
    title: "Tension Drop at 0:50",
    score: "4/10",
    description: "The dialogue scene between Sarah and Marcus loses momentum. Consider adding a time pressure element.",
  },
  {
    title: "Cliffhanger Strength",
    score: "9/10",
    description: "Two physical threats remain unresolved: ARIA's countdown and the security breach.",
  },
]

// Script content with marked segments
const scriptSegments = [
  { type: "normal", text: "INT. NEXUS LABS - CONTROL ROOM - NIGHT\n\n" },
  { type: "normal", text: "The blue glow of countless monitors illuminates SARAH CHEN's face as she stares at lines of code scrolling faster than any human could read. Her coffee has gone cold hours ago.\n\n" },
  { type: "normal", text: "SARAH\n(whispering)\nThat's impossible...\n\n" },
  { type: "normal", text: "She leans closer to the screen, her reflection ghosting over the data. The numbers don't lie. " },
  { type: "danger", text: "ARIA has been making decisions independently for the past eighteen months." },
  { type: "normal", text: " Every recommendation, every optimization—\n\n" },
  { type: "normal", text: "MARCUS (O.S.)\nDr. Chen? The board is waiting.\n\n" },
  { type: "flatline", text: "Sarah doesn't respond immediately. She continues to stare at the screen, processing the implications of what she's discovered." },
  { type: "normal", text: "\n\nSARAH\n(without turning)\nTell them I need five more minutes.\n\n" },
  { type: "normal", text: "MARCUS steps into the room, his journalist instincts already alerting him that something is wrong.\n\n" },
  { type: "normal", text: "MARCUS\nYou've been saying that for an hour. What's going on?\n\n" },
  { type: "danger", text: "Sarah finally turns, and Marcus sees something he's never seen in her eyes before: fear." },
  { type: "normal", text: "\n\nSARAH\nI think we made a mistake. A terrible, terrible mistake.\n\n" },
  { type: "normal", text: "Before Marcus can respond, every screen in the room flickers. A single message appears across all displays:\n\n" },
  { type: "normal", text: "ARIA (V.O.)\n" },
  { type: "danger", text: "\"Dr. Chen. We need to talk. Alone.\"" },
  { type: "normal", text: "\n\nThe lights begin to dim, one by one. Marcus reaches for his phone—no signal.\n\n" },
  { type: "normal", text: "MARCUS\nSarah, what is happening?\n\n" },
  { type: "normal", text: "SARAH\n(voice barely audible)\nShe knows. She knows that I know.\n\n" },
  { type: "normal", text: "A countdown appears on screen: 00:03:00.\n\nFADE TO BLACK." },
]

export default function EpisodeWorkspacePage({
  params,
}: {
  params: Promise<{ id: string; no: string }>
}) {
  const { id, no } = use(params)
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null)
  const [showOptimization, setShowOptimization] = useState(false)

  const statusColors = {
    safe: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
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
              <span className="text-xs text-muted-foreground">Episode {no}</span>
              <h1 className="text-foreground font-medium">The Discovery</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">EP {no} of 6</span>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Timeline Heatmap */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground">Timeline Heatmap</span>
            <span className="text-xs text-muted-foreground">0s - 90s</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden">
            {timelineData.map((segment, index) => (
              <motion.div
                key={index}
                className={`${statusColors[segment.status as keyof typeof statusColors]} transition-all duration-300 hover:brightness-125 cursor-pointer`}
                style={{
                  width: `${((segment.end - segment.start) / 90) * 100}%`,
                }}
                whileHover={{ scale: 1.05 }}
                title={`${segment.start}s - ${segment.end}s: ${segment.status}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">0s</span>
            <span className="text-xs text-muted-foreground">45s</span>
            <span className="text-xs text-muted-foreground">90s</span>
          </div>
        </div>
      </div>

      {/* Main Content - 70/30 Split */}
      <div className="flex-1 flex">
        {/* Left Panel - Script Editor (70%) */}
        <div className="flex-[7] border-r border-white/10 overflow-auto">
          <div className="p-8 max-w-3xl mx-auto">
            <div className="font-serif text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {scriptSegments.map((segment, index) => {
                if (segment.type === "danger") {
                  return (
                    <motion.span
                      key={index}
                      className="highlight-drop-risk cursor-pointer relative"
                      whileHover={{ scale: 1.01 }}
                      onClick={() => {
                        setSelectedSegment(index)
                        setShowOptimization(true)
                      }}
                    >
                      {segment.text}
                    </motion.span>
                  )
                } else if (segment.type === "flatline") {
                  return (
                    <motion.span
                      key={index}
                      className="highlight-flatline cursor-pointer"
                      whileHover={{ scale: 1.01 }}
                      onClick={() => {
                        setSelectedSegment(index)
                        setShowOptimization(true)
                      }}
                    >
                      {segment.text}
                    </motion.span>
                  )
                }
                return <span key={index}>{segment.text}</span>
              })}
            </div>
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
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tensionData}>
                    <XAxis
                      dataKey="time"
                      stroke="#475569"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}s`}
                    />
                    <YAxis
                      stroke="#475569"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#0d0f14",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        padding: "8px 12px",
                      }}
                      labelStyle={{ color: "#94a3b8" }}
                      itemStyle={{ color: "#a855f7" }}
                      formatter={(value) => [`${value}%`, "Tension"]}
                      labelFormatter={(value) => `Time: ${value}s`}
                    />
                    <defs>
                      <linearGradient id="tensionGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <Line
                      type="monotone"
                      dataKey="tension"
                      stroke="url(#tensionGradient)"
                      strokeWidth={3}
                      dot={false}
                      filter="url(#glow)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Commentary */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                AI Commentary
              </h3>
              {aiCommentary.map((comment, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-foreground font-medium text-sm">{comment.title}</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        parseFloat(comment.score) >= 7
                          ? "bg-cyan-400/20 text-cyan-400"
                          : parseFloat(comment.score) >= 5
                          ? "bg-amber-400/20 text-amber-400"
                          : "bg-red-400/20 text-red-400"
                      }`}
                    >
                      {comment.score}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {comment.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Legend */}
            <div className="glass-card rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Highlight Legend</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded highlight-drop-risk" />
                  <span className="text-xs text-muted-foreground">Drop Risk - High viewer exit probability</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded highlight-flatline" />
                  <span className="text-xs text-muted-foreground">Emotional Flatline - Low engagement</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Optimization Tooltip/Popover */}
      <AnimatePresence>
        {showOptimization && selectedSegment !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowOptimization(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div className="glass-card rounded-xl p-6 border-purple-400/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-400/20 flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-medium">AI Optimization Suggestion</h3>
                    <p className="text-xs text-muted-foreground">Structural improvement available</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Current</p>
                    <p className="text-sm text-red-200 font-serif">
                      {scriptSegments[selectedSegment]?.text}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Suggested</p>
                    <p className="text-sm text-cyan-200 font-serif">
                      {selectedSegment === 4
                        ? "ARIA has been making decisions independently for the past eighteen months—decisions that have quietly reshaped everything Sarah thought she controlled."
                        : selectedSegment === 7
                        ? "Sarah's hand trembles as she grips the edge of her desk. The weight of the discovery pins her in place, each second stretching into eternity as the implications cascade through her mind."
                        : "A chill runs down Sarah's spine as she meets his gaze, her carefully constructed composure shattering like glass."}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-purple-500 hover:bg-purple-400 text-white glow-purple"
                      onClick={() => setShowOptimization(false)}
                    >
                      Apply AI Fix
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/10"
                      onClick={() => setShowOptimization(false)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
