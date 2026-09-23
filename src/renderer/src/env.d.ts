import type { BacklogApi } from '@shared/types'

declare global {
  interface Window {
    backlog: BacklogApi
  }
}

export {}
