/**
 * GeoPedia - Main Application Entry Point
 * Initializes all modules and handles user interactions
 */

(function() {
    'use strict';

    // ============================================
    // APPLICATION STATE
    // ============================================
    
    const AppState = {
        isInitialized: false,
        countriesData: [],  // All countries from REST Countries API
        namaIndonesia: {},  // ISO_A2 -> Indonesian name mapping
        isLoading: true,
        activeLayer: {
            countries: true,
            mountains: false,
            rivers: false,
            lakes: false,
            seas: false
        }
    };

    // ============================================
    // INITIALIZATION
    // ============================================
    
    /**
     * Main initialization function
     * Called when DOM is ready
     */
    async function init() {
        console.log('🌍 GeoPedia starting up...');
        
        try {
            // Initialize all modules
            GeoCountryPanel.init();
            GeoFeaturePanel.init();
            
            // Initialize map renderer with callbacks
            GeoMapRenderer.init('map-container', {
                onCountryClick: handleCountryClick,
                onFeatureClick: handleFeatureClick
            });
            
            // Setup UI event listeners
            setupEventListeners();
            
            // Load initial data
            await loadInitialData();
            
            // Mark as initialized
            AppState.isInitialized = true;
            AppState.isLoading = false;
            
            console.log('✅ GeoPedia initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize GeoPedia:', error);
            showToast('Gagal memuat aplikasi. Coba refresh halaman.', 'error');
        }
    }

    /**
     * Load initial data (countries + render map)
     */
    async function loadInitialData() {
        try {
            showMapLoading(true);
            
            // Fetch all data in parallel (including Indonesian names)
            const [countriesGeoJSON, restCountries, namaIndonesia] = await Promise.all([
                GeoDataSources.loadGeoJSON('countries'),
                GeoDataSources.fetchAllCountries(),
                fetch('data/nama-indonesia.json').then(r => r.json()).catch(() => ({}))
            ]);

            // Store Indonesian name mapping
            AppState.namaIndonesia = namaIndonesia;
            
            // Store REST Countries data for search
            AppState.countriesData = restCountries;
            
            // Render countries on map
            GeoMapRenderer.renderCountries(countriesGeoJSON);
            
            // Hide loading indicator
            showMapLoading(false);
            
            // Show welcome message after first load
            setTimeout(() => {
                showToast('Selamat datang di GeoPedia! Klik negara untuk menjelajahi. 🌍', 'success');
            }, 500);
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            showMapLoading(false);
            showToast('Gagal memuat peta. Periksa koneksi internet Anda.', 'error');
        }
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================
    
    function setupEventListeners() {
        // Layer toggle buttons
        document.querySelectorAll('.layer-btn').forEach(btn => {
            btn.addEventListener('click', handleLayerToggle);
        });
        
        // Zoom controls
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const zoomResetBtn = document.getElementById('zoom-reset');
        
        if (zoomInBtn) zoomInBtn.addEventListener('click', () => GeoMapRenderer.zoomIn());
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => GeoMapRenderer.zoomOut());
        if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => GeoMapRenderer.resetZoom());
        
        // Random country button
        const randomBtn = document.getElementById('random-btn');
        if (randomBtn) {
            randomBtn.addEventListener('click', handleRandomCountry);
        }
        
        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(handleSearchInput, 200));
            searchInput.addEventListener('focus', () => {
                if (searchInput.value.length > 0) {
                    handleSearchInput.call(searchInput);
                }
            });
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    hideSearchResults();
                    searchInput.blur();
                }
            });
        }
        
        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            const searchBox = e.target.closest('.search-box');
            if (!searchBox) {
                hideSearchResults();
            }
        });
        
        // Window resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                GeoMapRenderer.resize();
            }, 250);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput?.focus();
            }
            // R for random country (when not in input)
            if (e.key === 'r' && !isInputElement(document.activeElement)) {
                e.preventDefault();
                handleRandomCountry();
            }
            // Escape to close panels
            if (e.key === 'Escape') {
                GeoFeaturePanel.hide();
            }
        });
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================
    
    /**
     * Handle layer toggle button click
     * @param {Event} event
     */
    async function handleLayerToggle(event) {
        const btn = event.currentTarget;
        const layerType = btn.dataset.layer;
        
        if (!layerType) return;
        
        // Toggle state
        AppState.activeLayer[layerType] = !AppState.activeLayer[layerType];
        
        // Update button appearance
        btn.classList.toggle('active', AppState.activeLayer[layerType]);
        
        // Toggle layer visibility (with lazy load)
        await GeoMapRenderer.toggleLayer(layerType, AppState.activeLayer[layerType]);
        
        // Show feedback
        const layerNames = {
            countries: 'Negara',
            mountains: 'Gunung',
            rivers: 'Sungai',
            lakes: 'Danau',
            seas: 'Laut & Selat'
        };
        
        if (AppState.activeLayer[layerType]) {
            showToast(`Layer ${layerNames[layerType]} ditampilkan`, 'info');
        }
    }

    /**
     * Handle country click on map
     * @param {Object} countryInfo - Country info from map renderer
     */
    function handleCountryClick(countryInfo) {
        if (!countryInfo || !countryInfo.isoA2) return;
        
        // Zoom to country slightly
        if (countryInfo.coordinates) {
            GeoMapRenderer.zoomToCountry(countryInfo.coordinates);
        }
        
        // Highlight country on map
        GeoMapRenderer.highlightCountry(countryInfo.isoA2);
        
        // Show country panel
        GeoCountryPanel.show(countryInfo.isoA2);
        
        // Hide feature panel if open
        GeoFeaturePanel.hide();
    }

    /**
     * Handle geographic feature click on map
     * @param {Object} featureInfo - Feature info from map renderer
     */
    function handleFeatureClick(featureInfo) {
        if (!featureInfo) return;
        
        // Show feature info panel
        GeoFeaturePanel.show(featureInfo.type, featureInfo.name);
    }

    /**
     * Handle random country button click
     */
    function handleRandomCountry() {
        if (AppState.countriesData.length === 0) {
            showToast('Data negara belum dimuat. Tunggu sebentar...', 'warning');
            return;
        }
        
        // Pick a random country
        const randomIndex = Math.floor(Math.random() * AppState.countriesData.length);
        const randomCountry = AppState.countriesData[randomIndex];
        
        if (!randomCountry || !randomCountry.cca2) {
            showToast('Gagal memilih negara acak. Coba lagi!', 'error');
            return;
        }
        
        // Get coordinates from REST Countries data
        const coordinates = randomCountry.latlng;  // [lat, lng]
        
        // Convert to [lng, lat] format expected by zoomToCountry
        const lngLat = coordinates ? [coordinates[1], coordinates[0]] : null;
        
        // Zoom to country
        GeoMapRenderer.zoomToCountry(lngLat, 4);
        
        // Highlight and show panel
        GeoMapRenderer.highlightCountry(randomCountry.cca2);
        GeoCountryPanel.show(randomCountry.cca2);
        
        // Fun animation feedback
        const randomBtn = document.getElementById('random-btn');
        if (randomBtn) {
            randomBtn.style.transform = 'scale(1.1) rotate(5deg)';
            setTimeout(() => {
                randomBtn.style.transform = '';
            }, 300);
        }
        
        showToast(`🎲 Kamu mendapat ${randomCountry.name.common}!`, 'success');
    }

    /**
     * Handle search input
     */
    function handleSearchInput() {
        const input = this;
        const query = input.value.trim().toLowerCase();
        const resultsContainer = document.getElementById('search-results');
        
        if (!resultsContainer) return;
        
        // Clear results if query is empty
        if (query.length < 2) {
            hideSearchResults();
            return;
        }
        
        // Filter countries by name (Indonesian, English, or native)
        const matches = AppState.countriesData.filter(country => {
            const nameCommon = (country.name.common || '').toLowerCase();
            const nameNative = Object.values(country.name.native || {})
                .map(n => n.common || '')
                .join(' ')
                .toLowerCase();
            const cca2 = (country.cca2 || '').toLowerCase();
            const cca3 = (country.cca3 || '').toLowerCase();
            const namaID = (AppState.namaIndonesia[country.cca2] || '').toLowerCase();
            
            return namaID.includes(query) ||
                   nameCommon.includes(query) ||
                   nameNative.includes(query) ||
                   cca2.includes(query) ||
                   cca3.includes(query);
        }).slice(0, 8);  // Limit to 8 results
        
        // Render results
        if (matches.length === 0) {
            resultsContainer.innerHTML = `
                <div style="padding: 16px; text-align: center; color: var(--color-text-light);">
                    Negara tidak ditemukan 😕
                </div>
            `;
        } else {
            resultsContainer.innerHTML = matches.map(country => {
                const flagUrl = `https://flagcdn.com/w40/${country.cca2.toLowerCase()}.png`;
                const namaID = AppState.namaIndonesia[country.cca2] || country.name.common;
                const namaEN = (AppState.namaIndonesia[country.cca2]) ? country.name.common : '';
                return `
                    <div class="search-result-item" 
                         data-iso-a2="${country.cca2}" 
                         data-name="${escapeHtml(namaID)}"
                         tabindex="0"
                         role="button">
                        <img src="${flagUrl}" alt="" class="search-result-flag" loading="lazy">
                        <div>
                            <div class="search-result-name">${escapeHtml(namaID)}</div>
                            ${namaEN ? `<div class="search-result-region">${escapeHtml(namaEN)}</div>` : `<div class="search-result-region">${escapeHtml(country.region || '')} • ${escapeHtml(country.subregion || '')}</div>`}
                        </div>
                    </div>
                `;
            }).join('');
            
            // Add click handlers to results
            resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => selectSearchResult(item));
                item.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectSearchResult(item);
                    }
                });
            });
        }
        
        resultsContainer.classList.remove('hidden');
    }

    /**
     * Handle selecting a search result
     * @param {HTMLElement} resultItem - The clicked result element
     */
    function selectSearchResult(resultItem) {
        const isoA2 = resultItem.dataset.isoA2;
        const name = resultItem.dataset.name;
        
        if (!isoA2) return;
        
        // Find country coordinates
        const country = AppState.countriesData.find(c => c.cca2 === isoA2);
        const coordinates = country?.latlng ? [country.latlng[1], country.latlng[0]] : null;
        
        // Zoom to country
        GeoMapRenderer.zoomToCountry(coordinates, 4);
        
        // Highlight and show panel
        GeoMapRenderer.highlightCountry(isoA2);
        GeoCountryPanel.show(isoA2);
        
        // Clean up search
        hideSearchResults();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
            searchInput.blur();
        }
        
        showToast(`Menampilkan ${name}`, 'info');
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    /**
     * Hide search results dropdown
     */
    function hideSearchResults() {
        const results = document.getElementById('search-results');
        if (results) {
            results.classList.add('hidden');
            results.innerHTML = '';
        }
    }

    /**
     * Show/hide map loading indicator
     */
    function showMapLoading(show) {
        GeoMapRenderer.showLoading(show);
        AppState.isLoading = show;
    }

    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.className = `toast ${type}`;
        
        // Auto-hide after 4 seconds
        clearTimeout(toast._hideTimeout);
        toast._hideTimeout = setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }

    /**
     * Debounce utility function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Escape HTML special characters
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Check if element is an input/textarea
     */
    function isInputElement(element) {
        if (!element) return false;
        const tag = element.tagName.toLowerCase();
        return tag === 'input' || tag === 'textarea' || tag === 'select' || element.isContentEditable;
    }

    // ============================================
    // START APPLICATION
    // ============================================
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded
        init();
    }

})();
