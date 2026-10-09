from pathlib import Path
import json, re, html, hashlib
from lxml import etree
from lxml import html as lh
from PIL import Image

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent / 'public'
books = json.loads((BASE / 'picks-2026-10-09.json').read_text())
E = html.escape
for b in books:
    b['feature'] = '/books/' + b['slug'] + '.html'
    b['featuredDate'] = '2026-10-09'
    b['amazon'] = b['buy'][0][1]

def read_data(name):
    s = (ROOT / name).read_text()
    return json.loads(s[s.index('['):].rstrip(';\n'))

old = read_data('current-data.js')
if {b['feature'] for b in old} == {b['feature'] for b in books}:
    raise SystemExit('These picks are already current; refusing to archive them.')
archive = read_data('archive-data.js')
authors = read_data('author-data.js')
for b in old:
    p = ROOT / b['feature'].lstrip('/')
    source = p.read_text()
    doc = lh.fromstring(source)
    b['amazon'] = next((a.get('href') for a in doc.xpath('//div[@class="book-buy-row"]/a') if 'amazon.' in a.get('href','')), b['amazon'])
    # Preserve the complete feature and its URL; only update its archive status/navigation.
    source = source.replace("TODAY'S PICK ·", "ARCHIVED PICK ·")
    source = source.replace('href="/picks.html">← Back to today\'s picks', 'href="/picks.html#archive">← Back to the pick archive')
    p.write_text(source)
    if not any(x.get('feature') == b['feature'] for x in archive):
        archive.insert(0, {k:b[k] for k in ['title','author','genres','image','amazon','feature','featuredDate']})
    a = next((x for x in authors if x['name']==b['author']), None)
    if a is None:
        a = {'name':b['author'],'books':[b['title']],'photo':b['photo'],'feature':b['feature'],'genres':b['genres']}
        authors.insert(0,a)
    else:
        if b['title'] not in a['books']: a['books'].append(b['title'])
        a.update(photo=b['photo'],feature=b['feature'],genres=b['genres'])

(ROOT/'archive-data.js').write_text('window.PBH_ARCHIVE='+json.dumps(archive,ensure_ascii=False,separators=(',',':'))+';\n')
(ROOT/'author-data.js').write_text('window.PBH_AUTHORS='+json.dumps(authors,ensure_ascii=False,separators=(',',':'))+';\n')
current = [{k:b[k] for k in ['title','author','genres','image','photo','feature','featuredDate','amazon','tag','hook']} for b in books]
(ROOT/'current-data.js').write_text('window.PBH_CURRENT='+json.dumps(current,ensure_ascii=False,indent=2)+';\n')

template = (ROOT/'books/silent-code.html').read_text()
header = re.search(r'<header\b.*?</header>',template,re.S).group()
footer = re.search(r'<footer\b.*?</footer>',template,re.S).group()
fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">'
domain = 'https://picked.halcyonliterary.com'
def external(label,url,css=''):
    return f'<a class="{css}" href="{E(url)}" target="_blank" rel="noopener noreferrer">{E(label)} ↗</a>'

def author_media(b, detail=False):
    if b['photo']:
        return f'<img class="{"feature-author-photo" if detail else "author-photo"}" src="{b["photo"]}" alt="{E(b["author"])}" loading="lazy">'
    initials=''.join(x[0] for x in b['author'].split()[:2])
    return f'<div class="author-avatar" aria-label="{E(b["author"])}">{initials}</div>'
def photo_credit(b):
    return '<p class="photo-credit">'+E(b['photoCredit'])+'</p>' if b['photo'] else ''

for b in books:
    title = b['title']+' by '+b['author']+' | Picked by Halcyon'
    subtitle = '<p class="book-subtitle">'+E(b['subtitle'])+'</p>' if b.get('subtitle') else ''
    buy = ''.join(external(label,url,'btn btn-solid' if i==0 else 'btn btn-outline') for i,(label,url) in enumerate(b['buy']))
    paragraphs = ''.join('<p>'+E(p)+'</p>' for p in b['paragraphs'])
    more = '<aside class="reader-fit"><span>KEEP READING</span><p>' + '<br>'.join(external(label,url) for label,url in b.get('more',[])) + '</p></aside>'
    sources = ''
    shelves = ' · '.join(f'<a href="/genres/{ {"Fantasy":"fantasy","Young Adult":"young-adult","Historical Fiction":"historical-fiction","Literary Fiction":"literary-fiction","Romance":"romance","Horror & Science Fiction":"horror-science-fiction","Memoir & Biography":"memoir-biography","Faith & Spirituality":"faith-spirituality","Nonfiction":"nonfiction","Mystery & Thriller":"mystery-thriller"}[g] }.html">{E(g)}</a>' for g in b['genres'])
    schema = {'@context':'https://schema.org','@type':'Book','name':b['title'],'author':{'@type':'Person','name':b['author'],'url':b['authorUrl']},'image':domain+b['image'],'url':domain+b['feature'],'genre':b['genres']}
    content = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><meta name="theme-color" content="#F3E7DA">
<title>{E(title)}</title><meta name="description" content="{E(b['hook'])}">
<link rel="canonical" href="{domain+b['feature']}"><meta property="og:type" content="book">
<meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(b['hook'])}">
<meta property="og:url" content="{domain+b['feature']}"><meta property="og:image" content="{domain+b['image']}">
<meta name="twitter:card" content="summary_large_image">{fonts}<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">{json.dumps(schema,ensure_ascii=False).replace('</','<\\/')}</script></head><body>{header}<main>
<section class="book-detail-hero"><div class="book-detail-cover-wrap"><img class="book-detail-cover" src="{b['image']}" alt="{E(b['title']+' by '+b['author'])}"></div>
<div class="book-detail-intro"><p class="eyebrow">TODAY'S PICK · {E(b['tag'].upper())}</p><p class="feature-date">Featured <time datetime="2026-10-09">October 9, 2026</time></p>
<h1>{E(b['title'])}</h1>{subtitle}<p class="book-author">by <a href="#author">{E(b['author'])}</a></p><p class="book-hook">{E(b['hook'])}</p><div class="book-buy-row">{buy}</div><p class="book-shelves">On our shelves: {shelves}</p></div></section>
<section class="book-review-section"><div class="book-review-label"><p class="eyebrow">WHY WE PICKED IT</p><h2 class="display">{E(b['heading'])}</h2></div><article class="book-review-copy">{paragraphs}
<aside class="reader-fit"><span>THIS ONE IS FOR</span><p>{E(b['fit'])}</p></aside><div class="feature-sources"><p>{E(b['basis'])}</p></div></article></section>
<section class="feature-author section white" id="author">{author_media(b, True)}<div><p class="eyebrow">MEET THE FEATURED AUTHOR</p><h2 class="display">{E(b['author'])}</h2><p>{E(b['bio'])}</p>{photo_credit(b)}</div></section>
<section class="next-pick"><a href="/picks.html">← Back to today's picks</a><a href="/authors.html">Meet our featured authors →</a></section></main>{footer}<script src="/site.js"></script></body></html>'''
    (ROOT/b['feature'].lstrip('/')).write_text(content)

def book_cards():
    return '\n'.join(f'<a class="pick-card latest-pick" href="{b["feature"]}"><img class="pick-cover" src="{b["image"]}" alt="{E(b["title"]+" by "+b["author"])}"><div class="pick-body"><span class="tag">{E(b["tag"].upper())}</span><h3>{E(b["title"])}</h3><p>{E(b["author"])}</p><strong>Why we picked it →</strong></div></a>' for b in books)

def author_cards():
    return '\n'.join(f'<a class="author-card" href="{b["feature"]}#author">{author_media(b)}<div class="author-meta"><span class="tag">TODAY\'S FEATURED AUTHOR</span><h3>{E(b["author"])}</h3><p>{E(b["title"])}</p><p class="author-genre">{E(b["tag"])}</p></div></a>' for b in books)

for name in ['index.html','picks.html']:
    p=ROOT/name;s=p.read_text()
    s=re.sub(r'(<div class="pick-grid">).*?(</div>(?:<div class="actions">|<div style="height:45px">))',lambda m:m[1]+'\n'+book_cards()+'\n'+m[2],s,count=1,flags=re.S)
    if name=='index.html':
        shelf=''.join(f'<a class="shelf-book" href="{b["feature"]}"><img src="{b["image"]}" alt="{E(b["title"]+" by "+b["author"])}"></a>' for b in books)
        s=re.sub(r'(<div class="book-row">).*?(</div><div class="shelf-base")',lambda m:m[1]+shelf+m[2],s,count=1,flags=re.S)
        s=re.sub(r'(<div class="author-strip">).*?(</div><div class="actions">)',lambda m:m[1]+'\n'+author_cards()+'\n'+m[2],s,count=1,flags=re.S)
        b=books[0]
        s=re.sub(r'(<img class="spotlight-cover" data-spotlight-cover)[^>]*>',lambda m:m[1]+f' src="{b["image"]}" alt="{E(b["title"]+" by "+b["author"])}">',s)
        for attr,tag,value in [('title','h2',b['title']),('author','p',b['author']),('line','p',b['hook'])]:
            s=re.sub(r'(<'+tag+r'[^>]*data-spotlight-'+attr+r'[^>]*>).*?(</'+tag+'>)',lambda m:m[1]+E(value)+m[2],s,count=1,flags=re.S)
        s=re.sub(r'(data-spotlight-link href=")[^"]+',lambda m:m[1]+b['feature'],s)
    else:
        s=s.replace('<div class="archive-grid" data-archive-grid>','<div class="archive-grid" id="archive" data-archive-grid>')
    p.write_text(s)

p=ROOT/'authors.html';s=p.read_text()
s=re.sub(r'(<div class="author-strip">).*?(</div></section>)',lambda m:m[1]+author_cards()+m[2],s,count=1,flags=re.S)
p.write_text(s)

# Refresh only changed shared assets and load current picks before their consumers.
for p in ROOT.rglob('*.html'):
    s=p.read_text()
    if '/archive-render.js' in s or 'data-book-spotlight' in s:
        if '/current-data.js' not in s:s=s.replace('<script src="/archive-data.js','<script src="/current-data.js"></script><script src="/archive-data.js',1)
    for asset in ['archive-data.js','archive-render.js','author-data.js','author-render.js','site.js','current-data.js','styles.css']:
        f=ROOT/asset
        if f.exists():s=re.sub(r'(["\'])/'+re.escape(asset)+r'(?:\?v=[^"\']*)?(["\'])',lambda m:m[1]+'/'+asset+'?v='+hashlib.sha256(f.read_bytes()).hexdigest()[:12]+m[2],s)
    p.write_text(s)

ns='http://www.sitemaps.org/schemas/sitemap/0.9'
tree=etree.parse(str(ROOT/'sitemap.xml'));node=tree.getroot()
urls={x.text for x in node.findall('.//{'+ns+'}loc')}
for p in list((ROOT/'books').glob('*.html'))+list((ROOT/'genres').glob('*.html')):
    u=domain+'/'+str(p.relative_to(ROOT))
    if u not in urls:
        elem=etree.SubElement(node,'{'+ns+'}url');etree.SubElement(elem,'{'+ns+'}loc').text=u
tree.write(str(ROOT/'sitemap.xml'),encoding='UTF-8',xml_declaration=True,pretty_print=True)
print(f'Created four features; archive now has {len(archive)} books and {len(authors)} authors.')
