export interface Options {
  onNeedRefresh: (updateSw: () => void) => void
}

// Extend global Window types interface parameters for compiler safety
declare global {
  interface Window {
    serwist?: {
      register: () => Promise<ServiceWorkerRegistration | undefined>
    }
  }
}

export const registerServiceWorker = async (options: Options) => {
  // Gracefully abort execution if PWA engines are not active or supported by the browser context
  if (!("serviceWorker" in navigator) || window.serwist === undefined) {
    return
  }

  const registration = await window.serwist.register()

  if (!registration) {
    return
  }

  const needsRefresh = (reg: ServiceWorkerRegistration) => {
    const updateSW = () => {
      const { waiting } = reg
      if (waiting) {
        console.log("[BLUOMmusic Engine] Activating next cache update generation core...");
        waiting.postMessage({ type: 'SKIP_WAITING' })
      }
    }

    options.onNeedRefresh(updateSW)
  }

  // Handle case where updatefound event was missed by catching active waiting routines instantly
  if (registration.waiting) {
    needsRefresh(registration)
  }

  let firstLoad = false

  registration.addEventListener("updatefound", () => {
    const { installing } = registration
    if (!installing) {
      return
    }

    installing.addEventListener("statechange", () => {
      if (registration.waiting) {
        if (navigator.serviceWorker.controller) {
          // Trigger prompt window parameters to flag core code deployment updates
          needsRefresh(registration)
        } else {
          firstLoad = true
        }
      }
    })
  })

  let refreshing = false
  
  // Intercept worker context updates to safely restart engine threads natively
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (firstLoad) {
      firstLoad = false
      return
    }

    if (!refreshing) {
      window.location.reload()
      refreshing = true
    }
  })
}
