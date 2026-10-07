<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- En-tête de la page Fournisseurs -->
    <div>
      <h3 style="margin: 0; font-size: 18px; color: var(--header-primary); font-weight: 700;">
        🌐 Architecture Multi-Sources &amp; Fournisseurs
      </h3>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-muted);">
        Le bot s'appuie sur une architecture extensible basée sur le <code>ProviderRegistry</code> permettant de connecter des flux web, chaînes vidéo, sous-forums et réseaux sociaux.
      </p>
    </div>

    <!-- Carte Explicative Architecture -->
    <div class="config-card arch-card">
      <div style="display: flex; align-items: flex-start; gap: 14px;">
        <span style="font-size: 28px;">🧩</span>
        <div>
          <h4 style="margin: 0 0 6px 0; font-size: 15px; color: var(--header-primary); font-weight: 700;">
            Comment fonctionne l'auto-détection et la normalisation multi-sources ?
          </h4>
          <p style="margin: 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">
            Lorsque vous saisissez une URL (ex: <code>r/FreeGameFindings</code> ou <code>https://youtube.com/@PlayStation</code>), le <strong>ProviderRegistry</strong> détecte automatiquement le connecteur adapté, convertit la requête en source de données exploitable, normalise les métadonnées (titre, image/thumbnail, auteur, tags, date), applique les filtres regex/mots-clés, puis dispatche les notifications Discord aux abonnés configurés.
          </p>
        </div>
      </div>
    </div>

    <!-- Grille des Fournisseurs -->
    <div class="providers-grid">
      <!-- 1. RSS / Atom Universel -->
      <div class="provider-card ready">
        <div class="provider-card-header">
          <span class="provider-card-icon">📡</span>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h4 class="provider-card-title">RSS / Atom Universel</h4>
              <span class="status-pill ready">🟢 Opérationnel</span>
            </div>
            <span class="provider-sub">Standard XML / RSS 2.0 / Atom 1.0</span>
          </div>
        </div>
        <p class="provider-card-desc">
          Compatible avec tout site web, blog WordPress, site média, agrégateur comme <strong>LootScraper</strong>, flux GitHub releases, podcasts et flux XML personnalisés.
        </p>
        <div class="provider-features">
          <span class="feat-tag">✓ LootScraper Deals</span>
          <span class="feat-tag">✓ Images &amp; Enclosures</span>
          <span class="feat-tag">✓ Tags XML &amp; Filtres</span>
        </div>
        <div class="url-example">
          <code>https://eikowagenknecht.com/lootscraper/all.rss</code>
        </div>
      </div>

      <!-- 2. YouTube -->
      <div class="provider-card ready">
        <div class="provider-card-header">
          <span class="provider-card-icon">📺</span>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h4 class="provider-card-title">YouTube</h4>
              <span class="status-pill ready">🟢 Opérationnel</span>
            </div>
            <span class="provider-sub">Chaînes, Poignées (@handle) &amp; Playlists</span>
          </div>
        </div>
        <p class="provider-card-desc">
          Surveillance en temps réel des nouvelles sorties de vidéos YouTube. Récupère automatiquement les miniatures HD, l'auteur et le lien de lecture direct.
        </p>
        <div class="provider-features">
          <span class="feat-tag">✓ @handle &amp; UC-ChannelID</span>
          <span class="feat-tag">✓ Miniature HD</span>
          <span class="feat-tag">✓ Mots-clés dans les titres</span>
        </div>
        <div class="url-example">
          <code>https://www.youtube.com/@PlayStation</code>
        </div>
      </div>

      <!-- 3. Reddit -->
      <div class="provider-card ready">
        <div class="provider-card-header">
          <span class="provider-card-icon">🤖</span>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h4 class="provider-card-title">Reddit</h4>
              <span class="status-pill ready">🟢 Opérationnel</span>
            </div>
            <span class="provider-sub">Subreddits (r/...) &amp; Flairs</span>
          </div>
        </div>
        <p class="provider-card-desc">
          Surveillance des subreddits de bons plans (ex: <code>r/FreeGameFindings</code>, <code>r/GameDeals</code>) ou de communautés avec extraction des flairs et images d'illustration.
        </p>
        <div class="provider-features">
          <span class="feat-tag">✓ Syntaxe rapide r/subreddit</span>
          <span class="feat-tag">✓ Flairs vers Tags</span>
          <span class="feat-tag">✓ Filtre sur les upvotes</span>
        </div>
        <div class="url-example">
          <code>r/FreeGameFindings ou https://reddit.com/r/GameDeals</code>
        </div>
      </div>

      <!-- 4. Google News -->
      <div class="provider-card ready">
        <div class="provider-card-header">
          <span class="provider-card-icon">📰</span>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h4 class="provider-card-title">Google News</h4>
              <span class="status-pill ready">🟢 Opérationnel</span>
            </div>
            <span class="provider-sub">Recherche par Sujets &amp; Requêtes personnalisées</span>
          </div>
        </div>
        <p class="provider-card-desc">
          Agrégation des actualités mondiales ou ciblées sur des mots-clés spécifiques (ex: cybersécurité, jeux vidéo, sortie d'un jeu particulier).
        </p>
        <div class="provider-features">
          <span class="feat-tag">✓ Requête de recherche libre</span>
          <span class="feat-tag">✓ Multi-langues</span>
          <span class="feat-tag">✓ Dédoublonnage d'articles</span>
        </div>
        <div class="url-example">
          <code>https://news.google.com/rss/search?q=PlayStation+5</code>
        </div>
      </div>

      <!-- 5. Twitch -->
      <div class="provider-card planned">
        <div class="provider-card-header">
          <span class="provider-card-icon">🟣</span>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h4 class="provider-card-title">Twitch</h4>
              <span class="status-pill planned">🟡 En Roadmap</span>
            </div>
            <span class="provider-sub">Lives Streamers &amp; Catégories de jeux</span>
          </div>
        </div>
        <p class="provider-card-desc">
          Alertes de passages en direct via Twitch Webhook EventSub / Twitch API Helix. Titre du stream, jeu en cours et aperçu dynamique.
        </p>
        <div class="provider-features">
          <span class="feat-tag">⚡ Alertes de Live instantanées</span>
          <span class="feat-tag">🎮 Filtre par Jeu/Catégorie</span>
        </div>
        <div class="url-example">
          <code>https://twitch.tv/nom_streamer</code>
        </div>
      </div>

      <!-- 6. Kick -->
      <div class="provider-card planned">
        <div class="provider-card-header">
          <span class="provider-card-icon">🟢</span>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h4 class="provider-card-title">Kick</h4>
              <span class="status-pill planned">🟡 En Roadmap</span>
            </div>
            <span class="provider-sub">Streamers Kick &amp; Replays</span>
          </div>
        </div>
        <p class="provider-card-desc">
          Surveillance des diffusions en direct sur la plateforme Kick avec notification dans le salon d'annonces Discord.
        </p>
        <div class="provider-features">
          <span class="feat-tag">⚡ Live Notification</span>
          <span class="feat-tag">💬 Bouton de visionnage</span>
        </div>
        <div class="url-example">
          <code>https://kick.com/chaine</code>
        </div>
      </div>

      <!-- 7. X / Twitter -->
      <div class="provider-card planned">
        <div class="provider-card-header">
          <span class="provider-card-icon">✖️</span>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h4 class="provider-card-title">X / Twitter</h4>
              <span class="status-pill planned">🟡 En Roadmap</span>
            </div>
            <span class="provider-sub">Comptes, Hashtags &amp; Nitter RSS</span>
          </div>
        </div>
        <p class="provider-card-desc">
          Surveillance des posts de comptes X publics (studios de jeux, développeurs, alertes bons plans) via passerelle Nitter RSS ou API Twitter v2.
        </p>
        <div class="provider-features">
          <span class="feat-tag">✓ Tweets &amp; Retweets filtrables</span>
          <span class="feat-tag">#️⃣ Alertes par Hashtags</span>
        </div>
        <div class="url-example">
          <code>https://x.com/Wario64 ou @LootScraper</code>
        </div>
      </div>

      <!-- 8. TikTok -->
      <div class="provider-card planned">
        <div class="provider-card-header">
          <span class="provider-card-icon">🎵</span>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h4 class="provider-card-title">TikTok</h4>
              <span class="status-pill planned">🟡 En Roadmap</span>
            </div>
            <span class="provider-sub">Comptes Créateurs &amp; Hashtags</span>
          </div>
        </div>
        <p class="provider-card-desc">
          Surveillance des nouvelles vidéos publiées par des comptes créateurs avec lien de prévisualisation et tags.
        </p>
        <div class="provider-features">
          <span class="feat-tag">🎬 Détection de vidéos</span>
          <span class="feat-tag">🏷️ Tags créateur</span>
        </div>
        <div class="url-example">
          <code>https://tiktok.com/@compte</code>
        </div>
      </div>

      <!-- 9. Instagram -->
      <div class="provider-card planned">
        <div class="provider-card-header">
          <span class="provider-card-icon">📸</span>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h4 class="provider-card-title">Instagram</h4>
              <span class="status-pill planned">🟡 En Roadmap</span>
            </div>
            <span class="provider-sub">Posts &amp; Carrousels de profils publics</span>
          </div>
        </div>
        <p class="provider-card-desc">
          Publication automatique des nouvelles photos et carrousels de marques ou de créateurs dans un salon médias Discord.
        </p>
        <div class="provider-features">
          <span class="feat-tag">📷 Aperçu de photo HD</span>
          <span class="feat-tag">📝 Description du post</span>
        </div>
        <div class="url-example">
          <code>https://instagram.com/compte</code>
        </div>
      </div>

      <!-- 10. Facebook -->
      <div class="provider-card planned">
        <div class="provider-card-header">
          <span class="provider-card-icon">📘</span>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h4 class="provider-card-title">Facebook Pages</h4>
              <span class="status-pill planned">🟡 En Roadmap</span>
            </div>
            <span class="provider-sub">Pages Publiques &amp; Annonces</span>
          </div>
        </div>
        <p class="provider-card-desc">
          Surveillance des publications officielles sur les pages Facebook publiques de marques, d'associations ou de serveurs.
        </p>
        <div class="provider-features">
          <span class="feat-tag">📢 Annonces de page</span>
          <span class="feat-tag">🔗 Liens d'articles</span>
        </div>
        <div class="url-example">
          <code>https://facebook.com/page_officielle</code>
        </div>
      </div>

      <!-- 11. LinkedIn -->
      <div class="provider-card planned">
        <div class="provider-card-header">
          <span class="provider-card-icon">💼</span>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h4 class="provider-card-title">LinkedIn</h4>
              <span class="status-pill planned">🟡 En Roadmap</span>
            </div>
            <span class="provider-sub">Pages Entreprises &amp; Offres d'emploi</span>
          </div>
        </div>
        <p class="provider-card-desc">
          Diffusion des actualités d'entreprises, offres de stage ou recrutements tech directement dans un salon dédié du serveur Discord.
        </p>
        <div class="provider-features">
          <span class="feat-tag">🏢 Posts d'entreprises</span>
          <span class="feat-tag">💼 Mots-clés de recrutement</span>
        </div>
        <div class="url-example">
          <code>https://linkedin.com/company/entreprise</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Page de présentation informative et architecturale des connecteurs
</script>

<style scoped>
.arch-card {
  background: linear-gradient(135deg, var(--background-secondary) 0%, rgba(88, 101, 242, 0.08) 100%);
  border-left: 4px solid var(--brand-experiment, #5865f2);
}
.providers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}
.provider-card {
  background: var(--background-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.15s;
}
.provider-card:hover {
  border-color: var(--border-medium);
}
.provider-card.ready {
  border-color: rgba(87, 242, 135, 0.3);
}
.provider-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.provider-card-icon {
  font-size: 26px;
  padding: 8px;
  background: var(--background-secondary-alt);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.provider-card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--header-primary);
}
.provider-sub {
  font-size: 11px;
  color: var(--text-muted);
}
.status-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 8px;
  text-transform: uppercase;
}
.status-pill.ready {
  background: rgba(87, 242, 135, 0.15);
  color: #57f287;
}
.status-pill.planned {
  background: rgba(254, 231, 92, 0.15);
  color: #fee75c;
}
.provider-card-desc {
  margin: 0;
  font-size: 13px;
  color: var(--text-normal);
  line-height: 1.4;
}
.provider-features {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.feat-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--background-secondary-alt);
  color: var(--text-muted);
}
.url-example {
  background: var(--background-tertiary);
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 11px;
  overflow-x: auto;
  white-space: nowrap;
}
.url-example code {
  color: #57f287;
  font-family: monospace;
}
</style>
