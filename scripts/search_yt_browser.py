#!/usr/bin/env python3
"""
Search YouTube for real videos using agent-browser, verify via oEmbed.
Usage: python3 scripts/search_yt_browser.py [start] [end]
"""
import json, glob, re, subprocess, sys, time

COUNTRIES = {
    'AD': 'Andorra', 'AE': 'United Arab Emirates', 'AF': 'Afghanistan',
    'AG': 'Antigua Barbuda', 'AI': 'Anguilla', 'AL': 'Albania',
    'AM': 'Armenia', 'AO': 'Angola', 'AQ': 'Antarctica',
    'AR': 'Argentina', 'AS': 'American Samoa', 'AT': 'Austria',
    'AU': 'Australia', 'AW': 'Aruba', 'AX': 'Aland Islands',
    'AZ': 'Azerbaijan', 'BA': 'Bosnia Herzegovina', 'BB': 'Barbados',
    'BD': 'Bangladesh', 'BE': 'Belgium', 'BF': 'Burkina Faso',
    'BG': 'Bulgaria', 'BH': 'Bahrain', 'BI': 'Burundi',
    'BJ': 'Benin', 'BL': 'Saint Barthelemy', 'BM': 'Bermuda',
    'BN': 'Brunei', 'BO': 'Bolivia', 'BR': 'Brazil',
    'BS': 'Bahamas', 'BT': 'Bhutan', 'BW': 'Botswana',
    'BY': 'Belarus', 'BZ': 'Belize', 'CA': 'Canada',
    'CD': 'DR Congo', 'CF': 'Central African Republic',
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
    'GE': 'Georgia country', 'GG': 'Guernsey', 'GH': 'Ghana',
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
    'KA': 'Georgia', 'KE': 'Kenya', 'KG': 'Kyrgyzstan',
    'KH': 'Cambodia', 'KI': 'Kiribati', 'KM': 'Comoros',
    'KN': 'Saint Kitts Nevis', 'KP': 'North Korea',
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
    'TC': 'Turks Caicos', 'TD': 'Chad', 'TF': 'French Southern',
    'TG': 'Togo', 'TH': 'Thailand', 'TJ': 'Tajikistan',
    'TL': 'Timor Leste', 'TM': 'Turkmenistan', 'TN': 'Tunisia',
    'TO': 'Tonga', 'TR': 'Turkey', 'TT': 'Trinidad Tobago',
    'TW': 'Taiwan', 'TZ': 'Tanzania', 'UA': 'Ukraine',
    'UG': 'Uganda', 'US': 'United States', 'UY': 'Uruguay',
    'UZ': 'Uzbekistan', 'VA': 'Vatican', 'VC': 'Saint Vincent',
    'VE': 'Venezuela', 'VG': 'British Virgin Islands',
    'VI': 'US Virgin Islands', 'VN': 'Vietnam', 'VU': 'Vanuatu',
    'WF': 'Wallis Futuna', 'WS': 'Samoa', 'XK': 'Kosovo',
    'YE': 'Yemen', 'ZM': 'Zambia', 'ZW': 'Zimbabwe',
}

def browser_cmd(cmd, timeout=30):
    """Run agent-browser command and return stdout."""
    r = subprocess.run(f'agent-browser {cmd}', shell=True, capture_output=True, text=True, timeout=timeout)
    return r.stdout.strip()

def search_youtube(name):
    """Search YouTube and return list of (video_id, title) tuples."""
    query = f'{name} geography for kids'
    url = f'https://www.youtube.com/results?search_query={query.replace(" ", "+")}'
    browser_cmd(f'open "{url}"', timeout=20)
    time.sleep(2)
    
    # Extract video links
    js = 'JSON.stringify(Array.from(document.querySelectorAll(\'a[id="video-title"]\')).map(a => ({id: a.href.match(/v=([A-Za-z0-9_-]{11})/)?.[1], t: a.textContent.trim().substring(0,80)})).filter(x => x.id))'
    output = browser_cmd(f'eval "{js}"', timeout=15)
    
    try:
        results = json.loads(output)
        return [(r['id'], r['t']) for r in results if r.get('id')]
    except:
        return []

def verify_oembed(video_id):
    """Verify video exists via oEmbed. Returns (exists, title)."""
    try:
        url = f'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json'
        r = subprocess.run(['curl', '-s', '-w', '\n%{http_code}', '--max-time', '8', url],
                          capture_output=True, text=True, timeout=12)
        lines = r.stdout.strip().rsplit('\n', 1)
        body = lines[0] if len(lines) > 1 else ''
        status = lines[-1] if len(lines) > 1 else '0'
        if status == '200' and '"title"' in body:
            data = json.loads(body)
            return True, data.get('title', '')
        return False, ''
    except:
        return False, ''

def update_json(code, video_id):
    fp = f'data/curated/{code}.json'
    d = json.load(open(fp))
    d['youtube_id'] = video_id
    json.dump(d, open(fp, 'w'), ensure_ascii=False, indent=2)

# Main
start = int(sys.argv[1]) if len(sys.argv) > 1 else 0
end = int(sys.argv[2]) if len(sys.argv) > 2 else 9999

null_codes = []
for f in sorted(glob.glob('data/curated/*.json')):
    d = json.load(open(f))
    if d.get('youtube_id') is None:
        null_codes.append(f.replace('data/curated/','').replace('.json',''))

batch = null_codes[start:end]
print(f'Batch: {len(batch)} countries (idx {start}-{min(end, len(null_codes)-1)}) of {len(null_codes)} null')
print('='*70)

found = 0
not_found = 0
errors = 0

for i, code in enumerate(batch):
    name = COUNTRIES.get(code, code)
    print(f'[{start+i+1}/{len(null_codes)}] {code} ({name})...', end=' ', flush=True)
    
    try:
        results = search_youtube(name)
        if not results:
            print('NO RESULTS')
            not_found += 1
            continue
        
        # Try first 3 results, verify via oEmbed
        filled = False
        for vid, title in results[:3]:
            exists, real_title = verify_oembed(vid)
            if exists:
                print(f'OK {vid} "{real_title[:50]}"')
                update_json(code, vid)
                found += 1
                filled = True
                break
        
        if not filled:
            print('NONE VERIFIED')
            not_found += 1
    except Exception as e:
        print(f'ERROR: {e}')
        errors += 1
    
    time.sleep(0.5)

print('='*70)
print(f'DONE: found={found}, not_found={not_found}, errors={errors}')
