/**
 * Emergency fix: Create missing curated files and fix remaining issues
 */

const fs = require('fs');
const path = require('path');

const CURATED_DIR = path.join(__dirname, '..', 'data', 'curated');

// ============================================
// MISSING COUNTRY DATA
// ============================================

const MISSING_COUNTRIES = {
    'FR': {
        nama: 'Prancis',
        keuntungan_geografis: [
            "Prancis memiliki bentuk heksagon yang memberikan garis pantai di TIGA laut: Atlantik, Selat Inggris, dan Mediterania.",
            "Dataran Paris Basin yang luas dan subur—lumbung pertanian anggur, gandum, dan susu Eropa.",
            "Posisi di jantung Eropa Barat memberikan akses ke pasar tunggal Eropa dan infrastruktur transportasi maju.",
            "Massif Central, Alpen, dan Pyrenees menyediakan ski resort, tenaga air, dan pariwisata gunung kelas dunia.",
            "Iklim Mediterania di selatan ideal untuk viticulture—Prancis adalah produsen wine terkemuka dunia."
        ],
        kerugian_geografis: [
            "Berada di pertemuan lempeng Afro-Eurasia membuat Prancis rentan gempa (seperti yang menghancurkan Lisbon 1755).",
            "Beberapa wilayah (Corsica) terpisah dari mainland—biaya integrasi tinggi.",
            "Angin Mistral di Provence bisa sangat kencang (100+ km/jam) merusak pertanian."
        ],
        fakta_unik: [
            "Prancis adalah negara PALING BANYAK dikunjungi wisatawan—90+ juta orang per tahun!",
            "Menara Eiffel awalnya dibangun SEMENTARA untuk pameran 1889—tapi akhirnya tetap berdiri!",
            "Prancis memiliki 400+ JENIS KEJO berbeda—bisa makan kejo berbeda SETIAP HARI setahun!",
            "Prancis memiliki SITUS UNESCO WARISAN DUNIA TERBANYAK—55+ situs!"
        ],
        youtube_id: "EB1kCrPh9P4"
    },
    'NO': {
        nama: 'Norwegia',
        keuntungan_geografis: [
            "Garis pantai terpanjang kedua di dunia (dengan fjord)—lebih dari 100.000 km termasuk pulau-pulau.",
            "Cadangan minyak dan gas Laut Utara membuat Norwegia salah satu negara terkaya per kapita.",
            "Fjord yang spektakuler (dibentuk oleh glasiasi) menarik jutaan wisatawan setiap tahun.",
            "Letak di Arktik memberikan akses ke sumber daya alam dan jalur maritim penting.",
            "Arus Gulf Stream membuat iklim lebih hangat dari lintangnya seharusnya."
        ],
        kerugian_geografis: [
            "Sebagian besar wilayah utara berada di Lingkaran Arktik dengan musim dingin ekstrem dan malam polar.",
            "Topografi pegunungan (70% gunung) membuat transportasi darat mahal dan sulit.",
            "Populasi sangat tersebar di lembah sempit—layanan publik mahal per kapita."
        ],
        fakta_unik: [
            "Norway memiliki FJORD—fiord yang terbentuk dari glasiasi zaman es, pemandangan paling dramatis di Eropa!",
            "Norway adalah salah satu negara dengan BIAYA HIDUP tertinggi di dunia—tapi juga kualitas hidup tertinggi!",
            "Matahari tengah malam bisa dilihat di Norwegia utara (mei-Juli)—matahari tidak terbenam sama sekali!",
            "Norway memberikan Hadiah Nobel Perdamaian setiap tahun di Oslo!"
        ],
        youtube_id: "cZyQwHnLdZo" // Will be set to null if placeholder
    }
};

// Non-sovereign entities that should NOT use word "negara"
const NON_SOVEREIGN = new Set([
    'AQ','AX','AS','AW','AI','BM','BQ','BV','IO','VG','KY','CK','CX','CC',
    'CW','FK','FO','GF','PF','TF','GI','GL','GU','GG','HM','HK','IM','JE',
    'MF','MS','NC','NU','NF','MP','PN','PR','RE','BL','SH','KN','LC','MF',
    'PM','SX','SJ','TA','TC','VI','UM','WF','EH','YT','GS','WA','WK','WT'
]);

// Placeholder YouTube ID to remove
const PLACEHOLDER_ID = 'cZyQwHnLdZo';

// ============================================
// MAIN
// ============================================

console.log('🔧 Emergency Fix Script');
console.log('=' .repeat(50));

let createdCount = 0;
let fixedYtCount = 0;
let fixedLabelCount = 0;

// 1. Create missing files
console.log('\n📝 Step 1: Creating missing curated files...');
Object.entries(MISSING_COUNTRIES).forEach(([isoA2, data]) => {
    const filePath = path.join(CURATED_DIR, `${isoA2}.json`);
    
    const curatedData = {
        iso_a2: isoA2,
        sumber_isi: "ai_generated_v3_emergency_fix",
        terakhir_diubah: new Date().toISOString().split('T')[0],
        keuntungan_geografis: data.keuntungan_geografis,
        kerugian_geografis: data.kerugian_geografis,
        fakta_unik: data.fakta_unik,
        youtube_id: data.youtube_id === PLACEHOLDER_ID ? null : data.youtube_id,
        adalah_negara: true,
        designasi: 'Negara'
    };
    
    fs.writeFileSync(filePath, JSON.stringify(curatedData, null, 2));
    console.log(`   ✅ Created ${isoA2}.json`);
    createdCount++;
});

// 2. Fix all existing files - remove placeholder YT IDs and fix labeling
console.log('\n📝 Step 2: Fixing YouTube IDs and non-sovereign labeling...');

const files = fs.readdirSync(CURATED_DIR).filter(f => f.endsWith('.json'));

files.forEach(file => {
    const isoA2 = file.replace('.json', '');
    const filePath = path.join(CURATED_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    let modified = false;
    
    // Remove placeholder YouTube ID
    if (data.youtube_id === PLACEHOLDER_ID) {
        data.youtube_id = null;
        modified = true;
        fixedYtCount++;
    }
    
    // Fix non-sovereign labeling
    if (NON_SOVEREIGN.has(isoA2)) {
        // Check if content uses "negara" inappropriately
        const allFields = [...(data.keuntungan_geografis || []), ...(data.kerugian_geografis || []), ...(data.fakta_unik || [])];
        
        let needsFix = false;
        allFields.forEach(text => {
            if (text.toLowerCase().includes('negara')) {
                needsFix = true;
            }
        });
        
        if (needsFix) {
            // Replace "negara" with appropriate term
            const replaceWith = getReplacementTerm(isoA2);
            
            data.keuntungan_geografis = (data.keuntungan_geografis || []).map(t => 
                t.replace(/negara/gi, replaceWith)
            );
            data.kerugian_geografis = (data.kerugian_geografis || []).map(t => 
                t.replace(/negara/gi, replaceWith)
            );
            data.fakta_unik = (data.fakta_unik || []).map(t => 
                t.replace(/negara/gi, replaceWith)
            );
            
            modified = true;
            fixedLabelCount++;
        }
        
        // Ensure metadata is correct
        data.adalah_negara = false;
        data.designasi = getDesignation(isoA2);
    }
    
    if (modified) {
        data.terakhir_diubah = new Date().toISOString().split('T')[0];
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
});

function getReplacementTerm(isoA2) {
    const terms = {
        'AQ': 'wilayah/benua',
        'GL': 'wilayah',
        'PR': 'persemakmuran',
        'HK': 'daerah',
        'MO': 'daerah',
        'GU': 'teritori',
        'VI': 'teritori',
        'MP': 'persemakmuran',
        'AX': 'wilayah',
        'FO': 'wilayah',
        'GF': 'departemen',
        'PF': 'komunitas',
        'NC': 'kolektivitas',
        'BM': 'teritori',
        'IO': 'teritori',
        'EA': 'wilayah',
        'IC': 'pulau',
        'CP': 'pulau',
        'AC': 'pulau',
        'TA': 'pulau'
    };
    return terms[isoA2] || 'wilayah';
}

function getDesignation(isoA2) {
    const terms = {
        'AQ': 'Benua/Wilayah',
        'GL': 'Wilayah Otonom',
        'PR': 'Persemakmuran',
        'HK': 'Daerah Administratif Khusus',
        'MO': 'Daerah Administratif Khusus',
        'GU': 'Teritori',
        'VI': 'Teritori AS',
        'MP': 'Persemakmuran AS',
        'AX': 'Wilayah Otonom',
        'FO': 'Wilayah Otonom',
        'GF': 'Departemen Luar Negeri Prancis',
        'PF': 'Komunitas Luar Negeri Prancis',
        'NC': 'Kolektivitas Khusus Prancis',
        'BM': 'Teritori Britania Raya',
        'IO': 'Teritori Britania Raya'
    };
    return terms[isoA2] || 'Wilayah/Teritori';
}

console.log(`\n${'='.repeat(50)}`);
console.log('✅ FIX COMPLETE!');
console.log(`${'='.repeat(50)}`);
console.log(`\n📊 Summary:`);
console.log(`   • Missing files created: ${createdCount}`);
console.log(`   • YouTube IDs fixed (placeholder→null): ${fixedYtCount}`);
console.log(`   • Non-sovereign labels fixed: ${fixedLabelCount}`);

console.log('\n📝 Next: Run validation again to verify fixes');
