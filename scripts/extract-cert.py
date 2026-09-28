import argparse
import re
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description='Extract certificate HTML and JavaScript from a generator page.')
    parser.add_argument('source_html', type=Path, help='Path to the certificate generator HTML file')
    parser.add_argument('--html-output', type=Path, default=Path(__file__).with_name('cert-html-extract.txt'))
    parser.add_argument('--js-output', type=Path, default=Path(__file__).with_name('cert-js-extract.txt'))
    args = parser.parse_args()

    text = args.source_html.read_text(encoding='utf-8')
    start = text.find('<div class="certificate"')
    script_start = text.find('<script>')
    if start < 0 or script_start < 0 or script_start < start:
        raise SystemExit('certificate container or script tag was not found')

    chunk = text[start:script_start]

    def truncate_data_uri(match: re.Match[str]) -> str:
        return match.group(0)[:80] + '...TRUNC...'

    args.html_output.write_text(
        re.sub(r'data:image/[^"\']+', truncate_data_uri, chunk), encoding='utf-8'
    )
    script = text[script_start:script_start + 8000]
    args.js_output.write_text(script, encoding='utf-8')
    print(f'Wrote {args.html_output} and {args.js_output}')


if __name__ == '__main__':
    main()
