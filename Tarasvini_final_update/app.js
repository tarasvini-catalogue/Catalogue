/* Tarasvini website script, shared by every page.
   SETTINGS: the only lines you normally need to change. */
// Published Google Sheet (File > Share > Publish to web). Each tab has a gid number:
// open the tab and read it from the address bar, e.g. ...edit#gid=123456789
const SHEET_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vS9qQBcSytVNNAHcNGVlK4E-JdTrTEHP4oKuYvKhzIn24d9zHl_zm6iq6k9UlgLdw/pub";
// gids of the product tabs (one Catalogue tab, or one tab per category) and the Offers tab, in any order:
// the site tells them apart by their column headings
const SHEET_TABS=["664938297","311735615","2084325073","713636433","514300202","1692605283"]; // Sarees, Salwars & Anarkalis, Kurtis & Gowns, Lehengas, Cord-sets, Offers
const tabURL=g=>SHEET_URL+(g?"?gid="+g+"&single=true&output=csv":"?output=csv");
const REVIEWS_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vRb2S-qjo-0bX-2i7J1DDT6V1v6I27PaHz97hULeNk8Gxv0POvyKnnCLhDEPCml8Q/pub?output=csv"; // published CSV of the Reviews sheet
const WA="918925552441"; // WhatsApp number with country code, no +
const BACKUP_CSV="catalogue-backup.csv"; // saved copy, used only if Google Sheets cannot be reached
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const state={all:[],cat:"Saree",tc:{},fc:{}};
// Website tabs: [value in the sheet's Category column, tab label, one item, many items]
// The menu is built from the Category column, in the order categories first appear in the sheet.
// Known categories get these labels; any new category gets its own name in plural (Dupatta -> Dupattas).
const KNOWN=[["Saree","Sarees","saree","sarees"],["Salwar","Salwars & Anarkalis","style","styles","Salwar Suits","Salwar Suit","Salwars","Anarkali","Anarkalis","Salwars & Anarkalis"],["Kurti","Kurtis & Gowns","style","styles"],["Lehenga","Lehengas","lehenga","lehengas"],["Cord-set","Cord-sets","cord-set","cord-sets"]];
let CATS=KNOWN.slice(0,4);
const catInfo=v=>{v=String(v||"").replace(/\s+/g," ").trim();const k=v.toLowerCase(),kn=KNOWN.find(c=>c.some(x=>x.toLowerCase()===k)||c[0].toLowerCase()+"s"===k||(c[0]==="Cord-set"&&/^co-?ord|^cord ?sets?$/.test(k)));if(kn)return kn;
  const t=v===k?title(v):v,pl=/s$/i.test(t)?t:t+"s";return[t,pl,t.toLowerCase(),pl.toLowerCase()]};
let HASNEW=false;
function setCats(recs){HASNEW=recs.some(o=>yes(o.isnew));const out=[];recs.forEach(o=>{const c=catInfo(o.category);if(c[0]&&!out.some(x=>x[0].toLowerCase()===c[0].toLowerCase()))out.push(c)});if(out.length)CATS=out;buildNav()}
function buildNav(){
  const nav=document.querySelector(".nav");if(nav){nav.querySelectorAll("a[data-cat]").forEach(a=>a.remove());const sep=nav.querySelector(".sep");
    CATS.forEach(c=>{const a=document.createElement("a");a.href="index.html?cat="+encodeURIComponent(c[0]);a.dataset.cat=c[0];a.textContent=c[1];if(c[0]===state.cat&&$("#grid"))a.setAttribute("aria-current","true");nav.insertBefore(a,sep)});
    let nl=nav.querySelector(".navnew");if(HASNEW&&!nl){nl=document.createElement("a");nl.className="navnew";nl.href="/new-arrivals.html";nl.textContent="New arrivals";if(document.querySelector(".newpage"))nl.setAttribute("aria-current","true");nav.insertBefore(nl,nav.firstChild)}
    if(nl&&!HASNEW)nl.remove()}
  const h=[...document.querySelectorAll("footer h3")].find(x=>x.textContent.trim()==="Shop");
  if(h){const d=h.parentNode;d.querySelectorAll("a").forEach(a=>a.remove());if(HASNEW){const a=document.createElement("a");a.href="/new-arrivals.html";a.textContent="New arrivals";d.appendChild(a)}CATS.forEach(c=>{const a=document.createElement("a");a.href="index.html?cat="+encodeURIComponent(c[0]);a.textContent=c[1];d.appendChild(a)})}
}
// Sheet headings the site understands (any capitals, spaces or dashes): heading -> internal name
const ALIAS={home_collection:"homecoll",homepage_collection:"homecoll",highlight:"homecoll",occasion:"occ",occasions:"occ",occasion_wear:"occ",wear:"occ",sale_price:"sale",offer_price:"sale",discount_price:"sale",show_on_website:"show",show_on_site:"show",show:"show",on_website:"show",website:"show",new_arrival:"isnew",new_arrivals:"isnew",new:"isnew",product_code:"id",code:"id",model_no:"id",product_name:"name",sub_category:"collection",subcategory:"collection",type:"collection",fabric:"fabric_group",colours:"colours",colors:"colours",number_of_colours:"colours",selling_price:"price",availability:"available",photo_1:"image_url",photo_2:"image_url_2",photo_3:"image_url_3",video:"video_url"};
const hkey=h=>{const k=String(h).trim().toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");return ALIAS[k]||k};
const catKey=v=>catInfo(v)[0];
const CAT=()=>CATS.find(c=>c[0]===state.cat);
const label=()=>CAT()[1];
const many=n=>n+" "+(n===1?CAT()[2]:CAT()[3]);
// Colours: a number (6) or colour names (Red, Blue, Green). At most 3 are shown; with more, customers are asked to DM.
// Default order everywhere: New Arrival, Featured, Home Collection ("premium" collections), products with photos, the rest; sold out last
const pri=p=>p.sold?9:p.isnew?0:p.feat?1:p.homecoll?2:p.imgs.length?3:4;
const colInfo=v=>{v=String(v||"").trim();if(/^\d+$/.test(v))return{colours:+v,cnames:[]};const n=v.split(/[,;\/|]+/).map(x=>x.trim()).filter(Boolean);return{colours:n.length,cnames:n}};
const cols=p=>p.colours>3?"More colours":p.cnames.length>1?p.cnames.join(", "):p.colours>1?p.colours+" colours":"";
const and=a=>a.length>1?a.slice(0,-1).join(", ")+" and "+a[a.length-1]:a.join("");
// Description: keeps line breaks; "*", "-" or "•" lines become bullets; a short line before a group
// of lines becomes a small heading ("Size", "Material and care"); "Bust - 38"" shows as "Bust: 38"".
function descHTML(t){
  let lines=String(t).replace(/\r/g,"").split("\n").map(x=>x.trim()).filter(Boolean);
  if(lines.length===1&&/\s[•*]\s/.test(lines[0]))lines=lines[0].split(/\s(?=[•*]\s)/).map(x=>x.trim());
  const bul=x=>/^[*•\-–]\s*/.test(x),strip=x=>x.replace(/^[*•\-–]\s*/,"");
  const kv=x=>{const m=x.match(/^(.{2,32}?)\s+[-–:]\s+(.+)$/);return m?`<b>${esc(m[1])}:</b> ${esc(m[2])}`:esc(x)};
  const isKV=x=>/^.{2,32}?\s+[-–:]\s+.+$/.test(strip(x));
  const head=(x,i)=>i>0&&i+1<lines.length&&!bul(x)&&x.length<=32&&!/[.:]$/.test(x)&&!isKV(x)&&(bul(lines[i+1])||isKV(lines[i+1]));
  let html="",list=false;const close=()=>{if(list){html+="</ul>";list=false}};
  lines.forEach((x,i)=>{
    if(i===0&&!bul(x)){html+=`<p class="lead">${esc(x)}</p>`;return}
    if(head(x,i)){close();html+=`<h5>${esc(x)}</h5>`;return}
    if(lines.length===1){html+=`<p>${esc(x)}</p>`;return}
    if(!list){html+="<ul>";list=true}
    html+=`<li>${kv(strip(x))}</li>`});
  close();return html}
function colHTML(p){
  if(p.colours<2&&!p.cnames.length)return "";
  let t;
  if(p.colours>3)t=p.cnames.length?`${esc(p.cnames.slice(0,3).join(", "))} and more colours available.`:"More colours available.";
  else if(p.cnames.length===1)t=`Colour: ${esc(p.cnames[0])}.`;
  else t=(p.cnames.length?`Available in ${esc(and(p.cnames))}.`:`Available in ${p.colours} colours.`)+" Tell us your colour when you order.";
  return `<div class="opt"><h4>Colours</h4><p>${t}</p></div>`}
// "More in this collection" note on every product: links to ask for all colours and sizes
function moreHTML(p){
  const what=p.sizes?"colour or size":"colour or design";
  const q=encodeURIComponent(prodMsg(p,"Hi Tarasvini, please share all the colours and sizes of:"));
  return `<div class="more-note"><b>Looking for another ${what}?</b><span>We have more in this collection. Message us on <a href="${IG_DM}" target="_blank" rel="noopener" data-igcopy="${esc(p.id)}" data-igintro="colours">Instagram</a> or <a href="https://wa.me/${WA}?text=${q}" target="_blank" rel="noopener">WhatsApp</a> and we'll share all the options.</span></div>`}
const inCat=()=>state.all.filter(p=>p.category===state.cat);

function parseCSV(t){
  const rows=[];let r=[],f="",q=false;
  for(let i=0;i<t.length;i++){
    const c=t[i];
    if(q){ if(c=='"'){ if(t[i+1]=='"'){f+='"';i++} else q=false } else f+=c }
    else if(c=='"') q=true;
    else if(c==','){r.push(f);f=""}
    else if(c=='\n'){r.push(f);rows.push(r);r=[];f=""}
    else if(c!='\r') f+=c;
  }
  if(f!==""||r.length){r.push(f);rows.push(r)}
  return rows;
}
// Fetch each published tab once; pick the one whose headings pass the test
let _tabs;
const tabs=()=>_tabs||(_tabs=Promise.all(SHEET_TABS.map(g=>fetch(tabURL(g)).then(r=>r.ok?r.text():"").catch(()=>""))));
const findTab=test=>tabs().then(ts=>ts.find(t=>t&&test((parseCSV(t)[0]||[]).map(hkey)))||"");
const title=s=>s.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
const inr=n=>"₹"+n.toLocaleString("en-IN");
// Product message for WhatsApp and Instagram. The photo link goes first so WhatsApp shows a picture preview.
// Every product has its own page: /p/<name>-<code>.html (same rule as build/generate.mjs)
const slugify=s=>String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const prodPath=p=>"/p/"+(slugify(p.name)||"product")+"-"+(slugify(p.id)||p.i)+".html";
const itemURL=p=>location.origin+prodPath(p);
const prodMsg=(p,intro,end)=>[/^https?:/.test(p.imgs[0]||"")?pic(p.imgs[0],600):"",intro,p.name,"Code: "+p.id,
  p.price?"Price: "+inr(p.price)+(p.was?" (sale price, was "+inr(p.was)+")":""):"",p.colours>1?"Colour: ":"",p.sizes?"Size: ":"",(o=>o?"Offer: "+o.offer_code+(pctText(o.discount)?" ("+pctText(o.discount)+" off)":""):"")(offerFor(p)),"Link: "+itemURL(p),end||""].filter(Boolean).join("\n");
const waLink=p=>"https://wa.me/"+WA+"?text="+encodeURIComponent(
  p?prodMsg(p,"Hi Tarasvini, I'd like to order:","Please confirm availability and delivery.")
   :"Hi Tarasvini, I'd like to know more about your products.");

// Category colours: [strong, light tint]; used for photo placeholders
const CCOL={Saree:["#B43C18","#F7E3DB"],Salwar:["#B0185A","#F7DCE8"],Kurti:["#0F6B6B","#D8ECEB"],Lehenga:["#C9850A","#FBEACB"],"Cord-set":["#3C3C18","#E8E8D8"]};
const PAL=[["#B43C18","#F7E3DB"],["#B0185A","#F7DCE8"],["#0F6B6B","#D8ECEB"],["#C9850A","#FBEACB"],["#1F8A4C","#DDF0E4"],["#5B3FA8","#E6E0F5"]];
const ccol=k=>CCOL[k]||PAL[Math.max(0,CATS.findIndex(c=>c[0]===k))%PAL.length];
function ph(p,big,imgIdx=0){
  const [c,t]=ccol(p.category), imgs=p.imgs;
  const img=imgs[imgIdx]?imgTag(imgs[imgIdx],big?1200:600,p.name,!big):"";
  return `<div class="ph" style="--c:${c};--t:${t}"><b>${esc(p.id)}</b><span>Photo coming soon</span>${img}${tags(p)}${!big&&imgs.length>1?`<span class="cnt">${imgs.length} photos</span>`:""}<div class="zari" aria-hidden="true"></div></div>`;
}
const num=v=>Number(String(v||"").replace(/[^\d.]/g,""))||0;
const priceHTML=p=>p.price?inr(p.price)+(p.was?`<s class="was">${inr(p.was)}</s><span class="off">${Math.round((1-p.price/p.was)*100)}% off</span>`:""):"";
const yes=v=>/^(y|yes|true|1|✓|✔|x)$/i.test(String(v||"").trim());
const tags=p=>{const t=p.sold?['<span class="tag sold">Sold out</span>']:[p.isnew?'<span class="tag new">New arrival</span>':"",p.onsale?'<span class="tag sale">Sale</span>':"",p.feat?'<span class="tag feat">Featured</span>':""].filter(Boolean);return t.length?`<span class="tags">${t.join("")}</span>`:""};

// Photos from Cloudinary are sent at the size each screen needs, in the lightest format the phone
// supports, with the top strip (product code label) trimmed off. CROP_TOP = 0 shows the full photo.
// The photos in Cloudinary are not changed. Photos from anywhere else are shown as they are.
const CROP_TOP=5; // % of the photo height trimmed from the top
const pic=(u,w)=>{const m=String(u||"").match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/);
  if(!m||/^[a-z]{1,4}_[^/]*\//.test(m[2]))return u; // not Cloudinary, or already has its own settings
  return m[1]+(CROP_TOP?"c_crop,g_south,w_1.0,h_"+(1-CROP_TOP/100).toFixed(2)+"/":"")+"c_limit,w_"+w+",f_auto,q_auto/"+m[2]};
// if a trimmed photo cannot load, show the original; if that fails too, the placeholder stays
function pfail(i){const o=i.dataset.o;if(o&&i.src!==o){i.removeAttribute("data-o");i.src=o}else i.remove()}
const imgTag=(u,w,alt,lazy)=>`<img src="${esc(pic(u,w))}" data-o="${esc(u)}" alt="${esc(alt)}"${lazy?' loading="lazy"':""} onerror="pfail(this)">`;
// Google Drive share links -> direct image links (the file must be shared "Anyone with the link")
const imgURL=u=>{const m=u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=|thumbnail\?id=)([\w-]{20,})/)||u.match(/docs\.google\.com\/uc\?(?:export=\w+&)?id=([\w-]{20,})/);return m?"https://lh3.googleusercontent.com/d/"+m[1]+"=w1200":u};
const getImgs=o=>{const seen=[];Object.keys(o).filter(k=>/^image_url(_\d+)?$/.test(k)).sort((a,b)=>(parseInt(a.split("_")[2])||1)-(parseInt(b.split("_")[2])||1)).forEach(k=>String(o[k]||"").split(/[\s,|]+/).forEach(u=>{u=imgURL(u.trim());if(u&&!seen.includes(u))seen.push(u)}));return seen.slice(0,8)};
// Products can be in one Catalogue tab or in one tab per category (Sarees, Salwar Suits, ...).
// Every published tab with Product Code + Product Name headings is read and merged; a code that
// appears twice is taken from the first tab only.
const isCat=t=>{const h=(parseCSV(t)[0]||[]).map(hkey);return h.includes("id")&&h.includes("name")};
function readCatalogue(){
  return tabs().then(ts=>{const c=ts.filter(t=>t&&isCat(t));if(!c.length)throw 0;return c})
  .catch(()=>{state.backup=true;const n=$("#note");if(n)n.hidden=false;return fetch(BACKUP_CSV).then(r=>{if(!r.ok)throw 0;return r.text()}).then(t=>[t])})
  .then(parseCat);
}
// Saved copy of the sheet made at each deploy (snapshot.json): the catalogue appears from it at once,
// then the live Google Sheet replaces it a moment later if anything changed.
let _snap;
const snapTabs=()=>_snap||(_snap=fetch("/snapshot.json").then(r=>r.ok?r.json():null).then(j=>j&&j.tabs?SHEET_TABS.map(g=>j.tabs[g]||""):null).catch(()=>null));
function readSnapshot(){return snapTabs().then(ts=>{if(!ts)return null;const c=ts.filter(t=>t&&isCat(t));if(!c.length)return null;
  const ot=ts.find(t=>t&&(parseCSV(t)[0]||[]).map(hkey).includes("headline"));if(ot&&!OFFERS.length)OFFERS=parseOffers(ot);return parseCat(c)})}
function parseCat(texts){
  {
    const seen=new Set();let recs=[],hasShow=false;
    texts.forEach(t=>{const rows=parseCSV(t),head=rows[0].map(hkey);if(head.includes("show"))hasShow=true;
      rows.slice(1).forEach(r=>{const o={};head.forEach((h,i)=>o[h]=(r[i]||"").trim());
        if(o.id&&o.name&&!/^hid/i.test(o.available)&&!seen.has(o.id)){seen.add(o.id);recs.push(o)}})});
    // "Show on Website": only ticked rows appear. If the column is missing or nothing is ticked yet, everything shows.
    if(hasShow&&recs.some(o=>yes(o.show)))recs=recs.filter(o=>yes(o.show));
    setCats(recs);return recs}
}
// Live offers: Show = Yes and today between Start Date and End Date (end date counts until midnight)
let OFFERS=[];
function parseOffers(t){const rows=parseCSV(t),head=(rows[0]||[]).map(hkey),now=new Date();
  return rows.slice(1).map(r=>{const o={};head.forEach((h,i)=>o[h]=(r[i]||"").trim());return o})
    .filter(o=>o.headline&&yes(o.show)).filter(o=>{const a=pdate(o.start_date),b=pdate(o.end_date,true);return(!a||a<=now)&&(!b||now<=b)})}
const offersReady=findTab(h=>h.includes("headline")).then(t=>{if(!t)return [];return OFFERS=parseOffers(t)}).catch(()=>[]);
// Offer with a code (Offers tab: Offer Code, Discount, Min Order, Full Price Only) that applies to this product
const pctText=v=>{v=String(v||"").trim();if(!v)return "";if(/^\d*\.\d+$/.test(v)&&+v<1)return Math.round(+v*100)+"%";if(/^\d+(\.\d+)?$/.test(v))return v+"%";return v};
function offerFor(p){return OFFERS.find(o=>o.offer_code&&!(yes(o.full_price_only)&&p.onsale))}
function offerLine(o){const d=pctText(o.discount),m=num(o.min_order),e=pdate(o.end_date,true);
  return [d?d+" off":"Special offer",m?"orders above "+inr(m):"",e?"till "+e.toLocaleDateString("en-IN",{day:"numeric",month:"short"}):""].filter(Boolean).join(" ")}
const catsReady=$("#grid")?null:readCatalogue().catch(()=>{});
// One product row from the sheet -> the product object used everywhere on the site
const norm=(o,i)=>({...o,i,category:catKey(o.category),...colInfo(o.colours),
  ...(()=>{const mrp=num(o.price),sp=num(o.sale);return sp>0&&sp<mrp?{price:sp,was:mrp,onsale:true}:{price:mrp,was:0,onsale:false}})(),
  coll:(c=>c===c.toLowerCase()?title(c):c)(String(o.collection||"").replace(/\s+/g," ").trim()),
  homecoll:(c=>c===c.toLowerCase()?title(c):c)(String(o.homecoll||"").replace(/\s+/g," ").trim()),
  occ:String(o.occ||"").split(/[,;\/]+/).map(x=>title(x.trim())).filter(Boolean),imgs:getImgs(o),sold:/^sold/i.test(o.available),feat:yes(o.featured),isnew:yes(o.isnew)});
function load(){
  let first=null,snapRecs=null;
  readSnapshot().then(r=>{if(!r||first)return;first="snap";snapRecs=r;state.all=r.map(norm);init()}).catch(()=>{});
  Promise.all([readCatalogue(),offersReady]).then(([recs])=>{
    if(!first){first="live";state.all=recs.map(norm);init();return}
    // already showing the saved copy: switch to the live sheet only if something changed
    if(state.backup||JSON.stringify(recs)===JSON.stringify(snapRecs))return;
    const keep=state.shown;state.all=recs.map(norm);
    if(!inCat().length&&present().length)setCat(present()[0][0],false);else{buildFilters();state.shown=keep;render(true)}
    rvShow();collFooter();
  }).catch(()=>{
    if(!first)$("#count").innerHTML='The catalogue did not load. <button class="linkbtn" onclick="location.reload()">Try again</button>';
  });
}

const present=()=>CATS.filter(c=>state.all.some(p=>p.category===c[0]));
function init(){
  const qs=new URLSearchParams(location.search);
  const m=qs.get("cat")&&CATS.find(c=>c[0]===catKey(qs.get("cat"))); if(m)state.cat=m[0];
  if(qs.get("q")){$("#q").value=qs.get("q");if(!m){const best=present().map(c=>[c[0],state.all.filter(p=>p.category===c[0]&&hit(p,qs.get("q").toLowerCase())).length]).sort((a,b)=>b[1]-a[1])[0];if(best&&best[1])state.cat=best[0]}}
  const it=qs.get("item"),ip=it&&state.all.find(x=>x.id===it); if(ip){location.replace(prodPath(ip));return}
  if(!state.all.some(p=>p.category===state.cat)&&present().length)state.cat=present()[0][0];
  buildHero();
    setCat(state.cat,false);
  const qo=qs.get("occasion");if(qo){const m2=Object.keys(state.oc||{}).find(o=>o.toLowerCase()===qo.toLowerCase());if(m2){sel.occ.add(m2);syncPanel();render()}}
  if(qs.get("q"))document.getElementById("shop").scrollIntoView();
  restoreCat();
  rvShow();collFooter();
}
// Featured carousel: products marked Featured = yes; topped up with a mix from each category
function buildFeatured(){
  const tr=$("#ftrack"); if(!tr)return;
  // Selected category only: Featured products first, then New Arrivals
  const its=inCat().filter(p=>!p.sold);
  const list=its.filter(p=>p.feat).concat(its.filter(p=>p.isnew&&!p.feat));
  $("#feat").hidden=!list.length;
  $("#feath").textContent=list.some(p=>p.feat)?"Featured "+label().toLowerCase():"New "+label().toLowerCase();
  tr.innerHTML=list.map(cardHTML).join("");tr.scrollLeft=0;
  if(tr._ready)return;tr._ready=true;
  const step=()=>{const c=tr.querySelector(".card");return c?c.offsetWidth+parseFloat(getComputedStyle(tr).columnGap||0):300};
  const smooth=()=>matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth";
  const go=d=>{
    if(d>0&&tr.scrollLeft+tr.clientWidth>=tr.scrollWidth-4)tr.scrollTo({left:0,behavior:smooth()});
    else if(d<0&&tr.scrollLeft<=4)tr.scrollTo({left:tr.scrollWidth,behavior:smooth()});
    else tr.scrollBy({left:d*step(),behavior:smooth()});
  };
  $("#fprev").onclick=()=>go(-1);$("#fnext").onclick=()=>go(1);
  let paused=matchMedia("(prefers-reduced-motion: reduce)").matches,hold=false;
  const pb=$("#fpause"),sync=()=>{pb.textContent=paused?"Play":"Pause";pb.setAttribute("aria-pressed",paused)};
  sync();pb.onclick=()=>{paused=!paused;sync()};
  const f=$("#feat");
  f.addEventListener("mouseenter",()=>hold=true);f.addEventListener("mouseleave",()=>hold=false);
  f.addEventListener("focusin",()=>hold=true);f.addEventListener("focusout",()=>hold=false);
  tr.addEventListener("touchstart",()=>hold=true,{passive:true});tr.addEventListener("touchend",()=>setTimeout(()=>hold=false,5000),{passive:true});
  setInterval(()=>{if(!paused&&!hold&&!document.hidden&&!$("#dlg").open)go(1)},5000);
}
// Collage carousel at the top: one slide per collection.
// Slides: every "Home Collection" name first (one slide per name and category), then the biggest
// sub-categories fill the carousel up to HERO_MAX slides.
function buildHero(){
  const box=$("#hcar");if(!box)return;
  const pool=state.all.filter(p=>!p.sold);
  const HERO_MAX=5;
  const score=c=>c.items.filter(p=>p.feat||p.isnew).length*100+c.items.filter(p=>p.imgs.length).length*10+c.items.length;
  const group=(key,name)=>{const g={};pool.forEach(p=>{const n=name(p);if(!n)return;const k=key(p,n);(g[k]=g[k]||{name:n,items:[]}).items.push(p)});return Object.values(g)};
  // named collections ("Festival" salwars and "Festival" kurtis are two slides)
  let list=group((p,n)=>n.toLowerCase()+"|"+p.category,p=>p.homecoll).map(c=>({...c,home:true}));
  // top up with the biggest sub-categories (at least 3 products), preferring categories not shown yet
  const shown=new Set(list.map(c=>c.items[0].category));
  const auto=group((p,n)=>n+"|"+p.category,p=>p.coll).filter(c=>c.items.length>=3);
  const rank=c=>(shown.has(c.items[0].category)?0:100000)+score(c);
  while(list.length<HERO_MAX&&auto.length){let b=0;auto.forEach((c,i)=>{if(rank(c)>rank(auto[b]))b=i});const c=auto.splice(b,1)[0];list.push(c);shown.add(c.items[0].category)}
  if(!list.length){box.closest(".hero").hidden=true;return}
  const catOf=c=>{const n={};c.items.forEach(p=>n[p.category]=(n[p.category]||0)+1);return Object.keys(n).sort((a,b)=>n[b]-n[a])[0]};
  box.innerHTML=list.map((c,i)=>{
    const its=c.items.slice().sort((a,b)=>pri(a)-pri(b)||(a.i-b.i)).slice(0,4);
    const k=catOf(c),cl=CATS.find(x=>x[0]===k)||CATS[0],pr=c.items.map(p=>p.price).filter(Boolean);
    return `<div class="hslide"${i?" hidden":""} role="group" aria-roledescription="slide" aria-label="${i+1} of ${list.length}: ${esc(c.name)}">
      <div class="htext"><p class="hcat">${esc(cl[1])}</p><h1>${esc(c.name)}</h1>
        <p>${c.items.length} ${c.items.length===1?cl[2]:cl[3]}${pr.length?" from "+inr(Math.min(...pr)):""}</p>
        <button class="btn primary" type="button" data-hcat="${esc(k)}" data-hcoll="${c.home?"":esc(c.name)}" data-hhome="${c.home?esc(c.name):""}">Shop this collection</button></div>
      <div class="collage n${its.length}">${its.map(p=>`<a class="open" href="${prodPath(p)}" data-id="${esc(p.id)}" aria-label="${esc(p.name)}">${ph(p,false)}</a>`).join("")}</div></div>`}).join("")+
    (list.length>1?`<div class="hctl"><button class="hnav hprev" type="button" aria-label="Previous collection">&#8249;</button><div class="hdots">${list.map((c,i)=>`<button type="button" data-h="${i}" aria-label="${esc(c.name)}"${i?"":' aria-current="true"'}></button>`).join("")}</div><button class="hnav hnext" type="button" aria-label="Next collection">&#8250;</button></div>`:"");
  const sl=box.querySelectorAll(".hslide");let cur=0,hold=false;
  const show=i=>{cur=(i+sl.length)%sl.length;sl.forEach((s,k)=>s.hidden=k!==cur);box.querySelectorAll(".hdots button").forEach((b,k)=>b.setAttribute("aria-current",k===cur))};
  box.querySelectorAll(".hdots button").forEach(b=>b.onclick=()=>show(+b.dataset.h));
  if(sl.length>1){box.querySelector(".hprev").onclick=()=>show(cur-1);box.querySelector(".hnext").onclick=()=>show(cur+1)}
  box.addEventListener("mouseenter",()=>hold=true);box.addEventListener("mouseleave",()=>hold=false);
  box.addEventListener("focusin",()=>hold=true);box.addEventListener("focusout",()=>hold=false);
  if(sl.length>1&&!matchMedia("(prefers-reduced-motion: reduce)").matches)setInterval(()=>{if(!hold&&!document.hidden&&!$("#dlg").open)show(cur+1)},6000);
  box.addEventListener("click",e=>{const b=e.target.closest("[data-hcat]");if(!b)return;setCat(b.dataset.hcat,true);if(b.dataset.hcoll)sel.type.add(b.dataset.hcoll);if(b.dataset.hhome)sel.home=b.dataset.hhome;if(b.dataset.hcoll||b.dataset.hhome){syncPanel();render()}});
}
function setCat(k,scroll){
  state.cat=k;resetSel();if(scroll&&$("#q").value){$("#q").value="";try{const u=new URL(location.href);u.searchParams.delete("q");history.replaceState(null,"",u)}catch(e){}}
  document.querySelectorAll(".nav a[data-cat]").forEach(a=>a.setAttribute("aria-current",a.dataset.cat===k?"true":"false"));
  try{const u=new URL(location.href);u.searchParams.set("cat",k);u.searchParams.delete("item");history.replaceState(null,"",u)}catch(e){}
  buildFilters();
  if(scroll)document.getElementById("shop").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
}
// Filter panel: tick-boxes for type and fabric, one price band, in-stock
// Quick price buttons above the products
const QUICK=[["0-999","Under ₹1,000"],["1000-1999","₹1,000 – ₹1,999"],["2000-2999","₹2,000 – ₹2,999"],["3000-","₹3,000 & above"]];
const PRICES=[["","Any price"],["0-999","Under ₹1,000"],["1000-1499","₹1,000 to ₹1,499"],["1500-1999","₹1,500 to ₹1,999"],["2000-2999","₹2,000 to ₹2,999"],["3000-","₹3,000 and above"]];
const OCC_ORDER=["Daily Wear","Work Wear","Party Wear","Celebrity Inspired","Traditional Wear","Wedding Wear"];
const OCC_LOOK={"Daily Wear":["#E39B12",'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'],
"Work Wear":["#0F6B6B",'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>'],
"Party Wear":["#B0185A",'<path d="M12 3l2.1 5.4L19.5 10l-5.4 2.1L12 17.5l-2.1-5.4L4.5 10l5.4-1.6z"/>'],
"Celebrity Inspired":["#6B3FA0",'<path d="M12 3l2.6 5.6 6.1.7-4.5 4.1 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.1 6.1-.7z"/>'],
"Traditional Wear":["#B43C18",'<path d="M12 3c2 3 3 5 3 7a3 3 0 0 1-6 0c0-2 1-4 3-7z"/><path d="M4 15c2 3 5 4 8 4s6-1 8-4"/><path d="M6 19h12"/>'],
"Wedding Wear":["#C2185B",'<circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="M10 5l2-2 2 2-2 2z"/>']};
const ALL_ICON='<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>';
const occTile=(v,label,n,c,ic,img)=>`<button class="occ" type="button" data-occ="${esc(v)}" aria-pressed="${v?"false":"true"}" style="--c:${c}"><span class="ocirc"><svg viewBox="0 0 24 24" aria-hidden="true">${ic}</svg>${img?imgTag(img,200,"",true):""}</span><b>${esc(label)}</b><small>${n}</small></button>`;
// Photo for an occasion circle: a product from this category and occasion that has a photo,
// Featured and New Arrival first, avoiding a photo already used by another circle.
function occPhoto(items,used){
  const c=items.filter(p=>p.imgs.length&&!p.sold).sort((a,b)=>pri(a)-pri(b)||(a.i-b.i));
  const p=c.find(p=>!used.has(p.id))||c[0];if(!p)return "";used.add(p.id);return p.imgs[0];
}
const sel={type:new Set(),fab:new Set(),occ:new Set(),price:"",home:""};
function resetSel(){sel.type.clear();sel.fab.clear();sel.occ.clear();sel.price="";sel.home="";["#stock","#newonly","#saleonly"].forEach(x=>{const s=$(x);if(s)s.checked=false})}
const SHOW=8;
function optList(box,key,counts,expanded){
  const keys=Object.keys(counts).sort((a,b)=>counts[b]-counts[a]||a.localeCompare(b));
  const vis=expanded||keys.length<=SHOW+2?keys:keys.slice(0,SHOW);
  box.innerHTML=vis.map(k=>`<label class="fopt"><input type="checkbox" data-f="${key}" value="${esc(k)}"${sel[key].has(k)?" checked":""}><span>${esc(k)}</span><small>${counts[k]}</small></label>`).join("")+
    (vis.length<keys.length?`<button class="more" type="button" data-more="${key}">Show all ${keys.length}</button>`:"")+
    (expanded&&keys.length>SHOW+2?`<button class="more" type="button" data-less="${key}">Show fewer</button>`:"");
}
function buildFilters(){
  buildFeatured();
  const items=inCat(), tc={}, fc={};
  $("#shoph").textContent=label();
  items.forEach(p=>{if(p.coll)tc[p.coll]=(tc[p.coll]||0)+1;if(p.fabric_group)fc[p.fabric_group]=(fc[p.fabric_group]||0)+1});
  state.tc=tc;state.fc=fc;
  optList($("#o-type"),"type",tc,false);$("#g-type").hidden=Object.keys(tc).length<2;
  optList($("#o-fab"),"fab",fc,false);
  const oc={};items.forEach(p=>p.occ.forEach(o=>oc[o]=(oc[o]||0)+1));state.oc=oc;
  const ok=Object.keys(oc).sort((a,b)=>(OCC_ORDER.indexOf(a)+1||99)-(OCC_ORDER.indexOf(b)+1||99)||a.localeCompare(b));
  const used=new Set(),oimg={};ok.forEach(o=>oimg[o]=occPhoto(items.filter(p=>p.occ.includes(o)),used));
  $("#occrow").innerHTML=ok.length?[occTile("","All "+CAT()[3],items.length,"#24180C",ALL_ICON,occPhoto(items,used)),...ok.map(o=>{const L=OCC_LOOK[o]||["#B43C18",ALL_ICON];return occTile(o,o,oc[o],L[0],L[1],oimg[o])})].join(""):"";
  $("#occrow").hidden=!ok.length;
  if($("#o-occ"))$("#o-occ").innerHTML=ok.map(o=>`<label class="fopt"><input type="checkbox" data-f="occ" value="${esc(o)}"><span>${esc(o)}</span><small>${oc[o]}</small></label>`).join("");if($("#g-occ"))$("#g-occ").hidden=!ok.length;$("#g-fab").hidden=Object.keys(fc).length<2;
  const nn=items.filter(p=>p.isnew).length;$("#newopt").hidden=!nn;$("#newn").textContent=nn||"";
  const ns=items.filter(p=>p.onsale).length;$("#saleopt").hidden=!ns;$("#salen").textContent=ns||"";
  $("#o-price").innerHTML=PRICES.map(([v,l])=>`<label class="fopt"><input type="radio" name="price" value="${v}"${sel.price===v?" checked":""}><span>${l}</span></label>`).join("");
  render();
}
// Search looks at name, code, type, fabric, category, collection, occasion, colours and description;
// every word must match ("silk saree", "red anarkali"). Plurals match too (sarees = saree).
const hay=p=>p._h||(p._h=[p.name,p.id,p.coll,p.fabric_group,p.homecoll,(CATS.find(c=>c[0]===p.category)||[])[1],p.category,p.occ.join(" "),p.cnames.join(" "),p.description].join(" ").toLowerCase());
const words=q=>q.toLowerCase().split(/[\s,]+/).filter(Boolean).map(w=>w.length>3?w.replace(/(es|s)$/,""):w);
const hit=(p,q)=>words(q).every(w=>hay(p).includes(w));
const nameHit=(p,q)=>words(q).every(w=>(p.name+" "+p.id).toLowerCase().includes(w));
function priceOK(p){if(!sel.price)return true;const [a,b]=sel.price.split("-");return p.price>=(+a||0)&&(!b||p.price<=+b)}
const FIRST=20, MORE=10;
function render(keep){
  if(!keep)state.shown=FIRST;
  const searching=!!$("#q").value.trim();
  document.body.classList.toggle("searching",searching);
  document.querySelectorAll(".nav a[data-cat]").forEach(a=>a.setAttribute("aria-current",!searching&&a.dataset.cat===state.cat?"true":"false"));
  if(!inCat().length&&!searching){
    $("#count").textContent="Coming soon";$("#active").innerHTML="";
    $("#grid").innerHTML=`<div class="empty"><p>We are adding ${label().toLowerCase()} to the catalogue. Ask us on WhatsApp what is available now.</p><a class="btn wa" href="https://wa.me/${WA}?text=${encodeURIComponent("Hi Tarasvini, do you have "+label().toLowerCase()+" available?")}" target="_blank" rel="noopener">${IC.wa}Ask on WhatsApp</a></div>`;
    return;
  }
  const qv=$("#q").value.trim(), q=qv.toLowerCase(), stock=$("#stock").checked, nw=$("#newonly").checked, so=$("#saleonly").checked, sort=$("#sort").value;
  // searching: every category; the category filters (type, fabric, occasion) are set aside
  let list=searching?state.all.filter(p=>hit(p,q)&&(!stock||!p.sold)&&(!nw||p.isnew)&&(!so||p.onsale)&&priceOK(p)):state.all.filter(p=>p.category===state.cat&&(!sel.type.size||sel.type.has(p.coll))&&(!sel.fab.size||sel.fab.has(p.fabric_group))&&(!sel.occ.size||p.occ.some(o=>sel.occ.has(o)))&&(!sel.home||p.homecoll.toLowerCase()===sel.home.toLowerCase())&&(!stock||!p.sold)&&(!nw||p.isnew)&&(!so||p.onsale)&&priceOK(p)&&(!q||hit(p,q)));
  list.sort((a,b)=>sort==="asc"?a.price-b.price:sort==="desc"?b.price-a.price:(searching?nameHit(b,q)-nameHit(a,q):0)||pri(a)-pri(b)||(a.i-b.i));
  // chips for what is selected
  const chips=searching?[]:[...(sel.home?[["home","","Collection: "+sel.home]]:[]),...[...sel.occ].map(v=>["occ",v,v]),...[...sel.type].map(v=>["type",v,v]),...[...sel.fab].map(v=>["fab",v,v])];
  if(sel.price)chips.push(["price","",(PRICES.concat(QUICK).find(x=>x[0]===sel.price)||["","Price"])[1]]);
  // quick price buttons above the products (only bands that have products in this category)
  const pq=$("#pchips");if(pq){const base=(searching?state.all.filter(x=>hit(x,q)):inCat()).filter(x=>!x.sold||!stock),bands=QUICK.map(([v,l])=>[v,l,base.filter(x=>{const [a,b]=v.split("-");return x.price>=(+a||0)&&(!b||x.price<=+b)}).length]).filter(x=>x[2]);
    pq.innerHTML=bands.length>1?bands.map(([v,l,n])=>`<button class="pchip" type="button" data-pq="${v}" aria-pressed="${sel.price===v}">${l}<small>${n}</small></button>`).join(""):"";pq.hidden=bands.length<2}
  if(nw)chips.push(["newonly","","New arrivals"]);
  if(so)chips.push(["saleonly","","On sale"]);
  if(stock)chips.push(["stock","","In stock only"]);
  if(q)chips.push(["q","",`Search: “${qv}”`]);
  $("#active").innerHTML=chips.length?chips.map(([k,v,l])=>`<button class="achip" type="button" data-rm="${k}" data-v="${esc(v)}" aria-label="Remove ${esc(l)}">${esc(l)}<b aria-hidden="true">×</b></button>`).join("")+'<button class="linkbtn" type="button" onclick="clearFilters()">Clear all</button>':"";
  const n=(sel.home?1:0)+sel.occ.size+sel.type.size+sel.fab.size+(sel.price?1:0)+(stock?1:0)+(nw?1:0)+(so?1:0);
  $("#fcount").textContent=n||"";
  document.querySelectorAll("#occrow .occ").forEach(b=>b.setAttribute("aria-pressed",b.dataset.occ?String(sel.occ.size===1&&sel.occ.has(b.dataset.occ)):String(!sel.occ.size)));
  const res=n=>n+(n===1?" result":" results");
  $("#fdone").textContent=list.length?`Show ${searching?res(list.length):many(list.length)}`:"No matches";
  $("#shoph").textContent=searching?"Search results":label();
  if(searching){const by=present().map(c=>[c,list.filter(p=>p.category===c[0]).length]).filter(x=>x[1]);
    $("#count").textContent=`${res(list.length)} for “${qv}”`+(by.length>1?" · "+by.map(([c,n])=>c[1]+" "+n).join(" · "):"")}
  else $("#count").textContent=many(list.length);
  state.list=list;
  const left=Math.max(0,list.length-state.shown);
  $("#more").hidden=!left;$("#more").textContent=`Show ${Math.min(MORE,left)} more (${left} left)`;
  $("#grid").innerHTML=list.length?list.slice(0,state.shown).map(cardHTML).join(""):searching?`<div class="empty"><p>Nothing matches “${esc(qv)}”. Try another word, or ask us: we may have it.</p><a class="btn wa" href="https://wa.me/${WA}?text=${encodeURIComponent("Hi Tarasvini, do you have: "+qv+"?")}" target="_blank" rel="noopener">${IC.wa}Ask on WhatsApp</a> <button class="btn" type="button" onclick="clearFilters()">Clear search</button></div>`:`<div class="empty"><p>No ${CAT()[3]} match ${q?"“"+esc(qv)+"”":"these filters"}.</p>${q?present().filter(c=>c[0]!==state.cat).map(c=>[c,state.all.filter(p=>p.category===c[0]&&hit(p,q)).length]).filter(x=>x[1]).map(([c,n])=>`<button class="btn" type="button" data-cat="${c[0]}">See ${n} in ${esc(c[1])}</button> `).join(""):""}<button class="btn" type="button" onclick="clearFilters()">Clear filters</button></div>`;
}
// Collapsible filter groups: show how many are picked in each heading; open a group that has a choice
function groupCounts(){document.querySelectorAll("#fpanel details.fgrp").forEach(d=>{const n=d.querySelectorAll("input:checked:not([value=''])").length;
  const s=d.querySelector("summary");let b=s.querySelector(".gcount");if(!b){b=document.createElement("span");b.className="gcount";s.appendChild(b)}
  b.textContent=n?n:"";b.hidden=!n;if(n)d.open=true})}
function syncPanel(){setTimeout(groupCounts);document.querySelectorAll("#fpanel [data-f]").forEach(i=>i.checked=sel[i.dataset.f].has(i.value));document.querySelectorAll("#fpanel [name=price]").forEach(i=>i.checked=i.value===sel.price)}
function openPanel(o){const f=$("#fpanel");f.classList.toggle("is-open",o);$("#ftoggle").setAttribute("aria-expanded",o);document.body.style.overflow=o?"hidden":"";document.body.classList.toggle("panel-open",o);if(o)$("#fclose").focus();else $("#ftoggle").focus()}
const cardHTML=p=>`
    <article class="card${p.sold?" is-sold":""}" data-id="${esc(p.id)}">${heartHTML(p.id)}
      <a class="open" href="${prodPath(p)}" data-id="${esc(p.id)}" aria-label="${esc(p.name)}, ${p.price?inr(p.price):""}">
        ${ph(p)}
        <div class="info">${p.coll?`<p class="ty">${esc(p.coll)}</p>`:""}<h3>${esc(p.name)}</h3>
          <div class="prow"><span class="price">${priceHTML(p)}</span>${cols(p)?`<span class="cols">${cols(p)}</span>`:""}</div></div>
      </a>
      ${p.sold?'<button class="btn order" type="button" disabled>Sold out</button>':`<a class="btn order" href="${waLink(p)}" target="_blank" rel="noopener">${IC.wa}Order on WhatsApp</a>`}
    </article>`;
function clearFilters(){$("#q").value="";resetSel();buildFilters()}
// Product details (photos, price, sizes, colours, description, order buttons). Used on the product page.
function prodHTML(p,h){
  const imgs=p.imgs, v=p.video_url;
  const yt=v&&v.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  const vid=!v?"":yt?`<iframe src="https://www.youtube.com/embed/${yt[1]}" allowfullscreen loading="lazy" title="Video"></iframe>`
    :/\.(mp4|webm)(\?|$)/i.test(v)||/res\.cloudinary\.com.*\/video\//.test(v)?`<video src="${esc(v)}" controls playsinline preload="metadata"></video>`
    :`<p><a href="${esc(v)}" target="_blank" rel="noopener">Watch the video</a></p>`;
  const sizes=String(p.sizes||"").split(/[,\s]+/).filter(Boolean);
  return `<div class="gal">${ph(p,true,0)}
    ${imgs.length>1?`<button class="gnav gprev" type="button" aria-label="Previous photo">&#8249;</button><button class="gnav gnext" type="button" aria-label="Next photo">&#8250;</button><div class="thumbs">${imgs.map((u,i)=>`<button type="button" data-i="${i}" aria-label="Photo ${i+1}">${imgTag(u,200,"",true)}</button>`).join("")}</div>`:""}</div>
  <div class="body">${p.coll?`<p class="ty">${esc(p.coll)}</p>`:""}<${h}>${esc(p.name)}</${h}><div class="price">${p.sold?'<span class="soldnote">Sold out</span> ':""}${priceHTML(p)}</div>${(o=>o&&!p.sold?`<p class="offerline"><b>${esc(o.headline)}</b><span>${esc(offerLine(o))}. Applied when we confirm your order on WhatsApp.</span></p>`:"")(offerFor(p))}
    ${sizes.length?`<div class="opt"><h4>Sizes</h4><div class="sizes">${sizes.map(s=>`<span>${esc(s)}</span>`).join("")}</div></div>`:""}
    ${colHTML(p)}${moreHTML(p)}
    ${p.description?`<div class="desc">${descHTML(p.description)}</div>`:""}
    <dl><dt>Code</dt><dd>${esc(p.id)}</dd>
    ${p.fabric_group?`<dt>Fabric</dt><dd>${esc(p.fabric_group)}</dd>`:""}
    ${p.occ.length?`<dt>Occasion</dt><dd>${esc(p.occ.join(", "))}</dd>`:""}
    ${p.delivery?`<dt>Delivery</dt><dd>${esc(String(p.delivery).replace(/\s*days?$/i,""))} working days</dd>`:""}<dt>Shipping</dt><dd>Free across India</dd></dl>
    ${vid}
    <div class="dacts">${p.sold?'<button class="btn" type="button" disabled>Sold out</button>':`<a class="btn wa" href="${waLink(p)}" target="_blank" rel="noopener">${IC.wa}Order on WhatsApp</a>`}
      ${heartHTML(p.id,true)}<div class="row"><a class="btn" href="${IG_DM}" target="_blank" rel="noopener" data-igcopy="${esc(p.id)}">${IC.ig}Ask on Instagram</a><button class="btn" type="button" data-share="${esc(p.id)}">${IC.sh}Share</button></div></div>
    <div class="policy"><p><strong>Free shipping across India.</strong> Prepaid orders only, no cash on delivery.</p><p>Returns or exchanges only for damaged or wrong items, reported within 24–48 hours with a full, uncut unboxing video. <a href="shipping-returns.html">Shipping and returns</a></p></div>
  </div>`}
// Photo gallery: arrows, thumbnails, swipe on phones, arrow keys
function wireGal(root,p,keys){
  const imgs=p.imgs;let cur=0;
  const g0=root.querySelector(".gal");
  if(imgs.length&&g0){g0.insertAdjacentHTML("beforeend",'<button class="zbtn" type="button" aria-label="Zoom photo"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M11 8v6M8 11h6"/></svg></button>');
    g0.addEventListener("click",e=>{if(e.target.closest(".zbtn")||e.target.matches(".ph img"))openZoom(p,cur)})}
  const show=i=>{cur=(i+imgs.length)%imgs.length;const w=root.querySelector(".gal .ph"),old=w.querySelector("img");if(old)old.remove();
    const im=document.createElement("img");im.dataset.o=imgs[cur];im.src=pic(imgs[cur],1200);im.alt=p.name+", photo "+(cur+1);im.onerror=()=>pfail(im);w.insertBefore(im,w.querySelector(".zari"));
    root.querySelectorAll(".thumbs button").forEach((b,k)=>b.setAttribute("aria-current",k===cur))};
  if(imgs.length<2)return;
  root.querySelectorAll(".thumbs button").forEach(b=>b.onclick=()=>show(+b.dataset.i));
  root.querySelector(".gprev").onclick=()=>show(cur-1);root.querySelector(".gnext").onclick=()=>show(cur+1);
  keys.onkeydown=e=>{if(e.target.closest&&e.target.closest("input,textarea,select"))return;if(e.key==="ArrowLeft")show(cur-1);if(e.key==="ArrowRight")show(cur+1)};
  let x0=null;const g=root.querySelector(".gal");
  g.addEventListener("touchstart",e=>{x0=e.touches[0].clientX},{passive:true});
  g.addEventListener("touchend",e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>40)show(cur+(dx<0?1:-1));x0=null});
  root.querySelectorAll(".thumbs button")[0].setAttribute("aria-current","true");
}
// Catalogue: remember the category, filters and scroll position when a product is opened,
// so the Back button returns to the same place in the list.
function saveCat(){try{sessionStorage.setItem("catState",JSON.stringify({cat:state.cat,type:[...sel.type],fab:[...sel.fab],occ:[...sel.occ],price:sel.price,home:sel.home,
  q:$("#q").value,sort:$("#sort").value,stock:$("#stock").checked,nw:$("#newonly").checked,so:$("#saleonly").checked,shown:state.shown,y:scrollY}))}catch(e){}}
function restoreCat(){
  let st=null;try{st=JSON.parse(sessionStorage.getItem("catState")||"null");sessionStorage.removeItem("catState")}catch(e){}
  const nav=(performance.getEntriesByType&&performance.getEntriesByType("navigation")[0])||{};
  if(!st||nav.type!=="back_forward"||st.cat!==state.cat)return;
  ["type","fab","occ"].forEach(k=>{sel[k].clear();(st[k]||[]).forEach(v=>sel[k].add(v))});sel.price=st.price||"";sel.home=st.home||"";
  $("#q").value=st.q||"";$("#sort").value=st.sort||"featured";$("#stock").checked=!!st.stock;$("#newonly").checked=!!st.nw;$("#saleonly").checked=!!st.so;
  syncPanel();state.shown=Math.max(FIRST,st.shown||FIRST);render(true);
  requestAnimationFrame(()=>scrollTo(0,st.y||0));
}

document.addEventListener("click",e=>{
  if(!$("#grid"))return;
  const ob=e.target.closest("#occrow .occ");
  if(ob){sel.occ.clear();if(ob.dataset.occ)sel.occ.add(ob.dataset.occ);syncPanel();render();return}
  const rm=e.target.closest("[data-rm]");
  if(rm){const k=rm.dataset.rm,v=rm.dataset.v;if(k==="type"||k==="fab"||k==="occ")sel[k].delete(v);else if(k==="home")sel.home="";else if(k==="price")sel.price="";else if(k==="stock")$("#stock").checked=false;else if(k==="newonly")$("#newonly").checked=false;else if(k==="saleonly")$("#saleonly").checked=false;else if(k==="q")$("#q").value="";
    syncPanel();render();return}
  const mo=e.target.closest("[data-more],[data-less]");
  if(mo){const k=mo.dataset.more||mo.dataset.less;optList($(k==="type"?"#o-type":"#o-fab"),k,k==="type"?state.tc:state.fc,!!mo.dataset.more);return}
  const pqb=e.target.closest("[data-pq]");
  if(pqb){sel.price=sel.price===pqb.dataset.pq?"":pqb.dataset.pq;syncPanel();render();return}
  if(e.target.closest("[data-rvclear]")){RV=[];rvSave();rvShow();return}
  const t=e.target.closest("[data-cat]");
  if(t&&!e.metaKey&&!e.ctrlKey){e.preventDefault();setCat(t.dataset.cat,true);return}
  if(e.target.closest("a.open"))saveCat();
});
document.querySelectorAll("[data-wa]").forEach(a=>a.href=waLink(null));
const stars=n=>"★".repeat(n)+"☆".repeat(5-n);
function videoHTML(v){
  if(!v)return "";
  const yt=v.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  if(yt)return `<iframe src="https://www.youtube.com/embed/${yt[1]}" allowfullscreen loading="lazy" title="Video"></iframe>`;
  if(/\.(mp4|webm)(\?|$)/i.test(v)||/res\.cloudinary\.com.*\/video\//.test(v))return `<video src="${esc(v)}" controls playsinline preload="metadata"></video>`;
  return `<p><a href="${esc(v)}" target="_blank" rel="noopener">Watch video</a></p>`;
}
function loadReviews(){
  if(!REVIEWS_URL){renderReviews([]);return}
  fetch(REVIEWS_URL).then(r=>{if(!r.ok)throw 0;return r.text()}).then(t=>{
    const rows=parseCSV(t), head=rows[0].map(x=>x.trim().toLowerCase());
    renderReviews(rows.slice(1).map(r=>{const o={};head.forEach((k,i)=>o[k]=(r[i]||"").trim());return o})
      .filter(o=>o.message&&o.name&&!/^n/i.test(o.show)).reverse());
  }).catch(()=>renderReviews([],true));
}
// Review dates: show as "13 Oct 2026" whatever way they were typed (also fixes "1310/2026")
function revDate(v){v=String(v||"").trim();const m=v.match(/^(\d{2})(\d{2})[\/.\-](\d{4})$/);if(m)v=m[1]+"/"+m[2]+"/"+m[3];
  const d=pdate(v);return d&&!isNaN(d)?d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):v}
function renderReviews(list,err){
  const box=$("#revlist");
  if(!list.length){box.innerHTML=`<p class="empty">${err?"Reviews could not be loaded right now.":"No reviews yet. Be the first to share yours."}</p>`;$("#revsum").textContent="";return}
  const rated=list.map(r=>Math.min(5,Math.max(0,parseInt(r.rating)||0))).filter(Boolean);
  $("#revsum").textContent=(rated.length?(rated.reduce((a,b)=>a+b,0)/rated.length).toFixed(1)+" out of 5 from ":"")+list.length+(list.length===1?" review":" reviews");
  box.innerHTML=list.map(r=>{
    const n=Math.min(5,Math.max(0,parseInt(r.rating)||0));
    const imgs=[r.image_url,r.image_url_2].filter(Boolean);
    return `<article class="rev">
      ${n?`<div class="st" role="img" aria-label="${n} out of 5 stars">${stars(n)}</div>`:""}
      <p>${esc(r.message)}</p>
      ${imgs.length?`<div class="rimgs">${imgs.map(u=>`<button class="rimgb" data-big="${esc(u)}" aria-label="View photo larger"><img src="${esc(u)}" alt="Photo from ${esc(r.name)}" loading="lazy" onerror="this.closest('button').remove()"></button>`).join("")}</div>`:""}
      ${videoHTML(r.video_url)}
      <div class="by">${esc(r.name)}${r.date?" · "+esc(revDate(r.date)):""}</div>
    </article>`}).join("");
}
function wireForm(id,statId,ok){
  const f=$(id),s=$(statId);
  f.addEventListener("submit",e=>{
    e.preventDefault();
    const b=f.querySelector("[type=submit]");b.disabled=true;s.textContent="Sending…";
    const multi=f.enctype==="multipart/form-data",fd=new FormData(f);
    fetch("/",{method:"POST",...(multi?{}:{headers:{"Content-Type":"application/x-www-form-urlencoded"}}),body:multi?fd:new URLSearchParams(fd)})
      .then(r=>{if(!r.ok)throw 0;f.reset();s.textContent=ok})
      .catch(()=>{s.innerHTML='Could not send. Please message us on <a href="'+waLink(null)+'" target="_blank" rel="noopener">WhatsApp</a> instead.'})
      .finally(()=>{b.disabled=false});
  });
}
document.addEventListener("click",e=>{
  const g=e.target.closest(".rimgb");
  if(g){const l=$("#lb");l.querySelector("img").src=g.dataset.big;l.showModal()}
  if(e.target.id==="lb")e.target.close();
});
if($("#cform"))wireForm("#cform","#cstat","Thank you. We have your message and will reply soon.");
if($("#revform"))wireForm("#revform","#revstat","Thank you. We will show your review after we check it.");
if($("#revlist"))loadReviews();
const IC={"ig": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><circle cx=\"17.2\" cy=\"6.8\" r=\".6\" fill=\"currentColor\"/></svg>", "wa": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M20 11.5a8 8 0 0 1-11.9 7L4 20l1.5-4A8 8 0 1 1 20 11.5z\"/><path d=\"M9.2 8.8c.3 2.4 2.5 4.6 5 5l1-1.2-1.7-.9-.8.6c-.9-.4-1.6-1.1-2-2l.6-.8-.9-1.7z\"/></svg>", "sh": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"18\" cy=\"5\" r=\"2.6\"/><circle cx=\"6\" cy=\"12\" r=\"2.6\"/><circle cx=\"18\" cy=\"19\" r=\"2.6\"/><path d=\"M8.3 10.8l7.4-4.4M8.3 13.2l7.4 4.4\"/></svg>"};
const IG_DM="https://ig.me/m/tarasvini";
function toast(t,ms){const d=document.createElement("div");d.className="toast";d.setAttribute("role","status");d.textContent=t;(document.querySelector("dialog[open]")||document.body).appendChild(d);setTimeout(()=>d.remove(),ms||2500)}
// Instagram DM links cannot carry a message, so copy the product details for the customer to paste.
function copyText(t){let ok=false;try{const a=document.createElement("textarea");a.value=t;a.setAttribute("readonly","");a.style.cssText="position:fixed;opacity:0;top:0";(document.querySelector("dialog[open]")||document.body).appendChild(a);a.select();ok=document.execCommand("copy");a.remove()}catch(e){}
  if(!ok&&navigator.clipboard)navigator.clipboard.writeText(t).catch(()=>{});return true}
document.addEventListener("click",e=>{const a=e.target.closest("[data-igcopy]");if(!a)return;const p=state.all.find(x=>x.id===a.dataset.igcopy);if(!p)return;
  copyText(prodMsg(p,a.dataset.igintro==="colours"?"Hi Tarasvini, please share all the colours and sizes of:":"Hi Tarasvini, I'd like to know about:"));
  toast("Product details copied. Paste them in the Instagram chat.",4000)},true);
function share(d){
  let s=document.getElementById("shr");
  if(!s){
    s=document.createElement("dialog");s.id="shr";s.setAttribute("aria-label","Share");
    s.innerHTML=`<button class="x" type="button" aria-label="Close" onclick="this.closest('dialog').close()">×</button><div class="shbody"><h2>Share</h2><p class="meta" id="shname"></p><input id="shurl" readonly aria-label="Link to share"><div class="shbtns"><a class="btn primary" id="shwa" target="_blank" rel="noopener">${IC.wa}Share on WhatsApp</a><button class="btn" type="button" id="shcp">${IC.sh}Copy link</button><a class="btn" id="shig" href="https://www.instagram.com/tarasvini/" target="_blank" rel="noopener">${IC.ig}Visit our Instagram</a><button class="btn" type="button" id="shmore" hidden>More options</button></div></div>`;
    document.body.appendChild(s);
    s.addEventListener("click",e=>{if(e.target===s)s.close()});
    s.querySelector("#shcp").onclick=async()=>{
      const i=s.querySelector("#shurl"),b=s.querySelector("#shcp");let ok=false;
      try{await navigator.clipboard.writeText(i.value);ok=true}catch(e){}
      if(!ok){i.focus();i.select();try{ok=document.execCommand("copy")}catch(e){}}
      b.lastChild.textContent=ok?"Link copied":"Press Ctrl+C to copy";
      setTimeout(()=>{b.lastChild.textContent="Copy link"},2500);
    };
    s.querySelector("#shmore").onclick=()=>{try{navigator.share(s._d)}catch(e){}};
    if(navigator.share)s.querySelector("#shmore").hidden=false;
  }
  s._d=d;
  s.querySelector("#shname").textContent=d.text;
  s.querySelector("#shurl").value=d.url;
  s.querySelector("#shwa").href="https://wa.me/?text="+encodeURIComponent(d.text+"\n"+d.url);
  s.querySelector("#shcp").lastChild.textContent="Copy link";
  s.showModal();
}
document.addEventListener("click",e=>{
  const s=e.target.closest("[data-share]");
  if(s){const p=state.all.find(x=>x.id===s.dataset.share);if(p)share({title:p.name+" | Tarasvini",text:p.name+(p.price?" for "+inr(p.price):"")+" at Tarasvini",url:itemURL(p)});return}
  if(e.target.closest("[data-sharesite]"))share({title:"Tarasvini",text:"Sarees, salwars, anarkalis, kurtis, gowns and lehengas at Tarasvini",url:location.origin+location.pathname.replace(/[^/]*$/,"")});
});

if($("#grid")){
  $("#sort").addEventListener("change",()=>render());
  let wasEmpty=!$("#q").value.trim();
  $("#q").addEventListener("input",()=>{const v=$("#q").value.trim();if(v&&wasEmpty){const sh=document.getElementById("shop");if(sh.getBoundingClientRect().top>innerHeight*.6)sh.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})}wasEmpty=!v;render();try{const u=new URL(location.href),v=$("#q").value.trim();if(v)u.searchParams.set("q",v);else u.searchParams.delete("q");history.replaceState(null,"",u)}catch(e){}});
  $("#fpanel").addEventListener("change",e=>{const t=e.target;
    if(t.dataset.f){sel[t.dataset.f][t.checked?"add":"delete"](t.value)}else if(t.name==="price")sel.price=t.value;
    render()});
  $("#clr").onclick=clearFilters;
  $("#more").onclick=()=>{const n=state.shown;state.shown+=MORE;render(true);const c=$("#grid").children[n];if(c){const l=c.querySelector("a,button");if(l)l.focus({preventScroll:true})}};
  // Desktop: the button docks/undocks the filter panel (remembered); phone: it opens the full-screen panel
  const wide=()=>matchMedia("(min-width:901px)").matches;
  const dock=on=>{document.body.classList.toggle("fhide",!on);$("#ftoggle").setAttribute("aria-expanded",on);
    $("#ftlabel").textContent=wide()&&on?"Hide filters":"Filters";try{localStorage.setItem("filtersHidden",on?"":"1")}catch(e){}};
  let hidden=false;try{hidden=!!localStorage.getItem("filtersHidden")}catch(e){}
  dock(!hidden);
  matchMedia("(min-width:901px)").addEventListener("change",()=>dock(!document.body.classList.contains("fhide")));
  $("#ftoggle").onclick=()=>wide()?dock(document.body.classList.contains("fhide")):openPanel(true);$("#fclose").onclick=()=>openPanel(false);
  $("#fdone").onclick=()=>{openPanel(false);document.getElementById("shop").scrollIntoView()};
  addEventListener("keydown",e=>{if(e.key==="Escape"&&$("#fpanel").classList.contains("is-open"))openPanel(false)});
  $("#hsearch").addEventListener("submit",e=>{e.preventDefault();render();document.getElementById("shop").scrollIntoView()});
  const setH=()=>{const h=$("#siteh");document.documentElement.style.setProperty("--hh",(getComputedStyle(h).position==="sticky"?h.offsetHeight:0)+"px")};
  setH();addEventListener("resize",setH);
  load();
}

// ---- Offer banner: rows from the Offers tab with Show = Yes and today between Start and End ----
function pdate(v,end){v=String(v||"").trim();if(!v)return null;let m,d;
  if(/^\d{5}(\.\d+)?$/.test(v)){const t=new Date(1899,11,30);t.setDate(t.getDate()+Math.floor(+v));d=t}  // spreadsheet day number, e.g. 46310 = 15 Oct 2026
  else if(m=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))d=new Date(+m[1],m[2]-1,+m[3]);
  else if(m=v.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/)){let dd=+m[1],mm=+m[2];if(mm>12&&dd<=12)[dd,mm]=[mm,dd];d=new Date(+(m[3].length==2?"20"+m[3]:m[3]),mm-1,dd)}
  else{const t=Date.parse(v);if(isNaN(t))return null;d=new Date(t)}
  if(end)d.setHours(23,59,59,999);return d}
const OCOL={red:"#B43C18",sindoor:"#B43C18",pink:"#B0185A",rani:"#B0185A",magenta:"#B0185A",teal:"#0F6B6B",green:"#0F6B6B",peacock:"#0F6B6B",gold:"#9A6200",yellow:"#9A6200",marigold:"#9A6200",brown:"#24180C",dark:"#24180C",black:"#24180C"};
function offerLink(o){const l=String(o.button_link||"").trim(),k=l.toLowerCase();
  if(!l)return o.button_text?["index.html#shop",false]:null;
  if(/^https?:\/\//i.test(l))return[l,true];
  if(/^(insta|instagram|instagram dm|insta dm|dm)$/.test(k))return[IG_DM,true];
  if(/^instagram (page|profile)$/.test(k))return["https://www.instagram.com/tarasvini/",true];
  if(/whats\s*app/.test(k))return["https://wa.me/"+WA+"?text="+encodeURIComponent("Hi Tarasvini, I'd like to know more about your offer: "+o.headline),true];
  const c=CATS.find(c=>[c[0],c[1],c[2],c[3]].some(x=>x.toLowerCase()===k)||c[0].toLowerCase()+"s"===k);
  if(c)return["index.html?cat="+encodeURIComponent(c[0]),false];
  return["index.html?item="+encodeURIComponent(l),false]}
function loadOffers(){
  const box=$("#offers");if(!box)return;
  Promise.all([offersReady,catsReady]).then(([list])=>{if(!list.length)return;const now=new Date();
    let key="";try{key=list.map(o=>o.headline).join("|");if(sessionStorage.getItem("offerClosed")===key)return}catch(e){}
    if(!list.length)return;
    const fmt=d=>d.toLocaleDateString("en-IN",{day:"numeric",month:"short"});
    box.innerHTML=list.map((o,i)=>{const b=pdate(o.end_date,true),lk=offerLink(o),today=b&&b.toDateString()===now.toDateString();
      return `<div class="offer"${i?" hidden":""} data-c="${esc(OCOL[String(o.colour||o.color||"").toLowerCase()]||(/^#[0-9a-f]{6}$/i.test(o.colour||"")?o.colour:"#B43C18"))}">
        <h2>${esc(o.headline)}</h2>${o.details?`<p>${esc(o.details)}</p>`:""}${b?`<span class="until">${today?"Ends today":"Ends "+fmt(b)}</span>`:""}
        ${lk?`<a class="btn" href="${esc(lk[0])}"${lk[1]?' target="_blank" rel="noopener"':""}>${esc(o.button_text||"Shop now")}</a>`:""}</div>`}).join("")+
      (list.length>1?`<div class="odots">${list.map((o,i)=>`<button type="button" data-o="${i}" aria-label="Offer ${i+1}"${i?"":' aria-current="true"'}></button>`).join("")}</div>`:"")+
      '<button class="ox" type="button" aria-label="Close offer">×</button><div class="zari" aria-hidden="true"></div>';
    box.classList.toggle("multi",list.length>1);
    let cur=0,hold=false;const all=box.querySelectorAll(".offer");
    const show=i=>{cur=(i+all.length)%all.length;all.forEach((el,k)=>el.hidden=k!==cur);box.style.setProperty("--oc",all[cur].dataset.c);
      box.querySelectorAll(".odots button").forEach((b,k)=>b.setAttribute("aria-current",k===cur))};
    show(0);box.hidden=false;
    box.querySelectorAll(".odots button").forEach(b=>b.onclick=()=>show(+b.dataset.o));
    box.querySelector(".ox").onclick=()=>{box.hidden=true;try{sessionStorage.setItem("offerClosed",key)}catch(e){}};
    box.addEventListener("mouseenter",()=>hold=true);box.addEventListener("mouseleave",()=>hold=false);
    if(all.length>1&&!matchMedia("(prefers-reduced-motion: reduce)").matches)setInterval(()=>{if(!hold&&!document.hidden&&!box.hidden)show(cur+1)},6000);
  }).catch(()=>{});
}
loadOffers();

// ---------- "How to order" guide: 3 slides. Opens once on a first visit; reopen from the menu. ----------
const GUIDE=[
 {c:"#B0185A",h:"Pick your favourites",p:"Browse the catalogue and tap any product to see photos, sizes, colours and the delivery time.",
  l:['Tap the <span class="ghrt" aria-hidden="true">&#9829;</span> on any product to save it to your <b>Shortlist</b>',"Use the filters to find your occasion"],chips:()=>CATS.slice(0,2).map(c=>c[1].split(" ")[0]).concat(["\u2665 Shortlist"]),
  svg:'<path d="M20 8h24l8 10-6 6v32H18V24l-6-6z"/><path d="M26 8c0 4 3 7 6 7s6-3 6-7"/>'},
 {c:"#1F8A4C",h:"Order and pay on WhatsApp or Instagram",p:"Tap “Order on WhatsApp” or send us a DM on Instagram. We confirm stock, size and the total, then share the payment details.",
  l:["Liked a few? Open your <b>Shortlist</b> and send them all in one message","Prepaid orders only, no cash on delivery","Pay only to the details we send you"],chips:()=>["WhatsApp","Instagram"],
  svg:'<path d="M54 31a22 22 0 0 1-32.7 19.2L10 54l4-11A22 22 0 1 1 54 31z"/><path d="M25 25c1 6 6 11 12 12l3-3-5-3-2 2c-2.5-1-4.5-3-5.5-5.5l2-2-3-5z"/>'},
 {c:"#E39B12",h:"Delivery and unboxing",p:"Your order reaches you in 7–15 working days.",
  l:["Record a full, uncut unboxing video","Damaged or wrong item? Tell us within 24–48 hours with the video"],chips:()=>["7–15 days"],
  svg:'<path d="M10 22l22-10 22 10v22L32 54 10 44z"/><path d="M10 22l22 10 22-10M32 32v22"/><circle cx="46" cy="46" r="8" fill="#fff" stroke="none"/><path d="M43.5 42.5v7l6-3.5z" fill="#E39B12" stroke="none"/>'}];
function openGuide(){
  let d=$("#guide");
  if(!d){d=document.createElement("dialog");d.id="guide";d.setAttribute("aria-label","How to order");document.body.appendChild(d);
    d.addEventListener("click",e=>{if(e.target===d)d.close()});
    let x0=null;d.addEventListener("touchstart",e=>x0=e.touches[0].clientX,{passive:true});
    d.addEventListener("touchend",e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>50)show(d.i+(dx<0?1:-1))});
    d.addEventListener("keydown",e=>{if(e.key==="ArrowRight")show(d.i+1);if(e.key==="ArrowLeft")show(d.i-1)});
    d.addEventListener("close",()=>{try{localStorage.setItem("guideSeen2","1")}catch(e){}});
  }
  const show=i=>{if(i<0||i>=GUIDE.length)return;d.i=i;const s=GUIDE[i],last=i===GUIDE.length-1;d.style.setProperty("--gc",s.c);
    d.innerHTML=`<button class="gx" type="button" aria-label="Close">×</button>
    <div class="gvis"><span class="gnum" aria-hidden="true">0${i+1}</span><div class="gic"><svg viewBox="0 0 64 64" aria-hidden="true">${s.svg}</svg></div><div class="gchips">${s.chips().map(c=>`<span>${esc(c)}</span>`).join("")}</div></div>
    <div class="gbody"><span class="gkick">How to order · ${i+1} of ${GUIDE.length}</span><h2>${s.h}</h2><p>${s.p}</p><ul>${s.l.map(x=>`<li>${x}</li>`).join("")}</ul>
    <div class="gfoot"><div class="gdots">${GUIDE.map((_,k)=>`<button type="button" data-g="${k}" aria-label="Step ${k+1}"${k===i?' aria-current="true"':""}></button>`).join("")}</div>
    ${last?'<button class="gbtn ggo" type="button" data-gend>Start shopping</button>':'<button class="gbtn gskip" type="button" data-gskip>Skip</button><button class="gbtn gnext" type="button" data-gnext>Next</button>'}</div></div>`;
    d.querySelector(".gx").onclick=()=>d.close();
    d.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>show(+b.dataset.g));
    const n=d.querySelector("[data-gnext]");if(n)n.onclick=()=>show(i+1);
    const sk=d.querySelector("[data-gskip]");if(sk)sk.onclick=()=>d.close();
    const g=d.querySelector("[data-gend]");if(g)g.onclick=()=>{d.close();const sh=document.getElementById("shop");if(sh)sh.scrollIntoView({behavior:"smooth"});else location.href="index.html#shop"};
    d.tabIndex=-1;d.focus({preventScroll:true})};
  if(!d.open)d.showModal();show(0);
}
(function(){
  const nav=document.querySelector(".nav"),sep=nav&&nav.querySelector(".sep");
  if(sep){const a=document.createElement("a");a.className="pg";a.href="#how-to-order";a.textContent="How to order";sep.after(a)}
  document.addEventListener("click",e=>{const l=e.target.closest('a[href$="#how-to-order"]');if(l&&!e.metaKey&&!e.ctrlKey){e.preventDefault();openGuide()}});
  if(location.hash==="#how-to-order"){openGuide();return}
  let seen=false;try{seen=!!localStorage.getItem("guideSeen2")}catch(e){seen=true}
  // first visit only; never on top of a shared product link
  if(!seen&&!new URLSearchParams(location.search).get("item")&&!document.querySelector(".pdp"))setTimeout(()=>{const p=$("#dlg");if(!(p&&p.open))openGuide()},2000);
})();

if($("#fpanel"))$("#fpanel").addEventListener("change",()=>setTimeout(groupCounts));

// ---------- Product and category pages (/p/...html, sarees.html, ...) ----------
// These pages are created on each deploy, so their prices can be out of date. When a page opens,
// the latest price, sale price, Sold out and offer are read from the Google Sheet and put on the page.
// If the sheet cannot be reached (saved copy in use), the page is left as it was built.
if(!$("#grid")&&catsReady)catsReady.then(recs=>{if(!recs||!recs.length)return;if(!state.all.length)state.all=recs.map(norm);collFooter();collPage();newPage();if(!document.querySelector(".pdp"))return;rvShow()}).catch(()=>{});
if(!$("#grid")&&catsReady&&document.querySelector(".pdp,article.card[data-id]"))Promise.all([catsReady,offersReady]).then(([recs])=>{
  if(!recs||!recs.length)return;
  const pd0=document.querySelector(".pdp");
  // saved copy in use: keep built pages as they are; only a page without built details uses it
  if(state.backup&&!(pd0&&!pd0.dataset.id))return;
  const byId={};recs.forEach((o,i)=>{byId[o.id]=norm(o,i)});state.all=Object.values(byId);
  const orderBtn=(p,cls)=>p.sold?`<button class="btn${cls==="order"?" order":""}" type="button" disabled>Sold out</button>`:`<a class="btn ${cls}" href="${waLink(p)}" target="_blank" rel="noopener">${IC.wa}Order on WhatsApp</a>`;
  const setTags=(ph,p)=>{if(!ph)return;const t=ph.querySelector(".tags");if(t)t.remove();const n=tags(p);if(n)ph.insertAdjacentHTML("beforeend",n)};
  // product page: show the full, live details (same as the catalogue). The page found by its code,
  // or for a product added after the last deploy, by the end of the address (/p/<name>-<code>.html).
  const pd=document.querySelector(".pdp");
  if(pd){
    const want=pd.dataset.id||new URLSearchParams(location.search).get("item")||"";
    const path=(location.pathname.match(/\/p\/([^/]+?)(?:\.html)?$/)||[])[1]||"";
    const p=byId[want]||state.all.filter(x=>path&&(path===slugify(x.id)||path.endsWith("-"+slugify(x.id)))).sort((a,b)=>slugify(b.id).length-slugify(a.id).length)[0];
    if(p)showPDP(pd,p);
    else if(!pd.dataset.id)pd.innerHTML=`<div class="empty"><p>This product is no longer in our catalogue.</p><a class="btn primary" href="index.html">See all products</a> <a class="btn" href="https://wa.me/${WA}" target="_blank" rel="noopener">${IC.wa}Ask on WhatsApp</a></div>`;
  }
  // product cards ("More kurtis", category pages)
  document.querySelectorAll("article.card[data-id]").forEach(c=>{const q=byId[c.dataset.id];if(!q)return;
    c.classList.toggle("is-sold",q.sold);const pr=c.querySelector(".price");if(pr)pr.innerHTML=priceHTML(q);
    setTags(c.querySelector(".ph"),q);const b=c.querySelector(".btn.order");if(b)b.outerHTML=orderBtn(q,"order")});
}).catch(()=>{});

// ---------- Shortlist: customers tap the heart on products they like, then send the whole list ----------
// Saved in the customer's own browser only (nothing is sent to us until they press Send).
const SL_MAX=20;
let SL=[];try{SL=JSON.parse(localStorage.getItem("shortlist")||"[]").filter(x=>typeof x==="string").slice(0,SL_MAX)}catch(e){}
const slSave=()=>{try{localStorage.setItem("shortlist",JSON.stringify(SL))}catch(e){}};
function heartHTML(id,big){const on=SL.includes(id);
  return `<button class="heart${big?" big":""}" type="button" data-heart="${esc(id)}" aria-pressed="${on}" aria-label="${on?"Remove from":"Add to"} shortlist"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.4-4.5-9.2-9.1C1.6 7.6 3.7 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.3 0 5.4 3.1 4.2 6.4C19.4 15.5 12 20 12 20z"/></svg>${big?`<span>${on?"In your shortlist":"Add to shortlist"}</span>`:""}</button>`}
function slSync(){
  document.querySelectorAll("[data-heart]").forEach(b=>{const on=SL.includes(b.dataset.heart);b.setAttribute("aria-pressed",on);b.setAttribute("aria-label",(on?"Remove from":"Add to")+" shortlist");
    const t=b.querySelector("span");if(t)t.textContent=on?"In your shortlist":"Add to shortlist"});
  const pill=$("#slpill");if(pill){pill.hidden=!SL.length;pill.querySelector("b").textContent=SL.length}}
const getProds=()=>state.all.length?Promise.resolve(state.all):(catsReady||readCatalogue()).then(r=>(r||[]).map(norm));
// floating buttons on every page: shortlist (when it has something) and WhatsApp chat
(function(){
  const f=document.createElement("div");f.className="fab";
  f.innerHTML=`<button class="slpill" id="slpill" type="button" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.4-4.5-9.2-9.1C1.6 7.6 3.7 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.3 0 5.4 3.1 4.2 6.4C19.4 15.5 12 20 12 20z"/></svg>Shortlist <b>0</b></button><a class="wafab" href="${waLink(null)}" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">${IC.wa}</a>`;
  document.body.appendChild(f);
  // product cards on product and category pages get a heart too
  document.querySelectorAll("article.card[data-id]").forEach(c=>{if(!c.querySelector("[data-heart]"))c.insertAdjacentHTML("afterbegin",heartHTML(c.dataset.id))});
  const pd=document.querySelector(".pdp[data-id]"),da=pd&&pd.querySelector(".dacts > .btn");
  if(da)da.insertAdjacentHTML("afterend",heartHTML(pd.dataset.id,true));
  slSync();
})();
document.addEventListener("click",e=>{
  const h=e.target.closest("[data-heart]");
  if(h){e.preventDefault();e.stopPropagation();const id=h.dataset.heart,on=SL.includes(id);
    if(on)SL=SL.filter(x=>x!==id);else{if(SL.length>=SL_MAX){toast("Your shortlist is full ("+SL_MAX+" items). Remove one to add more.",3500);return}SL.push(id)}
    slSave();slSync();if(!on)toast("Added to your shortlist ♥");if($("#sl")&&$("#sl").open)slRender();return}
  if(e.target.closest("#slpill"))openShortlist();
},true);
addEventListener("storage",e=>{if(e.key==="shortlist"){try{SL=JSON.parse(e.newValue||"[]")}catch(x){SL=[]}slSync()}});
function slMsg(items,total){
  const o=OFFERS.find(o=>o.offer_code&&(!num(o.min_order)||total>=num(o.min_order)));
  return [pic(items[0].imgs[0]||"",600),"Hi Tarasvini, I'd like to order these from my shortlist:",""].filter((x,i)=>x||i).concat(
    items.map((p,i)=>[(i+1)+". "+p.name,"Code: "+p.id+(p.price?" · "+inr(p.price):""),"Link: "+itemURL(p),""].join("\n")),
    ["Total: "+inr(total)+" ("+items.length+(items.length===1?" item)":" items)"),o?"Offer: "+o.offer_code+(pctText(o.discount)?" ("+pctText(o.discount)+" off)":""):"","Size and colour: ","Please confirm availability and delivery."].filter(Boolean)).join("\n")}
function slRender(){
  const d=$("#sl");getProds().then(all=>{
    const by={};all.forEach(p=>by[p.id]=p);
    const gone=SL.filter(id=>!by[id]);if(gone.length&&all.length){SL=SL.filter(id=>by[id]);slSave();slSync()}
    const list=SL.map(id=>by[id]).filter(Boolean),ok=list.filter(p=>!p.sold),total=ok.reduce((a,p)=>a+(p.price||0),0);
    d.querySelector(".slbody").innerHTML=!list.length?`<p class="slempty">Tap the heart on any product to save it here. Then send your whole shortlist to us in one message.</p>`:
      `<ul class="sllist">${list.map(p=>`<li${p.sold?' class="is-sold"':""}><a href="${prodPath(p)}">${p.imgs[0]?imgTag(p.imgs[0],200,"",true):`<span class="slph">${esc(p.id)}</span>`}</a>
        <div><a class="slname" href="${prodPath(p)}">${esc(p.name)}</a><small>Code ${esc(p.id)}</small><span class="price">${p.sold?"Sold out":priceHTML(p)}</span></div>
        <button class="slx" type="button" data-heart="${esc(p.id)}" aria-label="Remove ${esc(p.name)}">×</button></li>`).join("")}</ul>
      <div class="sltotal"><span>${ok.length} ${ok.length===1?"item":"items"}${list.length>ok.length?" (sold out items not included)":""}</span><b>${inr(total)}</b></div>
      ${ok.length?`<a class="btn wa" href="https://wa.me/${WA}?text=${encodeURIComponent(slMsg(ok,total))}" target="_blank" rel="noopener">${IC.wa}Send shortlist on WhatsApp</a>
      <button class="btn" type="button" id="slig">${IC.ig}Send on Instagram</button>`:""}
      <p class="slnote">Tell us your size and colour in the chat. <button class="linkbtn" type="button" id="slclr">Clear shortlist</button></p>`;
    const ig=d.querySelector("#slig");if(ig)ig.onclick=()=>{copyText(slMsg(ok,total));toast("Shortlist copied. Paste it in the Instagram chat.",4000);window.open(IG_DM,"_blank","noopener")};
    const c=d.querySelector("#slclr");if(c)c.onclick=()=>{SL=[];slSave();slSync();slRender()};
  }).catch(()=>{d.querySelector(".slbody").innerHTML='<p class="slempty">Your shortlist could not be loaded right now. Please refresh the page.</p>'});
}
function openShortlist(){
  let d=$("#sl");
  if(!d){d=document.createElement("dialog");d.id="sl";d.setAttribute("aria-label","Your shortlist");
    d.innerHTML='<button class="x" type="button" aria-label="Close" onclick="this.closest(\'dialog\').close()">×</button><div class="slwrap"><h2>Your shortlist</h2><div class="slbody"><p class="slempty">Loading…</p></div></div>';
    d.addEventListener("click",e=>{if(e.target===d)d.close()});document.body.appendChild(d)}
  slRender();d.showModal();
}

function showPDP(pd,p){
  pd.dataset.id=p.id;rvAdd(p.id);
  pd.innerHTML=`<div class="dg">${prodHTML(p,"h1")}</div>`;
  wireGal(pd,p,document);
  document.title=p.name+(p.price?" | "+inr(p.price):"")+" | Tarasvini";
  const cat=CATS.find(c=>c[0]===p.category)||catInfo(p.category);
  const cr=document.querySelector(".crumbs");
  if(cr&&!cr.children.length)cr.innerHTML=`<a href="/">Home</a><span aria-hidden="true">›</span><a href="index.html?cat=${encodeURIComponent(cat[0])}">${esc(cat[1])}</a><span aria-hidden="true">›</span><span aria-current="page">${esc(p.name)}</span>`;
  if(!document.querySelector(".related")){
    const more=state.all.filter(x=>x.category===p.category&&x!==p&&!x.sold).sort((a,b)=>((b.coll===p.coll)-(a.coll===p.coll))||pri(a)-pri(b)||(a.i-b.i)).slice(0,8);
    if(more.length)pd.insertAdjacentHTML("afterend",`<section class="wrap shop related"><div class="shophead"><h2>More ${esc(cat[3])}</h2><a class="btn" href="index.html?cat=${encodeURIComponent(cat[0])}">See all ${esc(cat[3])}</a></div><div class="grid">${more.map(cardHTML).join("")}</div></section>`);
  }
  document.querySelectorAll('script[type="application/ld+json"]').forEach(s=>{try{const j=JSON.parse(s.textContent);if(j["@type"]==="Product"&&j.offers){
    j.offers.price=p.price.toFixed(2);j.offers.availability="https://schema.org/"+(p.sold?"OutOfStock":"InStock");s.textContent=JSON.stringify(j).replace(/</g,"\\u003c")}}catch(e){}});
  rvShow();slSync();
}

// ---------- Photo zoom: tap or click the big photo; tap again to zoom in, move to look around ----------
function openZoom(p,start){
  let d=$("#zoom");
  if(!d){d=document.createElement("dialog");d.id="zoom";d.setAttribute("aria-label","Photo zoom");
    d.innerHTML='<button class="zx" type="button" aria-label="Close">×</button><div class="zwrap"><img alt=""></div><button class="zn zp" type="button" aria-label="Previous photo">&#8249;</button><button class="zn zf" type="button" aria-label="Next photo">&#8250;</button><p class="zhint"></p>';
    document.body.appendChild(d);d.querySelector(".zx").onclick=()=>d.close();
    const img=d.querySelector("img"),wrap=d.querySelector(".zwrap");
    const at=e=>{const r=img.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*100,y=(e.clientY-r.top)/r.height*100;img.style.transformOrigin=Math.max(0,Math.min(100,x))+"% "+Math.max(0,Math.min(100,y))+"%"};
    img.addEventListener("click",e=>{d.z=!d.z;img.classList.toggle("z",d.z);at(e);d.hint()});
    wrap.addEventListener("pointermove",e=>{if(d.z&&(e.pointerType==="mouse"||e.buttons||e.pointerType==="touch"))at(e)});
    wrap.addEventListener("click",e=>{if(e.target===wrap)d.close()});
    let x0=null;wrap.addEventListener("touchstart",e=>{x0=d.z?null:e.touches[0].clientX},{passive:true});
    wrap.addEventListener("touchend",e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>50)d.go(d.i+(dx<0?1:-1))});
    d.addEventListener("keydown",e=>{if(e.key==="ArrowRight")d.go(d.i+1);if(e.key==="ArrowLeft")d.go(d.i-1)});
    d.querySelector(".zp").onclick=()=>d.go(d.i-1);d.querySelector(".zf").onclick=()=>d.go(d.i+1);
  }
  const img=d.querySelector("img");
  d.hint=()=>{d.querySelector(".zhint").textContent=(d.p.imgs.length>1?"Photo "+(d.i+1)+" of "+d.p.imgs.length+" · ":"")+(d.z?"Move to look around · tap to zoom out":"Tap the photo to zoom in")};
  d.go=i=>{const n=d.p.imgs.length;d.i=(i+n)%n;d.z=false;img.classList.remove("z");img.dataset.o=d.p.imgs[d.i];img.onerror=()=>{if(img.dataset.o&&img.src!==img.dataset.o)img.src=img.dataset.o};img.src=pic(d.p.imgs[d.i],1600);img.alt=d.p.name+", photo "+(d.i+1);d.hint()};
  d.p=p;d.querySelectorAll(".zn").forEach(b=>b.hidden=p.imgs.length<2);d.go(start||0);
  if(!d.open)d.showModal();
}

// ---------- Recently viewed: the last products this customer opened (kept in their own browser) ----------
const RV_MAX=12;
let RV=[];try{RV=JSON.parse(localStorage.getItem("recent")||"[]").filter(x=>typeof x==="string").slice(0,RV_MAX)}catch(e){}
const rvSave=()=>{try{localStorage.setItem("recent",JSON.stringify(RV))}catch(e){}};
function rvAdd(id){RV=[id].concat(RV.filter(x=>x!==id)).slice(0,RV_MAX);rvSave()}
function rvShow(){
  let box=$("#recent");const pd=document.querySelector(".pdp"),cur=pd&&pd.dataset.id;
  if(!box){const at=pd?document.querySelector(".related")||pd:null;if(!at||!state.all.length)return;
    box=document.createElement("section");box.id="recent";box.className="wrap feat rv";at.after(box)}
  const by={};state.all.forEach(p=>by[p.id]=p);
  const list=RV.filter(id=>id!==cur&&by[id]).map(id=>by[id]).slice(0,10);
  box.hidden=!list.length;if(!list.length)return;
  box.innerHTML=`<div class="fhead"><h2>Recently viewed</h2><button class="linkbtn" type="button" data-rvclear>Clear</button></div><div class="ftrack rvtrack">${list.map(cardHTML).join("")}</div>`;
}
document.addEventListener("click",e=>{if(!$("#grid")&&e.target.closest("[data-rvclear]")){RV=[];rvSave();rvShow()}});
(function(){const pd=document.querySelector(".pdp[data-id]");if(pd)rvAdd(pd.dataset.id)})();

// ---------- Collections (Home Collection column): footer links and the page for a new collection ----------
function collNames(){const m=new Map();state.all.filter(p=>p.homecoll&&!p.sold).forEach(p=>m.set(p.homecoll.toLowerCase(),p.homecoll));return [...m.values()]}
function collFooter(){
  const f=document.querySelector("footer .fgrid");if(!f||!state.all.length)return;
  let d=f.querySelector(".fcoll");const names=collNames();
  if(!names.length){if(d)d.remove();return}
  if(!d){d=document.createElement("div");d.className="fcoll";const shop=[...f.children].find(x=>(x.querySelector("h3")||{}).textContent==="Shop");(shop||f.firstElementChild).after(d)}
  d.innerHTML="<h3>Collections</h3>"+names.map(n=>`<a href="/collections/${slugify(n)||"collection"}.html">${esc(n)}</a>`).join("");
}
function collPage(){
  const box=document.querySelector(".collpage");if(!box||box.dataset.coll)return;
  const sl=(location.pathname.match(/\/collections\/([^/]+?)(?:\.html)?$/)||[])[1]||new URLSearchParams(location.search).get("c")||"";
  const name=collNames().find(n=>(slugify(n)||"collection")===sl);
  const h=document.querySelector(".pagehead h1"),cr=document.querySelector(".crumbs");
  if(!name){box.innerHTML='<div class="empty"><p>This collection is not on the website right now.</p><a class="btn primary" href="index.html">See all products</a></div>';return}
  const items=state.all.filter(p=>p.homecoll.toLowerCase()===name.toLowerCase()).sort((a,b)=>pri(a)-pri(b)||(a.i-b.i));
  document.title=name+" Collection | Tarasvini";if(h)h.textContent=name+" collection";
  if(cr)cr.innerHTML=`<a href="/">Home</a><span aria-hidden="true">›</span><span aria-current="page">${esc(name)} collection</span>`;
  box.dataset.coll=name;box.innerHTML=`<p class="catintro">Our ${esc(name)} collection: ${items.length} ${items.length===1?"style":"styles"}. Free shipping across India. Tap any product to see photos and details, then order on WhatsApp.</p><div class="grid">${items.map(cardHTML).join("")}</div>`;
}

// ---------- New arrivals page (/new-arrivals.html): every product marked New Arrival, live from the sheet ----------
function newPage(){
  const box=document.querySelector(".newpage");if(!box)return;
  const all=state.all.filter(p=>p.isnew).sort((a,b)=>pri(a)-pri(b)||(a.i-b.i));
  if(!all.length){box.innerHTML='<div class="empty"><p>New arrivals are coming soon. Follow us on Instagram to see them first.</p><a class="btn primary" href="index.html">See all products</a> <a class="btn" href="https://www.instagram.com/tarasvini/" target="_blank" rel="noopener">'+IC.ig+'Instagram</a></div>';return}
  const cats=present().map(c=>[c,all.filter(p=>p.category===c[0]).length]).filter(x=>x[1]);
  let cur="";
  const draw=()=>{const list=cur?all.filter(p=>p.category===cur):all;
    box.innerHTML=`<p class="catintro">${all.length} new ${all.length===1?"style":"styles"} just arrived. Tap any product to see photos and details, then order on WhatsApp.</p>
    ${cats.length>1?`<div class="pchips" role="group" aria-label="Category"><button class="pchip" type="button" data-nc="" aria-pressed="${!cur}">All<small>${all.length}</small></button>${cats.map(([c,n])=>`<button class="pchip" type="button" data-nc="${esc(c[0])}" aria-pressed="${cur===c[0]}">${esc(c[1])}<small>${n}</small></button>`).join("")}</div>`:""}
    <div class="grid">${list.map(cardHTML).join("")}</div>`;
    box.querySelectorAll("[data-nc]").forEach(b=>b.onclick=()=>{cur=b.dataset.nc;draw()});slSync()};
  draw();
}
