<template>
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <!-- Alerte si erreur -->
    <div v-if="error" class="config-card" style="color: var(--status-danger, #ed4245); display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>⚠️</span>
        <span>{{ error }}</span>
      </div>
      <NuxtLink to="/modules/teamspeak/config" class="module-btn module-btn-primary" style="font-size: 12px; padding: 4px 10px;">
        Configurer le serveur
      </NuxtLink>
    </div>

    <!-- Barre d'outils et de contrôle -->
    <div class="tree-toolbar">
      <!-- Recherche de salon / client -->
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un salon ou un utilisateur…"
          class="discord-input search-input"
        />
        <button
          v-if="searchQuery"
          class="clear-search-btn"
          title="Effacer la recherche"
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>

      <!-- Options d'affichage -->
      <div class="toolbar-actions">
        <!-- Toggle Masquer les salons vides -->
        <label class="checkbox-label" title="Masquer les salons qui ne contiennent aucun utilisateur">
          <input
            v-model="hideEmpty"
            type="checkbox"
            @change="loadTree"
          />
          <span>Masquer les salons vides</span>
        </label>

        <!-- Bascule Mode Graphique / ASCII -->
        <div class="view-mode-toggle">
          <button
            type="button"
            :class="['mode-btn', { active: viewMode === 'interactive' }]"
            @click="viewMode = 'interactive'"
          >
            <span>🌲</span> Graphique
          </button>
          <button
            type="button"
            :class="['mode-btn', { active: viewMode === 'ascii' }]"
            @click="viewMode = 'ascii'"
          >
            <span>📋</span> Embed Discord
          </button>
        </div>

        <!-- Bouton Rafraîchir -->
        <button
          class="module-btn"
          :disabled="loading"
          title="Actualiser l'arborescence"
          @click="loadTree"
        >
          <span>{{ loading ? '⏳' : '🔄' }}</span>
          <span>{{ loading ? 'Actualisation…' : 'Actualiser' }}</span>
        </button>
      </div>
    </div>

    <!-- Métadonnées rapides -->
    <div class="tree-meta-bar">
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <span class="meta-pill">
          📁 <strong>{{ treeData?.channelCount || 0 }}</strong> salons
        </span>
        <span class="meta-pill">
          👥 <strong>{{ treeData?.clientCount || 0 }}</strong> utilisateurs connectés
        </span>
        <span v-if="serverName" class="meta-server-name">
          Serveur : <strong>{{ serverName }}</strong>
        </span>
      </div>

      <div v-if="viewMode === 'ascii'" style="display: flex; gap: 8px;">
        <button class="copy-btn" @click="copyAsciiTree">
          {{ copied ? '✅ Copié !' : '📋 Copier le texte' }}
        </button>
      </div>
    </div>

    <!-- État Chargement -->
    <div v-if="loading && !treeData" class="loading-state">
      <div class="spinner"></div>
      <span>Récupération de l'arborescence TeamSpeak 3…</span>
    </div>

    <!-- État Hors ligne / Aucun salon -->
    <div v-else-if="!treeData || treeData.rootChannels.length === 0" class="empty-state">
      <div class="empty-icon">🔊</div>
      <h3 style="font-size: 16px; margin: 0 0 6px 0; color: var(--header-primary);">
        {{ error ? 'Serveur TeamSpeak inaccessible' : 'Aucun salon disponible' }}
      </h3>
      <p style="margin: 0 0 16px 0; color: var(--text-muted); font-size: 13px; max-width: 480px;">
        Vérifiez que votre serveur TeamSpeak 3 est bien allumé et que les identifiants ServerQuery (host, port, user, password) sont renseignés.
      </p>
      <NuxtLink to="/modules/teamspeak/config" class="module-btn module-btn-primary">
        ⚙️ Configurer TeamSpeak 3
      </NuxtLink>
    </div>

    <!-- Vue 1 : Arborescence Interactive -->
    <div v-else-if="viewMode === 'interactive'" class="tree-container">
      <TeamSpeakChannelNode
        v-for="channel in treeData.rootChannels"
        :key="channel.cid"
        :channel="channel"
        :search="searchQuery"
        :depth="0"
      />
    </div>

    <!-- Vue 2 : Aperçu Embed ASCII Discord -->
    <div v-else-if="viewMode === 'ascii'" class="ascii-container">
      <div class="ascii-header">
        <span>Aperçu brut tel qu'affiché dans le salon Discord configuré :</span>
      </div>
      <pre class="ascii-pre"><code>{{ formattedAscii }}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTeamSpeak, type TeamSpeakTreeData, type TeamSpeakChannelNode } from '~/composables/useTeamSpeak.ts';
import { useToast } from '~/composables/useToast.ts';
import TeamSpeakChannelNodeComponent from '~/components/views/modules/TeamSpeakChannelNode.vue';

const tsApi = useTeamSpeak();
const { showToast } = useToast();

const treeData = ref<TeamSpeakTreeData | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const hideEmpty = ref(false);
const viewMode = ref<'interactive' | 'ascii'>('interactive');
const copied = ref(false);

const serverName = computed(() => treeData.value?.serverInfo?.name || '');

async function loadTree() {
  loading.value = true;
  error.value = null;
  try {
    const data = await tsApi.getTree(hideEmpty.value);
    treeData.value = data;
  } catch (err: any) {
    error.value = err.message || 'Impossible de joindre le serveur TeamSpeak 3.';
  } finally {
    loading.value = false;
  }
}

// Générateur d'arborescence ASCII (reproduit fidèlement le service backend)
const formattedAscii = computed(() => {
  if (!treeData.value?.rootChannels || treeData.value.rootChannels.length === 0) {
    return '*Aucun salon ou utilisateur à afficher.*';
  }

  const lines: string[] = [];

  const formatClientStatus = (c: any): string => {
    const flags: string[] = [];
    if (c.outputMuted) flags.push('🔇');
    else if (c.inputMuted) flags.push('🎙️❌');
    if (c.away) flags.push(c.awayMessage ? `💤 [${c.awayMessage}]` : '💤 [Absent]');
    return flags.length > 0 ? ` ${flags.join(' ')}` : '';
  };

  const renderChannel = (channel: TeamSpeakChannelNode, prefix = '', isLast = true, isRoot = false) => {
    const marker = isRoot ? '📁 ' : (isLast ? '└── 📁 ' : '├── 📁 ');
    lines.push(`${prefix}${marker}${channel.displayName} [${channel.cid}]`);

    const childPrefix = isRoot ? ' ' : prefix + (isLast ? '    ' : '│   ');
    const totalClients = channel.clients.length;
    const hasSubchannels = channel.subchannels && channel.subchannels.length > 0;

    channel.clients.forEach((client, idx) => {
      const isLastClient = idx === totalClients - 1 && !hasSubchannels;
      const clientMarker = isLastClient ? '└── 👤 ' : '├── 👤 ';
      const status = formatClientStatus(client);
      lines.push(`${childPrefix}${clientMarker}${client.nickname}${status}`);
    });

    if (channel.subchannels) {
      channel.subchannels.forEach((sub, idx) => {
        const isLastSub = idx === channel.subchannels.length - 1;
        renderChannel(sub, childPrefix, isLastSub, false);
      });
    }
  };

  treeData.value.rootChannels.forEach((root, idx) => {
    const isLast = idx === treeData.value!.rootChannels.length - 1;
    renderChannel(root, '', isLast, true);
  });

  return lines.join('\n');
});

async function copyAsciiTree() {
  try {
    await navigator.clipboard.writeText(formattedAscii.value);
    copied.value = true;
    showToast('Arborescence ASCII copiée dans le presse-papier !', 'success');
    setTimeout(() => { copied.value = false; }, 2500);
  } catch {
    showToast('Impossible de copier dans le presse-papier', 'error');
  }
}

onMounted(() => {
  loadTree();
});
</script>

<style scoped>
.tree-toolbar {
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

.search-box {
  position: relative;
  flex: 1;
  min-width: 240px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  font-size: 13px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 7px 32px 7px 32px;
  font-size: 13px;
  height: 34px;
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
}
.clear-search-btn:hover {
  color: var(--text-normal);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-muted);
  cursor: pointer;
  user-select: none;
}
.checkbox-label input {
  cursor: pointer;
}

.view-mode-toggle {
  display: flex;
  background: var(--bg-tertiary, #1e1f22);
  padding: 2px;
  border-radius: 6px;
}
.mode-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  font-size: 12px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  font-family: inherit;
  transition: background 0.15s, color 0.15s;
}
.mode-btn.active {
  background: var(--background-modifier-selected, #404249);
  color: var(--header-primary, #ffffff);
  font-weight: 600;
}

.tree-meta-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  font-size: 12.5px;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-pill {
  color: var(--text-muted);
}
.meta-pill strong {
  color: var(--header-primary);
}
.meta-server-name {
  color: var(--text-muted);
}
.meta-server-name strong {
  color: var(--brand-experiment, #5865f2);
}

.copy-btn {
  background: var(--background-modifier-hover);
  border: 1px solid var(--border-subtle);
  color: var(--text-normal);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}
.copy-btn:hover {
  background: var(--background-modifier-selected);
}

.module-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 6px;
  background: var(--background-modifier-hover);
  color: var(--text-normal);
  font-size: 13px;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: background 0.15s;
}
.module-btn:hover { background: var(--background-modifier-selected); }
.module-btn-primary { background: var(--brand-experiment, #5865f2); color: white; border-color: transparent; }
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

.tree-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ascii-container {
  background: #1e1f22;
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: 8px;
  padding: 14px;
}

.ascii-header {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.ascii-pre {
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px;
  line-height: 1.5;
  color: #dbdee1;
  background: #111214;
  padding: 14px;
  border-radius: 6px;
  overflow-x: auto;
  border: 1px solid rgba(255, 255, 255, 0.04);
}
</style>
