"""Package the isolated preview using the existing, byte-identical engine block.
No original application or audio file is written. No network or deployment.
"""
from pathlib import Path
import hashlib,json,base64,shutil,sys
HERE=Path(__file__).resolve().parent
REPO=HERE.parent
OUT=Path(sys.argv[1]).resolve()
if OUT==REPO or REPO in OUT.parents:raise ValueError('output must be outside repository')
OUT.mkdir(parents=True,exist_ok=True)
shutil.copytree(HERE/'src',OUT/'src',dirs_exist_ok=True)
s=(REPO/'script.js').read_bytes()
a=s.index(b'/* RR3-ENGINE-BEGIN */');b=s.index(b'/* RR3-ENGINE-END */')+len(b'/* RR3-ENGINE-END */')
block=s[a:b]
expected='1173029cc765fa19dfddb27e0edfb48fad7cc4a8434778a9e76ac1f7105af190'
if hashlib.sha256(block).hexdigest()!=expected:raise ValueError('existing engine changed; review required')
(OUT/'src/engine-original.js').write_bytes(block+b'\nexport {rr3CreateEngine, RR3_CAR_COLORS, RR3_THEMES};\n')
shutil.copytree(REPO/'reading-race-data',OUT/'src/bank',dirs_exist_ok=True)
shutil.rmtree(OUT/'src/bank/tests')
for name in ['human-review-results.json','README-ar.md']:(OUT/'src/bank'/name).unlink()
allow=json.loads((REPO/'reading-race-data/allowlist.json').read_text())
rows=[r for r in allow['approved'] if r['section']=='letters']
if len(rows)!=27:raise ValueError('letter count')
audio={}
for r in rows:
    raw=(REPO/r['sourcePath']).read_bytes()
    if hashlib.sha256(raw).hexdigest()!=r['audioSha256']:raise ValueError('recording changed')
    audio[r['sourcePath']]=base64.b64encode(raw).decode('ascii')
(OUT/'src/letter-bytes.json').write_text(json.dumps(audio))
(OUT/'src/engine-provenance.json').write_text(json.dumps({'source':'script.js','sourceCommit':allow['sourceCommit'],'originalBlockSha256':expected,'changes':'none; export appended outside original block'},indent=2))
print(json.dumps({'path':str(OUT),'recordings':len(rows),'engine':'byte-identical original engine dependency, not a reimplementation','sourceUnchanged':True}))
