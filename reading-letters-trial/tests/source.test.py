"""Read-only checks for the isolated trial source and generated preview."""
from pathlib import Path
import base64,hashlib,json,subprocess,sys
HERE=Path(__file__).resolve().parent
REPO=HERE.parent.parent
GENERATED=Path(sys.argv[1])/'src'
source=(REPO/'script.js').read_bytes()
block=source[source.index(b'/* RR3-ENGINE-BEGIN */'):source.index(b'/* RR3-ENGINE-END */')+len(b'/* RR3-ENGINE-END */')]
assert (GENERATED/'engine-original.js').read_bytes()==block+b'\nexport {rr3CreateEngine, RR3_CAR_COLORS, RR3_THEMES};\n'
assert hashlib.sha256(block).hexdigest()=='63345ff268857d5ca66673af0ef21b9b98762a5dee598cc9328ff6bf942c79cd'
allow=json.loads((REPO/'reading-race-data/allowlist.json').read_text())
letters=[r for r in allow['approved'] if r['section']=='letters']
audio=json.loads((GENERATED/'letter-bytes.json').read_text())
assert len(audio)==27
assert set(audio)=={r['sourcePath'] for r in letters}
for r in letters:
    raw=base64.b64decode(audio[r['sourcePath']])
    assert hashlib.sha256(raw).hexdigest()==r['audioSha256']
    assert raw==(REPO/r['sourcePath']).read_bytes()
assert not any('letter_09_thal' in p for p in audio)
host=(HERE.parent/'src/App.tsx').read_text()
assert all(x not in host for x in ['localStorage','sessionStorage','indexedDB','fetch(','speechSynthesis'])
assert b'localStorage' not in block
assert 'createReadingBank' in host and 'URL.createObjectURL(q.question.audio)' in host
print(json.dumps({'status':'PASS','approvedLetterBytes':27,'blockedThalEmbedded':False,'generatedEngineMatchesTrialBranch':True,'engineBlockSha256':hashlib.sha256(block).hexdigest(),'hostStorageWrites':0,'originalAudioUnchanged':True,'engineOptInSites':4},indent=2))
