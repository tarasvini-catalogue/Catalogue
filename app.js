/* Tarasvini website script, shared by every page.
   SETTINGS: the only lines you normally need to change. */
// Published Google Sheet (File > Share > Publish to web). Each tab has a gid number:
// open the tab and read it from the address bar, e.g. ...edit#gid=123456789
const SHEET_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vS9qQBcSytVNNAHcNGVlK4E-JdTrTEHP4oKuYvKhzIn24d9zHl_zm6iq6k9UlgLdw/pub";
// gids of the Catalogue and Offers tabs, in any order: the site tells them apart by their column headings
const SHEET_TABS=["765422921","58829998","951620432","818691743"]; // Catalogue, Offers (+ earlier numbers as fallback)
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
const KNOWN=[["Saree","Sarees","saree","sarees"],["Salwar","Salwar Suits","salwar suit","salwar suits"],["Kurti","Kurtis & Gowns","style","styles"],["Lehenga","Lehengas","lehenga","lehengas"],["Cord-set","Cord-sets","cord-set","cord-sets"]];
let CATS=KNOWN.slice(0,4);
const catInfo=v=>{v=String(v||"").replace(/\s+/g," ").trim();const k=v.toLowerCase(),kn=KNOWN.find(c=>c.some(x=>x.toLowerCase()===k)||c[0].toLowerCase()+"s"===k||(c[0]==="Cord-set"&&/^co-?ord|^cord ?sets?$/.test(k)));if(kn)return kn;
  const t=v===k?title(v):v,pl=/s$/i.test(t)?t:t+"s";return[t,pl,t.toLowerCase(),pl.toLowerCase()]};
function setCats(recs){const out=[];recs.forEach(o=>{const c=catInfo(o.category);if(c[0]&&!out.some(x=>x[0].toLowerCase()===c[0].toLowerCase()))out.push(c)});if(out.length)CATS=out;buildNav()}
function buildNav(){
  const nav=document.querySelector(".nav");if(nav){nav.querySelectorAll("a[data-cat]").forEach(a=>a.remove());const sep=nav.querySelector(".sep");
    CATS.forEach(c=>{const a=document.createElement("a");a.href="index.html?cat="+encodeURIComponent(c[0]);a.dataset.cat=c[0];a.textContent=c[1];if(c[0]===state.cat&&$("#grid"))a.setAttribute("aria-current","true");nav.insertBefore(a,sep)})}
  const h=[...document.querySelectorAll("footer h3")].find(x=>x.textContent.trim()==="Shop");
  if(h){const d=h.parentNode;d.querySelectorAll("a").forEach(a=>a.remove());CATS.forEach(c=>{const a=document.createElement("a");a.href="index.html?cat="+encodeURIComponent(c[0]);a.textContent=c[1];d.appendChild(a)})}
}
// Sheet headings the site understands (any capitals, spaces or dashes): heading -> internal name
const ALIAS={home_collection:"homecoll",homepage_collection:"homecoll",highlight:"homecoll",occasion:"occ",occasions:"occ",occasion_wear:"occ",wear:"occ",sale_price:"sale",offer_price:"sale",discount_price:"sale",show_on_website:"show",show_on_site:"show",show:"show",on_website:"show",website:"show",new_arrival:"isnew",new_arrivals:"isnew",new:"isnew",product_code:"id",code:"id",model_no:"id",product_name:"name",sub_category:"collection",subcategory:"collection",type:"collection",fabric:"fabric_group",colours:"colours",colors:"colours",number_of_colours:"colours",selling_price:"price",availability:"available",photo_1:"image_url",photo_2:"image_url_2",photo_3:"image_url_3",video:"video_url"};
const hkey=h=>{const k=String(h).trim().toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");return ALIAS[k]||k};
const catKey=v=>catInfo(v)[0];
const CAT=()=>CATS.find(c=>c[0]===state.cat);
const label=()=>CAT()[1];
const many=n=>n+" "+(n===1?CAT()[2]:CAT()[3]);
// Colours: a number (6) or colour names (Red, Blue, Green). At most 3 are shown; with more, customers are asked to DM.
const colInfo=v=>{v=String(v||"").trim();if(/^\d+$/.test(v))return{colours:+v,cnames:[]};const n=v.split(/[,;\/|]+/).map(x=>x.trim()).filter(Boolean);return{colours:n.length,cnames:n}};
const cols=p=>p.colours>3?"More colours":p.cnames.length>1?p.cnames.join(", "):p.colours>1?p.colours+" colours":"";
const and=a=>a.length>1?a.slice(0,-1).join(", ")+" and "+a[a.length-1]:a.join("");
function colHTML(p){
  if(p.colours<2&&!p.cnames.length)return "";
  const q=encodeURIComponent(`Hi Tarasvini, please share all the colours of ${p.name} (Code: ${p.id}).`);
  const dm=`Message us on <a href="${IG_DM}" target="_blank" rel="noopener">Instagram</a> or <a href="https://wa.me/${WA}?text=${q}" target="_blank" rel="noopener">WhatsApp</a> to see all the colours.`;
  let t;
  if(p.colours>3)t=p.cnames.length?`${esc(p.cnames.slice(0,3).join(", "))} and more colours available. ${dm}`:`More colours available. ${dm}`;
  else if(p.cnames.length===1)t=`Colour: ${esc(p.cnames[0])}.`;
  else t=(p.cnames.length?`Available in ${esc(and(p.cnames))}.`:`Available in ${p.colours} colours.`)+" Tell us your colour when you order.";
  return `<div class="opt"><h4>Colours</h4><p>${t}</p></div>`}
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
const waLink=p=>"https://wa.me/"+WA+"?text="+encodeURIComponent(
  p?`Hi Tarasvini, I'd like to order:\n${p.name}\nCode: ${p.id}\nPrice: ${inr(p.price)}${p.was?" (sale price, was "+inr(p.was)+")":""}${p.colours>1?"\nColour: ":""}${p.sizes?"\nSize: ":""}\nPlease confirm availability and delivery.`
   :"Hi Tarasvini, I'd like to know more about your products.");

// Category colours: [strong, light tint]; used for photo placeholders
const CCOL={Saree:["#B43C18","#F7E3DB"],Salwar:["#B0185A","#F7DCE8"],Kurti:["#0F6B6B","#D8ECEB"],Lehenga:["#C9850A","#FBEACB"],"Cord-set":["#3C3C18","#E8E8D8"]};
const PAL=[["#B43C18","#F7E3DB"],["#B0185A","#F7DCE8"],["#0F6B6B","#D8ECEB"],["#C9850A","#FBEACB"],["#1F8A4C","#DDF0E4"],["#5B3FA8","#E6E0F5"]];
const ccol=k=>CCOL[k]||PAL[Math.max(0,CATS.findIndex(c=>c[0]===k))%PAL.length];
function ph(p,big,imgIdx=0){
  const [c,t]=ccol(p.category), imgs=p.imgs;
  const img=imgs[imgIdx]?`<img src="${esc(imgs[imgIdx])}" alt="${esc(p.name)}" loading="${big?"eager":"lazy"}" onerror="this.remove()">`:"";
  return `<div class="ph" style="--c:${c};--t:${t}"><b>${esc(p.id)}</b><span>Photo coming soon</span>${img}${tags(p)}${!big&&imgs.length>1?`<span class="cnt">${imgs.length} photos</span>`:""}<div class="zari" aria-hidden="true"></div></div>`;
}
const num=v=>Number(String(v||"").replace(/[^\d.]/g,""))||0;
const priceHTML=p=>p.price?inr(p.price)+(p.was?`<s class="was">${inr(p.was)}</s><span class="off">${Math.round((1-p.price/p.was)*100)}% off</span>`:""):"";
const yes=v=>/^(y|yes|true|1|✓|✔|x)$/i.test(String(v||"").trim());
const tags=p=>{const t=p.sold?['<span class="tag sold">Sold out</span>']:[p.isnew?'<span class="tag new">New arrival</span>':"",p.onsale?'<span class="tag sale">Sale</span>':"",p.feat?'<span class="tag feat">Featured</span>':""].filter(Boolean);return t.length?`<span class="tags">${t.join("")}</span>`:""};

// Google Drive share links -> direct image links (the file must be shared "Anyone with the link")
const imgURL=u=>{const m=u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=|thumbnail\?id=)([\w-]{20,})/)||u.match(/docs\.google\.com\/uc\?(?:export=\w+&)?id=([\w-]{20,})/);return m?"https://lh3.googleusercontent.com/d/"+m[1]+"=w1200":u};
const getImgs=o=>{const seen=[];Object.keys(o).filter(k=>/^image_url(_\d+)?$/.test(k)).sort((a,b)=>(parseInt(a.split("_")[2])||1)-(parseInt(b.split("_")[2])||1)).forEach(k=>String(o[k]||"").split(/[\s,|]+/).forEach(u=>{u=imgURL(u.trim());if(u&&!seen.includes(u))seen.push(u)}));return seen.slice(0,8)};
function readCatalogue(){
  return findTab(h=>h.includes("id")&&h.includes("name")).then(t=>{if(!t)throw 0;return t}).catch(()=>{const n=$("#note");if(n)n.hidden=false;return fetch(BACKUP_CSV).then(r=>{if(!r.ok)throw 0;return r.text()})}).then(t=>{
    const rows=parseCSV(t), head=rows[0].map(hkey);
    let recs=rows.slice(1).map(r=>{const o={};head.forEach((h,i)=>o[h]=(r[i]||"").trim());return o}).filter(o=>o.id&&o.name&&!/^hid/i.test(o.available));
    // "Show on Website": only ticked rows appear. If the column is missing or nothing is ticked yet, everything shows.
    if(head.includes("show")&&recs.some(o=>yes(o.show)))recs=recs.filter(o=>yes(o.show));
    setCats(recs);return recs});
}
const catsReady=$("#grid")?null:readCatalogue().catch(()=>{});
function load(){
  readCatalogue().then(recs=>{
    state.all=recs.map((o,i)=>({...o,i,category:catKey(o.category),...colInfo(o.colours),
        ...(()=>{const mrp=num(o.price),sp=num(o.sale);return sp>0&&sp<mrp?{price:sp,was:mrp,onsale:true}:{price:mrp,was:0,onsale:false}})(),
        coll:(c=>c===c.toLowerCase()?title(c):c)(String(o.collection||"").replace(/\s+/g," ").trim()),
        occ:String(o.occ||"").split(/[,;\/]+/).map(x=>title(x.trim())).filter(Boolean),imgs:getImgs(o),sold:/^sold/i.test(o.available),feat:yes(o.featured),isnew:yes(o.isnew)}));
    init();
  }).catch(()=>{
    $("#count").innerHTML='The catalogue did not load. <button class="linkbtn" onclick="location.reload()">Try again</button>';
  });
}

const present=()=>CATS.filter(c=>state.all.some(p=>p.category===c[0]));
function init(){
  const qs=new URLSearchParams(location.search);
  const m=qs.get("cat")&&CATS.find(c=>c[0]===catKey(qs.get("cat"))); if(m)state.cat=m[0];
  if(qs.get("q")){$("#q").value=qs.get("q");if(!m){const best=present().map(c=>[c[0],state.all.filter(p=>p.category===c[0]&&hit(p,qs.get("q").toLowerCase())).length]).sort((a,b)=>b[1]-a[1])[0];if(best&&best[1])state.cat=best[0]}}
  const it=qs.get("item"),ip=it&&state.all.find(x=>x.id===it); if(ip)state.cat=ip.category;
  if(!state.all.some(p=>p.category===state.cat)&&present().length)state.cat=present()[0][0];
  buildHero();
    setCat(state.cat,false);
  const qo=qs.get("occasion");if(qo){const m2=Object.keys(state.oc||{}).find(o=>o.toLowerCase()===qo.toLowerCase());if(m2){sel.occ.add(m2);syncPanel();render()}}
  if(qs.get("q"))document.getElementById("shop").scrollIntoView();
  if(ip)openDlg(ip.id);
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
// Uses the "Home Collection" column if any product has it, otherwise the biggest sub-categories.
function buildHero(){
  const box=$("#hcar");if(!box)return;
  const pool=state.all.filter(p=>!p.sold);
  const useCol=pool.some(p=>p.homecoll);
  const g={};pool.forEach(p=>{const k=useCol?p.homecoll:p.coll;if(!k)return;(g[k]=g[k]||{name:k,items:[]}).items.push(p)});
  let list=Object.values(g).filter(c=>c.items.length>=(useCol?1:3));
  const score=c=>c.items.filter(p=>p.feat||p.isnew).length*100+c.items.filter(p=>p.imgs.length).length*10+c.items.length;
  if(!useCol)list=list.sort((a,b)=>score(b)-score(a)).slice(0,5);
  if(!list.length){box.closest(".hero").hidden=true;return}
  const catOf=c=>{const n={};c.items.forEach(p=>n[p.category]=(n[p.category]||0)+1);return Object.keys(n).sort((a,b)=>n[b]-n[a])[0]};
  box.innerHTML=list.map((c,i)=>{
    const its=c.items.slice().sort((a,b)=>(b.feat-a.feat)||(b.isnew-a.isnew)||(b.imgs.length>0)-(a.imgs.length>0)).slice(0,4);
    const k=catOf(c),cl=CATS.find(x=>x[0]===k)||CATS[0],pr=c.items.map(p=>p.price).filter(Boolean);
    return `<div class="hslide"${i?" hidden":""} role="group" aria-roledescription="slide" aria-label="${i+1} of ${list.length}: ${esc(c.name)}">
      <div class="htext"><p class="hcat">${esc(cl[1])}</p><h1>${esc(c.name)}</h1>
        <p>${c.items.length} ${c.items.length===1?cl[2]:cl[3]}${pr.length?" from "+inr(Math.min(...pr)):""}</p>
        <button class="btn primary" type="button" data-hcat="${esc(k)}" data-hcoll="${useCol?"":esc(c.name)}" data-hhome="${useCol?esc(c.name):""}">Shop this collection</button></div>
      <div class="collage n${its.length}">${its.map(p=>`<button class="open" type="button" data-id="${esc(p.id)}" aria-label="${esc(p.name)}">${ph(p,false)}</button>`).join("")}</div></div>`}).join("")+
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
  state.cat=k;resetSel();
  document.querySelectorAll(".nav a[data-cat]").forEach(a=>a.setAttribute("aria-current",a.dataset.cat===k?"true":"false"));
  try{const u=new URL(location.href);u.searchParams.set("cat",k);u.searchParams.delete("item");history.replaceState(null,"",u)}catch(e){}
  buildFilters();
  if(scroll)document.getElementById("shop").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
}
// Filter panel: tick-boxes for type and fabric, one price band, in-stock
const PRICES=[["","Any price"],["0-999","Under ₹1,000"],["1000-1499","₹1,000 to ₹1,499"],["1500-1999","₹1,500 to ₹1,999"],["2000-2999","₹2,000 to ₹2,999"],["3000-","₹3,000 and above"]];
const OCC_ORDER=["Daily Wear","Work Wear","Party Wear","Celebrity Inspired","Traditional Wear","Wedding Wear"];
const OCC_LOOK={"Daily Wear":["#E39B12",'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'],
"Work Wear":["#0F6B6B",'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>'],
"Party Wear":["#B0185A",'<path d="M12 3l2.1 5.4L19.5 10l-5.4 2.1L12 17.5l-2.1-5.4L4.5 10l5.4-1.6z"/>'],
"Celebrity Inspired":["#6B3FA0",'<path d="M12 3l2.6 5.6 6.1.7-4.5 4.1 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.1 6.1-.7z"/>'],
"Traditional Wear":["#B43C18",'<path d="M12 3c2 3 3 5 3 7a3 3 0 0 1-6 0c0-2 1-4 3-7z"/><path d="M4 15c2 3 5 4 8 4s6-1 8-4"/><path d="M6 19h12"/>'],
"Wedding Wear":["#C2185B",'<circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="M10 5l2-2 2 2-2 2z"/>']};
const ALL_ICON='<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>';
const occTile=(v,label,n,c,ic,img)=>`<button class="occ" type="button" data-occ="${esc(v)}" aria-pressed="${v?"false":"true"}" style="--c:${c}"><span class="ocirc"><svg viewBox="0 0 24 24" aria-hidden="true">${ic}</svg>${img?`<img src="${esc(img)}" alt="" loading="lazy" onerror="this.remove()">`:""}</span><b>${esc(label)}</b><small>${n}</small></button>`;
// Photo for an occasion circle: a product from this category and occasion that has a photo,
// Featured and New Arrival first, avoiding a photo already used by another circle.
function occPhoto(items,used){
  const c=items.filter(p=>p.imgs.length&&!p.sold).sort((a,b)=>(b.feat-a.feat)||(b.isnew-a.isnew)||(a.i-b.i));
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
  $("#o-occ").innerHTML=ok.map(o=>`<label class="fopt"><input type="checkbox" data-f="occ" value="${esc(o)}"><span>${esc(o)}</span><small>${oc[o]}</small></label>`).join("");$("#g-occ").hidden=!ok.length;$("#g-fab").hidden=Object.keys(fc).length<2;
  const nn=items.filter(p=>p.isnew).length;$("#newopt").hidden=!nn;$("#newn").textContent=nn||"";
  const ns=items.filter(p=>p.onsale).length;$("#saleopt").hidden=!ns;$("#salen").textContent=ns||"";
  $("#o-price").innerHTML=PRICES.map(([v,l])=>`<label class="fopt"><input type="radio" name="price" value="${v}"${sel.price===v?" checked":""}><span>${l}</span></label>`).join("");
  render();
}
const hit=(p,q)=>(p.name+" "+p.id+" "+p.coll+" "+p.fabric_group).toLowerCase().includes(q);
function priceOK(p){if(!sel.price)return true;const [a,b]=sel.price.split("-");return p.price>=(+a||0)&&(!b||p.price<=+b)}
const FIRST=20, MORE=10;
function render(keep){
  if(!keep)state.shown=FIRST;
  if(!inCat().length){
    $("#count").textContent="Coming soon";$("#active").innerHTML="";
    $("#grid").innerHTML=`<div class="empty"><p>We are adding ${label().toLowerCase()} to the catalogue. Ask us on WhatsApp what is available now.</p><a class="btn wa" href="https://wa.me/${WA}?text=${encodeURIComponent("Hi Tarasvini, do you have "+label().toLowerCase()+" available?")}" target="_blank" rel="noopener">${IC.wa}Ask on WhatsApp</a></div>`;
    return;
  }
  const qv=$("#q").value.trim(), q=qv.toLowerCase(), stock=$("#stock").checked, nw=$("#newonly").checked, so=$("#saleonly").checked, sort=$("#sort").value;
  let list=state.all.filter(p=>p.category===state.cat&&(!sel.type.size||sel.type.has(p.coll))&&(!sel.fab.size||sel.fab.has(p.fabric_group))&&(!sel.occ.size||p.occ.some(o=>sel.occ.has(o)))&&(!sel.home||p.homecoll===sel.home)&&(!stock||!p.sold)&&(!nw||p.isnew)&&(!so||p.onsale)&&priceOK(p)&&(!q||hit(p,q)));
  list.sort((a,b)=>sort==="asc"?a.price-b.price:sort==="desc"?b.price-a.price:(b.feat-a.feat)||(b.isnew-a.isnew)||(a.sold-b.sold)||(a.i-b.i));
  // chips for what is selected
  const chips=[...(sel.home?[["home","","Collection: "+sel.home]]:[]),...[...sel.occ].map(v=>["occ",v,v]),...[...sel.type].map(v=>["type",v,v]),...[...sel.fab].map(v=>["fab",v,v])];
  if(sel.price)chips.push(["price","",PRICES.find(x=>x[0]===sel.price)[1]]);
  if(nw)chips.push(["newonly","","New arrivals"]);
  if(so)chips.push(["saleonly","","On sale"]);
  if(stock)chips.push(["stock","","In stock only"]);
  if(q)chips.push(["q","",`Search: “${qv}”`]);
  $("#active").innerHTML=chips.length?chips.map(([k,v,l])=>`<button class="achip" type="button" data-rm="${k}" data-v="${esc(v)}" aria-label="Remove ${esc(l)}">${esc(l)}<b aria-hidden="true">×</b></button>`).join("")+'<button class="linkbtn" type="button" onclick="clearFilters()">Clear all</button>':"";
  const n=(sel.home?1:0)+sel.occ.size+sel.type.size+sel.fab.size+(sel.price?1:0)+(stock?1:0)+(nw?1:0)+(so?1:0);
  $("#fcount").textContent=n||"";
  document.querySelectorAll("#occrow .occ").forEach(b=>b.setAttribute("aria-pressed",b.dataset.occ?String(sel.occ.size===1&&sel.occ.has(b.dataset.occ)):String(!sel.occ.size)));
  $("#fdone").textContent=list.length?`Show ${many(list.length)}`:"No matches";
  $("#count").textContent=q?`${many(list.length)} matching “${qv}”`:many(list.length);
  state.list=list;
  const left=Math.max(0,list.length-state.shown);
  $("#more").hidden=!left;$("#more").textContent=`Show ${Math.min(MORE,left)} more (${left} left)`;
  $("#grid").innerHTML=list.length?list.slice(0,state.shown).map(cardHTML).join(""):`<div class="empty"><p>No ${CAT()[3]} match ${q?"“"+esc(qv)+"”":"these filters"}.</p>${q?present().filter(c=>c[0]!==state.cat).map(c=>[c,state.all.filter(p=>p.category===c[0]&&hit(p,q)).length]).filter(x=>x[1]).map(([c,n])=>`<button class="btn" type="button" data-cat="${c[0]}">See ${n} in ${esc(c[1])}</button> `).join(""):""}<button class="btn" type="button" onclick="clearFilters()">Clear filters</button></div>`;
}
function syncPanel(){document.querySelectorAll("#fpanel [data-f]").forEach(i=>i.checked=sel[i.dataset.f].has(i.value));document.querySelectorAll("#fpanel [name=price]").forEach(i=>i.checked=i.value===sel.price)}
function openPanel(o){const f=$("#fpanel");f.classList.toggle("is-open",o);$("#ftoggle").setAttribute("aria-expanded",o);document.body.style.overflow=o?"hidden":"";if(o)$("#fclose").focus();else $("#ftoggle").focus()}
const cardHTML=p=>`
    <article class="card${p.sold?" is-sold":""}">
      <button class="open" type="button" data-id="${esc(p.id)}" aria-label="${esc(p.name)}, ${p.price?inr(p.price):""}">
        ${ph(p)}
        <div class="info">${p.coll?`<p class="ty">${esc(p.coll)}</p>`:""}<h3>${esc(p.name)}</h3>
          <div class="prow"><span class="price">${priceHTML(p)}</span>${cols(p)?`<span class="cols">${cols(p)}</span>`:""}</div></div>
      </button>
      ${p.sold?'<button class="btn order" type="button" disabled>Sold out</button>':`<a class="btn order" href="${waLink(p)}" target="_blank" rel="noopener">${IC.wa}Order on WhatsApp</a>`}
    </article>`;
function clearFilters(){$("#q").value="";resetSel();buildFilters()}
function openDlg(id){
  const p=state.all.find(x=>x.id===id); if(!p)return;
  const imgs=p.imgs, v=p.video_url;
  const yt=v&&v.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  const vid=!v?"":yt?`<iframe src="https://www.youtube.com/embed/${yt[1]}" allowfullscreen loading="lazy" title="Video"></iframe>`
    :/\.(mp4|webm)(\?|$)/i.test(v)?`<video src="${esc(v)}" controls playsinline></video>`
    :`<p><a href="${esc(v)}" target="_blank" rel="noopener">Watch the video</a></p>`;
  const sizes=String(p.sizes||"").split(/[,\s]+/).filter(Boolean);
  const d=$("#dlg");
  d.innerHTML=`<button class="x" type="button" aria-label="Close" onclick="this.closest('dialog').close()">×</button>
  <div class="dg"><div class="gal">${ph(p,true,0)}
    ${imgs.length>1?`<button class="gnav gprev" type="button" aria-label="Previous photo">&#8249;</button><button class="gnav gnext" type="button" aria-label="Next photo">&#8250;</button><div class="thumbs">${imgs.map((u,i)=>`<button type="button" data-i="${i}" aria-label="Photo ${i+1}"><img src="${esc(u)}" alt=""></button>`).join("")}</div>`:""}</div>
  <div class="body">${p.coll?`<p class="ty">${esc(p.coll)}</p>`:""}<h2>${esc(p.name)}</h2><div class="price">${priceHTML(p)}</div>
    ${sizes.length?`<div class="opt"><h4>Sizes</h4><div class="sizes">${sizes.map(s=>`<span>${esc(s)}</span>`).join("")}</div></div>`:""}
    ${colHTML(p)}
    ${p.description?`<p class="desc">${esc(p.description)}</p>`:""}
    <dl><dt>Code</dt><dd>${esc(p.id)}</dd>
    ${p.fabric_group?`<dt>Fabric</dt><dd>${esc(p.fabric_group)}</dd>`:""}
    ${p.occ.length?`<dt>Occasion</dt><dd>${esc(p.occ.join(", "))}</dd>`:""}
    ${p.delivery?`<dt>Delivery</dt><dd>${esc(p.delivery)}, working days</dd>`:""}</dl>
    ${vid}
    <div class="dacts">${p.sold?'<button class="btn" type="button" disabled>Sold out</button>':`<a class="btn wa" href="${waLink(p)}" target="_blank" rel="noopener">${IC.wa}Order on WhatsApp</a>`}
      <div class="row"><a class="btn" href="${IG_DM}" target="_blank" rel="noopener">${IC.ig}Ask on Instagram</a><button class="btn" type="button" data-share="${esc(p.id)}">${IC.sh}Share</button></div></div>
    <div class="policy"><p><strong>No cash on delivery.</strong> We confirm payment with you on WhatsApp.</p><p>Returns or exchanges only for damaged or wrong items, reported within 24–48 hours with a full, uncut unboxing video.</p></div>
  </div></div>`;
  let cur=0;d.onkeydown=null;
  const show=i=>{cur=(i+imgs.length)%imgs.length;const w=d.querySelector(".gal .ph"),old=w.querySelector("img");if(old)old.remove();
    const im=document.createElement("img");im.src=imgs[cur];im.alt=p.name+", photo "+(cur+1);im.onerror=()=>im.remove();w.insertBefore(im,w.querySelector(".zari"));
    d.querySelectorAll(".thumbs button").forEach((b,k)=>b.setAttribute("aria-current",k===cur))};
  d.querySelectorAll(".thumbs button").forEach(b=>b.onclick=()=>show(+b.dataset.i));
  if(imgs.length>1){
    d.querySelector(".gprev").onclick=()=>show(cur-1);d.querySelector(".gnext").onclick=()=>show(cur+1);
    d.onkeydown=e=>{if(e.key==="ArrowLeft")show(cur-1);if(e.key==="ArrowRight")show(cur+1)};
    let x0=null;const g=d.querySelector(".gal");
    g.addEventListener("touchstart",e=>{x0=e.touches[0].clientX},{passive:true});
    g.addEventListener("touchend",e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>40)show(cur+(dx<0?1:-1));x0=null});
    show(0);
  }
  d.showModal();d.scrollTop=0;
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
  const t=e.target.closest("[data-cat]");
  if(t&&!e.metaKey&&!e.ctrlKey){e.preventDefault();setCat(t.dataset.cat,true);return}
  const o=e.target.closest(".open"); if(o){openDlg(o.dataset.id);return}
  if(e.target.id==="dlg")e.target.close();
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
      <div class="by">${esc(r.name)}${r.date?" · "+esc(r.date):""}</div>
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
function toast(t){const d=document.createElement("div");d.className="toast";d.setAttribute("role","status");d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2500)}
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
  if(s){const p=state.all.find(x=>x.id===s.dataset.share);if(p)share({title:p.name+" | Tarasvini",text:p.name+(p.price?" for "+inr(p.price):"")+" at Tarasvini",url:location.origin+location.pathname+"?item="+encodeURIComponent(p.id)});return}
  if(e.target.closest("[data-sharesite]"))share({title:"Tarasvini",text:"Sarees, salwar suits, kurtis, gowns and lehengas at Tarasvini",url:location.origin+location.pathname.replace(/[^/]*$/,"")});
});

if($("#grid")){
  $("#sort").addEventListener("change",()=>render());
  $("#q").addEventListener("input",()=>render());
  $("#fpanel").addEventListener("change",e=>{const t=e.target;
    if(t.dataset.f){sel[t.dataset.f][t.checked?"add":"delete"](t.value)}else if(t.name==="price")sel.price=t.value;
    render()});
  $("#clr").onclick=clearFilters;
  $("#more").onclick=()=>{const n=state.shown;state.shown+=MORE;render(true);const c=$("#grid").children[n];if(c){const l=c.querySelector("a,button");if(l)l.focus({preventScroll:true})}};
  $("#ftoggle").onclick=()=>openPanel(true);$("#fclose").onclick=()=>openPanel(false);
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
  Promise.all([findTab(h=>h.includes("headline")),catsReady]).then(([t])=>{if(!t)return;
    const rows=parseCSV(t),head=(rows[0]||[]).map(hkey),now=new Date();
    const list=rows.slice(1).map(r=>{const o={};head.forEach((h,i)=>o[h]=(r[i]||"").trim());return o})
      .filter(o=>o.headline&&yes(o.show)).filter(o=>{const a=pdate(o.start_date),b=pdate(o.end_date,true);return(!a||a<=now)&&(!b||now<=b)});
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
