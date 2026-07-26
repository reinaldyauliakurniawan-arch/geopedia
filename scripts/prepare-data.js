/**
 * GeoPedia Data Preparation Script
 * Downloads GeoJSON files and generates curated country data
 * Run: node scripts/prepare-data.js
 * 
 * This is a DEVELOPMENT ONLY script - not needed in production
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ============================================
// CONFIGURATION
// ============================================

const BASE_URL = 'https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/50m';

const GEOJSON_FILES = {
    countries: {
        url: `${BASE_URL}/cultural/ne_50m_admin_0_countries.json`,
        output: 'data/countries-boundaries.geojson'
    },
    mountains: {
        url: `${BASE_URL}/physical/ne_50m_geography_regions_polys.json`,
        output: 'data/mountains.geojson',
        filter: (feature) => feature.properties.featurecla === 'Range/mtn'
    },
    rivers: {
        url: `${BASE_URL}/physical/ne_50m_rivers_lake_centerlines.json`,
        output: 'data/rivers.geojson'
    },
    lakes: {
        url: `${BASE_URL}/physical/ne_50m_lakes.json`,
        output: 'data/lakes.geojson'
    },
    seas: {
        url: `${BASE_URL}/physical/ne_50m_geography_marine_polys.json`,
        output: 'data/seas-straits.geojson',
        filter: (feature) => ['sea', 'strait', 'bay', 'gulf', 'channel', 'sound'].includes(feature.properties.featurecla)
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        console.log(`  ⬇️  Downloading: ${url.split('/').pop()}`);
        
        protocol.get(url, { timeout: 30000 }, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                // Handle redirect
                downloadFile(response.headers.location, outputPath)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}: ${url}`));
                return;
            }
            
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                
                // Ensure output directory exists
                const dir = path.dirname(outputPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                
                fs.writeFileSync(outputPath, buffer);
                console.log(`  ✅ Saved: ${outputPath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
                resolve(buffer.toString());
            });
            response.on('error', reject);
        }).on('error', reject);
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// CURATED DATA GENERATION
// ============================================

/**
 * Generate curated data for a country based on its properties
 * This creates child-friendly content about geographic features
 */
function generateCuratedData(isoA2, name, region, subregion, area, population) {
    
    // Region-based templates for geographic advantages/disadvantages
    const regionData = getRegionData(region, subregion);
    
    // Generate specific content based on country characteristics
    const advantages = generateAdvantages(isoA2, name, region, subregion, area, population, regionData);
    const disadvantages = generateDisadvantages(isoA2, name, region, subregion, area, population, regionData);
    const facts = generateFacts(isoA2, name, region, subregion, area, population, regionData);
    
    // YouTube ID - set to null (will use search fallback)
    // In production, these could be filled manually or via web search
    const youtubeId = null;
    
    return {
        iso_a2: isoA2,
        sumber_isi: "ai_generated",
        terakhir_diubah: new Date().toISOString().split('T')[0],
        keuntungan_geografis: advantages,
        kerugian_geografis: disadvantages,
        fakta_unik: facts,
        youtube_id: youtubeId
    };
}

function getRegionData(region, subregion) {
    const data = {
        // Asia
        'Asia': {
            climate: ['tropis', 'monsun', 'subtropis'],
            terrain: ['pegunungan', 'dataran rendah', 'pulau-pulau'],
            hazards: ['banjir', 'gempa bumi', 'letusan gunung berapi', 'tsunami'],
            resources: ['pertanian', 'perikanan', 'pertambangan'],
            trade: ['jalur perdagangan laut', 'selat strategis']
        },
        // Europe
        'Europe': {
            climate: ['sedang', 'mediterania', 'kontinental'],
            terrain: ['dataran rendah', 'pegunungan tua', 'pantai berliku'],
            hazards: ['badai musim dingin', 'banjir sungai'],
            resources: ['industri', 'pariwisata', 'teknologi'],
            trade: ['pusat perdagangan Eropa', 'koneksi transportasi']
        },
        // Africa
        'Africa': {
            climate: ['tropis', 'gurun', 'savana'],
            terrain: ['dataran tinggi', 'gurun pasir', 'sungai besar'],
            hazards: ['kekeringan', 'badai debu', 'banjir tiba-tiba'],
            resources: ['mineral berharga', 'pertanian', 'kehidupan liar'],
            trade: ['sumber daya alam', 'jalur maritim']
        },
        // Americas
        'Americas': {
            climate: ['tropis', 'sedang', 'kutub', 'gurun'],
            terrain: ['pegunungan muda', 'dataran luas', 'hutan hujan'],
            hurricanes: ['badai tropis', 'tornado', 'gempa bumi', 'gunung berapi'],
            resources: ['pertanian skala besar', 'energi', 'teknologi'],
            trade: ['kedua pantai samudra', 'jalur penerbangan']
        },
        // Oceania
        'Oceania': {
            climate: ['tropis', 'subtropis', 'gurun'],
            terrain: ['pulau-pulau terpencil', 'great barrier reef', 'outback'],
            hazards: ['siklon tropis', 'kebakaran hutan', 'gelombang pasang'],
            resources: ['pariwisata unik', 'keanekaragaman hayati', 'pertambangan'],
            trade: ['hub Pasifik', 'ekspor komoditas']
        }
    };
    
    return data[region] || data['Asia'];  // Default to Asia template
}

function generateAdvantages(isoA2, name, region, subregion, area, population, rd) {
    const adv = [];
    
    // Size-based advantages
    if (area > 2000000) {
        adv.push(`${name} adalah negara yang sangat luas! Ini memberikan banyak ruang untuk pertanian, kota-kota baru, dan kehidupan liar yang beragam.`);
    } else if (area > 500000) {
        adv.push(`Dengan wilayah yang cukup besar, ${name} memiliki sumber daya alam yang melimpah dan diversifikasi ekonomi.`);
    } else if (area < 1000) {
        adv.push(`Meskipun kecil, ukuran ${name} membuatnya mudah dikelola dan efisien dalam pelayanan publik.`);
    }
    
    // Coastline advantage
    const coastalCountries = ['ID', 'PH', 'MY', 'AU', 'BR', 'US', 'JP', 'GB', 'IT', 'GR', 'TH', 'VN', 'CL', 'NZ'];
    if (coastalCountries.includes(isoA2)) {
        adv.push(`Memiliki garis pantai panjang memungkinkan ${name} untuk mengembangkan pelabuhan, pariwisata pantai, dan perikanan.`);
    }
    
    // Strategic location
    const strategicLocations = {
        'SG': `Lokasi ${name} di persimpangan jalur perdagangan internasional menjadikannya pusat bisnis dan logistik global.`,
        'EG': `Terusan Suez di ${name} menjadi jalur penting yang menghubungkan Samudra Atlantik dan Hindia, membawa pendapatan besar.`,
        'PA': `Posisi ${name} sebagai penghubung Amerika Utara dan Selatan membuatnya penting untuk perdagangan regional.`,
        'TR': `${name} menghubungkan dua benua (Asia dan Eropa), menjadikannya jembatan budaya dan perdagangan yang unik.`
    };
    
    if (strategicLocations[isoA2]) {
        adv.push(strategicLocations[isoA2]);
    }
    
    // Climate advantages
    if (rd.climate.includes('tropis')) {
        adv.push(`Iklim tropis ${name} memungkinkan pertanian sepanjang tahun dengan hasil panen beragam seperti padi, kelapa, dan buah-buahan tropis.`);
    }
    
    // Resource advantages by region
    if (region === 'Africa' || region === 'South America') {
        adv.push(`Kaya akan sumber daya mineral dan alam, ${name} memiliki potensi besar untuk pertumbuhan ekonomi berkelanjutan.`);
    }
    
    // Tourism potential
    const touristDestinations = ['FR', 'IT', 'ES', 'TH', 'JP', 'AU', 'GR', 'MX', 'EG', 'IN', 'BR', 'ID', 'US', 'UK', 'CN'];
    if (touristDestinations.includes(isoA2)) {
        adv.push(`Keindahan alam dan warisan budaya ${name} menarik jutaan wisatawan dari seluruh dunia setiap tahunnya.`);
    }
    
    // Ensure at least 3 advantages
    while (adv.length < 3) {
        const genericAdvantages = [
            `Letak geografis ${name} menciptakan ekosistem unik yang tidak bisa ditemukan di tempat lain.`,
            `Keragaman topografi ${name} mendukung berbagai jenis mata pencaharian bagi penduduknya.`,
            `Posisi astronomis ${name} memberikan akses ke jalur perdagangan dan komunikasi internasional.`
        ];
        const nextAdv = genericAdvantages[adv.length % genericAdvantages.length];
        if (!adv.includes(nextAdv)) adv.push(nextAdv);
    }
    
    return adv.slice(0, 5);  // Max 5 advantages
}

function generateDisadvantages(isoA2, name, region, subregion, area, population, rd) {
    const dis = [];
    
    // Natural hazard disadvantages
    if (region === 'Asia' || region === 'Oceania' || region === 'Americas') {
        dis.push(`${name} berada di Cincin Api Pasifik, sehingga rentan terhadap gempa bumi dan aktivitas gunung berapi.`);
    }
    
    // Climate challenges
    if (rd.climate.includes('tropis')) {
        dis.push(`Iklim tropis juga berarti curah hujan tinggi yang bisa menyebabkan banjir dan tanah longsor di musim hujan.`);
    }
    
    if (rd.climate?.includes('gurun')) {
        dis.push(`Sebagian besar wilayah ${name} adalah gurun dengan air yang sangat terbatas, membuat pertanian sulit dilakukan.`);
    }
    
    // Small country challenges
    if (area < 1000 && population > 1000000) {
        dis.push(`Ukuran yang kecil dengan populasi padat membuat ${name} menghadapi tantangan ruang hidup dan ketergantungan pada impor.`);
    }
    
    // Large country challenges
    if (area > 3000000) {
        dis.push(`Wilayah yang sangat luas membuat infrastruktur dan distribusi barang mahal dan sulit merata ke seluruh negeri.`);
    }
    
    // Island nation challenges
    const islandNations = ['JP', 'PH', 'ID', 'GB', 'NZ', 'CU', 'HT', 'MV', 'FJ', 'MH'];
    if (islandNations.includes(isoA2)) {
        dis.push(`Sebagai negara kepulauan, ${name} rentan terhadap kenaikan permukaan laut akibat perubahan iklim global.`);
    }
    
    // Low-lying countries
    const lowlying = ['NL', 'BD', 'SG', 'MV', 'KI', 'TV'];
    if (lowlying.includes(isoA2)) {
        dis.push(`Sebagian besar wilayah ${name} berada di bawah permukaan laut, membuatnya sangat rentan terhadap banjir dan kenaikan air laut.`);
    }
    
    // Landlocked disadvantage
    const landlocked = ['AT', 'HU', 'CZ', 'SK', 'LU', 'AT', 'MN', 'NP', 'BT', 'BOL', 'PAR', 'ETH', 'UG', 'RW', 'BW', 'ZM', 'ZW', 'ML', 'NE', 'TD', 'SD', 'SS', 'AF', 'AM', 'AZ', 'BY', 'MD', 'KG', 'TJ', 'TM', 'UZ', 'LA'];
    if (landlocked.includes(isoA2)) {
        dis.push(`${name} tidak memiliki pantai (landlocked), sehingga harus bergantung pada negara tetangga untuk akses perdagangan laut.`);
    }
    
    // Specific known issues
    const specificIssues = {
        'NL': `Sistem tanggul dan pompa air yang rumit harus dipelihara terus-menerus untuk melindungi negara dari banjir.`,
        'JP': `Frekuensi gempa bumi yang tinggi membutuhkan biaya besar untuk bangunan tahan gema dan sistem peringatan dini.`,
        'BD': `Delta sungai yang padat penduduk sering mengalami banjir besar yang merusak pertanian dan pemukiman.`,
        'MV': `Dengan rata-rata ketinggian hanya 1.5 meter di atas permukaan laut, ${name} menghadapi ancaman eksistensial dari kenaikan air laut.`
    };
    
    if (specificIssues[isoA2]) {
        dis.push(specificIssues[isoA2]);
    }
    
    // Ensure at least 2 disadvantages
    while (dis.length < 2) {
        const genericDisadvantages = [
            `Perubahan iklim global dapat mempengaruhi pola cuaca dan pertanian di ${name}.`,
            `Beberapa daerah di ${name} mungkin sulit diakses karena kondisi geografis yang menantang.`
        ];
        const nextDis = genericDisadvantages[dis.length % genericDisadvantages.length];
        if (!dis.includes(nextDis)) dis.push(nextDis);
    }
    
    return dis.slice(0, 4);  // Max 4 disadvantages
}

function generateFacts(isoA2, name, region, subregion, area, population, rd) {
    const facts = [];
    
    // Country-specific facts database
    const factDatabase = {
        'ID': [
            'Indonesia memiliki lebih dari 17.000 pulau, menjadikannya negara kepulauan terbesar di dunia!',
            'Indonesia adalah rumah bagi komodo, kadal terbesar di dunia yang hanya ada di Pulau Komodo dan sekitarnya.',
            'Danau Toba di Sumatera adalah danau vulkanik terbesar di dunia, terbentuk dari letusan dahsyat 74.000 tahun lalu.',
            'Indonesia mengekspor cengkeh dan pala rempah-rempah yang dulunya lebih berharga daripada emas di Eropa!'
        ],
        'US': [
            'Amerika Serikat memiliki Taman Nasional Yellowstone, supervulkano aktif terbesar di dunia!',
            'AS memiliki 4 zona waktu yang berbeda, lebih banyak dari kebanyakan negara lain.',
            'Gunung Denali di Alaska adalah puncak tertinggi di Amerika Utara dengan ketinggian 6.190 meter.'
        ],
        'RU': [
            'Rusia memiliki 11 zona waktu, lebih banyak dari negara mana pun di dunia!',
            'Danau Baikal di Siberia adalah danau terdalam di dunia, menyimpan 20% air tawar permukaan Bumi.',
            'Trans-Siberian Railway adalah kereta api terpanjang di dunia, menempuh 9.289 kilometer!'
        ],
        'CN': [
            'Tembok Besar China adalah struktur buatan manusia terpanjang di dunia, membentang lebih dari 21.000 kilometer!',
            'China menemukan kertas, mesin cetak, bubuk mesiu, dan kompas—empat penemuan hebat yang mengubah dunia.',
            'Panda raksasa hanya hidup di pegunungan China tengah dan hanya tersisa kurang dari 2.000 ekor di alam liar.'
        ],
        'BR': [
            'Amazon di Brasil adalah hutan hujan terbesar di dunia, menghasilkan 20% oksigen Bumi!',
            'Brasil memiliki 60% Sungai Amazon, sungai dengan volume air terbesar di dunia.',
            'Christ the Redeemer di Rio de Janeiro adalah salah satu Tujuh Keajaiban Dunia Modern.'
        ],
        'AU': [
            'Australia adalah satu-satunya negara yang sekaligus merupakan sebuah benua utuh!',
            'Great Barrier Reef Australia adalah sistem terumbu karang terbesar di dunia, terlihat dari luar angkasa!',
            'Lebih dari 80% flora dan fauna Australia endemik—tidak ditemukan di tempat lain di dunia.'
        ],
        'IN': [
            'India memproduksi film terbanyak di dunia—lebih dari 1.500 film per tahun (lebih banyak dari Hollywood!)!',
            'Game catur ditemukan di India pada abad ke-6 dengan nama Chaturanga.',
            'Jumlah orang yang berbahasa Inggris di India lebih banyak dari total populasi AS dan UK digabung!'
        ],
        'JP': [
            'Jepang memiliki lebih dari 6.800 pulau, tapi hanya sekitar 430 yang dihuni!',
            'Gunung Fuji adalah simbol nasional Jepang dan gunung berapi aktif yang terakhir meletus tahun 1707.',
            'Kereta Shinkansen Jepang telah beroperasi selama 60 tahun tanpa satu kecelakaan fatal pun!'
        ],
        'GB': [
            'Inggris Raya menemukan World Wide Web (internet), televisi, dan lokomotif uap!',
            'Big London Eye adalah observatorium tertinggi di London dan bisa berputar 360 derajat.',
            'Ratu Elizabeth II pernah menjadi kepala negara 15 negara Commonwealth secara bersamaan!'
        ],
        'FR': [
            'Prancis adalah negara paling banyak dikunjungi wisatawan di dunia—lebih dari 90 juta orang per tahun!',
            'Menara Eiffel awalnya dibangun sementara untuk pameran dunia 1889, tapi akhirnya tetap berdiri!',
            'Prancis memiliki lebih dari 400 jenis keju berbeda—bisa makan keju berbeda setiap hari setahun penuh!'
        ],
        'DE': [
            'Jerman adalah negara kelahiran mobil modern—Karl Benz menciptakan mobil bermesin pertama tahun 1886.',
            'Hutan Hitam (Schwarzwald) di Jerman terinspirasi cerita Grimm seperti Hansel dan Gretel.',
            'Jerman mendaur ulang sekitar 65% sampahnya—salah satu tingkat daur ulang tertinggi di dunia!'
        ],
        'IT': [
            'Italia memiliki jumlah situs UNESCO Warisan Dunia terbanyak di dunia—lebih dari 55 situs!',
            'Menara Miring Pisa miring karena fondasinya dibangun di atas tanah lunak di satu sisi.',
            'Pizza asli Napoli diakui sebagai Warisan Budaya Takbenda UNESCO!'
        ],
        'CA': [
            'Kanada memiliki lebih dari separuh danau air tawar alami di dunia!',
            'Nama Kanada berasal dari kata St Lawrence-Iroquoian "kanata" yang artinya "desa" atau "pemukiman".',
            'Perbatasan Kanada-Amerika Serikat adalah perbatasan internasional terpanjang di dunia tanpa militer!'
        ],
        'EG': [
            'Piramida Agung Giza adalah satu-satunya dari Tujuh Keajaiban Dunia Kuno yang masih berdiri!',
            'Sungai Nil adalah sungai terpanjang di dunia (meskipun masih diperdebatkan dengan Amazon).',
            'Mesir kuno menemukan kertas dari tanaman papirus 5.000 tahun yang lalu!'
        ],
        'NG': [
            'Nollywood Nigeria adalah industri film terbesar kedua di dunia berdasarkan jumlah produksi film!',
            'Nigeria memiliki lebih dari 250 kelompok etnik dan lebih dari 500 bahasa yang dituturkan!',
            'Sungai Niger adalah sungai utama di Afrika Barat, mengalir melintasi 5 negara berbeda.'
        ],
        'ZA': [
            'Afrika Selatan adalah satu-satunya negara di dunia yang memutuskan sendiri ibu kotanya (ada 3!).',
            'Table Mountain di Cape Town adalah salah dari Tujuh Keajaiban Alam Baru dan memiliki 1400+ spesies tanaman!',
            'Afrika Selatan adalah produsen emas dan platinum terbesar di dunia.'
        ],
        'AR': [
            'Argentina memiliki beberapa gunung tertinggi di belahan bumi selatan termasuk Aconcagua (6.962 meter).',
            'Tango, tarian sensual yang terkenal, lahir di pelabuhan Buenos Aires Argentina!',
            'Patagonia Argentina adalah salah satu wilayah paling indah di dunia dengan gletser dan pegunungan megah.'
        ],
        'MX': [
            'Meksiko menemukan cokelat, jagung, dan vanili—tiga makanan yang disukai seluruh dunia!',
            'Sistema Ox Bel Ha di Yucatan adalah gua bawah air terpanjang di dunia (lebih dari 600 km!).',
            'Monarch butterfly migration ke Meksiko adalah migrasi serangga terpanjang di dunia—sampai 4.800 km!'
        ],
        'KR': [
            'Korea Selatan adalah salah satu negara dengan kecepatan internet tercepat di dunia!',
            'Orang Korea merayakan ulang tahun mereka sesuai Tahun Baru Lunar, bukan tanggal lahir kalender.',
            'K-pop dan K-drama Korea telah menjadi fenomena global yang dinikuti jutaan penggemar!'
        ]
    };
    
    // Use specific facts if available
    if (factDatabase[isoA2]) {
        facts.push(...factDatabase[isoA2].slice(0, 4));
    }
    
    // Population facts
    if (population > 1000000000) {
        facts.push(`${name} memiliki populasi lebih dari 1 miliar jiwa—hanya sedikit negara di dunia yang mencapai angka ini!`);
    } else if (population > 200000000) {
        facts.push(`Dengan populasi ratusan juta, ${name} adalah salah satu negara terpadat di dunia!`);
    } else if (population < 100000) {
        facts.push(`${name} adalah salah satu negara berpenduduk paling sedikit di dunia—populasinya lebih kecil dari kota kecil!`);
    }
    
    // Size facts
    if (area > 9000000) {
        facts.push(`${name} adalah salah satu negara terluas di dunia, hampir sebesar sebuah benua!`);
    } else if (area < 500) {
        facts.push(`${name} begitu kecil sehingga kamu bisa berkeliling seluruh negara dalam hitungan jam atau bahkan menit!`);
    }
    
    // Unique geography facts
    const uniqueGeo = {
        'NP': 'Nepal adalah rumah bagi 8 dari 10 gunung tertinggi di dunia, termasuk Everest!',
        'CH': 'Swiss memiliki lebih dari 1.500 danau dan setiap warganya tidak pernah berjalan lebih dari 10 km dari danau!',
        'IS': 'Islandia adalah satu-satunya negara di dunia tanpa nyamuk sama sekali!',
        'NZ': 'Selandia Baru adalah negara pertama yang melihat fajar setiap hari baru (karena posisinya di dekat Garis Tanggal Internasional)!'
    };
    
    if (uniqueGeo[isoA2] && !facts.includes(uniqueGeo[isoA2])) {
        facts.push(uniqueGeo[isoA2]);
    }
    
    // Ensure at least 3 facts
    while (facts.length < 3) {
        const genericFacts = [
            `${name} memiliki budaya dan tradisi unik yang telah berkembang selama ribuan tahun.`,
            `Setiap negara memiliki keunikan tersendiri—${name} tidak terkecuali!`,
            `Geografi ${name} membentuk cara hidup penduduknya dengan cara yang menarik.`
        ];
        const nextFact = genericFacts[facts.length % genericFacts.length];
        if (!facts.includes(nextFact)) facts.push(nextFact);
    }
    
    return facts.slice(0, 5);  // Max 5 facts
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
    console.log('\n🌍 GeoPedia Data Preparation Script');
    console.log('=' .repeat(40));
    
    try {
        // Step 1: Create directories
        console.log('\n📁 Creating directories...');
        const dirs = ['data', 'data/curated', 'assets/flags', 'assets/icons'];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`  ✅ Created: ${dir}`);
            }
        });
        
        // Step 2: Download GeoJSON files
        console.log('\n📥 Downloading GeoJSON files...');
        const geojsonData = {};
        
        for (const [key, config] of Object.entries(GEOJSON_FILES)) {
            try {
                let data = await downloadFile(config.url, config.output);
                data = JSON.parse(data);
                
                // Apply filter if specified
                if (config.filter) {
                    data.features = data.features.filter(config.filter);
                    console.log(`  🔍 Filtered to ${data.features.length} features`);
                }
                
                geojsonData[key] = data;
                await sleep(500);  // Be nice to GitHub API
                
            } catch (error) {
                console.error(`  ❌ Failed to download ${key}:`, error.message);
                throw error;
            }
        }
        
        // Step 3: Generate curated country data
        console.log('\n✍️  Generating curated country data...');
        
        const countriesFeatures = geojsonData.countries.features;
        console.log(`  📊 Found ${countriesFeatures.length} countries`);
        
        let generatedCount = 0;
        let skippedCount = 0;
        
        for (const feature of countriesFeatures) {
            const props = feature.properties;
            const isoA2 = props.ISO_A2;
            
            // Skip if no valid ISO code
            if (!isoA2 || isoA2 === '-99' || isoA2.length !== 2) {
                skippedCount++;
                continue;
            }
            
            const name = props.NAME || 'Unknown';
            const region = props.REGION_WB || props.CONTINENT || 'Unknown';
            const subregion = props.SUBREGION || '';
            const area = props.AREA || 0;
            const population = props.POP_EST || 0;
            
            // Generate curated data
            const curatedData = generateCuratedData(isoA2, name, region, subregion, area, population);
            
            // Write to file
            const outputPath = `data/curated/${isoA2.toUpperCase()}.json`;
            fs.writeFileSync(outputPath, JSON.stringify(curatedData, null, 2));
            
            generatedCount++;
        }
        
        console.log(`\n  ✅ Generated ${generatedCount} curated files`);
        console.log(`  ⏭️  Skipped ${skippedCount} entries (no valid ISO code)`);
        
        // Summary
        console.log('\n' + '='.repeat(40));
        console.log('✅ Data preparation complete!');
        console.log(`   - GeoJSON files: ${Object.keys(GEOJSON_FILES).length}`);
        console.log(`   - Curated country files: ${generatedCount}`);
        console.log('\n📝 Next steps:');
        console.log('   1. Review generated data in data/curated/');
        console.log('   2. Optionally add YouTube IDs to curated JSON files');
        console.log('   3. Upload entire folder to InfinityFree hosting');
        
    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        process.exit(1);
    }
}

// Run main function
main();
