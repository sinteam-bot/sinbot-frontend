<template>
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <!-- Barre d'outils et filtres -->
    <div class="logs-toolbar">
      <!-- Filtres d'événements -->
      <div class="filter-pills">
        <button
          type="button"
          :class="['filter-btn', { active: eventFilter === 'all' }]"
          @click="setFilter('all')"
        >
          Tous ({{ totalLogs }})
        </button>
        <button
          type="button"
          :class="['filter-btn btn-green', { active: eventFilter === 'connect' }]"
          @click="setFilter('connect')"
        >
          🟢 Connexions
        </button>
        <button
          type="button"
          :class="['filter-btn btn-red', { active: eventFilter === 'disconnect' }]"
          @click="setFilter('disconnect')"
        >
          🔴 Déconnexions
        </button>
        <button
          type="button"
          :class="['filter-btn btn-blue', { active: eventFilter === 'moved' }]"
          @click="setFilter('moved')"
        >
          🔄 Déplacements
        </button>
        <button
          type="button"
          :class="['filter-btn btn-yellow', { active: eventFilter === 'channel' }]"
          @click="setFilter('channel')"
        >
          📁 Salons
        </button>
      </div>

      <!-- Recherche & Actualisation -->
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Filtrer les logs par nom, salon, raison…"
            class="discord-input"
            style="height: 32px; font-size: 13px; width: 220px;"
          />
        </div>

        <button
          class="module-btn"
          :disabled="loading"
          title="Actualiser les logs"
          @click="loadLogs"
        >
          <span>{{ loading ? '⏳' : '🔄' }}</span>
          <span>{{ loading ? 'Chargement…' : 'Actualiser' }}</span>
        </button>
      </div>
    </div>

    <!-- État de chargement -->
    <div v-if="loading && logs.length === 0" class="loading-state">
      <div class="spinner"></div>
      <span>Chargement de l'historique des logs TeamSpeak 3…</span>
    </div>

    <!-- État vide -->
    <div v-else-if="filteredLogs.length === 0" class="empty-state">
      <div class="empty-icon">📜</div>
      <h3 style="font-size: 16px; margin: 0 0 6px 0; color: var(--header-primary);">
        Aucun log d'événement trouvé
      </h3>
      <p style="margin: 0; color: var(--text-muted); font-size: 13px;">
        {{ searchQuery || eventFilter !== 'all' ? 'Aucun événement ne correspond aux critères de recherche.' : 'Les événements s\'afficheront ici au fur et à mesure des connexions, déconnexions et déplacements sur TeamSpeak.' }}
      </p>
    </div>

    <!-- Tableau des logs -->
    <div v-else class="logs-table-wrapper">
      <table class="logs-table">
        <thead>
          <tr>
            <th style="width: 18%;">Événement</th>
            <th style="width: 24%;">Utilisateur</th>
            <th style="width: 38%;">Détails & Salons</th>
            <th style="width: 20%; text-align: right;">Date & Heure</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in filteredLogs" :key="log.id">
            <!-- Type d'événement -->
            <td>
              <div class="event-pill" :class="getEventPillClass(log.event_type)">
                <span>{{ getEventIcon(log.event_type) }}</span>
                <span>{{ getEventLabel(log.event_type) }}</span>
              </div>
            </td>

            <!-- Utilisateur / Pseudo -->
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="user-avatar-mini">👤</div>
                <span class="user-nickname font-bold">{{ log.nickname || log.actor_id || 'Inconnu' }}</span>
              </div>
            </td>

            <!-- Détails / Description -->
            <td>
              <div class="log-details-block">
                <span v-if="log.summary" class="log-summary-text">{{ log.summary }}</span>
                <span v-else class="log-summary-text">{{ formatDefaultSummary(log) }}</span>

                <!-- Métadonnées additionnelles -->
                <div v-if="hasExtraDetails(log)" class="extra-metadata">
                  <span v-if="getMeta(log, 'fromChannel') && getMeta(log, 'toChannel')" class="meta-tag">
                    {{ getMeta(log, 'fromChannel') }} ➔ {{ getMeta(log, 'toChannel') }}
                  </span>
                  <span v-else-if="getMeta(log, 'channelName')" class="meta-tag">
                    Salon : {{ getMeta(log, 'channelName') }}
                  </span>
                  <span v-if="getMeta(log, 'reason')" class="meta-tag meta-reason">
                    Raison : {{ getMeta(log, 'reason') }}
                  </span>
                  <span v-if="getMeta(log, 'invoker')" class="meta-tag">
                    Par : {{ getMeta(log, 'invoker') }}
                  </span>
                </div>
              </div>
            </td>

            <!-- Date & Heure -->
            <td style="text-align: right;">
              <div class="date-block">
                <span class="date-full">{{ formatLocalDate(log.created_at) }}</span>
                <span class="date-relative">{{ formatTimeAgo(log.created_at) }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Barre de Pagination -->
    <div v-if="totalLogs > 0" class="pagination-footer">
      <DiscordPagination
        v-model="page"
        :total-items="totalLogs"
        :page-size="limit"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTeamSpeak, type TeamSpeakLogEntry } from '~/composables/useTeamSpeak.ts';
import { useDateFormatter } from '~/composables/useDateFormatter.ts';
import DiscordPagination from '~/components/common/DiscordPagination.vue';

const tsApi = useTeamSpeak();
const { formatLocalDate, formatTimeAgo } = useDateFormatter();

const logs = ref<TeamSpeakLogEntry[]>([]);
const totalLogs = ref(0);
const page = ref(1);
const limit = ref(25);
const loading = ref(false);

const eventFilter = ref<'all' | 'connect' | 'disconnect' | 'moved' | 'channel'>('all');
const searchQuery = ref('');

async function loadLogs() {
  loading.value = true;
  try {
    const res = await tsApi.getLogs(page.value, limit.value);
    logs.value = res.logs || [];
    totalLogs.value = res.total || 0;
  } catch {
    logs.value = [];
    totalLogs.value = 0;
  } finally {
    loading.value = false;
  }
}

function setFilter(type: 'all' | 'connect' | 'disconnect' | 'moved' | 'channel') {
  eventFilter.value = type;
}

function handlePageChange(payload: { page: number; pageSize: number }) {
  page.value = payload.page;
  limit.value = payload.pageSize;
  loadLogs();
}

function getEventIcon(eventType: string): string {
  switch (eventType) {
    case 'ts3_client_connect': return '🟢';
    case 'ts3_client_disconnect': return '🔴';
    case 'ts3_client_moved': return '🔄';
    case 'ts3_channel_create': return '📁';
    case 'ts3_channel_delete': return '🗑️';
    case 'ts3_server_edit': return '⚙️';
    default: return '📋';
  }
}

function getEventLabel(eventType: string): string {
  switch (eventType) {
    case 'ts3_client_connect': return 'Connexion';
    case 'ts3_client_disconnect': return 'Déconnexion';
    case 'ts3_client_moved': return 'Déplacement';
    case 'ts3_channel_create': return 'Salon créé';
    case 'ts3_channel_delete': return 'Salon supprimé';
    case 'ts3_server_edit': return 'Serveur édité';
    default: return eventType.replace('ts3_', '');
  }
}

function getEventPillClass(eventType: string): string {
  switch (eventType) {
    case 'ts3_client_connect': return 'pill-green';
    case 'ts3_client_disconnect': return 'pill-red';
    case 'ts3_client_moved': return 'pill-blue';
    case 'ts3_channel_create': return 'pill-yellow';
    case 'ts3_channel_delete': return 'pill-orange';
    default: return 'pill-default';
  }
}

function parseMetadata(log: TeamSpeakLogEntry): any {
  if (!log.metadata) return {};
  if (typeof log.metadata === 'object') return log.metadata;
  try {
    return JSON.parse(log.metadata);
  } catch {
    return {};
  }
}

function getMeta(log: TeamSpeakLogEntry, key: string): any {
  const m = parseMetadata(log);
  return m[key];
}

function hasExtraDetails(log: TeamSpeakLogEntry): boolean {
  const m = parseMetadata(log);
  return Boolean(m.fromChannel || m.channelName || m.reason || m.invoker);
}

function formatDefaultSummary(log: TeamSpeakLogEntry): string {
  const m = parseMetadata(log);
  if (log.event_type === 'ts3_client_connect') {
    return m.channelName ? `Connexion au salon ${m.channelName}` : 'Connexion au serveur';
  }
  if (log.event_type === 'ts3_client_disconnect') {
    return m.reason ? `Déconnexion (${m.reason})` : 'Déconnexion du serveur';
  }
  if (log.event_type === 'ts3_client_moved') {
    if (m.fromChannel && m.toChannel) {
      return `Déplacé de ${m.fromChannel} vers ${m.toChannel}`;
    }
    return 'Changement de salon';
  }
  return log.event_type;
}

const filteredLogs = computed(() => {
  return logs.value.filter(item => {
    // 1. Filtre par type
    if (eventFilter.value === 'connect' && item.event_type !== 'ts3_client_connect') return false;
    if (eventFilter.value === 'disconnect' && item.event_type !== 'ts3_client_disconnect') return false;
    if (eventFilter.value === 'moved' && item.event_type !== 'ts3_client_moved') return false;
    if (eventFilter.value === 'channel' && !item.event_type.startsWith('ts3_channel_')) return false;

    // 2. Filtre de recherche texte
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase().trim();
      const nick = (item.nickname || item.actor_id || '').toLowerCase();
      const sum = (item.summary || '').toLowerCase();
      const meta = typeof item.metadata === 'string' ? item.metadata.toLowerCase() : JSON.stringify(item.metadata || {}).toLowerCase();
      return nick.includes(q) || sum.includes(q) || meta.includes(q);
    }

    return true;
  });
});

onMounted(() => {
  loadLogs();
});
</script>

<style scoped>
.logs-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  background: var(--bg-secondary, #2b2d31);
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
}

.filter-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12.5px;
  background: var(--bg-tertiary, #1e1f22);
  color: var(--text-muted);
  border: 1px solid transparent;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.filter-btn:hover {
  color: var(--text-normal);
  background: var(--background-modifier-hover);
}
.filter-btn.active {
  background: var(--background-modifier-selected, #404249);
  color: #ffffff;
  font-weight: 600;
  border-color: rgba(255, 255, 255, 0.15);
}

.btn-green.active { background: rgba(87, 242, 135, 0.2); color: #57f287; border-color: rgba(87, 242, 135, 0.4); }
.btn-red.active { background: rgba(237, 66, 69, 0.2); color: #ed4245; border-color: rgba(237, 66, 69, 0.4); }
.btn-blue.active { background: rgba(88, 101, 242, 0.2); color: #5865f2; border-color: rgba(88, 101, 242, 0.4); }
.btn-yellow.active { background: rgba(254, 231, 92, 0.2); color: #fee75c; border-color: rgba(254, 231, 92, 0.4); }

.module-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--background-modifier-hover);
  color: var(--text-normal);
  font-size: 13px;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.module-btn:hover { background: var(--background-modifier-selected); }
.module-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  background: var(--bg-secondary, #2b2d31);
  border-radius: 8px;
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  text-align: center;
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--brand-experiment, #5865f2);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.logs-table-wrapper {
  background: var(--bg-secondary, #2b2d31);
  border-radius: 8px;
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  overflow-x: auto;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.logs-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  background: rgba(0, 0, 0, 0.08);
}

.logs-table td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  vertical-align: middle;
}
.logs-table tr:last-child td {
  border-bottom: none;
}
.logs-table tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.event-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
}
.pill-green { background: rgba(87, 242, 135, 0.15); color: #57f287; }
.pill-red { background: rgba(237, 66, 69, 0.15); color: #ed4245; }
.pill-blue { background: rgba(88, 101, 242, 0.15); color: #5865f2; }
.pill-yellow { background: rgba(254, 231, 92, 0.15); color: #fee75c; }
.pill-orange { background: rgba(230, 126, 34, 0.15); color: #e67e22; }
.pill-default { background: rgba(255, 255, 255, 0.06); color: var(--text-normal); }

.user-avatar-mini {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}
.user-nickname {
  color: var(--header-primary);
  font-size: 13.5px;
}
.font-bold {
  font-weight: 600;
}

.log-details-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.log-summary-text {
  color: var(--text-normal);
  line-height: 1.4;
}
.extra-metadata {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.meta-tag {
  font-size: 11px;
  background: var(--bg-tertiary, #1e1f22);
  color: var(--text-muted);
  padding: 1px 6px;
  border-radius: 4px;
}
.meta-reason {
  color: #e67e22;
}

.date-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.date-full {
  font-size: 12.5px;
  color: var(--text-normal);
  font-family: 'JetBrains Mono', monospace;
}
.date-relative {
  font-size: 11px;
  color: var(--text-muted);
}

.pagination-footer {
  margin-top: 8px;
}
</style>
