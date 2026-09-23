import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { readFile, writeFile } from 'node:fs/promises'
import type {
  AppInfo,
  ErrorCode,
  ErrorDetails,
  DurationsRequest,
  DurationsResponse,
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
  OpenJsonResponse,
  Result,
  SaveJsonRequest,
  SaveJsonResponse,
  SmokeReport
} from '@shared/types'
import {
  getDurations,
  getGogdbInfo,
  getLinkPreview,
  getMetacriticDetails,
  getMetacriticMatch,
  getMetadataDetails,
  searchMetadata
} from './providers'

export interface IpcOptions {
  isSmoke: boolean
  onSmokeReport: (report: SmokeReport) => void
}

/** Registers a handler that never throws: errors become Result.error. */
function handle<Req, Res>(
  channel: string,
  listener: (event: Electron.IpcMainInvokeEvent, payload: Req) => Promise<Res> | Res
): void {
  ipcMain.handle(channel, async (event, payload: Req): Promise<Result<Res>> => {
    try {
      return { ok: true, data: await listener(event, payload) }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[ipc] ${channel} failed:`, message)
      const coded = error as { code?: ErrorCode; details?: ErrorDetails }
      const failure: Extract<Result<unknown>, { ok: false }> = { ok: false, error: message }
      if (coded.code) failure.code = coded.code
      if (coded.details) failure.details = coded.details
      return failure
    }
  })
}

function appInfo(isSmoke: boolean): AppInfo {
  return {
    name: app.getName(),
    version: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    platform: process.platform,
    arch: process.arch,
    userDataPath: app.getPath('userData'),
    isSmoke
  }
}

export function registerIpcHandlers(options: IpcOptions): void {
  handle<undefined, AppInfo>('app:info', () => appInfo(options.isSmoke))

  handle<MetadataSearchRequest, Awaited<ReturnType<typeof searchMetadata>>>('metadata:search', (_event, request) =>
    searchMetadata(request)
  )

  handle<MetadataDetailsRequest, Awaited<ReturnType<typeof getMetadataDetails>>>(
    'metadata:details',
    (_event, request) => getMetadataDetails(request)
  )

  handle<DurationsRequest, DurationsResponse>('metadata:durations', (_event, request) => getDurations(request))

  handle<GogdbRequest, GogdbInfo | null>('metadata:gogdb', (_event, request) => getGogdbInfo(request))

  handle<LinkPreviewRequest, LinkPreview | null>('link:preview', (_event, request) => getLinkPreview(request))

  handle<MetacriticRequest, MetacriticResponse>('metadata:metacritic', (_event, request) =>
    getMetacriticMatch(request)
  )

  handle<MetacriticDetailsRequest, MetacriticDetails | null>('metadata:metacritic-details', (_event, request) =>
    getMetacriticDetails(request)
  )

  handle<SaveJsonRequest, SaveJsonResponse>('file:save-json', async (event, request) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const dialogOptions: Electron.SaveDialogOptions = {
      title: 'Esporta backup Backlog Wars',
      defaultPath: request.defaultName,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    }
    const result = window
      ? await dialog.showSaveDialog(window, dialogOptions)
      : await dialog.showSaveDialog(dialogOptions)
    if (result.canceled || !result.filePath) return { saved: false }
    await writeFile(result.filePath, request.json, 'utf8')
    return { saved: true, path: result.filePath }
  })

  handle<undefined, OpenJsonResponse>('file:open-json', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const dialogOptions: Electron.OpenDialogOptions = {
      title: 'Importa backup Backlog Wars',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    }
    const result = window
      ? await dialog.showOpenDialog(window, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)
    const filePath = result.filePaths[0]
    if (result.canceled || !filePath) return { opened: false }
    const json = await readFile(filePath, 'utf8')
    return { opened: true, path: filePath, json }
  })

  handle<string, boolean>('shell:open-external', async (_event, url) => {
    if (!/^https?:\/\//i.test(url ?? '')) throw new Error('URL non valido: sono ammessi solo link http/https.')
    await shell.openExternal(url)
    return true
  })

  ipcMain.handle('smoke:report', (_event, report: SmokeReport) => {
    options.onSmokeReport(report)
    return { ok: true, data: true } satisfies Result<boolean>
  })

  ipcMain.handle('app:quit', () => {
    app.quit()
  })
}
