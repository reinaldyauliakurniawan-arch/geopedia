#!/bin/bash
# Batch YouTube search for countries.
# Usage: bash scripts/batch_yt.sh [start_idx] [count]
# Produces a results file: /tmp/yt_results.json

cd /home/z/my-project/geopedia

START=${1:-0}
COUNT=${2:-30}
RESULTS_FILE="/tmp/yt_results.json"
echo "{}" > "$RESULTS_FILE"

# Get null country codes
NULL_CODES=($(python3 -c "
import json, glob
nulls = []
for f in sorted(glob.glob('data/curated/*.json')):
    d = json.load(open(f))
    if d.get('youtube_id') is None:
        nulls.append(f.replace('data/curated/','').replace('.json',''))
print(' '.join(nulls))
"))

TOTAL=${#NULL_CODES[@]}
echo "Total null countries: $TOTAL"
echo "Processing from index $START, count $COUNT"
echo "========================================"

# Country name mapping (for search)
declare -A NAMES
NAMES=(
    [AD]="Andorra" [AE]="United Arab Emirates" [AF]="Afghanistan"
    [AG]="Antigua and Barbuda" [AI]="Anguilla" [AL]="Albania"
    [AM]="Armenia" [AO]="Angola" [AQ]="Antarctica"
    [AR]="Argentina" [AS]="American Samoa" [AT]="Austria"
    [AU]="Australia" [AW]="Aruba" [AX]="Aland Islands"
    [AZ]="Azerbaijan" [BA]="Bosnia and Herzegovina" [BB]="Barbados"
    [BD]="Bangladesh" [BE]="Belgium" [BF]="Burkina Faso"
    [BG]="Bulgaria" [BH]="Bahrain" [BI]="Burundi"
    [BJ]="Benin" [BL]="Saint Barthelemy" [BM]="Bermuda"
    [BN]="Brunei" [BO]="Bolivia" [BR]="Brazil"
    [BS]="Bahamas" [BT]="Bhutan" [BW]="Botswana"
    [BY]="Belarus" [BZ]="Belize" [CA]="Canada"
    [CD]="DR Congo" [CF]="Central African Republic"
    [CG]="Republic of Congo" [CH]="Switzerland" [CI]="Ivory Coast"
    [CK]="Cook Islands" [CL]="Chile" [CM]="Cameroon"
    [CN]="China" [CO]="Colombia" [CR]="Costa Rica"
    [CU]="Cuba" [CV]="Cape Verde" [CW]="Curacao"
    [CY]="Cyprus" [CZ]="Czech Republic" [DE]="Germany"
    [DJ]="Djibouti" [DK]="Denmark" [DM]="Dominica"
    [DO]="Dominican Republic" [DZ]="Algeria" [EC]="Ecuador"
    [EE]="Estonia" [EG]="Egypt" [EH]="Western Sahara"
    [ER]="Eritrea" [ES]="Spain" [ET]="Ethiopia"
    [FI]="Finland" [FJ]="Fiji" [FK]="Falkland Islands"
    [FM]="Micronesia" [FO]="Faroe Islands" [FR]="France"
    [GA]="Gabon" [GB]="United Kingdom" [GD]="Grenada"
    [GE]="Georgia country" [GG]="Guernsey" [GH]="Ghana"
    [GL]="Greenland" [GM]="Gambia" [GN]="Guinea"
    [GQ]="Equatorial Guinea" [GR]="Greece" [GS]="South Georgia"
    [GT]="Guatemala" [GU]="Guam" [GW]="Guinea-Bissau"
    [GY]="Guyana" [HK]="Hong Kong" [HM]="Heard Island"
    [HN]="Honduras" [HR]="Croatia" [HT]="Haiti"
    [HU]="Hungary" [ID]="Indonesia" [IE]="Ireland"
    [IL]="Israel" [IM]="Isle of Man" [IN]="India"
    [IO]="British Indian Ocean" [IQ]="Iraq" [IR]="Iran"
    [IS]="Iceland" [IT]="Italy" [JE]="Jersey"
    [JM]="Jamaica" [JO]="Jordan" [JP]="Japan"
    [KA]="Georgia" [KE]="Kenya" [KG]="Kyrgyzstan"
    [KH]="Cambodia" [KI]="Kiribati" [KM]="Comoros"
    [KN]="Saint Kitts and Nevis" [KP]="North Korea"
    [KR]="South Korea" [KW]="Kuwait" [KY]="Cayman Islands"
    [KZ]="Kazakhstan" [LA]="Laos" [LB]="Lebanon"
    [LC]="Saint Lucia" [LI]="Liechtenstein" [LK]="Sri Lanka"
    [LR]="Liberia" [LS]="Lesotho" [LT]="Lithuania"
    [LU]="Luxembourg" [LV]="Latvia" [LY]="Libya"
    [MA]="Morocco" [MC]="Monaco" [MD]="Moldova"
    [ME]="Montenegro" [MF]="Saint Martin" [MG]="Madagascar"
    [MH]="Marshall Islands" [MK]="North Macedonia"
    [ML]="Mali" [MM]="Myanmar" [MN]="Mongolia"
    [MO]="Macau" [MP]="Northern Mariana" [MR]="Mauritania"
    [MS]="Montserrat" [MT]="Malta" [MU]="Mauritius"
    [MV]="Maldives" [MW]="Malawi" [MX]="Mexico"
    [MY]="Malaysia" [MZ]="Mozambique" [NA]="Namibia"
    [NC]="New Caledonia" [NE]="Niger" [NF]="Norfolk Island"
    [NG]="Nigeria" [NI]="Nicaragua" [NL]="Netherlands"
    [NO]="Norway" [NP]="Nepal" [NR]="Nauru"
    [NU]="Niue" [NZ]="New Zealand" [OM]="Oman"
    [PA]="Panama" [PE]="Peru" [PF]="French Polynesia"
    [PG]="Papua New Guinea" [PH]="Philippines" [PK]="Pakistan"
    [PL]="Poland" [PM]="Saint Pierre" [PN]="Pitcairn"
    [PR]="Puerto Rico" [PS]="Palestine" [PT]="Portugal"
    [PW]="Palau" [PY]="Paraguay" [QA]="Qatar"
    [RO]="Romania" [RS]="Serbia" [RU]="Russia"
    [RW]="Rwanda" [SA]="Saudi Arabia" [SB]="Solomon Islands"
    [SC]="Seychelles" [SD]="Sudan" [SE]="Sweden"
    [SG]="Singapore" [SH]="Saint Helena" [SI]="Slovenia"
    [SK]="Slovakia" [SL]="Sierra Leone" [SM]="San Marino"
    [SN]="Senegal" [SO]="Somalia" [SR]="Suriname"
    [SS]="South Sudan" [ST]="Sao Tome" [SV]="El Salvador"
    [SX]="Sint Maarten" [SY]="Syria" [SZ]="Eswatini"
    [TC]="Turks and Caicos" [TD]="Chad" [TF]="French Southern"
    [TG]="Togo" [TH]="Thailand" [TJ]="Tajikistan"
    [TL]="Timor Leste" [TM]="Turkmenistan" [TN]="Tunisia"
    [TO]="Tonga" [TR]="Turkey" [TT]="Trinidad Tobago"
    [TW]="Taiwan" [TZ]="Tanzania" [UA]="Ukraine"
    [UG]="Uganda" [US]="United States" [UY]="Uruguay"
    [UZ]="Uzbekistan" [VA]="Vatican" [VC]="Saint Vincent"
    [VE]="Venezuela" [VG]="British Virgin Islands"
    [VI]="US Virgin Islands" [VN]="Vietnam" [VU]="Vanuatu"
    [WF]="Wallis and Futuna" [WS]="Samoa" [XK]="Kosovo"
    [YE]="Yemen" [ZM]="Zambia" [ZW]="Zimbabwe"
)

FOUND=0
NOTFOUND=0
ERRORS=0

for ((i=START; i<START+COUNT && i<TOTAL; i++)); do
    CODE=${NULL_CODES[$i]}
    NAME=${NAMES[$CODE]:-$CODE}
    
    echo -n "[$((i+1))/$TOTAL] $CODE ($NAME)... "
    
    # Search YouTube
    QUERY=$(python3 -c "import urllib.parse;print(urllib.parse.quote('$NAME geography for kids'))")
    URL="https://www.youtube.com/results?search_query=${QUERY}"
    
    agent-browser open "$URL" >/dev/null 2>&1
    sleep 1.5
    
    # Extract video IDs
    RESULT=$(bash scripts/yt_search.sh "$NAME" 2>/dev/null)
    
    # Parse first video ID
    VID=$(echo "$RESULT" | python3 -c "
import json,sys
try:
    data=json.loads(sys.stdin.read().strip())
    if data and len(data)>0:
        print(data[0]['id'])
except: pass
" 2>/dev/null)
    
    if [ -z "$VID" ]; then
        echo "NO RESULTS"
        NOTFOUND=$((NOTFOUND+1))
        continue
    fi
    
    # Verify via oEmbed
    OEMBED=$(curl -s -w '\n%{http_code}' --max-time 8 "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${VID}&format=json" 2>/dev/null)
    STATUS=$(echo "$OEMBED" | tail -1)
    
    if [ "$STATUS" = "200" ]; then
        TITLE=$(echo "$OEMBED" | head -1 | python3 -c "import json,sys;print(json.loads(sys.stdin.read()).get('title','')[:60])" 2>/dev/null)
        echo "OK $VID \"$TITLE\""
        # Update JSON
        python3 -c "
import json
d=json.load(open('data/curated/$CODE.json'))
d['youtube_id']='$VID'
json.dump(d,open('data/curated/$CODE.json','w'),ensure_ascii=False,indent=2)
"
        FOUND=$((FOUND+1))
        # Save to results file
        python3 -c "
import json
data=json.load(open('/tmp/yt_results.json'))
data['$CODE']={'id':'$VID','title':'''$TITLE'''}
json.dump(data,open('/tmp/yt_results.json','w'),ensure_ascii=False,indent=2)
"
    else
        echo "VERIFY FAIL ($VID)"
        NOTFOUND=$((NOTFOUND+1))
    fi
    
    sleep 0.5
done

echo "========================================"
echo "DONE: found=$FOUND not_found=$NOTFOUND errors=$ERRORS"
