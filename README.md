# 🌍 GeoPedia - Ensiklopedia Dunia Interaktif untuk Anak

**Versi:** 2.0  
**Bahasa:** Bahasa Indonesia  
**Target Usia:** Anak SD (7-12 tahun)

![GeoPedia Preview](https://img.shields.io/badge/Status-Ready%20to%20Deploy-brightgreen) ![Static Site](https://img.shields.io/badge/Type-Static%20Site-blue) ![No Backend](https://img.shields.io/badge/Backend-None-success)

## 📖 Tentang GeoPedia

GeoPedia adalah aplikasi web peta dunia interaktif yang dirancang khusus untuk anak-anak. Dengan GeoPedia, anak bisa:

- 🗺️ **Jelajahi 193 negara berdaulat + 43 wilayah dependensi** di seluruh dunia dengan peta interaktif
- 📚 **Pelajari fakta menarik** tentang setiap negara (ibu kota, populasi, bahasa, mata uang)
- 🎬 **Tonton video edukasi** YouTube (jika tersedia) atau cari video sendiri
- ⛰️ **Lihat fitur geografis**: gunung, sungai, danau, laut & selat
- ✅ **Pahami keuntungan & tantangan geografis** setiap negara (dijelaskan sederhana untuk anak)
- 🎲 **Dapat kejutan!** Tombol "Kejutkan Aku" memilih negara acak
- 📍 **Lacak progres** - negara yang sudah dikunjungi ditandai otomatis

## ✨ Fitur Utama

### 1. Peta Interaktif
- **193 negara berdaulat** yang bisa diklik dan di-hover
- **43 wilayah dependensi/teritori** dengan label khusus (bukan "negara")
- **Zoom & pan** berfungsi di desktop dan mobile (scroll/pinch + drag)
- **5 layer toggleable**:
  - 🗺️ Negara (default aktif)
  - ⛰️ Gunung & Pegunungan
  - 🌊 Sungai
  - 💧 Danau
  - 🌐 Laut & Selat

### 2. Panel Info Negara
Klik negara untuk melihat:
- 🏴 Bendera dan foto negara
- 📋 Info dasar: ibu kota, populasi, luas wilayah, region
- 💬 Bahasa dan mata uang
- 📖 Deskripsi dari Wikipedia Bahasa Indonesia
- 🎬 Video YouTube (atau link pencarian)
- ✅ Keuntungan geografis
- ⚠️ Tantangan geografis
- 🌟 Fakta unik

### 3. Mode Jelajah Anak
- 🔍 **Search box**: Cari negara dalam bahasa Indonesia atau Inggris
- 🎲 **"Kejutkan Aku"**: Pilih negara acak untuk eksplorasi spontan
- ✓ **Progress tracking**: Negara yang sudah diklik ditandai (disimpan di browser)

## 🛠️ Teknologi

| Komponen | Teknologi |
|----------|-----------|
| Frontend | HTML5, CSS3, JavaScript ES6+ |
| Peta | D3.js v7 (d3-geo, d3-geoProjection) via CDN |
| Data Peta | Natural Earth GeoJSON (Public Domain/CC0) |
| Data Negara | REST Countries API (gratis, tanpa API key) |
| Foto & Deskripsi | Wikipedia Bahasa Indonesia API (gratis) |
| Bendera | flagcdn.com (gratis) |
| Hosting | Static files (bisa InfinityFree, GitHub Pages, Netlify, dll) |

**Tidak ada backend!** Semua logika jalan di browser.

## 📁 Struktur Folder

```
/
├── index.html              # Halaman utama
├── style.css               # Stylesheet responsif
├── app.js                  # Entry point & event handling
├── map-render.js           # D3.js peta rendering
├── country-panel.js        # Panel info negara
├── feature-panel.js        # Panel info fitur geografis
├── data-sources.js         # Fetch API & cache management
├── .htaccess               # Kompresi gzip & caching (Apache/InfinityFree)
├── data/
│   ├── curated/            # 242 file JSON kurasi per entitas
│   │   ├── ID.json         # Contoh: data Indonesia
│   │   ├── US.json
│   │   └── ...
│   ├── countries-boundaries.geojson  # Batas negara
│   ├── mountains.geojson             # Gunung/pegunungan (127 fitur)
│   ├── rivers.geojson                # Sungai + lake centerlines
│   ├── lakes.geojson                 # Danau
│   ├── seas-straits.geojson          # Laut, selat, teluk
│   └── restcountries-fallback.json   # Cadangan data negara lokal
├── scripts/                # ⚠️ JANGAN upload ke hosting — hanya development
│   ├── prepare-data.js     # Skrip persiapan data
│   └── validate-data.js    # Skrip validasi integritas data
└── README.md               # Dokumentasi ini
```

## 🚀 Cara Deploy ke InfinityFree

### Langkah 1: Buat Akun Hosting

1. Buka [infinityfree.net](https://www.infinityfree.net/)
2. Klik **"Get Started Free"**
3. Daftar akun baru (gunakan email valid)
4. Buat password akun hosting
5. Verifikasi email jika diminta

### Langkah 2: Buat Website

1. Setelah login, klik **"Create New Account"** atau **"Add Website"**
2. Pilih subdomain (misalnya: `geopedia.infinityfreeapp.com`) atau gunakan domain sendiri
3. Klik **"Create Account"**
4. Catat detail FTP yang diberikan:
   - **FTP Host**
   - **FTP Username**
   - **FTP Password**

### Langkah 3: Upload File

#### Opsi A: Menggunakan File Manager (Lebih Mudah)

1. Di dashboard InfinityFree, klik **"Control Panel"** > **"File Manager"**
2. Navigasi ke folder `htdocs/` (ini adalah root website)
3. Hapus file `default.php` (jika ada)
4. Upload file-file berikut ke folder `htdocs/`:
   - `index.html`
   - `style.css`
   - `.htaccess` (untuk kompresi gzip & caching)
   - Semua file `.js` (app.js, map-render.js, country-panel.js, feature-panel.js, data-sources.js)
   - Folder `data/` beserta **seluruh** isinya (curated/, geojson, fallback)
   - **JANGAN upload** folder `scripts/` — hanya dipakai saat development

#### Opsi B: Menggunakan FileZilla (FTP Client)

1. Download [FileZilla](https://filezilla-project.org/) (gratis)
2. Install dan buka FileZilla
3. Masukkan detail FTP dari Langkah 2:
   - Host: `[FTP host dari InfinityFree]`
   - Username: `[FTP username]`
   - Password: `[FTP password]`
   - Port: `21`
4. Klik **"Quickconnect"**
5. Di panel kanan (remote), navigasi ke folder `htdocs/`
6. Di panel kiri (local), buka folder proyek GeoPedia
7. Blok semua file dan folder, lalu drag ke panel kanan
8. Tunggu sampai upload selesai

### Langkah 4: Verifikasi

1. Buka browser
2. Akses URL website kamu (misal: `https://geopedia.infinityfreeapp.com`)
3. Pastikan peta dunia muncul
4. Coba klik beberapa negara
5. Test di mobile phone juga (responsive design)

**Selesai!** 🎉 GeoPedia sudah online!

## ✏️ Cara Edit Konten Kurasi

Setiap negara memiliki file JSON terpisah yang mudah diedit:

### Lokasi File
```
data/curated/{KODE_NEGARA}.json
```

Contoh: `data/curated/ID.json` untuk Indonesia

### Format File
```json
{
  "iso_a2": "ID",
  "sumber_isi": "ai_generated",
  "terakhir_diubah": "2026-07-26",
  "keuntungan_geografis": [
    "Memiliki garis pantai panjang..."
  ],
  "kerugian_geografis": [
    "Rentan gempa bumi..."
  ],
  "fakta_unik": [
    "Indonesia memiliki 17.000+ pulau..."
  ],
  "youtube_id": null
}
```

### Cara Edit

1. **Buka file** dengan text editor apa saja (Notepad, VS Code, Notepad++, dll)
2. **Ubah teks** di dalam tanda kutip (`"`)
3. **Simpan** file (Ctrl+S / Cmd+S)
4. **Upload ulang** file yang diedit ke hosting (timpa yang lama)
5. **Refresh browser** - perubahan langsung terlihat!

### Menambahkan Video YouTube

Cari video di YouTube, copy ID videonya (bagian setelah `v=`):

URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`  
YouTube ID: `dQw4w9WgXcQ`

Edit file JSON:
```json
{
  ...
  "youtube_id": "dQw4w9WgXcQ"
}
```

Jika tidak ada video yang cocok, biarkan `"youtube_id": null` — app akan menampilkan tombol "Cari video di YouTube".

## 🔧 Development (Untuk Developer)

### Persyaratan Sistem
- Node.js 16+ (hanya untuk skrip persiapan data)
- Git (untuk version control)
- Browser modern (Chrome, Firefox, Safari, Edge)

### Setup Development

```bash
# Clone repository
git clone https://github.com/reinaldyauliakurniawan-arch/geopedia.git
cd geopedia

# Jalankan skrip persiapan data (download GeoJSON & generate kurasi)
node scripts/prepare-data.js

# ⚠️ PENTING: Jangan buka index.html langsung (double-click / file://)
# Semua fetch() ke file lokal akan diblokir oleh kebijakan CORS browser.
# App HARUS diakses lewat HTTP/HTTPS server.

# Option 1 (rekomendasi): Python HTTP server
python -m http.server 8000
# Lalu buka http://localhost:8000 di browser

# Option 2: Live Server extension di VS Code
# Klik "Go Live" di kanan bawah VS Code

# Option 3: Node.js http-server
npx http-server -p 8000
```

### Struktur Kode

| File | Fungsi |
|------|--------|
| `index.html` | Struktur HTML utama |
| `style.css` | Styling CSS (mobile-first responsive) |
| `data-sources.js` | Modul fetch API, caching localStorage |
| `map-render.js` | D3.js SVG rendering, zoom/pan, layer management |
| `country-panel.js` | Logic panel info negara (sidebar/bottom-sheet) |
| `feature-panel.js` | Logic panel info fitur geografis (popup) |
| `app.js` | Entry point, inisialisasi, event listeners, search |

## 📊 Sumber Data & Lisensi

### Data Geografis
- **Sumber**: [Natural Earth](https://www.naturalearthdata.com/) 
- **Format**: GeoJSON via [martynafford/natural-earth-geojson](https://github.com/martynafford/natural-earth-geojson)
- **Lisensi**: **Public Domain (CC0)** - Bebas digunakan termasuk komersial
- **Atribusi**: "Data: Natural Earth"

### Data Negara
- **Sumber**: [REST Countries API](https://restcountries.com/)
- **Akses**: Gratis, tanpa API key, CORS enabled

### Foto & Deskripsi
- **Sumber**: [Wikipedia Bahasa Indonesia](https://id.wikipedia.org/)
- **API**: REST API (`api/rest_v1/page/summary/`)
- **Lisensi**: **CC BY-SA** - Cantumkan link sumber

### Bendera
- **Sumber**: [flagcdn.com](https://flagcdn.com/)
- **Akses**: Gratis, tanpa API key

## 🎨 Desain & UX

### Prinsip Desain
- **Child-friendly**: Warna ceria, font rounded, bahasa sederhana
- **Atlas-inspired**: Palet warna seperti peta geografi tradisional
- **Mobile-first**: Bottom sheet di mobile, sidebar di desktop
- **Accessible**: Keyboard navigation, ARIA labels, semantic HTML

### Palet Warna
| Elemen | Warna | Hex |
|--------|-------|-----|
| Laut/Samudra | Biru laut | `#4A90D9` |
| Daratan/Negara | Hijau | `#8FBC8F` |
| Gunung | Cokelat | `#8B7355` |
| Sungai/Danau | Biru muda | `#5DADE2` / `#85C1E9` |
| Laut/Selat | Biru tua | `#2E86AB` |
| Aksen primer | Hijau cerah | `#2ECC71` |
| Aksen sekunder | Biru | `#3498DB` |
| Aksen warning | Oranye | `#F39C12` |

### Font
- **Display/Judul**: Baloo 2 (Google Fonts)
- **Body/Teks**: Nunito (Google Fonts)

## ❓ FAQ

### Q: Apakah perlu database?
**Tidak!** Semua data disimpan sebagai file statis (JSON). Progress pengguna disimpan di `localStorage` browser.

### Q: Apakah perlu server/backend?
**Tidak!** Ini murni static site. Tinggal upload file-file HTML/CSS/JS ke hosting manapun.

### Q: Berapa ukuran total file?
- GeoJSON files: ~16 MB (di-cache browser setelah pertama load, ~2 MB dengan kompresi gzip)
- Curated JSON files: ~500 KB total
- Fallback JSON: ~79 KB
- JS + CSS: ~50 KB
- Total first load: ~17 MB tanpa kompresi, ~2-3 MB dengan gzip/brotli

### Q: Bagaimana cara update konten?
Edit file JSON di `data/curated/`, lalu upload ulang. Tidak perlu build atau deploy ulang.

### Q: Apakah bisa offline?
Sebagian! Setelah pertama kali load, data GeoJSON dan negara di-cache di `localStorage`.
Ada juga file `data/restcountries-fallback.json` sebagai cadangan jika REST Countries API tidak tersedia.
Tapi foto dari Wikipedia dan video YouTube tetap butuh internet.

## 📄 Lisensi Proyek

**Code**: MIT License  
**Data**: Sesuai lisensi masing-masing sumber (lihat bagian Sumber Data)

---

**Dibuat dengan ❤️ untuk pendidikan geografi anak Indonesia**

🌍 *Belajar Geografi Jadi Seru!*

## Data Accuracy

### Country Count (Terverifikasi)
- **193 Negara Berdaulat**: Sesuai anggota PBB + Vatikan (status observer spesial)
- **49 Wilayah Dependensi/Territori**: Bukan negara berdaulat (Greenland, Puerto Rico, Antartika, dll)
- **Total: 242 Entitas di Peta** (masing-masing punya file JSON kurasi)

### ISO Code Handling
Natural Earth GeoJSON kadang menggunakan kode ISO yang berbeda dari standar ISO 3166-1 alpha-2. Aplikasi ini melakukan normalisasi otomatis via `ISO_CODE_NORMALIZE` di `data-sources.js`:
- Prancis: FRA → FR
- Norwegia: NOR → NO
- Antartika: ATA → AQ

Validasi tabrakan ISO (collision detection) otomatis tersedia di `scripts/validate-data.js` (Check 4). Jalankan setiap kali data GeoJSON di-update.

### Data Freshness
- **REST Countries API v3.1** telah di-deprecated oleh penyedianya. App masih mencoba endpoint tersebut, tapi jika gagal, fallback ke file lokal `data/restcountries-fallback.json`.
- Saat deploy, pastikan app diakses lewat **HTTP/HTTPS**, bukan `file://` — semua `fetch()` ke file lokal akan diblokir CORS browser modern.

### Content Verification
- Semua konten kurasi telah diaudit pada Juli 2026
- Klaim superlatif ("terbesar", "terpanjang") diverifikasi terhadap sumber terpercaya
- Video YouTube adalah konten edukasi anak dari channel terverifikasi
