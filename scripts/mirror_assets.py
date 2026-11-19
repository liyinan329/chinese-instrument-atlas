"""Copy a verified public release into a self-contained Pages artifact."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import quote
import hashlib, json, shutil, time

ORIGIN = 'https://guoyue-gongfang.foggyape.chatgpt.site/'
DEST = Path('_site')
DEST.mkdir(exist_ok=True)
shutil.copy2('index.html', DEST / 'index.html')
manifest = json.loads(Path('assets-manifest.json').read_text())

def fetch(item):
    relative = Path(item['path'])
    if relative.is_absolute() or '..' in relative.parts:
        raise ValueError('Unsafe asset path')
    target = DEST / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(3):
        try:
            request = Request(ORIGIN + quote(item['path']), headers={'User-Agent': 'Guoyue-Gongfang-Release/1.0'})
            with urlopen(request, timeout=45) as response:
                data = response.read()
            if hashlib.sha256(data).hexdigest() != item['sha256']:
                raise ValueError('Release checksum mismatch: ' + item['path'])
            if relative.suffix in ('.html', '.mjs', '.js', '.json', '.txt', '.md'):
                data = data.decode('utf-8').replace('中国民族乐器法交互平台', '中国民族乐器法交互学习平台').encode('utf-8')
            target.write_bytes(data)
            return len(data)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))

with ThreadPoolExecutor(max_workers=6) as executor:
    sizes = list(executor.map(fetch, manifest))
# Overlay reviewed module-only updates; keep the pinned v0.22 title and release shell.
for item in json.loads(Path('overrides/manifest.json').read_text()):
    relative = Path(item['path'])
    if relative.is_absolute() or '..' in relative.parts:
        raise ValueError('Unsafe overlay path')
    data = (Path('overrides') / relative).read_bytes()
    if hashlib.sha256(data).hexdigest() != item['sha256']:
        raise ValueError('Overlay checksum mismatch: ' + item['path'])
    target = DEST / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
(DEST / '.nojekyll').touch()
print(f'Verified {len(sizes)} assets, {sum(sizes)} bytes. No runtime dependency on the source host.')
