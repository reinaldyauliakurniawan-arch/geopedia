#!/usr/bin/env python3
"""
Build real-data restcountries-fallback.json from:
- World Bank API: population, area, region, lat/lng, iso2/iso3
- CountriesNow API: capital, currency, iso2/iso3
- Static overrides for territories not in either source
"""
import json, urllib.request, ssl, time, os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FALLBACK = os.path.join(REPO, 'data', 'restcountries-fallback.json')
SOURCES = os.path.join(REPO, 'data', '_build_sources.json')

def fetch_json(url, timeout=30):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    resp = urllib.request.urlopen(req, timeout=timeout, context=ctx)
    return json.loads(resp.read().decode('utf-8'))

# ============================================================
# STATIC DATA (territories not covered by World Bank/CountriesNow)
# ============================================================
REGION_MAP = {
    'EAS': ('Asia', 'East Asia & Pacific'), 'ECS': ('Europe', 'Europe & Central Asia'),
    'LCN': ('Americas', 'Latin America & Caribbean'), 'NAC': ('Americas', 'North America'),
    'MEA': ('Middle East', 'Middle East & North Africa'), 'SAS': ('Asia', 'South Asia'),
    'SSF': ('Africa', 'Sub-Saharan Africa'), 'NA': ('Other', 'Aggregates'),
    'EAP': ('Asia', 'East Asia & Pacific'), 'ECA': ('Europe', 'Europe & Central Asia'),
    'LAC': ('Americas', 'Latin America & Caribbean'), 'MNA': ('Middle East', 'Middle East & North Africa'),
    'SSA': ('Africa', 'Sub-Saharan Africa'),
}

TERRITORY_REGION = {
    'AX': ('Europe', 'Northern Europe'), 'BL': ('Americas', 'Caribbean'),
    'CK': ('Oceania', 'Polynesia'), 'FK': ('Americas', 'South America'),
    'GF': ('Americas', 'South America'), 'GP': ('Americas', 'Caribbean'),
    'GS': ('Antarctic', 'Antarctic'), 'HM': ('Antarctic', 'Antarctic'),
    'IO': ('Africa', 'Eastern Africa'), 'JE': ('Europe', 'Northern Europe'),
    'MF': ('Americas', 'Caribbean'), 'MS': ('Americas', 'Caribbean'),
    'NF': ('Oceania', 'Oceania'), 'NU': ('Oceania', 'Polynesia'),
    'PM': ('Americas', 'North America'), 'PN': ('Oceania', 'Polynesia'),
    'RE': ('Africa', 'Eastern Africa'), 'SH': ('Africa', 'Western Africa'),
    'SJ': ('Europe', 'Northern Europe'), 'TF': ('Antarctic', 'Antarctic'),
    'WF': ('Oceania', 'Polynesia'), 'YT': ('Africa', 'Eastern Africa'),
    'EH': ('Africa', 'Northern Africa'), 'AQ': ('Antarctic', 'Antarctic'),
    'AI': ('Americas', 'Caribbean'), 'GG': ('Europe', 'Northern Europe'),
    'TW': ('Asia', 'Eastern Asia'), 'VA': ('Europe', 'Southern Europe'),
    'KA': ('Europe', 'Eastern Europe'), 'AS': ('Oceania', 'Polynesia'),
}

MANUAL_CCA3 = {
    'AS': 'ASM', 'KA': 'XKX', 'X1': None, 'X2': None, 'X3': None, 'X4': None, 'X5': None,
    'AX': 'ALA', 'BL': 'BLM', 'CK': 'COK', 'EH': 'ESH', 'FK': 'FLK',
    'GF': 'GUF', 'GG': 'GGY', 'GS': 'SGS', 'HM': 'HMD', 'IO': 'IOT',
    'JE': 'JEY', 'MF': 'MAF', 'MS': 'MSR', 'NF': 'NFK', 'NU': 'NIU',
    'PM': 'SPM', 'PN': 'PCN', 'RE': 'REU', 'SH': 'SHN', 'SJ': 'SJM',
    'TF': 'ATF', 'TW': 'TWN', 'VA': 'VAT', 'WF': 'WLF', 'YT': 'MYT', 'AQ': 'ATA',
}

TERRITORY_COORDS = {
    'AX': [60.0, 20.0], 'BL': [17.9, -62.83], 'CK': [-21.21, -159.78],
    'EH': [24.5, -13.0], 'FK': [-51.8, -59.5], 'GF': [4.0, -53.0],
    'GG': [49.47, -2.55], 'GS': [-54.5, -37.0], 'HM': [-53.1, 73.5],
    'IO': [-6.0, 71.5], 'JE': [49.22, -2.13], 'MF': [18.07, -63.05],
    'MS': [16.75, -62.2], 'NF': [-29.05, 167.95], 'NU': [-19.05, -169.87],
    'PM': [46.83, -56.33], 'PN': [-24.7, -127.45], 'RE': [-21.12, 55.54],
    'SH': [-15.95, -5.72], 'SJ': [78.0, 20.0], 'TF': [-43.0, 67.0],
    'TW': [23.7, 120.96], 'VA': [41.9, 12.45], 'WF': [-13.3, -176.2],
    'YT': [-12.83, 45.17], 'AQ': [-75.0, 0.0], 'AI': [18.22, -63.07],
    'AS': [-14.27, -170.13], 'KA': [42.6, 20.9], 'CW': [12.17, -68.98],
    'PS': [31.95, 35.23], 'SX': [18.03, -63.05],
}

TERRITORY_DATA = {
    'AX': {'pop': 29489, 'area': 1580, 'cap': 'Mariehamn'},
    'BL': {'pop': 3242, 'area': 21, 'cap': 'Gustavia'},
    'CK': {'pop': 17564, 'area': 236, 'cap': 'Avarua'},
    'EH': {'pop': 567421, 'area': 266000, 'cap': 'El Aaiun'},
    'FK': {'pop': 3715, 'area': 12173, 'cap': 'Stanley'},
    'GF': {'pop': 298682, 'area': 83534, 'cap': 'Cayenne'},
    'GG': {'pop': 64097, 'area': 78, 'cap': 'St. Peter Port'},
    'GS': {'pop': 30, 'area': 3903000, 'cap': 'King Edward Point'},
    'HM': {'pop': 0, 'area': 412, 'cap': ''},
    'IO': {'pop': 3000, 'area': 60, 'cap': 'Diego Garcia'},
    'JE': {'pop': 100800, 'area': 116, 'cap': 'St. Helier'},
    'MF': {'pop': 31904, 'area': 53, 'cap': 'Marigot'},
    'MS': {'pop': 4341, 'area': 102, 'cap': 'Plymouth'},
    'NF': {'pop': 2322, 'area': 35, 'cap': 'Kingston'},
    'NU': {'pop': 1614, 'area': 260, 'cap': 'Alofi'},
    'PM': {'pop': 5976, 'area': 242, 'cap': 'Saint-Pierre'},
    'PN': {'pop': 50, 'area': 47, 'cap': 'Adamstown'},
    'RE': {'pop': 895261, 'area': 2512, 'cap': 'Saint-Denis'},
    'SH': {'pop': 5313, 'area': 162, 'cap': 'Jamestown'},
    'SJ': {'pop': 2652, 'area': 61399, 'cap': 'Longyearbyen'},
    'TF': {'pop': 140, 'area': 7738, 'cap': 'Port-aux-Francais'},
    'TW': {'pop': 23893394, 'area': 36197, 'cap': 'Taipei'},
    'VA': {'pop': 518, 'area': 0.44, 'cap': 'Vatican City'},
    'WF': {'pop': 11558, 'area': 142, 'cap': 'Mata-Utu'},
    'YT': {'pop': 284507, 'area': 374, 'cap': 'Mamoudzou'},
    'AQ': {'pop': 1106, 'area': 14200000, 'cap': ''},
    'AI': {'pop': 15093, 'area': 91, 'cap': 'The Valley'},
    'KA': {'pop': 1682668, 'area': 10887, 'cap': 'Pristina'},
    'XK': {'pop': 1682668, 'area': 10887, 'cap': 'Pristina'},
    'CW': {'pop': 152369, 'area': 444, 'cap': 'Willemstad'},
    'PS': {'pop': 5483450, 'area': 6020, 'cap': 'Ramallah'},
}

CURRENCY_NAMES = {
    'USD': 'United States Dollar', 'EUR': 'Euro', 'GBP': 'British Pound', 'JPY': 'Japanese Yen',
    'CNY': 'Chinese Yuan', 'INR': 'Indian Rupee', 'AUD': 'Australian Dollar', 'CAD': 'Canadian Dollar',
    'CHF': 'Swiss Franc', 'KRW': 'South Korean Won', 'BRL': 'Brazilian Real', 'RUB': 'Russian Ruble',
    'MXN': 'Mexican Peso', 'ZAR': 'South African Rand', 'SEK': 'Swedish Krona', 'NOK': 'Norwegian Krone',
    'DKK': 'Danish Krone', 'NZD': 'New Zealand Dollar', 'SGD': 'Singapore Dollar', 'HKD': 'Hong Kong Dollar',
    'THB': 'Thai Baht', 'MYR': 'Malaysian Ringgit', 'IDR': 'Indonesian Rupiah', 'PHP': 'Philippine Peso',
    'VND': 'Vietnamese Dong', 'TWD': 'New Taiwan Dollar', 'PLN': 'Polish Zloty', 'TRY': 'Turkish Lira',
    'SAR': 'Saudi Riyal', 'AED': 'UAE Dirham', 'ILS': 'Israeli New Shekel', 'CLP': 'Chilean Peso',
    'COP': 'Colombian Peso', 'ARS': 'Argentine Peso', 'PEN': 'Peruvian Sol', 'EGP': 'Egyptian Pound',
    'PKR': 'Pakistani Rupee', 'BDT': 'Bangladeshi Taka', 'NGN': 'Nigerian Naira', 'KES': 'Kenyan Shilling',
    'ETB': 'Ethiopian Birr', 'QAR': 'Qatari Rial', 'KWD': 'Kuwaiti Dinar', 'BHD': 'Bahraini Dinar',
    'OMR': 'Omani Rial', 'JOD': 'Jordanian Dinar', 'LBP': 'Lebanese Pound', 'IQD': 'Iraqi Dinar',
    'MAD': 'Moroccan Dirham', 'DZD': 'Algerian Dinar', 'TND': 'Tunisian Dinar', 'LYD': 'Libyan Dinar',
    'GHS': 'Ghanaian Cedi', 'XOF': 'West African CFA Franc', 'XAF': 'Central African CFA Franc',
    'TZS': 'Tanzanian Shilling', 'UGX': 'Ugandan Shilling', 'MWK': 'Malawian Kwacha',
    'ZMW': 'Zambian Kwacha', 'BWP': 'Botswanan Pula', 'NAD': 'Namibian Dollar',
    'MZN': 'Mozambican Metical', 'MUR': 'Mauritian Rupee', 'SCR': 'Seychellois Rupee',
    'MGA': 'Malagasy Ariary', 'KMF': 'Comorian Franc', 'GMD': 'Gambian Dalasi',
    'GNF': 'Guinean Franc', 'SLL': 'Sierra Leonean Leone', 'LRD': 'Liberian Dollar',
    'CVE': 'Cape Verdean Escudo', 'STN': 'Sao Tome and Principe Dobra', 'XCD': 'East Caribbean Dollar',
    'BZD': 'Belize Dollar', 'BBD': 'Barbadian Dollar', 'JMD': 'Jamaican Dollar',
    'TTD': 'Trinidad and Tobago Dollar', 'BSD': 'Bahamian Dollar', 'BMD': 'Bermudian Dollar',
    'KYD': 'Cayman Islands Dollar', 'FJD': 'Fijian Dollar', 'PGK': 'Papua New Guinean Kina',
    'WST': 'Samoan Tala', 'TOP': 'Tongan Pa\'anga', 'VUV': 'Vanuatu Vatu', 'SBD': 'Solomon Islands Dollar',
    'KHR': 'Cambodian Riel', 'LAK': 'Lao Kip', 'MMK': 'Myanmar Kyat', 'MNT': 'Mongolian Tugrik',
    'AMD': 'Armenian Dram', 'GEL': 'Georgian Lari', 'AZN': 'Azerbaijani Manat',
    'KZT': 'Kazakhstani Tenge', 'UZS': 'Uzbekistan Som', 'KGS': 'Kyrgyzstani Som',
    'TJS': 'Tajikistani Somoni', 'TMT': 'Turkmenistani Manat', 'AFN': 'Afghan Afghani',
    'NPR': 'Nepalese Rupee', 'LKR': 'Sri Lankan Rupee', 'BTN': 'Bhutanese Ngultrum',
    'MVR': 'Maldivian Rufiyaa', 'PYG': 'Paraguayan Guarani', 'UYU': 'Uruguayan Peso',
    'BOB': 'Bolivian Boliviano', 'VES': 'Venezuelan Bolivar', 'CUP': 'Cuban Peso',
    'DOP': 'Dominican Peso', 'GTQ': 'Guatemalan Quetzal', 'HNL': 'Honduran Lempira',
    'NIO': 'Nicaraguan Cordoba', 'SVC': 'Salvadoran Colon', 'PAB': 'Panamanian Balboa',
    'JEP': 'Jersey Pound', 'GGP': 'Guernsey Pound', 'IMP': 'Isle of Man Pound',
    'FKP': 'Falkland Islands Pound', 'SHP': 'Saint Helena Pound', 'GIP': 'Gibraltar Pound',
    'ANG': 'Netherlands Antillean Guilder', 'AWG': 'Aruban Florin', 'SBD': 'Solomon Islands Dollar',
    'SSP': 'South Sudanese Pound', 'SDG': 'Sudanese Pound', 'ERN': 'Eritrean Nakfa',
    'DJF': 'Djiboutian Franc', 'SOS': 'Somali Shilling', 'KES': 'Kenyan Shilling',
    'BIF': 'Burundian Franc', 'RWF': 'Rwandan Franc', 'CDF': 'Congolese Franc',
    'GEL': 'Georgian Lari', 'MDL': 'Moldovan Leu', 'UAH': 'Ukrainian Hryvnia',
    'MKD': 'Macedonian Denar', 'BAM': 'Bosnia-Herzegovina Convertible Mark',
    'RSD': 'Serbian Dinar', 'ALL': 'Albanian Lek', 'BGN': 'Bulgarian Lev',
    'RON': 'Romanian Leu', 'HUF': 'Hungarian Forint', 'CZK': 'Czech Koruna',
    'SKK': 'Slovak Koruna', 'HRK': 'Croatian Kuna', 'SIT': 'Slovenian Tolar',
    'ISK': 'Icelandic Krona', 'SEK': 'Swedish Krona', 'NOK': 'Norwegian Krone',
    'DKK': 'Danish Krone', 'PLN': 'Polish Zloty', 'LTL': 'Lithuanian Litas',
    'LVL': 'Latvian Lats', 'EEK': 'Estonian Kroon', 'BYN': 'Belarusian Ruble',
    'AMD': 'Armenian Dram', 'AZN': 'Azerbaijani Manat', 'KZT': 'Kazakhstani Tenge',
    'UZS': 'Uzbekistan Som', 'KGS': 'Kyrgyzstani Som', 'TJS': 'Tajikistani Somoni',
    'TMT': 'Turkmenistani Manat', 'MNT': 'Mongolian Tugrik', 'KPW': 'North Korean Won',
    'CNH': 'Chinese Yuan (Offshore)', 'MOP': 'Macanese Pataca', 'TVD': 'Tuvaluan Dollar',
    'CKD': 'Cook Islands Dollar', 'PFr': 'CFP Franc', 'XPF': 'CFP Franc',
}

AGGREGATE_CODES = {
    'AFE','AFW','ARB','CEB','CSS','EAP','EAR','EAS','ECA','ECS','EMU','EUU','FCS',
    'HIC','HPC','IBD','IBT','IDA','IDB','IDX','INX','LAC','LCN','LDC','LIC','LMC',
    'LMY','LTE','MEA','MIC','MNA','NAC','OED','OSS','PRE','PSS','PST','SAS','SSA',
    'SSF','SST','TEA','TEC','TLA','TMN','TSA','TSS','UMC','WLD','NA'
}

def main():
    # Load or fetch sources
    if os.path.exists(SOURCES):
        print('Loading cached API sources...')
        with open(SOURCES) as f:
            s = json.load(f)
    else:
        print('Fetching from APIs (~30s)...')
        wb = fetch_json('https://api.worldbank.org/v2/country?format=json&per_page=300')[1]
        time.sleep(0.5)
        pop_raw = fetch_json('https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=20000&date=2023')[1]
        time.sleep(0.5)
        area_raw = fetch_json('https://api.worldbank.org/v2/country/all/indicator/AG.SRF.TOTL.K2?format=json&per_page=20000&date=2022')[1]
        time.sleep(0.5)
        cap_raw = fetch_json('https://countriesnow.space/api/v0.1/countries/capital')['data']

        pop_map = {e['countryiso3code']: int(e['value']) for e in pop_raw
                   if e['countryiso3code'] not in AGGREGATE_CODES and e.get('value') is not None and len(e['countryiso3code'])==3}
        area_map = {e['countryiso3code']: float(e['value']) for e in area_raw
                   if e['countryiso3code'] not in AGGREGATE_CODES and e.get('value') is not None and len(e['countryiso3code'])==3}
        cap_map = {c['iso2'].upper(): c for c in cap_raw}
        s = {'wb': wb, 'pop': pop_map, 'area': area_map, 'cap': cap_map}
        with open(SOURCES, 'w') as f:
            json.dump(s, f)

    # Fetch currency fresh
    print('Fetching currency data...')
    try:
        cur_raw = fetch_json('https://countriesnow.space/api/v0.1/countries/currency')['data']
        cur_map = {c['iso2'].upper(): c['currency'] for c in cur_raw}
    except:
        cur_map = {}

    wb_iso2 = {c['iso2Code'].upper(): c for c in s['wb']}
    cap_map = s['cap']
    pop_map = s['pop']
    area_map = s['area']

    # Load old fallback (names, flags, borders)
    with open(FALLBACK) as f:
        old = json.load(f)

    result = []
    for entry in old:
        cca2 = entry['cca2']

        # cca3
        cca3 = None
        if cca2 in cap_map and len(cap_map[cca2].get('iso3','')) == 3:
            cca3 = cap_map[cca2]['iso3'].upper()
        if not cca3 and cca2 in wb_iso2 and len(wb_iso2[cca2]['id']) == 3:
            cca3 = wb_iso2[cca2]['id'].upper()
        if not cca3:
            cca3 = MANUAL_CCA3.get(cca2)
        if not cca3:
            cca3 = cca2 + 'X'

        # population
        population = 0
        if cca3 in pop_map:
            population = pop_map[cca3]
        elif cca2 in TERRITORY_DATA:
            population = TERRITORY_DATA[cca2].get('pop', 0) or 0

        # area
        area = 0
        if cca3 in area_map:
            area = area_map[cca3]
        elif cca2 in TERRITORY_DATA:
            area = TERRITORY_DATA[cca2].get('area', 0) or 0

        # capital
        capital = []
        if cca2 in cap_map and cap_map[cca2].get('capital'):
            capital = [cap_map[cca2]['capital']]
        elif cca2 in TERRITORY_DATA and TERRITORY_DATA[cca2].get('cap'):
            capital = [TERRITORY_DATA[cca2]['cap']]

        # region
        region, subregion = 'Unknown', 'Unknown'
        if cca2 in wb_iso2:
            rid = wb_iso2[cca2]['region'].get('id', '')
            if rid in REGION_MAP:
                region, subregion = REGION_MAP[rid]
        if region == 'Unknown' and cca2 in TERRITORY_REGION:
            region, subregion = TERRITORY_REGION[cca2]

        # latlng
        latlng = entry.get('latlng', [0, 0])
        if latlng in ([0, 0], [0.0, 0.0]):
            if cca2 in wb_iso2:
                lat = wb_iso2[cca2].get('latitude')
                lon = wb_iso2[cca2].get('longitude')
                if lat and lon:
                    try: latlng = [float(lat), float(lon)]
                    except: pass
            if latlng in ([0, 0], [0.0, 0.0]) and cca2 in TERRITORY_COORDS:
                latlng = TERRITORY_COORDS[cca2]

        # currency
        currencies = {}
        if cca2 in cur_map:
            code = cur_map[cca2]
            currencies[code] = {'name': CURRENCY_NAMES.get(code, code)}

        result.append({
            'name': entry['name'],
            'capital': capital,
            'population': population,
            'area': area,
            'region': region,
            'subregion': subregion,
            'languages': {},
            'currencies': currencies,
            'flags': entry.get('flags', {'png': f'https://flagcdn.com/w320/{cca2.lower()}.png', 'svg': f'https://flagcdn.com/{cca2.lower()}.svg'}),
            'cca2': cca2,
            'cca3': cca3,
            'borders': entry.get('borders', []),
            'latlng': latlng
        })

    with open(FALLBACK, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, separators=(',', ':'))

    # Report
    z_pop = [e['cca2'] for e in result if e['population'] == 0]
    z_area = [e['cca2'] for e in result if e['area'] == 0]
    u_reg = [e['cca2'] for e in result if e['region'] == 'Unknown']
    xx = [e['cca3'] for e in result if 'XX' in e['cca3']]
    print(f'Total: {len(result)}')
    print(f'pop=0: {len(z_pop)} {z_pop}')
    print(f'area=0: {len(z_area)} {z_area}')
    print(f'region=Unknown: {len(u_reg)} {u_reg}')
    print(f'cca3 XX: {len(xx)} {xx}')
    print(f'Size: {os.path.getsize(FALLBACK):,} bytes')

    # Show samples
    for code in ['ID','US','AD','AQ','KA']:
        for e in result:
            if e['cca2'] == code:
                print(f'\n{code}: cca3={e["cca3"]} pop={e["population"]:,} area={e["area"]} reg={e["region"]} cap={e["capital"]}')
                break

if __name__ == '__main__':
    main()
