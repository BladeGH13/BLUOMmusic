/* eslint-disable @next/next/no-img-element */
"use client"

import AppTopBar from "@/src/components/app-top-bar"
import { useRouter } from "@/src/router"
import { useFileStore } from "@/src/stores/file-store"
import { useThemeStore } from "@/src/stores/theme-store"
import { ArrowBackRounded } from "@mui/icons-material"
import {
  Box,
  IconButton,
  Paper,
  Toolbar,
  Typography,
  alpha,
  Link,
  SxProps,
  Theme,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Button,
  DialogContent,
  DialogActions,
  Backdrop,
  CircularProgress,
  Switch,
} from "@mui/material"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import { enqueueSnackbar } from "notistack"
import { css } from "@emotion/react"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

// Apple-style Brand Blue color for BLUOMtech corporate identity
const BLUOM_BLUE = "#007AFF"

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

// iOS Inspired Card Group Wrapper
function SettingGroup({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography 
        variant="caption" 
        sx={{ 
          pl: 2, 
          textTransform: "uppercase", 
          fontWeight: 600, 
          color: "text.secondary",
          letterSpacing: "0.5px"
        }}
      >
        {title}
      </Typography>
      <Paper
        elevation={0}
        sx={{
          mt: 0.75,
          borderRadius: "14px",
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.05)",
          backgroundColor: "#ffffff",
        }}
      >
        <List disablePadding>{children}</List>
      </Paper>
    </Box>
  )
}

interface StorageSettingsAreaProps {
  sx?: SxProps<Theme>
}

function StorageSettingsArea({ sx }: StorageSettingsAreaProps) {
  const [quota, setQuota] = useState<number | undefined>(undefined)
  const [usage, setUsage] = useState<number | undefined>(undefined)
  const [routerState, routerActions] = useRouter()
  const [fileStoreState, fileStoreActions] = useFileStore()
  const [clearLocalDataDialogOpen, setClearLocalDataDialogOpen] = useState(false)
  const [backdropOpen, setBackdropOpen] = useState(false)

  async function getStorageInfo() {
    const { quota, usage } = await navigator.storage.estimate()
    setQuota(quota)
    setUsage(usage)
  }

  useEffect(() => {
    getStorageInfo()
  }, [])

  const { blobsStorageMaxBytes, blobsStorageUsageBytes } = fileStoreState

  return (
    <Box component="div" sx={sx}>
      <SettingGroup title="Storage Management">
        <ListItem sx={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
          <ListItemText
            primary="Local Audio Cache"
            secondary="Space taken by downloaded tracks."
          />
          <Typography variant="body2" sx={{ fontWeight: 500, color: "text.secondary" }}>
            {blobsStorageUsageBytes !== undefined ? formatBytes(blobsStorageUsageBytes) : "---"}
            {" / "}
            {blobsStorageMaxBytes !== undefined ? formatBytes(blobsStorageMaxBytes) : "---"}
          </Typography>
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Total App Storage"
            secondary="Overall disk footprint on this device."
          />
          <Typography variant="body2" sx={{ fontWeight: 500, color: "text.secondary" }}>
            {usage !== undefined ? formatBytes(usage) : "---"} {" / "}
            {quota !== undefined ? formatBytes(quota) : "---"}
          </Typography>
        </ListItem>
      </SettingGroup>

      <Button
        variant="contained"
        disableElevation
        color="error"
        onClick={() => setClearLocalDataDialogOpen(true)}
        sx={{
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 600,
          py: 1,
          mb: 1,
          backgroundColor: alpha("#FF3B30", 0.1),
          color: "#FF3B30",
          "&:hover": { backgroundColor: alpha("#FF3B30", 0.15) }
        }}
      >
        Clear Local Data Cache
      </Button>

      <Dialog
        open={clearLocalDataDialogOpen}
        onClose={() => setClearLocalDataDialogOpen(false)}
        sx={{ "& .MuiDialog-paper": { borderRadius: "20px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Clear Cache</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will permanently erase your offline downloaded songs from this device. You will need to re-download them to listen without internet.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setClearLocalDataDialogOpen(false)} sx={{ textTransform: "none", color: "text.secondary" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            color="error"
            onClick={() => {
              setBackdropOpen(true)
              fileStoreActions
                .clearAllLocalBlobs()
                .then(() => routerActions.goHome({ reload: true }))
                .catch(error => {
                  console.error(error)
                  setBackdropOpen(false)
                })
            }}
            sx={{ borderRadius: "8px", textTransform: "none" }}
          >
            Clear Data
          </Button>
        </DialogActions>
      </Dialog>
      {backdropOpen && createPortal(
        <Backdrop sx={{ zIndex: theme => theme.zIndex.modal + 1 }} open={backdropOpen}>
          <CircularProgress sx={{ color: BLUOM_BLUE }} />
        </Backdrop>,
        document.body
      )}
    </Box>
  )
}

function ScreenSettingsArea() {
  const [isFullScreen, setIsFullScreen] = useState(false)

  useEffect(() => {
    setIsFullScreen(!!document.fullscreenElement)
  }, [])

  const handleFullScreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(err)
        enqueueSnackbar(`Fullscreen failed: ${err.message}`, { variant: "error" })
      })
    } else {
      document.exitFullscreen()
    }
    setIsFullScreen(!isFullScreen)
  }

  useEffect(() => {
    const cb = () => setIsFullScreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", cb)
    return () => document.removeEventListener("fullscreenchange", cb)
  }, [])

  return (
    <SettingGroup title="Display Preferences">
      <ListItem sx={{ py: 0.5 }}>
        <ListItemText
          primary="Immersive Full Screen"
          secondary="Hide UI window headers while playing."
        />
        <Switch
          checked={isFullScreen}
          edge="end"
          onChange={handleFullScreenToggle}
          sx={{
            "& .MuiSwitch-switchBase.Mui-checked": { color: BLUOM_BLUE },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: BLUOM_BLUE }
          }}
        />
      </ListItem>
    </SettingGroup>
  )
}

function ResetSettingsArea() {
  const [resetAppDialogOpen, setResetAppDialogOpen] = useState(false)
  const [backdropOpen, setBackdropOpen] = useState(false)
  const [routerState, routerActions] = useRouter()
  const [fileStoreState, fileStoreActions] = useFileStore()

  return (
    <Box>
      <SettingGroup title="System Maintenance">
        <ListItemButton 
          onClick={() => setResetAppDialogOpen(true)}
          sx={{ color: "#FF3B30" }}
        >
          <ListItemText
            primary="Reset BLUOMmusic"
            primaryTypographyProps={{ style: { fontWeight: 500 } }}
            secondary="Wipe settings, cached tracks, and log out."
          />
        </ListItemButton>
      </SettingGroup>

      <Dialog
        open={resetAppDialogOpen}
        onClose={() => setResetAppDialogOpen(false)}
        sx={{ "& .MuiDialog-paper": { borderRadius: "20px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Factory Reset Application</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            This will completely clear your configuration and bring the app back to a fresh install layout:
          </Typography>
          <Box component="ul" sx={{ pl: 2, fontSize: "0.875rem", color: "text.secondary" }}>
            <li>Erases local IndexedDB media tables</li>
            <li>Revokes cloud security authorization codes</li>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResetAppDialogOpen(false)} sx={{ textTransform: "none", color: "text.secondary" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            color="error"
            onClick={async () => {
              setBackdropOpen(true)
              localStorage.clear()
              sessionStorage.clear()
              const fileDb = fileStoreState.fileDb
              if (fileDb) fileDb.close()
              await new Promise<void>((resolve) => {
                const deleteReq = indexedDB.deleteDatabase("file-db")
                deleteReq.onsuccess = () => resolve()
                deleteReq.onerror = () => resolve()
                deleteReq.onblocked = () => resolve()
              })
              routerActions.goHome({ reload: true })
            }}
            sx={{ borderRadius: "8px", textTransform: "none" }}
          >
            Reset Factory Defaults
          </Button>
        </DialogActions>
      </Dialog>
      {backdropOpen && createPortal(
        <Backdrop sx={{ zIndex: theme => theme.zIndex.modal + 1 }} open={backdropOpen}>
          <CircularProgress sx={{ color: BLUOM_BLUE }} />
        </Backdrop>,
        document.body
      )}
    </Box>
  )
}

export default function Page() {
  const [routerState, routerActions] = useRouter()
  const scrollTargetRef = useRef<Node | undefined>(undefined)

  return (
    <Box
      component="div"
      sx={{
        height: "100%",
        overflow: "hidden",
        backgroundColor: "#f5f5f7", // Soft Apple settings gray background
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Settings Navigation Top Bar */}
      <AppTopBar scrollTarget={scrollTargetRef.current}>
        <Toolbar sx={{ px: 1 }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => routerActions.goBack()}
            sx={{ color: "text.primary" }}
          >
            <ArrowBackRounded />
          </IconButton>
          <Typography sx={{ fontWeight: 700, ml: 1 }} variant="h6">
            Settings
          </Typography>
        </Toolbar>
      </AppTopBar>

      {/* Settings Scrollable Panel Container */}
      <Box
        component="div"
        ref={scrollTargetRef}
        sx={{
          px: 2,
          pt: 9,
          overflow: "auto",
          flexGrow: 1,
          pb: "env(safe-area-inset-bottom, 24px)",
        }}
      >
        <Box
          component="div"
          sx={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "600px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <StorageSettingsArea />
          <ScreenSettingsArea />
          <ResetSettingsArea />

          {/* Clean Apple Style About Section Brand Block */}
          <SettingGroup title="System Version Info">
            <ListItem sx={{ py: 2, flexDirection: "column", alignItems: "center", textGap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
                BLUOMmusic Player
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Powered by BLUOMtech Engine Core
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Version: {process.env.APP_VERSION || "1.0.0-fork"}
              </Typography>
              <Box sx={{ display: "flex", gap: 3, mt: 2 }}>
                <Link
                  variant="caption"
                  href="https://github.com/ContentsViewer/cloud-music-box"
                  target="_blank"
                  rel="noopener"
                  sx={{ color: BLUOM_BLUE, textDecoration: "none", fontWeight: 500 }}
                >
                  Upstream Source
                </Link>
                <Link
                  variant="caption"
                  href="#"
                  sx={{ color: BLUOM_BLUE, textDecoration: "none", fontWeight: 500 }}
                >
                  BLUOMtech Hub
                </Link>
              </Box>
            </ListItem>
          </SettingGroup>
        </Box>
      </Box>
    </Box>
  )
}
