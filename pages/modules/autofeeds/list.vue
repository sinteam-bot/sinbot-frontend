<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- En-tête de section avec bouton d'ajout -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
      <div>
        <h3 style="margin: 0; font-size: 18px; color: var(--header-primary); font-weight: 700;">
          Flux Enregistrés ({{ feeds.length }})
        </h3>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-muted);">
          Gérez vos flux actifs, configurez les filtres d'inclusion/exclusion et surveillez leur état de santé.
        </p>
      </div>

      <div style="display: flex; gap: 8px;">
        <button class="module-btn" :disabled="loading" @click="loadData">
          <span>🔄</span>
          <span>Actualiser</span>
        </button>
        <button class="module-btn primary" @click="openCreateModal">
          <span>➕</span>
          <span>Ajouter un Flux</span>
        </button>
      </div>
    </div>

    <!-- Filtres rapides par catégorie -->
    <div class="category-filter-bar">
      <button
        class="filter-pill"
        :class="{ active: selectedCategory === '' }"
        @click="selectedCategory = ''"
      >
        Tous les flux ({{ feeds.length }})
      </button>
      <button
        v-for="cat in availableCategories"
        :key="cat"
        class="filter-pill"
        :class="{ active: selectedCategory === cat }"
        @click="selectedCategory = cat"
      >
        {{ getCategoryLabel(cat) }} ({{ feeds.filter(f => f.category === cat).length }})
      </button>
    </div>

    <!-- État vide -->
    <div v-if="filteredFeeds.length === 0 && !loading" class="config-card empty-card">
      <div style="font-size: 36px; margin-bottom: 8px;">📡</div>
      <h4 style="margin: 0 0 4px 0; font-size: 16px; color: var(--header-primary);">Aucun flux trouvé</h4>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: var(--text-muted);">
        {{ selectedCategory ? 'Aucun flux dans cette catégorie.' : 'Configurez votre premier flux RSS ou installez un preset LootScraper.' }}
      </p>
      <div style="display: flex; gap: 10px;">
        <button class="module-btn primary" @click="openCreateModal">
          <span>➕</span> Ajouter un flux manuellement
        </button>
        <NuxtLink to="/modules/autofeeds/presets" class="module-btn secondary">
          <span>🎁</span> Catalogue Presets
        </NuxtLink>
      </div>
    </div>

    <!-- Grille des flux -->
    <div v-else class="feeds-grid">
      <div
        v-for="feed in filteredFeeds"
        :key="feed.id"
        class="feed-card"
        :class="{ 'feed-disabled': !feed.isActive }"
      >
        <div class="feed-card-header">
          <div class="feed-icon-wrap">
            <span v-if="feed.provider === 'youtube'">📺</span>
            <span v-else-if="feed.provider === 'reddit'">🤖</span>
            <span v-else-if="feed.provider === 'google_news'">📰</span>
            <span v-else-if="feed.provider === 'twitch'">🟣</span>
            <span v-else-if="feed.provider === 'kick'">🟢</span>
            <span v-else-if="feed.provider === 'twitter'">✖️</span>
            <span v-else-if="feed.provider === 'tiktok'">🎵</span>
            <span v-else-if="feed.provider === 'instagram'">📸</span>
            <span v-else-if="feed.provider === 'facebook'">👥</span>
            <span v-else-if="feed.provider === 'linkedin'">💼</span>
            <span v-else-if="feed.category === 'gaming'">🎮</span>
            <span v-else>📡</span>
          </div>

          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <h4 class="feed-title" :title="feed.name">{{ feed.name }}</h4>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span class="provider-pill">{{ feed.provider || 'rss' }}</span>
                <!-- Badge de santé du flux -->
                <span
                  v-if="feed.lastStatus === 'error'"
                  class="health-badge error"
                  :title="feed.lastError || 'Erreur lors de la dernière vérification'"
                >
                  ⚠️ Erreur
                </span>
                <span
                  v-else-if="feed.lastCheckedAt"
                  class="health-badge ok"
                  :title="`Vérifié avec succès (${feed.checkIntervalMinutes} min)`"
                >
                  🟢 OK
                </span>
              </div>
            </div>
            <p class="feed-url" :title="feed.url">{{ feed.url }}</p>
          </div>
        </div>

        <div class="feed-meta-row">
          <div class="meta-item">
            <span class="meta-icon">💬</span>
            <DiscordChannel :channel-id="feed.channelId" />
          </div>
          <div class="meta-item">
            <span class="meta-icon">⏱️</span>
            <span class="meta-text">{{ feed.checkIntervalMinutes }} min</span>
          </div>
          <div v-if="feed.category" class="meta-item">
            <span class="tag-badge category">{{ feed.category }}</span>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="feed.tags && feed.tags.length > 0" class="tags-row">
          <span v-for="tag in feed.tags" :key="tag" class="tag-badge">
            #{{ tag }}
          </span>
        </div>

        <!-- Filtres actifs -->
        <div v-if="hasFilters(feed)" class="filters-summary">
          <div v-if="feed.filterKeywords?.length" class="filter-badge inc">
            ✓ Inc: {{ feed.filterKeywords.join(', ') }}
          </div>
          <div v-if="feed.excludeKeywords?.length" class="filter-badge exc">
            ✗ Exc: {{ feed.excludeKeywords.join(', ') }}
          </div>
        </div>

        <!-- Message d'erreur détaillé si présent -->
        <div v-if="feed.lastStatus === 'error' && feed.lastError" class="error-notice">
          <span>⚠️ {{ feed.lastError.slice(0, 100) }}</span>
        </div>

        <!-- Pied de carte : Actions -->
        <div class="feed-card-footer">
          <div style="display: flex; align-items: center; gap: 8px;">
            <label class="toggle-switch">
              <input
                type="checkbox"
                :checked="feed.isActive"
                @change="handleToggleActive(feed)"
              />
              <span class="slider"></span>
            </label>
            <span class="toggle-label">{{ feed.isActive ? 'Actif' : 'En pause' }}</span>
          </div>

          <div style="display: flex; gap: 6px;">
            <button
              class="module-btn icon-only"
              title="Modifier la configuration du flux"
              @click="openEditModal(feed)"
            >
              <span>✏️</span>
            </button>
            <button
              class="module-btn icon-only"
              title="Tester immédiatement l'envoi Discord"
              :disabled="testingId === feed.id"
              @click="handleTestFeed(feed.id)"
            >
              <span>{{ testingId === feed.id ? '⏳' : '⚡' }}</span>
            </button>
            <button
              class="module-btn icon-only danger"
              title="Supprimer ce flux"
              @click="handleDeleteFeed(feed)"
            >
              <span>🗑️</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal d'ajout de flux -->
    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3 style="margin: 0; font-size: 18px; color: var(--header-primary);">➕ Ajouter un nouveau flux</h3>
          <button class="close-btn" @click="showModal = false">✕</button>
        </div>

        <form class="modal-form" @submit.prevent="handleCreateFeed">
          <div class="form-group">
            <label class="form-label">URL ou Cible (RSS, YouTube, Twitch, Kick, Twitter, Reddit...)</label>
            <input
              v-model="form.url"
              type="text"
              required
              class="form-input"
              placeholder="https://... ou r/GameDeals ou twitch.tv/... ou @PlayStation"
              @blur="autoGuessName"
            />
            <span class="form-hint">Le connecteur sera automatiquement détecté (YouTube, Twitch, Kick, X, Reddit, etc.).</span>
          </div>

          <div class="form-group">
            <label class="form-label">Nom d'affichage</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="form-input"
              placeholder="Ex: LootScraper Epic Games, Stream Zerator..."
            />
          </div>

          <div class="form-group">
            <label class="form-label">Salon Discord cible</label>
            <DiscordChannelSelect
              v-model="form.channelId"
              placeholder="Sélectionner le salon Discord"
            />
          </div>

          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label class="form-label">Catégorie</label>
              <select v-model="form.category" class="form-select">
                <option value="gaming">🎮 Gaming / Deals</option>
                <option value="news">📰 Actualités</option>
                <option value="tech">💻 High-Tech</option>
                <option value="deals">🛍️ Bons Plans</option>
                <option value="social">📱 Réseaux Sociaux</option>
                <option value="community">👥 Communauté</option>
                <option value="general">🌐 Général</option>
              </select>
            </div>

            <div class="form-group" style="flex: 1;">
              <label class="form-label">Intervalle (minutes)</label>
              <input
                v-model.number="form.checkIntervalMinutes"
                type="number"
                min="2"
                max="1440"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Tags associés (séparés par des virgules)</label>
            <input
              v-model="tagsInput"
              type="text"
              class="form-input"
              placeholder="Ex: epic, gratuit, pc, steam"
            />
            <span class="form-hint">Les membres pourront s'abonner individuellement à ces tags pour être alertés !</span>
          </div>

          <!-- Filtres avancés -->
          <div class="advanced-section">
            <div class="advanced-toggle" @click="showAdvanced = !showAdvanced">
              <span>{{ showAdvanced ? '▼' : '►' }} Options avancées &amp; Filtres par mots-clés</span>
            </div>

            <div v-if="showAdvanced" class="advanced-body">
              <div class="form-group">
                <label class="form-label">Mots-clés requis (Inclusion)</label>
                <input
                  v-model="includeKeywordsInput"
                  type="text"
                  class="form-input"
                  placeholder="Ex: 100% off, free, gratuit (séparés par virgules)"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Mots-clés interdits (Exclusion)</label>
                <input
                  v-model="excludeKeywordsInput"
                  type="text"
                  class="form-input"
                  placeholder="Ex: dlc, beta, expired"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Filtre Regex</label>
                <input
                  v-model="form.regexFilter"
                  type="text"
                  class="form-input"
                  placeholder="Ex: (free|gratuit)[\s\S]*?(steam|epic)"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Couleur de l'Embed (Hex)</label>
                <input
                  v-model="form.embedColor"
                  type="text"
                  class="form-input"
                  placeholder="#5865F2"
                />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="module-btn" @click="showModal = false">
              Annuler
            </button>
            <button type="submit" class="module-btn primary" :disabled="submitting">
              <span>{{ submitting ? '⏳ Création...' : '✅ Enregistrer le flux' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal d'édition de flux existant -->
    <div v-if="showEditModal && editingFeed" class="modal-backdrop" @click.self="showEditModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3 style="margin: 0; font-size: 18px; color: var(--header-primary);">✏️ Modifier le flux « {{ editingFeed.name }} »</h3>
          <button class="close-btn" @click="showEditModal = false">✕</button>
        </div>

        <form class="modal-form" @submit.prevent="handleUpdateFeed">
          <div class="form-group">
            <label class="form-label">Nom d'affichage</label>
            <input
              v-model="editForm.name"
              type="text"
              required
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Salon Discord cible</label>
            <DiscordChannelSelect
              v-model="editForm.channelId"
              placeholder="Sélectionner le salon Discord"
            />
          </div>

          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label class="form-label">Catégorie</label>
              <select v-model="editForm.category" class="form-select">
                <option value="gaming">🎮 Gaming / Deals</option>
                <option value="news">📰 Actualités</option>
                <option value="tech">💻 High-Tech</option>
                <option value="deals">🛍️ Bons Plans</option>
                <option value="social">📱 Réseaux Sociaux</option>
                <option value="community">👥 Communauté</option>
                <option value="general">🌐 Général</option>
              </select>
            </div>

            <div class="form-group" style="flex: 1;">
              <label class="form-label">Intervalle (minutes)</label>
              <input
                v-model.number="editForm.checkIntervalMinutes"
                type="number"
                min="2"
                max="1440"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Tags associés (séparés par virgules)</label>
            <input
              v-model="editTagsInput"
              type="text"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Mots-clés requis (Inclusion)</label>
            <input
              v-model="editIncludeInput"
              type="text"
              class="form-input"
              placeholder="Séparés par des virgules"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Mots-clés interdits (Exclusion)</label>
            <input
              v-model="editExcludeInput"
              type="text"
              class="form-input"
              placeholder="Séparés par des virgules"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Couleur de l'Embed (Hex)</label>
            <input
              v-model="editForm.embedColor"
              type="text"
              class="form-input"
            />
          </div>

          <div class="modal-footer">
            <button type="button" class="module-btn" @click="showEditModal = false">
              Annuler
            </button>
            <button type="submit" class="module-btn primary" :disabled="submitting">
              <span>{{ submitting ? '⏳ Enregistrement...' : '💾 Sauvegarder' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAutofeeds, type AutofeedItem, type CreateAutofeedPayload } from '~/composables/useAutofeeds.ts';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';
import DiscordChannel from '~/components/common/DiscordChannel.vue';
import { useToast } from '~/composables/useToast.ts';

const autofeedsApi = useAutofeeds();
const { showToast } = useToast();

const feeds = ref<AutofeedItem[]>([]);
const loading = ref(true);
const testingId = ref<string | null>(null);
const selectedCategory = ref('');

const showModal = ref(false);
const showEditModal = ref(false);
const showAdvanced = ref(false);
const submitting = ref(false);

const tagsInput = ref('');
const includeKeywordsInput = ref('');
const excludeKeywordsInput = ref('');

const editingFeed = ref<AutofeedItem | null>(null);
const editTagsInput = ref('');
const editIncludeInput = ref('');
const editExcludeInput = ref('');

const form = ref<CreateAutofeedPayload>({
  url: '',
  name: '',
  channelId: '',
  category: 'gaming',
  checkIntervalMinutes: 15,
  isActive: true,
  tags: [],
  filterKeywords: [],
  excludeKeywords: [],
  regexFilter: '',
  embedColor: '#5865F2'
});

const editForm = ref({
  name: '',
  channelId: '',
  category: 'gaming',
  checkIntervalMinutes: 15,
  embedColor: '#5865F2'
});

const availableCategories = computed(() => {
  const set = new Set<string>();
  feeds.value.forEach(f => {
    if (f.category) set.add(f.category);
  });
  return Array.from(set);
});

const filteredFeeds = computed(() => {
  if (!selectedCategory.value) return feeds.value;
  return feeds.value.filter(f => f.category === selectedCategory.value);
});

function getCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    gaming: '🎮 Gaming',
    news: '📰 Actualités',
    tech: '💻 Tech',
    deals: '🛍️ Bons Plans',
    social: '📱 Social',
    community: '👥 Communauté'
  };
  return map[cat] || cat;
}

function hasFilters(feed: AutofeedItem): boolean {
  return Boolean(
    (feed.filterKeywords && feed.filterKeywords.length > 0) ||
    (feed.excludeKeywords && feed.excludeKeywords.length > 0) ||
    feed.regexFilter
  );
}

function autoGuessName() {
  if (form.value.name) return;
  const url = form.value.url.toLowerCase();
  if (url.includes('lootscraper')) form.value.name = 'LootScraper Deals';
  else if (url.includes('reddit.com/r/')) {
    const match = form.value.url.match(/r\/([a-zA-Z0-9_]+)/);
    if (match) form.value.name = `Reddit r/${match[1]}`;
  } else if (url.includes('youtube.com')) form.value.name = 'Vidéos YouTube';
  else if (url.includes('twitch.tv')) form.value.name = 'Twitch Stream';
  else if (url.includes('kick.com')) form.value.name = 'Kick Live';
  else if (url.includes('news.google.com')) form.value.name = 'Google News';
}

function openCreateModal() {
  form.value = {
    url: '',
    name: '',
    channelId: '',
    category: 'gaming',
    checkIntervalMinutes: 15,
    isActive: true,
    tags: [],
    filterKeywords: [],
    excludeKeywords: [],
    regexFilter: '',
    embedColor: '#5865F2'
  };
  tagsInput.value = '';
  includeKeywordsInput.value = '';
  excludeKeywordsInput.value = '';
  showAdvanced.value = false;
  showModal.value = true;
}

function openEditModal(feed: AutofeedItem) {
  editingFeed.value = feed;
  editForm.value = {
    name: feed.name || '',
    channelId: feed.channelId,
    category: feed.category || 'gaming',
    checkIntervalMinutes: feed.checkIntervalMinutes || 15,
    embedColor: feed.color || '#5865F2'
  };
  editTagsInput.value = (feed.tags || []).join(', ');
  editIncludeInput.value = (feed.filterKeywords || []).join(', ');
  editExcludeInput.value = (feed.excludeKeywords || []).join(', ');
  showEditModal.value = true;
}

async function loadData() {
  loading.value = true;
  try {
    feeds.value = await autofeedsApi.fetchFeeds();
  } catch (err: any) {
    showToast(`Erreur chargement des flux: ${err.message}`, 'error');
  } finally {
    loading.value = false;
  }
}

async function handleToggleActive(feed: AutofeedItem) {
  try {
    const updated = await autofeedsApi.updateFeed(feed.id, { isActive: !feed.isActive });
    feed.isActive = updated.isActive;
    showToast(`Flux ${feed.name} ${feed.isActive ? 'activé' : 'mis en pause'}.`, 'info');
  } catch (err: any) {
    showToast(`Impossible de modifier le statut : ${err.message}`, 'error');
  }
}

async function handleTestFeed(feedId: string) {
  testingId.value = feedId;
  try {
    const res = await autofeedsApi.testFeed(feedId);
    showToast(`Test réussi : ${res.itemCount} article(s) trouvé(s) ! Message envoyé dans Discord.`, 'success');
  } catch (err: any) {
    showToast(`Échec du test : ${err.message}`, 'error');
  } finally {
    testingId.value = null;
  }
}

async function handleDeleteFeed(feed: AutofeedItem) {
  if (!confirm(`Supprimer définitivement le flux « ${feed.name} » ?`)) return;
  try {
    await autofeedsApi.deleteFeed(feed.id);
    feeds.value = feeds.value.filter(f => f.id !== feed.id);
    showToast(`Flux « ${feed.name} » supprimé.`, 'success');
  } catch (err: any) {
    showToast(`Erreur de suppression : ${err.message}`, 'error');
  }
}

async function handleCreateFeed() {
  if (!form.value.channelId) {
    showToast('Veuillez sélectionner un salon Discord cible.', 'warning');
    return;
  }

  submitting.value = true;
  try {
    form.value.tags = tagsInput.value
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    form.value.filterKeywords = includeKeywordsInput.value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    form.value.excludeKeywords = excludeKeywordsInput.value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const created = await autofeedsApi.createFeed(form.value);
    feeds.value.unshift(created);
    showToast(`Flux « ${created.name} » créé avec succès !`, 'success');
    showModal.value = false;
  } catch (err: any) {
    showToast(`Erreur création de flux : ${err.message}`, 'error');
  } finally {
    submitting.value = false;
  }
}

async function handleUpdateFeed() {
  if (!editingFeed.value) return;

  submitting.value = true;
  try {
    const parsedTags = editTagsInput.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const parsedInclude = editIncludeInput.value.split(',').map(s => s.trim()).filter(Boolean);
    const parsedExclude = editExcludeInput.value.split(',').map(s => s.trim()).filter(Boolean);

    const updated = await autofeedsApi.updateFeed(editingFeed.value.id, {
      name: editForm.value.name,
      channelId: editForm.value.channelId,
      category: editForm.value.category,
      checkIntervalMinutes: editForm.value.checkIntervalMinutes,
      color: editForm.value.embedColor,
      tags: parsedTags,
      filterKeywords: parsedInclude,
      excludeKeywords: parsedExclude
    });

    const idx = feeds.value.findIndex(f => f.id === updated.id);
    if (idx !== -1) {
      feeds.value[idx] = updated;
    }

    showToast(`Flux « ${updated.name} » mis à jour !`, 'success');
    showEditModal.value = false;
  } catch (err: any) {
    showToast(`Erreur mise à jour : ${err.message}`, 'error');
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
.feeds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}
.feed-card {
  background: var(--background-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.15s, opacity 0.15s;
}
.feed-card:hover {
  border-color: var(--border-medium);
}
.feed-card.feed-disabled {
  opacity: 0.65;
  border-style: dashed;
}
.feed-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.feed-icon-wrap {
  font-size: 24px;
  padding: 8px;
  background: var(--background-secondary-alt);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.feed-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--header-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.feed-url {
  margin: 3px 0 0 0;
  font-size: 11px;
  color: var(--text-muted);
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.provider-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--background-secondary-alt);
  color: var(--text-muted);
  text-transform: uppercase;
}
.health-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}
.health-badge.ok {
  background: rgba(87, 242, 135, 0.15);
  color: #57f287;
}
.health-badge.error {
  background: rgba(237, 66, 69, 0.2);
  color: #ed4245;
  border: 1px solid rgba(237, 66, 69, 0.4);
}
.error-notice {
  font-size: 11px;
  color: #ed4245;
  background: rgba(237, 66, 69, 0.1);
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid rgba(237, 66, 69, 0.2);
}
.feed-meta-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--text-muted);
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.tags-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.tag-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--background-secondary-alt);
  color: var(--text-normal);
}
.tag-badge.category {
  background: rgba(88, 101, 242, 0.2);
  color: var(--brand-experiment, #5865f2);
  font-weight: 600;
}
.filters-summary {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.filter-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}
.filter-badge.inc {
  background: rgba(87, 242, 135, 0.15);
  color: #57f287;
}
.filter-badge.exc {
  background: rgba(237, 66, 69, 0.15);
  color: #ed4245;
}
.feed-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 34px;
  height: 20px;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--background-tertiary);
  transition: 0.2s;
  border-radius: 20px;
}
.slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}
input:checked + .slider {
  background-color: var(--status-positive, #57f287);
}
input:checked + .slider:before {
  transform: translateX(14px);
}
.toggle-label {
  font-size: 12px;
  color: var(--text-muted);
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
}
.module-btn.primary {
  background: var(--brand-experiment, #5865f2);
  color: white;
  border-color: transparent;
}
.module-btn.icon-only {
  padding: 6px 10px;
}
.module-btn.icon-only.danger:hover {
  background: rgba(237, 66, 69, 0.2);
  color: #ed4245;
  border-color: rgba(237, 66, 69, 0.3);
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
  max-width: 580px;
  max-height: 90vh;
  overflow-y: auto;
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
.close-btn:hover {
  color: var(--text-normal);
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
.form-input:focus, .form-select:focus {
  border-color: var(--brand-experiment, #5865f2);
  outline: none;
}
.form-hint {
  font-size: 11px;
  color: var(--text-muted);
}
.form-row {
  display: flex;
  gap: 12px;
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
</style>
