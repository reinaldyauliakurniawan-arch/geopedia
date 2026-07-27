/**
 * GeoPedia Feature Panel Module
 * Handles the small popup panel for geographic features (mountains, rivers, lakes, seas)
 */

const GeoFeaturePanel = (() => {
    'use strict';

    // ============================================
    // STATE
    // ============================================
    
    let panel = null;
    let hideTimeout = null;

    // ============================================
    // INITIALIZATION
    // ============================================
    
    /**
     * Initialize the feature panel
     */
    function init() {
        panel = document.getElementById('feature-panel');
        
        if (!panel) {
            console.error('Feature panel element not found');
            return;
        }
        
        // Setup close button
        const closeBtn = document.getElementById('feature-panel-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', hide);
        }
        
        // Auto-hide after some time (optional)
        panel.addEventListener('mouseenter', () => {
            if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
            }
        });
        
        console.log('Feature panel initialized');
    }

    // ============================================
    // SHOW / HIDE
    // ============================================
    
    /**
     * Show the feature panel with information
     * @param {string} featureType - Type of feature (mountain, river, lake, sea, strait, etc.)
     * @param {string} featureName - Name of the specific feature
     */
    function show(featureType, featureName) {
        if (!panel) return;
        
        // Clear any pending auto-hide
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
        
        // Get feature description from data sources
        const featureInfo = GeoDataSources.getFeatureDescription(featureType, featureName);
        
        // Update panel content
        const iconEl = document.getElementById('feature-icon');
        const nameEl = document.getElementById('feature-name');
        const typeEl = document.getElementById('feature-type');
        const descEl = document.getElementById('feature-description');
        
        if (iconEl) iconEl.textContent = featureInfo.icon;
        if (nameEl) nameEl.textContent = featureInfo.name;
        if (typeEl) typeEl.textContent = featureInfo.typeName;
        if (descEl) descEl.textContent = featureInfo.description;
        
        // Show panel
        panel.classList.remove('hidden');
        
        // Auto-hide after 8 seconds (user can hover to keep it open)
        hideTimeout = setTimeout(() => {
            hide();
        }, 8000);
    }

    /**
     * Hide the feature panel
     */
    function hide() {
        if (panel) {
            panel.classList.add('hidden');
        }
        
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
    }

    /**
     * Toggle feature panel visibility
     * @param {string} featureType - Type of feature
     * @param {string} featureName - Name of feature
     */
    function toggle(featureType, featureName) {
        if (!isHidden()) {
            // Check if showing same feature
            const currentName = document.getElementById('feature-name')?.textContent;
            if (currentName === featureName) {
                hide();
                return;
            }
        }
        
        show(featureType, featureName);
    }

    /**
     * Check if panel is hidden
     */
    function isHidden() {
        return panel ? panel.classList.contains('hidden') : true;
    }

    // ============================================
    // PUBLIC API
    // ============================================
    
    return {
        init,
        show,
        hide,
        toggle,
        isHidden
    };
})();

// Make available globally
window.GeoFeaturePanel = GeoFeaturePanel;
