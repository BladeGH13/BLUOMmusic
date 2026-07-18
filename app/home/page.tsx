"use client"

import AppTopBar from "@/src/components/app-top-bar"
import { useRouter } from "@/src/router"
import { useFileStore } from "@/src/stores/file-store"
import { useThemeStore } from "@/src/stores/theme-store"
import {
  Add,
  AlbumRounded,
  Cloud,
  FolderRounded,
  HomeRounded,
  Login,
  SettingsRounded,
} from "@mui/icons-material"
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  Paper,
  Typography,
  Toolbar,
  IconButton,
  ListItemText,
  alpha,
  Backdrop,
  CircularProgress,
} from "@mui/material"
import { useState, useRef, ReactNode, memo } from "react"
import { css } from "@emotion/react"
import DownloadingIndicator from "@/src/components/downloading-indicator"
import { createOneDriveClient } from "@/src/drive-clients/onedrive-client"
import { setDriveConfig } from "@/src/drive-clients/base-drive-client"
import { createGoogleDriveClient } from "@/src/drive-clients/google-drive-client"

// Apple-style Brand Blue color for BLUOMtech corporate identity
const BLUOM_BLUE = "#007AFF"

const LoginPage = () => {
  const [loading, setLoading] = useState(false)

  const signInOneDrive = async () => {
    setLoading(true)
    setDriveConfig({ type: "onedrive" })
    const driveClient = await createOneDriveClient()
    const pca = driveClient.pca
    pca.setActiveAccount(null)
    const loginRequest = { scopes: ["Files.Read", "Sites.Read.All"] }
    pca.loginRedirect(loginRequest)
  }

  const signInGoogleDrive = async () => {
    setLoading(true)
    setDriveConfig({ type: "google-drive" })
    const driveClient = await createGoogleDriveClient()
    await driveClient.loginRedirect()
  }

  return (
    <div
      css={css({
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 64,
      })}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 400,
          width: "85%",
          padding: 3,
          margin: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          borderRadius: "20px", // Apple rounded style
          border: "1px solid rgba(0,0,0,0.08)",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px)",
        }}
      >
        <Cloud sx={{ fontSize: 80, color: BLUOM_BLUE, mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Connect to BLUOMmusic
        </Typography>
        <List sx={{ width: "100%" }}>
          <ListItemButton 
            onClick={signInOneDrive}
            sx={{ borderRadius: "12px", mb: 1, border: "1px solid rgba(0,0,0,0.05)" }}
          >
            <ListItemIcon><Cloud sx={{ color: BLUOM_BLUE }} /></ListItemIcon>
            <ListItemText primary="OneDrive" primaryTypographyProps={{ style: { fontWeight: 500 } }} />
            <Login sx={{ opacity: 0.5 }} />
          </ListItemButton>
          <ListItemButton 
            onClick={signInGoogleDrive}
            sx={{ borderRadius: "12px", border: "1px solid rgba(0,0,0,0.05)" }}
          >
            <ListItemIcon><Cloud sx={{ color: BLUOM_BLUE }} /></ListItemIcon>
            <ListItemText primary="Google Drive" primaryTypographyProps={{ style: { fontWeight: 500 } }} />
            <Login sx={{ opacity: 0.5 }} />
          </ListItemButton>
        </List>
      </Paper>
      <Backdrop open={loading} sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}>
        <CircularProgress sx={{ color: BLUOM_BLUE }} />
      </Backdrop>
    </div>
  )
}

// Apple iOS Tab-style Bottom Navigation Button
interface TabButtonProps {
  label: string
  icon: ReactNode
  active?: boolean
  onClick: () => void
}

const TabButton = ({ label, icon, active = false, onClick }: TabButtonProps) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        cursor: "pointer",
        color: active ? BLUOM_BLUE : "text.secondary",
        transition: "color 0.2s ease-in-out",
        padding: "6px 0",
      }}
    >
      <Box sx={{ transform: active ? "scale(1.05)" : "scale(1)", transition: "transform 0.2s" }}>
        {icon}
      </Box>
      <Typography variant="caption" sx={{ fontWeight: active ? 600 : 400, mt: 0.5, fontSize: "10px" }}>
        {label}
      </Typography>
    </Box>
  )
}

export default function Page() {
  const [fileStoreState] = useFileStore()
  const [routerState, routerActions] = useRouter()
  const routerActionsRef = useRef(routerActions)
  routerActionsRef.current = routerActions
  const [themeStoreState] = useThemeStore()

  const scrollTargetRef = useRef<Node | undefined>(undefined)
  const driveStatus = fileStoreState.driveStatus
  const downloadingCount = Object.keys(fileStoreState.syncingTrackFiles).length

  return (
    <div
      css={css({
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f5f5f7", // Soft Apple gray background
      })}
    >
      {/* Top Header - Settings pushed to the Top Right */}
      <AppTopBar scrollTarget={scrollTargetRef.current}>
        <Toolbar sx={{ justifyContent: "space-between", px: 2 }}>
          <Typography sx={{ fontWeight: 700, trackingSpacing: "-0.5px" }} variant="h5">
            BLUOMmusic
          </Typography>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {downloadingCount > 0 && (
              <DownloadingIndicator
                count={downloadingCount}
                color={BLUOM_BLUE}
              />
            )}
            <IconButton
              color="inherit"
              onClick={() => routerActionsRef.current.goSettings()}
              sx={{ color: "text.primary" }}
            >
              <SettingsRounded />
            </IconButton>
          </Box>
        </Toolbar>
      </AppTopBar>

      {/* Main Content Dashboard View */}
      <Box
        component="div"
        ref={scrollTargetRef}
        sx={{
          pt: 9,
          overflow: "auto",
          flexGrow: 1,
          px: 2,
          pb: "100px", // Breathing space above the bottom bar
        }}
      >
        {driveStatus === "not-configured" ? null : driveStatus === "no-account" ? (
          <LoginPage />
        ) : (
          <Box
            component="div"
            sx={{
              maxWidth: "600px",
              margin: "24px auto 0 auto",
              width: "100%",
              textAlign: "center",
            }}
          >
            {/* Minimalist Apple welcome card */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: "20px",
                backgroundColor: "#ffffff",
                border: "1px solid rgba(0,0,0,0.04)",
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Welcome Back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select a tab below to browse your synchronized sound library.
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>

      {/* Apple-style Bottom Navigation Bar */}
      {driveStatus !== "no-account" && driveStatus !== "not-configured" && (
        <Paper
          elevation={0}
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "calc(64px + env(safe-area-inset-bottom, 0px))",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            borderTop: "1px solid rgba(0, 0, 0, 0.08)",
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(20px)",
            zIndex: 10,
          }}
        >
          <TabButton 
            label="Home" 
            icon={<HomeRounded />} 
            active={true}
            onClick={() => {}} 
          />
          <TabButton 
            label="Files" 
            icon={<FolderRounded />} 
            onClick={() => {
              const rootFolderId = fileStoreState.rootFolderId
              if (rootFolderId) routerActionsRef.current.goFile(rootFolderId)
            }} 
          />
          <TabButton 
            label="Albums" 
            icon={<AlbumRounded />} 
            onClick={() => routerActionsRef.current.goAlbum()} 
          />
        </Paper>
      )}
    </div>
  )
}
