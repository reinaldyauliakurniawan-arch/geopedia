#!/usr/bin/env node
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
    'DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FJ','FI','FR','GA','GM','GE','DE',
    'GH','GR','GD','GT','GN','GW','GY','HT','HN','HU','IS','IN','ID','IR','IQ','IE',
    'IL','IT','JM','JP','JO','KZ','KE','KI','KP','KR','KW','KG','LA','LV','LB','LS',
    'LR','LY','LI','LT','LU','MG','MW','MY','MV','ML','MT','MH','MR','MU','MX','FM',
    'MD','MC','MN','ME','MA','MZ','MM','NA','NR','NP','NL','NZ','NI','NE','NG','MK',
    'NO','OM','PK','PW','PA','PG','PY','PE','PH','PL','PT','QA','RO','RU','RW',
    'KN','LC','VC','WS','SM','ST','SA','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA',
    'SS','ES','LK','SD','SR','SE','CH','SY','TJ','TZ','TH','TL','TG','TO','TT',
    'TN','TR','TM','TV','UG','UA','AE','GB','US','UY','UZ','VU','VE','VN','YE','ZM','ZW'
]);

const PLACEHOLDER_YT_ID = 'cZyQwHnLdZo';

// ============================================
// VALIDATION FUNCTIONS
// ============================================

function check1_ISOCodeMatch() {
    console.log('\n\n📋 CHECK 1: ISO Code Match (GeoJSON vs Curated Files)');
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
        const filePath = path.join(CURATED_DIR, `${iso}.json`);
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
            console.log(`   ${missingInGeojson.length} curated files have ISO codes not in GeoJSON:`);
            missingInGeojson.slice(0, 10).forEach(iso => console.log(`      - ${iso}.json`));
        }
        if (missingCurated.length > 0) {
            console.log(`   ${missingCurated.length} GeoJSON features missing curated files:`);
            missingCurated.slice(0, 10).forEach(iso => console.log(`      - ${iso}`));
        }
        return false;
    }
}

function check2_YouTubeDuplicates() {
    console.log('\n\n📋 CHECK 2: YouTube ID Duplicates');
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
    
    console.log(`YouTube ID Statistics:`);
    console.log(`   Real/specific videos: ${realCount}`);
    console.log(`   Placeholder (${PLACEHOLDER_YT_ID}): ${placeholderCount}`);
    console.log(`   Null (no video): ${nullCount}`);
    
    if (duplicates.length === 0) {
        console.log('\n✅ PASS: No mass duplicate YouTube IDs found');
        return true;
    } else {
        console.log('\n⚠️  WARNING: Some IDs are reused multiple times:');
        duplicates.forEach(([id, count]) => {
            console.log(`   "${id}" used ${count} times`);
        });
        return false;
    }
}

function check3_NonSovereignLabeling() {
    console.log('\n\n📋 CHECK 3: Non-Sovereign Entity Labeling');
    console.log('=' .repeat(60));
    
    const curatedFiles = fs.readdirSync(CURATED_DIR).filter(f => f.endsWith('.json'));
    let issues = [];
    
    curatedFiles.forEach(file => {
        const isoA2 = file.replace('.json', '');
        const data = JSON.parse(fs.readFileSync(path.join(CURATED_DIR, file), 'utf8'));
        
        // Check if non-sovereign entities incorrectly called "negara"
        if (!UN_MEMBERS.has(isoA2) && !['VA','PS','XK','TW'].includes(isoA2)) {
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
        console.log(`⚠️  WARNING: ${issues.length} potential issues found:`);
        issues.slice(0, 10).forEach(issue => {
            console.log(`   - ${issue.iso} (${issue.type}): ${issue.context}`);
        });
        return false;
    }
}

function check4_ISOCollision() {
    console.log('\n\n📋 CHECK 4: ISO Code Collision Detection');
    console.log('=' .repeat(60));

    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf8'));
    const normalizeMap = {
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
        'MWI': 'MW', 'MYS': 'MY', 'NAM': 'NA', 'NLD': 'NL', 'NZL': 'NZ',
        'NIC': 'NI', 'NER': 'NE', 'NGA': 'NG', 'PRK': 'KP', 'PAN': 'PA',
        'PER': 'PE', 'PHL': 'PH', 'PNG': 'PG', 'POL': 'PL', 'PRY': 'PY',
        'PRT': 'PT', 'QAT': 'QA', 'ROU': 'RO', 'RUS': 'RU', 'RWA': 'RW',
        'SDN': 'SD', 'SEN': 'SN', 'SGP': 'SG', 'SLV': 'SV', 'SRB': 'RS',
        'SUR': 'SR', 'SVK': 'SK', 'SVN': 'SI', 'SWE': 'SE', 'SYR': 'SY',
        'TCD': 'TD', 'TGO': 'TG', 'TJK': 'TJ', 'THA': 'TH', 'TUN': 'TN',
        'TUR': 'TR', 'TZA': 'TZ', 'UGA': 'UG', 'UKR': 'UA', 'URY': 'UY',
        'UZB': 'UZ', 'VEN': 'VE', 'VNM': 'VN', 'YEM': 'YE', 'ZAF': 'ZA',
        'ZMB': 'ZM', 'ZWE': 'ZW', 'BFA': 'BF', 'CIV': 'CI', 'CMR': 'CM',
        'COD': 'CD', 'COG': 'CG', 'DJI': 'DJ', 'ERI': 'ER', 'ETH': 'ET',
        'GMB': 'GM', 'GHA': 'GH', 'GIN': 'GN', 'KEN': 'KE', 'LBR': 'LR',
        'LBY': 'LY', 'MDG': 'MG', 'MRT': 'MR', 'MUS': 'MU', 'NAM': 'NA',
        'NER': 'NE', 'NGA': 'NG', 'RWA': 'RW', 'SEN': 'SN', 'SLE': 'SL',
        'SOM': 'SO', 'SSD': 'SS', 'TZA': 'TZ', 'UGA': 'UG', 'ZMB': 'ZM',
        'ZWE': 'ZW', 'CUB': 'CU', 'DOM': 'DO', 'GTM': 'GT', 'HND': 'HN',
        'HTI': 'HT', 'JAM': 'JM', 'NIC': 'NI', 'PAN': 'PA', 'SLV': 'SV',
        'BHS': 'BS', 'BLZ': 'BZ', 'CAN': 'CA', 'CRI': 'CR', 'GRD': 'GD',
        'GUY': 'GY', 'HND': 'HN', 'JAM': 'JM', 'MEX': 'MX', 'PAN': 'PA',
        'SLV': 'SV', 'TTO': 'TT', 'USA': 'US', 'ARG': 'AR', 'BOL': 'BO',
        'BRA': 'BR', 'CHL': 'CL', 'COL': 'CO', 'ECU': 'EC', 'GUF': 'GF',
        'GUY': 'GY', 'PRY': 'PY', 'PER': 'PE', 'SUR': 'SR', 'URY': 'UY',
        'VEN': 'VE', 'ABW': 'AW', 'AIA': 'AI', 'ATG': 'AG', 'BES': 'BQ',
        'BLM': 'BL', 'BVT': 'BV', 'CYM': 'KY', 'CXR': 'CX', 'CCK': 'CC',
        'COK': 'CK', 'CUB': 'CU', 'CUW': 'CW', 'DMA': 'DM', 'FLK': 'FK',
        'FRO': 'FO', 'GRL': 'GL', 'GUM': 'GU', 'GUY': 'GY', 'HMD': 'HM',
        'HKG': 'HK', 'IMN': 'IM', 'IOT': 'IO', 'IRL': 'IE', 'JEY': 'JE',
        'MAC': 'MO', 'MAF': 'MF', 'MSR': 'MS', 'NCL': 'NC', 'NIU': 'NU',
        'NFK': 'NF', 'MNP': 'MP', 'PCN': 'PN', 'PRI': 'PR', 'PYF': 'PF',
        'SHN': 'SH', 'SPM': 'PM', 'KNA': 'KN', 'LCA': 'LC', 'MAF': 'MF',
        'VCT': 'VC', 'SGS': 'GS', 'SXM': 'SX', 'TCA': 'TC', 'TKL': 'TK',
        'TON': 'TO', 'TUV': 'TV', 'UMI': 'UM', 'VGB': 'VG', 'VIR': 'VI',
        'WLF': 'WF', 'WSM': 'WS', 'ASM': 'AS', 'GIB': 'GI', 'GRL': 'GL',
        'GUM': 'GU', 'HKG': 'HK', 'MAC': 'MO', 'NFK': 'NF', 'PNG': 'PG',
        'PRI': 'PR', 'VGB': 'VG'
    };

    const codeMap = new Map(); // normalized_code -> [{adm0_a3, name}]
    let issues = [];

    geojson.features.forEach(f => {
        const isoA2 = f.properties.ISO_A2;
        const adm0A3 = (f.properties.ADM0_A3 || '').toUpperCase();
        const name = f.properties.NAME || 'Unknown';

        let normalized = null;
        if (isoA2 && isoA2 !== '-99' && isoA2.length === 2) {
            normalized = isoA2.toUpperCase();
        } else if (adm0A3 && adm0A3 !== '-99') {
            if (normalizeMap[adm0A3]) {
                normalized = normalizeMap[adm0A3];
            } else if (adm0A3.length >= 2) {
                normalized = adm0A3.substring(0, 2);
            }
        }

        if (normalized) {
            if (!codeMap.has(normalized)) codeMap.set(normalized, []);
            codeMap.get(normalized).push({ adm0_a3: adm0A3, name });
        }
    });

    // Check for collisions (multiple features mapping to same code)
    let collisions = 0;
    codeMap.forEach((features, code) => {
        if (features.length > 1) {
            collisions++;
            issues.push({
                code,
                count: features.length,
                features: features.map(f => `  ${f.adm0_a3} (${f.name})`)
            });
        }
    });

    if (collisions === 0) {
        console.log(`✅ PASS: ${codeMap.size} unique ISO codes, 0 collisions`);
        return true;
    } else {
        console.log(`❌ FAIL: ${collisions} collision(s) detected out of ${codeMap.size} codes:`);
        issues.slice(0, 10).forEach(i => {
            console.log(`   ${i.code} → ${i.count} features:`);
            i.features.forEach(f => console.log(`     ${f}`));
        });
        return false;
    }
}

function check5_FactVerification() {
    console.log('\n\n📋 CHECK 5: Fact Verification (Basic Sanity Checks)');
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
                        field: `fakta_unik[${idx}]`,
                        phrase: phrase,
                        fact: fact.substring(0, 80) + '...'
                    });
                }
            });
        });
    });
    
    console.log(`Found ${warnings.length} claims with superlatives that should be manually verified.`);
    console.log('(This is informational - manual verification recommended)\n');
    
    if (warnings.length <= 20) {
        warnings.forEach(w => {
            console.log(`   ${w.iso}: "${w.fact}"`);
        });
    } else {
        console.log(`   Showing first 20 of ${warnings.length} total:`);
        warnings.slice(0, 20).forEach(w => {
            console.log(`   ${w.iso}: "${w.fact}"`);
        });
    }
    
    return true; // Always pass - this is informational
}

// ============================================
// MAIN
// ============================================

console.log('🔍 GeoPedia Data Validation');
console.log('========================');
console.log(`Run date: ${new Date().toISOString()}`);

const results = {
    isoMatch: check1_ISOCodeMatch(),
    youtubeDupes: check2_YouTubeDuplicates(),
    nonSovereign: check3_NonSovereignLabeling(),
    isoCollision: check4_ISOCollision(),
    facts: check5_FactVerification()
};

console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));

const passed = Object.values(results).filter(r => r).length;
const total = Object.keys(results).length;

console.log(`Passed: ${passed}/${total} checks`);

if (passed === total) {
    console.log('\n✅ ALL CHECKS PASSED!');
    process.exit(0);
} else {
    console.log('\n⚠️  SOME CHECKS NEED ATTENTION');
    process.exit(1);
}
