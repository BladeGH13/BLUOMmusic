"use client"

import { getDriveConfig } from "@/src/drive-clients/base-drive-client"
import OneDrivePage from "./onedrive-page"
import GoogleDrivePage from "./google-drive-page"
import { useEffect, useState } from "react"
import { Box } from "@mui/material"

export default function Page() {
  const [driveType, setDriveType] = useState<string | undefined>(undefined)

  useEffect(() => {
    // Get cloud drive service configurations on client assembly mount
    const driveConfig = getDriveConfig()
    setDriveType(driveConfig?.type)
  }, [])

  switch (driveType) {
    case "google-drive":
      return <GoogleDrivePage />
    case "onedrive":
      return <OneDrivePage />
    default:
      // Render a clean Apple canvas layer during initial hydration checking to prevent layout flash
      return (
        <Box 
          sx={{ 
            width: "100vw", 
            height: "100vh", 
            backgroundColor: "#f5f5f7" 
          }} 
        />
      )
  }
}
