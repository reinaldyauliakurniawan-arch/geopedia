import json,os,sys
dir='data/curated'
T='2026-07-27'
G=['menunjukkan betapa beragamnya kondisi geografis','menyimpan cerita menarik tentang bagaimana geografi','dapat fokus pada niche ekonomi spesialis','ketergantungan pada impor','Sebagai negara mikro','rentan terhadap badai tropis/siklon','menjadi modal pembangunan berkelanjutan','Memiliki akses ke laut/samudra memberikan','Ukuran compact','garis pantai yang sepenuhnya dikelola','peluang perdagangan maritim, perikanan, dan pelabuhan','negara kepulauan/pulau','menghadapi tantangan RUANG HIDUP','Sumber daya alam','(meski jenisnya berbeda-beda)']
def hg(t):return any(p in t for p in G)
# Format: code:[[k1,k2,k3],[r1,r2],[f1,f2,f3]]
D={}
exec(open('scripts/fix_data.py').read())
print(f'Loaded {len(D)} countries')
fc=fn=fy=0
for f in sorted(os.listdir(dir)):
 if not f.endswith('.json'):continue
 c=f.replace('.json','')
 p=os.path.join(dir,f)
 with open(p) as j:d=json.load(j)
 ch=False
 if c in D:
  for field,idx in [('keuntungan_geografis',0),('kerugian_geografis',1),('fakta_unik',2)]:
   old=d.get(field,[])
   if any(hg(i) for i in old):
    d[field]=D[c][idx];ch=True
 if c in NR:
  for field in ['keuntungan_geografis','kerugian_geografis','fakta_unik']:
   ni=[]
   for item in d.get(field,[]):
    nw=item
    for en,ind in NR[c]:
     nw=nw.replace(en,ind)
    ni.append(nw)
   if ni!=d.get(field,[]):d[field]=ni;ch=True
 if ch:
  d['terakhir_diubah']=T
  with open(p,'w') as j:json.dump(d,j,indent=2,ensure_ascii=False)
  fc+=1
 if c in YT and d.get('youtube_id') is None:
  d['youtube_id']=YT[c]
  d['terakhir_diubah']=T
  with open(p,'w') as j:json.dump(d,j,indent=2,ensure_ascii=False)
  fy+=1
print(f'Content/names fixed: {fc}, YT added: {fy}')
