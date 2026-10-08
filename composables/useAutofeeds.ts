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
  digestMode?: 'realtime' | 'daily' | 'weekly';
  digestSchedule?: string;
  digestChannelId?: string | null;
  enableGamification?: boolean;
  gamificationXpReward?: number;
  channelTagRouting?: Record<string, string>;
  quietHours?: {
    enabled?: boolean;
    start?: string;
    end?: string;
    suppressMentions?: boolean;
  };
  maxPostsPerHour?: number;
  autoReactions?: string[];
  autoPoll?: boolean | { question?: string; answers?: string[] };
  breakingKeywords?: string[];
  bypassQuietHours?: boolean;
  breakingRoleId?: string | null;
  autoExpireDays?: number;
  enableAudioBriefing?: boolean;
  enableVoting?: boolean;
  bestOfThreshold?: number;
  bestOfChannelId?: string | null;
  minDiscountPercent?: number;
  autoSyncEvents?: boolean;
  goodVibesOnly?: boolean;
  enableSecurityScan?: boolean;
  translateTitleToFr?: boolean;
  antiClickbait?: boolean;
  requireApproval?: boolean;
  moderationChannelId?: string | null;
  enableStoryClustering?: boolean;
  clusterMode?: 'merge' | 'skip';
  enableVideoSummary?: boolean;
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
  digestMode?: 'realtime' | 'daily' | 'weekly';
  digestSchedule?: string;
  digestChannelId?: string;
  enableGamification?: boolean;
  gamificationXpReward?: number;
  channelTagRouting?: Record<string, string>;
  quietHours?: {
    enabled?: boolean;
    start?: string;
    end?: string;
    suppressMentions?: boolean;
  };
  maxPostsPerHour?: number;
  autoReactions?: string[];
  autoPoll?: boolean | { question?: string; answers?: string[] };
  breakingKeywords?: string[];
  bypassQuietHours?: boolean;
  breakingRoleId?: string | null;
  autoExpireDays?: number;
  enableAudioBriefing?: boolean;
  enableVoting?: boolean;
  bestOfThreshold?: number;
  bestOfChannelId?: string | null;
  minDiscountPercent?: number;
  autoSyncEvents?: boolean;
  goodVibesOnly?: boolean;
  enableSecurityScan?: boolean;
  translateTitleToFr?: boolean;
  antiClickbait?: boolean;
  requireApproval?: boolean;
  moderationChannelId?: string | null;
  enableStoryClustering?: boolean;
  clusterMode?: 'merge' | 'skip';
  enableVideoSummary?: boolean;
  guildId?: string;
  filters?: AutofeedFilters;
}

export interface ReaderArticle {
  url: string;
  title: string;
  author?: string | null;
  siteName?: string | null;
  leadImage?: string | null;
  leadImageUrl?: string | null;
  paragraphs?: string[];
  text: string;
  textContent: string;
  wordCount: number;
  readingTimeMinutes: number;
}

export interface VoteStats {
  upvotes: number;
  downvotes: number;
  score: number;
  totalVotes: number;
}

export interface UserDigestSchedule {
  id?: string;
  guildId: string;
  userId: string;
  scheduleTime: string;
  isEnabled: boolean;
  lastSentAt?: number | null;
}

export interface ModerationPendingItem {
  id: string;
  feedId: string;
  feedName?: string;
  guildId: string;
  channelId: string;
  guid: string;
  link: string;
  title: string;
  itemAuthor?: string;
  itemContent?: string;
  tags?: string[];
  postedAt: number;
  isPendingApproval: boolean;
  relatedSources?: Array<{ name?: string; title?: string; link?: string; url?: string }>;
}

export interface AutofeedStats {
  totalFeeds: number;
  activeFeeds: number;
  totalSubscriptions: number;
  totalPosts: number;
  totalClicks: number;
  totalClaims: number;
  totalXpAwarded: number;
  topTags: Array<{ tag: string; count: number }>;
  topProviders: Array<{ provider: string; count: number }>;
}

export interface AutofeedSearchItem {
  id: string;
  feedId: string;
  guildId: string;
  feedName: string;
  itemGuid: string;
  url: string;
  title: string;
  author?: string;
  content?: string;
  tags: string[];
  isDigest: boolean;
  clicksCount: number;
  postedAt: number;
}

export interface AutofeedClaimResult {
  success: boolean;
  alreadyClaimed: boolean;
  claimsCount: number;
  xpAwarded?: number;
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
    digestMode: item.digestMode || item.digest_mode || 'realtime',
    digestSchedule: item.digestSchedule || item.digest_schedule || '08:00',
    digestChannelId: item.digestChannelId || item.digest_channel_id || null,
    enableGamification: Boolean(item.enableGamification ?? item.enable_gamification ?? false),
    gamificationXpReward: Number(item.gamificationXpReward || item.gamification_xp_reward || 25),
    channelTagRouting: typeof item.channelTagRouting === 'string' ? JSON.parse(item.channelTagRouting || '{}') : (item.channelTagRouting || item.channel_tag_routing || {}),
    quietHours: typeof item.quietHours === 'string' ? JSON.parse(item.quietHours || '{}') : (item.quietHours || item.quiet_hours || {}),
    maxPostsPerHour: Number(item.maxPostsPerHour || item.max_posts_per_hour || 0),
    autoReactions: Array.isArray(item.autoReactions ?? item.auto_reactions)
      ? (item.autoReactions ?? item.auto_reactions)
      : (typeof (item.autoReactions ?? item.auto_reactions) === 'string'
        ? (() => { try { return JSON.parse(item.autoReactions ?? item.auto_reactions); } catch { return []; } })()
        : []),
    autoPoll: item.autoPoll ?? item.auto_poll ?? false,
    breakingKeywords: Array.isArray(item.breakingKeywords ?? item.breaking_keywords)
      ? (item.breakingKeywords ?? item.breaking_keywords)
      : (typeof (item.breakingKeywords ?? item.breaking_keywords) === 'string'
        ? (() => { try { return JSON.parse(item.breakingKeywords ?? item.breaking_keywords); } catch { return []; } })()
        : []),
    bypassQuietHours: Boolean(item.bypassQuietHours ?? item.bypass_quiet_hours ?? false),
    breakingRoleId: item.breakingRoleId || item.breaking_role_id || null,
    autoExpireDays: Number(item.autoExpireDays || item.auto_expire_days || 0),
    enableAudioBriefing: Boolean(item.enableAudioBriefing ?? item.enable_audio_briefing ?? false),
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

  async function getStats(guildId?: string): Promise<AutofeedStats> {
    const qs = guildId ? `?guild_id=${encodeURIComponent(guildId)}` : '';
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: AutofeedStats; error?: string }>(`/api/autofeeds/stats${qs}`);
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data || {
      totalFeeds: 0,
      activeFeeds: 0,
      totalSubscriptions: 0,
      totalPosts: 0,
      totalClicks: 0,
      totalClaims: 0,
      totalXpAwarded: 0,
      topTags: [],
      topProviders: []
    };
  }

  async function searchItems(query: string, guildId?: string, limit: number = 10): Promise<AutofeedSearchItem[]> {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    if (guildId) params.set('guild_id', guildId);
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: AutofeedSearchItem[]; error?: string }>(`/api/autofeeds/search?${params.toString()}`);
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data || [];
  }

  async function claimItem(payload: {
    feedId: string;
    itemId: string;
    userId: string;
    guildId?: string;
    xpAwarded?: number;
  }): Promise<AutofeedClaimResult> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: AutofeedClaimResult; error?: string }>('/api/autofeeds/claims', {
      method: 'POST',
      body: payload as any
    });
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data;
  }

  async function purgeExpired(feedId?: string): Promise<{ expiredCount: number; deletedMessagesCount: number }> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: any; error?: string }>('/api/autofeeds/purge', {
      method: 'POST',
      body: { feedId } as any
    });
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data || { expiredCount: 0, deletedMessagesCount: 0 };
  }

  async function getAudioBriefing(feedId: string, limit: number = 5): Promise<{ feedTitle: string; script: string; itemCount: number; filename: string }> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: any; error?: string }>(`/api/autofeeds/${encodeURIComponent(feedId)}/audio?limit=${limit}`);
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data;
  }

  async function getReaderArticle(url: string): Promise<ReaderArticle> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: ReaderArticle; error?: string }>(`/api/autofeeds/reader?url=${encodeURIComponent(url)}`);
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data;
  }

  async function getVotes(targetId: string, targetType: string = 'autofeed'): Promise<VoteStats> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: VoteStats; error?: string }>(`/api/autofeeds/votes?targetId=${encodeURIComponent(targetId)}&targetType=${encodeURIComponent(targetType)}`);
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data;
  }

  async function getUserDigest(guildId: string, userId: string): Promise<UserDigestSchedule | null> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: UserDigestSchedule | null; error?: string }>(`/api/autofeeds/user-digest?guildId=${encodeURIComponent(guildId)}&userId=${encodeURIComponent(userId)}`);
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data;
  }

  async function setUserDigest(guildId: string, userId: string, scheduleTime: string = '08:00', isEnabled: boolean = true): Promise<UserDigestSchedule> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: UserDigestSchedule; error?: string }>('/api/autofeeds/user-digest', {
      method: 'POST',
      body: { guildId, userId, scheduleTime, isEnabled } as any
    });
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data;
  }

  async function getPendingModeration(guildId: string): Promise<ModerationPendingItem[]> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: ModerationPendingItem[]; error?: string }>(`/api/autofeeds/moderation/pending?guildId=${encodeURIComponent(guildId)}`);
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data || [];
  }

  async function approveModerationItem(id: string): Promise<{ ok: boolean; messageId?: string; channelId?: string }> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: any; error?: string }>(`/api/autofeeds/moderation/${encodeURIComponent(id)}/approve`, {
      method: 'POST'
    });
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data || { ok: true };
  }

  async function rejectModerationItem(id: string): Promise<{ ok: boolean }> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: any; error?: string }>(`/api/autofeeds/moderation/${encodeURIComponent(id)}/reject`, {
      method: 'POST'
    });
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data || { ok: true };
  }

  async function askArticleQuestion(payload: { url: string; question: string; articleTitle?: string; articleContent?: string }): Promise<{ answer: string; cached?: boolean }> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: any; error?: string }>('/api/autofeeds/qa', {
      method: 'POST',
      body: payload as any
    });
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data;
  }

  async function summarizeYouTubeVideo(payload: { url: string; videoId?: string; title?: string; description?: string }): Promise<{ summary: string; bullets: string[]; cached?: boolean }> {
    const res = await api.apiFetch<{ ok?: boolean; success?: boolean; data: any; error?: string }>('/api/autofeeds/video-summary', {
      method: 'POST',
      body: payload as any
    });
    if ((res.ok === false || res.success === false) && res.error) throw new Error(res.error);
    return res.data;
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
    exportOpml,
    getStats,
    fetchStats: getStats,
    searchItems,
    claimItem,
    purgeExpired,
    getAudioBriefing,
    getReaderArticle,
    getVotes,
    getUserDigest,
    setUserDigest,
    getPendingModeration,
    approveModerationItem,
    rejectModerationItem,
    askArticleQuestion,
    summarizeYouTubeVideo
  };
};
