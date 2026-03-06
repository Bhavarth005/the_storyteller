"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowRight, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MetricChange {
  name: string
  before: number
  after: number
}

interface VersionDiffModalProps {
  isOpen: boolean
  onClose: () => void
  fromVersion: string
  toVersion: string
}

const metricChanges: MetricChange[] = [
  { name: "Overall Engagement", before: 0.64, after: 0.78 },
  { name: "Hook Strength", before: 0.72, after: 0.85 },
  { name: "Retention Stability", before: 0.58, after: 0.71 },
  { name: "Cliffhanger Score", before: 0.81, after: 0.89 },
  { name: "Emotional Arc", before: 0.69, after: 0.78 },
]

export function VersionDiffModal({
  isOpen,
  onClose,
  fromVersion,
  toVersion,
}: VersionDiffModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
          >
            <div className="glass-card rounded-2xl p-8 relative">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-2">Version Comparison</h2>
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                  <span className="px-3 py-1 rounded-full bg-white/10">{fromVersion}</span>
                  <ArrowRight className="w-4 h-4" />
                  <span className="px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-400">
                    {toVersion}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {metricChanges.map((metric, index) => {
                  const change = metric.after - metric.before
                  const isPositive = change > 0
                  const percentChange = ((change / metric.before) * 100).toFixed(0)

                  return (
                    <motion.div
                      key={metric.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                    >
                      <span className="text-foreground font-medium">{metric.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">{metric.before.toFixed(2)}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">{metric.after.toFixed(2)}</span>
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                            isPositive
                              ? "bg-emerald-400/20 text-emerald-400"
                              : "bg-red-400/20 text-red-400"
                          }`}
                        >
                          {isPositive ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span className="text-xs font-medium">
                            {isPositive ? "+" : ""}
                            {change.toFixed(2)} ({isPositive ? "+" : ""}
                            {percentChange}%)
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <Button variant="outline" className="border-white/10" onClick={onClose}>
                  Close
                </Button>
                <Button className="bg-cyan-500 hover:bg-cyan-400 text-black glow-cyan">
                  Restore This Version
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
