"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import AdminSidebar from "@/components/admin-sidebar"


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't apply layout to login page
  if (!mounted || pathname === "/admin/login") {
    return <>{children}</>
  }

  // Check if user is logged in for other admin pages
  const isLoggedIn =
    typeof window !== "undefined" && (localStorage.getItem("adminSession") || localStorage.getItem("adminLoggedIn"))

  if (!isLoggedIn && pathname !== "/admin/login") {
    // Redirect to login will be handled by the page component
    return <>{children}</>
  }

  return <AdminSidebar currentPath={pathname}>{children}</AdminSidebar>
}
