"use client"

import { useFileStore } from "@/src/stores/file-store"
import { enqueueSnackbar } from "notistack"
import { useEffect, useRef, useState } from "react"
import { FileList } from "@/src/components/file-list"
import {
  Box,
  Fade,
  IconButton,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material"
import {
  MoreVert,
  CloudDownload,
  CloudOff,
  ArrowBackIosNewRounded,
} from "@mui/icons-material"
import { useRouter } from "@/src/router"
import { useThemeStore } from "@/src/stores/theme-store"
import { useNetworkMonitor } from "@/src/stores/network-monitor"
import { MarqueeText } from "@/src/components/marquee-text"
import AppTopBar from "@/src/components/app-top-bar"
import DownloadingIndicator from "@/src/components/downloading-indicator"
import {
  AudioTrackFileItem,
  BaseFileItem,
} from "@/src/drive-clients/base-drive-client"
import { css } from "@emotion/react"

// Apple-style Brand Blue color for BLUOMtech corporate identity
const BLUOM_BLUE = "#007AFF"

export default function OneDrivePage() {
  const [fileStoreState, fileStoreActions] = useFileStore()
  const networkMonitor = useNetworkMonitor()
  const scrollTargetRef = useRef<Node | undefined>(undefined)
  const [currentFile, setCurrentFile] = useState<BaseFileItem | null>(null)
  const [files, setFiles] = useState<BaseFileItem[] | undefined>([])
  const [folderId, setFolderId] = useState<string | undefined>(undefined)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [remoteFetching, setRemoteFetching] = useState(false)
  const [themeStoreState] = useThemeStore()
  const [routerState, routerActions] = useRouter()
  const routerActionsRef = useRef(routerActions)
  routerActionsRef.current = routerActions

  useEffect(() => {
    if (routerState.pathname !== "/files") return
    const folderId = decodeURIComponent(routerState.hash.slice(1))
    setFolderId(folderId)
    setFiles(undefined)
  }, [routerState.hash, routerState.pathname])

  useEffect(() => {
    if (!fileStoreState.configured) return

    let isCancelled = false
    const getFiles = async () => {
      if (!folderId) return
      const currentFile = await fileStoreActions.getFileById(folderId)
      if (isCancelled) return
      if (!currentFile) return
      setCurrentFile(currentFile)

      try {
        const localFiles = await fileStoreActions.getChildrenLocal(folderId)
        if (isCancelled) return
        if (localFiles) setFiles(localFiles)
      } catch (error) {
        console.error(error)
        enqueueSnackbar(`${error}`, { variant: "error" })
      }
    }
    getFiles()
    return () => { isCancelled = true }
  }, [fileStoreState.configured, folderId])

  useEffect(() => {
    if (fileStoreState.driveStatus !== "online" || !folderId) return

    let isCancelled = false
    const getFiles = async () => {
      try {
        setRemoteFetching(true)
        const remoteFiles = await fileStoreActions.getChildrenRemote(folderId)
        if (isCancelled) return
        if (remoteFiles) setFiles(remoteFiles)
        setRemoteFetching(false)
      } catch (error) {
        console.error(error)
        enqueueSnackbar(`${error}`, { variant: "error" })
        setRemoteFetching(false)
      }
    }
    getFiles()
    return () => { isCancelled = true }
  }, [fileStoreState.driveStatus, folderId])

  const handleMoreClose = () => setAnchorEl(null)

  const handleDownload = async () => {
    handleMoreClose()
    if (!files) return

    const fileStoreAction = fileStoreActions
    const audioFiles = files.filter(file => file.type === "audio-track") as AudioTrackFileItem[]
    audioFiles.forEach(async file => {
      try {
        await fileStoreAction.requestDownloadTrack(file.id)
      } catch (error) {
        console.error(error)
        enqueueSnackbar(`${error}`, { variant: "error" })
      }
    })
  }

  const downloadingCount = Object.keys(fileStoreState.syncingTrackFiles).length

  return (
    <Box
      component="div"
      sx={{
        height: "100%",
        overflow: "hidden",
        backgroundColor: "#f5f5f7", // Soft Apple gray background
      }}
    >
      <AppTopBar scrollTarget={scrollTargetRef.current}>
        <Toolbar sx={{ px: 1, justifyContent: "space-between" }}>
          
          {/* iOS Style Back Button */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => {
              if (!currentFile || currentFile.id === fileStoreState.rootFolderId) {
                routerActions.goHome()
                return
              }
              const parentId = currentFile.parentId
              if (parentId) routerActions.goFile(parentId)
            }}
            sx={{ color: BLUOM_BLUE, display: "flex", alignItems: "center" }}
          >
            <ArrowBackIosNewRounded sx={{ fontSize: 20, mr: 0.5 }} />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>Back</Typography>
          </IconButton>

          {/* Centered Window Title Context */}
          <Box sx={{ flexGrow: 1, mx: 2, overflow: "hidden", display: "flex", justifyContent: "center" }}>
            <MarqueeText
              variant="subtitle1"
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontWeight: 600,
                color: "text.primary",
                textAlign: "center"
              }}
              text={currentFile?.name || "OneDrive Files"}
            />
          </Box>

          {/* Right Align Toolbar Options */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {downloadingCount > 0 && (
              <DownloadingIndicator
                count={downloadingCount}
                color={BLUOM_BLUE}
              />
            )}

            <Box>
              <IconButton
                edge="end"
                onClick={event => setAnchorEl(event.currentTarget)}
                sx={{ color: "text.primary" }}
              >
                <MoreVert />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleMoreClose}
                sx={{ "& .MuiPaper-root": { borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" } }}
              >
                <MenuItem
                  disabled={!networkMonitor.isOnline}
                  onClick={handleDownload}
                >
                  <ListItemIcon sx={{ color: networkMonitor.isOnline ? BLUOM_BLUE : "inherit" }}>
                    {networkMonitor.isOnline ? <CloudDownload /> : <CloudOff />}
                  </ListItemIcon>
                  <ListItemText>Download Tracks</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>

        <Fade
          in={remoteFetching}
          style={{ transitionDelay: remoteFetching ? "800ms" : "0ms" }}
          unmountOnExit
        >
          <LinearProgress sx={{ width: "100%", height: "2px", backgroundColor: "transparent", "& .MuiLinearProgress-bar": { backgroundColor: BLUOM_BLUE } }} />
        </Fade>
      </AppTopBar>

      <Box
        component="div"
        ref={scrollTargetRef}
        sx={{
          pt: 8,
          ml: `env(safe-area-inset-left, 0)`,
          mr: `env(safe-area-inset-right, 0)`,
          overflow: "auto",
          height: "100%",
          pb: `calc(env(safe-area-inset-bottom, 0px) + 96px)`,
        }}
      >
        <FileList
          cssStyle={css({
            maxWidth: "600px", // Centered mobile viewport limit matching Google Drive page
            margin: "16px auto 0 auto",
            width: "100%",
          })}
          files={files}
          folderId={folderId}
        />
      </Box>
    </Box>
  )
}
