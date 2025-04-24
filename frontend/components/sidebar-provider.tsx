"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type SidebarContextType = {
  isOpen: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  // Create the context value
  const contextValue = {
    isOpen,
    toggleSidebar,
  }

  return <SidebarContext.Provider value={contextValue}>{children}</SidebarContext.Provider>
}

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
