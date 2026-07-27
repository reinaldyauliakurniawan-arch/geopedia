#!/usr/bin/env python3
"""Phase 3 Fix Script - loads data from JSON, applies fixes to all files."""
import json, os, sys

DIR = 'data/curated'
DATA_FILE = 'scripts/phase3_data.json'
YT_FILE = 'scripts/phase3_youtube.json'
NAME_FILE = 'scripts/phase3_names.json'
TODAY = '2026-07-27'

GENERIC_PATTERNS = [
    'menunjukkan betapa beragamnya kondisi geografis',
    'menyimpan cerita menarik tentang bagaimana geografi',
    'dapat fokus pada niche ekonomi spesialis',
    'ketergantungan pada impor',
    'Sebagai negara mikro',
    'rentan terhadap badai tropis/siklon',
    'menjadi modal pembangunan berkelanjutan',
    'Memiliki akses ke laut/samudra memberikan',
    'Ukuran compact',
    'garis pantai yang sepenuhnya dikelola',
    'peluang perdagangan maritim, perikanan, dan pelabuhan',
    'negara kepulauan/pulau',
    'Sebagai negara daratan terkurung',
    'menghadapi tantangan RUANG HIDUP',
    'menjadi sumber pendapatan utama',
    'dengan populasi padat membuat',
    'kawasan tropis/subtropis',
]


def has_generic(text):
    for pat in GENERIC_PATTERNS:
        if pat in text:
            return True
    return False


def fix_content(filepath, code, data):
    """Fix keuntungan_geografis, kerugian_geografis, fakta_unik for a single file."""
    with open(filepath, 'r') as f:
        d = json.load(f)
    
    changed = False
    for field in ['keuntungan_geografis', 'kerugian_geografis', 'fakta_unik']:
        if code in data and field in data[code]:
            new_items = data[code][field]
            # Check if current content has any generic text
            old_items = d.get(field, [])
            if any(has_generic(item) for item in old_items):
                d[field] = new_items
                changed = True
                print(f'  Fixed {field} for {code}')
    
    if changed:
        d['terakhir_diubah'] = TODAY
        with open(filepath, 'w') as f:
            json.dump(d, f, indent=2, ensure_ascii=False)
    return changed


def fix_names(filepath, code, replacements):
    """Replace English country names with Indonesian in all text fields."""
    with open(filepath, 'r') as f:
        d = json.load(f)
    
    changed = False
    for field in ['keuntungan_geografis', 'kerugian_geografis', 'fakta_unik']:
        items = d.get(field, [])
        new_items = []
        for item in items:
            new_item = item
            for eng, ind in replacements:
                if eng in new_item:
                    new_item = new_item.replace(eng, ind)
            new_items.append(new_item)
        if new_items != items:
            d[field] = new_items
            changed = True
    
    if changed:
        d['terakhir_diubah'] = TODAY
        with open(filepath, 'w') as f:
            json.dump(d, f, indent=2, ensure_ascii=False)
        print(f'  Fixed names for {code}')
    return changed


def fix_youtube(filepath, code, yt_data):
    """Add youtube_id if null and we have data."""
    with open(filepath, 'r') as f:
        d = json.load(f)
    
    if d.get('youtube_id') is None and code in yt_data:
        d['youtube_id'] = yt_data[code]
        d['terakhir_diubah'] = TODAY
        with open(filepath, 'w') as f:
            json.dump(d, f, indent=2, ensure_ascii=False)
        print(f'  Fixed youtube_id for {code}: {yt_data[code]}')
        return True
    return False


def main():
    # Load data
    with open(DATA_FILE, 'r') as f:
        content_data = json.load(f)
    print(f'Loaded content data for {len(content_data)} countries')
    
    with open(YT_FILE, 'r') as f:
        yt_data = json.load(f)
    print(f'Loaded youtube data for {len(yt_data)} countries')
    
    with open(NAME_FILE, 'r') as f:
        name_data = json.load(f)
    print(f'Loaded name replacements for {len(name_data)} countries')
    
    content_fixed = 0
    name_fixed = 0
    yt_fixed = 0
    
    files = sorted(f for f in os.listdir(DIR) if f.endswith('.json'))
    for fname in files:
        code = fname.replace('.json', '')
        filepath = os.path.join(DIR, fname)
        
        # Fix 1: Generic content
        if code in content_data:
            if fix_content(filepath, code, content_data):
                content_fixed += 1
        
        # Fix 2: English names
        if code in name_data:
            if fix_names(filepath, code, name_data[code]):
                name_fixed += 1
        
        # Fix 3: Youtube IDs
        if code in yt_data:
            if fix_youtube(filepath, code, yt_data):
                yt_fixed += 1
    
    print(f'\n=== SUMMARY ===')
    print(f'Content fixed: {content_fixed} files')
    print(f'Names fixed: {name_fixed} files')
    print(f'YouTube IDs added: {yt_fixed} files')


if __name__ == '__main__':
    main()
