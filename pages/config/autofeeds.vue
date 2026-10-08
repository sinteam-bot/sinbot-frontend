<template>
  <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
    <div class="spinner" style="width: 32px; height: 32px;"></div>
  </div>

  <div v-else-if="config" style="display: flex; flex-direction: column; gap: 20px;">
    <!-- En-tête et présentation -->
    <div class="config-card">
      <div class="card-subtitle">📡 APIs Globales & Alertes de Stream (Twitch, YouTube, Kick)</div>
      <p class="config-desc">
        Configurez les identifiants développeur optionnels pour les intégrations natives et webhooks.
        <em>Par défaut, la détection des flux fonctionne sans aucun compte développeur (polling public automatique).</em>
      </p>

      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Twitch Client ID</label>
          <input
            v-model="config.autofeeds.twitch.client_id"
            type="text"
            class="discord-input"
            placeholder="gp762nvuoqsk37..."
          />
        </div>
        <div class="col-half">
          <label class="form-label">Twitch Client Secret</label>
          <input
            v-model="config.autofeeds.twitch.client_secret"
            type="password"
            class="discord-input"
            placeholder="••••••••••••••••"
          />
        </div>
      </div>

      <div class="form-row" style="margin-top: 14px;">
        <div class="col-half">
          <label class="form-label">Secret Twitch EventSub (Webhooks)</label>
          <input
            v-model="config.autofeeds.twitch.eventsub_secret"
            type="password"
            class="discord-input"
            placeholder="Clé secrète pour vérifier les signatures EventSub"
          />
        </div>
        <div class="col-half">
          <label class="form-label">Clé API YouTube Data v3</label>
          <input
            v-model="config.autofeeds.youtube.api_key"
            type="password"
            class="discord-input"
            placeholder="AIzaSy..."
          />
        </div>
      </div>
    </div>

    <!-- Intervalles de vérification & Santé des flux -->
    <div class="config-card">
      <div class="card-subtitle">⏱️ Intervalles de Polling & Surveillance de Santé</div>
      <p class="config-desc">
        Définissez la fréquence de vérification automatique par type de média et les seuils d'alerte en cas d'erreur.
      </p>

      <div class="form-row">
        <div class="col-third">
          <label class="form-label">Lives & Streams (minutes)</label>
          <input
            v-model.number="config.autofeeds.poll_intervals.live_minutes"
            type="number"
            min="1"
            max="60"
            class="discord-input"
          />
          <span style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: block;">Recommandé : 2 min</span>
        </div>
        <div class="col-third">
          <label class="form-label">Vidéos YouTube & Médias (minutes)</label>
          <input
            v-model.number="config.autofeeds.poll_intervals.video_minutes"
            type="number"
            min="5"
            max="120"
            class="discord-input"
          />
          <span style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: block;">Recommandé : 15 min</span>
        </div>
        <div class="col-third">
          <label class="form-label">Flux RSS & Presse (minutes)</label>
          <input
            v-model.number="config.autofeeds.poll_intervals.rss_minutes"
            type="number"
            min="10"
            max="1440"
            class="discord-input"
          />
          <span style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: block;">Recommandé : 30 min</span>
        </div>
      </div>

      <div class="form-row" style="margin-top: 16px;">
        <div class="col-half">
          <label class="form-label">Alerte admin logs après X échecs consécutifs</label>
          <input
            v-model.number="config.autofeeds.error_handling.alert_after_errors"
            type="number"
            min="1"
            max="10"
            class="discord-input"
          />
          <span style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: block;">Défaut : 3 échecs</span>
        </div>
        <div class="col-half">
          <label class="form-label">Désactivation automatique après X échecs consécutifs</label>
          <input
            v-model.number="config.autofeeds.error_handling.max_consecutive_errors"
            type="number"
            min="3"
            max="30"
            class="discord-input"
          />
          <span style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: block;">Défaut : 10 échecs (sécurité charge serveur)</span>
        </div>
      </div>

      <div class="form-row" style="margin-top: 16px;">
        <div class="col-half">
          <label class="form-label">Salon Discord pour les alertes de santé des flux (ID)</label>
          <input
            v-model="config.autofeeds.log_channel_id"
            type="text"
            class="discord-input"
            placeholder="ID du salon de logs (ex: 123456789012345678)"
          />
        </div>
      </div>

      <div class="config-actions-bar" style="margin-top: 24px;">
        <button class="btn-primary" :disabled="isSaving" @click="saveConfig">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder la configuration Autofeeds' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';

definePageMeta({
  title: 'Flux & Streams (APIs)',
  icon: '📡',
  description: 'Configuration globale des APIs Twitch, YouTube et surveillance des flux',
  section: 'bot',
  hidden: true
});

useSeoMeta({
  title: 'Flux & Streams (APIs)',
  description: 'Configuration globale des APIs Twitch, YouTube et surveillance des flux',
  ogTitle: 'Flux & Streams (APIs) - Bot',
  ogDescription: 'Configuration globale des APIs Twitch, YouTube et surveillance des flux'
});

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const config = ref<any>(null);
const isLoading = ref(true);
const isSaving = ref(false);

onMounted(() => {
  loadConfig();
});

async function loadConfig() {
  isLoading.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/config');
    if (res.success && res.data) {
      const af = res.data.autofeeds || {};
      config.value = {
        autofeeds: {
          enabled: af.enabled !== undefined ? af.enabled : true,
          twitch: {
            client_id: af.twitch?.client_id || '',
            client_secret: af.twitch?.client_secret || '',
            eventsub_secret: af.twitch?.eventsub_secret || ''
          },
          youtube: {
            api_key: af.youtube?.api_key || ''
          },
          poll_intervals: {
            live_minutes: af.poll_intervals?.live_minutes || 2,
            video_minutes: af.poll_intervals?.video_minutes || 15,
            rss_minutes: af.poll_intervals?.rss_minutes || 30
          },
          error_handling: {
            alert_after_errors: af.error_handling?.alert_after_errors || 3,
            max_consecutive_errors: af.error_handling?.max_consecutive_errors || 10
          },
          log_channel_id: af.log_channel_id || ''
        }
      };
    }
  } catch (err: any) {
    showToast('Erreur chargement: ' + err.message, 'error');
  } finally {
    isLoading.value = false;
  }
}

async function saveConfig() {
  isSaving.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/config', {
      method: 'POST',
      body: {
        module: 'autofeeds',
        config: config.value.autofeeds
      }
    });
    if (res.success) {
      showToast('Configuration des flux et APIs sauvegardée avec succès !', 'success');
    } else {
      showToast('Erreur lors de la sauvegarde.', 'error');
    }
  } catch (err: any) {
    showToast(`Erreur: ${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.col-third {
  flex: 1;
  min-width: 180px;
}
</style>
