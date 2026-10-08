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
            {{ stats.totalSubscriptions || subscriptions.length }}
          </span>
          <span class="module-stat-sub">utilisateurs alertés par tag / feed</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">🎁</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Drop Hunter (Claims)</span>
          <span class="module-stat-value" style="color: #f4b400;">
            {{ stats.totalClaims || 0 }}
          </span>
          <span class="module-stat-sub">{{ stats.totalXpAwarded || 0 }} XP distribué aux membres</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">📊</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Publications Diffusées</span>
          <span class="module-stat-value" style="color: #00b0f4;">
            {{ stats.totalPosts || 0 }}
          </span>
          <span class="module-stat-sub">{{ stats.totalClicks || 0 }} clics enregistrés</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">🌐</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Fournisseurs Actifs</span>
          <span class="module-stat-value">17</span>
          <span class="module-stat-sub">Steam, GitHub, GitLab, Status, RSS...</span>
        </div>
      </div>
    </div>

    <!-- Section Recherche Plein Texte & Analytics -->
    <div class="config-card">
      <div class="card-subtitle" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>🔍</span>
          <span>Recherche d'Articles &amp; Offres Historiques</span>
        </div>
        <span style="font-size: 12px; color: var(--text-muted);">Recherche plein texte dans tous les articles indexés</span>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap;">
        <input
          v-model="searchQuery"
          type="text"
          class="form-input"
          style="flex: 1; min-width: 200px;"
          placeholder="Rechercher un mot-clé, une offre, un jeu (ex: GTA, Cyberpunk, free, epic)..."
          @keyup.enter="handleSearch"
        />
        <button class="module-btn primary" :disabled="searching" @click="handleSearch">
          <span>{{ searching ? '⏳ Recherche...' : '🔍 Rechercher' }}</span>
        </button>
      </div>

      <!-- Résultats de recherche -->
      <div v-if="searchResults.length > 0" style="margin-top: 14px; display: flex; flex-direction: column; gap: 8px;">
        <div
          v-for="item in searchResults"
          :key="item.id"
          style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--background-secondary-alt); border-radius: 8px; border: 1px solid var(--border-subtle); flex-wrap: wrap; gap: 8px;"
        >
          <div style="flex: 1; min-width: 200px;">
            <a :href="item.url || '#'" target="_blank" rel="noopener noreferrer" style="font-weight: 600; color: var(--header-primary); text-decoration: none; font-size: 14px;">
              {{ item.title }} ↗
            </a>
            <div style="font-size: 12px; color: var(--text-muted); display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap; align-items: center;">
              <span>Source : {{ item.feedName }}</span>
              <span v-for="t in item.tags" :key="t" class="tag-badge">#{{ t.replace(/^#/, '') }}</span>
            </div>
          </div>
          <span v-if="item.clicksCount > 0" style="font-size: 12px; color: var(--text-muted);">
            👁️ {{ item.clicksCount }} clic(s)
          </span>
        </div>
      </div>
      <div v-else-if="searched && !searching" style="margin-top: 12px; font-size: 13px; color: var(--text-muted); text-align: center; padding: 12px;">
        Aucun article trouvé pour cette recherche.
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
                  💬 <DiscordChannel :channel-id="feed.channelId" />
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
            <code>/feed search &lt;query&gt;</code>
            <span>Recherche plein texte dans l'historique des publications &amp; offres</span>
          </div>
          <div class="command-row">
            <code>/feed stats</code>
            <span>Affiche les analytics détaillées (top tags, providers, claims XP)</span>
          </div>
          <div class="command-row">
            <code>/feed digest &lt;flux&gt;</code>
            <span>Génère et publie immédiatement la Gazette / Digest avec synthèse IA</span>
          </div>
          <div class="command-row">
            <code>/feed purge [flux]</code>
            <span>Nettoie les deals et alertes expirés de l'historique et de Discord</span>
          </div>
          <div class="command-row">
            <code>/feed audio &lt;flux&gt;</code>
            <span>Génère un flash audio radio TTS des dernières actualités</span>
          </div>
          <div class="command-row">
            <code>/feed read &lt;url&gt;</code>
            <span>Extrait et affiche l'article épuré en Mode Lecture instantané sans pub</span>
          </div>
          <div class="command-row">
            <code>/feed bestof [limite]</code>
            <span>Affiche les articles les plus plébiscités par la communauté (upvotes)</span>
          </div>
          <div class="command-row">
            <code>/feed my-digest [heure] [actif]</code>
            <span>Configure son Journal Privé matinal reçu en message privé (DM)</span>
          </div>
          <div class="command-row">
            <code>/feed ask &lt;url&gt; &lt;question&gt;</code>
            <span>Interroge l'assistant IA dédié à propos d'un article ou d'une actualité</span>
          </div>
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
            <code>/feed streamers</code>
            <span>Surveille les créateurs et lives en direct (Twitch, Kick, YouTube)</span>
          </div>
          <div class="command-row">
            <code>/feed menu</code>
            <span>Menu interactif avec sélecteur Discord pour s'abonner</span>
          </div>
        </div>

        <div style="margin-top: 20px; padding: 12px; background: var(--background-secondary-alt); border-radius: 8px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13px; color: var(--header-primary); margin-bottom: 6px;">
            <span>💡</span>
            <span>Boutons d'Abonnement en 1-Clic &amp; Drop Hunter</span>
          </div>
          <p style="margin: 0; font-size: 12px; color: var(--text-muted); line-height: 1.5;">
            Chaque message posté par le bot dans Discord inclut un bouton interactif <strong>« 🔔 M'alerter pour #[tag] »</strong> ainsi qu'un bouton <strong>« 🎁 J'ai récupéré l'offre ! »</strong> récompensant les membres en XP !
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAutofeeds, type AutofeedItem, type AutofeedSubscription, type AutofeedPreset, type AutofeedStats, type AutofeedSearchItem } from '~/composables/useAutofeeds.ts';
import DiscordChannel from '~/components/common/DiscordChannel.vue';
import { useToast } from '~/composables/useToast.ts';

const autofeedsApi = useAutofeeds();
const { showToast } = useToast();

const feeds = ref<AutofeedItem[]>([]);
const subscriptions = ref<AutofeedSubscription[]>([]);
const presets = ref<AutofeedPreset[]>([]);
const stats = ref<AutofeedStats>({
  totalFeeds: 0,
  activeFeeds: 0,
  totalSubscriptions: 0,
  totalPosts: 0,
  totalClicks: 0,
  totalClaims: 0,
  totalXpAwarded: 0,
  topTags: [],
  topProviders: []
});
const loading = ref(true);
const testingId = ref<string | null>(null);

// État de recherche plein texte
const searchQuery = ref('');
const searchResults = ref<AutofeedSearchItem[]>([]);
const searching = ref(false);
const searched = ref(false);

const activeFeedsCount = computed(() => feeds.value.filter(f => f.isActive).length);

async function loadData() {
  loading.value = true;
  try {
    const [fetchedFeeds, fetchedSubs, fetchedPresets, fetchedStats] = await Promise.all([
      autofeedsApi.fetchFeeds(),
      autofeedsApi.fetchSubscriptions(),
      autofeedsApi.fetchPresets(),
      autofeedsApi.fetchStats()
    ]);
    feeds.value = fetchedFeeds || [];
    subscriptions.value = fetchedSubs || [];
    presets.value = fetchedPresets || [];
    if (fetchedStats) stats.value = fetchedStats;
  } catch (err: any) {
    showToast(`Erreur chargement des flux: ${err.message}`, 'error');
  } finally {
    loading.value = false;
  }
}

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    searched.value = false;
    return;
  }
  searching.value = true;
  searched.value = true;
  try {
    searchResults.value = await autofeedsApi.searchItems(searchQuery.value.trim(), undefined, 10);
  } catch (err: any) {
    showToast(`Erreur recherche : ${err.message}`, 'error');
  } finally {
    searching.value = false;
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
