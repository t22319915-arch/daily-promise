import docx
import re
import json
from pathlib import Path
BASE = Path("天父每日應許")
OUTDIR = Path("daily-promise/data")
MONTH_FILES = {1: "天父每日應許1月文.docx", 2: "天父每日應許2月文.docx", 3: "天父每日應許3月文.docx", 4: "天父每日應許4月文.docx", 5: "天父每日應許5月文.docx", 6: "天父每日應許6月文.docx", 7: "天父每日應許7月文.docx", 8: "天父每日應許8月文.docx", 9: "天父每日應許9月文.docx", 10: "天父每日應許10月文.docx", 11: "天父每日應許11月文.docx", 12: "天父每日應許12月文.docx"}
MONTH_DAYS = {1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31}
N_START = {1: 1, 2: 32, 3: 61, 4: 92, 5: 122, 6: 153, 7: 183, 8: 214, 9: 245, 10: 275, 11: 306, 12: 336}
MARKER = re.compile("天父每日應許\\s*(\\d+)\\s*/\\s*366")
DATE_PAT = re.compile("^[正一二三四五六七八九十]{1,4}月[初一二三四五六七八九十廿卅]{1,5}日$")
PRAYER_PAT = re.compile("^(我們來)?禱告\\s*[:：]\\s*(.+)$")
READ_PAT = re.compile("^2年讀完聖經第([12])年今日進度\\s*[:：]?\\s*(.+)$")
FOOT_KEYS = ["歡迎轉傳", "全年網", "全年點選", "歡迎蒞臨", "貴格會", "tcfc.tw", "微僕"]
GREETINGS = ["早安", "平安", "早平安"]
INTRO = "讓我們一同來領受"
def is_footer(t):
    for k in FOOT_KEYS:
        if k in t:
            return True
    return False
def extract_ref(s):
    if "~~" in s:
        return s.split("~~")[-1].strip()
    m = re.match("^(.{1,15}?)[:：]", s)
    if m and re.search("[0-9廿卅]", m.group(1)):
        return m.group(1).strip()
    return ""
all_days = {}
warn = []
for m in range(1, 13):
    doc = docx.Document(str(BASE / MONTH_FILES[m]))
    texts = [" ".join(p.text.split()) for p in doc.paragraphs]
    gi = [i for i, t in enumerate(texts) if t in GREETINGS]
    if len(gi) != MONTH_DAYS[m]:
        warn.append("月" + str(m) + " 問候語數=" + str(len(gi)) + " 預期=" + str(MONTH_DAYS[m]))
    starts = []
    for g in gi:
        s = g
        j = g - 1
        while j >= 0 and not texts[j]:
            j = j - 1
        if j >= 0 and DATE_PAT.match(texts[j]):
            s = j
        starts.append(s)
    blocks = []
    prologue = [t for t in texts[:starts[0]] if t] if starts else []
    for k, s in enumerate(starts):
        e = starts[k + 1] if k + 1 < len(starts) else len(texts)
        blocks.append(list(prologue) + texts[s:e] if k == 0 else texts[s:e])
    if len(blocks) != MONTH_DAYS[m]:
        warn.append("月" + str(m) + " 區塊數=" + str(len(blocks)) + " 預期=" + str(MONTH_DAYS[m]))
    for idx, blk in enumerate(blocks):
        day = idx + 1
        key = str(m) + "-" + str(day)
        rec = {"id": key, "month": m, "day": day, "n": 0, "date_label": "", "greeting": "", "subtitle": [], "intro": "", "scripture": "", "ref": "", "message": [], "closing": [], "prayer": "", "reading1": "", "reading2": ""}
        if sum(1 for t in blk if t == INTRO) != 1:
            warn.append(key + " 引言數異常")
        seen_intro = False
        main = []
        ndates = 0
        for t in blk:
            if not t:
                continue
            mm = MARKER.search(t)
            if mm:
                rec["n"] = int(mm.group(1))
                continue
            if is_footer(t):
                continue
            if DATE_PAT.match(t):
                ndates = ndates + 1
                if not rec["date_label"]:
                    rec["date_label"] = t
                continue
            if t in GREETINGS:
                if not rec["greeting"]:
                    rec["greeting"] = t
                else:
                    rec["subtitle"].append(t)
                continue
            if t == INTRO:
                rec["intro"] = t
                seen_intro = True
                continue
            if not seen_intro:
                rec["subtitle"].append(t)
            else:
                main.append(t)
        if ndates > 1:
            warn.append(key + " 日期標籤多個 取首個")
        if rec["n"] == 0:
            rec["n"] = N_START[m] + idx
            warn.append(key + " 無編號標記 以順序推定N=" + str(rec["n"]))
        elif rec["n"] != N_START[m] + idx:
            warn.append(key + " 標記N=" + str(rec["n"]) + " 順序期望=" + str(N_START[m] + idx))
        if not rec["greeting"]:
            warn.append(key + " 缺少問候語")
        pi = -1
        for i, t in enumerate(main):
            if PRAYER_PAT.match(t):
                pi = i
        if pi >= 0:
            rec["prayer"] = PRAYER_PAT.match(main[pi]).group(2).strip()
            del main[pi]
        else:
            fi = -1
            for i, t in enumerate(main):
                if t.startswith("禱告") or t.startswith("我們來禱告"):
                    fi = i
            if fi >= 0:
                rec["prayer"] = main[fi]
                del main[fi]
                warn.append(key + " 禱告無冒號 使用原文整行")
            else:
                warn.append(key + " 缺少禱告")
        rest = []
        for t in main:
            mr = READ_PAT.match(t)
            if mr:
                if mr.group(1) == "1":
                    rec["reading1"] = mr.group(2).strip()
                else:
                    rec["reading2"] = mr.group(2).strip()
            elif t.startswith("2年") and "進度" in t:
                val = t.split("進度", 1)[1].lstrip(" :：　").strip()
                if "第1年" in t:
                    rec["reading1"] = val
                elif "第2年" in t:
                    rec["reading2"] = val
                else:
                    rest.append(t)
            else:
                rest.append(t)
        main = rest
        if not rec["reading1"] or not rec["reading2"]:
            warn.append(key + " 讀經不全 R1=" + ("有" if rec["reading1"] else "無") + " R2=" + ("有" if rec["reading2"] else "無"))
        if main:
            rec["scripture"] = main[0]
            rec["ref"] = extract_ref(main[0])
            main = main[1:]
        else:
            warn.append(key + " 缺少經文")
        for t in main:
            if t.startswith("親愛的"):
                rec["closing"].append(t)
            else:
                rec["message"].append(t)
        if not rec["closing"]:
            warn.append(key + " 缺少親愛的結語")
        if not rec["message"]:
            warn.append(key + " 信息內文為空")
        if not rec["intro"]:
            warn.append(key + " 缺少引言")
        all_days[key] = rec
total = len(all_days)
ns = sorted([r["n"] for r in all_days.values()])
missing_n = [x for x in range(1, 367) if x not in ns]
GFIRST = ["1-1", "1-25", "2-12", "2-17", "11-23", "12-25"]
for kk, vv in all_days.items():
    if kk in GFIRST:
        vv["opening"] = [vv["greeting"]] + vv["subtitle"] + [vv["intro"]]
    elif vv["subtitle"]:
        vv["opening"] = vv["subtitle"] + [vv["greeting"]] + [vv["intro"]]
    else:
        vv["opening"] = [vv["greeting"]] + [vv["intro"]]
    vv["opening"] = [xx for xx in vv["opening"] if xx]
report = []
report.append("總天數=" + str(total) + " 預期=366")
report.append("N缺號=" + str(missing_n))
report.append("警告數=" + str(len(warn)))
report.extend(warn)
OUTDIR.mkdir(parents=True, exist_ok=True)
with open(str(OUTDIR / "daily-promises.json"), "w", encoding="utf-8") as f:
    json.dump({"meta": {"title": "天父每日應許", "total": total, "missing_n": missing_n}, "days": all_days}, f, ensure_ascii=False, indent=1)
with open("validation.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(report))
print("done total=" + str(total))
