"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { 
  LayoutDashboard, 
  Plus, 
  Film,
  FolderOpen,
  Sparkles,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getProjects } from "@/src/lib/api"
import { signOut } from "next-auth/react"

const mainNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/project/new", icon: Plus, label: "New Series" },
]

export function AppSidebar() {
  const pathname = usePathname()

  const { data } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  })

  const recentProjects = (data?.projects ?? []).slice(0, 5)

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#0a0c10] border-r border-white/5 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-medium text-foreground block">Episodic</span>
            <span className="text-xs text-muted-foreground">Intelligence Engine</span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 relative group",
                isActive
                  ? "text-cyan-400 bg-cyan-400/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan-400 rounded-full"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div className="pt-6">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <FolderOpen className="w-3.5 h-3.5" />
              Recent Projects
            </div>
            <div className="mt-2 space-y-1">
              {recentProjects.map((project) => {
                const projectPath = `/project/${project.id}`
                const isActive = pathname.startsWith(projectPath)
                return (
                  <Link
                    key={project.id}
                    href={projectPath}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 truncate",
                      isActive
                        ? "text-foreground bg-white/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                    <span className="truncate">{project.title}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-200 w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
