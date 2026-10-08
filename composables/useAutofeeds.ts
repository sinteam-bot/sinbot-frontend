/**
 * frontend/composables/useAutofeeds.ts
 *
 * Composable pour l'API des flux automatiques (RSS, LootScraper, YouTube, Reddit, réseaux sociaux, souscriptions).
 */

import { useDiscordApi } from './useDiscordApi.ts';

export interface AutofeedFilters {
  includeKeywords?: string[];
  excludeKeywords?: string[];
  regexFilter?: string;
  titleKeywords?: string[];
  excludeTitleKeywords?: string[];
  authorInclude?: string[];
  authorExclude?: string[];
  tagInclude?: string[];
  tagExclude?: string[];
  requireMedia?: boolean;
}

export interface AutofeedItem {
  id: string;
  guildId: string;
  channelId: string;
  feedUrl: string;
  url: string;
  name?: string | null;
  feedType: string;
  provider: string;
  category: string;
  tags: string[];
  filters?: AutofeedFilters;
  filterKeywords?: string[];
  excludeKeywords?: string[];
  regexFilter?: string;
  customMessage?: string | null;
  color?: string;
  embedColor?: string;
  pingRoleId?: string | null;
  subscriberRoleId?: string | null;
  notificationDelivery?: 'channel' | 'dm' | 'both' | 'role';
  createThread?: boolean;
  threadAutoArchiveDuration?: number;
  useWebhook?: boolean;
  enableMediaProxy?: boolean;
  ignoreShorts?: boolean;
  aiSummary?: boolean;
  aiTranslate?: boolean;
  lastItemId?: string | null;
  lastItemPublishedAt?: number;
  intervalMinutes: number;
  checkIntervalMinutes: number;
  enabled: boolean;
  isActive: boolean;
  lastCheckedAt?: number;
  lastStatus?: 'ok' | 'error';
  lastError?: string | null;
  failCount?: number;
  createdAt: number;
  updatedAt?: number | null;
}

export interface CreateAutofeedPayload {
  url?: string;
  feedUrl?: string;
  name?: string;
  channelId?: string;
  category?: string;
  checkIntervalMinutes?: number;
  intervalMinutes?: number;
  isActive?: boolean;
  enabled?: boolean;
  tags?: string[];
  filterKeywords?: string[];
  includeKeywords?: string[];
  excludeKeywords?: string[];
  regexFilter?: string;
  embedColor?: string;
  color?: string;
  customMessage?: string;
  pingRoleId?: string;
  subscriberRoleId?: string;
  notificationDelivery?: 'channel' | 'dm' | 'both' | 'role';
  createThread?: boolean;
  threadAutoArchiveDuration?: number;
  useWebhook?: boolean;
  enableMediaProxy?: boolean;
  ignoreShorts?: boolean;
  aiSummary?: boolean;
  aiTranslate?: boolean;
  guildId?: string;
  filters?: AutofeedFilters;
}

export interface AutofeedPreset {
  id: string;
  name: string;
  description: string;
  feedUrl: string;
  provider: string;
  category: string;
  tags: string[];
  color: string;
  icon: string;
  sourceName: string;
}

export interface AutofeedSubscription {
  id: string;
  guildId: string;
  userId: string;
  targetType: 'tag' | 'category' | 'feed' | 'keyword' | 'account' | 'author';
  targetValue: string;
  notifyMode: 'mention' | 'dm' | 'both' | 'role';
  filters?: {
    includeKeywords?: string[];
    excludeKeywords?: string[];
    regexFilter?: string;
  };
  createdAt: number;
}

export interface AutofeedProvider {
  name: string;
  label: string;
  icon: string;
  description: string;
  status: 'active' | 'compatible_rss' | 'planned';
}

function normalizeFeed(item: any): AutofeedItem {
  if (!item) return item;
  const feedUrl = item.feedUrl || item.feed_url || item.url || '';
  const provider = item.feedType || item.feed_type || item.provider || 'rss';
  const enabled = item.enabled !== undefined ? Boolean(item.enabled) : (item.isActive !== undefined ? Boolean(item.isActive) : true);
  const interval = item.intervalMinutes || item.interval_minutes || item.checkIntervalMinutes || 15;
  const color = item.color || item.embedColor || item.embed_color || '#FF4500';
  const filters: AutofeedFilters = item.filters || {};
  const filterKeywords = filters.includeKeywords || item.filterKeywords || [];
  const excludeKeywords = filters.excludeKeywords || item.excludeKeywords || [];

  return {
    ...item,
    id: item.id,
    guildId: item.guildId || item.guild_id,
    channelId: item.channelId || item.channel_id,
    feedUrl,
    url: feedUrl,
    name: item.name,
    feedType: provider,
    provider,
    category: item.category || 'general',
    tags: Array.isArray(item.tags) ? item.tags : [],
    filters,
    filterKeywords,
    excludeKeywords,
    regexFilter: filters.regexFilter || item.regexFilter || '',
    customMessage: item.customMessage || item.custom_message,
    color,
    embedColor: color,
    pingRoleId: item.pingRoleId || item.ping_role_id,
    subscriberRoleId: item.subscriberRoleId || item.subscriber_role_id || null,
    notificationDelivery: item.notificationDelivery || item.notification_delivery || 'channel',
    createThread: Boolean(item.createThread ?? item.create_thread ?? false),
    threadAutoArchiveDuration: item.threadAutoArchiveDuration || item.thread_auto_archive_duration || 1440,
    useWebhook: Boolean(item.useWebhook ?? item.use_webhook ?? false),
    enableMediaProxy: Boolean(item.enableMediaProxy ?? item.enable_media_proxy ?? false),
    ignoreShorts: Boolean(item.ignoreShorts ?? item.ignore_shorts ?? false),
    aiSummary: Boolean(item.aiSummary ?? item.ai_summary ?? false),
    aiTranslate: Boolean(item.aiTranslate ?? item.ai_translate ?? false),
    lastItemId: item.lastItemId || item.last_item_id,
    lastItemPublishedAt: item.lastItemPublishedAt || item.last_item_published_at || 0,
    intervalMinutes: interval,
    checkIntervalMinutes: interval,
    enabled,
    isActive: enabled,
    lastCheckedAt: item.lastCheckedAt || item.last_checked_at || 0,
    lastStatus: item.lastStatus || item.last_status || 'ok',
    lastError: item.lastError || item.last_error,
    failCount: item.failCount || item.fail_count || 0,
    createdAt: item.createdAt || item.created_at || Date.now(),
    updatedAt: item.updatedAt || item.updated_at
  };
}

export const useAutofeeds = () => {
  const api = useDiscordApi();

  async function listFeeds(guildId?: string): Promise<AutofeedItem[]> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: any[]; error?: string }>(`/api/autofeeds${qs}`);
    if (!res.success && res.error) throw new Error(res.error);
    const rawList = res.data || [];
    return rawList.map(normalizeFeed);
  }

  async function getFeed(id: string): Promise<AutofeedItem> {
    const res = await api.apiFetch<{ success: boolean; data: any; error?: string }>(`/api/autofeeds/${encodeURIComponent(id)}`);
    if (!res.success && res.error) throw new Error(res.error);
    return normalizeFeed(res.data);
  }

  async function createFeed(payload: CreateAutofeedPayload & { guildId?: string }): Promise<AutofeedItem> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: any; error?: string }>('/api/autofeeds', {
      method: 'POST',
      body: payload as any
    });
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return normalizeFeed(res.data);
  }

  async function updateFeed(id: string, payload: Partial<CreateAutofeedPayload>): Promise<AutofeedItem> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: any; error?: string }>(`/api/autofeeds/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: payload as any
    });
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return normalizeFeed(res.data);
  }

  async function deleteFeed(id: string): Promise<boolean> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; error?: string }>(`/api/autofeeds/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return true;
  }

  async function testFeed(id: string): Promise<{ itemCount: number; latestItem: any; previewEmbed: any }> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: any; error?: string }>(`/api/autofeeds/${encodeURIComponent(id)}/test`, {
      method: 'POST'
    });
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data;
  }

  async function getPresets(): Promise<AutofeedPreset[]> {
    const res = await api.apiFetch<{ success: boolean; data: AutofeedPreset[]; error?: string }>('/api/autofeeds/presets');
    if (!res.success && res.error) throw new Error(res.error);
    return res.data || [];
  }

  async function installPreset(
    arg1: string | { presetId?: string; preset_id?: string; channelId?: string; channel_id?: string; intervalMinutes?: number; interval_minutes?: number; guildId?: string; guild_id?: string },
    channelId?: string,
    intervalMinutes: number = 15,
    guildId?: string
  ): Promise<AutofeedItem> {
    let preset_id = '';
    let channel_id = '';
    let interval_minutes = 15;
    let guild_id: string | undefined = undefined;

    if (typeof arg1 === 'object' && arg1 !== null) {
      preset_id = arg1.presetId || arg1.preset_id || '';
      channel_id = arg1.channelId || arg1.channel_id || '';
      interval_minutes = arg1.intervalMinutes ?? arg1.interval_minutes ?? 15;
      guild_id = arg1.guildId || arg1.guild_id;
    } else {
      preset_id = arg1 || '';
      channel_id = channelId || '';
      interval_minutes = intervalMinutes ?? 15;
      guild_id = guildId;
    }

    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: any; error?: string }>('/api/autofeeds/presets/install', {
      method: 'POST',
      body: {
        preset_id,
        channel_id,
        interval_minutes,
        guild_id
      } as any
    });
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return normalizeFeed(res.data);
  }

  async function getProviders(): Promise<AutofeedProvider[]> {
    const res = await api.apiFetch<{ success: boolean; data: AutofeedProvider[]; error?: string }>('/api/autofeeds/providers');
    if (!res.success && res.error) throw new Error(res.error);
    return res.data || [];
  }

  async function listSubscriptions(guildId?: string, userId?: string): Promise<AutofeedSubscription[]> {
    const params = new URLSearchParams();
    if (guildId) params.append('guild_id', guildId);
    if (userId) params.append('user_id', userId);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await api.apiFetch<{ success: boolean; data: AutofeedSubscription[]; error?: string }>(`/api/autofeeds/subscriptions${qs}`);
    if (!res.success && res.error) throw new Error(res.error);
    return res.data || [];
  }

  async function createSubscription(payload: {
    guildId?: string;
    userId: string;
    targetType: 'tag' | 'category' | 'feed' | 'keyword' | 'account' | 'author';
    targetValue: string;
    notifyMode?: 'mention' | 'dm';
    filters?: {
      includeKeywords?: string[];
      excludeKeywords?: string[];
      regexFilter?: string;
    };
  }): Promise<AutofeedSubscription> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: AutofeedSubscription; error?: string }>('/api/autofeeds/subscriptions', {
      method: 'POST',
      body: payload as any
    });
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data;
  }

  async function deleteSubscription(id: string): Promise<boolean> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; error?: string }>(`/api/autofeeds/subscriptions/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return true;
  }

  async function importOpml(channelId: string, opmlXml: string, guildId?: string): Promise<{ importedCount: number; errors: any[] }> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: any; error?: string }>('/api/autofeeds/opml/import', {
      method: 'POST',
      body: { channelId, opmlXml, guildId } as any
    });
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data;
  }

  async function exportOpml(guildId?: string): Promise<string> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const xml = await api.apiFetch<string>(`/api/autofeeds/opml/export${qs}`);
    return xml;
  }

  return {
    listFeeds,
    fetchFeeds: listFeeds,
    getFeed,
    createFeed,
    updateFeed,
    deleteFeed,
    testFeed,
    getPresets,
    fetchPresets: getPresets,
    installPreset,
    getProviders,
    fetchProviders: getProviders,
    listSubscriptions,
    fetchSubscriptions: listSubscriptions,
    createSubscription,
    deleteSubscription,
    importOpml,
    exportOpml
  };
};
