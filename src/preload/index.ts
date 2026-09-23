import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppInfo,
  BacklogApi,
  DurationsRequest,
  DurationsResponse,
  GameMetadata,
  GogdbInfo,
  GogdbRequest,
  LinkPreview,
  LinkPreviewRequest,
  MetacriticDetails,
  MetacriticDetailsRequest,
  MetacriticRequest,
  MetacriticResponse,
  MetadataDetailsRequest,
  MetadataSearchRequest,
  MetadataSearchResponse,
  OpenJsonResponse,
  Result,
  SaveJsonRequest,
  SaveJsonResponse,
  SmokeReport
} from '@shared/types'

const shootArgument = process.argv.find((argument) => argument.startsWith('--backlog-shoot-view='))

const api: BacklogApi = {
  isSmoke: process.argv.includes('--backlog-smoke'),
  shootView: shootArgument ? shootArgument.split('=')[1] : null,
  getAppInfo: () => ipcRenderer.invoke('app:info') as Promise<Result<AppInfo>>,
  searchMetadata: (request: MetadataSearchRequest) =>
    ipcRenderer.invoke('metadata:search', request) as Promise<Result<MetadataSearchResponse>>,
  getMetadataDetails: (request: MetadataDetailsRequest) =>
    ipcRenderer.invoke('metadata:details', request) as Promise<Result<GameMetadata | null>>,
  getDurations: (request: DurationsRequest) =>
    ipcRenderer.invoke('metadata:durations', request) as Promise<Result<DurationsResponse>>,
  getGogdbInfo: (request: GogdbRequest) =>
    ipcRenderer.invoke('metadata:gogdb', request) as Promise<Result<GogdbInfo | null>>,
  getLinkPreview: (request: LinkPreviewRequest) =>
    ipcRenderer.invoke('link:preview', request) as Promise<Result<LinkPreview | null>>,
  getMetacritic: (request: MetacriticRequest) =>
    ipcRenderer.invoke('metadata:metacritic', request) as Promise<Result<MetacriticResponse>>,
  getMetacriticDetails: (request: MetacriticDetailsRequest) =>
    ipcRenderer.invoke('metadata:metacritic-details', request) as Promise<Result<MetacriticDetails | null>>,
  saveJsonFile: (request: SaveJsonRequest) =>
    ipcRenderer.invoke('file:save-json', request) as Promise<Result<SaveJsonResponse>>,
  openJsonFile: () => ipcRenderer.invoke('file:open-json') as Promise<Result<OpenJsonResponse>>,
  openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url) as Promise<Result<boolean>>,
  quit: () => ipcRenderer.invoke('app:quit') as Promise<void>,
  reportSmoke: (report: SmokeReport) => ipcRenderer.invoke('smoke:report', report) as Promise<Result<boolean>>
}

contextBridge.exposeInMainWorld('backlog', api)
