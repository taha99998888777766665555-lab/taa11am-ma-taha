#!/usr/bin/env python3
"""استبدال تسجيل واحد من تسجيلات الكسرة دون المساس ببقية الأصوات.
الاستعمال:  python replace-audio.py L-xxxxxxxx جديد.mp3
ينسخ الملف باسم مبصوم (<المعرّف>.<بصمة>.mp3)، ويحدّث audio-map.js وaudio-manifest.json لهذا الحرف فقط
(في خطوتي «أقرأ الحروف» و«أكتب الحروف» للمسار نفسه)، ويحذف الملف القديم لهذا الحرف وحده. لا يحتاج رفع رقم الكاش."""
import sys, json, hashlib, pathlib, re, shutil
H = pathlib.Path(__file__).resolve().parent
if len(sys.argv) != 3: sys.exit(__doc__)
bid, new = sys.argv[1], pathlib.Path(sys.argv[2])
man = json.loads((H / 'audio-manifest.json').read_text('utf-8'))
it = next((x for x in man['items'] if x['bank_id'] == bid), None)
if not it: sys.exit('✗ معرّف غير موجود في audio-manifest.json: ' + bid)
b = new.read_bytes()
if len(b) < 1500 or not (b[:3] == b'ID3' or b[0] == 0xFF): sys.exit('✗ الملف لا يبدو mp3 صالحًا.')
sh = hashlib.sha256(b).hexdigest(); fn = f"audio/{it['track']}/{bid}.{sh[:8]}.mp3"
if fn == it['file']: sys.exit('= هذا هو التسجيل الحالي نفسه، لا تغيير.')
(H.parent / fn).write_bytes(b)
js = (H / 'audio-map.js').read_text('utf-8'); old = it['file']
assert js.count(old) == 2, 'توقعت مدخلين (خطوتا ٧ و٨)'
(H / 'audio-map.js').write_text(js.replace(old, fn), 'utf-8', newline='\n')
(H.parent / old).unlink(missing_ok=True)
it.update({'file': fn, 'sha256': sh, 'bytes': len(b), 'status': 'replaced-pending-review'})
(H / 'audio-manifest.json').write_text(json.dumps(man, ensure_ascii=False, indent=1), 'utf-8')
print('✓ استُبدل', bid, '←', fn, '| بقية الأصوات لم تُمسّ.')
