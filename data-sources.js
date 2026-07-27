/**
 * GeoPedia Data Sources Module
 * Handles all external API calls, caching, and data management
 * No API keys required - all sources are free and public
 */

const GeoDataSources = (() => {
    'use strict';

    // ============================================
    // ISO CODE NORMALIZATION (synced with map-render.js)
    // ============================================
    
    const ISO_CODE_NORMALIZE = {
        'FRA': 'FR', 'NOR': 'NO', 'ATA': 'AQ',
        'ABW': 'AW', 'AGO': 'AO', 'ALD': 'AX', 'AND': 'AD', 'ARE': 'AE',
        'ARM': 'AM', 'ATF': 'TF', 'ATG': 'AG', 'AUT': 'AT', 'BDI': 'BI',
        'BEN': 'BJ', 'BGD': 'BD', 'BHS': 'BS', 'BIH': 'BA', 'BLR': 'BY',
        'BLZ': 'BZ', 'BRB': 'BB', 'BRN': 'BN', 'CAF': 'CF', 'CHE': 'CH',
        'CMR': 'CM', 'COG': 'CG', 'COL': 'CO', 'CRI': 'CR', 'CUB': 'CU',
        'CYP': 'CY', 'CZE': 'CZ', 'DEU': 'DE', 'DNK': 'DK', 'EGY': 'EG',
        'ERI': 'ER', 'ESP': 'ES', 'EST': 'EE', 'ETH': 'ET', 'FIN': 'FI',
        'FJI': 'FJ', 'FRO': 'FO', 'GAB': 'GA', 'GBR': 'GB', 'GEO': 'GE',
        'GHA': 'GH', 'GIN': 'GN', 'GMB': 'GM', 'GNB': 'GW', 'GRC': 'GR',
        'GRD': 'GD', 'GRL': 'GL', 'GTM': 'GT', 'GUY': 'GY', 'HND': 'HN',
        'HRV': 'HR', 'HTI': 'HT', 'HUN': 'HU', 'IDN': 'ID', 'IND': 'IN',
        'IRL': 'IE', 'IRN': 'IR', 'IRQ': 'IQ', 'ISL': 'IS', 'ISR': 'IL',
        'ITA': 'IT', 'JAM': 'JM', 'JOR': 'JO', 'JPN': 'JP', 'KAZ': 'KZ',
        'KEN': 'KE', 'KGZ': 'KG', 'LAO': 'LA', 'LBN': 'LB', 'LBR': 'LR',
        'LBY': 'LY', 'LIE': 'LI', 'LKA': 'LK', 'LSO': 'LS', 'LTU': 'LT',
        'LUX': 'LU', 'LVA': 'LV', 'MAR': 'MA', 'MCO': 'MC', 'MDA': 'MD',
        'MDV': 'MV', 'MEX': 'MX', 'MKD': 'MK', 'MLI': 'ML', 'MLT': 'MT',
        'MNE': 'ME', 'MNG': 'MN', 'MOZ': 'MZ', 'MRT': 'MR', 'MUS': 'MU',
        'MWI': 'MW', 'MYS': 'MY', 'NAM': 'NA', 'NIC': 'NI', 'NLD': 'NL',
        'NER': 'NE', 'NGA': 'NG', 'NOR': 'NO', 'NPL': 'NP', 'NZL': 'NZ',
        'OMN': 'OM', 'PAK': 'PK', 'PAN': 'PA', 'PER': 'PE', 'PHL': 'PH',
        'PLW': 'PW', 'PNG': 'PG', 'POL': 'PL', 'PRI': 'PR', 'PRK': 'KP',
        'PRT': 'PT', 'PRY': 'PY', 'QAT': 'QA', 'ROU': 'RO', 'RUS': 'RU',
        'RWA': 'RW', 'SAU': 'SA', 'SDN': 'SD', 'SEN': 'SN', 'SGP': 'SG',
        'SLB': 'SB', 'SLE': 'SL', 'SLV': 'SV', 'SMR': 'SM', 'SOM': 'SO',
        'SRB': 'RS', 'SUR': 'SR', 'SVK': 'SK', 'SVN': 'SI', 'SWE': 'SE',
        'SWZ': 'SZ', 'SYR': 'SY', 'TCD': 'TD', 'TGO': 'TG', 'THA': 'TH',
        'TJK': 'TJ', 'TKM': 'TM', 'TLS': 'TL', 'TON': 'TO', 'TTO': 'TT',
        'TUN': 'TN', 'TUR': 'TR', 'TUV': 'TV', 'TZA': 'TZ', 'UGA': 'UG',
        'UKR': 'UA', 'URY': 'UY', 'USA': 'US', 'UZB': 'UZ', 'VEN': 'VE',
        'VNM': 'VN', 'VUT': 'VU', 'WSM': 'WS', 'YEM': 'YE', 'ZAF': 'ZA',
        'ZMB': 'ZM', 'ZWE': 'ZW',
        // Obscure territories without standard ISO_A2 — mapped to custom codes
        'ATC': 'X1',  // Ashmore and Cartier Islands
        'CYN': 'X2',  // Northern Cyprus
        'IOA': 'X3',  // British Indian Ocean Territory (alternate code)
        'KAS': 'X4',  // Siachen Glacier
        'SOL': 'X5'   // Somaliland
    };
    
    /**
     * Normalize ISO code from GeoJSON properties
     * Handles both ISO_A2 (2-char) and ADM0_A3 (3-char) codes from Natural Earth
     * @param {string} isoA2 - ISO_A2 code from GeoJSON
     * @param {string} adm0A3 - ADM0_A3 code from GeoJSON (fallback)
     * @returns {string|null} Normalized 2-char ISO code or null
     */
    window.normalizeISOForDataSources = function(isoA2, adm0A3) {
        if (isoA2 && isoA2 !== '-99' && isoA2.length === 2) {
            return isoA2.toUpperCase();
        }
        if (adm0A3 && adm0A3 !== '-99' && adm0A3.length >= 2) {
            const a3 = adm0A3.toUpperCase();
            return ISO_CODE_NORMALIZE[a3] || a3.substring(0, 2);
        }
        return null;
    };
    
    // Alias for map-render.js compatibility (BOTH names work now)
    window.normalizeISOCode = window.normalizeISOForDataSources;

    // ============================================
    // CONFIGURATION
    // ============================================
    
    const CONFIG = {
        // REST Countries API (no key needed)
        REST_COUNTRIES_ALL: 'https://restcountries.com/v3.1/all?fields=name,capital,population,area,region,subregion,languages,currencies,flags,cca2,cca3,borders,latlng',
        
        // Wikipedia Bahasa Indonesia API (no key needed)
        WIKIPEDIA_BASE: 'https://id.wikipedia.org/api/rest_v1/page/summary/',
        
        // Flag CDN (no key needed)
        FLAG_BASE: 'https://flagcdn.com/w320/',
        
        // YouTube privacy embed domain
        YOUTUBE_EMBED_BASE: 'https://www.youtube-nocookie.com/embed/',
        
        // YouTube search fallback
        YOUTUBE_SEARCH_BASE: 'https://www.youtube.com/results?search_query=',
        
        // Local fallback JSON (generated from curated data)
        REST_COUNTRIES_FALLBACK: 'data/restcountries-fallback.json',
        GEOJSON_PATHS: {
            countries: 'data/countries-boundaries.geojson',
            mountains: 'data/mountains.geojson',
            rivers: 'data/rivers.geojson',
            lakes: 'data/lakes.geojson',
            seas: 'data/seas-straits.geojson'
        },
        
        // Curated data path template
        CURATED_PATH: 'data/curated/{CODE}.json',
        
        // Cache settings (in milliseconds)
        CACHE_DURATION: {
            REST_COUNTRIES: 7 * 24 * 60 * 60 * 1000, // 7 days
            WIKIPEDIA: 30 * 24 * 60 * 60 * 1000      // 30 days
        }
    };

    // ============================================
    // CACHE MANAGEMENT
    // ============================================
    
    const CacheManager = {
        /**
         * Get item from localStorage cache
         * @param {string} key - Cache key
         * @returns {any|null} Cached data or null if expired/not found
         */
        get(key) {
            try {
                const cached = localStorage.getItem(key);
                if (!cached) return null;
                
                const { data, timestamp, duration } = JSON.parse(cached);
                const now = Date.now();
                
                // Check if cache is expired
                if (now - timestamp > duration) {
                    localStorage.removeItem(key);
                    return null;
                }
                
                return data;
            } catch (e) {
                console.warn('Cache read error:', e);
                return null;
            }
        },

        /**
         * Set item in localStorage cache
         * @param {string} key - Cache key
         * @param {any} data - Data to cache
         * @param {number} duration - Cache duration in ms
         */
        set(key, data, duration) {
            try {
                const cacheItem = {
                    data,
                    timestamp: Date.now(),
                    duration
                };
                localStorage.setItem(key, JSON.stringify(cacheItem));
            } catch (e) {
                console.warn('Cache write error:', e);
                // Handle quota exceeded
                if (e.name === 'QuotaExceededError') {
                    this.clearOldCache();
                    try {
                        localStorage.setItem(key, JSON.stringify(cacheItem));
                    } catch (e2) {
                        console.error('Cache still full after cleanup:', e2);
                    }
                }
            }
        },

        /**
         * Clear old cache entries when storage is full
         */
        clearOldCache() {
            const keysToRemove = [];
            const now = Date.now();
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('geopedia_cache_') || key.startsWith('restcountries_cache') || key.startsWith('wiki_cache_')) {
                    try {
                        const { timestamp, duration } = JSON.parse(localStorage.getItem(key));
                        if (now - timestamp > duration) {
                            keysToRemove.push(key);
                        }
                    } catch (e) {
                        keysToRemove.push(key); // Remove malformed entries
                    }
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log(`Cleared ${keysToRemove.length} old cache entries`);
        },

        /**
         * Clear all GeoPedia cache
         */
        clearAll() {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('geopedia_') || key.startsWith('restcountries') || key.startsWith('wiki_cache')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        }
    };

    // ============================================
    // VISITED COUNTRIES TRACKING
    // ============================================
    
    const VisitedTracker = {
        STORAGE_KEY: 'geopedia_visited_countries',

        /**
         * Get list of visited country codes
         * @returns {Set<string>} Set of ISO_A2 codes
         */
        getVisited() {
            try {
                const visited = localStorage.getItem(this.STORAGE_KEY);
                return visited ? new Set(JSON.parse(visited)) : new Set();
            } catch (e) {
                return new Set();
            }
        },

        /**
         * Mark a country as visited
         * @param {string} isoA2 - Country ISO_A2 code
         */
        markVisited(isoA2) {
            const visited = this.getVisited();
            visited.add(isoA2.toUpperCase());
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([...visited]));
        },

        /**
         * Check if a country has been visited
         * @param {string} isoA2 - Country ISO_A2 code
         * @returns {boolean}
         */
        isVisited(isoA2) {
            return this.getVisited().has(isoA2.toUpperCase());
        },

        /**
         * Get count of visited countries
         * @returns {number}
         */
        getVisitedCount() {
            return this.getVisited().size;
        },

        /**
         * Clear all visited data
         */
        clearAll() {
            localStorage.removeItem(this.STORAGE_KEY);
        }
    };

    // ============================================
    // DATA FETCHERS
    // ============================================
    
    /**
     * Fetch with timeout and error handling
     * @param {string} url - URL to fetch
     * @param {number} timeout - Timeout in ms (default 10s)
     * @returns {Promise<Response>}
     */
    async function fetchWithTimeout(url, timeout = 10000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json'
                }
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Fetch all countries from REST Countries API
     * Uses cache to avoid repeated requests
     * @returns {Promise<Array>} Array of country objects
     */
    async function fetchAllCountries() {
        const CACHE_KEY = 'restcountries_cache';
        
        // Try cache first
        const cached = CacheManager.get(CACHE_KEY);
        if (cached && cached.length > 0) {
            console.log('Using cached REST Countries data');
            return cached;
        }
        
        try {
            console.log('Fetching from REST Countries API...');
            const response = await fetchWithTimeout(CONFIG.REST_COUNTRIES_ALL, 15000);
            const data = await response.json();
            
            // API may return error object instead of array
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('API returned empty or invalid data');
            }
            
            // Cache the result
            CacheManager.set(CACHE_KEY, data, CONFIG.CACHE_DURATION.REST_COUNTRIES);
            console.log(`Fetched and cached ${data.length} countries`);
            
            return data;
        } catch (error) {
            console.warn('REST Countries API failed:', error.message);
            
            // Try stale cache
            const staleCache = localStorage.getItem(CACHE_KEY);
            if (staleCache) {
                try {
                    const { data } = JSON.parse(staleCache);
                    if (Array.isArray(data) && data.length > 0) {
                        console.log('Using stale cache as fallback');
                        return data;
                    }
                } catch (e) {
                    // Ignore parse error
                }
            }
            
            // Last resort: local fallback file
            try {
                console.log('Loading local REST Countries fallback...');
                const response = await fetchWithTimeout(CONFIG.REST_COUNTRIES_FALLBACK, 10000);
                const data = await response.json();
                
                if (Array.isArray(data) && data.length > 0) {
                    console.log(`Loaded ${data.length} countries from local fallback`);
                    return data;
                }
            } catch (fallbackError) {
                console.error('Local fallback also failed:', fallbackError);
            }
            
            throw new Error('Gagal memuat data negara. Periksa koneksi internet Anda.');
        }
    }

    /**
     * Fetch Wikipedia summary for a country
     * @param {string} countryName - Country name in Indonesian or English
     * @param {string} isoA2 - Country ISO_A2 code for cache key
     * @returns {Promise<Object>} Object with thumbnail and extract
     */
    async function fetchWikipediaInfo(countryName, isoA2) {
        const CACHE_KEY = `wiki_cache_${isoA2}`;
        
        // Try cache first
        const cached = CacheManager.get(CACHE_KEY);
        if (cached) {
            console.log(`Using cached Wikipedia data for ${countryName}`);
            return cached;
        }
        
        try {
            // URL encode the country name
            const encodedName = encodeURIComponent(countryName);
            const url = `${CONFIG.WIKIPEDIA_BASE}${encodedName}`;
            
            console.log(`Fetching Wikipedia info for ${countryName}`);
            const response = await fetchWithTimeout(url, 8000);
            const data = await response.json();
            
            // Extract relevant fields
            const result = {
                thumbnail: data.thumbnail?.source || null,
                extract: data.extract || null,
                pageUrl: data.content_urls?.desktop?.page || null
            };
            
            // Limit description to ~3 sentences for children
            if (result.extract) {
                const sentences = result.extract.split(/[.!?]+/).filter(s => s.trim().length > 0);
                result.extract = sentences.slice(0, 3).join('. ') + (sentences.length > 3 ? '.' : '');
            }
            
            // Cache the result
            CacheManager.set(CACHE_KEY, result, CONFIG.CACHE_DURATION.WIKIPEDIA);
            
            return result;
        } catch (error) {
            console.warn(`Wikipedia fetch failed for ${countryName}:`, error);
            
            // Return empty result - UI will handle fallback
            return {
                thumbnail: null,
                extract: null,
                pageUrl: null
            };
        }
    }

    /**
     * Load local curated data for a country
     * @param {string} isoA2 - Country ISO_A2 code
     * @returns {Promise<Object>} Curated data object
     */
    async function loadCuratedData(isoA2) {
        const path = CONFIG.CURATED_PATH.replace('{CODE}', isoA2.toUpperCase());
        
        try {
            const response = await fetchWithTimeout(path, 5000);
            const data = await response.json();
            return data;
        } catch (error) {
            console.warn(`Curated data not found for ${isoA2}:`, error);
            
            // Return default structure
            return {
                iso_a2: isoA2.toUpperCase(),
                sumber_isi: 'not_found',
                terakhir_diubah: new Date().toISOString().split('T')[0],
                keuntungan_geografis: [],
                kerugian_geografis: [],
                fakta_unik: [],
                youtube_id: null
            };
        }
    }

    /**
     * Load GeoJSON data for map layers
     * Supports lazy loading
     * @param {string} layerType - Layer type (countries, mountains, rivers, lakes, seas)
     * @returns {Promise<Object>} GeoJSON data
     */
    async function loadGeoJSON(layerType) {
        const path = CONFIG.GEOJSON_PATHS[layerType];
        
        if (!path) {
            throw new Error(`Unknown layer type: ${layerType}`);
        }
        
        try {
            const response = await fetchWithTimeout(path, 20000);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Failed to load GeoJSON for ${layerType}:`, error);
            throw error;
        }
    }

    // ============================================
    // DATA TRANSFORMATION
    // ============================================
    
    /**
     * Build complete country data object for UI display
     * Combines data from multiple sources
     * @param {Object} restCountryData - From REST Countries API
     * @param {Object} wikiData - From Wikipedia API
     * @param {Object} curatedData - From local JSON file
     * @returns {Object} Complete country data for UI
     */
    function buildCountryData(restCountryData, wikiData, curatedData) {
        const cca2 = restCountryData.cca2;
        
        // Format population with commas
        const formatPopulation = (pop) => {
            if (!pop) return 'N/A';
            return pop.toLocaleString('id-ID');
        };
        
        // Format area with commas
        const formatArea = (area) => {
            if (!area) return 'N/A';
            return `${area.toLocaleString('id-ID')} km²`;
        };
        
        // Extract languages
        const getLanguages = (langs) => {
            if (!langs) return ['Tidak tersedia'];
            return Object.values(langs);
        };
        
        // Extract currencies
        const getCurrencies = (curs) => {
            if (!curs) return ['Tidak tersedia'];
            return Object.values(curs).map(c => c.name || 'Unknown');
        };
        
        // Determine best image (Wikipedia photo or flag)
        const getImageUrl = () => {
            if (wikiData.thumbnail) return wikiData.thumbnail;
            return `${CONFIG.FLAG_BASE}${cca2.toLowerCase()}.png`;
        };
        
        // Determine description (entity-aware)
        const getDescription = () => {
            if (wikiData.extract) return wikiData.extract;
            const isSovereign = curatedData.adalah_negara !== false;
            const entityType = isSovereign ? 'negara' : 'wilayah/entitas';
            return `Deskripsi ${entityType} ini belum tersedia dalam bahasa Indonesia. Coba cari di Wikipedia untuk informasi lebih lengkap!`;
        };
        
        // Build YouTube embed URL or search link
        const getYouTubeInfo = () => {
            const youtubeId = curatedData.youtube_id;
            
            if (youtubeId) {
                return {
                    embedUrl: `${CONFIG.YOUTUBE_EMBED_BASE}${youtubeId}`,
                    hasVideo: true
                };
            }
            
            const countryName = restCountryData.name.common;
            const searchQuery = encodeURIComponent(`${countryName} untuk anak`);
            
            return {
                embedUrl: null,
                searchUrl: `${CONFIG.YOUTUBE_SEARCH_BASE}${searchQuery}`,
                hasVideo: false
            };
        };
        
        const youtubeInfo = getYouTubeInfo();
        
        return {
            // Basic identifiers
            iso_a2: cca2,
            iso_a3: restCountryData.cca3,
            
            // Names & flags
            nama: restCountryData.name.common,
            bendera_url: `${CONFIG.FLAG_BASE}${cca2.toLowerCase()}.png`,
            
            // Basic facts
            ibu_kota: restCountryData.capital?.[0] || 'N/A',
            populasi: restCountryData.population,
            populasi_formatted: formatPopulation(restCountryData.population),
            luas_km2: restCountryData.area,
            luas_formatted: formatArea(restCountryData.area),
            region: restCountryData.region || 'N/A',
            subregion: restCountryData.subregion || 'N/A',
            
            // Languages & currencies
            bahasa: getLanguages(restCountryData.languages),
            mata_uang: getCurrencies(restCountryData.currencies),
            
            // Visual content
            foto_url: getImageUrl(),
            deskripsi: getDescription(),
            wiki_url: wikiData.pageUrl || `https://id.wikipedia.org/wiki/${encodeURIComponent(restCountryData.name.common)}`,
            
            // Video content
            youtube_embed_url: youtubeInfo.embedUrl,
            youtube_search_url: youtubeInfo.searchUrl,
            has_video: youtubeInfo.hasVideo,
            
            // Curated content (AI-generated)
            keuntungan_geografis: curatedData.keuntungan_geografis || [],
            kerugian_geografis: curatedData.kerugian_geografis || [],
            fakta_unik: curatedData.fakta_unik || [],
            
            // Entity type (sovereign vs dependency/territory)
            adalah_negara: curatedData.adalah_negara !== false,  // default true
            designasi: curatedData.designasi || 'Negara',
            
            // Coordinates for centering map
            coordinates: restCountryData.latlng || [0, 0],
            
            // Bordering countries
            borders: restCountryData.borders || []
        };
    }

    // ============================================
    // FEATURE DESCRIPTIONS TEMPLATES
    // ============================================
    
    const FEATURE_TEMPLATES = {
        mountain: {
            icon: '⛰️',
            name: 'Gunung / Pegunungan',
            descriptions: [
                'Ini adalah gunung atau pegunungan! Gunung terbentuk dari pergerakan lempeng bumi selama jutaan tahun.',
                'Pegunungan adalah rangkaian gunung yang berdekatan. Banyak pegunungan menjadi rumah bagi flora dan fauna unik!',
                'Gunung tertinggi di dunia adalah Gunung Everest dengan ketinggian 8.848 meter!'
            ]
        },
        river: {
            icon: '🌊',
            name: 'Sungai',
            descriptions: [
                'Ini adalah sungai! Sungai adalah aliran air tawar yang mengalir dari pegunungan menuju laut atau danau.',
                'Sungai sangat penting untuk kehidupan manusia! Banyak kota besar didirikan di tepi sungai.',
                'Sungai terpanjang di dunia adalah Sungai Nil di Afrika dengan panjang sekitar 6.650 kilometer.'
            ]
        },
        lake: {
            icon: '💧',
            name: 'Danau',
            descriptions: [
                'Ini adalah danau! Danau adalah genangan air yang dikelilingi oleh daratan.',
                'Danau bisa terbentuk dari gunung berapi, gletser, atau aliran sungai yang terhenti.',
                'Danau terbesar di dunia adalah Laut Kaspia, tapi danau air tawar terbesar adalah Danau Superior!'
            ]
        },
        sea: {
            icon: '🌐',
            name: 'Laut',
            descriptions: [
                'Ini adalah laut! Laut adalah bagian dari samudra yang lebih kecil dan biasanya dikelilingi oleh daratan.',
                'Laut memiliki air asin dan menjadi rumah bagi jutaan makhluk hidup.',
                'Laut terbesar di dunia adalah Laut Karibia, sedangkan Laut Jawa ada di Indonesia!'
            ]
        },
        strait: {
            icon: '🔀',
            name: 'Selat',
            descriptions: [
                'Ini adalah selat! Selat adalah jalur air sempit yang menghubungkan dua perairan besar.',
                'Selat sangat penting untuk pelayaran dan perdagangan internasional.',
                'Selat yang terkenal di Indonesia adalah Selat Malaka, salah satu jalur pelayaran tersibuk di dunia!'
            ]
        },
        bay: {
            icon: '🏖️',
            name: 'Teluk',
            descriptions: [
                'Ini adalah teluk! Teluk adalah bagian laut yang masuk ke daratan membentuk lekukan.',
                'Teluk sering menjadi tempat pelabuhan karena airnya tenang dan terlindungi.',
                'Teluk terbesar di dunia adalah Teluk Meksiko!'
            ]
        },
        gulf: {
            icon: '🌊',
            name: 'Teluk Besar (Gulf)',
            descriptions: [
                'Ini adalah teluk besar (gulf)! Gulf adalah teluk yang ukurannya sangat besar.',
                'Gulf sering menjadi jalur perdagangan penting dan kaya akan minyak bumi.',
                'Contoh gulf terkenal adalah Teluk Persia dan Teluk Meksiko!'
            ]
        },
        channel: {
            icon: '🚢',
            name: 'Selat/Selat Air',
            descriptions: [
                'Ini adalah saluran air (channel)! Channel adalah jalur air yang menghubungkan dua perairan.',
                'Channel penting untuk navigasi kapal dan perdagangan maritim.',
                'Contoh terkenal adalah Selat Inggris yang memisahkan Inggris dan Perancis!'
            ]
        },
        sound: {
            icon: '🌫️',
            name: 'Selat Luas (Sound)',
            descriptions: [
                'Ini adalah sound! Sound adalah teluk laut besar atau selat luas.',
                'Sound biasanya terbentuk akibat erosi oleh gletser pada zaman es.',
                'Contoh sound terkenal adalah Puget Sound di Amerika Serikat!'
            ]
        }
    };

    /**
     * Get feature description based on type
     * @param {string} featureType - Type of geographic feature
     * @param {string} featureName - Name of the specific feature
     * @returns {Object} Feature info with icon, name, and description
     */
    function getFeatureDescription(featureType, featureName) {
        const template = FEATURE_TEMPLATES[featureType] || FEATURE_TEMPLATES.sea;
        
        // Pick a random description from the template
        const randomIndex = Math.floor(Math.random() * template.descriptions.length);
        
        return {
            icon: template.icon,
            typeName: template.name,
            name: featureName,
            description: template.descriptions[randomIndex]
        };
    }

    // ============================================
    // PUBLIC API
    // ============================================
    
    return {
        CONFIG,
        CacheManager,
        VisitedTracker,
        
        // Data fetching methods
        fetchAllCountries,
        fetchWikipediaInfo,
        loadCuratedData,
        loadGeoJSON,
        
        // Data transformation
        buildCountryData,
        getFeatureDescription,
        
        // Utility
        fetchWithTimeout
    };
})();

// Make available globally
window.GeoDataSources = GeoDataSources;
