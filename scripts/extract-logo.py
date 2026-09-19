from pathlib import Path
import re, base64
p = Path(r'c:\Users\mkiru\Downloads\elysium-academy-admin-dashboard\ttk\ThoorigAI_Official_Certificate_Generator (1).html')
text = p.read_text(encoding='utf-8')
m = re.search(r'src="(data:image/png;base64,[^"]+)"', text[text.find('<div class="certificate"'):])
if not m:
    raise SystemExit('logo not found')
data = m.group(1).split(',', 1)[1]
raw = base64.b64decode(data)
out = Path(r'c:\Users\mkiru\Downloads\elysium-academy-admin-dashboard\public\thoorigai-logo.png')
out.write_bytes(raw)
print('wrote', out, 'bytes', len(raw))
