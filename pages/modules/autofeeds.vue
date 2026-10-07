<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <!-- En-tête du module Flux & Alertes Multi-sources -->
      <div class="module-header" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 22px; font-weight: 700; color: var(--header-primary); margin: 0 0 6px 0; display: flex; align-items: center; gap: 10px;">
              <span>📰</span> Flux RSS, LootScraper & Alertes
              <span class="status-pill status-online">
                🟢 Actif
              </span>
            </h2>
            <p class="module-desc" style="margin: 0; color: var(--text-muted); font-size: 13px;">
              Agrégateur multi-sources (RSS, LootScraper, Reddit, YouTube, Google News...) avec notifications Discord, filtrage par mots-clés et souscriptions personnalisées par tags.
            </p>
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <NuxtLink
              to="/modules/autofeeds/presets"
              class="module-btn primary"
              style="text-decoration: none;"
            >
              <span>🎁</span>
              <span>Catalogue Jeux & Deals</span>
            </NuxtLink>
            <NuxtLink
              to="/modules/autofeeds/list"
              class="module-btn"
              style="text-decoration: none;"
            >
              <span>➕</span>
              <span>Gérer les flux</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Sous-navigation des onglets -->
        <div class="module-tab-nav" style="margin-top: 16px; display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; flex-wrap: wrap;">
          <NuxtLink
            to="/modules/autofeeds/overview"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/autofeeds/overview') }"
          >
            <span>📊</span> Vue d'ensemble
          </NuxtLink>
          <NuxtLink
            to="/modules/autofeeds/list"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/autofeeds/list') }"
          >
            <span>📰</span> Flux configurés
          </NuxtLink>
          <NuxtLink
            to="/modules/autofeeds/presets"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/autofeeds/presets') }"
          >
            <span>🎁</span> Catalogue &amp; LootScraper
          </NuxtLink>
          <NuxtLink
            to="/modules/autofeeds/subscriptions"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/autofeeds/subscriptions') }"
          >
            <span>🔔</span> Abonnements &amp; Alertes
          </NuxtLink>
          <NuxtLink
            to="/modules/autofeeds/providers"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/autofeeds/providers') }"
          >
            <span>🌐</span> Fournisseurs &amp; Roadmap
          </NuxtLink>
        </div>
      </div>

      <!-- Sous-page active -->
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

definePageMeta({
  title: 'Flux & Alertes',
  icon: '📰',
  description: 'Agrégateur de flux RSS, jeux gratuits LootScraper et notifications par tags',
  section: 'modules',
  order: 18
});

useSeoMeta({
  title: 'Flux RSS & Alertes - Bot',
  description: 'Agrégation de flux multi-sources, bons plans jeux et abonnements par mots-clés/tags',
  ogTitle: 'Flux RSS & Alertes - Bot',
  ogDescription: 'Agrégation de flux multi-sources, bons plans jeux et abonnements par mots-clés/tags'
});

const route = useRoute();

function isTabActive(path: string): boolean {
  if (path === '/modules/autofeeds/overview' && (route.path === '/modules/autofeeds' || route.path === '/modules/autofeeds/')) {
    return true;
  }
  return route.path.startsWith(path);
}
</script>

<style scoped>
.status-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.status-online {
  background: rgba(87, 242, 135, 0.15);
  color: #57f287;
  border: 1px solid rgba(87, 242, 135, 0.3);
}
.module-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 13px;
  border-radius: 6px;
  background: var(--background-modifier-hover);
  color: var(--text-normal);
  font-size: 13px;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.module-btn:hover {
  background: var(--background-modifier-selected);
}
.module-btn.primary {
  background: var(--brand-experiment, #5865f2);
  color: #ffffff;
  border-color: transparent;
  font-weight: 600;
}
.module-btn.primary:hover {
  filter: brightness(1.1);
}
.module-tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}
.module-tab-btn:hover {
  background: var(--background-modifier-hover);
  color: var(--text-normal);
}
.module-tab-btn.active {
  background: var(--brand-experiment, #5865f2);
  color: white;
  font-weight: 600;
}
</style>
