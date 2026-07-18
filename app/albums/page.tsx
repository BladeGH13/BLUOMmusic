"use client"
import { AlbumCover } from "@/src/components/album-cover"
import AppTopBar from "@/src/components/app-top-bar"
import { MarqueeText } from "@/src/components/marquee-text"
import { useRouter } from "@/src/router"
import { AlbumItem, useFileStore } from "@/src/stores/file-store"
import { useThemeStore } from "@/src/stores/theme-store"
import { TrackList } from "@/src/components/track-list"
import { Theme } from "@emotion/react"
import {
  FolderOpenRounded,
  ArrowBackIosNewRounded,
} from "@mui/icons-material"
import {
  Box,
  Fade,
  IconButton,
  SxProps,
  Toolbar,
  Typography,
  ButtonBase,
} from "@mui/material"
import React, { useCallback, useMemo, useRef } from "react"
import { useEffect, useState } from "react"
import { css } from "@emotion/react"
import DownloadingIndicator from "@/src/components/downloading-indicator"
import { usePlayerStore } from "@/src/stores/player-store"
import { AudioTrackFileItem } from "@/src/drive-clients/base-drive-client"

// Apple-style Brand Blue color for BLUOMtech corporate identity
const BLUOM_BLUE = "#007AFF"

const AlbumCard = React.memo(function AlbumCard({
  albumItem,
  openAlbum = () => {},
  appeal = false,
}: {
  albumItem: AlbumItem
  openAlbum?: (albumId: string) => void
  appeal?: boolean
}) {
  const [themeStoreState] = useThemeStore()
  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!albumItem.cover) return
    const url = URL.createObjectURL(albumItem.cover)
    setCoverUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [albumItem.cover])

  return (
    <Box
      component="div"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <ButtonBase
        sx={{
          borderRadius: "16px", // Clean Apple style rounded cover
          overflow: "hidden",
          width: "100%",
          boxShadow: appeal ? `0 0 0 3px ${BLUOM_BLUE}` : "0 4px 14px rgba(0,0,0,0.06)",
          transition: "transform 0.2s ease",
          "&:hover": {
            transform: "scale(1.02)",
          },
        }}
        onClick={() => openAlbum(albumItem.name)}
      >
        <AlbumCover
          sx={{
            width: "100%",
            height: "auto",
            aspectRatio: "1 / 1",
          }}
          coverUrl={coverUrl}
        />
      </ButtonBase>
      <Typography
        variant="body2"
        sx={{
          mt: 1,
          fontWeight: 500,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%",
          textAlign: "center",
          color: "text.primary",
        }}
      >
        {albumItem.name}
      </Typography>
    </Box>
  )
})

interface AlbumListProps {
  albums: AlbumItem[]
  activeAlbumId: string | undefined
}

const AlbumList = React.memo(function AlbumList({
  albums,
  activeAlbumId,
}: AlbumListProps) {
  const [routerState, routerActions] = useRouter()
  const routerActionsRef = useRef(routerActions)
  routerActionsRef.current = routerActions

  const openAlbum = useCallback((albumId: string) => {
    if (!routerActionsRef.current) return
    routerActionsRef.current.goAlbum(albumId)
  }, [])

  return (
    <Box
      component="div"
      sx={{
        gap: 3,
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        display: "grid",
        maxWidth: "600px", // Keep it aligned within premium viewport bounds
        margin: "0 auto",
        width: "100%",
      }}
    >
      {albums.map(album => (
        <AlbumCard
          key={album.name}
          albumItem={album}
          openAlbum={openAlbum}
          appeal={album.name === activeAlbumId}
        />
      ))}
    </Box>
  )
})

interface AlbumListPageProps {
  sx?: SxProps<Theme>
  onMount?: () => void
}

const AlbumListPage = React.memo(function AlbumListPage(props: AlbumListPageProps) {
  const [fileStoreState, fileStoreActions] = useFileStore()
  const [playerState] = usePlayerStore()

  const activeAlbumId = useMemo(() => {
    if (!playerState.activeTrack) return undefined
    let albumName = playerState.activeTrack.file.metadata?.common.album
    if (albumName === undefined) albumName = "Unknown Album"
    return albumName.replace(/\0+$/, "")
  }, [playerState.activeTrack])

  const [albums, setAlbums] = useState<AlbumItem[]>([])

  useEffect(() => {
    props.onMount?.()
  }, [])

  useEffect(() => {
    if (!fileStoreState.configured) return
    let isCanceled = false

    const getAlbums = async () => {
      const albumIds = await fileStoreActions.getAlbumIds()
      if (isCanceled) return
      const fetchedAlbums = await Promise.all(
        albumIds.map(async albumId => await fileStoreActions.getAlbumById(albumId))
      )
      if (isCanceled) return
      setAlbums(fetchedAlbums)
    }

    getAlbums()
    return () => { isCanceled = true }
  }, [fileStoreState.configured])

  return (
    <Box component="div" sx={{ p: 2, ...props.sx }}>
      <AlbumList albums={albums} activeAlbumId={activeAlbumId} />
    </Box>
  )
})

interface AlbumPageProps {
  sx?: SxProps<Theme>
  albumItem?: AlbumItem
  onMount?: () => void
}

const AlbumPage = React.memo(function AlbumPage({ albumItem, onMount, sx }: AlbumPageProps) {
  const [fileStoreState, fileStoreActions] = useFileStore()
  const fileStoreActionsRef = useRef(fileStoreActions)
  fileStoreActionsRef.current = fileStoreActions
  const [routerState, routerActions] = useRouter()
  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined)
  const [tracks, setTracks] = useState<AudioTrackFileItem[] | undefined>([])

  useEffect(() => {
    onMount?.()
  }, [])

  useEffect(() => {
    if (!albumItem?.fileIds) return
    const getTracks = async () => {
      const fetchedTracks = await Promise.all(
        albumItem.fileIds.map(async fileId => {
          return (await fileStoreActionsRef.current.getFileById(fileId)) as AudioTrackFileItem
        })
      )
      setTracks(fetchedTracks)
    }
    getTracks()
  }, [albumItem?.fileIds])

  useEffect(() => {
    if (!albumItem?.cover) return
    const url = URL.createObjectURL(albumItem.cover)
    setCoverUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [albumItem?.cover])

  return (
    <Box
      component="div"
      sx={{
        ...sx,
        display: "flex",
        flexDirection: "column",
        maxWidth: "600px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <Box
        component="div"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          px: 2,
          gap: 2,
          width: "100%",
          my: 4,
          textAlign: "center",
        }}
      >
        <ButtonBase sx={{ borderRadius: "20px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
          <AlbumCover sx={{ width: "220px", height: "220px" }} coverUrl={coverUrl} />
        </ButtonBase>

        <Box component="div" sx={{ width: "100%" }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary", mb: 1 }}>
            {albumItem ? albumItem.name : ""}
          </Typography>
          
          <Box component="div" sx={{ display: "flex", justifyContent: "center" }}>
            <IconButton
              sx={{ color: BLUOM_BLUE }}
              onClick={() => {
                if (!tracks || tracks.length === 0) return
                const folderId = tracks[0].parentId
                if (folderId) routerActions.goFile(folderId)
              }}
            >
              <FolderOpenRounded />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <TrackList
        cssStyle={css({ paddingLeft: 0, paddingRight: 0 })}
        tracks={tracks}
        albumId={albumItem?.name}
      />
    </Box>
  )
}

export default function Page() {
  const [routerState, routerActions] = useRouter()
  const [currentAlbum, setCurrentAlbum] = useState<AlbumItem | undefined>(undefined)
  const [fileStoreState, fileStoreActions] = useFileStore()
  const fileStoreActionsRef = useRef(fileStoreActions)
  fileStoreActionsRef.current = fileStoreActions

  const albumPageRef = useRef<Node | undefined>(undefined)
  const albumListRef = useRef<Node | undefined>(undefined)
  const [scrollTarget, setScrollTarget] = useState<Node | undefined>(undefined)

  useEffect(() => {
    const albumId = decodeURIComponent(routerState.hash.slice(1))
    if (albumId === "") {
      setCurrentAlbum(undefined)
      return
    }
    if (!fileStoreState.configured) return

    const getAlbum = async () => {
      const album = await fileStoreActionsRef.current.getAlbumById(albumId)
      setCurrentAlbum(album)
    }
    getAlbum()
  }, [routerState.hash, fileStoreState.configured])

  const downloadingCount = Object.keys(fileStoreState.syncingTrackFiles).length

  return (
    <Box
      component="div"
      sx={{
        height: "100%",
        overflow: "hidden",
        backgroundColor: "#f5f5f7", // Apple style gray background canvas
      }}
    >
      <AppTopBar scrollTarget={scrollTarget}>
        <Toolbar sx={{ px: 1, justifyContent: "space-between" }}>
          
          {/* Back Navigation Trigger */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => {
              if (currentAlbum) {
                routerActions.goAlbum()
                return
              }
              routerActions.goHome()
            }}
            sx={{ color: BLUOM_BLUE, display: "flex", alignItems: "center" }}
          >
            <ArrowBackIosNewRounded sx={{ fontSize: 20, mr: 0.5 }} />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>Back</Typography>
          </IconButton>

          {/* Centered Album Header Title Context */}
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
              text={currentAlbum ? currentAlbum.name : "Albums"}
            />
          </Box>

          {/* Top Right Downloading Status Counter Slot */}
          <Box sx={{ display: "flex", alignItems: "center", minWidth: 48, justifyContent: "flex-end" }}>
            {downloadingCount > 0 && (
              <DownloadingIndicator
                count={downloadingCount}
                color={BLUOM_BLUE}
              />
            )}
          </Box>
        </Toolbar>
      </AppTopBar>

      <Box
        component="div"
        sx={{
          ml: `env(safe-area-inset-left, 0)`,
          mr: `env(safe-area-inset-right, 0)`,
          position: "relative",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <Fade in={currentAlbum !== undefined} timeout={400} unmountOnExit>
          <Box
            component="div"
            ref={albumPageRef}
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              left: 0,
              pt: 8,
              pb: `calc(env(safe-area-inset-bottom, 0px) + 96px)`,
              overflow: "auto",
              height: "100%",
            }}
          >
            <AlbumPage
              albumItem={currentAlbum}
              onMount={() => setScrollTarget(albumPageRef.current)}
            />
          </Box>
        </Fade>
        
        <Fade in={currentAlbum === undefined} timeout={400} unmountOnExit>
          <Box
            component="div"
            ref={albumListRef}
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              left: 0,
              pt: 8,
              pb: `calc(env(safe-area-inset-bottom, 0px) + 96px)`,
              overflow: "auto",
              height: "100%",
            }}
          >
            <AlbumListPage
              onMount={() => setScrollTarget(albumListRef.current)}
            />
          </Box>
        </Fade>
      </Box>
    </Box>
  )
}
