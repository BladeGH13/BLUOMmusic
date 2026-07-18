"use client"

import { AudioPlayer } from "@/src/audio/audio-player"
import { PlayerCard } from "@/src/components/player-card"
import { FileStoreProvider } from "@/src/stores/file-store"
import { PlayerStoreProvider, usePlayerStore } from "@/src/stores/player-store"
import { DynamicBackground } from "@/src/components/dynamic-background"
import { Box, Fade, Button } from "@mui/material"
import {
  SnackbarKey,
  SnackbarProvider,
  closeSnackbar,
  enqueueSnackbar,
} from "notistack"
import { NetworkMonitorProvider } from "@/src/stores/network-monitor"
import { RouterProvider } from "@/src/router"
import { useEffect, useState } from "react"
import { useThemeStore } from "@/src/stores/theme-store"
import * as mm from "music-metadata-browser"
import { AudioDynamicsProvider } from "@/src/stores/audio-dynamics-store"
import { css } from "@emotion/css"
import { registerServiceWorker } from "./register-sw"
import {
  AudioDynamicsSettingsProvider,
  useAudioDynamicsSettingsStore,
} from "@/src/stores/audio-dynamics-settings"

// Apple-style Brand Blue color for BLUOMtech corporate identity
const BLUOM_BLUE = "#007AFF"

const ThemeChanger = () => {
  const [playerState] = usePlayerStore()
  const [, themeStoreActions] = useThemeStore()

  useEffect(() => {
    if (!playerState.activeTrack) return
    if (playerState.isActiveTrackLoading) return

    const cover = mm.selectCover(
      playerState.activeTrack.file.metadata?.common.picture
    )

    if (cover) {
      const blob = new Blob([cover.data], { type: cover.format })
      themeStoreActions.applyThemeFromImage(blob)
    } else {
      themeStoreActions.resetSourceColor()
    }
  }, [playerState.activeTrack, playerState.isActiveTrackLoading, themeStoreActions])

  return null
}

const AppMain = ({ children }: { children: React.ReactNode }) => {
  const [playerCardExpanded, setPlayerCardExpanded] = useState<boolean>(false)
  const [audioDynamicsSettings] = useAudioDynamicsSettingsStore()

  // Clean layout overlay tracking matching bottom tabs height requirements
  const snackbarContainerClass = css`
    margin-left: env(safe-area-inset-left, 0);
    margin-bottom: calc(
      env(safe-area-inset-bottom, 0) + ${playerCardExpanded ? "16" : "88"}px
    );
  `

  return (
    <SnackbarProvider
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      classes={{
        containerAnchorOriginBottomLeft: snackbarContainerClass,
      }}
      // Clean modern unified style layouts bypassing messy inline theme color builders
      sx={{
        "& .SnackbarContent-root": {
          borderRadius: "14px",
          backgroundColor: "#1c1c1e",
          color: "#ffffff",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }
      }}
    >
      <ThemeChanger />
      <DynamicBackground />
      <AudioPlayer />
      
      <Box
        component="div"
        sx={{
          height: "100%",
          width: "100%",
          position: "absolute",
          zIndex: audioDynamicsSettings.dynamicsEffectAppeal ? -1 : 0,
          opacity: audioDynamicsSettings.dynamicsEffectAppeal ? 0.4 : 1,
          filter: audioDynamicsSettings.dynamicsEffectAppeal
            ? "blur(calc(1vmin + 8px))"
            : "none",
          transform: audioDynamicsSettings.dynamicsEffectAppeal ? "scale(0.92)" : "scale(1)",
          transition: "all 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
          overflow: "hidden",
          backgroundColor: "#f5f5f7", // Root Apple gray backdrop canvas block
        }}
      >
        <Fade in={!playerCardExpanded} timeout={300} unmountOnExit>
          <Box component="div" sx={{ height: "100%" }}>
            {children}
          </Box>
        </Fade>
        
        <PlayerCard
          expand={playerCardExpanded}
          onShrink={() => setPlayerCardExpanded(false)}
          onExpand={() => setPlayerCardExpanded(true)}
        />
      </Box>
    </SnackbarProvider>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker({
      onNeedRefresh: updateSW => {
        const action = (snackbarId: SnackbarKey) => (
          <Button
            onClick={() => {
              updateSW()
              closeSnackbar(snackbarId)
            }}
            sx={{
              color: BLUOM_BLUE,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "14px"
            }}
          >
            Reload
          </Button>
        )
        
        enqueueSnackbar("A premium update version is available.", {
          action,
          persist: true,
        })
      },
    })
  }, [])

  return (
    <RouterProvider>
      <NetworkMonitorProvider>
        <FileStoreProvider>
          <PlayerStoreProvider>
            <AudioDynamicsSettingsProvider>
              <AudioDynamicsProvider>
                <AppMain>{children}</AppMain>
              </AudioDynamicsProvider>
            </AudioDynamicsSettingsProvider>
          </PlayerStoreProvider>
        </FileStoreProvider>
      </NetworkMonitorProvider>
    </RouterProvider>
  )
}
