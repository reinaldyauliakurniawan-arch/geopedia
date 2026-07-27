#!/usr/bin/env python3
"""
Search for real YouTube videos for each country via DuckDuckGo + oEmbed verification.
Usage: python3 scripts/search_youtube.py [start_idx] [end_idx]
"""
import json, glob, re, subprocess, time, urllib.parse, sys

# ISO A2 -> search name (use English for better YouTube results)
COUNTRIES = {
    'AD': 'Andorra', 'AE': 'United Arab Emirates', 'AF': 'Afghanistan',
    'AG': 'Antigua and Barbuda', 'AI': 'Anguilla', 'AL': 'Albania',
    'AM': 'Armenia', 'AO': 'Angola', 'AQ': 'Antarctica',
    'AR': 'Argentina', 'AS': 'American Samoa', 'AT': 'Austria',
    'AU': 'Australia', 'AW': 'Aruba', 'AX': 'Aland Islands',
    'AZ': 'Azerbaijan', 'BA': 'Bosnia and Herzegovina', 'BB': 'Barbados',
    'BD': 'Bangladesh', 'BE': 'Belgium', 'BF': 'Burkina Faso',
    'BG': 'Bulgaria', 'BH': 'Bahrain', 'BI': 'Burundi',
    'BJ': 'Benin', 'BL': 'Saint Barthelemy', 'BM': 'Bermuda',
    'BN': 'Brunei', 'BO': 'Bolivia', 'BR': 'Brazil',
    'BS': 'Bahamas', 'BT': 'Bhutan', 'BW': 'Botswana',
    'BY': 'Belarus', 'BZ': 'Belize', 'CA': 'Canada',
    'CD': 'Democratic Republic Congo', 'CF': 'Central African Republic',
    'CG': 'Republic of Congo', 'CH': 'Switzerland', 'CI': 'Ivory Coast',
    'CK': 'Cook Islands', 'CL': 'Chile', 'CM': 'Cameroon',
    'CN': 'China', 'CO': 'Colombia', 'CR': 'Costa Rica',
    'CU': 'Cuba', 'CV': 'Cape Verde', 'CW': 'Curacao',
    'CY': 'Cyprus', 'CZ': 'Czech Republic', 'DE': 'Germany',
    'DJ': 'Djibouti', 'DK': 'Denmark', 'DM': 'Dominica',
    'DO': 'Dominican Republic', 'DZ': 'Algeria', 'EC': 'Ecuador',
    'EE': 'Estonia', 'EG': 'Egypt', 'EH': 'Western Sahara',
    'ER': 'Eritrea', 'ES': 'Spain', 'ET': 'Ethiopia',
    'FI': 'Finland', 'FJ': 'Fiji', 'FK': 'Falkland Islands',
    'FM': 'Micronesia', 'FO': 'Faroe Islands', 'FR': 'France',
    'GA': 'Gabon', 'GB': 'United Kingdom', 'GD': 'Grenada',
    'GE': 'Georgia', 'GG': 'Guernsey', 'GH': 'Ghana',
    'GL': 'Greenland', 'GM': 'Gambia', 'GN': 'Guinea',
    'GQ': 'Equatorial Guinea', 'GR': 'Greece', 'GS': 'South Georgia',
    'GT': 'Guatemala', 'GU': 'Guam', 'GW': 'Guinea-Bissau',
    'GY': 'Guyana', 'HK': 'Hong Kong', 'HM': 'Heard Island',
    'HN': 'Honduras', 'HR': 'Croatia', 'HT': 'Haiti',
    'HU': 'Hungary', 'ID': 'Indonesia', 'IE': 'Ireland',
    'IL': 'Israel', 'IM': 'Isle of Man', 'IN': 'India',
    'IO': 'British Indian Ocean', 'IQ': 'Iraq', 'IR': 'Iran',
    'IS': 'Iceland', 'IT': 'Italy', 'JE': 'Jersey',
    'JM': 'Jamaica', 'JO': 'Jordan', 'JP': 'Japan',
    'KA': 'Georgia country', 'KE': 'Kenya', 'KG': 'Kyrgyzstan',
    'KH': 'Cambodia', 'KI': 'Kiribati', 'KM': 'Comoros',
    'KN': 'Saint Kitts and Nevis', 'KP': 'North Korea',
    'KR': 'South Korea', 'KW': 'Kuwait', 'KY': 'Cayman Islands',
    'KZ': 'Kazakhstan', 'LA': 'Laos', 'LB': 'Lebanon',
    'LC': 'Saint Lucia', 'LI': 'Liechtenstein', 'LK': 'Sri Lanka',
    'LR': 'Liberia', 'LS': 'Lesotho', 'LT': 'Lithuania',
    'LU': 'Luxembourg', 'LV': 'Latvia', 'LY': 'Libya',
    'MA': 'Morocco', 'MC': 'Monaco', 'MD': 'Moldova',
    'ME': 'Montenegro', 'MF': 'Saint Martin', 'MG': 'Madagascar',
    'MH': 'Marshall Islands', 'MK': 'North Macedonia',
    'ML': 'Mali', 'MM': 'Myanmar', 'MN': 'Mongolia',
    'MO': 'Macau', 'MP': 'Northern Mariana', 'MR': 'Mauritania',
    'MS': 'Montserrat', 'MT': 'Malta', 'MU': 'Mauritius',
    'MV': 'Maldives', 'MW': 'Malawi', 'MX': 'Mexico',
    'MY': 'Malaysia', 'MZ': 'Mozambique', 'NA': 'Namibia',
    'NC': 'New Caledonia', 'NE': 'Niger', 'NF': 'Norfolk Island',
    'NG': 'Nigeria', 'NI': 'Nicaragua', 'NL': 'Netherlands',
    'NO': 'Norway', 'NP': 'Nepal', 'NR': 'Nauru',
    'NU': 'Niue', 'NZ': 'New Zealand', 'OM': 'Oman',
    'PA': 'Panama', 'PE': 'Peru', 'PF': 'French Polynesia',
    'PG': 'Papua New Guinea', 'PH': 'Philippines', 'PK': 'Pakistan',
    'PL': 'Poland', 'PM': 'Saint Pierre', 'PN': 'Pitcairn',
    'PR': 'Puerto Rico', 'PS': 'Palestine', 'PT': 'Portugal',
    'PW': 'Palau', 'PY': 'Paraguay', 'QA': 'Qatar',
    'RO': 'Romania', 'RS': 'Serbia', 'RU': 'Russia',
    'RW': 'Rwanda', 'SA': 'Saudi Arabia', 'SB': 'Solomon Islands',
    'SC': 'Seychelles', 'SD': 'Sudan', 'SE': 'Sweden',
    'SG': 'Singapore', 'SH': 'Saint Helena', 'SI': 'Slovenia',
    'SK': 'Slovakia', 'SL': 'Sierra Leone', 'SM': 'San Marino',
    'SN': 'Senegal', 'SO': 'Somalia', 'SR': 'Suriname',
    'SS': 'South Sudan', 'ST': 'Sao Tome', 'SV': 'El Salvador',
    'SX': 'Sint Maarten', 'SY': 'Syria', 'SZ': 'Eswatini',
    'TC': 'Turks and Caicos', 'TD': 'Chad', 'TF': 'French Southern',
    'TG': 'Togo', 'TH': 'Thailand', 'TJ': 'Tajikistan',
    'TL': 'Timor Leste', 'TM': 'Turkmenistan', 'TN': 'Tunisia',
    'TO': 'Tonga', 'TR': 'Turkey', 'TT': 'Trinidad Tobago',
    'TW': 'Taiwan', 'TZ': 'Tanzania', 'UA': 'Ukraine',
    'UG': 'Uganda', 'US': 'United States', 'UY': 'Uruguay',
    'UZ': 'Uzbekistan', 'VA': 'Vatican', 'VC': 'Saint Vincent',
    'VE': 'Venezuela', 'VG': 'British Virgin Islands',
    'VI': 'US Virgin Islands', 'VN': 'Vietnam', 'VU': 'Vanuatu',
    'WF': 'Wallis and Futuna', 'WS': 'Samoa', 'XK': 'Kosovo',
    'YE': 'Yemen', 'ZM': 'Zambia', 'ZW': 'Zimbabwe',
}

def search_duckduckgo(query):
    """Search DuckDuckGo lite and return YouTube video IDs from results."""
    q = urllib.parse.quote(query)
    url = f'https://lite.duckduckgo.com/lite/?q={q}'
    try:
        r = subprocess.run(
            ['curl', '-s', '-L', '--max-time', '15',
             '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
             url],
            capture_output=True, text=True, timeout=20
        )
        html = r.stdout
        # Extract YouTube video IDs from links
        ids = re.findall(r'youtube\.com/watch\?v=([A-Za-z0-9_-]{11})', html)
        # Deduplicate while preserving order
        seen = set()
        unique = []
        for vid in ids:
            if vid not in seen:
                seen.add(vid)
                unique.append(vid)
        return unique[:5]  # Return top 5 candidates
    except Exception as e:
        print(f'    Search error: {e}')
        return []

def verify_oembed(video_id):
    """Verify a YouTube video exists via oEmbed API. Returns (exists, title)."""
    try:
        oembed_url = f'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json'
        r = subprocess.run(
            ['curl', '-s', '-w', '\n%{http_code}', '--max-time', '10', oembed_url],
            capture_output=True, text=True, timeout=15
        )
        output = r.stdout.strip()
        lines = output.rsplit('\n', 1)
        body = lines[0] if len(lines) > 1 else ''
        status = lines[-1] if len(lines) > 1 else '0'
        
        if status == '200' and '"title"' in body:
            data = json.loads(body)
            return True, data.get('title', '')
        return False, ''
    except:
        return False, ''

def update_json(code, video_id):
    """Update a country's youtube_id in its JSON file."""
    fp = f'data/curated/{code}.json'
    d = json.load(open(fp))
    d['youtube_id'] = video_id
    json.dump(d, open(fp, 'w'), ensure_ascii=False, indent=2)

def process_country(code, name):
    """Search and verify a YouTube video for one country."""
    # Try multiple search queries
    queries = [
        f'youtube {name} geography facts for kids educational',
        f'youtube {name} country geography documentary',
        f'youtube learn about {name} geography',
    ]
    
    for qi, query in enumerate(queries):
        # print(f'    Query {qi+1}: {query[:60]}...')
        candidates = search_duckduckgo(query)
        if not candidates:
            continue
        
        for vid in candidates:
            exists, title = verify_oembed(vid)
            if exists:
                # Check if title is at least somewhat relevant (contains country name or geography related)
                name_lower = name.lower()
                # For short names, check if any word appears in title
                name_words = [w for w in name_lower.split() if len(w) > 3]
                title_lower = title.lower()
                relevant = any(w in title_lower for w in name_words) or 'geography' in title_lower or 'country' in title_lower
                
                if relevant:
                    print(f'    FOUND: {vid} -> "{title[:70]}"')
                    return vid
                else:
                    # Still accept if it's the first result and video exists
                    if qi == 0 and vid == candidates[0]:
                        print(f'    ACCEPT (top result): {vid} -> "{title[:70]}"')
                        return vid
                    print(f'    SKIP (irrelevant): {vid} -> "{title[:70]}"')
    
    print(f'    NOT FOUND')
    return None

# Get list of countries that need videos
start_idx = int(sys.argv[1]) if len(sys.argv) > 1 else 0
end_idx = int(sys.argv[2]) if len(sys.argv) > 2 else 9999

null_countries = []
for f in sorted(glob.glob('data/curated/*.json')):
    d = json.load(open(f))
    if d.get('youtube_id') is None:
        code = f.replace('data/curated/', '').replace('.json', '')
        null_countries.append(code)

# Slice the list
batch = null_countries[start_idx:end_idx]
print(f'Processing {len(batch)} countries (index {start_idx} to {min(end_idx, len(null_countries)-1)})')
print(f'Total null before: {len(null_countries)}')
print('='*60)

found = 0
not_found = 0

for i, code in enumerate(batch):
    name = COUNTRIES.get(code, code)
    print(f'[{i+1}/{len(batch)}] {code} ({name}):')
    vid = process_country(code, name)
    if vid:
        update_json(code, vid)
        found += 1
    else:
        not_found += 1
    time.sleep(1)  # Be polite to DuckDuckGo

print('='*60)
print(f'Results: found={found}, not_found={not_found}')
