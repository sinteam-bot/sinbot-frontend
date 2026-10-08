<template>
  <div v-if="isLoading" class="config-loading">
    <div class="spinner"></div>
  </div>

  <div v-else class="config-page-wrapper">
    <!-- En-tête et APIs spécifiques au serveur -->
    <div class="config-card">
      <div class="card-subtitle">📡 APIs & Webhooks Spécifiques à ce Serveur</div>
      <p class="config-desc">
        Surchargez les identifiants Twitch ou YouTube pour ce serveur Discord. Si laissés vides, les clés globales du bot ou le mode sans compte développeur (polling public) seront utilisés.
      </p>

      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Twitch Client ID (Serveur)</label>
          <input
            v-model="config.twitch.client_id"
            type="text"
            class="discord-input"
            placeholder="Laisser vide pour utiliser le défaut"
          />
        </div>
        <div class="col-half">
          <label class="form-label">Twitch Client Secret (Serveur)</label>
          <input
            v-model="config.twitch.client_secret"
            type="password"
            class="discord-input"
            placeholder="••••••••••••••••"
          />
        </div>
      </div>

      <div class="form-row" style="margin-top: 14px;">
        <div class="col-half">
          <label class="form-label">Secret Twitch EventSub</label>
          <input
            v-model="config.twitch.eventsub_secret"
            type="password"
            class="discord-input"
            placeholder="Clé secrète de webhook EventSub"
          />
        </div>
        <div class="col-half">
          <label class="form-label">Clé API YouTube Data v3</label>
          <input
            v-model="config.youtube.api_key"
            type="password"
            class="discord-input"
            placeholder="Clé API YouTube dédiée au serveur"
          />
        </div>
      </div>
    </div>

    <!-- Surveillance de Santé & Salon de Logs -->
    <div class="config-card">
      <div class="card-subtitle">🚨 Surveillance de Santé & Salon de Logs</div>
      <p class="config-desc">
        Configurez où envoyer les notifications en cas d'échecs répétés de flux (après 3 échecs) ou de désactivation automatique (à 10 échecs).
      </p>

      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Salon de Logs pour les Erreurs de Flux</label>
          <DiscordChannelSelect v-model="config.log_channel_id" placeholder="Sélectionnez un salon de logs" />
        </div>
        <div class="col-half">
          <label class="form-label">Alerte admin après X échecs consécutifs</label>
          <input
            v-model.number="config.error_handling.alert_after_errors"
            type="number"
            min="1"
            max="10"
            class="discord-input"
          />
        </div>
      </div>

      <div class="config-actions-bar" style="margin-top: 24px;">
        <button class="btn-primary" :disabled="isSaving" @click="saveConfig">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder la configuration du serveur' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useConfigFeature } from '~/composables/useConfigFeature.ts';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';

definePageMeta({
  title: 'Flux & Streams - Configuration Serveur',
  hidden: true
});

useSeoMeta({
  title: 'Flux & Streams - Configuration',
  description: 'Configuration des clés et alertes de streams du serveur'
});

const route = useRoute();
const guildId = (route.params.guild as string) || 'default';

const { config, isLoading, isSaving, load, save } = useConfigFeature('autofeeds', {
  defaultConfig: {
    enabled: true,
    twitch: {
      client_id: '',
      client_secret: '',
      eventsub_secret: ''
    },
    youtube: {
      api_key: ''
    },
    poll_intervals: {
      live_minutes: 2,
      video_minutes: 15,
      rss_minutes: 30
    },
    error_handling: {
      alert_after_errors: 3,
      max_consecutive_errors: 10
    },
    log_channel_id: null
  }
});

async function saveConfig() {
  await save(config.value, guildId);
}

onMounted(() => {
  load(guildId);
});
</script>

<style scoped>
.config-page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-card {
  background: var(--bg-secondary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--radius-md, 8px);
  padding: 20px;
}

.card-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: var(--header-primary, #ffffff);
  margin-bottom: 4px;
}

.config-desc {
  font-size: 13px;
  color: var(--text-muted, #949ba4);
  margin-bottom: 16px;
}
</style>
