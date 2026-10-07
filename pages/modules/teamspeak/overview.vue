<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Alerte d'erreur si échec -->
    <div v-if="error" class="config-card" style="color: var(--status-danger, #ed4245); display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>⚠️</span>
        <span>{{ error }}</span>
      </div>
      <NuxtLink to="/modules/teamspeak/config" class="module-btn module-btn-primary" style="font-size: 12px; padding: 4px 10px;">
        Configurer la connexion
      </NuxtLink>
    </div>

    <!-- 1. Bannière de Statuts -->
    <div class="module-stats-banner">
      <div class="module-stat-card">
        <div class="module-stat-icon">🔊</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Connexion TS3</span>
          <span class="module-stat-value" :style="{ color: isOnline ? 'var(--status-positive, #57f287)' : 'var(--status-danger, #ed4245)' }">
            {{ isOnline ? 'En ligne' : 'Hors ligne' }}
          </span>
          <span class="module-stat-sub">{{ serverInfo.name || 'Serveur TeamSpeak' }}</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">👥</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Clients connectés</span>
          <span class="module-stat-value" :style="{ color: isOnline && clientCount > 0 ? 'var(--status-positive, #57f287)' : 'var(--text-normal)' }">
            {{ clientCount }}<span v-if="maxClients" style="font-size: 14px; color: var(--text-muted);"> / {{ maxClients }}</span>
          </span>
          <span class="module-stat-sub">utilisateurs vocaux actifs</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">📁</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Salons TS3</span>
          <span class="module-stat-value">{{ channelCount }}</span>
          <span class="module-stat-sub">canaux répertoriés</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">⏱️</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Uptime / Version</span>
          <span class="module-stat-value" style="font-size: 15px;">
            {{ formatUptime(serverInfo.uptime) }}
          </span>
          <span class="module-stat-sub">{{ serverInfo.version ? `v${serverInfo.version}` : 'Version 3.x' }}</span>
        </div>
      </div>
    </div>

    <!-- 2. Grille de détails : Serveur, Widget & Logs -->
    <div class="overview-grid">
      <!-- Carte Informations Serveur -->
      <div class="config-card">
        <div class="card-subtitle" style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>🌐</span>
            <span>Serveur TeamSpeak</span>
          </div>
          <span class="status-indicator-dot" :class="isOnline ? 'dot-online' : 'dot-offline'"></span>
        </div>

        <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
          <div class="detail-row">
            <span class="detail-label">Nom du serveur :</span>
            <span class="detail-value font-bold">{{ serverInfo.name || 'TeamSpeak 3' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Adresse de connexion :</span>
            <span class="detail-value font-mono">
              {{ serverHost }}:{{ serverPort }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Plateforme :</span>
            <span class="detail-value">{{ serverInfo.platform || 'Linux / Windows' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Protocole ServerQuery :</span>
            <span class="detail-value font-mono">{{ config?.server?.protocol || 'raw' }} (port {{ config?.server?.queryport || 10011 }})</span>
          </div>
        </div>

        <div style="margin-top: 18px; display: flex; gap: 8px; flex-wrap: wrap;">
          <a
            :href="joinUrl"
            class="module-btn module-btn-primary"
            style="text-decoration: none;"
          >
            <span>🎧</span> Rejoindre TeamSpeak
          </a>
          <NuxtLink to="/modules/teamspeak/tree" class="module-btn">
            <span>🌲</span> Voir l'arborescence
          </NuxtLink>
        </div>
      </div>

      <!-- Carte Intégration Widget Discord -->
      <div class="config-card">
        <div class="card-subtitle" style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>📌</span>
            <span>Widget Discord</span>
          </div>
          <span
            class="status-pill"
            :class="config?.widget?.enabled ? 'status-online' : 'status-offline'"
          >
            {{ config?.widget?.enabled ? 'Activé' : 'Désactivé' }}
          </span>
        </div>

        <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
          <div class="detail-row">
            <span class="detail-label">Salon cible :</span>
            <span class="detail-value">
              <DiscordChannel v-if="config?.widget?.channel_id" :channel-id="config.widget.channel_id" />
              <span v-else style="color: var(--text-muted);">Non configuré</span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Intervalle d'actualisation :</span>
            <span class="detail-value font-mono">{{ config?.widget?.refresh_interval_seconds || 30 }} secondes</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Titre de l'embed :</span>
            <span class="detail-value">{{ config?.widget?.title || '🔊 Serveur TeamSpeak 3' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Message persistant :</span>
            <span class="detail-value font-mono" style="font-size: 11px;">
              {{ config?.widget?.message_id ? `#${config.widget.message_id}` : 'Généré au premier cycle' }}
            </span>
          </div>
        </div>

        <div style="margin-top: 18px;">
          <NuxtLink to="/modules/teamspeak/config" class="module-btn">
            <span>⚙️</span> Régler le widget
          </NuxtLink>
        </div>
      </div>

      <!-- Carte Logs Discord -->
      <div class="config-card">
        <div class="card-subtitle" style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>📜</span>
            <span>Journalisation des Événements</span>
          </div>
          <span
            class="status-pill"
            :class="config?.logs?.enabled ? 'status-online' : 'status-offline'"
          >
            {{ config?.logs?.enabled ? 'Activée' : 'Désactivée' }}
          </span>
        </div>

        <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
          <div class="detail-row">
            <span class="detail-label">Salon des logs :</span>
            <span class="detail-value">
              <DiscordChannel v-if="config?.logs?.channel_id" :channel-id="config.logs.channel_id" />
              <span v-else style="color: var(--text-muted);">Non configuré</span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Événements surveillés :</span>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              <span v-if="config?.logs?.events?.client_connect" class="event-tag tag-green">Connexions</span>
              <span v-if="config?.logs?.events?.client_disconnect" class="event-tag tag-red">Déconnexions</span>
              <span v-if="config?.logs?.events?.client_moved" class="event-tag tag-blue">Déplacements</span>
              <span v-if="config?.logs?.events?.channel_create" class="event-tag tag-yellow">Salons</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 18px;">
          <NuxtLink to="/modules/teamspeak/logs" class="module-btn">
            <span>📋</span> Consulter l'historique des logs
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- 3. Aperçu des Derniers Logs -->
    <div class="config-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
        <div class="card-subtitle" style="display: flex; align-items: center; gap: 8px;">
          <span>⚡</span>
          <span>Dernières Activités TeamSpeak</span>
        </div>
        <NuxtLink to="/modules/teamspeak/logs" class="link-btn">
          Voir tous les logs →
        </NuxtLink>
      </div>

      <div v-if="loadingLogs" style="padding: 20px; text-align: center; color: var(--text-muted);">
        Chargement des activités récentes…
      </div>

      <div v-else-if="recentLogs.length === 0" style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">
        Aucune activité récente enregistrée pour le moment.
      </div>

      <div v-else class="recent-logs-list">
        <div
          v-for="item in recentLogs"
          :key="item.id"
          class="recent-log-item"
        >
          <div class="log-badge" :class="getEventTypeBadgeClass(item.event_type)">
            {{ getEventIcon(item.event_type) }}
          </div>

          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px;">
              <span class="log-user font-bold">{{ item.nickname || item.actor_id || 'Membre' }}</span>
              <span class="log-time">{{ formatTimeAgo(item.created_at) }}</span>
            </div>
            <p class="log-summary" style="margin: 2px 0 0 0;">
              {{ item.summary || formatEventFallback(item) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTeamSpeak, type TeamSpeakStatus, type TeamSpeakConfig, type TeamSpeakLogEntry } from '~/composables/useTeamSpeak.ts';
import { useDateFormatter } from '~/composables/useDateFormatter.ts';
import DiscordChannel from '~/components/common/DiscordChannel.vue';

const tsApi = useTeamSpeak();
const { formatTimeAgo } = useDateFormatter();

const status = ref<TeamSpeakStatus | null>(null);
const config = ref<TeamSpeakConfig | null>(null);
const recentLogs = ref<TeamSpeakLogEntry[]>([]);
const loadingLogs = ref(false);
const error = ref<string | null>(null);

const isOnline = computed(() => Boolean(status.value?.online));
const serverInfo = computed(() => status.value?.server || {});
const channelCount = computed(() => status.value?.channelCount || serverInfo.value.channelsOnline || 0);
const clientCount = computed(() => status.value?.clientCount || serverInfo.value.clientsOnline || 0);
const maxClients = computed(() => serverInfo.value.maxClients || 32);

const serverHost = computed(() => config.value?.server?.host || serverInfo.value.host || '127.0.0.1');
const serverPort = computed(() => config.value?.server?.serverport || serverInfo.value.port || 9987);

const joinUrl = computed(() => {
  return serverInfo.value.joinUrl || `ts3server://${serverHost.value}?port=${serverPort.value}`;
});

function formatUptime(uptimeSeconds?: number): string {
  if (!uptimeSeconds) return isOnline.value ? 'En ligne' : 'Inconnu';
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const mins = Math.floor((uptimeSeconds % 3600) / 60);

  if (days > 0) return `${days}j ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function getEventIcon(eventType: string): string {
  switch (eventType) {
    case 'ts3_client_connect': return '🟢';
    case 'ts3_client_disconnect': return '🔴';
    case 'ts3_client_moved': return '🔄';
    case 'ts3_channel_create': return '📁';
    case 'ts3_channel_delete': return '🗑️';
    default: return '📋';
  }
}

function getEventTypeBadgeClass(eventType: string): string {
  switch (eventType) {
    case 'ts3_client_connect': return 'badge-connect';
    case 'ts3_client_disconnect': return 'badge-disconnect';
    case 'ts3_client_moved': return 'badge-moved';
    case 'ts3_channel_create': return 'badge-channel';
    case 'ts3_channel_delete': return 'badge-disconnect';
    default: return 'badge-default';
  }
}

function formatEventFallback(item: TeamSpeakLogEntry): string {
  if (item.event_type === 'ts3_client_connect') return 'Connexion au serveur TeamSpeak';
  if (item.event_type === 'ts3_client_disconnect') return 'Déconnexion du serveur TeamSpeak';
  if (item.event_type === 'ts3_client_moved') return 'Déplacement de salon';
  return item.event_type;
}

async function loadData() {
  try {
    const [st, cfg] = await Promise.all([
      tsApi.getStatus().catch(() => null),
      tsApi.getConfig().catch(() => null)
    ]);
    if (st) status.value = st;
    if (cfg) config.value = cfg;
  } catch (err: any) {
    error.value = err.message;
  }

  loadingLogs.value = true;
  try {
    const logsRes = await tsApi.getLogs(1, 5);
    recentLogs.value = logsRes?.logs || [];
  } catch {
    // Ne pas bloquer l'overview si logs indisponibles
  } finally {
    loadingLogs.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}
.config-card {
  background: var(--bg-secondary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: 8px;
  padding: 18px;
  color: var(--text-normal);
}
.card-subtitle {
  font-size: 14px;
  font-weight: 700;
  color: var(--header-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-label {
  color: var(--text-muted);
}
.detail-value {
  color: var(--text-normal);
}
.font-mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}
.font-bold {
  font-weight: 600;
}
.status-indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot-online {
  background: #57f287;
  box-shadow: 0 0 8px rgba(87, 242, 135, 0.5);
}
.dot-offline {
  background: #ed4245;
}
.status-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
}
.status-online {
  background: rgba(87, 242, 135, 0.15);
  color: #57f287;
}
.status-offline {
  background: rgba(237, 66, 69, 0.15);
  color: #ed4245;
}
.event-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}
.tag-green { background: rgba(87, 242, 135, 0.15); color: #57f287; }
.tag-red { background: rgba(237, 66, 69, 0.15); color: #ed4245; }
.tag-blue { background: rgba(88, 101, 242, 0.15); color: #5865f2; }
.tag-yellow { background: rgba(254, 231, 92, 0.15); color: #fee75c; }

.module-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 6px;
  background: var(--background-modifier-hover);
  color: var(--text-normal);
  font-size: 13px;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s;
}
.module-btn:hover { background: var(--background-modifier-selected); }
.module-btn-primary { background: var(--brand-experiment, #5865f2); color: white; border-color: transparent; }

.link-btn {
  color: var(--brand-experiment, #5865f2);
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
}
.link-btn:hover {
  text-decoration: underline;
}

.recent-logs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.recent-log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--bg-tertiary, #1e1f22);
  border-radius: 6px;
}
.log-badge {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.badge-connect { background: rgba(87, 242, 135, 0.15); }
.badge-disconnect { background: rgba(237, 66, 69, 0.15); }
.badge-moved { background: rgba(88, 101, 242, 0.15); }
.badge-channel { background: rgba(254, 231, 92, 0.15); }
.badge-default { background: rgba(255, 255, 255, 0.05); }

.log-user {
  font-size: 13px;
  color: var(--header-primary);
}
.log-time {
  font-size: 11px;
  color: var(--text-muted);
}
.log-summary {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
