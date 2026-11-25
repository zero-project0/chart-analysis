(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const norm = value => String(value).normalize('NFKC').toLowerCase().replace(/[〜～]/g, '~').replace(/\s/g, '');
  const chartCodes = ['hot100', 'stsongs'];
  const photos = new Map((window.ARTIST_PHOTOS || []).map(item => [norm(item.artist), item.image]));
  const jackets = new Map((window.SONG_JACKETS || []).filter(item => item.album)
    .map(item => [norm(item.artist) + '|' + norm(item.album), item.image]));
  const types = {SINGLE: 'シングル', EP: 'EP', ALBUM: 'アルバム', COMPILATION: 'コンピレーション'};
  const dashboards = new Map();
  const artwork = new Map();
  const params = new URLSearchParams(location.search);
  const canvas = $('reviewCanvas');
  const ctx = canvas.getContext('2d');
  let groups = [], calendar, selected, pages = [], listLimit = 40, revision = 0;
  $('reviewYear').value = params.get('year') === '2025' ? '2025' : '2026';

  async function json(path) {
    const response = await fetch(path, {cache: 'no-cache'});
    if (!response.ok) throw Error(path);
    return response.json();
  }

  function loadChart(scope, code) {
    const key = scope + '|' + code;
    if (!dashboards.has(key)) {
      const files = window.CHART_DATA_MANIFEST[key];
      const pending = files.reduce((chain, src) => chain.then(() => new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(Error(src));
        document.head.append(script);
      })), Promise.resolve()).then(() => window.CHART_DASHBOARDS[scope][code]);
      dashboards.set(key, pending.catch(error => {
        dashboards.delete(key);
        throw error;
      }));
    }
    return dashboards.get(key);
  }

  function image(src) {
    if (!src) return Promise.resolve(null);
    if (!artwork.has(src)) {
      artwork.set(src, new Promise(resolve => {
        const img = new Image();
        const timeout = setTimeout(() => resolve(null), 6000);
        const finish = result => { clearTimeout(timeout); resolve(result); };
        img.crossOrigin = 'anonymous';
        img.onload = () => finish(img);
        img.onerror = () => finish(null);
        img.src = src;
      }));
    }
    return artwork.get(src);
  }

  async function releaseCover(release) {
    const cover = /^https:\/\/i\.scdn\.co\/image\/[a-z0-9]+$/i.test(release.cover || '') ? release.cover : '';
    const local = release.groups.map(name => jackets.get(norm(name) + '|' + norm(release.title))).find(Boolean);
    return await image(cover) || image(local);
  }

  function renderList() {
    const query = norm($('reviewSearch').value);
    const matches = groups.filter(group => group.keys.some(key => key.includes(query)));
    $('reviewMatchCount').textContent = matches.length + '組';
    $('reviewGroups').replaceChildren(...matches.slice(0, listLimit).map(group => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = group.name;
      button.setAttribute('aria-pressed', String(group === selected));
      button.onclick = () => { $('reviewDirectory').open = false; selectGroup(group); };
      li.append(button);
      return li;
    }));
    $('reviewMore').hidden = matches.length <= listLimit;
  }

  function weekly(dashboard, group, year) {
    const artist = dashboard.artistDetails.find(row => norm(row.artist) === group.keys[0])
      || dashboard.artistDetails.find(row => group.keys.includes(norm(row.artist)));
    const cumulative = artist?.weeklyCumulative?.[year] || [];
    return new Map((dashboard.publicationDates[year] || []).map((date, index) => [
      date, Math.max(0, (cumulative[index] || 0) - (cumulative[index - 1] || 0))
    ]));
  }

  function paginate(releases, year) {
    const jan = year + '-01-01', jul = year + '-07-01', end = Number(year) + 1 + '-01-01';
    if (releases.length <= 20) return [{releases, start: jan, end, label: ''}];
    return [[jan, jul, '上半期'], [jul, end, '下半期']].flatMap(([start, endDate, label]) => {
      const items = releases.filter(row => row.date >= start && row.date < endDate);
      const count = Math.max(1, Math.ceil(items.length / 20));
      return Array.from({length: count}, (_, index) => ({
        releases: items.slice(index * 20, index * 20 + 20),
        start, end: endDate, label: count === 1 ? label : label + ' ' + (index + 1) + '/' + count
      }));
    });
  }

  async function selectGroup(group) {
    selected = group;
    const token = ++revision;
    const year = $('reviewYear').value;
    const query = new URLSearchParams({artist: group.name, scope: group.scope, year});
    history.replaceState(null, '', '?' + query);
    renderList();
    $('reviewResult').hidden = true;
    $('reviewStatus').textContent = group.name + 'の年間まとめを読み込み中…';
    try {
      const charts = await Promise.all(chartCodes.map(code => loadChart(group.scope, code)));
      if (token !== revision) return;
      const releases = calendar.releases.filter(row => row.date.startsWith(year)
        && row.groups.some(name => group.keys.includes(norm(name)))).sort((a, b) => a.date.localeCompare(b.date));
      const coverage = calendar.artists.find(row => group.keys.includes(norm(row.name)));
      pages = paginate(releases, year).map(page => ({
        ...page, group, year, releaseCount: releases.length, coverage,
        charts: charts.map(chart => weekly(chart, group, year))
      }));
      $('reviewPage').replaceChildren(...pages.map((page, index) => new Option(page.label || '年間', index)));
      $('reviewPageLabel').hidden = pages.length === 1;
      $('reviewName').textContent = group.name + ' · ' + year;
      $('reviewName').href = 'index.html#' + new URLSearchParams({artist: group.name, scope: group.scope, chart: 'hot100'});
      await showPage();
    } catch (error) {
      if (token === revision) $('reviewStatus').textContent = 'データを読み込めませんでした。グループを選び直してください。';
      console.error(error);
    }
  }

  function label(value, x, y, size, color = '#1d1d1f', {bold = false, align = 'left', max = 1100} = {}) {
    ctx.font = (bold ? '700 ' : '') + size + 'px Meiryo, Arial, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillText(value, x, y, max);
  }

  function box(x, y, width, height, fill, radius = 0, border) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fillStyle = fill;
    ctx.fill();
    if (border) { ctx.strokeStyle = border; ctx.stroke(); }
  }

  function line(x1, y1, x2, y2, color) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  function picture(img, x, y, size) {
    box(x, y, size, size, '#e9edf2', 8);
    if (!img) return;
    const crop = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.save();
    ctx.clip();
    ctx.drawImage(img, (img.naturalWidth - crop) / 2, (img.naturalHeight - crop) / 2, crop, crop, x, y, size, size);
    ctx.restore();
  }

  function wrap(title, width) {
    ctx.font = '700 20px Meiryo, Arial, sans-serif';
    const lines = [''];
    const tokens = title.match(/[A-Za-z0-9][A-Za-z0-9!?'’._-]*|./gu) || [];
    for (const token of tokens) {
      const pieces = ctx.measureText(token).width > width ? [...token] : [token];
      for (const piece of pieces) {
        if (ctx.measureText(lines.at(-1) + piece).width <= width) lines[lines.length - 1] += piece;
        else lines.push(piece.trimStart());
      }
    }
    if (lines.length > 3) {
      while (ctx.measureText(lines[2] + '…').width > width) lines[2] = lines[2].slice(0, -1);
      lines[2] += '…';
    }
    return lines.slice(0, 3);
  }

  function draw(page, portrait, covers) {
    const {group, year, releases, charts, start, end, coverage} = page;
    const blue = '#00658e', muted = '#64645f', dark = '#11110f', edge = '#d8d8d0';
    const totals = charts.map(chart => [...chart.values()].reduce((sum, count) => sum + count, 0));
    const hasCharts = totals.some(Boolean);
    const chartDates = [...new Set(charts.flatMap(chart => [...chart.keys()]))].sort();
    const cutoff = chartDates.at(-1);
    const axis = hasCharts ? 398 : 600;
    const top = 260, bottom = 1400;
    const yFor = date => top + (Date.parse(date) - Date.parse(start)) / (Date.parse(end) - Date.parse(start)) * (bottom - top);
    const md = date => date.slice(5).replace('-', '/');

    box(0, 0, 1200, 1600, '#f6f5f0');
    box(24, 20, 1152, 1560, '#fff', 26, edge);
    box(49, 45, 5, 25, '#b8ff25', 2);
    label(year + ' in Review', 65, 44, 19, dark, {bold: true});
    if (cutoff) label(cutoff.replaceAll('-', '.') + ' 公開分まで', 1148, 48, 16, muted, {align: 'right'});
    if (portrait) picture(portrait, 48, 78, 94);
    const titleX = portrait ? 164 : 48;
    label(group.name, titleX, 79, 40, blue, {bold: true, max: 970});
    label(year + '年 リリース日と週別ランクイン', titleX, 126, 34, dark, {bold: true});
    const releaseNote = page.releaseCount ? page.releaseCount + '作品（確認済み）' : coverage?.idConfirmed ? '確認済みの作品情報はありません' : 'リリース情報は未確認';
    label(releaseNote + (page.label ? '  ／  ' + page.label : ''), 48, 180, 17, muted);
    line(48, 208, 1152, 208, edge);
    label('リリース', 48, 225, 19, blue, {bold: true});
    line(axis, top, axis, bottom, '#9aacc5');
    for (let month = 1; month <= 12; month++) {
      const date = year + '-' + String(month).padStart(2, '0') + '-01';
      if (date < start || date >= end) continue;
      const y = yFor(date);
      line(axis - 5, y, axis + 6, y, '#9aacc5');
      label(month + '月', axis + 12, y - 11, 17, muted, {bold: true});
    }

    const textWidth = hasCharts ? 205 : 390;
    const coverSize = 88, gap = 112;
    for (const left of [true, false]) {
      const items = releases.map((row, index) => ({row, cover: covers[index]})).filter((_, index) => (index % 2 === 0) === left);
      const positions = items.map(({row}, index) => Math.max(top, yFor(row.date) - 42, index * gap + top));
      for (let i = 1; i < positions.length; i++) positions[i] = Math.max(positions[i], positions[i - 1] + gap);
      for (let i = positions.length - 1; i >= 0; i--) positions[i] = Math.min(positions[i], (positions[i + 1] ?? bottom + gap - 101) - gap);
      items.forEach(({row, cover}, index) => {
        const y = positions[index], dateY = yFor(row.date);
        const photoX = left ? axis - 113 : axis + 50;
        const textX = left ? photoX - 15 : photoX + coverSize + 15;
        const endX = left ? photoX + coverSize : photoX;
        line(axis, dateY, endX, y + 44, '#b5c2d4');
        box(axis - 4, dateY - 4, 8, 8, blue, 4);
        picture(cover, photoX, y, coverSize);
        const align = left ? 'right' : 'left';
        label(md(row.date), textX, y, 21, blue, {bold: true, align});
        const lines = wrap(row.title, textWidth);
        lines.forEach((value, i) => label(value, textX, y + 24 + i * 21, 20, dark, {bold: true, align}));
        const type = types[row.type] || '';
        const upcoming = row.date > calendar.meta.checkedAt.slice(0, 10);
        label(type + (upcoming ? ' · 配信予定' : ''), textX, y + 27 + lines.length * 21, 14, muted, {align, max: textWidth});
      });
    }

    if (hasCharts) {
      line(817, 220, 817, bottom, edge);
      const columns = [880, 1024], names = ['Hot 100', 'Streaming'];
      label('公開日', 830, 225, 15, muted);
      columns.forEach((x, i) => {
        label(names[i], x, 221, 18, dark, {bold: true});
        label('年間累積 ' + totals[i] + '回', x, 242, 15, blue, {bold: true});
      });
      chartDates.filter(date => date >= start && date < end).forEach(date => {
        const y = Math.max(261, yFor(date));
        label(md(date), 832, y, 13, muted);
        columns.forEach((x, i) => {
          const count = charts[i].get(date);
          if (!count) return;
          label(String(count), x, y, 14, dark, {bold: true});
          const size = Math.min(9, 98 / count);
          if (size >= 2) {
            for (let n = 0; n < count; n++) box(x + 32 + n * size, y + 2, size - 1, 10, i ? '#0a807e' : '#0071ba', 1);
          } else box(x + 32, y + 2, 97, 10, i ? '#0a807e' : '#0071ba', 1);
        });
      });
      label('数字はその週のランクイン曲数', 845, 1452, 16, muted);
    } else {
      label(chartDates.length ? '期間内のランクインなし（Hot 100・Streaming）' : 'チャートの掲載データなし', 48, 1452, 17, muted);
    }
    line(48, 1490, 1152, 1490, edge);
    label((cutoff ? 'チャート：' + chartDates[0] + '〜' + cutoff : '') +
      (coverage ? '   リリース確認日：' + calendar.meta.checkedAt.slice(0, 10) : ''), 48, 1505, 16, muted);
    if (coverage) label('作品日付はSpotify上の情報を基本とし、確認できた国内配信日を優先しています。', 48, 1532, 15, muted);
    window.drawImageSignature(ctx,{right:48,bottom:44});
    return totals;
  }

  async function showPage() {
    const page = pages[Number($('reviewPage').value)];
    if (!page) return;
    const token = ++revision;
    $('reviewStatus').textContent = '画像を作成中…';
    $('reviewSave').disabled = true;
    const [portrait, ...covers] = await Promise.all([
      image(photos.get(page.group.keys[0])),
      ...page.releases.map(releaseCover)
    ]);
    if (token !== revision) return;
    const totals = draw(page, portrait, covers);
    $('reviewReleases').hidden = !page.releases.length;
    $('reviewReleaseList').replaceChildren(...page.releases.map(row => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = 'releases.html?' + new URLSearchParams({month: row.date.slice(0, 7), date: row.date, release: row.id});
      link.textContent = row.date.slice(5).replace('-', '/') + ' ' + row.title;
      item.append(link);
      return item;
    }));
    canvas.setAttribute('aria-label', page.group.name + ' ' + page.year + '年の年間まとめ');
    $('reviewAlternative').textContent = [
      'Hot 100 年間累積' + totals[0] + '回。Streaming 年間累積' + totals[1] + '回。',
      ...page.releases.map(row => row.date + ' ' + row.title),
      ...page.charts.flatMap((chart, index) => [...chart].filter(([date, count]) =>
        count && date >= page.start && date < page.end).map(([date, count]) =>
        (index ? 'Streaming ' : 'Hot 100 ') + date + ' ' + count + '曲'))
    ].join('。');
    $('reviewStatus').textContent = '';
    $('reviewSave').disabled = false;
    $('reviewResult').hidden = false;
  }

  $('reviewSearch').oninput = () => {
    listLimit = 40;
    $('reviewDirectory').open = true;
    renderList();
  };
  $('reviewMore').onclick = () => { listLimit += 40; renderList(); };
  $('reviewYear').onchange = () => { if (selected) selectGroup(selected); };
  $('reviewPage').onchange = showPage;
  $('reviewSave').onclick = () => {
    const page = pages[Number($('reviewPage').value)];
    canvas.toBlob(blob => {
      if (!blob) { $('reviewStatus').textContent = '画像を保存できませんでした。'; return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = (page.group.name + '-' + page.year + (page.label ? '-' + page.label : '')).replace(/[\\/:*?"<>|]/g, '-') + '.png';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }, 'image/png');
  };

  $('reviewStatus').textContent = 'グループ一覧を読み込み中…';
  Promise.all([json('artists-registry.json'), json('release-calendar-data.json')]).then(([registry, releases]) => {
    calendar = releases;
    const {artists, aliases} = registry.site.boys;
    groups = artists.map(name => ({name, scope: 'boys', keys: [norm(name), ...(aliases[name] || []).map(norm)]}))
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    $('reviewStatus').textContent = '';
    renderList();
    const artist = params.get('artist');
    const group = artist && groups.find(item => item.keys.includes(norm(artist)));
    if (group) {
      $('reviewDirectory').open = false;
      selectGroup(group);
    } else if (artist) {
      $('reviewStatus').textContent = '年間まとめの対象は国内ボーイズグループです。';
    }
  }).catch(error => {
    $('reviewStatus').textContent = 'グループ一覧を読み込めませんでした。ページを開き直してください。';
    console.error(error);
  });
})();
