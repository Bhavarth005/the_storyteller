"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowRight, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { compareVersions, rollbackVersion } from "@/src/lib/api"
import { toast } from "sonner"

interface VersionDiffModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  baseVersionId: string
  targetVersionId: string
}

function formatDelta(value: string) {
  const num = parseFloat(value)
  const isPositive = num > 0
  return { num, isPositive, label: `${isPositive ? "+" : ""}${value}` }
}

export function VersionDiffModal({
  isOpen,
  onClose,
  projectId,
  baseVersionId,
  targetVersionId,
}: VersionDiffModalProps) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["versionCompare", baseVersionId, targetVersionId],
    queryFn: () => compareVersions(baseVersionId, targetVersionId),
    enabled: isOpen && !!baseVersionId && !!targetVersionId,
  })

  const rollback = useMutation({
    mutationFn: () => rollbackVersion({ project_id: projectId, target_version_id: baseVersionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      queryClient.invalidateQueries({ queryKey: ["projectVersions", projectId] })
      toast.success("Version restored successfully")
      onClose()
    },
    onError: () => toast.error("Failed to restore version"),
  })

  const deltas = data?.deltas
  const metrics = deltas
    ? [
        { name: "Overall Engagement", delta: deltas.overall_engagement },
        { name: "Average Cliffhanger", delta: deltas.average_cliffhanger },
        { name: "Retention Stability", delta: deltas.retention_stability },
      ]
    : []

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
                  <span className="px-3 py-1 rounded-full bg-white/10 text-xs truncate max-w-[120px]">
                    {baseVersionId.slice(0, 8)}
                  </span>
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                  <span className="px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-400 text-xs truncate max-w-[120px]">
                    {targetVersionId.slice(0, 8)} (active)
                  </span>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics.map((metric, index) => {
                    const { num, isPositive, label } = formatDelta(metric.delta)
                    return (
                      <motion.div
                        key={metric.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                      >
                        <span className="text-foreground font-medium">{metric.name}</span>
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                            isPositive
                              ? "bg-emerald-400/20 text-emerald-400"
                              : num < 0
                              ? "bg-red-400/20 text-red-400"
                              : "bg-white/10 text-muted-foreground"
                          }`}
                        >
                          {isPositive ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : num < 0 ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : null}
                          <span className="text-xs font-medium">{label}</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <Button variant="outline" className="border-white/10" onClick={onClose}>
                  Close
                </Button>
                <Button
                  className="bg-cyan-500 hover:bg-cyan-400 text-black glow-cyan"
                  onClick={() => rollback.mutate()}
                  disabled={rollback.isPending}
                >
                  {rollback.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
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
