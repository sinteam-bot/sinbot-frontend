<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- En-tête de section -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
      <div>
        <h3 style="margin: 0; font-size: 18px; color: var(--header-primary); font-weight: 700;">
          🔔 Abonnements &amp; Alertes Membres ({{ subscriptions.length }})
        </h3>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-muted);">
          Liste des souscriptions actives par tag, catégorie ou mots-clés. Les membres reçoivent une notification personnalisée (mention ou DM).
        </p>
      </div>

      <div style="display: flex; gap: 8px;">
        <button class="module-btn" :disabled="loading" @click="loadData">
          <span>🔄</span>
          <span>Actualiser</span>
        </button>
        <button class="module-btn primary" @click="openCreateModal">
          <span>➕</span>
          <span>Nouvel Abonnement</span>
        </button>
      </div>
    </div>

    <!-- Filtre par type de souscription -->
    <div class="category-filter-bar">
      <button
        class="filter-pill"
        :class="{ active: filterType === '' }"
        @click="filterType = ''"
      >
        Tous les abonnements ({{ subscriptions.length }})
      </button>
      <button
        class="filter-pill"
        :class="{ active: filterType === 'tag' }"
        @click="filterType = 'tag'"
      >
        🏷️ Par Tag ({{ subscriptions.filter(s => s.targetTag).length }})
      </button>
      <button
        class="filter-pill"
        :class="{ active: filterType === 'category' }"
        @click="filterType = 'category'"
      >
        📁 Par Catégorie ({{ subscriptions.filter(s => s.targetCategory).length }})
      </button>
      <button
        class="filter-pill"
        :class="{ active: filterType === 'keywords' }"
        @click="filterType = 'keywords'"
      >
        🔍 Par Mots-clés ({{ subscriptions.filter(s => s.targetKeywords?.length).length }})
      </button>
      <button
        class="filter-pill"
        :class="{ active: filterType === 'feed' }"
        @click="filterType = 'feed'"
      >
        📡 Par Flux spécifique ({{ subscriptions.filter(s => s.feedId).length }})
      </button>
    </div>

    <!-- État vide -->
    <div v-if="filteredSubs.length === 0 && !loading" class="config-card empty-card">
      <div style="font-size: 36px; margin-bottom: 8px;">🔕</div>
      <h4 style="margin: 0 0 4px 0; font-size: 16px; color: var(--header-primary);">Aucun abonnement actif</h4>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: var(--text-muted); max-width: 500px;">
        Les membres peuvent s'abonner depuis Discord avec la commande <code>/feed subscribe</code> ou en cliquant sur les boutons interactifs sous les annonces.
      </p>
      <button class="module-btn primary" @click="openCreateModal">
        <span>➕</span> Créer un abonnement manuellement
      </button>
    </div>

    <!-- Tableau des abonnements -->
    <div v-else class="config-card" style="padding: 0; overflow-x: auto;">
      <table class="subs-table">
        <thead>
          <tr>
            <th>Membre Discord</th>
            <th>Type de Cible</th>
            <th>Valeur / Critère</th>
            <th>Mode Notification</th>
            <th>Portée</th>
            <th>Créé le</th>
            <th style="text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sub in filteredSubs" :key="sub.id">
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="avatar-ph">👤</span>
                <span class="user-id-code">&lt;@{{ sub.userId }}&gt;</span>
              </div>
            </td>
            <td>
              <span v-if="sub.targetTag" class="type-badge tag">🏷️ Tag</span>
              <span v-else-if="sub.targetCategory" class="type-badge cat">📁 Catégorie</span>
              <span v-else-if="sub.targetKeywords?.length" class="type-badge kw">🔍 Mots-clés</span>
              <span v-else-if="sub.feedId" class="type-badge feed">📡 Flux</span>
              <span v-else class="type-badge">🌐 Global</span>
            </td>
            <td>
              <strong v-if="sub.targetTag" class="val-pill">#{{ sub.targetTag }}</strong>
              <strong v-else-if="sub.targetCategory" class="val-pill cat">{{ sub.targetCategory }}</strong>
              <span v-else-if="sub.targetKeywords?.length" class="val-pill kw">{{ sub.targetKeywords.join(', ') }}</span>
              <span v-else-if="sub.feedId" class="font-mono">Flux #{{ sub.feedId.slice(0, 8) }}</span>
              <span v-else class="text-muted">Tout le serveur</span>
            </td>
            <td>
              <span
                class="mode-badge"
                :class="sub.notifyMode === 'dm' ? 'dm' : 'mention'"
              >
                {{ sub.notifyMode === 'dm' ? '📩 Message Privé (DM)' : '📢 Mention Salon' }}
              </span>
            </td>
            <td>
              <span v-if="sub.feedId" class="text-muted" style="font-size: 12px;">Flux spécifique</span>
              <span v-else style="font-size: 12px; color: #57f287;">Tous les flux</span>
            </td>
            <td>
              <span class="date-text">{{ formatDate(sub.createdAt) }}</span>
            </td>
            <td style="text-align: right;">
              <button
                class="delete-sub-btn"
                title="Supprimer cet abonnement"
                @click="handleDeleteSub(sub)"
              >
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal création d'abonnement -->
    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3 style="margin: 0; font-size: 18px; color: var(--header-primary);">➕ Ajouter un abonnement</h3>
          <button class="close-btn" @click="showModal = false">✕</button>
        </div>

        <form class="modal-form" @submit.prevent="handleCreateSub">
          <div class="form-group">
            <label class="form-label">ID Utilisateur Discord</label>
            <input
              v-model="form.userId"
              type="text"
              required
              class="form-input"
              placeholder="Ex: 123456789012345678"
            />
            <span class="form-hint">L'ID Snowflake de l'utilisateur à notifier.</span>
          </div>

          <div class="form-group">
            <label class="form-label">Critère d'alerte</label>
            <select v-model="targetType" class="form-select">
              <option value="tag">🏷️ Par Tag (ex: epic, steam, deals)</option>
              <option value="category">📁 Par Catégorie (ex: gaming, news)</option>
              <option value="keywords">🔍 Par Mots-clés (ex: 100% off, free)</option>
              <option value="all">🌐 Tout recevoir</option>
            </select>
          </div>

          <div v-if="targetType === 'tag'" class="form-group">
            <label class="form-label">Tag surveillé</label>
            <input
              v-model="form.targetTag"
              type="text"
              required
              class="form-input"
              placeholder="Ex: epic ou steam ou free"
            />
          </div>

          <div v-else-if="targetType === 'category'" class="form-group">
            <label class="form-label">Catégorie surveillée</label>
            <input
              v-model="form.targetCategory"
              type="text"
              required
              class="form-input"
              placeholder="Ex: gaming ou tech"
            />
          </div>

          <div v-else-if="targetType === 'keywords'" class="form-group">
            <label class="form-label">Mots-clés requis (séparés par des virgules)</label>
            <input
              v-model="keywordsInput"
              type="text"
              required
              class="form-input"
              placeholder="Ex: free, 100% off, giveway"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Mode de notification</label>
            <select v-model="form.notifyMode" class="form-select">
              <option value="mention">📢 Mention dans le salon du flux (&lt;@id&gt;)</option>
              <option value="dm">📩 Message Privé direct du bot (DM)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Restreindre à un flux spécifique (optionnel)</label>
            <select v-model="form.feedId" class="form-select">
              <option value="">Tous les flux correspondants (Recommandé)</option>
              <option v-for="f in feeds" :key="f.id" :value="f.id">
                {{ f.name }} (&lt;#{{ f.channelId }}&gt;)
              </option>
            </select>
          </div>

          <div class="modal-footer">
            <button type="button" class="module-btn" @click="showModal = false">
              Annuler
            </button>
            <button type="submit" class="module-btn primary" :disabled="submitting">
              <span>{{ submitting ? '⏳ Création...' : '✅ Enregistrer l\'abonnement' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAutofeeds, type AutofeedSubscription, type AutofeedItem } from '~/composables/useAutofeeds.ts';
import { useToast } from '~/composables/useToast.ts';

const autofeedsApi = useAutofeeds();
const { showToast } = useToast();

const subscriptions = ref<AutofeedSubscription[]>([]);
const feeds = ref<AutofeedItem[]>([]);
const loading = ref(true);
const filterType = ref('');

const showModal = ref(false);
const submitting = ref(false);
const targetType = ref<'tag' | 'category' | 'keywords' | 'all'>('tag');
const keywordsInput = ref('');

const form = ref({
  userId: '',
  feedId: '',
  targetTag: '',
  targetCategory: '',
  targetKeywords: [] as string[],
  notifyMode: 'mention' as 'mention' | 'dm'
});

const filteredSubs = computed(() => {
  if (!filterType.value) return subscriptions.value;
  if (filterType.value === 'tag') return subscriptions.value.filter(s => s.targetTag);
  if (filterType.value === 'category') return subscriptions.value.filter(s => s.targetCategory);
  if (filterType.value === 'keywords') return subscriptions.value.filter(s => s.targetKeywords?.length);
  if (filterType.value === 'feed') return subscriptions.value.filter(s => s.feedId);
  return subscriptions.value;
});

function formatDate(isoDate?: string): string {
  if (!isoDate) return 'N/A';
  try {
    return new Date(isoDate).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoDate;
  }
}

function openCreateModal() {
  form.value = {
    userId: '',
    feedId: '',
    targetTag: 'epic',
    targetCategory: '',
    targetKeywords: [],
    notifyMode: 'mention'
  };
  targetType.value = 'tag';
  keywordsInput.value = '';
  showModal.value = true;
}

async function loadData() {
  loading.value = true;
  try {
    const [fetchedSubs, fetchedFeeds] = await Promise.all([
      autofeedsApi.fetchSubscriptions(),
      autofeedsApi.fetchFeeds()
    ]);
    subscriptions.value = fetchedSubs || [];
    feeds.value = fetchedFeeds || [];
  } catch (err: any) {
    showToast(`Erreur chargement abonnements: ${err.message}`, 'error');
  } finally {
    loading.value = false;
  }
}

async function handleDeleteSub(sub: AutofeedSubscription) {
  if (!confirm('Supprimer cet abonnement ?')) return;
  try {
    await autofeedsApi.deleteSubscription(sub.id);
    subscriptions.value = subscriptions.value.filter(s => s.id !== sub.id);
    showToast('Abonnement supprimé.', 'success');
  } catch (err: any) {
    showToast(`Erreur de suppression : ${err.message}`, 'error');
  }
}

async function handleCreateSub() {
  submitting.value = true;
  try {
    const payload: any = {
      userId: form.value.userId,
      notifyMode: form.value.notifyMode,
      feedId: form.value.feedId || null
    };

    if (targetType.value === 'tag') {
      payload.targetTag = form.value.targetTag.trim().toLowerCase();
    } else if (targetType.value === 'category') {
      payload.targetCategory = form.value.targetCategory.trim().toLowerCase();
    } else if (targetType.value === 'keywords') {
      payload.targetKeywords = keywordsInput.value.split(',').map(s => s.trim()).filter(Boolean);
    }

    const created = await autofeedsApi.createSubscription(payload);
    subscriptions.value.unshift(created);
    showToast('Abonnement créé avec succès !', 'success');
    showModal.value = false;
  } catch (err: any) {
    showToast(`Erreur lors de la création : ${err.message}`, 'error');
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.category-filter-bar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.filter-pill {
  padding: 6px 14px;
  border-radius: 16px;
  background: var(--background-secondary);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.filter-pill:hover {
  background: var(--background-modifier-hover);
  color: var(--text-normal);
}
.filter-pill.active {
  background: var(--brand-experiment, #5865f2);
  color: white;
  border-color: transparent;
  font-weight: 600;
}
.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  text-align: center;
}
.subs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.subs-table th {
  text-align: left;
  padding: 12px 16px;
  background: var(--background-secondary-alt);
  color: var(--text-muted);
  font-weight: 600;
  border-bottom: 1px solid var(--border-subtle);
}
.subs-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-normal);
}
.avatar-ph {
  font-size: 18px;
}
.user-id-code {
  font-family: monospace;
  font-size: 12px;
  color: var(--header-primary);
  background: var(--background-secondary-alt);
  padding: 2px 6px;
  border-radius: 4px;
}
.type-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  background: var(--background-secondary-alt);
  color: var(--text-muted);
}
.type-badge.tag {
  background: rgba(87, 242, 135, 0.15);
  color: #57f287;
}
.type-badge.cat {
  background: rgba(88, 101, 242, 0.2);
  color: var(--brand-experiment, #5865f2);
}
.type-badge.kw {
  background: rgba(254, 231, 92, 0.15);
  color: #fee75c;
}
.val-pill {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--background-secondary-alt);
}
.mode-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}
.mode-badge.mention {
  background: rgba(88, 101, 242, 0.15);
  color: var(--brand-experiment, #5865f2);
}
.mode-badge.dm {
  background: rgba(235, 69, 158, 0.15);
  color: #eb459e;
}
.date-text {
  font-size: 12px;
  color: var(--text-muted);
}
.delete-sub-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  transition: background 0.15s;
}
.delete-sub-btn:hover {
  background: rgba(237, 66, 69, 0.2);
}

/* Modal styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.modal-card {
  background: var(--background-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
}
.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
}
.modal-form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}
.form-input, .form-select {
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--background-secondary);
  border: 1px solid var(--border-subtle);
  color: var(--text-normal);
  font-size: 14px;
}
.form-hint {
  font-size: 11px;
  color: var(--text-muted);
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
.module-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 6px;
  background: var(--background-modifier-hover);
  color: var(--text-normal);
  font-size: 13px;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
}
.module-btn.primary {
  background: var(--brand-experiment, #5865f2);
  color: white;
  border-color: transparent;
  font-weight: 600;
}
</style>
