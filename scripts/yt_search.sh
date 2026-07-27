#!/bin/bash
# Search YouTube for a country and extract video IDs
# Usage: bash scripts/yt_search.sh "Country Name"
NAME="$1"
QUERY=$(echo "$NAME geography for kids" | python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.stdin.read().strip()))')
URL="https://www.youtube.com/results?search_query=${QUERY}"

agent-browser open "$URL" 2>/dev/null
sleep 2

# Write JS to temp file to avoid shell escaping issues
python3 -c '
import json, re, sys
js = """
(function() {
    var links = document.querySelectorAll("a[id=\\"video-title\\"]");
    var results = [];
    for (var i = 0; i < Math.min(links.length, 5); i++) {
        var href = links[i].href;
        var m = href.match(/[?&]v=([A-Za-z0-9_-]{11})/);
        if (m) {
            results.push({id: m[1], t: links[i].textContent.trim().substring(0, 70)});
        }
    }
    return JSON.stringify(results);
})()
"""
with open("/tmp/yt_eval.js", "w") as f:
    f.write(js)
'

agent-browser eval "$(cat /tmp/yt_eval.js)" 2>/dev/null