<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- En-tête du catalogue -->
    <div>
      <h3 style="margin: 0; font-size: 18px; color: var(--header-primary); font-weight: 700;">
        🎁 Catalogue &amp; Presets Prêts à l'Emploi
      </h3>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-muted);">
        Installez en un clic les flux officiels de <a href="https://eikowagenknecht.com/lootscraper/" target="_blank" rel="noopener noreferrer" style="color: var(--brand-experiment, #5865f2); text-decoration: underline;">LootScraper</a>, Reddit et Google News avec tags et filtres pré-configurés.
      </p>
    </div>

    <!-- Filtres par catégorie de preset -->
    <div class="category-filter-bar">
      <button
        class="filter-pill"
        :class="{ active: selectedCategory === '' }"
        @click="selectedCategory = ''"
      >
        Tous les presets ({{ presets.length }})
      </button>
      <button
        class="filter-pill"
        :class="{ active: selectedCategory === 'gaming' }"
        @click="selectedCategory = 'gaming'"
      >
        🎮 LootScraper &amp; Jeux ({{ presets.filter(p => p.category === 'gaming').length }})
      </button>
      <button
        class="filter-pill"
        :class="{ active: selectedCategory === 'news' }"
        @click="selectedCategory = 'news'"
      >
        📰 Actualités &amp; Tech ({{ presets.filter(p => p.category === 'news').length }})
      </button>
    </div>

    <div v-if="loading" class="config-card" style="text-align: center; padding: 36px;">
      <span>⏳ Chargement du catalogue...</span>
    </div>

    <!-- Grille des Presets -->
    <div v-else class="presets-grid">
      <div
        v-for="preset in filteredPresets"
        :key="preset.id"
        class="preset-card"
        :class="{ 'featured-card': preset.id.startsWith('lootscraper') }"
      >
        <div class="preset-header">
          <div class="preset-icon-wrap">
            <span v-if="preset.id === 'lootscraper-epic'">⚡</span>
            <span v-else-if="preset.id === 'lootscraper-steam'">🎮</span>
            <span v-else-if="preset.id === 'lootscraper-gog'">🕹️</span>
            <span v-else-if="preset.id === 'lootscraper-prime'">👑</span>
            <span v-else-if="preset.id === 'lootscraper-itch'">👾</span>
            <span v-else-if="preset.provider === 'reddit'">🤖</span>
            <span v-else-if="preset.provider === 'google-news'">📰</span>
            <span v-else>🎁</span>
          </div>

          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <h4 class="preset-title">{{ preset.name }}</h4>
              <span class="provider-badge">{{ preset.provider }}</span>
            </div>
            <span class="category-badge">{{ preset.category }}</span>
          </div>
        </div>

        <p class="preset-description">
          {{ preset.description }}
        </p>

        <!-- Tags préconfigurés -->
        <div class="preset-tags">
          <span class="tags-label">Tags membres :</span>
          <div class="tags-container">
            <span v-for="tag in preset.tags" :key="tag" class="tag-pill">
              #{{ tag }}
            </span>
          </div>
        </div>

        <!-- Mots-clés filtrés -->
        <div v-if="preset.filterKeywords?.length" class="keywords-row">
          <span class="kw-label">Filtres inclus :</span>
          <span class="kw-value">{{ preset.filterKeywords.join(', ') }}</span>
        </div>

        <div class="preset-footer">
          <span class="interval-hint">⏱️ Toutes les {{ preset.checkIntervalMinutes }} min</span>
          <button class="install-btn" @click="openInstallModal(preset)">
            <span>➕</span>
            <span>Installer en 1-Clic</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal d'installation en 1-clic -->
    <div v-if="showInstallModal && selectedPreset" class="modal-backdrop" @click.self="showInstallModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3 style="margin: 0; font-size: 17px; color: var(--header-primary); display: flex; align-items: center; gap: 8px;">
            <span>🎁</span>
            <span>Installer « {{ selectedPreset.name }} »</span>
          </h3>
          <button class="close-btn" @click="showInstallModal = false">✕</button>
        </div>

        <div class="modal-body">
          <p style="margin: 0 0 16px 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">
            Choisissez le salon Discord dans lequel vous souhaitez diffuser automatiquement les annonces de ce flux.
          </p>

          <div class="form-group">
            <label class="form-label">Salon Discord de diffusion</label>
            <DiscordChannelSelect
              v-model="installChannelId"
              placeholder="Sélectionner le salon Discord"
            />
          </div>

          <div class="preset-summary-box">
            <div class="summary-line">
              <span class="line-label">Source :</span>
              <span class="line-val font-mono">{{ selectedPreset.url }}</span>
            </div>
            <div class="summary-line">
              <span class="line-label">Tags pré-définis :</span>
              <span class="line-val">
                <span v-for="t in selectedPreset.tags" :key="t" class="tag-pill" style="margin-right: 4px;">#{{ t }}</span>
              </span>
            </div>
            <div class="summary-line">
              <span class="line-label">Bouton interactif :</span>
              <span class="line-val" style="color: #57f287;">✓ Ajouté automatiquement pour les membres</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="module-btn" @click="showInstallModal = false">
            Annuler
          </button>
          <button class="module-btn primary" :disabled="installing" @click="handleInstallPreset">
            <span>{{ installing ? '⏳ Installation...' : '🚀 Confirmer et Activer' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAutofeeds, type AutofeedPreset } from '~/composables/useAutofeeds.ts';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';
import { useToast } from '~/composables/useToast.ts';

const autofeedsApi = useAutofeeds();
const { showToast } = useToast();

const presets = ref<AutofeedPreset[]>([]);
const loading = ref(true);
const selectedCategory = ref('');

const showInstallModal = ref(false);
const selectedPreset = ref<AutofeedPreset | null>(null);
const installChannelId = ref('');
const installing = ref(false);

const filteredPresets = computed(() => {
  if (!selectedCategory.value) return presets.value;
  return presets.value.filter(p => p.category === selectedCategory.value);
});

async function loadPresets() {
  loading.value = true;
  try {
    presets.value = await autofeedsApi.fetchPresets();
  } catch (err: any) {
    showToast(`Erreur chargement des presets: ${err.message}`, 'error');
  } finally {
    loading.value = false;
  }
}

function openInstallModal(preset: AutofeedPreset) {
  selectedPreset.value = preset;
  installChannelId.value = '';
  showInstallModal.value = true;
}

async function handleInstallPreset() {
  if (!selectedPreset.value) return;
  if (!installChannelId.value) {
    showToast('Veuillez sélectionner un salon Discord cible.', 'warning');
    return;
  }

  installing.value = true;
  try {
    const installed = await autofeedsApi.installPreset({
      presetId: selectedPreset.value.id,
      channelId: installChannelId.value
    });
    showToast(`Preset « ${installed.name} » installé avec succès dans Discord !`, 'success');
    showInstallModal.value = false;
  } catch (err: any) {
    showToast(`Erreur d'installation : ${err.message}`, 'error');
  } finally {
    installing.value = false;
  }
}

onMounted(() => {
  loadPresets();
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
.presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}
.preset-card {
  background: var(--background-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.15s, border-color 0.15s;
}
.preset-card:hover {
  border-color: var(--border-medium);
  transform: translateY(-2px);
}
.preset-card.featured-card {
  background: linear-gradient(180deg, var(--background-secondary) 0%, rgba(88, 101, 242, 0.05) 100%);
  border-color: rgba(88, 101, 242, 0.35);
}
.preset-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.preset-icon-wrap {
  font-size: 26px;
  padding: 8px;
  background: var(--background-secondary-alt);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preset-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--header-primary);
}
.provider-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--background-secondary-alt);
  color: var(--text-muted);
  text-transform: uppercase;
}
.category-badge {
  font-size: 11px;
  color: var(--brand-experiment, #5865f2);
  font-weight: 600;
}
.preset-description {
  margin: 0;
  font-size: 13px;
  color: var(--text-normal);
  line-height: 1.4;
}
.preset-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.tags-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
}
.tags-container {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.tag-pill {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--background-secondary-alt);
  color: var(--text-muted);
}
.keywords-row {
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  gap: 6px;
}
.kw-label {
  font-weight: 600;
}
.kw-value {
  color: #57f287;
}
.preset-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}
.interval-hint {
  font-size: 11px;
  color: var(--text-muted);
}
.install-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  background: var(--brand-experiment, #5865f2);
  color: white;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s;
}
.install-btn:hover {
  filter: brightness(1.1);
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
.close-btn:hover {
  color: var(--text-normal);
}
.modal-body {
  padding: 20px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}
.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}
.preset-summary-box {
  background: var(--background-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
}
.summary-line {
  display: flex;
  align-items: center;
  gap: 8px;
}
.line-label {
  color: var(--text-muted);
  font-weight: 600;
  min-width: 120px;
}
.line-val {
  color: var(--text-normal);
}
.font-mono {
  font-family: monospace;
  font-size: 11px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-subtle);
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
.module-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
