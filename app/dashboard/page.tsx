"use client"

import { motion } from "framer-motion"
import { Plus, Clock, GitBranch, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Project {
  id: string
  title: string
  lastModified: string
  activeVersion: string
  episodes: number
  avgRetention: number
  gradient: string
}

const projects: Project[] = [
  {
    id: "1",
    title: "The Midnight Protocol",
    lastModified: "2 hours ago",
    activeVersion: "v3.2",
    episodes: 6,
    avgRetention: 78,
    gradient: "from-cyan-500/30 via-blue-500/20 to-purple-500/30",
  },
  {
    id: "2",
    title: "Echoes of Tomorrow",
    lastModified: "Yesterday",
    activeVersion: "v2.1",
    episodes: 8,
    avgRetention: 85,
    gradient: "from-purple-500/30 via-pink-500/20 to-red-500/30",
  },
  {
    id: "3",
    title: "Forgotten Realms",
    lastModified: "3 days ago",
    activeVersion: "v1.4",
    episodes: 5,
    avgRetention: 71,
    gradient: "from-emerald-500/30 via-cyan-500/20 to-blue-500/30",
  },
  {
    id: "4",
    title: "Binary Hearts",
    lastModified: "1 week ago",
    activeVersion: "v4.0",
    episodes: 10,
    avgRetention: 82,
    gradient: "from-orange-500/30 via-amber-500/20 to-yellow-500/30",
  },
]

export default function DashboardPage() {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={`/project/${project.id}`}>
                <div className="group relative overflow-hidden rounded-xl border border-white/10 hover:border-cyan-400/30 transition-all duration-300">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />
                  <div className="absolute inset-0 bg-[#0d0f14]/80" />
                  
                  {/* Content */}
                  <div className="relative p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-foreground group-hover:text-cyan-400 transition-colors duration-300">
                        {project.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {project.episodes} Episodes
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5" />
                        {project.activeVersion}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {project.lastModified}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-400/10 text-cyan-400 text-xs">
                        <TrendingUp className="w-3 h-3" />
                        {project.avgRetention}% Retention
                      </div>
                    </div>
                  </div>

                  {/* Hover glow effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
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
    </div>
  )
}
