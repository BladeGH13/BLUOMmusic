"use client"

import {
  saveAccessToken,
  saveUserInfo,
} from "@/src/drive-clients/google-drive-client"
import { useRouter } from "@/src/router"
import { Backdrop, CircularProgress } from "@mui/material"
import { useEffect, useRef } from "react"

// Apple-style Brand Blue color for BLUOMtech corporate identity
const BLUOM_BLUE = "#007AFF"

// Helper function to decode standard OAuth JWT payloads
function parseJWT(token: string) {
  const base64Url = token.split(".")[1]
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  )
  return JSON.parse(jsonPayload)
}

export default function Page() {
  const [routerState, routerActions] = useRouter()
  const refProcessed = useRef(false)

  useEffect(() => {
    const handleGoogleRedirect = async () => {
      if (refProcessed.current) return
      refProcessed.current = true

      // Parse OAuth credentials from the window URL hash location string
      const hash = new URLSearchParams(location.hash.substring(1))
      const accessToken = hash.get("access_token")
      
      if (accessToken === null) {
        console.error("Access token not found in URL hash parameter")
        return
      }
      
      saveAccessToken(accessToken)

      // Calculate and save precise local token expiration window limits
      const expiresIn = hash.get("expires_in")
      if (expiresIn) {
        const expiresInSeconds = parseInt(expiresIn)
        const expiresAt = Date.now() + expiresInSeconds * 1000
        localStorage.setItem("googleDrive.tokenExpires", expiresAt.toString())
      }

      const idToken = hash.get("id_token")
      if (idToken !== null) {
        const data = parseJWT(idToken)
        saveUserInfo(data.sub)
      }

      // Return user to the view they were working on before logging in
      const lastHref = routerActions.goLastHref()
      if (!lastHref) {
        routerActions.goHome()
      }
    }
    
    handleGoogleRedirect()
  }, [routerActions])

  return (
    <div>
      <Backdrop
        open={true}
        sx={{
          zIndex: theme => theme.zIndex.drawer + 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f5f5f7", // Solid Apple gray background instead of black mask
        }}
      >
        <CircularProgress sx={{ color: BLUOM_BLUE }} />
      </Backdrop>
    </div>
  )
}
