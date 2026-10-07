/**
 * frontend/composables/useAutofeeds.ts
 *
 * Composable pour l'API des flux automatiques (RSS, LootScraper, YouTube, Reddit, souscriptions).
 */

import { useDiscordApi } from './useDiscordApi.ts';

export interface AutofeedItem {
  id: string;
  guildId: string;
  channelId: string;
  feedUrl: string;
  name?: string | null;
  feedType: string;
  category: string;
  tags: string[];
  filters?: {
    includeKeywords?: string[];
    excludeKeywords?: string[];
    regexFilter?: string;
  };
  customMessage?: string | null;
  color?: string;
  pingRoleId?: string | null;
  lastItemId?: string | null;
  lastItemPublishedAt?: number;
  intervalMinutes: number;
  enabled: boolean;
  createdAt: number;
  updatedAt?: number | null;
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
  targetType: 'tag' | 'category' | 'feed' | 'keyword';
  targetValue: string;
  notifyMode: 'mention' | 'dm';
  createdAt: number;
}

export interface AutofeedProvider {
  name: string;
  label: string;
  icon: string;
  description: string;
  status: 'active' | 'compatible_rss' | 'planned';
}

export const useAutofeeds = () => {
  const api = useDiscordApi();

  async function listFeeds(guildId?: string): Promise<AutofeedItem[]> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ success: boolean; data: AutofeedItem[]; error?: string }>(`/api/autofeeds${qs}`);
    if (!res.success && res.error) throw new Error(res.error);
    return res.data || [];
  }

  async function getFeed(id: string): Promise<AutofeedItem> {
    const res = await api.apiFetch<{ success: boolean; data: AutofeedItem; error?: string }>(`/api/autofeeds/${encodeURIComponent(id)}`);
    if (!res.success && res.error) throw new Error(res.error);
    return res.data;
  }

  async function createFeed(payload: Partial<AutofeedItem> & { guildId?: string }): Promise<AutofeedItem> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: AutofeedItem; error?: string }>('/api/autofeeds', {
      method: 'POST',
      body: payload as any
    });
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data;
  }

  async function updateFeed(id: string, payload: Partial<AutofeedItem>): Promise<AutofeedItem> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: AutofeedItem; error?: string }>(`/api/autofeeds/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: payload as any
    });
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data;
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

  async function installPreset(presetId: string, channelId: string, intervalMinutes: number = 15, guildId?: string): Promise<AutofeedItem> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: AutofeedItem; error?: string }>('/api/autofeeds/presets/install', {
      method: 'POST',
      body: {
        preset_id: presetId,
        channel_id: channelId,
        interval_minutes: intervalMinutes,
        guild_id: guildId
      } as any
    });
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data;
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
    targetType: 'tag' | 'category' | 'feed' | 'keyword';
    targetValue: string;
    notifyMode?: 'mention' | 'dm';
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

  return {
    listFeeds,
    getFeed,
    createFeed,
    updateFeed,
    deleteFeed,
    testFeed,
    getPresets,
    installPreset,
    getProviders,
    listSubscriptions,
    createSubscription,
    deleteSubscription
  };
};
