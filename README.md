# Chart Trends

Billboard JAPANのチャートデータを可視化する静的サイトです。

## ファイル構成

- `index.html`: 公開サイト本体。初期表示とUIを担当します。
- `data/manifest.js`: 表示範囲・チャートとデータファイルの対応表です。
- `data/*.js`: ボーイズ、ガールズ、K-POP、全アーティストの各チャートデータです。
- `billboard_boys_group_complete.py`: データ収集、集計、HTML・データファイル生成を行います。
- `.nojekyll`: GitHub PagesでJekyll処理を使わず静的ファイルをそのまま配信します。

## 公開URL

https://zero-project0.github.io/chart-trends/
