/* Use the same period controls in comparison charts and their shared images. */
const comparisonYearSelect = document.getElementById("compareArtistYear");
comparisonYearSelect.insertAdjacentHTML("afterbegin", '<option value="all">全期間</option>');
document.getElementById("compareSongPeriod").setAttribute("aria-label", "比較する集計期間");
document.querySelector('[data-compare-period="current"]').innerHTML = '今年（<span id="compareCurrentYear">'+compareCurrentYear()+'</span>年）';
const comparisonPeriodStyle = document.createElement("style");
comparisonPeriodStyle.textContent = '.share-dialog.comparison-share #sharePeriodPicker{display:flex}.compare-toolbar [hidden]{display:none!important}.compare-axis-button:focus-visible{outline:3px solid #0072b2;outline-offset:3px}';
document.head.append(comparisonPeriodStyle);
let comparisonAllTrend = null, comparisonShareRevision = 0;

function comparisonPeriodValue() {
    return compareType === "artist" ? (compareArtistYear === "all" ? "all" : compareArtistYear === compareCurrentYear() ? "current" : "year") : compareSongPeriod;
}
function comparisonPeriodLabel() {
    return compareType === "artist" ? (compareArtistYear === "all" ? "全期間" : compareArtistYear + "年") : compareSongPeriod === "current" && compareSongAxis === "calendar" ? compareCurrentYear() + "年" : "全期間";
}
const syncComparePeriodBase = syncCompareControls;
syncCompareControls = () => {
    syncComparePeriodBase();
    document.getElementById("compareSongPeriod").hidden = compareType === "song" && compareSongAxis !== "calendar";
    document.querySelectorAll("[data-compare-period]").forEach(button => {
        const selected = button.dataset.comparePeriod === comparisonPeriodValue();
        button.classList.toggle("active", selected);
        button.setAttribute("aria-pressed", String(selected));
    });
    comparisonYearSelect.value = compareArtistYear;
};
function setComparisonPeriod(period) {
    if (compareType === "artist") {
        compareArtistYear = period === "all" ? "all" : compareCurrentYear();
        comparisonYearSelect.value = compareArtistYear;
    } else {
        compareSongPeriod = period;
        compareSongAxis = "calendar";
    }
    syncCompareControls();
}
compareDialog.addEventListener("click", event => {
    const button = event.target.closest("[data-compare-period]");
    if (!button || compareType !== "artist") return;
    event.stopImmediatePropagation();
    setComparisonPeriod(button.dataset.comparePeriod);
    renderComparison().catch(showDataError);
}, true);
comparisonYearSelect.addEventListener("change", syncCompareControls);

function comparisonAllArtistSeries(records) {
    const dates = [...new Set(records.flatMap(record => Object.values(record.source?.data.publicationDates || {}).flat()))].sort();
    return {dates, series: records.map(record => {
        const counts = new Map();
        (record.source?.artist.allSongs || record.source?.artist.songs || []).forEach(song =>
            (song.allTimeHistory || song.history || []).forEach(point => counts.set(point.date, (counts.get(point.date) || 0) + 1)));
        let total = 0;
        return {label: record.item.name, values: dates.map(date => total += counts.get(date) || 0)};
    })};
}
function drawAllArtistLabels(context, series, box, maximum) {
    const labels = series.map((item, index) => ({label: item.label, index, value: item.values.at(-1) || 0}))
        .map(item => ({...item, y: box.top + (box.height - box.top - box.bottom) * (1 - item.value / maximum)})).sort((a,b) => a.y-b.y);
    labels.forEach((item,index) => { item.labelY = Math.max(item.y, index ? labels[index-1].labelY + 26 : box.top + 13); });
    const overflow = (labels.at(-1)?.labelY || 0) - (box.height - box.bottom - 13);
    if (overflow > 0) labels.forEach(item => { item.labelY -= overflow; });
    context.save(); context.font = '900 11px Arial,"Yu Gothic UI",sans-serif'; context.textBaseline = "middle";
    labels.forEach(item => {
        const text = clipCanvasText(context, item.label, 142), width = context.measureText(text).width + 16,
            x = box.width - box.right - width - 12, y = Math.max(box.top + 13, item.labelY), color = compareColors[item.index];
        context.strokeStyle = color; context.lineWidth = 2;
        context.beginPath(); context.moveTo(box.width-box.right,item.y); context.lineTo(x+width,y); context.stroke();
        context.fillStyle = "rgba(255,255,255,.94)";
        context.beginPath(); context.roundRect(x,y-11,width,22,7); context.fill(); context.stroke();
        context.fillStyle = "#111"; context.textAlign = "left"; context.fillText(text,x+8,y+1);
    });
    context.restore();
}
const drawArtistComparisonPeriodBase = drawArtistComparison;
drawArtistComparison = records => {
    comparisonAllTrend = null;
    document.getElementById("compareTooltip")?.setAttribute("hidden", "");
    if (compareArtistYear !== "all") return drawArtistComparisonPeriodBase(records);
    activeCompareHover = null;
    if (!records.length) { drawCompareEmpty("比較するアーティストを追加してください"); return; }
    const {dates, series} = comparisonAllArtistSeries(records);
    if (!dates.length) { drawCompareEmpty("このチャートに集計データがありません"); return; }
    const box = setupCompareCanvas(), {context,width,height,left,right,top,bottom} = box,
        graphWidth = width-left-right, graphHeight = height-top-bottom,
        maximum = Math.max(10, Math.ceil(Math.max(0,...series.map(item => item.values.at(-1)||0))/10)*10),
        start = Date.parse(dates[0]), span = Math.max(1,Date.parse(dates.at(-1))-start),
        xFor = date => left+(Date.parse(date)-start)/span*graphWidth;
    context.font = "11px sans-serif"; context.lineWidth = 1;
    for (let step=0; step<=4; step++) {
        const value=maximum*step/4, y=top+graphHeight*(1-value/maximum);
        context.strokeStyle="rgba(18,18,18,.12)"; context.beginPath(); context.moveTo(left,y); context.lineTo(width-right,y); context.stroke();
        context.fillStyle="#666"; context.textAlign="right"; context.textBaseline="middle"; context.fillText(String(Math.round(value)),left-8,y);
    }
    for (let step=0; step<=4; step++) {
        const time=start+span*step/4;
        context.fillStyle="#666"; context.textAlign=step===0?"left":step===4?"right":"center"; context.textBaseline="top";
        context.fillText(new Date(time).toISOString().slice(0,7).replace("-","/"),left+graphWidth*step/4,height-bottom+12);
    }
    series.forEach((item,index) => {
        context.beginPath(); item.values.forEach((value,i) => {
            const x=xFor(dates[i]), y=top+graphHeight*(1-value/maximum);
            i?context.lineTo(x,y):context.moveTo(x,y);
        });
        context.strokeStyle=compareColors[index]; context.lineWidth=3; context.lineJoin="round"; context.stroke();
        drawCompareEndpoint(context,xFor(dates.at(-1)),top+graphHeight*(1-(item.values.at(-1)||0)/maximum),compareColors[index]);
    });
    drawAllArtistLabels(context,series,box,maximum);
    comparisonAllTrend = {dates,series,start,span,left,right};
    box.canvas.setAttribute("aria-label","全期間のアーティスト累積登場数比較");
    document.getElementById("compareLegend").innerHTML = series.map((item,i) => `<span><i style="background:${compareColors[i]}"></i><span class="compare-series-text">${esc(item.label)}<small>${esc(chartLabel(compareChart))}・全期間</small></span></span>`).join("");
    document.getElementById("compareSummary").innerHTML = series.map((item,i) => `<div class="compare-summary-card" style="border-top:4px solid ${compareColors[i]}"><strong>${esc(item.label)}</strong><span>全期間 累積 ${item.values.at(-1)||0}回<br>${dates[0]}〜${dates.at(-1)}</span></div>`).join("");
};
const drawSongComparisonPeriodBase = drawSongComparison;
drawSongComparison = records => { comparisonAllTrend=null; return drawSongComparisonPeriodBase(records); };
function showAllArtistComparisonTooltip(event) {
    if (compareType!=="artist" || compareArtistYear!=="all" || !comparisonAllTrend) return;
    event.stopImmediatePropagation();
    const canvas=document.getElementById("compareCanvas"), data=comparisonAllTrend, rect=canvas.getBoundingClientRect(),
        fraction=Math.max(0,Math.min(1,(event.clientX-rect.left-data.left)/(canvas.clientWidth-data.left-data.right))), target=data.start+fraction*data.span;
    let nearest=0;
    data.dates.forEach((date,i) => { if (Math.abs(Date.parse(date)-target)<Math.abs(Date.parse(data.dates[nearest])-target)) nearest=i; });
    const tooltip=ensureChartTooltip(canvas.parentElement,"compareTooltip");
    tooltip.innerHTML=`<div class="chart-tooltip-title">${esc(data.dates[nearest])}</div>`+data.series.map((item,i)=>`<div class="chart-tooltip-row"><span><i class="chart-tooltip-dot" style="background:${compareColors[i]}"></i>${esc(item.label)}</span><strong>${item.values[nearest]}回</strong></div>`).join("");
    tooltip.hidden=false; tooltip.style.left=Math.max(8,event.clientX-rect.left+14)+"px"; tooltip.style.top="12px"; keepCompareTooltipVisible();
}
document.getElementById("compareCanvas").addEventListener("pointermove",showAllArtistComparisonTooltip,true);
document.getElementById("compareCanvas").addEventListener("pointerdown",showAllArtistComparisonTooltip,true);

function syncComparisonSharePeriod() {
    sharePeriodPicker.querySelectorAll("[data-share-period]").forEach(button => {
        const active=button.dataset.sharePeriod===comparisonPeriodValue();
        button.classList.toggle("active",active); button.setAttribute("aria-pressed",String(active));
        if (button.dataset.sharePeriod==="current") button.textContent="今年（"+compareCurrentYear()+"年）";
    });
    document.querySelector("#shareDialog .share-copy").textContent="全期間・今年を選ぶと、比較グラフと共有画像の期間が切り替わります。表示中："+comparisonPeriodLabel()+"。";
}
const buildComparisonSharePeriodBase = buildComparisonShareImage;
buildComparisonShareImage = () => {
    const output=buildComparisonSharePeriodBase(), context=output.getContext("2d");
    context.fillStyle="#fffdf8"; context.fillRect(650,88,510,42);
    context.fillStyle="#666"; context.font='700 17px Arial,"Yu Gothic UI",sans-serif'; context.textAlign="right"; context.textBaseline="alphabetic";
    context.fillText(chartLabel(compareChart)+"・"+comparisonPeriodLabel()+(compareType==="song"?"・"+(compareSongAxis==="calendar"?"実際の日付":"初登場からの週数"):""),1148,116);
    return output;
};
async function refreshComparisonShare() {
    const revision=++comparisonShareRevision, dialog=document.getElementById("shareDialog");
    let ready=false;
    document.querySelectorAll("#shareDialog .share-action").forEach(button=>{button.disabled=true;});
    syncComparisonSharePeriod(); setShareStatus("比較画像を作成しています…");
    try {
        await renderComparison();
        if (revision!==comparisonShareRevision || !dialog.open || currentShareTarget?.type!=="comparison") return;
        const image=buildComparisonShareImage(), preview=document.getElementById("shareCard");
        preview.width=image.width; preview.height=image.height; preview.getContext("2d").drawImage(image,0,0);
        ready=true;
        setShareStatus("");
    } catch(error) { if(revision===comparisonShareRevision)setShareStatus("比較画像を作成できませんでした。期間を選び直してください。","error"); }
    finally { if(revision===comparisonShareRevision)document.querySelectorAll("#shareDialog .share-action").forEach(button=>{button.disabled=!ready;}); }
}
document.getElementById("shareComparison").addEventListener("click",event=>{
    event.stopImmediatePropagation();
    if(!compareItems[compareType].length)return;
    currentShareTarget={type:"comparison",comparisonType:compareType};
    const dialog=document.getElementById("shareDialog"); dialog.classList.add("comparison-share");
    document.getElementById("shareKind").textContent="SHARE COMPARISON";
    document.getElementById("shareTitle").textContent=compareType==="artist"?"アーティスト比較を共有":"楽曲比較を共有";
    if(!dialog.open)dialog.showModal(); refreshComparisonShare();
},true);
sharePeriodPicker.addEventListener("click",event=>{
    const button=event.target.closest("[data-share-period]");
    if(!button || currentShareTarget?.type!=="comparison")return;
    event.stopImmediatePropagation(); setComparisonPeriod(button.dataset.sharePeriod); refreshComparisonShare();
},true);
document.getElementById("shareDialog").addEventListener("close",()=>{
    comparisonShareRevision++;
    document.querySelectorAll("#shareDialog .share-action").forEach(button=>{button.disabled=false;});
});
// Older links are restored by the original page before this extension has loaded.
if(new URLSearchParams(location.hash.slice(1)).get("compareYear")==="all"){
    compareArtistYear="all"; comparisonYearSelect.value="all";
    if(compareDialog.open)renderComparison().catch(showDataError);
}
syncCompareControls();
