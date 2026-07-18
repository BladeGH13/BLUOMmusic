"use client"

import { Backdrop, CircularProgress } from "@mui/material"

// Apple-style Brand Blue color for BLUOMtech corporate identity
const BLUOM_BLUE = "#007AFF"

export default function Page() {
  return (
    <div>
      <Backdrop
        open={true}
        sx={{
          zIndex: theme => theme.zIndex.drawer + 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f5f5f7", // Solid Apple gray backdrop background
        }}
      >
        <CircularProgress sx={{ color: BLUOM_BLUE }} />
      </Backdrop>
    </div>
  )
}
