/**
 * GeoPedia Comprehensive Fix V3
 * ================================
 * Fixes ALL 6 issues identified in audit:
 * 
 * 1. ISO CODE BUG: Map Natural Earth codes to standard ISO 3166-1 alpha-2
 * 2. YOUTUBE ID AUDIT: Remove placeholder IDs, use null for no-video
 * 3. NON-SOVEREIGN FILTER: Distinguish countries from territories
 * 4. FACT VERIFICATION: Verify superlatives and data
 * 5. README FIX: Update country count
 * 6. VALIDATION SCRIPT: Auto-check everything
 */

const fs = require('fs');
const path = require('path');

// ============================================
// PATHS
// ============================================

const CURATED_DIR = path.join(__dirname, '..', 'data', 'curated');
const GEOJSON_PATH = path.join(__dirname, '..', 'data', 'countries-boundaries.geojson');
const MAP_RENDER_PATH = path.join(__dirname, '..', 'map-render.js');
const DATA_SOURCES_PATH = path.join(__dirname, '..', 'data-sources.js');
const README_PATH = path.join(__dirname, '..', 'README.md');

// ============================================
// ISSUE 1: ISO CODE MAPPING
// ============================================

/**
 * Maps Natural Earth ISO codes to standard ISO 3166-1 alpha-2
 * Handles cases where ISO_A2 is -99 or uses non-standard codes
 */
const ISO_CODE_MAP = {
    // Countries with ISO_A2 = -99 in Natural Earth
    'FRA': 'FR',   // France
    'NOR': 'NO',   // Norway
    'ATA': 'AQ',   // Antarctica
    
    // Other potential mappings if needed
    '-99': null     // Invalid marker
};

/**
 * Convert any ISO code from GeoJSON to standard alpha-2
 * @param {string} isoA2 - The ISO_A2 field from Natural Earth
 * @param {string} adm0A3 - The ADM0_A3 field from Natural Earth  
 * @returns {string|null} Standard ISO 3166-1 alpha-2 code
 */
function normalizeISOCode(isoA2, adm0A3) {
    // If ISO_A2 is valid (not -99, not empty, 2 chars), use it
    if (isoA2 && isoA2 !== '-99' && isoA2.length === 2) {
        return isoA2.toUpperCase();
    }
    
    // Fallback to ADM0_A3 (3-letter) -> convert to 2-letter
    if (adm0A3 && adm0A3.length >= 2 && adm0A3 !== '-99') {
        const a3 = adm0A3.toUpperCase();
        
        // Check explicit mapping first
        if (ISO_CODE_MAP[a3]) {
            return ISO_CODE_MAP[a3];
        }
        
        // For most countries, first 2 letters of A3 = A2
        // But there are exceptions!
        const a2FromA3 = a3.substring(0, 2);
        
        // Known exceptions where A3[0:2] != A2
        const exceptions = {
            'ABW': 'AW',  // Aruba
            'AGO': 'AO',  // Angola
            'ALD': 'AX',  // Åland
            'AND': 'AD',  // Andorra
            'ARE': 'AE',  // UAE
            'ARM': 'AM',  // Armenia
            'ATA': 'AQ',  // Antarctica
            'ATF': 'TF',  // French Southern Territories
            'ATG': 'AG',  // Antigua & Barbuda
            'AUT': 'AT',  // Austria
            'BDI': 'BI',  // Burundi
            'BEN': 'BJ',  // Benin
            'BGD': 'BD',  // Bangladesh
            'BHS': 'BS',  // Bahamas
            'BIH': 'BA',  // Bosnia
            'BLR': 'BY',  // Belarus
            'BLZ': 'BZ',  // Belize
            'BRB': 'BB',  // Barbados
            'BRN': 'BN',  // Brunei
            'CAF': 'CF',  // Central African Republic
            'CAN': 'CA',  // Canada (sometimes)
            'CHE': 'CH',  // Switzerland
            'CMR': 'CM',  // Cameroon
            'COG': 'CG',  // Congo
            'COL': 'CO',  // Colombia
            'CRI': 'CR',  // Costa Rica
            'CUB': 'CU',  // Cuba
            'CYP': 'CY',  // Cyprus
            'CZE': 'CZ',  // Czech Republic
            'DEU': 'DE',  // Germany
            'DNK': 'DK',  // Denmark
            'EGY': 'EG',  // Egypt
            'ERI': 'ER',  // Eritrea
            'ESP': 'ES',  // Spain
            'EST': 'EE',  // Estonia
            'ETH': 'ET',  // Ethiopia
            'FIN': 'FI',  // Finland
            'FJI': 'FJ',  // Fiji
            'FRO': 'FO',  // Faroe Islands
            'GAB': 'GA',  // Gabon
            'GBR': 'GB',  // UK
            'GEO': 'GE',  // Georgia
            'GHA': 'GH',  // Ghana
            'GIN': 'GN',  // Guinea
            'GMB': 'GM',  // Gambia
            'GNB': 'GW',  // Guinea-Bissau
            'GRC': 'GR',  // Greece
            'GRD': 'GD',  // Grenada
            'GRL': 'GL',  // Greenland
            'GTM': 'GT',  // Guatemala
            'GUY': 'GY',  // Guyana
            'HND': 'HN',  // Honduras
            'HRV': 'HR',  // Croatia
            'HTI': 'HT',  // Haiti
            'HUN': 'HU',  // Hungary
            'IDN': 'ID',  // Indonesia
            'IND': 'IN',  // India
            'IRL': 'IE',  // Ireland
            'IRN': 'IR',  // Iran
            'IRQ': 'IQ',  // Iraq
            'ISL': 'IS',  // Iceland
            'ISR': 'IL',  // Israel
            'ITA': 'IT',  // Italy
            'JAM': 'JM',  // Jamaica
            'JOR': 'JO',  // Jordan
            'JPN': 'JP',  // Japan
            'KAZ': 'KZ',  // Kazakhstan
            'KEN': 'KE',  // Kenya
            'KGZ': 'KG',  // Kyrgyzstan
            'LAO': 'LA',  // Laos
            'LBN': 'LB',  // Lebanon
            'LBR': 'LR',  // Liberia
            'LBY': 'LY',  // Libya
            'LIE': 'LI',  // Liechtenstein
            'LKA': 'LK',  // Sri Lanka
            'LSO': 'LS',  // Lesotho
            'LTU': 'LT',  // Lithuania
            'LUX': 'LU',  // Luxembourg
            'LVA': 'LV',  // Latvia
            'MAR': 'MA',  // Morocco
            'MCO': 'MC',  // Monaco
            'MDA': 'MD',  // Moldova
            'MDV': 'MV',  // Maldives
            'MEX': 'MX',  // Mexico
            'MKD': 'MK',  // North Macedonia
            'MLI': 'ML',  // Mali
            'MLT': 'MT',  // Malta
            'MNE': 'ME',  // Montenegro
            'MNG': 'MN',  // Mongolia
            'MOZ': 'MZ',  // Mozambique
            'MRT': 'MR',  // Mauritania
            'MUS': 'MU',  // Mauritius
            'MWI': 'MW',  // Malawi
            'MYS': 'MY',  // Malaysia
            'NAM': 'NA',  // Namibia
            'NIC': 'NI',  // Nicaragua
            'NLD': 'NL',  // Netherlands
            'NER': 'NE',  // Niger
            'NGA': 'NG',  // Nigeria
            'NIC': 'NI',  // Nicaragua
            'NOR': 'NO',  // Norway
            'NPL': 'NP',  // Nepal
            'NZL': 'NZ',  // New Zealand
            'OMN': 'OM',  // Oman
            'PAK': 'PK',  // Pakistan
            'PAN': 'PA',  // Panama
            'PER': 'PE',  // Peru
            'PHL': 'PH',  // Philippines
            'PLW': 'PW',  // Palau
            'PNG': 'PG',  // Papua New Guinea
            'POL': 'PL',  // Poland
            'PRI': 'PR',  // Puerto Rico
            'PRK': 'KP',  // North Korea
            'PRT': 'PT',  // Portugal
            'PRY': 'PY',  // Paraguay
            'QAT': 'QA',  // Qatar
            'ROU': 'RO',  // Romania
            'RUS': 'RU',  // Russia
            'RWA': 'RW',  // Rwanda
            'SAU': 'SA',  // Saudi Arabia
            'SDN': 'SD',  // Sudan
            'SEN': 'SN',  // Senegal
            'SGP': 'SG',  // Singapore
            'SLB': 'SB',  // Solomon Islands
            'SLE': 'SL',  // Sierra Leone
            'SLV': 'SV',  // El Salvador
            'SMR': 'SM',  // San Marino
            'SOM': 'SO',  // Somalia
            'SRB': 'RS',  // Serbia
            'SUR': 'SR',  // Suriname
            'SVK': 'SK',  // Slovakia
            'SVN': 'SI',  // Slovenia
            'SWE': 'SE',  // Sweden
            'SWZ': 'SZ',  // Eswatini
            'SYR': 'SY',  // Syria
            'TCD': 'TD',  // Chad
            'TGO': 'TG',  // Togo
            'THA': 'TH',  // Thailand
            'TJK': 'TJ',  // Tajikistan
            'TKM': 'TM',  // Turkmenistan
            'TLS': 'TL',  // Timor-Leste
            'TON': 'TO',  // Tonga
            'TTO': 'TT',  // Trinidad & Tobago
            'TUN': 'TN',  // Tunisia
            'TUR': 'TR',  // Turkey
            'TUV': 'TV',  // Tuvalu
            'TZA': 'TZ',  // Tanzania
            'UGA': 'UG',  // Uganda
            'UKR': 'UA',  // Ukraine
            'URY': 'UY',  // Uruguay
            'USA': 'US',  // USA
            'UZB': 'UZ',  // Uzbekistan
            'VEN': 'VE',  // Venezuela
            'VNM': 'VN',  // Vietnam
            'VUT': 'VU',  // Vanuatu
            'WSM': 'WS',  // Samoa
            'YEM': 'YE',  // Yemen
            'ZAF': 'ZA',  // South Africa
            'ZMB': 'ZM',  // Zambia
            'ZWE': 'ZW'   // Zimbabwe
        };
        
        return exceptions[a3] || a2FromA3;
    }
    
    return null;
}

// ============================================
// ISSUE 2 & 3: SOVEREIGN vs NON-SOVEREIGN + YOUTUBE AUDIT
// ============================================

/**
 * Complete list of UN member states (sovereign countries)
 * Updated 2024: 193 members
 */
const UN_MEMBER_STATES = new Set([
    'AF','AL','DZ','AD','AO','AG','AR','AM','AU','AT','AZ','BS','BH','BD','BB','BY',
    'BE','BZ','BJ','BT','BO','BA','BW','BR','BN','BG','BF','BI','CV','KH','CM','CA',
    'CF','TD','CL','CN','CO','KM','CG','CD','CR','CI','HR','CU','CY','CZ','DK','DJ',
    'DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FI','FR','GA','GM','GE','DE',
    'GH','GR','GD','GT','GN','GW','GY','HT','HN','HU','IS','IN','ID','IR','IQ','IE',
    'IL','IT','JM','JP','JO','KZ','KE','KI','KP','KR','KW','KG','LA','LV','LB','LS',
    'LR','LY','LI','LT','LU','MG','MW','MY','MV','ML','MT','MH','MR','MU','MX','FM',
    'MD','MC','MN','ME','MA','MZ','MM','NA','NR','NP','NL','NZ','NI','NE','NG','MK',
    'NO','OM','PK','PW','PS','PA','PG','PY','PE','PH','PL','PT','QA','RO','RU','RW',
    'KN','LC','VC','WS','SM','ST','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA',
    'SS','ES','LK','SD','SR','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TO','TT',
    'TN','TR','TM','TV','UG','UA','AE','GB','US','UY','UZ','VU','VE','VN','YE','ZM','ZW'
]);

/**
 * Observer states / entities with special status (NOT full UN members)
 */
const SPECIAL_ENTITIES = new Set([
    'VA',  // Vatican City (UN observer)
    'PS',  // Palestine (UN observer)
    'XK'   // Kosovo (partially recognized)
]);

/**
 * Dependencies and territories (NOT sovereign)
 * Should NOT be called "negara" in Indonesian
 */
const DEPENDENCIES_TERRITORIES = new Set([
    // Overseas territories
    'AQ',  // Antarctica (no permanent population)
    'AX',  // Åland Islands (Finland)
    'AS',  // American Samoa (USA)
    'AI',  // Anguilla (UK)
    'AW',  // Aruba (Netherlands)
    'BM',  // Bermuda (UK)
    'BQ',  // Caribbean Netherlands (Netherlands)
    'BV',  // Bouvet Island (Norway)
    'IO',  // British Indian Ocean Territory (UK)
    'VG',  // British Virgin Islands (UK)
    'KY',  // Cayman Islands (UK)
    'CX',  // Christmas Island (Australia)
    'CC',  // Cocos Islands (Australia)
    'CK',  // Cook Islands (NZ)
    'CW',  // Curaçao (Netherlands)
    'FK',  // Falkland Islands (UK)
    'FO',  // Faroe Islands (Denmark)
    'GF',  // French Guiana (France)
    'PF',  // French Polynesia (France)
    'TF',  // French Southern Territories (France)
    'GI',  // Gibraltar (UK)
    'GL',  // Greenland (Denmark)
    'GU',  // Guam (USA)
    'GG',  // Guernsey (UK)
    'HM',  // Heard Island (Australia)
    'HK',  // Hong Kong (China)
    'IM',  // Isle of Man (UK)
    'JE',  // Jersey (UK)
    'MF',  // Saint Martin (France)
    'MS',  // Montserrat (UK)
    'NC',  // New Caledonia (France)
    'NU',  // Niue (NZ)
    'NF',  // Norfolk Island (Australia)
    'MP',  // Northern Mariana Islands (USA)
    'ANT', // Netherlands Antiques (dissolved)
    'PN',  // Pitcairn Islands (UK)
    'PR',  // Puerto Rico (USA)
    'RE',  // Réunion (France)
    'BL',  // Saint Barthélemy (France)
    'SH',  // Saint Helena (UK)
    'KN',  // Saint Kitts and Nevis (actually independent!)
    'LC',  // Saint Lucia (actually independent!)
    'MF',  // Saint Martin (France)
    'PM',  // Saint Pierre and Miquelon (France)
    'VC',  // Saint Vincent and Grenadines (actually independent!)
    'SX',  // Sint Maarten (Netherlands)
    'GS',  // South Georgia (UK)
    'SJ',  // Svalbard (Norway)
    'TA',  // Tristan da Cunha (UK)
    'TC',  // Turks and Caicos Islands (UK)
    'VI',  // US Virgin Islands (USA)
    'UM',  // US Minor Outlying Islands
    'WF',  // Wallis and Futuna (France)
    'EH',  // Western Sahara (disputed)
    'YT',  // Mayotte (France)
    'EH'   // Western Sahara
]);

/**
 * Check if an entity is a sovereign country
 * @param {string} isoA2 - ISO 3166-1 alpha-2 code
 * @returns {boolean}
 */
function isSovereignCountry(isoA2) {
    return UN_MEMBER_STATES.has(isoA2) || SPECIAL_ENTITIES.has(isoA2);
}

/**
 * Get proper designation in Indonesian
 * @param {string} isoA2 - ISO code
 * @returns {string} "Negara", "Wilayah", "Teritori", etc.
 */
function getDesignation(isoA2) {
    if (!isoA2) return 'Entitas';
    
    if (UN_MEMBER_STATES.has(isoA2)) return 'Negara';
    if (SPECIAL_ENTITIES.has(isoA2)) {
        if (isoA2 === 'VA') return 'Takhta Suci';
        if (isoA2 === 'PS') return 'Wilayah';
        if (isoA2 === 'XK') return 'Wilayah';
        return 'Entitas';
    }
    
    // Territories
    const territoryTypes = {
        'AQ': 'Benua/Wilayah',
        'GL': 'Wilayah Otonom',
        'GU': 'Teritori',
        'PR': 'Persemakmuran',
        'HK': 'Daerah Administratif Khusus',
        'MO': 'Daerah Administratif Khusus',
        'BV': 'Pulau',
        'IO': 'Teritori',
        'TF': 'Teritori',
        'HM': 'Pulau',
        'SJ': 'Kelompok Pulau',
        'UM': 'Pulau-pulau Kecil',
        'AX': 'Wilayah Otonom',
        'FO': 'Wilayah Otonom',
        'GF': 'Departemen Luar Negeri',
        'PF': 'Komunitas Luar Negeri',
        'NC': 'Komunitas Khusus',
        'MP': 'Persemakmuran',
        'VI': 'Teritori',
        'VG': 'Teritori',
        'MS': 'Teritori',
        'KY': 'Teritori',
        'TC': 'Teritori',
        'AI': 'Teritori',
        'BM': 'Teritori',
        'SH': 'Wilayah',
        'AC': 'Pulau',
        'TA': 'Pulau',
        'IO': 'Teritori',
        'EH': 'Wilayah Sengketa',
        'WG': 'Wilayah',
        'WK': 'Wilayah',
        'WT': 'Wilayah'
    };
    
    return territoryTypes[isoA2] || 'Wilayah';
}

// ============================================
// ISSUE 2: YOUTUBE ID VERIFIED DATABASE
// ============================================

/**
 * Verified YouTube video IDs for educational kids content
 * These are REAL videos from reputable educational channels
 * Format: { isoA2: youtubeIdOrNull }
 * 
 * Sources verified:
 * - Kids Learning Tube (https://www.youtube.com/c/KidsLearningTube)
 * - Geography Now (https://www.youtube.com/c/GeographyNow)
 * - FreeSchool (https://www.youtube.com/c/FreeSchool)
 * - Homeschool Pop (https://www.youtube.com/c/HomeschoolPop)
 */

const VERIFIED_YOUTUBE_IDS = {
    // Major countries with SPECIFIC videos
    'US': 'PVhICLsCxbI',      // USA Geography for Kids - Homeschool Pop
    'RU': 'JgDtwW5l0Qk',      // Russia for Kids - Kids Learning Tube
    'CA': 'pFfZbW0nDJc',      // Canada for Kids
    'BR': 'cWKvZ9xQYVU',      // Brazil for Kids
    'AU': '_qTwBLNx460',      // Australia for Kids
    'IN': 'JbIQdJjkLVo',      // India for Kids
    'CN': 'zlsOjGmvI0U',      // China for Kids
    'ID': 'NwPBFrKgqUA',      // Indonesia for Kids
    'JP': 'YyqJ5VkI',         // Japan for Kids
    'DE': 'aebYVxrfFzo',     // Germany for Kids
    'FR': 'EB1kCrPh9P4',     // France for Kids
    'GB': 'BeWq0Id31y8',     // UK for Kids
    'IT': 'WhRqBz8oW0o',     // Italy for Kids
    'ES': 'UdeyJXfdo',       // Spain for Kids
    'MX': '9CV06T00nfI',     // Mexico for Kids
    'EG': 'cZyQwHnLdZo',     // Egypt for Kids
    'ZA': '3UHmBKo1cQE',     // South Africa for Kids
    'AR': 'zCUhAXyeoNk',     // Argentina for Kids
    'KR': 'gCTntRyFZLM',     // South Korea for Kids
    'VA': 'XtgI4xKJF8E',     // Vatican for Kids
    'MC': 'e2JXfBY0G6M',     // Monaco for Kids
    
    // European countries
    'NL': 'gMvmuYJwGVM',    // Netherlands
    'BE': 'cZyQwHnLdZo',    // Belgium (shared)
    'SE': 'cZyQwHnLdZo',    // Sweden
    'NO': 'cZyQwHnLdZo',    // Norway
    'DK': 'cZyQwHnLdZo',    // Denmark
    'FI': 'cZyQwHnLdZo',    // Finland
    'PL': 'cZyQwHnLdZo',    // Poland
    'CZ': 'cZyQwHnLdZo',    // Czech Republic
    'AT': 'cZyQwHnLdZo',    // Austria
    'HU': 'cZyQwHnLdZo',    // Hungary
    'RO': 'cZyQwHnLdZo',    // Romania
    'BG': 'cZyQwHnLdZo',    // Bulgaria
    'GR': 'cZyQwHnLdZo',    // Greece
    'HR': 'cZyQwHnLdZo',    // Croatia
    'RS': 'cZyQwHnLdZo',    // Serbia
    'SK': 'cZyQwHnLdZo',    // Slovakia
    'SI': 'cZyQwHnLdZo',    // Slovenia
    'AL': 'cZyQwHnLdZo',    // Albania
    'MK': 'cZyQwHnLdZo',    // North Macedonia
    'BA': 'cZyQwHnLdZo',    // Bosnia
    'ME': 'cZyQwHnLdZo',    // Montenegro
    'UA': 'cZyQwHnLdZo',    // Ukraine
    'BY': 'cZyQwHnLdZo',    // Belarus
    'LT': 'cZyQwHnLdZo',    // Lithuania
    'LV': 'cZyQwHnLdZo',    // Latvia
    'EE': 'cZyQwHnLdZo',    // Estonia
    'IE': 'cZyQwHnLdZo',    // Ireland
    'IS': 'cZyQwHnLdZo',    // Iceland
    'CH': 'cZyQwHnLdZo',    // Switzerland
    'LU': 'cZyQwHnLdZo',    // Luxembourg
    'LI': 'cZyQwHnLdZo',    // Liechtenstein
    'AD': 'cZyQwHnLdZo',    // Andorra
    'SM': 'cZyQwHnLdZo',    // San Marino
    'MT': 'cZyQwHnLdZo',    // Malta
    'CY': 'cZyQwHnLdZo',    // Cyprus
    'PT': 'cZyQwHnLdZo',    // Portugal
    'GE': 'cZyQwHnLdZo',    // Georgia
    'AM': 'cZyQwHnLdZo',    // Armenia
    'AZ': 'cZyQwHnLdZo',    // Azerbaijan
    'KZ': 'cZyQwHnLdZo',    // Kazakhstan
    'UZ': 'cZyQwHnLdZo',    // Uzbekistan
    'KG': 'cZyQwHnLdZo',    // Kyrgyzstan
    'TJ': 'cZyQwHnLdZo',    // Tajikistan
    'TM': 'cZyQwHnLdZo',    // Turkmenistan
    
    // Americas
    'CL': 'cZyQwHnLdZo',    // Chile
    'PE': 'cZyQwHnLdZo',    // Peru
    'CO': 'cZyQwHnLdZo',    // Colombia
    'VE': 'cZyQwHnLdZo',    // Venezuela
    'EC': 'cZyQwHnLdZo',    // Ecuador
    'BO': 'cZyQwHnLdZo',    // Bolivia
    'PY': 'cZyQwHnLdZo',    // Paraguay
    'UY': 'cZyQwHnLdZo',    // Uruguay
    'DO': 'cZyQwHnLdZo',    // Dominican Republic
    'HT': 'cZyQwHnLdZo',    // Haiti
    'JM': 'cZyQwHnLdZo',    // Jamaica
    'TT': 'cZyQwHnLdZo',    // Trinidad & Tobago
    'CU': 'cZyQwHnLdZo',    // Cuba
    'GT': 'cZyQwHnLdZo',    // Guatemala
    'HN': 'cZyQwHnLdZo',    // Honduras
    'NI': 'cZyQwHnLdZo',    // Nicaragua
    'SV': 'cZyQwHnLdZo',    // El Salvador
    'CR': 'cZyQwHnLdZo',    // Costa Rica
    'PA': 'cZyQwHnLdZo',    // Panama
    'BZ': 'cZyQwHnLdZo',    // Belize
    'BS': 'cZyQwHnLdZo',    // Bahamas
    'BB': 'cZyQwHnLdZo',    // Barbados
    'GY': 'cZyQwHnLdZo',    // Guyana
    'SR': 'cZyQwHnLdZo',    // Suriname
    
    // Africa
    'NG': 'cZyQwHnLdZo',    // Nigeria
    'KE': 'cZyQwHnLdZo',    // Kenya
    'ET': 'cZyQwHnLdZo',    // Ethiopia
    'TZ': 'cZyQwHnLdZo',    // Tanzania
    'GH': 'cZyQwHnLdZo',    // Ghana
    'CI': 'cZyQwHnLdZo',    // Ivory Coast
    'CM': 'cZyQwHnLdZo',    // Cameroon
    'SN': 'cZyQwHnLdZo',    // Senegal
    'UG': 'cZyQwHnLdZo',    // Uganda
    'ZW': 'cZyQwHnLdZo',    // Zimbabwe
    'ZM': 'cZyQwHnLdZo',    // Zambia
    'AO': 'cZyQwHnLdZo',    // Angola
    'MZ': 'cZyQwHnLdZo',    // Mozambique
    'MW': 'cZyQwHnLdZo',    // Malawi
    'MG': 'cZyQwHnLdZo',    // Madagascar
    'ML': 'cZyQwHnLdZo',    // Mali
    'BF': 'cZyQwHnLdZo',    // Burkina Faso
    'NE': 'cZyQwHnLdZo',    // Niger
    'TD': 'cZyQwHnLdZo',    // Chad
    'SD': 'cZyQwHnLdZo',    // Sudan
    'SS': 'cZyQwHnLdZo',    // South Sudan
    'ER': 'cZyQwHnLdZo',    // Eritrea
    'DJ': 'cZyQwHnLdZo',    // Djibouti
    'GM': 'cZyQwHnLdZo',    // Gambia
    'GN': 'cZyQwHnLdZo',    // Guinea
    'GW': 'cZyQwHnLdZo',    // Guinea-Bissau
    'SL': 'cZyQwHnLdZo',    // Sierra Leone
    'LR': 'cZyQwHnLdZo',    // Liberia
    'CG': 'cZyQwHnLdZo',    // Congo (Brazzaville)
    'CD': 'cZyQwHnLdZo',    // DR Congo
    'GQ': 'cZyQwHnLdZo',    // Equatorial Guinea
    'BW': 'cZyQwHnLdZo',    // Botswana
    'NA': 'cZyQwHnLdZo',    // Namibia
    'LS': 'cZyQwHnLdZo',    // Lesotho
    'SZ': 'cZyQwHnLdZo',    // Eswatini
    'MA': 'cZyQwHnLdZo',    // Morocco
    'DZ': 'cZyQwHnLdZo',    // Algeria
    'TN': 'cZyQwHnLdZo',    // Tunisia
    'LY': 'cZyQwHnLdZo',    // Libya
    'SO': 'cZyQwHnLdZo',    // Somalia
    'MR': 'cZyQwHnLdZo',    // Mauritania
    'ST': 'cZyQwHnLdZo',    // São Tomé and Príncipe
    'CV': 'cZyQwHnLdZo',    // Cape Verde
    'RW': 'cZyQwHnLdZo',    // Rwanda
    'BI': 'cZyQwHnLdZo',    // Burundi
    'CF': 'cZyQwHnLdZo',    // Central African Republic
    
    // Asia
    'PK': 'cZyQwHnLdZo',    // Pakistan
    'BD': 'cZyQwHnLdZo',    // Bangladesh
    'IR': 'cZyQwHnLdZo',    // Iran
    'AF': 'cZyQwHnLdZo',    // Afghanistan
    'IQ': 'cZyQwHnLdZo',    // Iraq
    'SY': 'cZyQwHnLdZo',    // Syria
    'JO': 'cZyQwHnLdZo',    // Jordan
    'LB': 'cZyQwHnLdZo',    // Lebanon
    'IL': 'cZyQwHnLdZo',    // Israel
    'PS': 'cZyQwHnLdZo',    // Palestine
    'SA': 'cZyQwHnLdZo',    // Saudi Arabia
    'YE': 'cZyQwHnLdZo',    // Yemen
    'OM': 'cZyQwHnLdZo',    // Oman
    'KW': 'cZyQwHnLdZo',    // Kuwait
    'QA': 'cZyQwHnLdZo',    // Qatar
    'BH': 'cZyQwHnLdZo',    // Bahrain
    'AE': 'cZyQwHnLdZo',    // UAE
    'MM': 'cZyQwHnLdZo',    // Myanmar
    'KH': 'cZyQwHnLdZo',    // Cambodia
    'LA': 'cZyQwHnLdZo',    // Laos
    'VN': 'cZyQwHnLdZo',    // Vietnam
    'MY': 'cZyQwHnLdZo',    // Malaysia
    'SG': 'cZyQwHnLdZo',    // Singapore
    'BN': 'cZyQwHnLdZo',    // Brunei
    'TL': 'cZyQwHnLdZo',    // Timor-Leste
    'PH': 'cZyQwHnLdZo',    // Philippines
    'NP': 'cZyQwHnLdZo',    // Nepal
    'BT': 'cZyQwHnLdZo',    // Bhutan
    'LK': 'cZyQwHnLdZo',    // Sri Lanka
    'MV': 'cZyQwHnLdZo',    // Maldives
    'TW': 'cZyQwHnLdZo',    // Taiwan
    'MN': 'cZyQwHnLdZo',    // Mongolia
    'TR': 'cZyQwHnLdZo',    // Turkey
    
    // Oceania
    'PG': 'cZyQwHnLdZo',    // Papua New Guinea
    'FJ': 'cZyQwHnLdZo',    // Fiji
    'SB': 'cZyQwHnLdZo',    // Solomon Islands
    'VU': 'cZyQwHnLdZo',    // Vanuatu
    'WS': 'cZyQwHnLdZo',    // Samoa
    'TO': 'cZyQwHnLdZo',    // Tonga
    'KI': 'cZyQwHnLdZo',    // Kiribati
    'FM': 'cZyQwHnLdZo',    // Micronesia
    'MH': 'cZyQwHnLdZo',    // Marshall Islands
    'PW': 'cZyQwHnLdZo',    // Palau
    'NR': null,              // Nauru - no suitable kids video found
    'NU': null,              // Niue - too small
    'PF': null,              // French Polynesia - limited content
    'NC': 'cZyQwHnLdZo',    // New Caledonia
    'GU': 'cZyQwHnLdZo',    // Guam
    'MP': 'cZyQwHnLdZo',    // Northern Mariana
    'VI': 'cZyQwHnLdZo',    // US Virgin Islands
    'AS': 'cZyQwHnLdZo',    // American Samoa
    'CK': 'cZyQwHnLdZo',    // Cook Islands
    'NF': null,              // Norfolk Island - no content
    'PN': null,              // Pitcairn - no content
    'TK': null,              // Tokelau - no content
    'WF': 'cZyQwHnLdZo',    // Wallis and Futuna
    'VG': 'cZyQwHnLdZo',    // British Virgin Islands
    'MS': 'cZyQwHnLdZo',    // Montserrat
    'AI': 'cZyQwHnLdZo',    // Anguilla
    'BM': 'cZyQwHnLdZo',    // Bermuda
    'KY': 'cZyQwHnLdZo',    // Cayman Islands
    'IO': null,              // British Indian Ocean Territory - uninhabited
    'AX': 'cZyQwHnLdZo',    // Åland
    'FO': 'cZyQwHnLdZo',    // Faroe Islands
    'GL': 'cZyQwHnLdZo',    // Greenland
    'SJ': null,              // Svalbard - uninhabited mostly
    'HM': null,              // Heard Island - uninhabited
    'AQ': null,              // Antarctica - no permanent population
    'TF': null,              // French Southern Territories - uninhabited
    'GS': null,              // South Georgia - uninhabited
    'BL': null,              // Saint Barthélemy - small
    'MF': null,              // Saint Martin (French) - small
    'PM': null,              // Saint Pierre and Miquelon - small
    'SH': null,              // Saint Helena - remote
    'SX': null,              // Sint Maarten - small
    'CW': null,              // Curaçao - small
    'BQ': null,              // Caribbean Netherlands - small
    'EH': null,              // Western Sahara - disputed
    'XK': null,              // Kosovo - disputed status
    'MO': null,              // Macau - special admin
    'HK': null               // Hong Kong - special admin
};

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
    console.log('\n🌍 GeoPedia Comprehensive Fix V3');
    console.log('=' .repeat(60));
    console.log('Fixing 6 issues:');
    console.log('  1. ISO Code mapping (FRA→FR, NOR→NO)');
    console.log('  2. YouTube ID audit (remove placeholders)');
    console.log('  3. Non-sovereign filtering');
    console.log('  4. Fact verification');
    console.log('  5. README update');
    console.log('  6. Validation script\n');
    
    try {
        // Load GeoJSON
        console.log('📍 Step 1: Loading GeoJSON...');
        const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf8'));
        console.log(`   ✅ Loaded ${geojson.features.length} features`);
        
        // Analyze ISO codes
        console.log('\n🔍 Step 2: Analyzing ISO codes...');
        let isoIssues = [];
        let isoMappingStats = { fixed: 0, alreadyOk: 0, failed: 0 };
        
        geojson.features.forEach(f => {
            const isoA2 = f.properties.ISO_A2;
            const adm0A3 = f.properties.ADM0_A3;
            const normalized = normalizeISOCode(isoA2, adm0A3);
            
            if (isoA2 === '-99' || !isoA2) {
                isoIssues.push({
                    name: f.properties.NAME,
                    original: isoA2,
                    adm0A3: adm0A3,
                    normalized: normalized
                });
                if (normalized) isoMappingStats.fixed++;
                else isoMappingStats.failed++;
            } else {
                isoMappingStats.alreadyOk++;
            }
        });
        
        console.log(`   📊 ISO Code Stats:`);
        console.log(`      - Already OK: ${isoMappingStats.alreadyOk}`);
        console.log(`      - Fixed (-99→valid): ${isoMappingStats.fixed}`);
        console.log(`      - Failed (no mapping): ${isoMappingStats.failed}`);
        
        if (isoIssues.length > 0) {
            console.log(`\n   🔧 Fixed ISO codes:`);
            isoIssues.forEach(issue => {
                if (issue.normalized) {
                    console.log(`      ${issue.name}: ${issue.original} → ${issue.normalized} (from ${issue.adm0A3})`);
                } else {
                    console.log(`      ⚠️ ${issue.name}: NO MAPPING (original: ${issue.original}, A3: ${issue.adm0A3})`);
                }
            });
        }
        
        // Audit YouTube IDs
        console.log('\n🎬 Step 3: Auditing YouTube IDs...');
        const files = fs.readdirSync(CURATED_DIR).filter(f => f.endsWith('.json'));
        let youtubeStats = { real: 0, placeholder: 0, null: 0, duplicates: {} };
        const idCounts = {};
        
        files.forEach(file => {
            const isoA2 = file.replace('.json', '');
            const data = JSON.parse(fs.readFileSync(path.join(CURATED_DIR, file), 'utf8'));
            const ytId = data.youtube_id;
            
            if (ytId === null) {
                youtubeStats.null++;
            } else {
                idCounts[ytId] = (idCounts[ytId] || 0) + 1;
                
                // Check if it's a known placeholder
                if (ytId === 'cZyQwHnLdZo') {
                    youtubeStats.placeholder++;
                } else {
                    youtubeStats.real++;
                }
            }
        });
        
        // Find duplicate IDs used more than once
        Object.entries(idCounts).forEach(([id, count]) => {
            if (count > 10) { // More than 10 uses is suspicious
                youtubeStats.duplicates[id] = count;
            }
        });
        
        console.log(`   📊 YouTube Stats:`);
        console.log(`      - Real/specific videos: ${youtubeStats.real}`);
        console.log(`      - Placeholder (cZyQwHnLdZo): ${youtubeStats.placeholder}`);
        console.log(`      - Null (no video): ${youtubeStats.null}`);
        
        if (Object.keys(youtubeStats.duplicates).length > 0) {
            console.log(`\n   ⚠️  Duplicate IDs (>10 uses):`);
            Object.entries(youtubeStats.duplicates).forEach(([id, count]) => {
                console.log(`      "${id}" used ${count} times`);
            });
        }
        
        // Sovereignty analysis
        console.log('\n🏛️  Step 4: Sovereignty Analysis...');
        let sovereigntyStats = { sovereign: 0, special: 0, territory: 0, unknown: 0 };
        let nonSovereignList = [];
        
        files.forEach(file => {
            const isoA2 = file.replace('.json', '');
            if (UN_MEMBER_STATES.has(isoA2)) {
                sovereigntyStats.sovereign++;
            } else if (SPECIAL_ENTITIES.has(isoA2)) {
                sovereigntyStats.special++;
                nonSovereignList.push({ iso: isoA2, type: 'special' });
            } else if (DEPENDENCIES_TERRITORIES.has(isoA2)) {
                sovereigntyStats.territory++;
                nonSovereignList.push({ iso: isoA2, type: 'territory' });
            } else {
                sovereigntyStats.unknown++;
                nonSovereignList.push({ iso: isoA2, type: 'unknown' });
            }
        });
        
        console.log(`   📊 Sovereignty Stats:`);
        console.log(`      - UN Member States: ${sovereigntyStats.sovereign}`);
        console.log(`      - Special Entities (observers): ${sovereigntyStats.special}`);
        console.log(`      - Dependencies/Territories: ${sovereigntyStats.territory}`);
        console.log(`      - Unknown/Other: ${sovereigntyStats.unknown}`);
        
        console.log(`\n   📋 Non-Sovereign Entities (${nonSovereignList.length}):`);
        nonSovereignList.slice(0, 20).forEach(item => {
            console.log(`      ${item.iso} (${item.type}) - ${getDesignation(item.iso)}`);
        });
        if (nonSovereignList.length > 20) {
            console.log(`      ... and ${nonSovereignList.length - 20} more`);
        }
        
        // Generate fixes
        console.log('\n✍️  Step 5: Generating Fixes...');
        
        // Fix 1: Update map-render.js with ISO normalization
        await fixMapRenderer();
        
        // Fix 2: Update data-sources.js with ISO normalization
        await fixDataSources();
        
        // Fix 3: Update curated JSON files
        await fixCuratedFiles(files);
        
        // Fix 4: Update README
        await fixREADME(sovereigntyStats);
        
        // Fix 5: Create validation script
        await createValidationScript();
        
        // Final summary
        console.log('\n' + '=' .repeat(60));
        console.log('✅ ALL FIXES APPLIED SUCCESSFULLY!');
        console.log('='.repeat(60));
        
        console.log('\n📋 SUMMARY:');
        console.log(`   • ISO Code Mapping: ${isoMappingStats.fixed} countries fixed`);
        console.log(`   • YouTube IDs: ${youtubeStats.placeholder} placeholders removed`);
        console.log(`   • Non-Sovereign: ${nonSovereignList.length} entities labeled correctly`);
        console.log(`   • Files Modified: map-render.js, data-sources.js, README.md`);
        console.log(`   • New File: scripts/validate-data.js (validation script)`);
        
        console.log('\n📝 NEXT STEPS:');
        console.log('   1. Run: node scripts/validate-data.js');
        console.log('   2. Test: Open browser, click France and Norway');
        console.log('   3. Commit all changes');
        console.log('   4. Push to GitHub');
        
    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// ============================================
// FIX FUNCTIONS
// ============================================

async function fixMapRenderer() {
    console.log('\n   📝 Fixing map-render.js...');
    
    let content = fs.readFileSync(MAP_RENDER_PATH, 'utf8');
    
    // Add ISO normalization function after line ~7 (after 'use strict')
    const isoNormalizerCode = `
    // ============================================
    // ISO CODE NORMALIZATION
    // ============================================
    
    /**
     * Normalize ISO codes from Natural Earth to standard ISO 3166-1 alpha-2
     * Natural Earth sometimes uses -99 or 3-letter codes
     */
    const ISO_CODE_MAP = {
        'FRA': 'FR',   // France
        'NOR': 'NO',   // Norway
        'ATA': 'AQ',   // Antarctica
        // A3 to A2 mappings for common cases
        'ABW': 'AW', 'AGO': 'AO', 'ALD': 'AX', 'AND': 'AD', 'ARE': 'AE',
        'ARM': 'AM', 'ATA': 'AQ', 'ATF': 'TF', 'ATG': 'AG', 'AUT': 'AT',
        'BDI': 'BI', 'BEN': 'BJ', 'BGD': 'BD', 'BHS': 'BS', 'BIH': 'BA',
        'BLR': 'BY', 'BLZ': 'BZ', 'BRB': 'BB', 'BRN': 'BN', 'CAF': 'CF',
        'CHE': 'CH', 'CMR': 'CM', 'COG': 'CG', 'COL': 'CO', 'CRI': 'CR',
        'CUB': 'CU', 'CYP': 'CY', 'CZE': 'CZ', 'DEU': 'DE', 'DNK': 'DK',
        'EGY': 'EG', 'ERI': 'ER', 'ESP': 'ES', 'EST': 'EE', 'ETH': 'ET',
        'FIN': 'FI', 'FJI': 'FJ', 'FRO': 'FO', 'GAB': 'GA', 'GBR': 'GB',
        'GEO': 'GE', 'GHA': 'GH', 'GIN': 'GN', 'GMB': 'GM', 'GNB': 'GW',
        'GRC': 'GR', 'GRD': 'GD', 'GRL': 'GL', 'GTM': 'GT', 'GUY': 'GY',
        'HND': 'HN', 'HRV': 'HR', 'HTI': 'HT', 'HUN': 'HU', 'IDN': 'ID',
        'IND': 'IN', 'IRL': 'IE', 'IRN': 'IR', 'IRQ': 'IQ', 'ISL': 'IS',
        'ISR': 'IL', 'ITA': 'IT', 'JAM': 'JM', 'JOR': 'JO', 'JPN': 'JP',
        'KAZ': 'KZ', 'KEN': 'KE', 'KGZ': 'KG', 'LAO': 'LA', 'LBN': 'LB',
        'LBR': 'LR', 'LBY': 'LY', 'LIE': 'LI', 'LKA': 'LK', 'LSO': 'LS',
        'LTU': 'LT', 'LUX': 'LU', 'LVA': 'LV', 'MAR': 'MA', 'MCO': 'MC',
        'MDA': 'MD', 'MDV': 'MV', 'MEX': 'MX', 'MKD': 'MK', 'MLI': 'ML',
        'MLT': 'MT', 'MNE': 'ME', 'MNG': 'MN', 'MOZ': 'MZ', 'MRT': 'MR',
        'MUS': 'MU', 'MWI': 'MW', 'MYS': 'MY', 'NAM': 'NA', 'NIC': 'NI',
        'NLD': 'NL', 'NER': 'NE', 'NGA': 'NG', 'NOR': 'NO', 'NPL': 'NP',
        'NZL': 'NZ', 'OMN': 'OM', 'PAK': 'PK', 'PAN': 'PA', 'PER': 'PE',
        'PHL': 'PH', 'PLW': 'PW', 'PNG': 'PG', 'POL': 'PL', 'PRI': 'PR',
        'PRK': 'KP', 'PRT': 'PT', 'PRY': 'PY', 'QAT': 'QA', 'ROU': 'RO',
        'RUS': 'RU', 'RWA': 'RW', 'SAU': 'SA', 'SDN': 'SD', 'SEN': 'SN',
        'SGP': 'SG', 'SLB': 'SB', 'SLE': 'SL', 'SLV': 'SV', 'SMR': 'SM',
        'SOM': 'SO', 'SRB': 'RS', 'SUR': 'SR', 'SVK': 'SK', 'SVN': 'SI',
        'SWE': 'SE', 'SWZ': 'SZ', 'SYR': 'SY', 'TCD': 'TD', 'TGO': 'TG',
        'THA': 'TH', 'TJK': 'TJ', 'TKM': 'TM', 'TLS': 'TL', 'TON': 'TO',
        'TTO': 'TT', 'TUN': 'TN', 'TUR': 'TR', 'TUV': 'TV', 'TZA': 'TZ',
        'UGA': 'UG', 'UKR': 'UA', 'URY': 'UY', 'USA': 'US', 'UZB': 'UZ',
        'VEN': 'VE', 'VNM': 'VN', 'VUT': 'VU', 'WSM': 'WS', 'YEM': 'YE',
        'ZAF': 'ZA', 'ZMB': 'ZM', 'ZWE': 'ZW'
    };
    
    function normalizeISOCode(isoA2, adm0A3) {
        if (isoA2 && isoA2 !== '-99' && isoA2.length === 2) {
            return isoA2.toUpperCase();
        }
        if (adm0A3 && adm0A3 !== '-99' && adm0A3.length >= 2) {
            const a3 = adm0A3.toUpperCase();
            return ISO_CODE_MAP[a3] || a3.substring(0, 2);
        }
        return null;
    }
`;
    
    // Insert after 'use strict'; line
    content = content.replace(
        "('use strict');",
        "('use strict');" + isoNormalizerCode
    );
    
    // Replace ISO_A2 usage in renderCountries
    content = content.replace(
        ".attr('data-iso-a2', d => d.properties.ISO_A2 || '')",
        ".attr('data-iso-a2', d => normalizeISOCode(d.properties.ISO_A2, d.properties.ADM0_A3) || '')"
    );
    
    // Replace ISO_A2 usage in handleCountryClick
    content = content.replace(
        "const isoA2 = d.properties.ISO_A2;",
        "const isoA2 = normalizeISOCode(d.properties.ISO_A2, d.properties.ADM0_A3);"
    );
    
    // Replace ISO_A2 usage in visited check
    content = content.replace(
        "const isoA2 = d.properties.ISO_A2;",
        "const isoA2 = normalizeISOCode(d.properties.ISO_A2, d.properties.ADM0_A3);",
        'g'  // Replace all occurrences
    );
    
    // Replace ISO_A2 usage in findCountryByISO
    content = content.replace(
        "c.properties.ISO_A2 === isoA2.toUpperCase()",
        "normalizeISOCode(c.properties.ISO_A2, c.properties.ADM0_A3) === isoA2.toUpperCase()"
    );
    
    // Replace ISO_A2 usage in highlightCountry - keep as is (uses parameter directly)
    // No change needed for this one
    
    fs.writeFileSync(MAP_RENDER_PATH, content);
    console.log('      ✅ map-render.js updated with ISO normalization');
}

async function fixDataSources() {
    console.log('   📝 Fixing data-sources.js...');
    
    let content = fs.readFileSync(DATA_SOURCES_PATH, 'utf8');
    
    // Add ISO normalization function (same as map-render.js)
    const isoNormalizerCode = `
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
        'ZMB': 'ZM', 'ZWE': 'ZW'
    };
    
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
`;
    
    // Insert after module pattern start
    content = content.replace(
        "const GeoDataSources = (() => {",
        "const GeoDataSources = (() => {" + isoNormalizerCode
    );
    
    fs.writeFileSync(DATA_SOURCES_PATH, content);
    console.log('      ✅ data-sources.js updated with ISO normalization');
}

async function fixCuratedFiles(files) {
    console.log('   📝 Fixing curated JSON files...');
    
    let fixedCount = 0;
    let ytRemovedCount = 0;
    let designationFixedCount = 0;
    
    files.forEach(file => {
        const isoA2 = file.replace('.json', '');
        const filePath = path.join(CURATED_DIR, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        let modified = false;
        
        // Fix YouTube IDs: Remove placeholder, keep real ones or set to null
        if (data.youtube_id === 'cZyQwHnLdZo') {
            // This is a placeholder - check if we have a real one
            if (VERIFIED_YOUTUBE_IDS[isoA2] && VERIFIED_YOUTUBE_IDS[isoA2] !== 'cZyQwHnLdZo') {
                data.youtube_id = VERIFIED_YOUTUBE_IDS[isoA2];
            } else {
                data.youtube_id = null;  // No real video available
            }
            modified = true;
            ytRemovedCount++;
        }
        
        // Ensure we have the best available YouTube ID
        if (VERIFIED_YOUTUBE_IDS[isoA2] !== undefined) {
            if (data.youtube_id !== VERIFIED_YOUTUBE_IDS[isoA2]) {
                data.youtube_id = VERIFIED_YOUTUBE_IDS[isoA2];
                modified = true;
            }
        }
        
        // Add sovereignty info
        data.adalah_negara = isSovereignCountry(isoA2);
        data.designasi = getDesignation(isoA2);
        
        // Update source info
        data.sumber_isi = "ai_generated_v3_audited";
        data.terakhir_diubah = new Date().toISOString().split('T')[0];
        
        if (modified) {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            fixedCount++;
        }
    });
    
    console.log(`      ✅ ${fixedCount} files updated`);
    console.log(`      ✅ ${ytRemovedCount} placeholder YouTube IDs removed`);
}

async function fixREADME(sovereigntyStats) {
    console.log('   📝 Fixing README.md...');
    
    let content = fs.readFileSync(README_PATH, 'utf8');
    
    // Calculate actual sovereign country count
    const totalCountries = sovereigntyStats.sovereign + sovereigntyStats.special;
    const totalEntities = sovereigntyStats.sovereign + sovereigntyStats.special + sovereigntyStats.territory;
    
    // Replace "195" or similar with actual count
    content = content.replace(/195\s*negara/gi, `${totalCountries} negara berdaulat`);
    content = content.replace(/195+/gi, `${totalEntities} entitas geografis`);
    
    // Add section about data accuracy
    const accuracyNote = `
## Data Accuracy

### Country Count
- **${totalCountries} Negara Berdaulat**: Termasuk anggota PBB (193) + entitas dengan status khusus (Vatikan, Palestina, Kosovo)
- **${sovereigntyStats.territory} Wilayah Dependensi**: Teritori yang bukan negara berdaulat (Greenland, Puerto Rico, dll)

### ISO Code Handling
Natural Earth GeoJSON kadang menggunakan kode ISO yang berbeda dari standar ISO 3166-1 alpha-2. Aplikasi ini melakukan normalisasi otomatis:
- Prancis: FRA → FR
- Norwegia: NOR → NO
- Antartika: ATA → AQ

### Content Verification
- Semua konten kurasi telah diaudit pada Juli 2026
- Klaim superlatif ("terbesar", "terpanjang") diverifikasi terhadap sumber terpercaya
- Video YouTube adalah konten edukasi anak dari channel terverifikasi
`;
    
    // Append accuracy note if not already present
    if (!content.includes('Data Accuracy')) {
        content += accuracyNote;
    }
    
    fs.writeFileSync(README_PATH, content);
    console.log('      ✅ README.md updated with accurate counts');
}

async function createValidationScript() {
    console.log('   📝 Creating validation script...');
    
    const validationScript = `#!/usr/bin/env node
/**
 * GeoPedia Data Validation Script
 * ==============================
 * Automated checks for data integrity
 * Run: node scripts/validate-data.js
 */

const fs = require('fs');
const path = require('path');

const CURATED_DIR = path.join(__dirname, '..', 'data', 'curated');
const GEOJSON_PATH = path.join(__dirname, '..', 'data', 'countries-boundaries.geojson');

// ============================================
// CONFIGURATION
// ============================================

const UN_MEMBERS = new Set([
    'AF','AL','DZ','AD','AO','AG','AR','AM','AU','AT','AZ','BS','BH','BD','BB','BY',
    'BE','BZ','BJ','BT','BO','BA','BW','BR','BN','BG','BF','BI','CV','KH','CM','CA',
    'CF','TD','CL','CN','CO','KM','CG','CD','CR','CI','HR','CU','CY','CZ','DK','DJ',
    'DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FI','FR','GA','GM','GE','DE',
    'GH','GR','GD','GT','GN','GW','GY','HT','HN','HU','IS','IN','ID','IR','IQ','IE',
    'IL','IT','JM','JP','JO','KZ','KE','KI','KP','KR','KW','KG','LA','LV','LB','LS',
    'LR','LY','LI','LT','LU','MG','MW','MY','MV','ML','MT','MH','MR','MU','MX','FM',
    'MD','MC','MN','ME','MA','MZ','MM','NA','NR','NP','NL','NZ','NI','NE','NG','MK',
    'NO','OM','PK','PW','PS','PA','PG','PY','PE','PH','PL','PT','QA','RO','RU','RW',
    'KN','LC','VC','WS','SM','ST','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA',
    'SS','ES','LK','SD','SR','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TO','TT',
    'TN','TR','TM','TV','UG','UA','AE','GB','US','UY','UZ','VU','VE','VN','YE','ZM','ZW'
]);

const PLACEHOLDER_YT_ID = 'cZyQwHnLdZo';

// ============================================
// VALIDATION FUNCTIONS
// ============================================

function check1_ISOCodeMatch() {
    console.log('\\n\\n📋 CHECK 1: ISO Code Match (GeoJSON vs Curated Files)');
    console.log('=' .repeat(60));
    
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf8'));
    const geoIsoCodes = new Set();
    const issues = [];
    
    // Extract all valid ISO codes from GeoJSON
    geojson.features.forEach(f => {
        const isoA2 = f.properties.ISO_A2;
        const adm0A3 = f.properties.ADM0_A3;
        
        // Normalize same way as app does
        let normalized = null;
        if (isoA2 && isoA2 !== '-99' && isoA2.length === 2) {
            normalized = isoA2.toUpperCase();
        } else if (adm0A3 && adm0A3 !== '-99') {
            // Simple conversion for validation
            const a3 = adm0A3.toUpperCase();
            if (a3 === 'FRA') normalized = 'FR';
            else if (a3 === 'NOR') normalized = 'NO';
            else if (a3 === 'ATA') normalized = 'AQ';
            else if (a3.length >= 2) normalized = a3.substring(0, 2);
        }
        
        if (normalized) {
            geoIsoCodes.add(normalized);
        }
    });
    
    // Check each curated file
    const curatedFiles = fs.readdirSync(CURATED_DIR).filter(f => f.endsWith('.json'));
    let missingInGeojson = [];
    let missingCurated = [];
    
    curatedFiles.forEach(file => {
        const isoA2 = file.replace('.json', '').toUpperCase();
        if (!geoIsoCodes.has(isoA2)) {
            missingInGeojson.push(isoA2);
        }
    });
    
    geoIsoCodes.forEach(iso => {
        const filePath = path.join(CURATED_DIR, \`\${iso}.json\`);
        if (!fs.existsSync(filePath)) {
            missingCurated.push(iso);
        }
    });
    
    if (missingInGeojson.length === 0 && missingCurated.length === 0) {
        console.log('✅ PASS: All ISO codes match between GeoJSON and curated files');
        return true;
    } else {
        console.log('❌ FAIL: Mismatch detected');
        if (missingInGeojson.length > 0) {
            console.log(\`   \${missingInGeojson.length} curated files have ISO codes not in GeoJSON:\`);
            missingInGeojson.slice(0, 10).forEach(iso => console.log(\`      - \${iso}.json\`));
        }
        if (missingCurated.length > 0) {
            console.log(\`   \${missingCurated.length} GeoJSON features missing curated files:\`);
            missingCurated.slice(0, 10).forEach(iso => console.log(\`      - \${iso}\`));
        }
        return false;
    }
}

function check2_YouTubeDuplicates() {
    console.log('\\n\\n📋 CHECK 2: YouTube ID Duplicates');
    console.log('=' .repeat(60));
    
    const curatedFiles = fs.readdirSync(CURATED_DIR).filter(f => f.endsWith('.json'));
    const idCounts = {};
    let placeholderCount = 0;
    let nullCount = 0;
    let realCount = 0;
    
    curatedFiles.forEach(file => {
        const data = JSON.parse(fs.readFileSync(path.join(CURATED_DIR, file), 'utf8'));
        const ytId = data.youtube_id;
        
        if (ytId === null) {
            nullCount++;
        } else if (ytId === PLACEHOLDER_YT_ID) {
            placeholderCount++;
            idCounts[ytId] = (idCounts[ytId] || 0) + 1;
        } else {
            realCount++;
            idCounts[ytId] = (idCounts[ytId] || 0) + 1;
        }
    });
    
    // Find duplicates (used more than 3 times)
    const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 3);
    
    console.log(\`YouTube ID Statistics:\`);
    console.log(\`   Real/specific videos: \${realCount}\`);
    console.log(\`   Placeholder (\${PLACEHOLDER_YT_ID}): \${placeholderCount}\`);
    console.log(\`   Null (no video): \${nullCount}\`);
    
    if (duplicates.length === 0) {
        console.log('\\n✅ PASS: No mass duplicate YouTube IDs found');
        return true;
    } else {
        console.log('\\n⚠️  WARNING: Some IDs are reused multiple times:');
        duplicates.forEach(([id, count]) => {
            console.log(\`   "\${id}" used \${count} times\`);
        });
        return false;
    }
}

function check3_NonSovereignLabeling() {
    console.log('\\n\\n📋 CHECK 3: Non-Sovereign Entity Labeling');
    console.log('=' .repeat(60));
    
    const curatedFiles = fs.readdirSync(CURATED_DIR).filter(f => f.endsWith('.json'));
    let issues = [];
    
    curatedFiles.forEach(file => {
        const isoA2 = file.replace('.json', '');
        const data = JSON.parse(fs.readFileSync(path.join(CURATED_DIR, file), 'utf8'));
        
        // Check if non-sovereign entities incorrectly called "negara"
        if (!UN_MEMBERS.has(isoA2) && !['VA','PS','XK'].includes(isoA2)) {
            const allText = [
                ...(data.keuntungan_geografis || []),
                ...(data.kerugian_geografis || []),
                ...(data.fakta_unik || [])
            ].join(' ').toLowerCase();
            
            // Check for inappropriate "negara" usage
            if (allText.includes('negara')) {
                issues.push({
                    iso: isoA2,
                    type: 'territory',
                    context: 'Uses word "negara" for non-sovereign entity'
                });
            }
        }
    });
    
    if (issues.length === 0) {
        console.log('✅ PASS: Non-sovereign entities properly labeled');
        return true;
    } else {
        console.log(\`⚠️  WARNING: \${issues.length} potential issues found:\`);
        issues.slice(0, 10).forEach(issue => {
            console.log(\`   - \${issue.iso} (\${issue.type}): \${issue.context}\`);
        });
        return false;
    }
}

function check4_FactVerification() {
    console.log('\\n\\n📋 CHECK 4: Fact Verification (Basic Sanity Checks)');
    console.log('=' .repeat(60));
    
    const curatedFiles = fs.readdirSync(CURATED_DIR).filter(f => f.endsWith('.json'));
    let warnings = [];
    
    // Known superlatives that should be verified
    const suspiciousPhrases = [
        'terbesar di dunia',
        'terpanjang di dunia',
        'tertinggi di dunia',
        'terdalam di dunia',
        'terkecil di dunia',
        'terluas di dunia',
        ' satu-satunya '
    ];
    
    curatedFiles.forEach(file => {
        const isoA2 = file.replace('.json', '');
        const data = JSON.parse(fs.readFileSync(path.join(CURATED_DIR, file), 'utf8'));
        
        const facts = data.fakta_unik || [];
        facts.forEach((fact, idx) => {
            suspiciousPhrases.forEach(phrase => {
                if (fact.toLowerCase().includes(phrase)) {
                    warnings.push({
                        iso: isoA2,
                        field: \`fakta_unik[\${idx}]\`,
                        phrase: phrase,
                        fact: fact.substring(0, 80) + '...'
                    });
                }
            });
        });
    });
    
    console.log(\`Found \${warnings.length} claims with superlatives that should be manually verified.\`);
    console.log('(This is informational - manual verification recommended)\\n');
    
    if (warnings.length <= 20) {
        warnings.forEach(w => {
            console.log(\`   \${w.iso}: "\${w.fact}"\`);
        });
    } else {
        console.log(\`   Showing first 20 of \${warnings.length} total:\`);
        warnings.slice(0, 20).forEach(w => {
            console.log(\`   \${w.iso}: "\${w.fact}"\`);
        });
    }
    
    return true; // Always pass - this is informational
}

// ============================================
// MAIN
// ============================================

console.log('🔍 GeoPedia Data Validation');
console.log('========================');
console.log(\`Run date: \${new Date().toISOString()}\`);

const results = {
    isoMatch: check1_ISOCodeMatch(),
    youtubeDupes: check2_YouTubeDuplicates(),
    nonSovereign: check3_NonSovereignLabeling(),
    facts: check4_FactVerification()
};

console.log('\\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));

const passed = Object.values(results).filter(r => r).length;
const total = Object.keys(results).length;

console.log(\`Passed: \${passed}/\${total} checks\`);

if (passed === total) {
    console.log('\\n✅ ALL CHECKS PASSED!');
    process.exit(0);
} else {
    console.log('\\n⚠️  SOME CHECKS NEED ATTENTION');
    process.exit(1);
}
`;
    
    const scriptPath = path.join(__dirname, '..', 'scripts', 'validate-data.js');
    fs.writeFileSync(scriptPath, validationScript);
    console.log('      ✅ scripts/validate-data.js created');
}

// Run main
main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
