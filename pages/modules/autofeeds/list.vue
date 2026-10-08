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

      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button class="module-btn" :disabled="loading" @click="loadData">
          <span>🔄</span>
          <span>Actualiser</span>
        </button>
        <button class="module-btn secondary" @click="openOpmlModal">
          <span>📥</span>
          <span>Import OPML</span>
        </button>
        <button class="module-btn secondary" :disabled="feeds.length === 0" @click="handleOpmlExport">
          <span>📤</span>
          <span>Export OPML</span>
        </button>
        <button class="module-btn secondary" :disabled="purging" @click="handlePurgeExpired">
          <span>🧹</span>
          <span>{{ purging ? 'Purge...' : 'Purger Expirés' }}</span>
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
        class="filter-pill live-pill"
        :class="{ active: selectedCategory === 'live' }"
        @click="selectedCategory = 'live'"
      >
        🔴 Directs &amp; Lives ({{ liveFeedsCount }})
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
          <div class="feed-icon-wrap" :class="{ 'live-wrap': isLiveProvider(feed.provider) }">
            <span v-if="feed.provider === 'youtube_live'">🔴</span>
            <span v-else-if="feed.provider === 'youtube'">📺</span>
            <span v-else-if="feed.provider === 'reddit'">🤖</span>
            <span v-else-if="feed.provider === 'google_news'">📰</span>
            <span v-else-if="feed.provider === 'twitch'">🟣</span>
            <span v-else-if="feed.provider === 'kick'">🟢</span>
            <span v-else-if="feed.provider === 'twitter'">✖️</span>
            <span v-else-if="feed.provider === 'tiktok'">🎵</span>
            <span v-else-if="feed.provider === 'instagram'">📸</span>
            <span v-else-if="feed.provider === 'facebook'">👥</span>
            <span v-else-if="feed.provider === 'github'">🐙</span>
            <span v-else-if="feed.provider === 'gitlab'">🦊</span>
            <span v-else-if="feed.provider === 'statuspage'">📊</span>
            <span v-else-if="feed.provider === 'steam'">🎮</span>
            <span v-else-if="feed.provider === 'bluesky'">🦋</span>
            <span v-else-if="feed.category === 'gaming'">🎮</span>
            <span v-else>📡</span>
          </div>

          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <h4 class="feed-title" :title="feed.name">{{ feed.name }}</h4>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span class="provider-pill">{{ feed.provider || 'rss' }}</span>
                <span v-if="isLiveProvider(feed.provider)" class="live-indicator-pill">🔴 LIVE</span>
                <!-- Badge de santé du flux -->
                <span
                  v-if="feed.lastStatus === 'error' || (feed.failCount && feed.failCount > 0)"
                  class="health-badge error"
                  :title="feed.lastError ? ((feed.failCount ? feed.failCount + '/10 échecs : ' : '') + feed.lastError) : 'Erreur de vérification'"
                >
                  ⚠️ {{ feed.failCount && feed.failCount > 0 ? `Erreur (${feed.failCount}/10)` : 'Erreur' }}
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
          <div v-if="feed.createThread" class="meta-item" title="Crée un fil de discussion Discord pour ce stream">
            <span class="meta-icon">🧵</span>
            <span class="meta-text">Thread</span>
          </div>
          <div v-if="feed.subscriberRoleId" class="meta-item" title="Rôle Discord attribué aux abonnés">
            <span class="meta-icon">🏷️</span>
            <span class="meta-text">Rôle auto</span>
          </div>
          <div v-if="feed.category" class="meta-item">
            <span class="tag-badge category">{{ feed.category }}</span>
          </div>
          <div v-if="feed.enableVoting" class="meta-item" title="Curation communautaire par votes">
            <span class="meta-icon">🗳️</span>
            <span class="meta-text">Votes</span>
          </div>
          <div v-if="feed.minDiscountPercent" class="meta-item" title="Traqueur de réductions et prix historiques">
            <span class="meta-icon">💰</span>
            <span class="meta-text">≥ {{ feed.minDiscountPercent }}%</span>
          </div>
          <div v-if="feed.autoSyncEvents" class="meta-item" title="Synchronisation d'événements Discord">
            <span class="meta-icon">🗓️</span>
            <span class="meta-text">Events</span>
          </div>
          <div v-if="feed.goodVibesOnly" class="meta-item" title="Filtre Good Vibes Only (positivité)">
            <span class="meta-icon">🎭</span>
            <span class="meta-text">Good Vibes</span>
          </div>
          <div v-if="feed.enableSecurityScan" class="meta-item" title="Bouclier Anti-Phishing & URLs Dépliées">
            <span class="meta-icon">🛡️</span>
            <span class="meta-text">Shield</span>
          </div>
          <div v-if="feed.translateTitleToFr" class="meta-item" title="Traduction automatique du titre en français">
            <span class="meta-icon">🌐</span>
            <span class="meta-text">Traduction FR</span>
          </div>
          <div v-if="feed.antiClickbait" class="meta-item" title="Titres factuels anti-sensationnalisme">
            <span class="meta-icon">🔍</span>
            <span class="meta-text">Anti-Clickbait</span>
          </div>
          <div v-if="feed.requireApproval" class="meta-item" title="Validation manuelle requise en modération">
            <span class="meta-icon">🛡️</span>
            <span class="meta-text">Modération</span>
          </div>
          <div v-if="feed.enableStoryClustering" class="meta-item" title="Dé-duplication multi-flux sémantique">
            <span class="meta-icon">🤖</span>
            <span class="meta-text">Cluster</span>
          </div>
          <div v-if="feed.enableVideoSummary" class="meta-item" title="Résumeur vidéo YouTube automatique">
            <span class="meta-icon">🎥</span>
            <span class="meta-text">Résumé Vidéo</span>
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
              title="Mode Lecture Épuré (Reader View)"
              @click="openReaderModal(feed.url)"
            >
              <span>📖</span>
            </button>
            <button
              class="module-btn icon-only"
              title="Générer un Bulletin Vocal / Flash Audio TTS"
              :disabled="audioLoadingId === feed.id"
              @click="handleAudioBriefing(feed)"
            >
              <span>{{ audioLoadingId === feed.id ? '⏳' : '🎙️' }}</span>
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

          <!-- Options de Stream & Directs (Grill-me décision 6) -->
          <div class="stream-section">
            <div class="stream-toggle" @click="showStreamOptions = !showStreamOptions">
              <span>{{ showStreamOptions ? '▼' : '►' }} 🎭 Options de Stream &amp; Directs (Twitch, Kick, YouTube Live)</span>
            </div>

            <div v-if="showStreamOptions" class="stream-body">
              <div class="form-group">
                <label class="form-label">Message d'annonce en direct personnalisé</label>
                <input
                  v-model="form.customMessage"
                  type="text"
                  class="form-input"
                  placeholder="Ex: 🔴 {streamer} est en live sur {game} ! {url} {mentions}"
                />
                <span class="form-hint">
                  Placeholders : <code>{streamer}</code>, <code>{title}</code>, <code>{game}</code>, <code>{viewers}</code>, <code>{url}</code>, <code>{mentions}</code>
                </span>
              </div>

              <div class="form-group">
                <label class="form-label">Rôle Discord à mentionner lors du direct</label>
                <input
                  v-model="form.pingRoleId"
                  type="text"
                  class="form-input"
                  placeholder="ID du rôle (ex: 123456789012345678)"
                />
              </div>

              <div class="form-group" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255, 255, 255, 0.03); border-radius: 6px;">
                <div>
                  <label class="form-label" style="margin-bottom: 2px;">🧵 Créer un fil de discussion (Thread)</label>
                  <span class="form-hint" style="margin: 0;">Ouvre automatiquement un chat temporaire sous l'annonce</span>
                </div>
                <input
                  v-model="form.createThread"
                  type="checkbox"
                  style="width: 18px; height: 18px; cursor: pointer; accent-color: #5865f2;"
                />
              </div>

              <!-- Webhook Personnalisé -->
              <div class="form-group" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255, 255, 255, 0.03); border-radius: 6px;">
                <div>
                  <label class="form-label" style="margin-bottom: 2px;">🎭 Webhook Personnalisé (Impersonation)</label>
                  <span class="form-hint" style="margin: 0;">Publie avec le nom et l'avatar du créateur/streamer</span>
                </div>
                <input
                  v-model="form.useWebhook"
                  type="checkbox"
                  style="width: 18px; height: 18px; cursor: pointer; accent-color: #5865f2;"
                />
              </div>

              <!-- Proxy Médias Avancé -->
              <div class="form-group" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255, 255, 255, 0.03); border-radius: 6px;">
                <div>
                  <label class="form-label" style="margin-bottom: 2px;">🎬 Proxy Médias (FxTwitter & vxTikTok)</label>
                  <span class="form-hint" style="margin: 0;">Lecteur vidéo natif Discord pour les liens Twitter/X et TikTok</span>
                </div>
                <input
                  v-model="form.enableMediaProxy"
                  type="checkbox"
                  style="width: 18px; height: 18px; cursor: pointer; accent-color: #5865f2;"
                />
              </div>

              <!-- Ignorer les Shorts YouTube -->
              <div class="form-group" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255, 255, 255, 0.03); border-radius: 6px;">
                <div>
                  <label class="form-label" style="margin-bottom: 2px;">🩳 Filtrer les YouTube Shorts</label>
                  <span class="form-hint" style="margin: 0;">Ignore les vidéos courtes et ne garde que les vidéos standard</span>
                </div>
                <input
                  v-model="form.ignoreShorts"
                  type="checkbox"
                  style="width: 18px; height: 18px; cursor: pointer; accent-color: #5865f2;"
                />
              </div>

              <!-- Résumé IA TL;DR & Traduction -->
              <div class="form-group" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(88, 101, 242, 0.06); border-radius: 6px; border: 1px solid rgba(88, 101, 242, 0.2);">
                <div>
                  <label class="form-label" style="margin-bottom: 2px;">🤖 Résumé IA (TL;DR) & Traduction (FR)</label>
                  <span class="form-hint" style="margin: 0;">Génère automatiquement 2-3 points clés et traduit en français</span>
                </div>
                <input
                  v-model="form.aiSummary"
                  type="checkbox"
                  style="width: 18px; height: 18px; cursor: pointer; accent-color: #5865f2;"
                />
              </div>

              <div class="form-group">
                <label class="form-label">🏷️ Rôle Discord attribué aux abonnés de ce flux</label>
                <input
                  v-model="form.subscriberRoleId"
                  type="text"
                  class="form-input"
                  placeholder="ID du rôle (optionnel, attribué automatiquement)"
                />
                <span class="form-hint">Les membres qui cliquent sur le bouton d'abonnement recevront ce rôle.</span>
              </div>

              <div class="form-group">
                <label class="form-label">Mode de notification</label>
                <select v-model="form.notificationDelivery" class="form-select">
                  <option value="channel">📢 Salon public (mentions)</option>
                  <option value="dm">📩 Message Privé (DM)</option>
                  <option value="both">🔔 Salon + Message Privé (DM)</option>
                  <option value="role">🏷️ Rôle dédié uniquement</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Intervalle rapide pour flux en direct</label>
                <div style="display: flex; gap: 8px;">
                  <button
                    type="button"
                    class="interval-quick-btn"
                    :class="{ active: form.checkIntervalMinutes === 2 }"
                    @click="form.checkIntervalMinutes = 2"
                  >
                    ⚡ 2 min (Recommandé)
                  </button>
                  <button
                    type="button"
                    class="interval-quick-btn"
                    :class="{ active: form.checkIntervalMinutes === 5 }"
                    @click="form.checkIntervalMinutes = 5"
                  >
                    5 min
                  </button>
                </div>
              </div>
            </div>
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

              <!-- 📰 Mode Gazette & Digest -->
              <div class="form-group" style="background: rgba(88, 101, 242, 0.05); padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle); margin-top: 10px;">
                <label class="form-label" style="display: flex; align-items: center; gap: 6px;">
                  <span>📰</span>
                  <span>Mode de Diffusion & Digest</span>
                </label>
                <select v-model="form.digestMode" class="form-select" style="margin-bottom: 8px;">
                  <option value="realtime">⚡ Temps réel (instantané)</option>
                  <option value="daily">🌅 Gazette quotidienne (bulletin matinal)</option>
                  <option value="weekly">📅 Gazette hebdomadaire</option>
                </select>
                <div v-if="form.digestMode !== 'realtime'" style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                  <div style="flex: 1; min-width: 120px;">
                    <label class="form-label" style="font-size: 11px;">Heure d'envoi</label>
                    <input v-model="form.digestSchedule" type="time" class="form-input" />
                  </div>
                  <div style="flex: 2; min-width: 180px;">
                    <label class="form-label" style="font-size: 11px;">Salon Digest (optionnel)</label>
                    <DiscordChannelSelect v-model="form.digestChannelId" placeholder="Même salon par défaut" />
                  </div>
                </div>
              </div>

              <!-- 🎁 Gamification Drop Hunter -->
              <div class="form-group" style="background: rgba(244, 180, 0, 0.06); padding: 12px; border-radius: 8px; border: 1px solid rgba(244, 180, 0, 0.2); margin-top: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                  <div>
                    <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🎁 Bouton Drop Hunter (Offres Réclamées)</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Ajoute un bouton « J'ai récupéré l'offre ! » avec compteur et attribution d'XP</div>
                  </div>
                  <input
                    v-model="form.enableGamification"
                    type="checkbox"
                    style="width: 18px; height: 18px; cursor: pointer; accent-color: #f4b400;"
                  />
                </div>
                <div v-if="form.enableGamification" style="margin-top: 8px;">
                  <label class="form-label" style="font-size: 11px;">Récompense d'expérience (XP) par membre</label>
                  <input v-model.number="form.gamificationXpReward" type="number" min="0" max="1000" class="form-input" placeholder="25" />
                </div>
              </div>

              <!-- 🌙 Heures Silencieuses & Anti-Flood -->
              <div class="form-group" style="background: rgba(87, 242, 135, 0.05); padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle); margin-top: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                  <div>
                    <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🌙 Heures Silencieuses & Anti-Flood</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Désactive les pings la nuit et limite le débit par heure</div>
                  </div>
                  <input
                    v-model="form.quietHoursEnabled"
                    type="checkbox"
                    style="width: 18px; height: 18px; cursor: pointer; accent-color: #57f287;"
                  />
                </div>
                <div v-if="form.quietHoursEnabled" style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                  <div style="display: flex; gap: 10px;">
                    <div style="flex: 1;">
                      <label class="form-label" style="font-size: 11px;">Début du calme</label>
                      <input v-model="form.quietHoursStart" type="time" class="form-input" />
                    </div>
                    <div style="flex: 1;">
                      <label class="form-label" style="font-size: 11px;">Fin du calme</label>
                      <input v-model="form.quietHoursEnd" type="time" class="form-input" />
                    </div>
                  </div>
                  <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); cursor: pointer;">
                    <input v-model="form.quietHoursSuppressMentions" type="checkbox" />
                    Neutraliser les mentions et pings @everyone/@role la nuit
                  </label>
                </div>
                <div style="margin-top: 8px;">
                  <label class="form-label" style="font-size: 11px;">Débit maximum par heure (0 = illimité)</label>
                  <input v-model.number="form.maxPostsPerHour" type="number" min="0" max="60" class="form-input" placeholder="0" />
                </div>
              </div>

              <!-- 🔀 Routage par Tag Multi-Salons -->
              <div class="form-group" style="margin-top: 10px;">
                <label class="form-label">🔀 Routage par Tag (JSON : {"#tag": "ID_SALON"})</label>
                <textarea
                  v-model="form.channelTagRoutingJson"
                  class="form-input"
                  rows="2"
                  placeholder='{"#ps5": "123456789012345678", "#switch": "987654321098765432"}'
                ></textarea>
                <span class="form-hint">Redirige automatiquement un article avec un tag spécifique vers un autre salon Discord.</span>
              </div>

              <!-- 🗳️ Community Pulse (Réactions & Sondages) -->
              <div class="form-group" style="background: rgba(237, 66, 69, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(237, 66, 69, 0.2); margin-top: 10px;">
                <div style="font-weight: 600; color: var(--header-primary); font-size: 13px; margin-bottom: 6px;">🗳️ Community Pulse (Engagement)</div>
                <div style="margin-bottom: 8px;">
                  <label class="form-label" style="font-size: 11px;">Réactions emojis automatiques (séparées par des virgules)</label>
                  <input v-model="form.autoReactionsInput" type="text" class="form-input" placeholder="🔥, 😐, 💸" />
                  <span class="form-hint" style="font-size: 11px;">Ajoute automatiquement ces réactions sous chaque publication Discord.</span>
                </div>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); cursor: pointer;">
                  <input v-model="form.autoPoll" type="checkbox" />
                  Sondage d'opinion Discord automatique sous l'article
                </label>
              </div>

              <!-- 🚨 Breaking News & Alertes Flash -->
              <div class="form-group" style="background: rgba(237, 66, 69, 0.08); padding: 12px; border-radius: 8px; border: 1px solid rgba(237, 66, 69, 0.3); margin-top: 10px;">
                <div style="font-weight: 600; color: var(--header-primary); font-size: 13px; margin-bottom: 6px;">🚨 Alerte Flash / Breaking News</div>
                <div style="margin-bottom: 8px;">
                  <label class="form-label" style="font-size: 11px;">Mots-clés urgents (déclenchent l'embed rouge 🚨 FLASH INFO)</label>
                  <input v-model="form.breakingKeywordsInput" type="text" class="form-input" placeholder="BREAKING, URGENT, CVE-, 0-DAY" />
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); cursor: pointer;">
                    <input v-model="form.bypassQuietHours" type="checkbox" />
                    Outrepasser les heures calmes et limites de débit pour les urgences
                  </label>
                  <div>
                    <label class="form-label" style="font-size: 11px;">Rôle prioritaire à mentionner (optionnel)</label>
                    <input v-model="form.breakingRoleId" type="text" class="form-input" placeholder="ID du rôle (ex: 123456789012345678)" />
                  </div>
                </div>
              </div>

              <!-- 🧹 Auto-Purge & Deals Expirés -->
              <div class="form-group" style="background: rgba(88, 101, 242, 0.05); padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle); margin-top: 10px;">
                <div style="font-weight: 600; color: var(--header-primary); font-size: 13px; margin-bottom: 6px;">🧹 Auto-Purge des Messages Discord Expirés</div>
                <label class="form-label" style="font-size: 11px;">Durée de rétention Discord en jours (0 = pas de suppression)</label>
                <input v-model.number="form.autoExpireDays" type="number" min="0" max="365" class="form-input" placeholder="Ex: 7" />
                <span class="form-hint" style="font-size: 11px;">Supprime automatiquement le message Discord après expiration du délai.</span>
              </div>

              <!-- 🎙️ Bulletin Vocal / Radio Flash (TTS) -->
              <div class="form-group" style="background: rgba(88, 101, 242, 0.08); padding: 12px; border-radius: 8px; border: 1px solid rgba(88, 101, 242, 0.2); margin-top: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🎙️ Bulletin Vocal / Daily Audio Briefing (TTS)</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Génération automatique d'une synthèse radio MP3 des actualités</div>
                  </div>
                  <input v-model="form.enableAudioBriefing" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #5865f2;" />
                </div>
              </div>

              <!-- 🗳️ Votes & Promotion Best-Of -->
              <div class="form-group" style="background: rgba(88, 101, 242, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(88, 101, 242, 0.2); margin-top: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <div>
                    <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🗳️ Curation Communautaire (Upvote / Downvote)</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Ajoute des boutons 👍 / 👎 Discord interactifs sous les publications</div>
                  </div>
                  <input v-model="form.enableVoting" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #5865f2;" />
                </div>
                <div v-if="form.enableVoting" style="display: flex; flex-direction: column; gap: 8px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.1);">
                  <div>
                    <label class="form-label" style="font-size: 11px;">Seuil de votes positifs pour promotion Best-Of</label>
                    <input v-model.number="form.bestOfThreshold" type="number" min="1" max="100" class="form-input" placeholder="Ex: 5" />
                    <span class="form-hint" style="font-size: 11px;">Nombre net d'upvotes requis pour déclencher la mise en avant automatique.</span>
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 11px;">Salon Discord Best-Of (optionnel, sinon le même salon)</label>
                    <DiscordChannelSelect v-model="form.bestOfChannelId" placeholder="Salon Best-Of (optionnel)" />
                  </div>
                </div>
              </div>

              <!-- 💰 Traqueur de Prix & All-Time Low (ATL) -->
              <div class="form-group" style="background: rgba(245, 158, 11, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.2); margin-top: 10px;">
                <div style="font-weight: 600; color: var(--header-primary); font-size: 13px; margin-bottom: 6px;">💰 Filtre Bons Plans & Suivi Prix (ATL)</div>
                <label class="form-label" style="font-size: 11px;">Réduction minimale en % requise pour publier (0 = désactivé / tous)</label>
                <input v-model.number="form.minDiscountPercent" type="number" min="0" max="100" class="form-input" placeholder="Ex: 50 pour ≥ 50% de remise" />
                <span class="form-hint" style="font-size: 11px;">Détecte automatiquement les prix historiques et ajoute le badge 🔥 ATL si nouveau record.</span>
              </div>

              <!-- 🗓️ Synchronisation Événements Programmés Discord -->
              <div class="form-group" style="background: rgba(16, 185, 129, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2); margin-top: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🗓️ Synchronisation Événements Discord</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Création automatique d'un GuildScheduledEvent si une date future est détectée</div>
                  </div>
                  <input v-model="form.autoSyncEvents" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981;" />
                </div>
              </div>

              <!-- 🎭 Filtre d'Humeur & Positivité ("Good Vibes Only") -->
              <div class="form-group" style="background: rgba(236, 72, 153, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(236, 72, 153, 0.2); margin-top: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🎭 Good Vibes Only (Filtre Sentiment)</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Exclut automatiquement les actualités dramatiques ou anxiogènes dans les salons calmes</div>
                  </div>
                  <input v-model="form.goodVibesOnly" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #ec4899;" />
                </div>
              </div>

              <!-- 🛡️ Bouclier Sécurité & Déplieur d'URLs -->
              <div class="form-group" style="background: rgba(99, 102, 241, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(99, 102, 241, 0.2); margin-top: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🛡️ Bouclier Anti-Phishing & Dépliage d'URLs</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Déplie les liens courts (bit.ly, t.co...) et bloque les redirections suspectes</div>
                  </div>
                  <input v-model="form.enableSecurityScan" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #6366f1;" />
                </div>
              </div>

              <!-- 🌐 Traduction Intelligente du Titre en Français -->
              <div class="form-group" style="background: rgba(59, 130, 246, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2); margin-top: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🌐 Traduction des Titres en Français</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Traduit automatiquement les titres en langue étrangère (avec badge 🇫🇷)</div>
                  </div>
                  <input v-model="form.translateTitleToFr" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #3b82f6;" />
                </div>
              </div>

              <!-- 🔍 Dé-clickbaiteur & Titres Factuels -->
              <div class="form-group" style="background: rgba(14, 165, 233, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(14, 165, 233, 0.2); margin-top: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🔍 Anti-Clickbait & Titres Factuels</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Neutralise les titres racoleurs en reformulations claires et neutres</div>
                  </div>
                  <input v-model="form.antiClickbait" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #0ea5e9;" />
                </div>
              </div>

              <!-- 🛡️ Salle d'Attente & Validation Manuelle -->
              <div class="form-group" style="background: rgba(239, 68, 68, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2); margin-top: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <div>
                    <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🛡️ Salle d'Attente & Validation Manuelle</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Achemine les actualités vers un salon de modération avant publication</div>
                  </div>
                  <input v-model="form.requireApproval" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #ef4444;" />
                </div>
                <div v-if="form.requireApproval" style="padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.1);">
                  <label class="form-label" style="font-size: 11px;">Salon de modération Discord</label>
                  <DiscordChannelSelect v-model="form.moderationChannelId" placeholder="Sélectionner le salon de modération" />
                </div>
              </div>

              <!-- 🤖 Dé-duplication Sémantique Multi-Flux -->
              <div class="form-group" style="background: rgba(168, 85, 247, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(168, 85, 247, 0.2); margin-top: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <div>
                    <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🤖 Dé-duplication Multi-Flux (Story Clustering)</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Regroupe les doublons d'actualités traitant du même événement</div>
                  </div>
                  <input v-model="form.enableStoryClustering" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #a855f7;" />
                </div>
                <div v-if="form.enableStoryClustering" style="padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.1);">
                  <label class="form-label" style="font-size: 11px;">Action lors de la détection d'un doublon</label>
                  <select v-model="form.clusterMode" class="form-select">
                    <option value="merge">Fusionner (Ajoute la source liée sous le message initial)</option>
                    <option value="skip">Ignorer (Ne pas reposter l'actualité)</option>
                  </select>
                </div>
              </div>

              <!-- 🎥 Résumeur Vidéo YouTube Automatique -->
              <div class="form-group" style="background: rgba(220, 38, 38, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(220, 38, 38, 0.2); margin-top: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🎥 Résumeur Vidéo YouTube Automatique</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Extrait les points clés des vidéos sous forme de synthèse à puces</div>
                  </div>
                  <input v-model="form.enableVideoSummary" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #dc2626;" />
                </div>
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

          <!-- Options de Stream en édition -->
          <div class="stream-section">
            <div class="stream-toggle" @click="showEditStreamOptions = !showEditStreamOptions">
              <span>{{ showEditStreamOptions ? '▼' : '►' }} 🎭 Options de Stream (Annonce &amp; Rôle)</span>
            </div>

            <div v-if="showEditStreamOptions" class="stream-body">
              <div class="form-group">
                <label class="form-label">Message en direct personnalisé</label>
                <input
                  v-model="editForm.customMessage"
                  type="text"
                  class="form-input"
                  placeholder="Ex: 🔴 {streamer} est en live sur {game} ! {url} {mentions}"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Rôle Discord à mentionner</label>
                <input
                  v-model="editForm.pingRoleId"
                  type="text"
                  class="form-input"
                  placeholder="ID du rôle (ex: 123456789012345678)"
                />
              </div>

              <div class="form-group" style="display: flex; align-items: center; justify-content: space-between; background: rgba(88, 101, 242, 0.08); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(88, 101, 242, 0.2);">
                <div>
                  <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🧵 Créer un fil de discussion (Thread)</div>
                  <div style="font-size: 12px; color: var(--text-muted);">Ouvre un fil Discord sous l'annonce pour les réactions en direct.</div>
                </div>
                <input
                  v-model="editForm.createThread"
                  type="checkbox"
                  style="width: 18px; height: 18px; cursor: pointer; accent-color: #5865f2;"
                />
              </div>

              <!-- Webhook Personnalisé -->
              <div class="form-group" style="display: flex; align-items: center; justify-content: space-between; background: rgba(88, 101, 242, 0.08); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(88, 101, 242, 0.2);">
                <div>
                  <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🎭 Webhook Personnalisé (Impersonation)</div>
                  <div style="font-size: 12px; color: var(--text-muted);">Publie avec le nom et l'avatar du créateur/streamer</div>
                </div>
                <input
                  v-model="editForm.useWebhook"
                  type="checkbox"
                  style="width: 18px; height: 18px; cursor: pointer; accent-color: #5865f2;"
                />
              </div>

              <!-- Proxy Médias Avancé -->
              <div class="form-group" style="display: flex; align-items: center; justify-content: space-between; background: rgba(88, 101, 242, 0.08); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(88, 101, 242, 0.2);">
                <div>
                  <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🎬 Proxy Médias (FxTwitter & vxTikTok)</div>
                  <div style="font-size: 12px; color: var(--text-muted);">Lecteur vidéo natif Discord pour les liens Twitter/X et TikTok</div>
                </div>
                <input
                  v-model="editForm.enableMediaProxy"
                  type="checkbox"
                  style="width: 18px; height: 18px; cursor: pointer; accent-color: #5865f2;"
                />
              </div>

              <!-- Ignorer les Shorts YouTube -->
              <div class="form-group" style="display: flex; align-items: center; justify-content: space-between; background: rgba(88, 101, 242, 0.08); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(88, 101, 242, 0.2);">
                <div>
                  <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🩳 Filtrer les YouTube Shorts</div>
                  <div style="font-size: 12px; color: var(--text-muted);">Ignore les vidéos courtes et ne garde que les vidéos standard</div>
                </div>
                <input
                  v-model="editForm.ignoreShorts"
                  type="checkbox"
                  style="width: 18px; height: 18px; cursor: pointer; accent-color: #5865f2;"
                />
              </div>

              <!-- Résumé IA TL;DR & Traduction -->
              <div class="form-group" style="display: flex; align-items: center; justify-content: space-between; background: rgba(88, 101, 242, 0.08); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(88, 101, 242, 0.2);">
                <div>
                  <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🤖 Résumé IA (TL;DR) & Traduction (FR)</div>
                  <div style="font-size: 12px; color: var(--text-muted);">Génère automatiquement 2-3 points clés et traduit en français</div>
                </div>
                <input
                  v-model="editForm.aiSummary"
                  type="checkbox"
                  style="width: 18px; height: 18px; cursor: pointer; accent-color: #5865f2;"
                />
              </div>

              <div class="form-group">
                <label class="form-label">🏷️ Rôle Discord attribué aux abonnés de ce flux</label>
                <input
                  v-model="editForm.subscriberRoleId"
                  type="text"
                  class="form-input"
                  placeholder="ID du rôle (optionnel, attribué automatiquement)"
                />
                <span class="form-hint">Les membres qui cliquent sur le bouton d'abonnement recevront ce rôle.</span>
              </div>

              <div class="form-group">
                <label class="form-label">Mode de notification</label>
                <select v-model="editForm.notificationDelivery" class="form-select">
                  <option value="channel">📢 Salon public (mentions)</option>
                  <option value="dm">📩 Message Privé (DM)</option>
                  <option value="both">🔔 Salon + Message Privé (DM)</option>
                  <option value="role">🏷️ Rôle dédié uniquement</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Couleur de l'Embed (Hex)</label>
            <input
              v-model="editForm.embedColor"
              type="text"
              class="form-input"
            />
          </div>

          <!-- 📰 Mode Gazette & Digest -->
          <div class="form-group" style="background: rgba(88, 101, 242, 0.05); padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle); margin-top: 10px;">
            <label class="form-label" style="display: flex; align-items: center; gap: 6px;">
              <span>📰</span>
              <span>Mode de Diffusion & Digest</span>
            </label>
            <select v-model="editForm.digestMode" class="form-select" style="margin-bottom: 8px;">
              <option value="realtime">⚡ Temps réel (instantané)</option>
              <option value="daily">🌅 Gazette quotidienne (bulletin matinal)</option>
              <option value="weekly">📅 Gazette hebdomadaire</option>
            </select>
            <div v-if="editForm.digestMode !== 'realtime'" style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 120px;">
                <label class="form-label" style="font-size: 11px;">Heure d'envoi</label>
                <input v-model="editForm.digestSchedule" type="time" class="form-input" />
              </div>
              <div style="flex: 2; min-width: 180px;">
                <label class="form-label" style="font-size: 11px;">Salon Digest (optionnel)</label>
                <DiscordChannelSelect v-model="editForm.digestChannelId" placeholder="Même salon par défaut" />
              </div>
            </div>
          </div>

          <!-- 🎁 Gamification Drop Hunter -->
          <div class="form-group" style="background: rgba(244, 180, 0, 0.06); padding: 12px; border-radius: 8px; border: 1px solid rgba(244, 180, 0, 0.2); margin-top: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <div>
                <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🎁 Bouton Drop Hunter (Offres Réclamées)</div>
                <div style="font-size: 12px; color: var(--text-muted);">Ajoute un bouton « J'ai récupéré l'offre ! » avec compteur et attribution d'XP</div>
              </div>
              <input
                v-model="editForm.enableGamification"
                type="checkbox"
                style="width: 18px; height: 18px; cursor: pointer; accent-color: #f4b400;"
              />
            </div>
            <div v-if="editForm.enableGamification" style="margin-top: 8px;">
              <label class="form-label" style="font-size: 11px;">Récompense d'expérience (XP) par membre</label>
              <input v-model.number="editForm.gamificationXpReward" type="number" min="0" max="1000" class="form-input" placeholder="25" />
            </div>
          </div>

          <!-- 🌙 Heures Silencieuses & Anti-Flood -->
          <div class="form-group" style="background: rgba(87, 242, 135, 0.05); padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle); margin-top: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <div>
                <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🌙 Heures Silencieuses & Anti-Flood</div>
                <div style="font-size: 12px; color: var(--text-muted);">Désactive les pings la nuit et limite le débit par heure</div>
              </div>
              <input
                v-model="editForm.quietHoursEnabled"
                type="checkbox"
                style="width: 18px; height: 18px; cursor: pointer; accent-color: #57f287;"
              />
            </div>
            <div v-if="editForm.quietHoursEnabled" style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
              <div style="display: flex; gap: 10px;">
                <div style="flex: 1;">
                  <label class="form-label" style="font-size: 11px;">Début du calme</label>
                  <input v-model="editForm.quietHoursStart" type="time" class="form-input" />
                </div>
                <div style="flex: 1;">
                  <label class="form-label" style="font-size: 11px;">Fin du calme</label>
                  <input v-model="editForm.quietHoursEnd" type="time" class="form-input" />
                </div>
              </div>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); cursor: pointer;">
                <input v-model="editForm.quietHoursSuppressMentions" type="checkbox" />
                Neutraliser les mentions et pings @everyone/@role la nuit
              </label>
            </div>
            <div style="margin-top: 8px;">
              <label class="form-label" style="font-size: 11px;">Débit maximum par heure (0 = illimité)</label>
              <input v-model.number="editForm.maxPostsPerHour" type="number" min="0" max="60" class="form-input" placeholder="0" />
            </div>
          </div>

          <!-- 🔀 Routage par Tag Multi-Salons -->
          <div class="form-group" style="margin-top: 10px;">
            <label class="form-label">🔀 Routage par Tag (JSON : {"#tag": "ID_SALON"})</label>
            <textarea
              v-model="editForm.channelTagRoutingJson"
              class="form-input"
              rows="2"
              placeholder='{"#ps5": "123456789012345678", "#switch": "987654321098765432"}'
            ></textarea>
            <span class="form-hint">Redirige automatiquement un article avec un tag spécifique vers un autre salon Discord.</span>
          </div>

          <!-- 🗳️ Community Pulse (Réactions & Sondages) -->
          <div class="form-group" style="background: rgba(237, 66, 69, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(237, 66, 69, 0.2); margin-top: 10px;">
            <div style="font-weight: 600; color: var(--header-primary); font-size: 13px; margin-bottom: 6px;">🗳️ Community Pulse (Engagement)</div>
            <div style="margin-bottom: 8px;">
              <label class="form-label" style="font-size: 11px;">Réactions emojis automatiques (séparées par des virgules)</label>
              <input v-model="editForm.autoReactionsInput" type="text" class="form-input" placeholder="🔥, 😐, 💸" />
              <span class="form-hint" style="font-size: 11px;">Ajoute automatiquement ces réactions sous chaque publication Discord.</span>
            </div>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); cursor: pointer;">
              <input v-model="editForm.autoPoll" type="checkbox" />
              Sondage d'opinion Discord automatique sous l'article
            </label>
          </div>

          <!-- 🚨 Breaking News & Alertes Flash -->
          <div class="form-group" style="background: rgba(237, 66, 69, 0.08); padding: 12px; border-radius: 8px; border: 1px solid rgba(237, 66, 69, 0.3); margin-top: 10px;">
            <div style="font-weight: 600; color: var(--header-primary); font-size: 13px; margin-bottom: 6px;">🚨 Alerte Flash / Breaking News</div>
            <div style="margin-bottom: 8px;">
              <label class="form-label" style="font-size: 11px;">Mots-clés urgents (déclenchent l'embed rouge 🚨 FLASH INFO)</label>
              <input v-model="editForm.breakingKeywordsInput" type="text" class="form-input" placeholder="BREAKING, URGENT, CVE-, 0-DAY" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); cursor: pointer;">
                <input v-model="editForm.bypassQuietHours" type="checkbox" />
                Outrepasser les heures calmes et limites de débit pour les urgences
              </label>
              <div>
                <label class="form-label" style="font-size: 11px;">Rôle prioritaire à mentionner (optionnel)</label>
                <input v-model="editForm.breakingRoleId" type="text" class="form-input" placeholder="ID du rôle (ex: 123456789012345678)" />
              </div>
            </div>
          </div>

          <!-- 🧹 Auto-Purge & Deals Expirés -->
          <div class="form-group" style="background: rgba(88, 101, 242, 0.05); padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle); margin-top: 10px;">
            <div style="font-weight: 600; color: var(--header-primary); font-size: 13px; margin-bottom: 6px;">🧹 Auto-Purge des Messages Discord Expirés</div>
            <label class="form-label" style="font-size: 11px;">Durée de rétention Discord en jours (0 = pas de suppression)</label>
            <input v-model.number="editForm.autoExpireDays" type="number" min="0" max="365" class="form-input" placeholder="Ex: 7" />
            <span class="form-hint" style="font-size: 11px;">Supprime automatiquement le message Discord après expiration du délai.</span>
          </div>

          <!-- 🎙️ Bulletin Vocal / Radio Flash (TTS) -->
          <div class="form-group" style="background: rgba(88, 101, 242, 0.08); padding: 12px; border-radius: 8px; border: 1px solid rgba(88, 101, 242, 0.2); margin-top: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🎙️ Bulletin Vocal / Daily Audio Briefing (TTS)</div>
                <div style="font-size: 12px; color: var(--text-muted);">Génération automatique d'une synthèse radio MP3 des actualités</div>
              </div>
              <input v-model="editForm.enableAudioBriefing" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #5865f2;" />
            </div>
          </div>

          <!-- 🗳️ Votes & Promotion Best-Of -->
          <div class="form-group" style="background: rgba(88, 101, 242, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(88, 101, 242, 0.2); margin-top: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <div>
                <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🗳️ Curation Communautaire (Upvote / Downvote)</div>
                <div style="font-size: 12px; color: var(--text-muted);">Ajoute des boutons 👍 / 👎 Discord interactifs sous les publications</div>
              </div>
              <input v-model="editForm.enableVoting" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #5865f2;" />
            </div>
            <div v-if="editForm.enableVoting" style="display: flex; flex-direction: column; gap: 8px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.1);">
              <div>
                <label class="form-label" style="font-size: 11px;">Seuil de votes positifs pour promotion Best-Of</label>
                <input v-model.number="editForm.bestOfThreshold" type="number" min="1" max="100" class="form-input" placeholder="Ex: 5" />
                <span class="form-hint" style="font-size: 11px;">Nombre net d'upvotes requis pour déclencher la mise en avant automatique.</span>
              </div>
              <div>
                <label class="form-label" style="font-size: 11px;">Salon Discord Best-Of (optionnel, sinon le même salon)</label>
                <DiscordChannelSelect v-model="editForm.bestOfChannelId" placeholder="Salon Best-Of (optionnel)" />
              </div>
            </div>
          </div>

          <!-- 💰 Traqueur de Prix & All-Time Low (ATL) -->
          <div class="form-group" style="background: rgba(245, 158, 11, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.2); margin-top: 10px;">
            <div style="font-weight: 600; color: var(--header-primary); font-size: 13px; margin-bottom: 6px;">💰 Filtre Bons Plans & Suivi Prix (ATL)</div>
            <label class="form-label" style="font-size: 11px;">Réduction minimale en % requise pour publier (0 = désactivé / tous)</label>
            <input v-model.number="editForm.minDiscountPercent" type="number" min="0" max="100" class="form-input" placeholder="Ex: 50 pour ≥ 50% de remise" />
            <span class="form-hint" style="font-size: 11px;">Détecte automatiquement les prix historiques et ajoute le badge 🔥 ATL si nouveau record.</span>
          </div>

          <!-- 🗓️ Synchronisation Événements Programmés Discord -->
          <div class="form-group" style="background: rgba(16, 185, 129, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2); margin-top: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🗓️ Synchronisation Événements Discord</div>
                <div style="font-size: 12px; color: var(--text-muted);">Création automatique d'un GuildScheduledEvent si une date future est détectée</div>
              </div>
              <input v-model="editForm.autoSyncEvents" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981;" />
            </div>
          </div>

          <!-- 🎭 Filtre d'Humeur & Positivité ("Good Vibes Only") -->
          <div class="form-group" style="background: rgba(236, 72, 153, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(236, 72, 153, 0.2); margin-top: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🎭 Good Vibes Only (Filtre Sentiment)</div>
                <div style="font-size: 12px; color: var(--text-muted);">Exclut automatiquement les actualités dramatiques ou anxiogènes dans les salons calmes</div>
              </div>
              <input v-model="editForm.goodVibesOnly" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #ec4899;" />
            </div>
          </div>

          <!-- 🛡️ Bouclier Sécurité & Déplieur d'URLs -->
          <div class="form-group" style="background: rgba(99, 102, 241, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(99, 102, 241, 0.2); margin-top: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🛡️ Bouclier Anti-Phishing & Dépliage d'URLs</div>
                <div style="font-size: 12px; color: var(--text-muted);">Déplie les liens courts (bit.ly, t.co...) et bloque les redirections suspectes</div>
              </div>
              <input v-model="editForm.enableSecurityScan" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #6366f1;" />
            </div>
          </div>

          <!-- 🌐 Traduction Intelligente du Titre en Français -->
          <div class="form-group" style="background: rgba(59, 130, 246, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2); margin-top: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🌐 Traduction des Titres en Français</div>
                <div style="font-size: 12px; color: var(--text-muted);">Traduit automatiquement les titres en langue étrangère (avec badge 🇫🇷)</div>
              </div>
              <input v-model="editForm.translateTitleToFr" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #3b82f6;" />
            </div>
          </div>

          <!-- 🔍 Dé-clickbaiteur & Titres Factuels -->
          <div class="form-group" style="background: rgba(14, 165, 233, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(14, 165, 233, 0.2); margin-top: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🔍 Anti-Clickbait & Titres Factuels</div>
                <div style="font-size: 12px; color: var(--text-muted);">Neutralise les titres racoleurs en reformulations claires et neutres</div>
              </div>
              <input v-model="editForm.antiClickbait" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #0ea5e9;" />
            </div>
          </div>

          <!-- 🛡️ Salle d'Attente & Validation Manuelle -->
          <div class="form-group" style="background: rgba(239, 68, 68, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2); margin-top: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <div>
                <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🛡️ Salle d'Attente & Validation Manuelle</div>
                <div style="font-size: 12px; color: var(--text-muted);">Achemine les actualités vers un salon de modération avant publication</div>
              </div>
              <input v-model="editForm.requireApproval" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #ef4444;" />
            </div>
            <div v-if="editForm.requireApproval" style="padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.1);">
              <label class="form-label" style="font-size: 11px;">Salon de modération Discord</label>
              <DiscordChannelSelect v-model="editForm.moderationChannelId" placeholder="Sélectionner le salon de modération" />
            </div>
          </div>

          <!-- 🤖 Dé-duplication Sémantique Multi-Flux -->
          <div class="form-group" style="background: rgba(168, 85, 247, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(168, 85, 247, 0.2); margin-top: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <div>
                <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🤖 Dé-duplication Multi-Flux (Story Clustering)</div>
                <div style="font-size: 12px; color: var(--text-muted);">Regroupe les doublons d'actualités traitant du même événement</div>
              </div>
              <input v-model="editForm.enableStoryClustering" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #a855f7;" />
            </div>
            <div v-if="editForm.enableStoryClustering" style="padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.1);">
              <label class="form-label" style="font-size: 11px;">Action lors de la détection d'un doublon</label>
              <select v-model="editForm.clusterMode" class="form-select">
                <option value="merge">Fusionner (Ajoute la source liée sous le message initial)</option>
                <option value="skip">Ignorer (Ne pas reposter l'actualité)</option>
              </select>
            </div>
          </div>

          <!-- 🎥 Résumeur Vidéo YouTube Automatique -->
          <div class="form-group" style="background: rgba(220, 38, 38, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(220, 38, 38, 0.2); margin-top: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-weight: 600; color: var(--header-primary); font-size: 13px;">🎥 Résumeur Vidéo YouTube Automatique</div>
                <div style="font-size: 12px; color: var(--text-muted);">Extrait les points clés des vidéos sous forme de synthèse à puces</div>
              </div>
              <input v-model="editForm.enableVideoSummary" type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #dc2626;" />
            </div>
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

    <!-- Modal d'import OPML -->
    <div v-if="showOpmlModal" class="modal-backdrop" @click.self="showOpmlModal = false">
      <div class="modal-card" style="max-width: 520px;">
        <div class="modal-header">
          <h3 style="margin: 0; font-size: 16px; color: var(--header-primary); display: flex; align-items: center; gap: 8px;">
            <span>📥</span> Importer un catalogue OPML
          </h3>
          <button class="close-btn" @click="showOpmlModal = false">✕</button>
        </div>

        <form class="modal-form" @submit.prevent="handleOpmlSubmit">
          <div class="form-group">
            <label class="form-label">Salon Discord cible *</label>
            <DiscordChannelSelect
              v-model="opmlChannelId"
              :required="true"
              placeholder="Sélectionnez le salon de publication..."
            />
            <span class="form-hint">Les flux importés publieront automatiquement dans ce salon.</span>
          </div>

          <div class="form-group">
            <label class="form-label">Fichier OPML (.opml, .xml) *</label>
            <input
              type="file"
              accept=".opml,.xml"
              class="form-input"
              @change="handleOpmlFileChange"
              required
            />
            <span v-if="opmlFileName" class="form-hint" style="color: #57f287;">
              ✓ Fichier sélectionné : {{ opmlFileName }}
            </span>
          </div>

          <div class="modal-footer">
            <button type="button" class="module-btn" @click="showOpmlModal = false">
              Annuler
            </button>
            <button type="submit" class="module-btn primary" :disabled="opmlImporting || !opmlChannelId || !opmlContent">
              <span>{{ opmlImporting ? '⏳ Importation en cours...' : '📥 Lancer l\'import' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Flash Audio -->
    <div v-if="showAudioModal && currentBriefing" class="modal-backdrop" @click.self="showAudioModal = false">
      <div class="modal-card" style="max-width: 520px;">
        <div class="modal-header">
          <h3 style="margin: 0; font-size: 16px; color: var(--header-primary); display: flex; align-items: center; gap: 8px;">
            <span>🎙️</span> Flash Radio : {{ currentBriefing.feedTitle }}
          </h3>
          <button class="close-btn" @click="showAudioModal = false">✕</button>
        </div>
        <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
          <p style="margin: 0; font-size: 13px; color: var(--text-normal); background: var(--background-secondary-alt); padding: 12px; border-radius: 6px; line-height: 1.5;">
            {{ currentBriefing.script }}
          </p>
          <div style="font-size: 12px; color: var(--text-muted);">
            📄 {{ currentBriefing.itemCount }} actualités synthétisées • Fichier : <code>{{ currentBriefing.filename }}</code>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;">
            <a
              :href="`/api/autofeeds/${encodeURIComponent(currentBriefing.feedId)}/audio?download=true`"
              target="_blank"
              class="module-btn primary"
              style="text-decoration: none;"
            >
              <span>📥 Télécharger l'audio MP3</span>
            </a>
            <button class="module-btn" @click="showAudioModal = false">Fermer</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Reader View (Mode Lecture Épuré) -->
    <div v-if="showReaderModal" class="modal-backdrop" @click.self="showReaderModal = false">
      <div class="modal-card" style="max-width: 700px; max-height: 85vh; display: flex; flex-direction: column;">
        <div class="modal-header">
          <h3 style="margin: 0; font-size: 16px; color: var(--header-primary); display: flex; align-items: center; gap: 8px;">
            <span>📖</span> Mode Lecture Épuré (Reader View)
          </h3>
          <button class="close-btn" @click="showReaderModal = false">✕</button>
        </div>

        <div v-if="readerLoading" style="padding: 40px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 32px; margin-bottom: 12px;">⏳</div>
          <div style="font-size: 14px;">Extraction et nettoyage du contenu de l'article en cours...</div>
        </div>

        <div v-else-if="readerArticle" style="padding: 18px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; flex: 1;">
          <div>
            <h2 style="margin: 0 0 8px 0; font-size: 20px; color: var(--header-primary); line-height: 1.35; font-weight: 700;">
              {{ readerArticle.title }}
            </h2>
            <div style="display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--text-muted); flex-wrap: wrap;">
              <span v-if="readerArticle.author">✍️ {{ readerArticle.author }}</span>
              <span v-if="readerArticle.readingTimeMinutes">⏱️ ~{{ readerArticle.readingTimeMinutes }} min de lecture</span>
              <span v-if="readerArticle.publishedAt">📅 {{ new Date(readerArticle.publishedAt).toLocaleDateString() }}</span>
              <a :href="readerArticle.url" target="_blank" rel="noopener noreferrer" style="color: var(--accent-primary); text-decoration: none;">
                🔗 Source originale ↗
              </a>
            </div>
          </div>

          <div v-if="readerArticle.excerpt" style="padding: 10px 14px; background: var(--background-secondary-alt); border-left: 3px solid #5865f2; border-radius: 4px; font-size: 13px; font-style: italic; color: var(--text-normal);">
            {{ readerArticle.excerpt }}
          </div>

          <div v-if="readerArticle.leadImage" style="text-align: center;">
            <img :src="readerArticle.leadImage" alt="Illustration" style="max-width: 100%; max-height: 280px; object-fit: cover; border-radius: 8px;" />
          </div>

          <div style="font-size: 14px; line-height: 1.7; color: var(--text-normal); white-space: pre-wrap; word-break: break-word;">
            {{ readerArticle.content }}
          </div>
        </div>

        <div v-else style="padding: 30px; text-align: center; color: var(--text-muted);">
          <span>Aucun contenu disponible pour cette page.</span>
        </div>

        <div class="modal-footer" style="padding: 12px 20px;">
          <button class="module-btn" @click="showReaderModal = false">Fermer</button>
        </div>
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
const showStreamOptions = ref(false);
const showEditStreamOptions = ref(false);
const submitting = ref(false);

const tagsInput = ref('');
const includeKeywordsInput = ref('');
const excludeKeywordsInput = ref('');

const editingFeed = ref<AutofeedItem | null>(null);
const editTagsInput = ref('');
const editIncludeInput = ref('');
const editExcludeInput = ref('');

const showOpmlModal = ref(false);
const opmlChannelId = ref('');
const opmlContent = ref('');
const opmlFileName = ref('');
const opmlImporting = ref(false);

const purging = ref(false);
const audioLoadingId = ref<string | null>(null);
const showAudioModal = ref(false);
const currentBriefing = ref<{ feedId: string; feedTitle: string; script: string; itemCount: number; filename: string } | null>(null);

const showReaderModal = ref(false);
const readerLoading = ref(false);
const readerArticle = ref<any | null>(null);

const form = ref<any>({
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
  embedColor: '#5865F2',
  customMessage: '',
  pingRoleId: '',
  createThread: false,
  subscriberRoleId: '',
  notificationDelivery: 'channel',
  useWebhook: false,
  enableMediaProxy: false,
  ignoreShorts: false,
  aiSummary: false,
  digestMode: 'realtime' as 'realtime' | 'daily' | 'weekly',
  digestSchedule: '08:00',
  digestChannelId: '',
  enableGamification: false,
  gamificationXpReward: 25,
  channelTagRoutingJson: '',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  quietHoursSuppressMentions: true,
  maxPostsPerHour: 0,
  autoReactionsInput: '',
  autoPoll: false,
  breakingKeywordsInput: '',
  bypassQuietHours: false,
  breakingRoleId: '',
  autoExpireDays: 0,
  enableAudioBriefing: false,
  enableVoting: false,
  bestOfThreshold: 5,
  bestOfChannelId: '',
  minDiscountPercent: 0,
  autoSyncEvents: false,
  goodVibesOnly: false,
  enableSecurityScan: true,
  translateTitleToFr: false,
  antiClickbait: false,
  requireApproval: false,
  moderationChannelId: '',
  enableStoryClustering: false,
  clusterMode: 'merge' as 'merge' | 'skip',
  enableVideoSummary: false
});

const editForm = ref({
  name: '',
  channelId: '',
  category: 'gaming',
  checkIntervalMinutes: 15,
  embedColor: '#5865F2',
  customMessage: '',
  pingRoleId: '',
  createThread: false,
  subscriberRoleId: '',
  notificationDelivery: 'channel' as 'channel' | 'dm' | 'both' | 'role',
  useWebhook: false,
  enableMediaProxy: false,
  ignoreShorts: false,
  aiSummary: false,
  digestMode: 'realtime' as 'realtime' | 'daily' | 'weekly',
  digestSchedule: '08:00',
  digestChannelId: '',
  enableGamification: false,
  gamificationXpReward: 25,
  channelTagRoutingJson: '',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  quietHoursSuppressMentions: true,
  maxPostsPerHour: 0,
  autoReactionsInput: '',
  autoPoll: false,
  breakingKeywordsInput: '',
  bypassQuietHours: false,
  breakingRoleId: '',
  autoExpireDays: 0,
  enableAudioBriefing: false,
  enableVoting: false,
  bestOfThreshold: 5,
  bestOfChannelId: '',
  minDiscountPercent: 0,
  autoSyncEvents: false,
  goodVibesOnly: false,
  enableSecurityScan: true,
  translateTitleToFr: false,
  antiClickbait: false,
  requireApproval: false,
  moderationChannelId: '',
  enableStoryClustering: false,
  clusterMode: 'merge' as 'merge' | 'skip',
  enableVideoSummary: false
});

function isLiveProvider(provider?: string): boolean {
  return ['twitch', 'kick', 'youtube_live'].includes(provider || '');
}

const liveFeedsCount = computed(() => {
  return feeds.value.filter(f => isLiveProvider(f.provider) || f.category === 'live').length;
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
  if (selectedCategory.value === 'live') {
    return feeds.value.filter(f => isLiveProvider(f.provider) || f.category === 'live');
  }
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
  } else if (url.includes('/live') || (url.includes('youtube.com/@') && url.endsWith('/live'))) {
    form.value.name = 'YouTube Live';
    form.value.checkIntervalMinutes = 2;
    showStreamOptions.value = true;
  } else if (url.includes('youtube.com')) form.value.name = 'Vidéos YouTube';
  else if (url.includes('twitch.tv')) {
    form.value.name = 'Twitch Stream';
    form.value.checkIntervalMinutes = 2;
    showStreamOptions.value = true;
  } else if (url.includes('kick.com')) {
    form.value.name = 'Kick Live';
    form.value.checkIntervalMinutes = 2;
    showStreamOptions.value = true;
  } else if (url.includes('news.google.com')) form.value.name = 'Google News';
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
    embedColor: '#5865F2',
    customMessage: '',
    pingRoleId: '',
    createThread: false,
    subscriberRoleId: '',
    notificationDelivery: 'channel',
    useWebhook: false,
    enableMediaProxy: false,
    ignoreShorts: false,
    aiSummary: false,
    digestMode: 'realtime' as 'realtime' | 'daily' | 'weekly',
    digestSchedule: '08:00',
    digestChannelId: '',
    enableGamification: false,
    gamificationXpReward: 25,
    channelTagRoutingJson: '',
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    quietHoursSuppressMentions: true,
    maxPostsPerHour: 0,
    autoReactionsInput: '',
    autoPoll: false,
    breakingKeywordsInput: '',
    bypassQuietHours: false,
    breakingRoleId: '',
    autoExpireDays: 0,
    enableAudioBriefing: false,
    enableVoting: false,
    bestOfThreshold: 5,
    bestOfChannelId: '',
    minDiscountPercent: 0,
    autoSyncEvents: false,
    goodVibesOnly: false,
    enableSecurityScan: true,
    translateTitleToFr: false,
    antiClickbait: false,
    requireApproval: false,
    moderationChannelId: '',
    enableStoryClustering: false,
    clusterMode: 'merge' as 'merge' | 'skip',
    enableVideoSummary: false
  };
  tagsInput.value = '';
  includeKeywordsInput.value = '';
  excludeKeywordsInput.value = '';
  showAdvanced.value = false;
  showStreamOptions.value = false;
  showModal.value = true;
}

function openEditModal(feed: AutofeedItem) {
  editingFeed.value = feed;
  editForm.value = {
    name: feed.name || '',
    channelId: feed.channelId,
    category: feed.category || 'gaming',
    checkIntervalMinutes: feed.checkIntervalMinutes || 15,
    embedColor: feed.color || '#5865F2',
    customMessage: feed.customMessage || '',
    pingRoleId: feed.pingRoleId || '',
    createThread: Boolean(feed.createThread),
    subscriberRoleId: feed.subscriberRoleId || '',
    notificationDelivery: (feed.notificationDelivery as any) || 'channel',
    useWebhook: Boolean(feed.useWebhook),
    enableMediaProxy: Boolean(feed.enableMediaProxy),
    ignoreShorts: Boolean(feed.ignoreShorts),
    aiSummary: Boolean(feed.aiSummary),
    digestMode: (feed.digestMode as any) || 'realtime',
    digestSchedule: feed.digestSchedule || '08:00',
    digestChannelId: feed.digestChannelId || '',
    enableGamification: Boolean(feed.enableGamification),
    gamificationXpReward: feed.gamificationXpReward || 25,
    channelTagRoutingJson: feed.channelTagRouting && Object.keys(feed.channelTagRouting).length > 0 ? JSON.stringify(feed.channelTagRouting, null, 2) : '',
    quietHoursEnabled: Boolean(feed.quietHours?.enabled),
    quietHoursStart: feed.quietHours?.start || '22:00',
    quietHoursEnd: feed.quietHours?.end || '08:00',
    quietHoursSuppressMentions: feed.quietHours?.suppressMentions !== false,
    maxPostsPerHour: feed.maxPostsPerHour || 0,
    autoReactionsInput: (feed.autoReactions || []).join(', '),
    autoPoll: Boolean(feed.autoPoll),
    breakingKeywordsInput: (feed.breakingKeywords || []).join(', '),
    bypassQuietHours: Boolean(feed.bypassQuietHours),
    breakingRoleId: feed.breakingRoleId || '',
    autoExpireDays: feed.autoExpireDays || 0,
    enableAudioBriefing: Boolean(feed.enableAudioBriefing),
    enableVoting: Boolean(feed.enableVoting),
    bestOfThreshold: feed.bestOfThreshold || 5,
    bestOfChannelId: feed.bestOfChannelId || '',
    minDiscountPercent: feed.minDiscountPercent || 0,
    autoSyncEvents: Boolean(feed.autoSyncEvents),
    goodVibesOnly: Boolean(feed.goodVibesOnly),
    enableSecurityScan: feed.enableSecurityScan !== false,
    translateTitleToFr: Boolean(feed.translateTitleToFr),
    antiClickbait: Boolean(feed.antiClickbait),
    requireApproval: Boolean(feed.requireApproval),
    moderationChannelId: feed.moderationChannelId || '',
    enableStoryClustering: Boolean(feed.enableStoryClustering),
    clusterMode: feed.clusterMode || 'merge',
    enableVideoSummary: Boolean(feed.enableVideoSummary)
  };
  editTagsInput.value = (feed.tags || []).join(', ');
  editIncludeInput.value = (feed.filterKeywords || []).join(', ');
  editExcludeInput.value = (feed.excludeKeywords || []).join(', ');
  showEditStreamOptions.value = isLiveProvider(feed.provider);
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

    let tagRouting = {};
    if (form.value.channelTagRoutingJson) {
      try { tagRouting = JSON.parse(form.value.channelTagRoutingJson); } catch {}
    }

    const parsedAutoReactions = (form.value.autoReactionsInput || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    const parsedBreakingKeywords = (form.value.breakingKeywordsInput || '')
      .split(',')
      .map((s: string) => s.trim().toUpperCase())
      .filter(Boolean);

    const payload = {
      ...form.value,
      autoReactions: parsedAutoReactions,
      autoPoll: Boolean(form.value.autoPoll),
      breakingKeywords: parsedBreakingKeywords,
      bypassQuietHours: Boolean(form.value.bypassQuietHours),
      breakingRoleId: form.value.breakingRoleId || undefined,
      autoExpireDays: Number(form.value.autoExpireDays || 0),
      enableAudioBriefing: Boolean(form.value.enableAudioBriefing),
      enableVoting: Boolean(form.value.enableVoting),
      bestOfThreshold: Number(form.value.bestOfThreshold || 5),
      bestOfChannelId: form.value.bestOfChannelId || undefined,
      minDiscountPercent: Number(form.value.minDiscountPercent || 0),
      autoSyncEvents: Boolean(form.value.autoSyncEvents),
      goodVibesOnly: Boolean(form.value.goodVibesOnly),
      enableSecurityScan: Boolean(form.value.enableSecurityScan),
      translateTitleToFr: Boolean(form.value.translateTitleToFr),
      antiClickbait: Boolean(form.value.antiClickbait),
      requireApproval: Boolean(form.value.requireApproval),
      moderationChannelId: form.value.moderationChannelId || undefined,
      enableStoryClustering: Boolean(form.value.enableStoryClustering),
      clusterMode: form.value.clusterMode || 'merge',
      enableVideoSummary: Boolean(form.value.enableVideoSummary),
      channelTagRouting: tagRouting,
      quietHours: {
        enabled: form.value.quietHoursEnabled,
        start: form.value.quietHoursStart,
        end: form.value.quietHoursEnd,
        suppressMentions: form.value.quietHoursSuppressMentions
      }
    };

    const created = await autofeedsApi.createFeed(payload as any);
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

    let editTagRouting = {};
    if (editForm.value.channelTagRoutingJson) {
      try { editTagRouting = JSON.parse(editForm.value.channelTagRoutingJson); } catch {}
    }

    const parsedEditAutoReactions = (editForm.value.autoReactionsInput || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    const parsedEditBreakingKeywords = (editForm.value.breakingKeywordsInput || '')
      .split(',')
      .map((s: string) => s.trim().toUpperCase())
      .filter(Boolean);

    const updated = await autofeedsApi.updateFeed(editingFeed.value.id, {
      name: editForm.value.name,
      channelId: editForm.value.channelId,
      category: editForm.value.category,
      checkIntervalMinutes: editForm.value.checkIntervalMinutes,
      color: editForm.value.embedColor,
      customMessage: editForm.value.customMessage || undefined,
      pingRoleId: editForm.value.pingRoleId || undefined,
      createThread: editForm.value.createThread,
      subscriberRoleId: editForm.value.subscriberRoleId || undefined,
      notificationDelivery: editForm.value.notificationDelivery,
      useWebhook: editForm.value.useWebhook,
      enableMediaProxy: editForm.value.enableMediaProxy,
      ignoreShorts: editForm.value.ignoreShorts,
      aiSummary: editForm.value.aiSummary,
      digestMode: editForm.value.digestMode,
      digestSchedule: editForm.value.digestSchedule,
      digestChannelId: editForm.value.digestChannelId || null,
      enableGamification: editForm.value.enableGamification,
      gamificationXpReward: editForm.value.gamificationXpReward,
      channelTagRouting: editTagRouting,
      quietHours: {
        enabled: editForm.value.quietHoursEnabled,
        start: editForm.value.quietHoursStart,
        end: editForm.value.quietHoursEnd,
        suppressMentions: editForm.value.quietHoursSuppressMentions
      },
      maxPostsPerHour: editForm.value.maxPostsPerHour,
      autoReactions: parsedEditAutoReactions,
      autoPoll: Boolean(editForm.value.autoPoll),
      breakingKeywords: parsedEditBreakingKeywords,
      bypassQuietHours: Boolean(editForm.value.bypassQuietHours),
      breakingRoleId: editForm.value.breakingRoleId || undefined,
      autoExpireDays: Number(editForm.value.autoExpireDays || 0),
      enableAudioBriefing: Boolean(editForm.value.enableAudioBriefing),
      enableVoting: Boolean(editForm.value.enableVoting),
      bestOfThreshold: Number(editForm.value.bestOfThreshold || 5),
      bestOfChannelId: editForm.value.bestOfChannelId || null,
      minDiscountPercent: Number(editForm.value.minDiscountPercent || 0),
      autoSyncEvents: Boolean(editForm.value.autoSyncEvents),
      goodVibesOnly: Boolean(editForm.value.goodVibesOnly),
      enableSecurityScan: Boolean(editForm.value.enableSecurityScan),
      translateTitleToFr: Boolean(editForm.value.translateTitleToFr),
      antiClickbait: Boolean(editForm.value.antiClickbait),
      requireApproval: Boolean(editForm.value.requireApproval),
      moderationChannelId: editForm.value.moderationChannelId || null,
      enableStoryClustering: Boolean(editForm.value.enableStoryClustering),
      clusterMode: editForm.value.clusterMode || 'merge',
      enableVideoSummary: Boolean(editForm.value.enableVideoSummary),
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

function openOpmlModal() {
  opmlChannelId.value = '';
  opmlContent.value = '';
  opmlFileName.value = '';
  showOpmlModal.value = true;
}

function handleOpmlFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target?.files?.[0];
  if (!file) return;
  opmlFileName.value = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    opmlContent.value = (e.target?.result as string) || '';
  };
  reader.readAsText(file);
}

async function handleOpmlSubmit() {
  if (!opmlChannelId.value || !opmlContent.value) {
    showToast('Veuillez sélectionner un salon Discord et charger un fichier OPML.', 'warning');
    return;
  }
  opmlImporting.value = true;
  try {
    const res = await autofeedsApi.importOpml(opmlChannelId.value, opmlContent.value);
    showToast(`✅ ${res.importedCount} flux importé(s) avec succès !`, 'success');
    showOpmlModal.value = false;
    await loadData();
  } catch (err: any) {
    showToast(`Erreur lors de l'import OPML : ${err.message}`, 'error');
  } finally {
    opmlImporting.value = false;
  }
}

async function handleOpmlExport() {
  try {
    const xml = await autofeedsApi.exportOpml();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autofeeds-export-${Date.now()}.opml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Export OPML téléchargé avec succès !', 'success');
  } catch (err: any) {
    showToast(`Erreur lors de l'export OPML : ${err.message}`, 'error');
  }
}

async function handlePurgeExpired() {
  if (!confirm('Voulez-vous vraiment purger les publications expirées et supprimer les messages Discord correspondants ?')) {
    return;
  }
  purging.value = true;
  try {
    const res = await autofeedsApi.purgeExpired();
    showToast(`🧹 Purge terminée : ${res.expiredCount} publication(s) expirée(s), ${res.deletedMessagesCount} message(s) supprimé(s).`, 'success');
  } catch (err: any) {
    showToast(`Erreur lors de la purge : ${err.message}`, 'error');
  } finally {
    purging.value = false;
  }
}

async function handleAudioBriefing(feed: any) {
  audioLoadingId.value = feed.id;
  try {
    const briefing = await autofeedsApi.getAudioBriefing(feed.id, 5);
    currentBriefing.value = briefing;
    showAudioModal.value = true;
  } catch (err: any) {
    showToast(`Impossible de générer le flash audio : ${err.message}`, 'error');
  } finally {
    audioLoadingId.value = null;
  }
}

async function openReaderModal(url?: string) {
  if (!url) {
    showToast('Aucune URL valide pour ce flux.', 'warning');
    return;
  }
  readerLoading.value = true;
  showReaderModal.value = true;
  readerArticle.value = null;
  try {
    const article = await autofeedsApi.getReaderArticle(url);
    readerArticle.value = article;
  } catch (err: any) {
    showToast(`Impossible d'extraire la vue lecture : ${err.message}`, 'error');
    showReaderModal.value = false;
  } finally {
    readerLoading.value = false;
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
.live-pill {
  border-color: rgba(237, 66, 69, 0.4);
}
.live-pill.active {
  background: rgba(237, 66, 69, 0.2);
  color: #ed4245;
  border-color: #ed4245;
}
.live-wrap {
  box-shadow: 0 0 10px rgba(237, 66, 69, 0.35);
  border: 1px solid rgba(237, 66, 69, 0.5);
}
.live-indicator-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(237, 66, 69, 0.18);
  color: #ed4245;
  border: 1px solid rgba(237, 66, 69, 0.4);
  text-transform: uppercase;
}
.stream-section {
  border: 1px solid rgba(237, 66, 69, 0.3);
  border-radius: 6px;
  background: var(--background-secondary);
}
.stream-toggle {
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #ed4245;
  cursor: pointer;
  user-select: none;
}
.stream-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid var(--border-subtle);
}
.interval-quick-btn {
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--background-secondary-alt);
  border: 1px solid var(--border-subtle);
  color: var(--text-normal);
  font-size: 12px;
  cursor: pointer;
}
.interval-quick-btn.active {
  background: rgba(88, 101, 242, 0.2);
  border-color: var(--brand-experiment, #5865f2);
  color: #fff;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
</style>
