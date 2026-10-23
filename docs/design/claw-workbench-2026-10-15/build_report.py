from pathlib import Path
import base64
import hashlib
import html
import json
import mimetypes
import re

import mistune

ROOT = Path(__file__).resolve().parent
source = (ROOT / "方案.md").read_text()
render = mistune.create_markdown(plugins=["table"], escape=False)
parts = re.split(r"^## (\d{2}) (.+)$", source, flags=re.M)
sections = []
toc = []
for i in range(1, len(parts), 3):
    number, title, body = parts[i:i+3]
    sid = "s" + number
    toc.append('<a href="#' + sid + '"><span>' + number + '</span>' + html.escape(title.split("：")[0]) + '</a>')
    content = render(body)
    sections.append('<section id="' + sid + '" data-number="' + number + '"><div class="eyebrow">SECTION ' + number + '</div><h2>' + html.escape(title) + '</h2>' + content + '</section>')

body_html = "\n".join(sections)
body_html = re.sub(r"<table>(.*?)</table>", r'<div class="table-scroll" tabindex="0"><table>\1</table></div>', body_html, flags=re.S)

assets = []
def embed_image(match):
    alt, local = match.group(1), match.group(2)
    path = ROOT / local
    raw = path.read_bytes()
    mime = mimetypes.guess_type(path.name)[0]
    encoded = base64.b64encode(raw).decode()
    concept = "概念图" if path.name.startswith(("05", "06", "07")) else "现状截图"
    assets.append({"path": local, "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest(), "kind": concept})
    return '<figure><button type="button" class="image-zoom" aria-label="放大：' + alt + '"><img src="data:' + mime + ';base64,' + encoded + '" alt="' + alt + '" loading="lazy"></button><figcaption><span class="image-kind">' + concept + '</span>' + alt + '<span class="zoom-hint">点击放大</span></figcaption></figure>'

body_html = re.sub(r'<img src="([^"]+)" alt="([^"]*)" ?/?>', lambda m: embed_image(type("M", (), {"group": lambda self, n: m.group(2) if n == 1 else m.group(1)})()), body_html)

css = """
:root{--blue:#2773ff;--ink:#152237;--muted:#5f6e82;--line:#dfe5ed;--paper:#fff;--back:#f5f7fa}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:90px}
body{margin:0;background:var(--back);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;font-size:16px;line-height:1.85}
a{color:#205fca;text-decoration:none}a:hover{text-decoration:underline}
button{font:inherit;cursor:pointer}button:focus-visible,a:focus-visible,select:focus-visible,.table-scroll:focus-visible{outline:3px solid #8ab4ff;outline-offset:3px}
.skip{position:fixed;top:-80px;left:15px;background:white;padding:10px;z-index:100}.skip:focus{top:10px}
.topbar{height:62px;position:sticky;top:0;z-index:20;background:rgba(255,255,255,.96);border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 32px;gap:20px;backdrop-filter:blur(10px)}
.brand{font-size:16px;font-weight:750;letter-spacing:-.4px}.brand span{color:var(--muted);font-size:12px;font-weight:450;margin-left:16px}
.tools{display:flex;align-items:center;gap:8px}.tools button{background:white;border:1px solid var(--line);padding:5px 12px;border-radius:6px;font-size:12px;color:var(--ink)}
.tools button[aria-pressed=true]{background:#eaf1ff;color:#205fca;border-color:#b8cff6}
.layout{max-width:1540px;margin:0 auto;display:grid;grid-template-columns:230px minmax(0,1fr);gap:40px;padding:0 34px}
.toc{position:sticky;top:88px;height:calc(100vh - 110px);overflow:auto;padding:26px 0 40px;align-self:start;font-size:12px;scrollbar-width:thin}
.toc-label{color:#7b8798;font-size:11px;letter-spacing:2px;margin-bottom:16px}.toc a{display:flex;gap:10px;color:#5b687b;padding:7px 8px;border-left:2px solid transparent;line-height:1.5;transition:.15s}
.toc a span{font-size:10px;color:#8d99aa;min-width:17px;font-variant-numeric:tabular-nums}.toc a.current{color:#205fca;border-left-color:var(--blue);background:#eaf1ff;font-weight:650}
main{min-width:0;padding:36px 0 80px}.hero{padding:46px 48px 40px;background:#13243e;color:white;border-radius:10px;margin-bottom:28px;overflow:hidden}
.hero .eyebrow{color:#a0c3ff}.hero h1{font-size:clamp(32px,4vw,52px);letter-spacing:-1.8px;line-height:1.28;margin:22px 0}
.hero p{color:#c8d4e5;font-size:16px;max-width:720px;margin:0}.hero strong{color:white}.hero .meta{font-size:11px;margin-top:25px;letter-spacing:1px;color:#aabbd3}
.hero-links{margin-top:28px;display:flex;gap:12px;flex-wrap:wrap}.hero-links a{color:white;font-size:12px;border:1px solid #5b7291;border-radius:5px;padding:7px 12px}.hero-links a:first-child{background:var(--blue);border-color:var(--blue)}
.workflow{margin:24px 0 30px;padding:24px 28px;background:white;border:1px solid var(--line);border-radius:8px}
.workflow ol{display:grid;grid-template-columns:repeat(5,1fr);padding:0;gap:16px;list-style:none;margin:10px 0}.workflow li{border-top:2px solid #d6e4fd;padding-top:12px;font-size:13px;font-weight:650}
.workflow li span{display:block;font-size:11px;font-weight:400;color:var(--muted);margin-top:4px}.workflow .flow-title{font-size:12px;color:var(--muted)}
section{background:var(--paper);border:1px solid var(--line);border-radius:8px;margin:0 0 24px;padding:36px 40px;scroll-margin-top:86px}
.eyebrow{font-size:10px;font-weight:650;letter-spacing:2px;color:#5276a9;line-height:1.4}
h2{font-size:28px;line-height:1.45;letter-spacing:-.7px;margin:12px 0 26px}h3{font-size:19px;line-height:1.6;margin:32px 0 14px;font-weight:680}p{margin:16px 0}strong{font-weight:680}
blockquote{margin:20px 0;padding:14px 18px;border-left:3px solid #9fbdf0;background:#f3f7ff;color:#53667f;font-size:13px}blockquote p{margin:0}
li{margin:7px 0}ul,ol{padding-left:24px}code{background:#f0f3f8;color:#40536d;padding:2px 5px;border-radius:4px;font-size:.88em;overflow-wrap:anywhere}
.table-scroll{overflow-x:auto;margin:24px 0;border:1px solid var(--line);border-radius:5px;scrollbar-width:thin}
table{width:100%;border-collapse:collapse;font-size:13px;line-height:1.75;min-width:600px}th{background:#f4f6f9;color:#4a5d76;text-align:left;padding:13px 15px;font-size:12px;white-space:nowrap}
td{padding:14px 15px;vertical-align:top;border-top:1px solid #e8edf3;min-width:120px}td:first-child{font-weight:600;min-width:135px;width:22%}tr:nth-child(even){background:#fcfdff}
figure{margin:26px -12px}.image-zoom{display:block;width:100%;padding:0;border:1px solid #e0e6ef;background:#f5f7fa;border-radius:6px;overflow:hidden;cursor:zoom-in}
figure img{display:block;width:100%;height:auto}figcaption{padding:10px 2px 0;font-size:11px;line-height:1.6;color:#61738b;display:flex;align-items:center;gap:9px}.image-kind{white-space:nowrap;border:1px solid #dce6f4;padding:1px 5px;border-radius:3px;background:#f7faff;font-size:10px}.zoom-hint{margin-left:auto;white-space:nowrap;color:#7589a4}
.reading-end{color:#6f8096;font-size:12px;text-align:center;padding:24px}.progress{position:fixed;bottom:0;left:0;width:0;height:3px;background:var(--blue);z-index:50}
dialog{width:min(97vw,1700px);max-height:96vh;border:0;border-radius:8px;padding:0;background:#f3f5f8;box-shadow:0 24px 100px #0006}
dialog::backdrop{background:#0a1937bf}.zoom-header{position:sticky;top:0;background:white;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid var(--line);font-size:13px;z-index:1}
.zoom-header button{border:1px solid var(--line);background:white;padding:4px 12px;border-radius:4px;font-size:12px}.zoom-wrap{overflow:auto}.zoom-wrap img{display:block;width:100%;height:auto;min-width:900px}
.mode-note{display:none;background:#eaf1ff;border:1px solid #bdd2f7;color:#27558e;padding:13px 20px;border-radius:6px;font-size:12px;margin-bottom:20px}
body.brief .mode-note{display:block}body.brief section:not([data-number="01"]):not([data-number="05"]):not([data-number="06"]):not([data-number="08"]):not([data-number="09"]):not([data-number="10"]):not([data-number="15"]):not([data-number="16"]):not([data-number="18"]){display:none}
@media(min-width:1700px){.layout{gap:50px}body{font-size:17px}}
@media(max-width:1120px){.layout{grid-template-columns:180px minmax(0,1fr);gap:22px;padding:0 22px}section{padding:28px}.hero{padding:34px}.toc{font-size:11px}}
@media(max-width:860px){.layout{display:block;padding:0 16px}.toc{position:static;height:auto;display:flex;gap:7px;overflow:auto;padding:18px 0 0;white-space:nowrap}.toc-label{display:none}.toc a{flex-shrink:0;border:1px solid var(--line);border-radius:5px;padding:7px 9px;background:white}.toc a span{display:none}.toc a.current{border-color:#a5c4fc}main{padding-top:20px}.topbar{padding:0 16px}.brand span{display:none}h2{font-size:24px}.workflow{padding:18px}.workflow ol{gap:10px}.workflow li{font-size:11px}.workflow li span{font-size:10px}section{padding:24px}.hero h1{font-size:36px}}
@media(max-width:520px){body{font-size:14px}.tools button{font-size:11px;padding:4px 7px}.hero{padding:28px 24px}.hero h1{font-size:30px}.hero p{font-size:14px}.workflow ol{grid-template-columns:1fr 1fr}.workflow li:last-child{grid-column:1/-1}section{padding:22px 18px}h2{font-size:21px}h3{font-size:17px}figure{margin:22px -6px}.zoom-hint{display:none}figcaption{font-size:10px}.brand{font-size:14px}}
@media print{.topbar,.toc,.hero-links,.tools,.progress,.mode-note,dialog{display:none!important}.layout{display:block;max-width:none;padding:0}body{background:white;font-size:11px;line-height:1.6}main{padding:0}.hero{color:#152237;background:white;border-bottom:2px solid #2773ff;padding:20px 0}.hero .eyebrow,.hero p,.hero strong,.hero .meta{color:#33485f}.hero h1{font-size:32px}section,body.brief section{display:block!important;padding:20px 0;border:0;border-bottom:1px solid #ccc;border-radius:0;margin:0;break-before:auto}h2{font-size:22px}h3{font-size:16px}table{min-width:0;font-size:10px}td,th{padding:8px;min-width:0!important}.table-scroll{overflow:visible}figure{margin:15px 0;break-inside:avoid}figure img{max-height:530px;object-fit:contain}.workflow{break-inside:avoid}a{color:#205fca}p,li{orphans:3;widows:3}}
"""

javascript = """
const tocLinks=Array.from(document.querySelectorAll('.toc a'));
const sections=Array.from(document.querySelectorAll('main section'));
const mode=document.getElementById('mode');
mode.addEventListener('click',function(){
 const brief=document.body.classList.toggle('brief');
 mode.setAttribute('aria-pressed',String(brief));
 mode.textContent=brief?'展开完整方案':'评审速览';
 document.getElementById('s01').scrollIntoView({behavior:'smooth'});
});
tocLinks.forEach(function(a){a.addEventListener('click',function(){
 const section=document.querySelector(a.getAttribute('href'));
 if(getComputedStyle(section).display==='none'){
  document.body.classList.remove('brief');mode.setAttribute('aria-pressed','false');mode.textContent='评审速览';
 }
});});
document.getElementById('print').addEventListener('click',function(){window.print()});
document.getElementById('full').addEventListener('click',async function(){
 try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}
 catch(e){document.getElementById('full').textContent='当前窗口不支持全屏'}
});
const dialog=document.getElementById('zoom');
let lastButton;
document.querySelectorAll('.image-zoom').forEach(function(button){
 button.addEventListener('click',function(){
  lastButton=button;const img=button.querySelector('img');
  document.getElementById('zoom-title').textContent=img.alt;
  const large=document.getElementById('zoom-image');large.src=img.src;large.alt=img.alt;
  dialog.showModal();
 });
});
document.getElementById('close-zoom').addEventListener('click',function(){dialog.close()});
dialog.addEventListener('close',function(){document.getElementById('zoom-image').src='';if(lastButton)lastButton.focus()});
dialog.addEventListener('click',function(event){if(event.target===dialog)dialog.close()});
function updateProgress(){
 const height=document.documentElement.scrollHeight-window.innerHeight;
 document.querySelector('.progress').style.width=(height?window.scrollY/height*100:0)+'%';
 let current=sections[0];
 sections.forEach(function(s){if(getComputedStyle(s).display!=='none'&&s.getBoundingClientRect().top<180)current=s});
 tocLinks.forEach(function(a){const active=a.getAttribute('href')==='#'+current.id;a.classList.toggle('current',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});
}
window.addEventListener('scroll',updateProgress,{passive:true});updateProgress();
"""

page = """<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Claw 使用端产品形态与逻辑改造方案：工作台、工作空间、能力中心、迁移与验收。">
<title>Claw 个人工作台 · 产品改造方案</title><style>""" + css + """</style></head>
<body><a class="skip" href="#s01">跳到正文</a>
<header class="topbar"><div class="brand">Clawflow<span>PRODUCT DIRECTION / 2026.10</span></div><div class="tools"><button type="button" id="mode" aria-pressed="false">评审速览</button><button type="button" id="full">全屏阅读</button><button type="button" id="print">打印 / PDF</button></div></header>
<div class="layout"><nav class="toc" aria-label="方案目录"><div class="toc-label">CONTENTS / 目录</div>""" + "".join(toc) + """</nav>
<main><header class="hero"><div class="eyebrow">CLAW / PERSONAL WORKBENCH</div><h1>让工作成为主线。<br>让上下文与能力围绕工作组织。</h1><p>从个人 Agent 的配置入口，走向能<strong>持续工作、检查成果、积累资料</strong>的工作台。</p><div class="hero-links"><a href="#s01">阅读核心判断</a><a href="#s08">查看三张概念图</a><a href="#s15">查看迁移方案</a></div><div class="meta">2026-10-15 · 产品与设计评审稿 · 现状实查 + 官方参考 + 设计提案</div></header>
<div class="mode-note" role="status">评审速览已收起补充章节。点击“展开完整方案”或目录中的任意补充章节，可恢复全部内容。</div>
<div class="workflow"><div class="flow-title">建议的工作主路径 / 每一步都能回到真实的工作对象</div><ol><li>找到工作<span>工作台 / 工作空间</span></li><li>说明目标与资料<span>范围与能力可解释</span></li><li>执行与介入<span>进度 / 阻塞 / 恢复</span></li><li>检查成果<span>预览 / 来源 / 修改</span></li><li>继续与复用<span>空间积累 / 自动化</span></li></ol></div>
""" + body_html + """<div class="reading-end">Claw 个人工作台 · 产品形态与逻辑改造方案 · 2026-10-15<br>文内图片已嵌入，可离线阅读。外部参考链接需要网络。</div></main></div>
<dialog id="zoom" aria-labelledby="zoom-title"><div class="zoom-header"><span id="zoom-title"></span><button type="button" id="close-zoom">关闭 / Esc</button></div><div class="zoom-wrap"><img id="zoom-image" alt=""></div></dialog><div class="progress" aria-hidden="true"></div>
<script>""" + javascript + """</script></body></html>"""

target = ROOT / "Claw个人工作台-产品改造方案.html"
target.write_text(page)
manifest = {
    "date": "2026-10-15",
    "artifact": target.name,
    "sections": len(sections),
    "characters_markdown": len(source),
    "self_contained": True,
    "source": "方案.md",
    "assets": assets,
    "generation": {"tool": "image_gen built-in", "prompts": "图像提示词.md"},
    "verification": "见 验证记录.md",
}
(ROOT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
assert len(sections) == 19
assert len(assets) == 7
assert 'src="assets/' not in page
assert 'https://' not in css
assert '<script src=' not in page
print(json.dumps({"file": str(target), "bytes": target.stat().st_size, "sections": len(sections), "embedded_images": len(assets)},ensure_ascii=False))
