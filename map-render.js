/**
 * GeoPedia Map Renderer Module
 * Handles D3.js SVG map rendering, zoom/pan, and layer management
 */

const GeoMapRenderer = (() => {
    'use strict';

    // ============================================
    // STATE
    // ============================================
    
    let svg = null;
    let g = null;           // Main group for transform (zoom/pan)
    let projection = null;
    let path = null;
    let zoom = null;
    
    // Layer groups
    const layerGroups = {
        countries: null,
        mountains: null,
        rivers: null,
        lakes: null,
        seas: null
    };
    
    // Loaded state
    const loadedLayers = {
        countries: false,
        mountains: false,
        rivers: false,
        lakes: false,
        seas: false
    };
    
    // Country data reference (for click events)
    let countriesData = [];
    
    // Callbacks
    let onCountryClick = null;
    let onFeatureClick = null;

    // ============================================
    // INITIALIZATION
    // ============================================
    
    /**
     * Initialize the map renderer
     * @param {string} containerId - ID of the map container element
     * @param {Object} options - Configuration options
     */
    function init(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Map container not found:', containerId);
            return;
        }
        
        // Get or create SVG
        svg = d3.select('#map-svg');
        
        // Setup dimensions
        const width = container.clientWidth || 960;
        const height = container.clientHeight || 550;
        
        svg.attr('width', width)
           .attr('height', height)
           .attr('viewBox', `0 0 ${width} ${height}`)
           .attr('preserveAspectRatio', 'xMidYMid meet');
        
        // Define projection - Natural Earth is good for world maps
        projection = d3.geoNaturalEarth1()
            .scale(width / 5.8)  // Scale to fit nicely
            .translate([width / 2, height / 2]);
        
        // Create path generator
        path = d3.geoPath().projection(projection);
        
        // Create main group for zoom/pan
        g = svg.append('g')
            .attr('class', 'map-layers');
        
        // Setup zoom behavior
        zoom = d3.zoom()
            .scaleExtent([1, 12])
            .on('zoom', onZoom);
        
        svg.call(zoom);
        
        // Create layer groups (order matters for rendering)
        layerGroups.seas = g.append('g').attr('class', 'layer-seas layer-hidden');
        layerGroups.lakes = g.append('g').attr('class', 'layer-lakes layer-hidden');
        layerGroups.rivers = g.append('g').attr('class', 'layer-rivers layer-hidden');
        layerGroups.mountains = g.append('g').attr('class', 'layer-mountains layer-hidden');
        layerGroups.countries = g.append('g').attr('class', 'layer-countries');
        
        // Store callbacks
        if (options.onCountryClick) onCountryClick = options.onCountryClick;
        if (options.onFeatureClick) onFeatureClick = options.onFeatureClick;
        
        console.log('Map renderer initialized');
    }

    /**
     * Handle zoom event
     */
    function onZoom(event) {
        g.attr('transform', event.transform);
    }

    // ============================================
    // LAYER RENDERING
    // ============================================
    
    /**
     * Render countries layer from GeoJSON
     * @param {Object} geojson - GeoJSON data for countries
     */
    function renderCountries(geojson) {
        if (!layerGroups.countries) return;
        
        countriesData = geojson.features || [geojson];
        
        // Clear existing
        layerGroups.countries.selectAll('*').remove();
        
        // Create paths for each country
        const paths = layerGroups.countries.selectAll('path')
            .data(countriesData)
            .enter()
            .append('path')
            .attr('class', 'map-country')
            .attr('d', path)
            .attr('data-iso-a2', d => normalizeISOCode(d.properties.ISO_A2, d.properties.ADM0_A3) || '')
            .attr('data-name', d => d.properties.NAME || '')
            .attr('tabindex', '0')  // Keyboard accessible
            .attr('role', 'button')
            .attr('aria-label', d => `Negara: ${d.properties.NAME || 'Unknown'}`);
        
        // Check visited status and apply class
        paths.each(function(d) {
            const isoA2 = normalizeISOCode(d.properties.ISO_A2, d.properties.ADM0_A3);
            if (isoA2 && window.GeoDataSources && GeoDataSources.VisitedTracker.isVisited(isoA2)) {
                d3.select(this).classed('visited', true);
            }
        });
        
        // Click handler
        paths.on('click', function(event, d) {
            event.stopPropagation();
            handleCountryClick(d, this);
        });
        
        // Keyboard support
        paths.on('keypress', function(event, d) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleCountryClick(d, this);
            }
        });
        
        loadedLayers.countries = true;
        console.log(`Rendered ${countriesData.length} countries`);
    }

    /**
     * Handle country click
     */
    function handleCountryClick(d, element) {
        const isoA2 = normalizeISOCode(d.properties.ISO_A2, d.properties.ADM0_A3);
        const name = d.properties.NAME;
        
        if (!isoA2) {
            console.warn('Country has no ISO_A2 code:', name);
            return;
        }
        
        // Mark as visited
        if (window.GeoDataSources) {
            GeoDataSources.VisitedTracker.markVisited(isoA2);
            
            // Update visual state
            d3.select(element).classed('visited', true);
        }
        
        // Trigger callback
        if (onCountryClick) {
            onCountryClick({
                isoA2,
                name,
                properties: d.properties,
                coordinates: getCountryCenter(d)
            });
        }
    }

    /**
     * Get approximate center of a country feature
     */
    function getCountryCenter(feature) {
        try {
            const centroid = path.centroid(feature);
            return {
                x: centroid[0],
                y: centroid[1],
                lngLat: projection.invert(centroid)
            };
        } catch (e) {
            return { x: 0, y: 0, lngLat: [0, 0] };
        }
    }

    /**
     * Render mountains layer (lazy load)
     * @param {Object} geojson - Raw GeoJSON data
     */
    function renderMountains(geojson) {
        if (!layerGroups.mountains) return;
        
        // Filter to only mountain ranges
        const features = (geojson.features || []).filter(
            d => d.properties.featurecla === 'Range/mtn'
        );
        
        if (features.length === 0) {
            console.log('No mountain ranges found in data');
            return;
        }
        
        layerGroups.mountains.selectAll('*').remove();
        
        layerGroups.mountains.selectAll('path')
            .data(features)
            .enter()
            .append('path')
            .attr('class', 'map-mountain')
            .attr('d', path)
            .attr('data-name', d => d.properties.name || '')
            .attr('aria-label', d => `Gunung: ${d.properties.name || 'Unknown'}`)
            .on('click', function(event, d) {
                event.stopPropagation();
                handleFeatureClick('mountain', d.properties.name, this);
            });
        
        loadedLayers.mountains = true;
        console.log(`Rendered ${features.length} mountain ranges`);
    }

    /**
     * Render rivers layer (lazy load)
     * @param {Object} geojson - Raw GeoJSON data
     */
    function renderRivers(geojson) {
        if (!layerGroups.rivers) return;
        
        // Note: rivers.geojson contains both 'River' (359) and 'Lake Centerline' (103) features.
        // Lake Centerlines are river segments that cross through lakes — they are intentionally
        // included to maintain visual continuity of major rivers (e.g. Nile through Lake Victoria).
        // Filtering them out would cause rivers to visually break at lake boundaries.
        const features = geojson.features || [];
        
        layerGroups.rivers.selectAll('*').remove();
        
        layerGroups.rivers.selectAll('path')
            .data(features)
            .enter()
            .append('path')
            .attr('class', 'map-river')
            .attr('d', path)
            .attr('data-name', d => d.properties.name || '')
            .attr('aria-label', d => `Sungai: ${d.properties.name || 'Unknown'}`)
            .on('click', function(event, d) {
                event.stopPropagation();
                handleFeatureClick('river', d.properties.name, this);
            });
        
        loadedLayers.rivers = true;
        console.log(`Rendered ${features.length} rivers`);
    }

    /**
     * Render lakes layer (lazy load)
     * @param {Object} geojson - Raw GeoJSON data
     */
    function renderLakes(geojson) {
        if (!layerGroups.lakes) return;
        
        const features = geojson.features || [];
        
        layerGroups.lakes.selectAll('*').remove();
        
        layerGroups.lakes.selectAll('path')
            .data(features)
            .enter()
            .append('path')
            .attr('class', 'map-lake')
            .attr('d', path)
            .attr('data-name', d => d.properties.name || '')
            .attr('aria-label', d => `Danau: ${d.properties.name || 'Unknown'}`)
            .on('click', function(event, d) {
                event.stopPropagation();
                handleFeatureClick('lake', d.properties.name, this);
            });
        
        loadedLayers.lakes = true;
        console.log(`Rendered ${features.length} lakes`);
    }

    /**
     * Render seas and straits layer (lazy load)
     * @param {Object} geojson - Raw GeoJSON data
     */
    function renderSeas(geojson) {
        if (!layerGroups.seas) return;
        
        // Filter to relevant marine features
        const validTypes = ['sea', 'strait', 'bay', 'gulf', 'channel', 'sound'];
        const features = (geojson.features || []).filter(
            d => validTypes.includes(d.properties.featurecla)
        );
        
        if (features.length === 0) {
            console.log('No sea/strait features found');
            return;
        }
        
        layerGroups.seas.selectAll('*').remove();
        
        layerGroups.seas.selectAll('path')
            .data(features)
            .enter()
            .append('path')
            .attr('class', 'map-sea')
            .attr('d', path)
            .attr('data-name', d => d.properties.name || '')
            .attr('data-type', d => d.properties.featurecla || '')
            .attr('aria-label', d => `${d.properties.featurecla}: ${d.properties.name || 'Unknown'}`)
            .on('click', function(event, d) {
                event.stopPropagation();
                handleFeatureClick(d.properties.featurecla, d.properties.name, this);
            });
        
        loadedLayers.seas = true;
        console.log(`Rendered ${features.length} sea/strait features`);
    }

    /**
     * Handle geographic feature click
     */
    function handleFeatureClick(featureType, name, element) {
        if (onFeatureClick) {
            onFeatureClick({
                type: featureType,
                name: name || 'Tidak bernama'
            });
        }
    }

    // ============================================
    // LAYER TOGGLE
    // ============================================
    
    /**
     * Toggle a layer's visibility
     * @param {string} layerName - Layer name (countries, mountains, rivers, lakes, seas)
     * @param {boolean} visible - Whether the layer should be visible
     */
    async function toggleLayer(layerName, visible) {
        const group = layerGroups[layerName];
        if (!group) return;
        
        if (visible) {
            // Lazy load if not yet loaded
            if (!loadedLayers[layerName]) {
                await loadLayer(layerName);
            }
            group.classed('layer-hidden', false);
        } else {
            group.classed('layer-hidden', true);
        }
    }

    /**
     * Load and render a specific layer (for lazy loading)
     * @param {string} layerName - Layer to load
     */
    async function loadLayer(layerName) {
        try {
            showLoading(true);
            const geojson = await GeoDataSources.loadGeoJSON(layerName);
            
            switch (layerName) {
                case 'mountains':
                    renderMountains(geojson);
                    break;
                case 'rivers':
                    renderRivers(geojson);
                    break;
                case 'lakes':
                    renderLakes(geojson);
                    break;
                case 'seas':
                    renderSeas(geojson);
                    break;
                default:
                    console.warn('Cannot lazy-load layer:', layerName);
            }
        } catch (error) {
            console.error(`Failed to load ${layerName}:`, error);
            showToast(`Gagal memuat layer ${layerName}. Periksa koneksi internet.`, 'error');
        } finally {
            showLoading(false);
        }
    }

    // ============================================
    // ZOOM & PAN CONTROLS
    // ============================================
    
    /**
     * Zoom in
     */
    function zoomIn() {
        svg.transition().duration(300).call(
            zoom.scaleBy, 1.8
        );
    }

    /**
     * Zoom out
     */
    function zoomOut() {
        svg.transition().duration(300).call(
            zoom.scaleBy, 0.55
        );
    }

    /**
     * Reset zoom to initial state
     */
    function resetZoom() {
        svg.transition().duration(500).call(
            zoom.transform, d3.zoomIdentity
        );
    }

    /**
     * Zoom to a specific country
     * @param {Array} coordinates - [longitude, latitude] of center point
     * @param {number} scale - Optional scale factor (default auto-calculated)
     */
    function zoomToCountry(coordinates, scale = null) {
        if (!coordinates || !coordinates.length) {
            resetZoom();
            return;
        }
        
        const [lng, lat] = coordinates;
        const center = projection([lng, lat]);
        
        if (!center) {
            resetZoom();
            return;
        }
        
        const width = +svg.attr('width');
        const height = +svg.attr('height');
        
        // Calculate appropriate scale if not provided
        const targetScale = scale || 3;
        
        // Center the view on the country
        const newTransform = d3.zoomIdentity
            .translate(width / 2 - center[0] * targetScale, height / 2 - center[1] * targetScale)
            .scale(targetScale);
        
        svg.transition().duration(750).call(
            zoom.transform, newTransform
        );
    }

    /**
     * Pan to a specific location
     * @param {Array} coordinates - [x, y] pixel coordinates
     */
    function panTo(coordinates) {
        if (!coordinates) return;
        
        const currentTransform = d3.zoomTransform(svg.node());
        const width = +svg.attr('width');
        const height = +svg.attr('height');
        
        const newTransform = currentTransform.translate(
            width / 2 - coordinates[0] * currentTransform.k,
            height / 2 - coordinates[1] * currentTransform.k
        );
        
        svg.transition().duration(500).call(
            zoom.transform, newTransform
        );
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    /**
     * Show/hide loading indicator
     * @param {boolean} show
     */
    function showLoading(show) {
        const loader = document.getElementById('map-loading');
        if (loader) {
            loader.classList.toggle('hidden', !show);
        }
    }

    /**
     * Find country by ISO_A2 code
     * @param {string} isoA2 - Two-letter country code
     * @returns {Object|null} Country feature object
     */
    function findCountryByISO(isoA2) {
        if (!isoA2) return null;
        
        return countriesData.find(c => 
            normalizeISOCode(c.properties.ISO_A2, c.properties.ADM0_A3) === isoA2.toUpperCase()
        ) || null;
    }

    /**
     * Highlight a specific country on the map
     * @param {string} isoA2 - Country code to highlight
     */
    function highlightCountry(isoA2) {
        // Remove previous highlights
        layerGroups.countries.selectAll('.highlighted')
            .classed('highlighted', false);
        
        if (!isoA2) return;
        
        // Add highlight to selected country
        layerGroups.countries.selectAll(`[data-iso-a2="${isoA2.toUpperCase()}"]`)
            .classed('highlighted', true)
            .raise();  // Bring to front
    }

    /**
     * Resize map to fit container
     */
    function resize() {
        const container = document.getElementById('map-container');
        if (!container || !svg) return;
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        svg.attr('width', width)
           .attr('height', height)
           .attr('viewBox', `0 0 ${width} ${height}`);
        
        // Recalculate projection
        projection.scale(width / 5.8).translate([width / 2, height / 2]);
        
        // Redraw all layers
        Object.keys(layerGroups).forEach(key => {
            if (loadedLayers[key]) {
                layerGroups[key].selectAll('path').attr('d', path);
            }
        });
    }

    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.className = `toast ${type}`;
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }

    // ============================================
    // PUBLIC API
    // ============================================
    
    return {
        init,
        
        // Rendering methods
        renderCountries,
        renderMountains,
        renderRivers,
        renderLakes,
        renderSeas,
        
        // Layer management
        toggleLayer,
        loadLayer,
        
        // Zoom controls
        zoomIn,
        zoomOut,
        resetZoom,
        zoomToCountry,
        panTo,
        
        // Utility
        resize,
        findCountryByISO,
        highlightCountry,
        showLoading,
        
        // State accessors
        getLoadedLayers: () => ({ ...loadedLayers }),
        getCountriesCount: () => countriesData.length
    };
})();

// Make available globally
window.GeoMapRenderer = GeoMapRenderer;
