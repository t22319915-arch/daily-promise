"use strict";
/* 天父每日應許——每日靈修：日期計算、內容渲染、分享 */
var DIM = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var DATA = null;
var cur = { m: 1, d: 1 };
function $(id) { return document.getElementById(id); }
function setText(id, text) { $(id).textContent = text; }
/* 以亞洲台北時區決定今天日期 */
function taiwanToday() {
  var m = 1, d = 1;
  try {
    var parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date());
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].type === "month") { m = parseInt(parts[i].value, 10); }
      if (parts[i].type === "day") { d = parseInt(parts[i].value, 10); }
    }
  } catch (e) {
    var now = new Date();
    m = now.getMonth() + 1;
    d = now.getDate();
  }
  if (!(m >= 1 && m <= 12)) { m = 1; }
  if (!(d >= 1 && d <= DIM[m - 1])) { d = 1; }
  return { m: m, d: d };
}
/* 解析網址錨點，例如 #3-15 */
function parseHash() {
  var h = location.hash.replace("#", "");
  var seg = h.split("-");
  if (seg.length !== 2) { return null; }
  var m = parseInt(seg[0], 10);
  var d = parseInt(seg[1], 10);
  if (!(m >= 1 && m <= 12)) { return null; }
  if (!(d >= 1 && d <= DIM[m - 1])) { return null; }
  return { m: m, d: d };
}
function fillMonth() {
  var sel = $("selMonth");
  sel.textContent = "";
  for (var m = 1; m <= 12; m++) {
    var o = document.createElement("option");
    o.value = String(m);
    o.textContent = m + "月";
    sel.appendChild(o);
  }
}
function fillDay(m, keep) {
  var sel = $("selDay");
  var prev = keep ? sel.value : "";
  sel.textContent = "";
  for (var d = 1; d <= DIM[m - 1]; d++) {
    var o = document.createElement("option");
    o.value = String(d);
    o.textContent = d + "日";
    sel.appendChild(o);
  }
  if (keep && prev && parseInt(prev, 10) <= DIM[m - 1]) { sel.value = prev; }
}
function pageUrl(m, d) {
  return location.href.split("#")[0] + "#" + m + "-" + d;
}
function render(m, d) {
  cur = { m: m, d: d };
  var rec = DATA.days[m + "-" + d];
  if (!rec) { return; }
  var dateStr = m + "月" + d + "日";
  document.title = "天父每日應許 " + dateStr + "｜每日靈修";
  var kicker = "第 " + rec.n + " 天 · 全年 366 天";
  if (rec.date_label) { kicker = kicker + " · " + rec.date_label; }
  setText("heroKicker", kicker);
  setText("heroDate", dateStr);
  var op = (rec.opening && rec.opening.length) ? rec.opening : [rec.greeting, rec.intro];
  setText("fOpening", op.filter(function (x) { return !!x; }).join("，"));
  setText("fDate", dateStr + (rec.date_label ? " · " + rec.date_label : ""));
  setText("fN", "第 " + rec.n + " 天");
  setText("fScripture", rec.scripture);
  var refEl = $("fRef");
  refEl.textContent = rec.ref;
  refEl.hidden = !rec.ref;
  var msg = $("fMessage");
  msg.textContent = "";
  for (var i = 0; i < rec.message.length; i++) {
    var p = document.createElement("p");
    p.textContent = rec.message[i];
    msg.appendChild(p);
  }
  var clo = $("fClosing");
  clo.textContent = "";
  for (var j = 0; j < rec.closing.length; j++) {
    var q = document.createElement("p");
    q.textContent = rec.closing[j];
    clo.appendChild(q);
  }
  clo.hidden = rec.closing.length === 0;
  setText("fPrayer", rec.prayer);
  setText("fR1", rec.reading1);
  setText("fR2", rec.reading2);
  $("liR1").hidden = !rec.reading1;
  $("liR2").hidden = !rec.reading2;
  $("selMonth").value = String(m);
  fillDay(m, false);
  $("selDay").value = String(d);
  if (location.hash !== "#" + m + "-" + d) {
    history.replaceState(null, "", "#" + m + "-" + d);
  }
}
function step(delta) {
  var m = cur.m, d = cur.d + delta;
  if (d < 1) { m = m - 1; if (m < 1) { m = 12; } d = DIM[m - 1]; }
  if (d > DIM[m - 1]) { d = 1; m = m + 1; if (m > 12) { m = 1; } }
  render(m, d);
}
function shareLine() {
  window.open("https://social-plugins.line.me/lineit/share?url=" + encodeURIComponent(pageUrl(cur.m, cur.d)), "_blank", "noopener");
}
function shareFb() {
  window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(pageUrl(cur.m, cur.d)), "_blank", "noopener");
}
function fallbackCopy(text) {
  var ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "absolute";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta);
}
function copyLink() {
  var url = pageUrl(cur.m, cur.d);
  var done = function () {
    var el = $("copyMsg");
    el.hidden = false;
    window.setTimeout(function () { el.hidden = true; }, 2000);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done, function () { fallbackCopy(url); done(); });
  } else {
    fallbackCopy(url);
    done();
  }
}
function init() {
  fillMonth();
  var start = parseHash() || taiwanToday();
  render(start.m, start.d);
  $("selMonth").addEventListener("change", function (e) {
    var m = parseInt(e.target.value, 10);
    fillDay(m, true);
    render(m, parseInt($("selDay").value, 10));
  });
  $("selDay").addEventListener("change", function (e) {
    render(parseInt($("selMonth").value, 10), parseInt(e.target.value, 10));
  });
  $("btnPrev").addEventListener("click", function () { step(-1); });
  $("btnNext").addEventListener("click", function () { step(1); });
  $("btnToday").addEventListener("click", function () {
    var t = taiwanToday();
    render(t.m, t.d);
  });
  $("btnCopy").addEventListener("click", copyLink);
  $("btnLine").addEventListener("click", shareLine);
  $("btnFb").addEventListener("click", shareFb);
  window.addEventListener("hashchange", function () {
    var h = parseHash();
    if (h && (h.m !== cur.m || h.d !== cur.d)) { render(h.m, h.d); }
  });
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      try { navigator.serviceWorker.register("sw.js"); } catch (e) {}
    });
  }
}
fetch("data/daily-promises.json").then(function (r) {
  if (!r.ok) { throw new Error("load failed"); }
  return r.json();
}).then(function (j) {
  DATA = j;
  $("loading").hidden = true;
  $("card").hidden = false;
  init();
}).catch(function () {
  $("loading").hidden = true;
  $("loadError").hidden = false;
});
