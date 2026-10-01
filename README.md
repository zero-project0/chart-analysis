# Chart Analysis

Billboard JAPANのチャートデータを可視化する静的サイトです。

## 収録期間と品質

- Hot 100：2008/1/16公開分から。
- Streaming Songs / Download Songs：2017/10/4公開分から。
- 2026/9/30公開分まで収録。2026/10/1に公開日・重複・欠損を再検証しました。
- Download 2020/3/18は公式資料で確認できた68曲を収録。TOP10は全曲確認済みですが、全順位は未完了です。
- Hot 100の年末年始7週は公式アーカイブに掲載がなく、休載か欠損か未確定です。
- 詳細と出典は `data-quality.html`、機械可読な収録状況は `data-quality.json`、補完行の出典は `verified-recoveries.json` に記録しています。

## ファイル構成

- `index.html`：公開画面。
- `data/manifest.js` と `data/*.js`：4範囲・3指標の集計データ。実際の公開日一覧を `publicationDates` に含みます。
- `billboard_output/billboard_*_entries.csv`：公式出典URLを保持した週次データ。
- `billboard_output/collection_report_2008_2026.csv`：全収録期間の取得・未確認状況。
- `records/`：修正後のTOP10連続記録、全順位CSV、PNG画像。
- `chart_integrity.py`：日付、出典URL、重複、既知の一部欠損を検証します。
- `billboard_boys_group_complete.py`：差分取得と再集計。確定CSVも検証してから再利用します。
- `rebuild-data.py`：保存済みCSVから全期間のサイト用データを再生成します。
- `calculate-top10-streaks.py`：同じCSVから3指標のTOP10連続記録を再計算します。

## 更新方法

Pythonと `requirements.txt` の依存パッケージを用意し、`python billboard_boys_group_complete.py` を実行します。最新年は未取得週だけ取得し、過去年は検証済みCSVを再利用します。取得を伴わない再集計は `python rebuild-data.py`、連続記録は `python calculate-top10-streaks.py` です。

日付はチャートページに記載された公開日です。通常のアーカイブURLには公開日の5日後を指定し、2013/11/26の火曜日公開も実日付を保持します。同順位の別曲を削除せず、同一曲の二重掲載を除外します。補完行は `verified-recoveries.json` の出典と照合します。

生成した `data/`、CSV、品質情報、記録ファイルを反映してください。画面を作り替えているコピー版では、`index.html` を上書きせずデータを更新します。未確認データを推測で埋めたり、完全収録として扱ったりしないでください。

## 公開URL

https://zero-project0.github.io/chart-analysis/
