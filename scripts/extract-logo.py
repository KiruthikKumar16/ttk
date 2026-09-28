import argparse
import base64
import re
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description='Extract the embedded certificate logo as a PNG.')
    parser.add_argument('source_html', type=Path, help='Path to the certificate generator HTML file')
    parser.add_argument('--output', type=Path, default=Path(__file__).parents[1] / 'public' / 'thoorigai-logo.png')
    args = parser.parse_args()

    text = args.source_html.read_text(encoding='utf-8')
    certificate_start = text.find('<div class="certificate"')
    if certificate_start < 0:
        raise SystemExit('certificate container was not found')
    match = re.search(r'src="data:image/png;base64,([^"]+)"', text[certificate_start:])
    if not match:
        raise SystemExit('embedded PNG logo was not found')

    args.output.write_bytes(base64.b64decode(match.group(1)))
    print(f'Wrote {args.output} ({args.output.stat().st_size} bytes)')


if __name__ == '__main__':
    main()
