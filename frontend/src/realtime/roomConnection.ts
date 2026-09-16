import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';

import { env } from '../config/env';
import { useAuthStore } from '../store/authStore';

let connection: HubConnection | null = null;

/** Lazily-built singleton hub connection to /hubs/club, authenticated with the current access token. */
export function getRoomConnection(): HubConnection {
  if (!connection) {
    connection = new HubConnectionBuilder()
      .withUrl(`${env.apiBaseUrl}/hubs/club`, {
        accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
        transport: HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect([0, 1000, 3000, 5000, 10000, 15000])
      .configureLogging(__DEV__ ? LogLevel.Information : LogLevel.Warning)
      .build();
  }
  return connection;
}

/** Starts the connection if needed. On an auth failure it refreshes the session once and retries. */
export async function ensureConnected(): Promise<HubConnection> {
  const hub = getRoomConnection();
  if (hub.state === HubConnectionState.Connected) {
    return hub;
  }
  if (hub.state === HubConnectionState.Disconnected) {
    try {
      await hub.start();
    } catch (error) {
      if (looksLikeAuthFailure(error)) {
        await useAuthStore.getState().refreshSession();
        await hub.start();
      } else {
        throw error;
      }
    }
    return hub;
  }
  // Connecting / Reconnecting: wait for it to settle.
  await waitForConnected(hub);
  return hub;
}

export async function stopConnection(): Promise<void> {
  if (connection && connection.state !== HubConnectionState.Disconnected) {
    await connection.stop().catch(() => undefined);
  }
}

function waitForConnected(hub: HubConnection, timeoutMs = 15_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (hub.state === HubConnectionState.Connected) {
        resolve();
      } else if (hub.state === HubConnectionState.Disconnected) {
        reject(new Error('Connection dropped.'));
      } else if (Date.now() - started > timeoutMs) {
        reject(new Error('Timed out connecting to the room.'));
      } else {
        setTimeout(tick, 100);
      }
    };
    tick();
  });
}

function looksLikeAuthFailure(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  return /401|unauthori[sz]ed/i.test(text);
}

/** Hub errors arrive as "HubException: code: message"; extract both parts. */
export function parseHubError(error: unknown): { code: string; message: string } {
  const raw = error instanceof Error ? error.message : String(error);
  const cleaned = raw.replace(/^.*HubException:\s*/i, '').trim();
  const match = /^([a-z0-9_.]+):\s*(.+)$/i.exec(cleaned);
  if (match) {
    return { code: match[1], message: match[2] };
  }
  return { code: 'room.error', message: cleaned || 'Something went wrong in the room.' };
}
