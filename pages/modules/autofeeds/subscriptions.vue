<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- En-tête de section -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
      <div>
        <h3 style="margin: 0; font-size: 18px; color: var(--header-primary); font-weight: 700;">
          🔔 Abonnements &amp; Alertes Membres ({{ subscriptions.length }})
        </h3>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-muted);">
          Liste des souscriptions actives par tag, catégorie, compte/créateur ou mots-clés. Les membres reçoivent une notification personnalisée (mention ou DM).
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
        🏷️ Par Tag ({{ subscriptions.filter(s => s.targetType === 'tag').length }})
      </button>
      <button
        class="filter-pill"
        :class="{ active: filterType === 'account' }"
        @click="filterType = 'account'"
      >
        👤 Par Compte ({{ subscriptions.filter(s => s.targetType === 'account' || s.targetType === 'author').length }})
      </button>
      <button
        class="filter-pill"
        :class="{ active: filterType === 'category' }"
        @click="filterType = 'category'"
      >
        📁 Par Catégorie ({{ subscriptions.filter(s => s.targetType === 'category').length }})
      </button>
      <button
        class="filter-pill"
        :class="{ active: filterType === 'keyword' }"
        @click="filterType = 'keyword'"
      >
        🔍 Par Mots-clés ({{ subscriptions.filter(s => s.targetType === 'keyword').length }})
      </button>
      <button
        class="filter-pill"
        :class="{ active: filterType === 'feed' }"
        @click="filterType = 'feed'"
      >
        📡 Par Flux spécifique ({{ subscriptions.filter(s => s.targetType === 'feed').length }})
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
            <th>Filtres Perso</th>
            <th>Mode Notification</th>
            <th>Créé le</th>
            <th style="text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sub in filteredSubs" :key="sub.id">
            <td>
              <DiscordUser :user-id="sub.userId" variant="inline" :show-presence="true" />
            </td>
            <td>
              <span v-if="sub.targetType === 'tag'" class="type-badge tag">🏷️ Tag</span>
              <span v-else-if="sub.targetType === 'account' || sub.targetType === 'author'" class="type-badge author">👤 Compte</span>
              <span v-else-if="sub.targetType === 'category'" class="type-badge cat">📁 Catégorie</span>
              <span v-else-if="sub.targetType === 'keyword'" class="type-badge kw">🔍 Mot-clé</span>
              <span v-else-if="sub.targetType === 'feed'" class="type-badge feed">📡 Flux</span>
              <span v-else class="type-badge">🌐 Global</span>
            </td>
            <td>
              <strong v-if="sub.targetType === 'tag'" class="val-pill">#{{ sub.targetValue }}</strong>
              <strong v-else-if="sub.targetType === 'account' || sub.targetType === 'author'" class="val-pill author">@{{ sub.targetValue }}</strong>
              <strong v-else-if="sub.targetType === 'category'" class="val-pill cat">{{ sub.targetValue }}</strong>
              <span v-else-if="sub.targetType === 'keyword'" class="val-pill kw">{{ sub.targetValue }}</span>
              <span v-else-if="sub.targetType === 'feed'" class="font-mono">Flux #{{ sub.targetValue.slice(0, 8) }}</span>
              <span v-else class="text-muted">Tout le serveur</span>
            </td>
            <td>
              <div v-if="sub.filters?.includeKeywords?.length || sub.filters?.excludeKeywords?.length" style="display: flex; gap: 4px; flex-wrap: wrap;">
                <span v-if="sub.filters?.includeKeywords?.length" class="filter-mini-tag inc">
                  +{{ sub.filters.includeKeywords.join(', ') }}
                </span>
                <span v-if="sub.filters?.excludeKeywords?.length" class="filter-mini-tag exc">
                  -{{ sub.filters.excludeKeywords.join(', ') }}
                </span>
              </div>
              <span v-else class="text-muted" style="font-size: 11px;">Aucun</span>
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
            <label class="form-label">Type de cible</label>
            <select v-model="targetType" class="form-select">
              <option value="tag">🏷️ Par Tag (ex: epic, steam, deals)</option>
              <option value="account">👤 Par Compte / Créateur (ex: PlayStation, Zerator, Dealabs)</option>
              <option value="category">📁 Par Catégorie (ex: gaming, news, tech)</option>
              <option value="keyword">🔍 Par Mot-clé (ex: 100% off, free)</option>
              <option value="feed">📡 Par Flux spécifique</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Valeur ciblée</label>
            <input
              v-model="targetValueInput"
              type="text"
              required
              class="form-input"
              :placeholder="getTargetPlaceholder()"
            />
          </div>

          <!-- Filtres personnels de l'abonné -->
          <div class="advanced-section">
            <div class="advanced-toggle" @click="showFilters = !showFilters">
              <span>{{ showFilters ? '▼' : '►' }} Filtres personnels (optionnel)</span>
            </div>

            <div v-if="showFilters" class="advanced-body">
              <div class="form-group">
                <label class="form-label">Mots-clés requis (Inclusion)</label>
                <input
                  v-model="personalIncludeInput"
                  type="text"
                  class="form-input"
                  placeholder="Ex: steam, free (séparés par virgules)"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Mots-clés interdits (Exclusion)</label>
                <input
                  v-model="personalExcludeInput"
                  type="text"
                  class="form-input"
                  placeholder="Ex: mobile, dlc, beta"
                />
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Mode de notification</label>
            <select v-model="form.notifyMode" class="form-select">
              <option value="mention">📢 Mention dans le salon du flux (&lt;@id&gt;)</option>
              <option value="dm">📩 Message Privé direct du bot (DM)</option>
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
import DiscordUser from '~/components/common/DiscordUser.vue';
import { useToast } from '~/composables/useToast.ts';

const autofeedsApi = useAutofeeds();
const { showToast } = useToast();

const subscriptions = ref<AutofeedSubscription[]>([]);
const feeds = ref<AutofeedItem[]>([]);
const loading = ref(true);
const filterType = ref('');

const showModal = ref(false);
const showFilters = ref(false);
const submitting = ref(false);

const targetType = ref<'tag' | 'category' | 'keyword' | 'account' | 'feed'>('tag');
const targetValueInput = ref('');
const personalIncludeInput = ref('');
const personalExcludeInput = ref('');

const form = ref({
  userId: '',
  notifyMode: 'mention' as 'mention' | 'dm'
});

const filteredSubs = computed(() => {
  if (!filterType.value) return subscriptions.value;
  if (filterType.value === 'account') {
    return subscriptions.value.filter(s => s.targetType === 'account' || s.targetType === 'author');
  }
  return subscriptions.value.filter(s => s.targetType === filterType.value);
});

function getTargetPlaceholder(): string {
  switch (targetType.value) {
    case 'tag': return 'Ex: epic ou steam ou gratuit';
    case 'account': return 'Ex: PlayStation, Zerator, Dealabs';
    case 'category': return 'Ex: gaming ou tech';
    case 'keyword': return 'Ex: 100% off ou free';
    case 'feed': return 'Identifiant UUID du flux';
    default: return 'Valeur à surveiller';
  }
}

function formatDate(isoDate?: number | string): string {
  if (!isoDate) return 'N/A';
  try {
    return new Date(Number(isoDate)).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(isoDate);
  }
}

function openCreateModal() {
  form.value = {
    userId: '',
    notifyMode: 'mention'
  };
  targetType.value = 'tag';
  targetValueInput.value = 'epic';
  personalIncludeInput.value = '';
  personalExcludeInput.value = '';
  showFilters.value = false;
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
    const includeKws = personalIncludeInput.value.split(',').map(s => s.trim()).filter(Boolean);
    const excludeKws = personalExcludeInput.value.split(',').map(s => s.trim()).filter(Boolean);

    const payload: any = {
      userId: form.value.userId,
      targetType: targetType.value,
      targetValue: targetValueInput.value.trim().toLowerCase(),
      notifyMode: form.value.notifyMode,
      filters: {
        includeKeywords: includeKws,
        excludeKeywords: excludeKws
      }
    };

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
.type-badge.author {
  background: rgba(235, 69, 158, 0.15);
  color: #eb459e;
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
.val-pill.author {
  color: #eb459e;
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
.filter-mini-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}
.filter-mini-tag.inc {
  background: rgba(87, 242, 135, 0.15);
  color: #57f287;
}
.filter-mini-tag.exc {
  background: rgba(237, 66, 69, 0.15);
  color: #ed4245;
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
.advanced-section {
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  background: var(--background-secondary);
}
.advanced-toggle {
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  user-select: none;
}
.advanced-toggle:hover {
  color: var(--text-normal);
}
.advanced-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid var(--border-subtle);
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
