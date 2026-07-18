"use client"

import { useRouter } from "@/src/router"
import { useEffect, useRef } from "react"
import { Box } from "@mui/material"

export default function Page() {
  const [routerState, routerActions] = useRouter()
  const routerActionsRef = useRef(routerActions)
  routerActionsRef.current = routerActions

  useEffect(() => {
    // Check for the last visited path or fall back straight to the new Home layout
    const lastHref = routerActionsRef.current.goLastHref()
    if (!lastHref) {
      routerActionsRef.current.goHome()
    }
  }, [])

  return (
    // Solid background matching the rest of the application layout to prevent flash on load
    <Box 
      sx={{ 
        width: "100vw", 
        height: "100vh", 
        backgroundColor: "#f5f5f7" 
      }} 
    />
  )
}
