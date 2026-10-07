import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).parent / 'records'
data = json.loads((OUT / 'rankings.json').read_text(encoding='utf-8'))
FONTS = Path(r'C:\Windows\Fonts')
BG = '#f5f3ee'
INK = '#202520'
MUTED = '#626960'
RULE = '#d9ddd5'
BAR = '#a9b0a7'

def font(size, bold=False, numeric=False):
    filename = 'arialbd.ttf' if numeric and bold else 'arial.ttf' if numeric else 'meiryob.ttc' if bold else 'meiryo.ttc'
    return ImageFont.truetype(str(FONTS / filename), size)

def text(draw, xy, value, size, fill=INK, bold=False, numeric=False, anchor='lt'):
    f = font(size, bold, numeric)
    draw.text(xy, value, font=f, fill=fill, anchor=anchor)
    return draw.textlength(value, font=f)

def fitted(draw, xy, value, maximum, initial, minimum=24, fill=INK, bold=False):
    size = initial
    while size > minimum and draw.textlength(value, font=font(size, bold)) > maximum:
        size -= 1
    assert draw.textlength(value, font=font(size, bold)) <= maximum, (value, size)
    text(draw, xy, value, size, fill, bold)
    return size

def period(day):
    return day.replace('-', '.')

configs = {
    'hot100': ('Hot 100', '#326d52', '総合ソングチャート'),
    'stsongs': ('Streaming Songs', '#1c6989', 'ストリーミングチャート'),
    'dlsongs': ('Download Songs', '#a65030', 'ダウンロードチャート'),
}
checks = {}
for code, chart in data.items():
    name, accent, subname = configs[code]
    rows = chart['displayed']
    W = 1800
    row_h = 84 if len(rows) == 20 else 76
    row_start = 390
    footer_y = row_start + len(rows) * row_h + 26
    H = max(2250, footer_y + 170)
    im = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(im)
    d.rectangle((90, 66, 99, 113), fill=accent)
    text(d, (125, 74), 'BILLBOARD JAPAN', 27, bold=True, numeric=True)
    text(d, (1710, 74), period(chart['last']) + ' 公開分まで', 27, MUTED, anchor='rt')
    text(d, (88, 128), 'TOP10 連続記録', 82, bold=True)
    text(d, (94, 248), name, 42, bold=True, numeric=True)
    text(d, (1710, 260), '歴代上位20位' + ('（同順位を含む）' if len(rows) > 20 else ''), 28, anchor='rt')
    if any(r['ongoing'] for r in rows):
        d.ellipse((1306, 311, 1321, 326), fill=accent)
        text(d, (1340, 302), f"{int(chart['last'][5:7])}/{int(chart['last'][8:10])}時点で継続中", 25, accent)
    d.line((90, 340, 1710, 340), fill=INK, width=2)
    text(d, (90, 356), '順位', 22, MUTED)
    text(d, (207, 356), '曲名 / アーティスト', 22, MUTED)
    text(d, (1710, 355), '連続週数', 22, MUTED, anchor='rt')

    max_weeks = max(r['weeks'] for r in rows)
    axis_max = math.ceil(max_weeks / 10) * 10
    bar_x = 958
    bar_w = 600
    label_sizes = []
    for i, r in enumerate(rows):
        y = row_start + i * row_h
        if i == 0:
            d.rectangle((90, y - 4, 1710, y + row_h - 2), fill='#e9ece4')
        d.line((90, y + row_h - 2, 1710, y + row_h - 2), fill=RULE, width=1)
        text(d, (92, y + 18), f"{r['rank']:02d}", 34, INK if i < 3 else MUTED, bold=True, numeric=True)
        size = fitted(d, (207, y + 1), r['title'], 687, 35, 25, bold=True)
        label_sizes.append(size)
        fitted(d, (209, y + 43), r['artist'], 680, 25, 22, fill=MUTED)
        p = period(r['start']) + ' — ' + period(r['end'])
        text(d, (958, y + 46), p, 21, MUTED, numeric=True)
        length = bar_w * r['weeks'] / axis_max
        d.rectangle((bar_x, y + 12, bar_x + bar_w, y + 37), fill='#e4e7df')
        color = accent if r['ongoing'] else INK if i < 3 else BAR
        d.rectangle((bar_x, y + 12, bar_x + length, y + 37), fill=color)
        if r['ongoing']:
            d.ellipse((bar_x + length - 15, y + 9, bar_x + length + 15, y + 40), fill=accent)
        text(d, (1690, y - 2), str(r['weeks']), 49, color if r['ongoing'] else INK, bold=True, numeric=True, anchor='rt')
        text(d, (1697, y + 48), '週', 20, MUTED, anchor='rt')

    d.line((90, footer_y, 1710, footer_y), fill=INK, width=2)
    text(d, (94, footer_y + 18), '各曲の最長連続記録。TOP10圏外で途切れる。同週数は同順位。', 22, MUTED)
    starts = f"収録期間 {period(chart['first'])} — {period(chart['last'])}"
    text(d, (94, footer_y + 53), starts, 21, MUTED)
    text(d, (94, footer_y + 87), '出典：Billboard JAPAN / ' + period(chart['last']) + ' 公開分反映', 20, MUTED)
    if any(r['begins_at_chart_start'] for r in rows):
        text(d, (94, footer_y + 120), '「打上花火」はチャート公開開始週からの記録。', 19, MUTED)
    else:
        text(d, (1710, footer_y + 121), 'zero-project0.github.io/chart-analysis', 18, MUTED, numeric=True, anchor='rt')
    filename = f"{code}-top10-consecutive-{chart['last'].replace('-', '')}.png"
    im.save(OUT / filename, optimize=True)
    im.resize((900, H // 2), Image.Resampling.LANCZOS).save(OUT / f'{code}-preview.png')
    checks[code] = dict(width=W, height=H, rows=len(rows), minimum_title_font=min(label_sizes), ongoing=[r['title'] for r in rows if r['ongoing']])
    print(filename, checks[code], flush=True)
(OUT / 'visual-checks.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2), encoding='utf-8')
