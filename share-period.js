/* Shared-image periods use the selected detail chart, independently of the page. */
let sharePeriod = "current", shareDetailScope = "boys", shareChartRevision = 0;
const sharePeriodPicker = document.createElement("div");
sharePeriodPicker.id = "sharePeriodPicker";
sharePeriodPicker.className = "share-chart-picker";
sharePeriodPicker.setAttribute("role", "group");
sharePeriodPicker.setAttribute("aria-label", "共有する集計期間");
sharePeriodPicker.innerHTML = '<button class="share-chart-button" type="button" data-share-period="recent" hidden>直近3年</button><button class="share-chart-button" type="button" data-share-period="all">全期間</button><button class="share-chart-button" type="button" data-share-period="current">今年</button>';
document.getElementById("shareViewPicker").after(sharePeriodPicker);
const periodStyle = document.createElement("style");
periodStyle.textContent = '.comparison-share #sharePeriodPicker{display:none}#sharePeriodPicker button:focus-visible{outline:3px solid #0072b2;outline-offset:3px}';
document.head.append(periodStyle);

function shareDashboard() { return dashboards[shareDetailScope]?.[artistShareChartCode]; }
function shareYear() { return String(shareDashboard()?.latestDate || dashboard.latestDate).slice(0, 4); }
function sharePeriodLabel() { return sharePeriod === "recent" ? (Number(shareYear())-2)+"〜"+shareYear()+"年" : sharePeriod === "all" ? "全期間" : shareYear() + "年"; }
function shareHistory(song) {
    return [...(song.allTimeHistory || song.history || [])]
        .filter(point => sharePeriod === "all" || (sharePeriod === "recent" ? Number(String(point.date).slice(0,4)) >= Number(shareYear())-2 && Number(String(point.date).slice(0,4)) <= Number(shareYear()) : String(point.date).startsWith(shareYear())))
        .sort((a, b) => a.date.localeCompare(b.date));
}
function shareSongMetrics(song) {
    const history = shareHistory(song);
    return {...song, history, appearances: history.length, weeks: new Set(history.map(p => p.date)).size,
        best: history.length ? Math.min(...history.map(p => p.rank)) : null,
        top10: history.filter(p => p.rank <= 10).length,
        latestRank: history.at(-1)?.date === shareDashboard()?.latestDate ? history.at(-1).rank : null};
}
function shareArtistMetrics(artist) {
    const songs = (artist.allSongs || artist.songs || []).map(shareSongMetrics)
        .filter(song => song.history.length).sort((a, b) => b.appearances - a.appearances || a.title.localeCompare(b.title, "ja"));
    const history = songs.flatMap(song => song.history);
    return {...artist, songs, appearances: history.length, weeks: new Set(history.map(p => p.date)).size,
        top10: history.filter(p => p.rank <= 10).length,
        best: history.length ? Math.min(...history.map(p => p.rank)) : null};
}
function syncSharePeriods() {
    sharePeriodPicker.querySelectorAll("[data-share-period]").forEach(button => {
        button.hidden = button.dataset.sharePeriod === "recent" && currentShareTarget?.type !== "artist";
        const active = button.dataset.sharePeriod === sharePeriod;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
        if (button.dataset.sharePeriod === "current") button.textContent = "今年（" + shareYear() + "年）";
    });
    document.querySelectorAll("[data-share-view]").forEach(button => button.setAttribute("aria-selected", String(button.dataset.shareView === shareViewMode)));
    document.querySelectorAll("[data-share-chart]").forEach(button => {
        const active = button.dataset.shareChart === artistShareChartCode;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
    });
}
function beginPeriodShare(type) {
    const dialog = document.getElementById("shareDialog");
    if (!dialog.open) {
        shareDetailScope = type === "artist" ? detailScopeCode : songDetailScopeCode;
        artistShareChartCode = type === "artist" ? detailChartCode : songDetailChartCode;
        sharePeriod = type === "artist" ? "recent" : "current";
        shareViewMode = type === "artist" ? "graph" : "summary";
    }
    document.getElementById("shareChartPicker").hidden = false;
    document.querySelector("#shareDialog .share-copy").textContent = "全期間・今年を選ぶと、概要の数値とグラフの集計期間が切り替わります。対象チャートも変更できます。";
    syncShareViewPicker();
    syncSharePeriods();
}
function sharePeriodFooter(context) {
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    context.fillStyle = "#fffdf8";
    context.fillRect(48, 568, 1104, 30);
    context.fillStyle = "#70685f";
    context.font = `700 16px ${shareCanvasFont}`;
    context.fillText(sharePeriodLabel() + "集計  ・  " + shareDashboard().chartName + "  ・  " + shareDashboard().latestDate + " 公開分まで", 64, 590);
}
function drawPeriodCumulative(context, artist) {
    const counts = new Map();
    artist.songs.forEach(song => song.history.forEach(point => counts.set(point.date, (counts.get(point.date) || 0) + 1)));
    const source = shareDashboard();
    const dates = [...new Set(Object.values(source.publicationDates || {}).flat())]
        .filter(date => sharePeriod === "all" || date.startsWith(shareYear())).sort();
    let total = 0;
    const history = dates.map(date => ({date, rank: 1, value: total += counts.get(date) || 0}));
    const area = graphArea(context, artist.artist, source.chartName + "  /  " + sharePeriodLabel() + "の累積登場数");
    context.fillStyle = "#f3eee4";
    context.fillRect(area.x, area.y, area.width, area.height);
    const maximum = Math.max(10, Math.ceil(total / 10) * 10);
    context.font = `700 14px ${shareCanvasFont}`;
    context.textAlign = "right";
    for (let step = 0; step <= 4; step++) {
        const value = Math.round(maximum * step / 4), y = area.y + area.height * (1 - value / maximum);
        context.strokeStyle = "#d8cfc2";
        context.lineWidth = 1;
        context.beginPath(); context.moveTo(area.x, y); context.lineTo(area.x + area.width, y); context.stroke();
        context.fillStyle = "#70685f"; context.fillText(String(value), area.x - 12, y + 5);
    }
    const start = Date.parse(dates[0]), span = Math.max(1, Date.parse(dates.at(-1)) - start);
    context.beginPath();
    history.forEach((point, index) => {
        const x = area.x + (Date.parse(point.date) - start) / span * area.width, y = area.y + area.height * (1 - point.value / maximum);
        if (!index) context.moveTo(x, y); else context.lineTo(x, y);
    });
    context.strokeStyle = "#0072b2"; context.lineWidth = 5; context.lineJoin = "round"; context.stroke();
    context.font = `900 20px ${shareCanvasFont}`; context.fillStyle = "#0072b2";
    context.fillText(total + "回", area.x + area.width - 8, Math.max(area.y + 24, area.y + area.height * (1 - total / maximum) - 12));
    context.font = `700 15px ${shareCanvasFont}`; context.fillStyle = "#70685f";
    context.textAlign = "left"; context.fillText(dates[0] || "データなし", area.x, 545);
    context.textAlign = "right"; context.fillText(dates.at(-1) || "", area.x + area.width, 545);
}

drawArtistShareCard = artist => {
    beginPeriodShare("artist");
    const source = shareDashboard(), selected = source.artistDetails.find(item => item.artist === artist.artist) || emptyArtistDetail(artist.artist);
    currentShareTarget = {type: "artist", data: selected};
    syncSharePeriods();
    document.querySelector("#shareDialog .share-copy").textContent = "直近3年は年ごとの累積推移を重ねて表示します。全期間・今年にも切り替えられます。";
    document.getElementById("shareTitle").textContent = selected.artist + "を共有・" + sharePeriodLabel();
    const context = document.getElementById("shareCard").getContext("2d"), metrics = shareArtistMetrics(selected);
    drawShareFrame(context, shareViewMode === "graph" ? "ARTIST GRAPH" : "ARTIST PROFILE");
    if (shareViewMode === "graph") {
        if (sharePeriod === "recent") drawArtistGraphShare(context, selected, source);
        else drawPeriodCumulative(context, metrics);
    }
    else drawArtistShareSummary(context, metrics, source);
    sharePeriodFooter(context);
};
drawSongShareCard = song => {
    beginPeriodShare("song");
    const source = shareDashboard(), artist = source.artistDetails.find(item => item.artist === song.artist);
    const selected = (artist?.allSongs || artist?.songs || []).find(item => item.title === song.title) || {title: song.title, history: [], allTimeHistory: []};
    const metrics = shareSongMetrics({...selected, artist: song.artist});
    currentShareTarget = {type: "song", data: {...selected, artist: song.artist}};
    syncSharePeriods();
    document.getElementById("shareTitle").textContent = song.title + "を共有・" + sharePeriodLabel();
    const context = document.getElementById("shareCard").getContext("2d");
    drawShareFrame(context, shareViewMode === "graph" ? "SONG GRAPH" : "SONG PROFILE");
    if (shareViewMode === "graph") drawSongGraphShare(context, metrics);
    else drawSongShareSummary(context, metrics);
    // Existing song renderers read the main-page chart; replace their caption here.
    context.fillStyle = "#fffdf8"; context.fillRect(48, 164, 1104, 36);
    context.fillStyle = "#70685f"; context.font = `800 ${shareViewMode === "graph" ? 17 : 19}px ${shareCanvasFont}`;
    context.textAlign = "left";
    context.fillText(clipCanvasText(context, (shareViewMode === "graph" ? song.artist + "  /  " : "") + source.chartName + "  /  " + sharePeriodLabel(), 1072), 64, shareViewMode === "graph" ? 184 : 190);
    sharePeriodFooter(context);
};
function redrawPeriodShare() {
    if (currentShareTarget?.type === "artist") drawArtistShareCard(currentShareTarget.data);
    if (currentShareTarget?.type === "song") drawSongShareCard(currentShareTarget.data);
    setShareStatus("");
}
sharePeriodPicker.addEventListener("click", event => {
    const button = event.target.closest("[data-share-period]");
    if (!button || button.dataset.sharePeriod === sharePeriod) return;
    sharePeriod = button.dataset.sharePeriod;
    redrawPeriodShare();
});
document.getElementById("shareChartPicker").addEventListener("click", async event => {
    const button = event.target.closest("[data-share-chart]");
    if (!button || !["artist", "song"].includes(currentShareTarget?.type)) return;
    event.stopImmediatePropagation();
    const revision = ++shareChartRevision;
    try {
        await loadDashboard(shareDetailScope, button.dataset.shareChart);
        if (revision !== shareChartRevision || !document.getElementById("shareDialog").open) return;
        artistShareChartCode = button.dataset.shareChart;
        redrawPeriodShare();
    } catch (error) { setShareStatus("チャートを読み込めませんでした。再試行してください。", "error"); }
}, true);
document.getElementById("shareDialog").addEventListener("close", () => { shareChartRevision++; });

const sharePayloadPeriodBase = sharePayload;
sharePayload = () => {
    if (!["artist", "song"].includes(currentShareTarget?.type)) return sharePayloadPeriodBase();
    const item = currentShareTarget.data, isSong = currentShareTarget.type === "song";
    const params = new URLSearchParams({scope: shareDetailScope, chart: artistShareChartCode, sharePeriod, shareView: shareViewMode});
    if (isSong) { params.set("song", item.title); params.set("songArtist", item.artist); }
    else params.set("artist", item.artist);
    return {url: location.href.split("#")[0] + "#" + params.toString(),
        text: (isSong ? item.artist + "「" + item.title + "」" : item.artist) + "のBillboard JAPAN・" + sharePeriodLabel() + "のチャート推移をチェック",
        title: (isSong ? item.title + " / " : "") + item.artist + " | MUSIC CHART ANALYSIS",
        fileName: "chart-pulse-" + currentShareTarget.type + "-" + sharePeriod + ".png"};
};
async function restorePeriodShare() {
    const params = new URLSearchParams(location.hash.slice(1));
    if (!["all", "current", "recent"].includes(params.get("sharePeriod"))) return;
    const scope = params.get("scope"), code = params.get("chart"), artist = params.get("songArtist") || params.get("artist"), title = params.get("song");
    if (!artist || !dashboardManifest[dashboardKey(scope, code)]) return;
    if (title && params.get("sharePeriod") === "recent") return;
    try {
        await loadDashboard(scope, code);
        const selectedArtist = dashboards[scope][code].artistDetails.find(item => item.artist === artist);
        if (!selectedArtist) return;
        const selectedSong = title ? (selectedArtist.allSongs || selectedArtist.songs || []).find(item => item.title === title) : null;
        if (title && !selectedSong) return;
        resetShareDialogForDetail();
        shareDetailScope = scope; artistShareChartCode = code;
        sharePeriod = params.get("sharePeriod"); shareViewMode = params.get("shareView") === "graph" ? "graph" : "summary";
        document.getElementById("shareKind").textContent = title ? "SHARE SONG" : "SHARE ARTIST";
        document.getElementById("shareDialog").showModal();
        if (title) drawSongShareCard({...selectedSong, artist}); else drawArtistShareCard(selectedArtist);
    } catch (error) { setShareStatus("共有データを読み込めませんでした。再試行してください。", "error"); }
}
restorePeriodShare();
