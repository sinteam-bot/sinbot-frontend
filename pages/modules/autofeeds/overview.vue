<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Bannière de Statuts -->
    <div class="module-stats-banner">
      <div class="module-stat-card">
        <div class="module-stat-icon">📰</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Flux configurés</span>
          <span class="module-stat-value" style="color: var(--brand-experiment, #5865f2);">
            {{ activeFeedsCount }}<span style="font-size: 14px; color: var(--text-muted);"> / {{ feeds.length }}</span>
          </span>
          <span class="module-stat-sub">{{ activeFeedsCount }} flux actifs surveillés</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">🔔</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Abonnements Membres</span>
          <span class="module-stat-value" style="color: var(--status-positive, #57f287);">
            {{ subscriptions.length }}
          </span>
          <span class="module-stat-sub">utilisateurs alertés par tag / feed</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">🎁</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Catalogue Presets</span>
          <span class="module-stat-value">{{ presets.length || 8 }}</span>
          <span class="module-stat-sub">LootScraper, Reddit &amp; News</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">🌐</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Sources Supportées</span>
          <span class="module-stat-value">11</span>
          <span class="module-stat-sub">4 prêtes + 7 intégrables</span>
        </div>
      </div>
    </div>

    <!-- Bannière Hero LootScraper & Jeux Gratuits -->
    <div class="lootscraper-hero">
      <div class="hero-content">
        <div class="hero-badge">🎮 Intégration Recommandée</div>
        <h3 class="hero-title">LootScraper — Jeux Gratuits &amp; Bons Plans</h3>
        <p class="hero-desc">
          Recevez automatiquement les alertes dès qu'un jeu devient 100% gratuit sur Epic Games Store, Steam, GOG, Prime Gaming ou Itch.io grâce aux listes officielles de LootScraper. Les membres peuvent s'abonner individuellement à leurs plateformes favorites !
        </p>
        <div class="hero-actions">
          <NuxtLink to="/modules/autofeeds/presets" class="hero-btn primary">
            <span>🎁</span>
            <span>Installer un flux LootScraper en 1-Clic</span>
          </NuxtLink>
          <a
            href="https://eikowagenknecht.com/lootscraper/"
            target="_blank"
            rel="noopener noreferrer"
            class="hero-btn secondary"
          >
            <span>🔗</span>
            <span>Voir le site LootScraper</span>
          </a>
        </div>
      </div>
      <div class="hero-icon">🕹️</div>
    </div>

    <!-- Grille : Flux Récents & Guide des Commandes -->
    <div class="overview-grid">
      <!-- Liste des flux récents -->
      <div class="config-card">
        <div class="card-subtitle" style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>📋</span>
            <span>Flux Actifs sur ce Serveur</span>
          </div>
          <NuxtLink to="/modules/autofeeds/list" class="link-btn">
            Gérer tout ({{ feeds.length }}) →
          </NuxtLink>
        </div>

        <div v-if="loading" class="empty-state">
          <span>⏳ Chargement des flux...</span>
        </div>

        <div v-else-if="feeds.length === 0" class="empty-state">
          <div style="font-size: 32px; margin-bottom: 8px;">📭</div>
          <p style="margin: 0; color: var(--text-normal); font-weight: 600;">Aucun flux configuré</p>
          <p style="margin: 4px 0 16px 0; color: var(--text-muted); font-size: 13px;">
            Ajoutez votre premier flux RSS ou installez un preset LootScraper en 1-clic.
          </p>
          <NuxtLink to="/modules/autofeeds/presets" class="module-btn primary">
            <span>🎁</span> Explorer les Presets
          </NuxtLink>
        </div>

        <div v-else class="feed-list-compact">
          <div
            v-for="feed in feeds.slice(0, 5)"
            :key="feed.id"
            class="feed-row-compact"
          >
            <div class="feed-icon-badge">
              <span v-if="feed.category === 'gaming'">🎮</span>
              <span v-else-if="feed.provider === 'youtube'">📺</span>
              <span v-else-if="feed.provider === 'reddit'">🤖</span>
              <span v-else-if="feed.provider === 'google-news'">📰</span>
              <span v-else>📡</span>
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span class="feed-name-compact">{{ feed.name }}</span>
                <span v-if="feed.category" class="tag-badge category">{{ feed.category }}</span>
                <span
                  class="status-pill"
                  :class="feed.isActive ? 'status-online' : 'status-offline'"
                >
                  {{ feed.isActive ? 'Actif' : 'Inactif' }}
                </span>
              </div>
              <div style="display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap;">
                <span
                  v-for="tag in (feed.tags || []).slice(0, 3)"
                  :key="tag"
                  class="tag-badge"
                >
                  #{{ tag }}
                </span>
                <span class="channel-pill">
                  💬 &lt;#{{ feed.channelId }}&gt;
                </span>
              </div>
            </div>
            <div style="display: flex; gap: 6px;">
              <button
                class="icon-btn"
                title="Tester le flux"
                :disabled="testingId === feed.id"
                @click="handleTestFeed(feed.id)"
              >
                {{ testingId === feed.id ? '⏳' : '⚡' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Guide des Commandes Discord & Abonnements -->
      <div class="config-card">
        <div class="card-subtitle" style="display: flex; align-items: center; gap: 8px;">
          <span>🤖</span>
          <span>Commandes Slash &amp; Souscriptions Membres</span>
        </div>

        <p style="color: var(--text-muted); font-size: 13px; margin: 10px 0 16px 0;">
          Les membres du serveur peuvent souscrire individuellement à des catégories (ex: <code>gaming</code>) ou des tags (ex: <code>epic</code>, <code>steam</code>) via les boutons sous les embeds ou les commandes slash :
        </p>

        <div class="commands-table">
          <div class="command-row">
            <code>/feed list</code>
            <span>Affiche la liste de tous les flux actifs sur le serveur</span>
          </div>
          <div class="command-row">
            <code>/feed subscribe tag:epic</code>
            <span>Reçoit une alerte privée ou mention dès qu'une offre Epic sort</span>
          </div>
          <div class="command-row">
            <code>/feed presets</code>
            <span>Affiche le catalogue de flux prêts à être installés</span>
          </div>
          <div class="command-row">
            <code>/feed my-subscriptions</code>
            <span>Consulter et gérer ses alertes personnalisées</span>
          </div>
        </div>

        <div style="margin-top: 20px; padding: 12px; background: var(--background-secondary-alt); border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13px; color: var(--header-primary); margin-bottom: 6px;">
            <span>💡</span>
            <span>Boutons d'Abonnement en 1-Clic</span>
          </div>
          <p style="margin: 0; font-size: 12px; color: var(--text-muted); line-height: 1.5;">
            Chaque message posté par le bot dans Discord inclut un bouton interactif <strong>« 🔔 M'alerter pour #[tag] »</strong>. Les membres cliquent dessus pour s'abonner instantanément sans taper aucune commande !
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAutofeeds, type AutofeedItem, type AutofeedSubscription, type AutofeedPreset } from '~/composables/useAutofeeds.ts';
import { useToast } from '~/composables/useToast.ts';

const autofeedsApi = useAutofeeds();
const { showToast } = useToast();

const feeds = ref<AutofeedItem[]>([]);
const subscriptions = ref<AutofeedSubscription[]>([]);
const presets = ref<AutofeedPreset[]>([]);
const loading = ref(true);
const testingId = ref<string | null>(null);

const activeFeedsCount = computed(() => feeds.value.filter(f => f.isActive).length);

async function loadData() {
  loading.value = true;
  try {
    const [fetchedFeeds, fetchedSubs, fetchedPresets] = await Promise.all([
      autofeedsApi.fetchFeeds(),
      autofeedsApi.fetchSubscriptions(),
      autofeedsApi.fetchPresets()
    ]);
    feeds.value = fetchedFeeds || [];
    subscriptions.value = fetchedSubs || [];
    presets.value = fetchedPresets || [];
  } catch (err: any) {
    showToast(`Erreur chargement des flux: ${err.message}`, 'error');
  } finally {
    loading.value = false;
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

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.module-stats-banner {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}
.module-stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--background-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
}
.module-stat-icon {
  font-size: 26px;
  padding: 10px;
  border-radius: 8px;
  background: var(--background-secondary-alt);
  display: flex;
  align-items: center;
  justify-content: center;
}
.module-stat-info {
  display: flex;
  flex-direction: column;
}
.module-stat-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.module-stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--header-primary);
  margin: 2px 0;
}
.module-stat-sub {
  font-size: 12px;
  color: var(--text-muted);
}
.lootscraper-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.15) 0%, rgba(235, 69, 158, 0.12) 100%);
  border: 1px solid rgba(88, 101, 242, 0.3);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}
.hero-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  background: var(--brand-experiment, #5865f2);
  color: white;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.hero-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--header-primary);
}
.hero-desc {
  margin: 0 0 16px 0;
  font-size: 13px;
  color: var(--text-normal);
  line-height: 1.5;
  max-width: 780px;
}
.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}
.hero-btn.primary {
  background: var(--brand-experiment, #5865f2);
  color: white;
}
.hero-btn.primary:hover {
  filter: brightness(1.1);
}
.hero-btn.secondary {
  background: var(--background-modifier-hover);
  color: var(--text-normal);
  border: 1px solid var(--border-subtle);
}
.hero-btn.secondary:hover {
  background: var(--background-modifier-selected);
}
.hero-icon {
  font-size: 72px;
  opacity: 0.8;
  user-select: none;
}
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 20px;
}
.config-card {
  background: var(--background-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 20px;
}
.card-subtitle {
  font-size: 15px;
  font-weight: 700;
  color: var(--header-primary);
}
.link-btn {
  font-size: 12px;
  color: var(--brand-experiment, #5865f2);
  text-decoration: none;
  font-weight: 600;
}
.link-btn:hover {
  text-decoration: underline;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 16px;
  text-align: center;
}
.feed-list-compact {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}
.feed-row-compact {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--background-secondary-alt);
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
}
.feed-icon-badge {
  font-size: 20px;
}
.feed-name-compact {
  font-weight: 600;
  font-size: 14px;
  color: var(--header-primary);
}
.tag-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--background-modifier-selected);
  color: var(--text-muted);
}
.tag-badge.category {
  background: rgba(88, 101, 242, 0.2);
  color: var(--brand-experiment, #5865f2);
  font-weight: 600;
}
.channel-pill {
  font-size: 11px;
  color: var(--text-muted);
  font-family: monospace;
}
.status-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 8px;
  text-transform: uppercase;
}
.status-online {
  background: rgba(87, 242, 135, 0.15);
  color: #57f287;
}
.status-offline {
  background: rgba(237, 66, 69, 0.15);
  color: #ed4245;
}
.icon-btn {
  background: var(--background-modifier-hover);
  border: 1px solid var(--border-subtle);
  color: var(--text-normal);
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.icon-btn:hover {
  background: var(--background-modifier-selected);
}
.commands-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.command-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  background: var(--background-secondary-alt);
  border-radius: 6px;
  font-size: 13px;
}
.command-row code {
  background: var(--background-tertiary);
  color: #57f287;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
}
.command-row span {
  color: var(--text-muted);
}
</style>
