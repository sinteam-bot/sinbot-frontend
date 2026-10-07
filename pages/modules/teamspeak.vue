<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <!-- En-tête du module TeamSpeak 3 -->
      <div class="module-header" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 22px; font-weight: 700; color: var(--header-primary); margin: 0 0 6px 0; display: flex; align-items: center; gap: 10px;">
              <span>🔊</span> TeamSpeak 3
              <span
                v-if="status"
                class="status-pill"
                :class="status.online ? 'status-online' : 'status-offline'"
              >
                {{ status.online ? '🟢 En ligne' : '🔴 Hors ligne' }}
              </span>
              <span v-if="status?.online" class="clients-badge">
                {{ status.clientCount }} connecté{{ status.clientCount > 1 ? 's' : '' }}
              </span>
            </h2>
            <p class="module-desc" style="margin: 0; color: var(--text-muted); font-size: 13px;">
              Widget interactif d'arborescence des salons et utilisateurs TeamSpeak 3 pour Discord, avec journalisation des connexions et actions en direct.
            </p>
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <button
              class="module-btn"
              :disabled="refreshing"
              title="Rafraîchir le statut et le cache"
              @click="handleQuickRefresh"
            >
              <span>{{ refreshing ? '⏳' : '🔄' }}</span>
              <span>{{ refreshing ? 'Actualisation…' : 'Actualiser' }}</span>
            </button>
          </div>
        </div>

        <!-- Sous-navigation des onglets -->
        <div class="module-tab-nav" style="margin-top: 16px; display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; flex-wrap: wrap;">
          <NuxtLink
            to="/modules/teamspeak/overview"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/teamspeak/overview') }"
          >
            <span>📊</span> Vue d'ensemble
          </NuxtLink>
          <NuxtLink
            to="/modules/teamspeak/tree"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/teamspeak/tree') }"
          >
            <span>🌲</span> Arborescence
          </NuxtLink>
          <NuxtLink
            to="/modules/teamspeak/logs"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/teamspeak/logs') }"
          >
            <span>📜</span> Logs d'activité
          </NuxtLink>
          <NuxtLink
            to="/modules/teamspeak/config"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/teamspeak/config') }"
          >
            <span>⚙️</span> Configuration
          </NuxtLink>
        </div>
      </div>

      <!-- Sous-page active -->
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTeamSpeak, type TeamSpeakStatus } from '~/composables/useTeamSpeak.ts';
import { useToast } from '~/composables/useToast.ts';

definePageMeta({
  title: 'TeamSpeak 3',
  icon: '🔊',
  description: 'Widget arborescence des salons et logs d\'activité TeamSpeak 3',
  section: 'modules',
  order: 17
});

useSeoMeta({
  title: 'TeamSpeak 3 - Bot',
  description: 'Widget arborescence des salons et journalisation des événements TeamSpeak 3',
  ogTitle: 'TeamSpeak 3 - Bot',
  ogDescription: 'Widget arborescence des salons et journalisation des événements TeamSpeak 3'
});

const route = useRoute();
const tsApi = useTeamSpeak();
const { showToast } = useToast();

const status = ref<TeamSpeakStatus | null>(null);
const refreshing = ref(false);

function isTabActive(path: string): boolean {
  if (path === '/modules/teamspeak/overview' && (route.path === '/modules/teamspeak' || route.path === '/modules/teamspeak/')) {
    return true;
  }
  return route.path.startsWith(path);
}

async function loadStatus() {
  try {
    status.value = await tsApi.getStatus();
  } catch {
    // Si offline ou non configuré
    status.value = {
      online: false,
      server: { name: 'Non connecté', host: '127.0.0.1', port: 9987 },
      channelCount: 0,
      clientCount: 0
    };
  }
}

async function handleQuickRefresh() {
  refreshing.value = true;
  try {
    await tsApi.refresh();
    await loadStatus();
    showToast('Statut et widget TeamSpeak 3 actualisés !', 'success');
  } catch (err: any) {
    showToast(`Erreur d'actualisation : ${err.message}`, 'error');
  } finally {
    refreshing.value = false;
  }
}

onMounted(() => {
  loadStatus();
});
</script>

<style scoped>
.status-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.status-online {
  background: rgba(87, 242, 135, 0.15);
  color: #57f287;
  border: 1px solid rgba(87, 242, 135, 0.3);
}
.status-offline {
  background: rgba(237, 66, 69, 0.15);
  color: #ed4245;
  border: 1px solid rgba(237, 66, 69, 0.3);
}
.clients-badge {
  font-size: 11px;
  font-weight: 600;
  background: var(--background-modifier-hover);
  color: var(--text-muted);
  padding: 2px 8px;
  border-radius: 10px;
}
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
  transition: background 0.15s;
}
.module-btn:hover {
  background: var(--background-modifier-selected);
}
.module-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.module-tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}
.module-tab-btn:hover {
  background: var(--background-modifier-hover);
  color: var(--text-normal);
}
.module-tab-btn.active {
  background: var(--brand-experiment, #5865f2);
  color: white;
  font-weight: 600;
}
</style>
