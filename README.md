# Chart Trends

Billboard JAPANのチャートデータを可視化する静的サイトです。

## ファイル構成

- `index.html`: 公開サイト本体。初期表示とUIを担当します。
- `data/manifest.js`: 表示範囲・チャートとデータファイルの対応表です。
- `data/*.js`: ボーイズ、ガールズ、K-POP、全アーティストの各チャートデータです。
- `billboard_output/billboard_*_2017_entries.csv` ～ `billboard_*_2025_entries.csv`: 再取得しない確定済みの週次データです。
- `billboard_output/billboard_*_2026_entries.csv`: 差分更新の基準になる2026年の週次データです。
- `girls_group_artists_wikipedia.json` / `korean_idol_groups_wikipedia.json`: 集計対象アーティストの定義です。
- `billboard_boys_group_complete.py`: データ収集、集計、HTML・データファイル生成を行います。
- `.nojekyll`: GitHub PagesでJekyll処理を使わず静的ファイルをそのまま配信します。

## 更新方法

`billboard_boys_group_complete.py`を実行すると、2017～2025年は確定CSVを読み込み、2026年はCSVにまだ存在しない週だけを取得します。生成された`preview.html`を`index.html`として配置し、`data/`と`billboard_output/`の更新をコミットすると公開サイトへ反映できます。

## 公開URL

https://zero-project0.github.io/chart-analysis/
