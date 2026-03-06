import { AppSidebar } from "@/components/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#07080B]">
      <AppSidebar />
      <main className="pl-64">
        {children}
      </main>
    </div>
  )
}
