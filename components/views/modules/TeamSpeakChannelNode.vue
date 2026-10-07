<template>
  <div v-show="matchesSearch" class="channel-tree-node" :style="{ marginLeft: `${depth * 18}px` }">
    <!-- Cas 1 : Salon Spacer (Séparateur graphique TS3) -->
    <div v-if="isSpacer" class="channel-spacer">
      <span class="spacer-text">{{ channel.displayName }}</span>
    </div>

    <!-- Cas 2 : Salon standard TS3 -->
    <div v-else class="channel-card">
      <div class="channel-header">
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
          <span class="channel-icon">{{ channel.clients.length > 0 ? '🔊' : '📁' }}</span>
          <span class="channel-name" :class="{ 'highlight': isNameMatch }">
            {{ channel.displayName }}
          </span>
          <span class="channel-id">#{{ channel.cid }}</span>
        </div>

        <div style="display: flex; align-items: center; gap: 6px;">
          <span
            v-if="channel.clients.length > 0"
            class="channel-clients-badge"
          >
            {{ channel.clients.length }} user{{ channel.clients.length > 1 ? 's' : '' }}
          </span>
          <span v-else class="channel-empty-badge">vide</span>
        </div>
      </div>

      <!-- Utilisateurs dans le salon -->
      <div v-if="channel.clients.length > 0" class="channel-clients-list">
        <div
          v-for="client in channel.clients"
          :key="client.clid"
          class="client-item"
        >
          <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
            <div class="client-avatar">
              <span>👤</span>
            </div>
            <span class="client-name" :class="{ 'highlight': isClientMatch(client.nickname) }">
              {{ client.nickname }}
            </span>
          </div>

          <!-- Statuts vocaux du client -->
          <div class="client-badges">
            <span
              v-if="client.outputMuted"
              class="client-status-badge badge-mute-output"
              title="Casque désactivé (Muet)"
            >
              🔇
            </span>
            <span
              v-else-if="client.inputMuted"
              class="client-status-badge badge-mute-input"
              title="Micro désactivé"
            >
              🎙️❌
            </span>

            <span
              v-if="client.away"
              class="client-status-badge badge-away"
              :title="client.awayMessage ? `Absent : ${client.awayMessage}` : 'Absent'"
            >
              💤 {{ client.awayMessage ? `[${client.awayMessage}]` : 'Absent' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Sous-salons récursifs -->
    <div v-if="channel.subchannels && channel.subchannels.length > 0" class="subchannels-container">
      <TeamSpeakChannelNode
        v-for="sub in channel.subchannels"
        :key="sub.cid"
        :channel="sub"
        :search="search"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TeamSpeakChannelNode } from '~/composables/useTeamSpeak.ts';

const props = withDefaults(
  defineProps<{
    channel: TeamSpeakChannelNode;
    search?: string;
    depth?: number;
  }>(),
  {
    search: '',
    depth: 0
  }
);

const isSpacer = computed(() => {
  const raw = props.channel.name || '';
  return /^\[\*?c?l?r?spacer\d*\]/i.test(raw);
});

const isNameMatch = computed(() => {
  if (!props.search) return false;
  return props.channel.displayName.toLowerCase().includes(props.search.toLowerCase());
});

function isClientMatch(nickname: string): boolean {
  if (!props.search) return false;
  return nickname.toLowerCase().includes(props.search.toLowerCase());
}

const matchesSearch = computed(() => {
  if (!props.search) return true;
  const q = props.search.toLowerCase();
  if (props.channel.displayName.toLowerCase().includes(q)) return true;
  if (props.channel.clients.some(c => c.nickname.toLowerCase().includes(q))) return true;

  // Vérifier si un des sous-salons correspond
  const checkSub = (sub: TeamSpeakChannelNode): boolean => {
    if (sub.displayName.toLowerCase().includes(q)) return true;
    if (sub.clients.some(c => c.nickname.toLowerCase().includes(q))) return true;
    return sub.subchannels?.some(checkSub) || false;
  };

  return props.channel.subchannels?.some(checkSub) || false;
});
</script>

<style scoped>
.channel-tree-node {
  margin-bottom: 6px;
  position: relative;
}

.channel-spacer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  color: var(--text-muted, #949ba4);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
  margin: 10px 0 6px 0;
}

.channel-card {
  background: var(--bg-secondary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.15s;
}
.channel-card:hover {
  border-color: rgba(255, 255, 255, 0.14);
}

.channel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.12);
}

.channel-icon {
  font-size: 15px;
}

.channel-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--header-primary, #ffffff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.channel-name.highlight,
.client-name.highlight {
  color: #fee75c;
  background: rgba(254, 231, 92, 0.15);
  padding: 0 4px;
  border-radius: 3px;
}

.channel-id {
  font-size: 11px;
  color: var(--text-muted, #949ba4);
  font-family: 'JetBrains Mono', monospace;
}

.channel-clients-badge {
  font-size: 11px;
  font-weight: 700;
  background: rgba(87, 242, 135, 0.15);
  color: #57f287;
  padding: 2px 7px;
  border-radius: 10px;
}

.channel-empty-badge {
  font-size: 11px;
  color: var(--text-muted, #949ba4);
  padding: 2px 6px;
}

.channel-clients-list {
  padding: 4px 10px 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(0, 0, 0, 0.04);
}

.client-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 8px;
  border-radius: 4px;
  background: var(--bg-tertiary, #1e1f22);
}

.client-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.client-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-normal, #dbdee1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.client-badges {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.client-status-badge {
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
}

.badge-mute-output {
  background: rgba(237, 66, 69, 0.15);
  color: #ed4245;
}

.badge-mute-input {
  background: rgba(230, 126, 34, 0.15);
  color: #e67e22;
}

.badge-away {
  background: rgba(88, 101, 242, 0.15);
  color: #5865f2;
  font-size: 10.5px;
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subchannels-container {
  margin-top: 6px;
  border-left: 2px solid rgba(255, 255, 255, 0.06);
  padding-left: 6px;
}
</style>
