/**
 * GeoPedia Country Panel Module
 * Handles the country information sidebar/bottom-sheet UI
 */

const GeoCountryPanel = (() => {
    'use strict';

    // ============================================
    // STATE
    // ============================================
    
    let panel = null;
    let currentCountry = null;
    let isLoading = false;

    // ============================================
    // INITIALIZATION
    // ============================================
    
    /**
     * Initialize the country panel
     */
    function init() {
        panel = document.getElementById('country-panel');
        
        if (!panel) {
            console.error('Country panel element not found');
            return;
        }
        
        // Setup close button
        const closeBtn = document.getElementById('panel-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', hide);
        }
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !isHidden()) {
                hide();
            }
        });
        
        // Close on backdrop click (for mobile overlay)
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                hide();
            }
        });
        
        console.log('Country panel initialized');
    }

    /**
     * Check if panel is hidden
     */
    function isHidden() {
        return panel ? panel.classList.contains('hidden') : true;
    }

    // ============================================
    // SHOW / HIDE
    // ============================================
    
    /**
     * Show the panel with loading state, then load data
     * @param {string} isoA2 - Country ISO_A2 code
     */
    async function show(isoA2) {
        if (!isoA2 || isLoading) return;
        
        isLoading = true;
        currentCountry = isoA2;
        
        // Show panel with loading state
        panel.classList.remove('hidden');
        showPanelLoading(true);
        
        try {
            // Fetch all data in parallel for speed
            const [restCountriesData, wikiData, curatedData] = await Promise.all([
                fetchRestCountryData(isoA2),
                GeoDataSources.fetchWikipediaInfo(null, isoA2),  // Will use cached or skip
                GeoDataSources.loadCuratedData(isoA2)
            ]);
            
            if (!restCountriesData) {
                throw new Error(`Data negara ${isoA2} tidak ditemukan`);
            }
            
            // We need the actual country name for Wikipedia fetch
            const countryName = restCountriesData.name.common;
            
            // Fetch Wikipedia with correct name if not cached
            let finalWikiData = wikiData;
            if (!wikiData.thumbnail && !wikiData.extract) {
                finalWikiData = await GeoDataSources.fetchWikipediaInfo(countryName, isoA2);
            }
            
            // Build complete data object
            const countryData = GeoDataSources.buildCountryData(
                restCountriesData,
                finalWikiData,
                curatedData
            );
            
            // Render to panel
            renderCountryData(countryData);
            
        } catch (error) {
            console.error('Failed to load country data:', error);
            showErrorState(error.message);
        } finally {
            isLoading = false;
            showPanelLoading(false);
        }
    }

    /**
     * Hide the panel
     */
    function hide() {
        if (panel) {
            panel.classList.add('hidden');
        }
        currentCountry = null;
    }

    /**
     * Toggle panel visibility
     */
    function toggle(isoA2) {
        if (currentCountry === isoA2 && !isHidden()) {
            hide();
        } else {
            show(isoA2);
        }
    }

    // ============================================
    // DATA FETCHING HELPERS
    // ============================================
    
    /**
     * Get REST Countries data for a specific country from cache
     * @param {string} isoA2 - Country code
     * @returns {Promise<Object|null>}
     */
    async function fetchRestCountryData(isoA2) {
        try {
            // Try cache first
            const cached = GeoDataSources.CacheManager.get('restcountries_cache');
            if (cached && Array.isArray(cached)) {
                const country = cached.find(c => c.cca2 === isoA2.toUpperCase());
                if (country) return country;
            }
            
            // If not in cache, we need to fetch all (this shouldn't happen normally)
            const allCountries = await GeoDataSources.fetchAllCountries();
            return allCountries.find(c => c.cca2 === isoA2.toUpperCase()) || null;
            
        } catch (error) {
            console.error('Error fetching country data:', error);
            return null;
        }
    }

    // ============================================
    // RENDERING
    // ============================================
    
    /**
     * Render complete country data to the panel
     * @param {Object} data - Country data object from buildCountryData()
     */
    function renderCountryData(data) {
        // Hero image/flag
        const imageEl = document.getElementById('panel-image');
        const flagEl = document.getElementById('panel-flag');
        
        if (imageEl) {
            imageEl.src = data.foto_url;
            imageEl.alt = `Foto ${data.nama}`;
            imageEl.onerror = () => {
                imageEl.src = data.bendera_url;  // Fallback to flag
            };
        }
        
        if (flagEl) {
            flagEl.src = data.bendera_url;
            flagEl.alt = `Bendera ${data.nama}`;
        }
        
        // Basic info
        setTextContent('panel-country-name', data.nama);
        setTextContent('panel-capital', data.ibu_kota);
        setTextContent('panel-population', data.populasi_formatted);
        setTextContent('panel-area', data.luas_formatted);
        setTextContent('panel-region', `${data.region} - ${data.subregion}`);
        setTextContent('panel-languages', data.bahasa.join(', '));
        setTextContent('panel-currencies', data.mata_uang.join(', '));
        
        // Description
        setTextContent('panel-description', data.deskripsi);
        
        // Wikipedia link
        const wikiLink = document.getElementById('wiki-link');
        if (wikiLink) {
            wikiLink.href = data.wiki_url || '#';
        }
        
        // Video section
        renderVideoSection(data);
        
        // Geographic advantages/disadvantages & facts
        renderFactList('panel-advantages', data.keuntungan_geografis, 'Belum ada informasi keuntungan geografis.');
        renderFactList('panel-disadvantages', data.kerugian_geografis, 'Belum ada informasi tantangan geografis.');
        renderFactList('panel-facts', data.fakta_unik, 'Belum ada fakta unik untuk negara ini.');
        
        // Scroll to top of panel content
        const content = panel.querySelector('.panel-content');
        if (content) {
            content.scrollTop = 0;
        }
    }

    /**
     * Render video section (YouTube embed or fallback link)
     * @param {Object} data - Country data
     */
    function renderVideoSection(data) {
        const videoContainer = document.getElementById('video-container');
        const iframe = document.getElementById('youtube-iframe');
        const fallbackLink = document.getElementById('youtube-fallback');
        
        if (data.has_video && data.youtube_embed_url) {
            // Show video embed
            if (videoContainer) videoContainer.classList.remove('hidden');
            if (fallbackLink) fallbackLink.classList.add('hidden');
            
            if (iframe) {
                iframe.src = data.youtube_embed_url;
                iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
                iframe.setAttribute('allowfullscreen', '');
            }
        } else {
            // Show fallback search link
            if (videoContainer) videoContainer.classList.add('hidden');
            if (fallbackLink) {
                fallbackLink.classList.remove('hidden');
                fallbackLink.href = data.youtube_search_url || '#';
            }
            
            // Clear iframe src to stop any playing video
            if (iframe) {
                iframe.src = '';
            }
        }
    }

    /**
     * Render a fact list (advantages, disadvantages, or fun facts)
     * @param {string} elementId - ID of the list element
     * @param {Array} items - Array of strings
     * @param {string} emptyMessage - Message when array is empty
     */
    function renderFactList(elementId, items, emptyMessage) {
        const listEl = document.getElementById(elementId);
        if (!listEl) return;
        
        listEl.innerHTML = '';
        
        if (!items || items.length === 0) {
            const li = document.createElement('li');
            li.textContent = emptyMessage;
            li.style.fontStyle = 'italic';
            li.style.color = 'var(--color-text-light)';
            listEl.appendChild(li);
            return;
        }
        
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            listEl.appendChild(li);
        });
    }

    /**
     * Set text content safely
     */
    function setTextContent(elementId, text) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = text || 'N/A';
        }
    }

    /**
     * Show/hide loading state within panel
     */
    function showPanelLoading(show) {
        const content = panel?.querySelector('.panel-content');
        if (content) {
            if (show) {
                content.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px;">
                        <div class="loading-spinner"></div>
                        <p style="margin-top: 16px; font-family: var(--font-display); color: var(--color-text-light);">
                            Memuat informasi...
                        </p>
                    </div>
                `;
            }
        }
    }

    /**
     * Show error state in panel
     */
    function showErrorState(message) {
        const content = panel?.querySelector('.panel-content');
        if (content) {
            content.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 16px;">😅</div>
                    <h3 style="font-family: var(--font-display); color: var(--color-text); margin-bottom: 8px;">
                        Oops! Ada Masalah
                    </h3>
                    <p style="color: var(--color-text-light); max-width: 280px;">
                        ${message || 'Gagal memuat data negara. Coba lagi nanti ya!'}
                    </p>
                    <button onclick="GeoCountryPanel.hide()" 
                            style="margin-top: 20px; padding: 10px 24px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-full); font-weight: 600; cursor: pointer;">
                        Tutup
                    </button>
                </div>
            `;
        }
    }

    // ============================================
    // PUBLIC API
    // ============================================
    
    return {
        init,
        show,
        hide,
        toggle,
        isHidden,
        getCurrentCountry: () => currentCountry
    };
})();

// Make available globally
window.GeoCountryPanel = GeoCountryPanel;
