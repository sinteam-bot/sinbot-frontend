import { useDiscordApi } from './useDiscordApi.ts';

export interface TeamSpeakServerInfo {
  name?: string;
  version?: string;
  platform?: string;
  uptime?: number;
  channelsOnline?: number;
  totalChannels?: number;
  clientsOnline?: number;
  maxClients?: number;
  host?: string;
  port?: number;
  online?: boolean;
  joinUrl?: string;
}

export interface TeamSpeakStatus {
  online: boolean;
  server: TeamSpeakServerInfo;
  channelCount: number;
  clientCount: number;
}

export interface TeamSpeakClient {
  clid: number;
  cid: number;
  nickname: string;
  type: number;
  away: number;
  awayMessage?: string;
  outputMuted: boolean;
  inputMuted: boolean;
  servergroups?: number[];
}

export interface TeamSpeakChannelNode {
  cid: number | string;
  pid: string;
  name: string;
  displayName: string;
  order: number;
  totalClients: number;
  clients: TeamSpeakClient[];
  subchannels: TeamSpeakChannelNode[];
}

export interface TeamSpeakTreeData {
  rootChannels: TeamSpeakChannelNode[];
  channelCount: number;
  clientCount: number;
  clients: TeamSpeakClient[];
  serverInfo: TeamSpeakServerInfo;
}

export interface TeamSpeakConfig {
  enabled: boolean;
  allowed_roles?: string[];
  server: {
    host: string;
    queryport: number;
    serverport: number;
    protocol: 'raw' | 'ssh';
    username: string;
    password?: string;
    nickname: string;
    readyTimeout?: number;
    keepAlive?: boolean;
  };
  widget: {
    enabled: boolean;
    channel_id: string | null;
    message_id?: string | null;
    refresh_interval_seconds: number;
    title: string;
    color: string;
    hide_empty_channels: boolean;
    show_query_clients: boolean;
    show_channel_ids: boolean;
  };
  logs: {
    enabled: boolean;
    channel_id: string | null;
    color: string;
    events: {
      client_connect: boolean;
      client_disconnect: boolean;
      client_moved: boolean;
      channel_create: boolean;
      channel_delete: boolean;
      server_edit: boolean;
    };
  };
}

export interface TeamSpeakLogEntry {
  id: string;
  guild_id: string;
  event_type: string;
  actor_id?: string;
  target_id?: string;
  channel_id?: string;
  summary?: string;
  metadata?: any;
  nickname?: string;
  created_at: number | string;
}

export interface TeamSpeakLogsResponse {
  logs: TeamSpeakLogEntry[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const useTeamSpeak = () => {
  const api = useDiscordApi();

  async function getStatus(guildId?: string): Promise<TeamSpeakStatus> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: TeamSpeakStatus; error?: string }>(`/api/teamspeak/status${qs}`);
    if (!res.success && res.error) {
      throw new Error(res.error);
    }
    return res.data;
  }

  async function getTree(hideEmpty: boolean = false, guildId?: string): Promise<TeamSpeakTreeData> {
    const params = new URLSearchParams();
    if (hideEmpty) params.append('hide_empty', 'true');
    if (guildId) params.append('guild_id', guildId);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await api.apiFetch<{ success: boolean; data: TeamSpeakTreeData; error?: string }>(`/api/teamspeak/tree${qs}`);
    if (!res.success && res.error) {
      throw new Error(res.error);
    }
    return res.data;
  }

  async function getConfig(guildId?: string): Promise<TeamSpeakConfig> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: TeamSpeakConfig; error?: string }>(`/api/teamspeak/config${qs}`);
    if (!res.success && res.error) {
      throw new Error(res.error);
    }
    return res.data;
  }

  async function updateConfig(payload: Partial<TeamSpeakConfig> & { guild_id?: string; guildId?: string }): Promise<TeamSpeakConfig> {
    const res = await api.apiFetch<{ success: boolean; data: TeamSpeakConfig; error?: string }>('/api/teamspeak/config', {
      method: 'PATCH',
      body: payload as any
    });
    if (!res.success && res.error) {
      throw new Error(res.error);
    }
    return res.data;
  }

  async function refresh(guildId?: string): Promise<{ cacheRefreshed: boolean; widgetResult: any }> {
    const res = await api.apiFetch<{ success: boolean; data: { cacheRefreshed: boolean; widgetResult: any }; error?: string }>('/api/teamspeak/refresh', {
      method: 'POST',
      body: { guild_id: guildId || 'default' } as any
    });
    if (!res.success && res.error) {
      throw new Error(res.error);
    }
    return res.data;
  }

  async function getLogs(page: number = 1, limit: number = 50, guildId?: string): Promise<TeamSpeakLogsResponse> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (guildId) params.append('guild_id', guildId);

    const res = await api.apiFetch<{ success: boolean; data: TeamSpeakLogsResponse; error?: string }>(`/api/teamspeak/logs?${params.toString()}`);
    if (!res.success && res.error) {
      throw new Error(res.error);
    }
    return res.data;
  }

  return {
    getStatus,
    getTree,
    getConfig,
    updateConfig,
    refresh,
    getLogs
  };
};
