<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Feedback Alertes -->
    <div v-if="error" class="alert-box alert-danger">
      <span>❌</span>
      <span>{{ error }}</span>
    </div>
    <div v-if="ok" class="alert-box alert-success">
      <span>✅</span>
      <span>{{ ok }}</span>
    </div>

    <!-- 1. Activation Globale du Module -->
    <div class="config-card">
      <div class="card-subtitle">🔊 Statut du Module TeamSpeak 3</div>
      <p class="config-desc">
        Activez ou désactivez l'ensemble des fonctionnalités TeamSpeak 3 (connexion ServerQuery, widget Discord en direct et enregistrement des logs).
      </p>

      <div class="config-item">
        <label class="config-label">Module Activé</label>
        <div style="display: flex; align-items: center; gap: 12px;">
          <label class="switch">
            <input v-model="form.enabled" type="checkbox" />
            <span class="slider"></span>
          </label>
          <span style="font-size: 13px; color: var(--text-muted);">
            {{ form.enabled ? 'Le bot se connecte à TeamSpeak et synchronise les données.' : 'Module inactif, aucune connexion TS3 établie.' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 2. Connexion ServerQuery -->
    <div class="config-card">
      <div class="card-subtitle">🌐 Connexion Serveur TeamSpeak (ServerQuery)</div>
      <p class="config-desc">
        Identifiants ServerQuery nécessaires pour interroger l'arborescence des salons et écouter les événements en temps réel.
      </p>

      <div class="config-item">
        <label class="config-label">Hôte (Host / IP)</label>
        <div style="flex: 1; max-width: 360px;">
          <input
            v-model="form.server.host"
            type="text"
            class="discord-input"
            placeholder="127.0.0.1 ou ts.mon-serveur.fr"
          />
          <span class="config-hint">Adresse IP ou nom de domaine du serveur TeamSpeak 3</span>
        </div>
      </div>

      <div class="config-item">
        <label class="config-label">Ports</label>
        <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
          <div>
            <label style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px;">Port ServerQuery</label>
            <input
              v-model.number="form.server.queryport"
              type="number"
              min="1"
              max="65535"
              class="discord-input"
              style="width: 130px;"
              placeholder="10011"
            />
          </div>
          <div>
            <label style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px;">Port Vocal (Virtual Server)</label>
            <input
              v-model.number="form.server.serverport"
              type="number"
              min="1"
              max="65535"
              class="discord-input"
              style="width: 130px;"
              placeholder="9987"
            />
          </div>
          <div>
            <label style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px;">Protocole</label>
            <select v-model="form.server.protocol" class="discord-input" style="width: 110px;">
              <option value="raw">raw (Telnet)</option>
              <option value="ssh">ssh</option>
            </select>
          </div>
        </div>
      </div>

      <div class="config-item">
        <label class="config-label">Identifiant ServerQuery</label>
        <div style="flex: 1; max-width: 360px;">
          <input
            v-model="form.server.username"
            type="text"
            class="discord-input"
            placeholder="serveradmin"
          />
          <span class="config-hint">Compte ServerQuery (par défaut <code>serveradmin</code>)</span>
        </div>
      </div>

      <div class="config-item">
        <label class="config-label">Mot de passe ServerQuery</label>
        <div style="flex: 1; max-width: 360px;">
          <input
            v-model="passwordInput"
            type="password"
            class="discord-input"
            :placeholder="form.server.password ? '•••••••• (Laisser vide pour ne pas modifier)' : 'Mot de passe ServerQuery'"
          />
          <span class="config-hint">
            {{ form.server.password ? 'Un mot de passe est déjà enregistré. Laissez vide pour le conserver.' : 'Saisissez le mot de passe ServerQuery généré lors de la création du serveur.' }}
          </span>
        </div>
      </div>

      <div class="config-item">
        <label class="config-label">Pseudo du Bot sur TS3</label>
        <div style="flex: 1; max-width: 360px;">
          <input
            v-model="form.server.nickname"
            type="text"
            class="discord-input"
            placeholder="DiscordTS3Widget"
          />
          <span class="config-hint">Nom d'affichage du bot dans la liste des utilisateurs TS3</span>
        </div>
      </div>
    </div>

    <!-- 3. Widget Discord d'Arborescence -->
    <div class="config-card">
      <div class="card-subtitle">📌 Widget Discord d'Arborescence</div>
      <p class="config-desc">
        Affiche et met à jour en continu un message embed interactif avec l'arbre des salons et clients dans un salon Discord dédié.
      </p>

      <div class="config-item">
        <label class="config-label">Activer le Widget</label>
        <label class="switch">
          <input v-model="form.widget.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-item">
        <label class="config-label">Salon Discord Cible</label>
        <div style="flex: 1; max-width: 360px;">
          <DiscordChannelSelect
            v-model="form.widget.channel_id"
            channel-type="guild-text"
            placeholder="Sélectionner un salon textuel Discord"
            null-label="— Aucun salon sélectionné —"
          />
          <span class="config-hint">Salon où le bot publiera et modifiera le message d'arborescence</span>
        </div>
      </div>

      <div class="config-item">
        <label class="config-label">Intervalle de Rafraîchissement</label>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input
            v-model.number="form.widget.refresh_interval_seconds"
            type="number"
            min="10"
            max="3600"
            class="discord-input"
            style="width: 100px;"
          />
          <span class="config-hint">secondes (minimum 10s recommandé)</span>
        </div>
      </div>

      <div class="config-item">
        <label class="config-label">Titre & Couleur de l'Embed</label>
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
          <input
            v-model="form.widget.title"
            type="text"
            class="discord-input"
            style="width: 240px;"
            placeholder="🔊 Serveur TeamSpeak 3"
          />
          <div style="display: flex; align-items: center; gap: 6px;">
            <input
              v-model="form.widget.color"
              type="color"
              style="width: 36px; height: 36px; border: none; background: transparent; cursor: pointer;"
            />
            <input
              v-model="form.widget.color"
              type="text"
              class="discord-input"
              style="width: 90px; font-family: monospace;"
              placeholder="#2580EB"
            />
          </div>
        </div>
      </div>

      <div class="config-item">
        <label class="config-label">Options d'Affichage</label>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <label class="checkbox-option">
            <input v-model="form.widget.hide_empty_channels" type="checkbox" />
            <span>Masquer les salons vides dans l'arborescence Discord</span>
          </label>
          <label class="checkbox-option">
            <input v-model="form.widget.show_channel_ids" type="checkbox" />
            <span>Afficher les identifiants de salon <code>[#ID]</code></span>
          </label>
          <label class="checkbox-option">
            <input v-model="form.widget.show_query_clients" type="checkbox" />
            <span>Afficher les clients ServerQuery (bots administratifs)</span>
          </label>
        </div>
      </div>
    </div>

    <!-- 4. Journalisation des Événements (Logs) -->
    <div class="config-card">
      <div class="card-subtitle">📜 Journalisation des Événements TeamSpeak</div>
      <p class="config-desc">
        Enregistre les connexions, déconnexions et déplacements dans la base de données et les transmet dans un salon Discord d'audit.
      </p>

      <div class="config-item">
        <label class="config-label">Activer les Logs</label>
        <label class="switch">
          <input v-model="form.logs.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-item">
        <label class="config-label">Salon Discord des Logs</label>
        <div style="flex: 1; max-width: 360px;">
          <DiscordChannelSelect
            v-model="form.logs.channel_id"
            channel-type="guild-text"
            placeholder="Sélectionner un salon de logs Discord"
            null-label="— Aucun salon sélectionné —"
          />
          <span class="config-hint">Salon où seront postés les embeds d'audit en temps réel</span>
        </div>
      </div>

      <div class="config-item">
        <label class="config-label">Événements à Journaliser</label>
        <div class="events-checkbox-grid">
          <label class="checkbox-option">
            <input v-model="form.logs.events.client_connect" type="checkbox" />
            <span>🟢 Connexions de membres</span>
          </label>
          <label class="checkbox-option">
            <input v-model="form.logs.events.client_disconnect" type="checkbox" />
            <span>🔴 Déconnexions de membres</span>
          </label>
          <label class="checkbox-option">
            <input v-model="form.logs.events.client_moved" type="checkbox" />
            <span>🔄 Déplacements de salon</span>
          </label>
          <label class="checkbox-option">
            <input v-model="form.logs.events.channel_create" type="checkbox" />
            <span>📁 Création de salon</span>
          </label>
          <label class="checkbox-option">
            <input v-model="form.logs.events.channel_delete" type="checkbox" />
            <span>🗑️ Suppression de salon</span>
          </label>
          <label class="checkbox-option">
            <input v-model="form.logs.events.server_edit" type="checkbox" />
            <span>⚙️ Modification de la configuration serveur</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Barre d'Actions Inférieure -->
    <div class="config-actions-bar">
      <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <button
          class="module-btn module-btn-primary"
          :disabled="saving"
          @click="saveConfig"
        >
          <span>{{ saving ? '⏳' : '💾' }}</span>
          <span>{{ saving ? 'Enregistrement en cours…' : 'Enregistrer la configuration' }}</span>
        </button>

        <button
          class="module-btn"
          :disabled="testing || saving"
          title="Tester la connexion et forcer une mise à jour du widget"
          @click="testConnection"
        >
          <span>{{ testing ? '⏳' : '🔄' }}</span>
          <span>{{ testing ? 'Test en cours…' : 'Tester & Rafraîchir' }}</span>
        </button>

        <button
          class="module-btn"
          :disabled="saving"
          @click="loadConfig"
        >
          <span>↺</span>
          <span>Réinitialiser</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTeamSpeak, type TeamSpeakConfig } from '~/composables/useTeamSpeak.ts';
import { useToast } from '~/composables/useToast.ts';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';

const tsApi = useTeamSpeak();
const { showToast } = useToast();

const error = ref<string | null>(null);
const ok = ref<string | null>(null);
const saving = ref(false);
const testing = ref(false);

const passwordInput = ref('');

const form = ref<TeamSpeakConfig>({
  enabled: false,
  allowed_roles: [],
  server: {
    host: '127.0.0.1',
    queryport: 10011,
    serverport: 9987,
    protocol: 'raw',
    username: 'serveradmin',
    password: '',
    nickname: 'DiscordTS3Widget',
    readyTimeout: 10000,
    keepAlive: true
  },
  widget: {
    enabled: true,
    channel_id: null,
    message_id: null,
    refresh_interval_seconds: 30,
    title: '🔊 Serveur TeamSpeak 3',
    color: '#2580EB',
    hide_empty_channels: false,
    show_query_clients: false,
    show_channel_ids: true
  },
  logs: {
    enabled: true,
    channel_id: null,
    color: '#2580EB',
    events: {
      client_connect: true,
      client_disconnect: true,
      client_moved: true,
      channel_create: true,
      channel_delete: true,
      server_edit: false
    }
  }
});

async function loadConfig() {
  error.value = null;
  try {
    const data = await tsApi.getConfig();
    if (data) {
      form.value = {
        enabled: Boolean(data.enabled),
        allowed_roles: data.allowed_roles || [],
        server: {
          host: data.server?.host || '127.0.0.1',
          queryport: Number(data.server?.queryport || 10011),
          serverport: Number(data.server?.serverport || 9987),
          protocol: data.server?.protocol || 'raw',
          username: data.server?.username || 'serveradmin',
          password: data.server?.password || '',
          nickname: data.server?.nickname || 'DiscordTS3Widget',
          readyTimeout: data.server?.readyTimeout || 10000,
          keepAlive: data.server?.keepAlive !== false
        },
        widget: {
          enabled: data.widget?.enabled !== false,
          channel_id: data.widget?.channel_id || null,
          message_id: data.widget?.message_id || null,
          refresh_interval_seconds: Number(data.widget?.refresh_interval_seconds || 30),
          title: data.widget?.title || '🔊 Serveur TeamSpeak 3',
          color: data.widget?.color || '#2580EB',
          hide_empty_channels: Boolean(data.widget?.hide_empty_channels),
          show_query_clients: Boolean(data.widget?.show_query_clients),
          show_channel_ids: data.widget?.show_channel_ids !== false
        },
        logs: {
          enabled: data.logs?.enabled !== false,
          channel_id: data.logs?.channel_id || null,
          color: data.logs?.color || '#2580EB',
          events: {
            client_connect: data.logs?.events?.client_connect !== false,
            client_disconnect: data.logs?.events?.client_disconnect !== false,
            client_moved: data.logs?.events?.client_moved !== false,
            channel_create: data.logs?.events?.channel_create !== false,
            channel_delete: data.logs?.events?.channel_delete !== false,
            server_edit: Boolean(data.logs?.events?.server_edit)
          }
        }
      };
      passwordInput.value = '';
    }
  } catch (err: any) {
    error.value = err.message;
  }
}

async function saveConfig() {
  saving.value = true;
  error.value = null;
  ok.value = null;

  try {
    const payload = JSON.parse(JSON.stringify(form.value));

    // Si l'utilisateur a tapé un nouveau mot de passe, l'envoyer
    if (passwordInput.value.trim().length > 0) {
      payload.server.password = passwordInput.value.trim();
    } else if (payload.server.password === '••••••••') {
      // Ne pas écraser
      delete payload.server.password;
    }

    await tsApi.updateConfig(payload);
    ok.value = 'Configuration TeamSpeak 3 enregistrée avec succès !';
    showToast('Configuration enregistrée !', 'success');
    await loadConfig();

    setTimeout(() => {
      ok.value = null;
    }, 4000);
  } catch (err: any) {
    error.value = err.message;
    showToast(`Erreur d'enregistrement : ${err.message}`, 'error');
  } finally {
    saving.value = false;
  }
}

async function testConnection() {
  testing.value = true;
  try {
    await tsApi.refresh();
    const st = await tsApi.getStatus();
    if (st.online) {
      showToast(`Connexion réussie ! Serveur "${st.server?.name || 'TS3'}" en ligne (${st.clientCount} clients)`, 'success');
    } else {
      showToast('Le serveur TeamSpeak ne semble pas répondre.', 'error');
    }
  } catch (err: any) {
    showToast(`Échec du test de connexion : ${err.message}`, 'error');
  } finally {
    testing.value = false;
  }
}

onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.config-card {
  background: var(--bg-secondary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: 8px;
  padding: 18px;
}
.card-subtitle {
  font-size: 14px;
  font-weight: 700;
  color: var(--header-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.config-desc {
  font-size: 12.5px;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0 0 16px 0;
}
.config-desc code,
.config-hint code {
  font-family: 'JetBrains Mono', monospace;
  background: var(--bg-tertiary, #1e1f22);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
}

.config-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  flex-wrap: wrap;
}
.config-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.config-label {
  display: block;
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  width: 200px;
  flex-shrink: 0;
  padding-top: 6px;
}

.config-hint {
  display: block;
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 4px;
}

.switch {
  position: relative;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  inset: 0;
  background: #4e5058;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}
.slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  top: 3px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}
.switch input:checked + .slider {
  background: #57f287;
}
.switch input:checked + .slider::before {
  transform: translateX(20px);
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-normal);
  cursor: pointer;
  user-select: none;
}
.checkbox-option input {
  cursor: pointer;
}

.events-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  width: 100%;
}

.module-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  background: var(--background-modifier-hover);
  color: var(--text-normal);
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.module-btn:hover { background: var(--background-modifier-selected); }
.module-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.module-btn-primary { background: var(--brand-experiment, #5865f2); color: white; border-color: transparent; font-weight: 600; }
.module-btn-primary:hover { background: #4752c4; }

.config-actions-bar {
  background: var(--bg-secondary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: 8px;
  padding: 14px 18px;
}

.alert-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 13px;
}
.alert-danger {
  background: rgba(237, 66, 69, 0.15);
  border: 1px solid rgba(237, 66, 69, 0.3);
  color: #ed4245;
}
.alert-success {
  background: rgba(87, 242, 135, 0.15);
  border: 1px solid rgba(87, 242, 135, 0.3);
  color: #57f287;
}
</style>
