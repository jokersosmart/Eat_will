#!/usr/bin/env python3
"""Build chapter-structured Markdown files from exported Notion DB results.

Finds the latest query result files and writes:
- knowledge/01_六大部分知識庫.md (chapter 1-6, 1-1, 1-2 numbering)
- knowledge/02_七大飯局角色.md (R-1..R-7)
- knowledge/03_五局十五層.md (S-1..S-15)
- knowledge/00_README.md (index + totals)
"""
import glob, json, os, re

OUT = '/home/ubuntu/dinner_app/knowledge'
os.makedirs(OUT, exist_ok=True)


def latest(pattern):
    files = sorted(glob.glob(f'/home/ubuntu/.mcp/tool-results/{pattern}'))
    return files[-1]


def load(pattern):
    f = latest(pattern)
    d = json.load(open(f))
    return d.get('results', [])

def clean(s):
    return (s or '').strip()

def esc(s):
    return clean(s).replace('|', '\\|').replace('\n', ' ')

# ---- 1. Six parts ----
rows = load('*query-data-sources*.json')
# There are three latest files; six_parts was queried first. Identify by column presence.
files = sorted(glob.glob('/home/ubuntu/.mcp/tool-results/*query-data-sources*.json'))
six_rows = roles_rows = stages_rows = None
for f in files[-3:]:
    d = json.load(open(f))
    r = d.get('results', [])
    if not r:
        continue
    keys = set(r[0].keys())
    if '六大部分' in keys:
        six_rows = r
    elif '角色' in keys:
        roles_rows = r
    elif '局別' in keys:
        stages_rows = r

if six_rows is None or roles_rows is None or stages_rows is None:
    print('missing:', six_rows is None, roles_rows is None, stages_rows is None)
    raise SystemExit(1)

order = {'1. 目標與框架': 1, '2. 人物與角色': 2, '3. 場景': 3,
         '4. 時機': 4, '5. 話題與五局': 5, '6. 實戰與長期養成': 6}
by_part = {}
for r in six_rows:
    part = r.get('六大部分', '')
    by_part.setdefault(part, []).append(r)
by_part = {k: sorted(v, key=lambda x: float(x.get('排序') or 0)) for k, v in by_part.items()}
part_titles = {
    '1. 目標與框架': '第一部分|目標與框架:飯局的定義、目的與思考框架',
    '2. 人物與角色': '第二部分|人物與角色:做局原則與角色觀察',
    '3. 場景': '第三部分|場景:座位、菜系、餐具與節奏的戰略',
    '4. 時機': '第四部分|時機:用餐時段與局的類型',
    '5. 話題與五局': '第五部分|話題與五局:話題準備與關係心法',
    '6. 實戰與長期養成': '第六部分|實戰與長期養成:前中後守則、演練與 Q&A',
}
lines = ['# 六大部分知識庫', '',
         '「阿是要不要好好吃飯」商務飯局課程知識庫,依六大部分章節結構合併整理。',
         '',
         '| 章節 | 條目數 |',
         '|---|---|']
for part in sorted(by_part, key=lambda p: order.get(p, 9)):
    lines.append(f"| {part} | {len(by_part[part])} |")
lines += ['', '---', '']

cat_num = {}
for part in sorted(by_part, key=lambda p: order.get(p, 9)):
    t = part_titles[part]
    num, title = t.split('|')
    lines += [f'## {num} {title}', '']
    i = 0
    for r in by_part[part]:
        i += 1
        cat_num[r.get('類別', '')] = cat_num.get(r.get('類別', ''), 0) + 1
        lines += [f'### {num.split(".")[0]}-{i} {esc(r.get("條目"))}', '',
                  f'**類別**: {esc(r.get("類別"))}', '',
                  esc(r.get('條目內容')), '', '---', '']

open(f'{OUT}/01_六大部分知識庫.md', 'w').write('\n'.join(lines))
print('01 six parts written:', sum(len(v) for v in by_part.values()))

# ---- 2. Roles ----
rlines = ['# 七大飯局角色', '',
          '商務飯局中的七大角色定義、辨識訊號、應對策略與補充要點。', '',
          '| 編號 | 角色 |', '|---|---|']
roles_rows = sorted(roles_rows, key=lambda x: float(x.get('排序') or 0))
for j, r in enumerate(roles_rows, 1):
    rlines.append(f"| R-{j} | {esc(r.get('角色'))} |")
rlines += ['', '---', '']
for j, r in enumerate(roles_rows, 1):
    rlines += [f"## R-{j} {esc(r.get('角色'))}", '',
               f"**定義**:{esc(r.get('定義'))}", '',
               f"**辨識訊號**:{esc(r.get('辨識訊號'))}", '',
               f"**應對策略**:{esc(r.get('應對策略'))}", '',
               f"**補充要點**:{esc(r.get('補充要點'))}", '', '---', '']
open(f'{OUT}/02_七大飯局角色.md', 'w').write('\n'.join(rlines))
print('02 roles written:', len(roles_rows))

# ---- 3. Stages ----
sorder = {'破冰局': 1, '探索局': 2, '推進局': 3, '成交局': 4, '關係局': 5}
srows = sorted(stages_rows, key=lambda x: float(x.get('排序') or 0))
slines = ['# 五局十五層', '',
          '飯局進程五局,每局三個子層次,共十五層的核心層次、話題方向與注意事項。', '',
          '| 編號 | 局別 | 層次 | 核心層次 |', '|---|---|---|---|']
for k, r in enumerate(srows, 1):
    slines.append(f"| S-{k} | {esc(r.get('局別'))} | {esc(r.get('層次'))} | {esc(r.get('核心層次'))} |")
slines += ['', '---', '']
for k, r in enumerate(srows, 1):
    slines += [f"## S-{k} {esc(r.get('名稱'))}", '',
               f"**局別**: {esc(r.get('局別'))} **層次**: {esc(r.get('層次'))}", '',
               f"**核心層次**: {esc(r.get('核心層次'))}", '',
               f"**話題方向與做法**:{esc(r.get('話題方向與做法'))}", '',
               f"**注意事項**:{esc(r.get('注意事項'))}", '', '---', '']
open(f'{OUT}/03_五局十五層.md', 'w').write('\n'.join(slines))
print('03 stages written:', len(srows))

# ---- 0. README ----
readme = [
    '# 阿是要不要好好吃飯 — 飯局知識庫',
    '',
    '商務飯局課程知識庫,受眾為亞洲地區需要透過商務飯局認識人、爭取資源、'
    '增加自己或品牌影響力的人。本 repo 備份自 Notion 結構化資料庫(2026-08-12)。',
    '',
    '## 檔案結構',
    '',
    '| 檔案 | 內容 | 條目數 |',
    '|---|---|---|',
    f"| knowledge/01_六大部分知識庫.md | 課程六大章節知識庫 | {sum(len(v) for v in by_part.values())} |",
    f"| knowledge/02_七大飯局角色.md | 七大角色卡 | {len(roles_rows)} |",
    f"| knowledge/03_五局十五層.md | 五局 × 每局三層 | {len(srows)} |",
    '',
    '總計 54 筆條目。資料來源:Notion「飯局課」頁面下的三個資料庫'
    '(六大部分知識庫、七大飯局角色、五局十五層)。',
    '',
    '## 授權與歸屬',
    '',
    '內容由 Joker 擁有。',
    '',
]
open(f'{OUT}/README.md', 'w').write('\n'.join(readme))
print('README written')
print('category counts:', json.dumps(cat_num, ensure_ascii=False, indent=1))
