from pathlib import Path
import re
p = Path(r'c:\Users\mkiru\Downloads\elysium-academy-admin-dashboard\ttk\ThoorigAI_Official_Certificate_Generator (1).html')
text = p.read_text(encoding='utf-8')
i = text.find('<div class="certificate"')
j = text.find('<script>')
chunk = text[i:j]
# keep first 120 chars of each data uri so we know mime
def trunc(m):
    s = m.group(0)
    return s[:80] + '...TRUNC...'
chunk2 = re.sub(r'data:image/[^"\']+', trunc, chunk)
out = Path(r'c:\Users\mkiru\Downloads\elysium-academy-admin-dashboard\scripts\cert-html-extract.txt')
out.write_text(chunk2, encoding='utf-8')
print('wrote', out, 'len', len(chunk2))
# extract first img src fully to a file if png
imgs = re.findall(r'src="(data:image/[^"]+)"', chunk)
print('img count', len(imgs))
for n, src in enumerate(imgs):
    print('img', n, 'mime prefix', src[:40], 'len', len(src))
js = text[j:j+8000]
Path(r'c:\Users\mkiru\Downloads\elysium-academy-admin-dashboard\scripts\cert-js-extract.txt').write_text(js, encoding='utf-8')
print('js len', len(js))
