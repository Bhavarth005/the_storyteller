"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Clock, MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { getProjects, deleteProject, patchProject, type ProjectListItem } from "@/src/lib/api"
import { toast } from "sonner"

const gradients = [
  "from-cyan-500/30 via-blue-500/20 to-purple-500/30",
  "from-purple-500/30 via-pink-500/20 to-red-500/30",
  "from-emerald-500/30 via-cyan-500/20 to-blue-500/30",
  "from-orange-500/30 via-amber-500/20 to-yellow-500/30",
  "from-rose-500/30 via-fuchsia-500/20 to-violet-500/30",
  "from-teal-500/30 via-green-500/20 to-lime-500/30",
]

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

export default function DashboardPage() {
  const queryClient = useQueryClient()
  const [renameTarget, setRenameTarget] = useState<ProjectListItem | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project deleted")
    },
    onError: () => toast.error("Failed to delete project"),
  })

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      patchProject(id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      setRenameTarget(null)
      toast.success("Project renamed")
    },
    onError: () => toast.error("Failed to rename project"),
  })

  const projects = data?.projects ?? []

  return (
    <div className="min-h-screen p-8 noise-bg">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-semibold text-foreground mb-2">Your Workspace</h1>
          <p className="text-muted-foreground">Continue crafting your narratives</p>
        </motion.div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
              <Plus className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-xl font-medium text-foreground mb-2">No projects yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first series to get started
            </p>
            <Link href="/project/new">
              <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-medium">
                <Plus className="w-4 h-4 mr-2" />
                Create New Series
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => {
              const gradient = gradients[index % gradients.length]
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="group relative overflow-hidden rounded-xl border border-white/10 hover:border-cyan-400/30 transition-all duration-300">
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />
                    <div className="absolute inset-0 bg-[#0d0f14]/80" />

                    {/* Content */}
                    <div className="relative p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <Link href={`/project/${project.id}`} className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-foreground group-hover:text-cyan-400 transition-colors duration-300 truncate">
                            {project.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 capitalize">
                            {project.input_type}
                          </p>
                        </Link>

                        {/* Context menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors relative z-10">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => {
                                setRenameTarget(project)
                                setRenameValue(project.title)
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-400 focus:text-red-400"
                              onClick={() => deleteMutation.mutate(project.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {timeAgo(project.updated_at)}
                        </div>
                      </div>
                    </div>

                    {/* Hover glow effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Link href="/project/new">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="fixed bottom-8 right-8"
        >
          <Button
            size="lg"
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-medium px-6 py-6 rounded-full glow-cyan transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Series
          </Button>
        </motion.div>
      </Link>

      {/* Rename Dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Series</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!renameTarget || !renameValue.trim()) return
              renameMutation.mutate({ id: renameTarget.id, title: renameValue.trim() })
            }}
          >
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Series title"
              className="mb-4"
              autoFocus
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={!renameValue.trim() || renameMutation.isPending}
                className="bg-cyan-500 hover:bg-cyan-400 text-black"
              >
                {renameMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
