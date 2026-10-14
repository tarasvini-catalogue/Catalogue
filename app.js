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
const CATS=[["Saree","Sarees","saree","sarees"],["Salwar","Salwar Suits","salwar suit","salwar suits"],["Kurti","Kurtis & Gowns","style","styles"],["Lehenga","Lehengas","lehenga","lehengas"],["Cord-set","Cord-sets","cord-set","cord-sets"]];
// Sheet headings the site understands (any capitals, spaces or dashes): heading -> internal name
const ALIAS={sale_price:"sale",offer_price:"sale",discount_price:"sale",show_on_website:"show",show_on_site:"show",show:"show",on_website:"show",website:"show",new_arrival:"isnew",new_arrivals:"isnew",new:"isnew",product_code:"id",code:"id",model_no:"id",product_name:"name",sub_category:"collection",subcategory:"collection",type:"collection",fabric:"fabric_group",colours:"colours",colors:"colours",number_of_colours:"colours",selling_price:"price",availability:"available",photo_1:"image_url",photo_2:"image_url_2",photo_3:"image_url_3",video:"video_url"};
const hkey=h=>{const k=String(h).trim().toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");return ALIAS[k]||k};
const catKey=v=>{v=String(v||"").trim().toLowerCase();const c=CATS.find(c=>c[0].toLowerCase()===v||c[1].toLowerCase()===v||c[3]===v);return c?c[0]:String(v)};
const CAT=()=>CATS.find(c=>c[0]===state.cat);
const label=()=>CAT()[1];
const many=n=>n+" "+(n===1?CAT()[2]:CAT()[3]);
const cols=p=>p.colours>1?p.colours+" colours":"";
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
const ccol=k=>CCOL[k]||["#B43C18","#F7E3DB"];
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
function load(){
  findTab(h=>h.includes("id")&&h.includes("name")).then(t=>{if(!t)throw 0;return t}).catch(()=>{$("#note").hidden=false;return fetch(BACKUP_CSV).then(r=>{if(!r.ok)throw 0;return r.text()})}).then(t=>{
    const rows=parseCSV(t), head=rows[0].map(hkey);
    let recs=rows.slice(1).map(r=>{const o={};head.forEach((h,i)=>o[h]=(r[i]||"").trim());return o}).filter(o=>o.id&&o.name&&!/^hid/i.test(o.available));
    // "Show on Website": only ticked rows appear. If the column is missing or nothing is ticked yet, everything shows.
    if(head.includes("show")&&recs.some(o=>yes(o.show)))recs=recs.filter(o=>yes(o.show));
    state.all=recs.map((o,i)=>({...o,i,category:catKey(o.category),colours:parseInt(o.colours)||0,
        ...(()=>{const mrp=num(o.price),sp=num(o.sale);return sp>0&&sp<mrp?{price:sp,was:mrp,onsale:true}:{price:mrp,was:0,onsale:false}})(),
        coll:(c=>c===c.toLowerCase()?title(c):c)(String(o.collection||"").replace(/\s+/g," ").trim()),
        imgs:getImgs(o),sold:/^sold/i.test(o.available),feat:yes(o.featured),isnew:yes(o.isnew)}));
    init();
  }).catch(()=>{
    $("#count").innerHTML='The catalogue did not load. <button class="linkbtn" onclick="location.reload()">Try again</button>';
  });
}

const present=()=>CATS.filter(c=>state.all.some(p=>p.category===c[0]));
function init(){
  const qs=new URLSearchParams(location.search);
  const m=CATS.find(c=>c[0].toLowerCase()===(qs.get("cat")||"").toLowerCase()); if(m)state.cat=m[0];
  if(qs.get("q")){$("#q").value=qs.get("q");if(!m){const best=present().map(c=>[c[0],state.all.filter(p=>p.category===c[0]&&hit(p,qs.get("q").toLowerCase())).length]).sort((a,b)=>b[1]-a[1])[0];if(best&&best[1])state.cat=best[0]}}
  const it=qs.get("item"),ip=it&&state.all.find(x=>x.id===it); if(ip)state.cat=ip.category;
  if(!state.all.some(p=>p.category===state.cat)&&present().length)state.cat=present()[0][0];
  buildFeatured();
  // hide nav links for empty categories
  document.querySelectorAll(".nav a[data-cat]").forEach(a=>a.hidden=!state.all.some(p=>p.category===a.dataset.cat));
  setCat(state.cat,false);
  if(qs.get("q"))document.getElementById("shop").scrollIntoView();
  if(ip)openDlg(ip.id);
}
// Featured carousel: products marked Featured = yes; topped up with a mix from each category
function buildFeatured(){
  const tr=$("#ftrack"); if(!tr)return;
  let list=state.all.filter(p=>p.feat&&!p.sold);
  if(list.length<6)list=list.concat(state.all.filter(p=>p.isnew&&!p.feat&&!p.sold)).slice(0,12);
  if(list.length<6){
    const pools=present().map(c=>state.all.filter(p=>p.category===c[0]&&!p.sold&&!p.feat&&!p.isnew));
    for(let i=0;list.length<9&&pools.some(x=>x[i]);i++)pools.forEach(x=>{if(x[i]&&list.length<9)list.push(x[i])});
  }
  $("#feat").hidden=!list.length;
  tr.innerHTML=list.map(cardHTML).join("");
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
function setCat(k,scroll){
  state.cat=k;resetSel();
  document.querySelectorAll(".nav a[data-cat]").forEach(a=>a.setAttribute("aria-current",a.dataset.cat===k?"true":"false"));
  try{const u=new URL(location.href);u.searchParams.set("cat",k);u.searchParams.delete("item");history.replaceState(null,"",u)}catch(e){}
  buildFilters();
  if(scroll)document.getElementById("shop").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
}
// Filter panel: tick-boxes for type and fabric, one price band, in-stock
const PRICES=[["","Any price"],["0-999","Under ₹1,000"],["1000-1499","₹1,000 to ₹1,499"],["1500-1999","₹1,500 to ₹1,999"],["2000-2999","₹2,000 to ₹2,999"],["3000-","₹3,000 and above"]];
const sel={type:new Set(),fab:new Set(),price:""};
function resetSel(){sel.type.clear();sel.fab.clear();sel.price="";["#stock","#newonly","#saleonly"].forEach(x=>{const s=$(x);if(s)s.checked=false})}
const SHOW=8;
function optList(box,key,counts,expanded){
  const keys=Object.keys(counts).sort((a,b)=>counts[b]-counts[a]||a.localeCompare(b));
  const vis=expanded||keys.length<=SHOW+2?keys:keys.slice(0,SHOW);
  box.innerHTML=vis.map(k=>`<label class="fopt"><input type="checkbox" data-f="${key}" value="${esc(k)}"${sel[key].has(k)?" checked":""}><span>${esc(k)}</span><small>${counts[k]}</small></label>`).join("")+
    (vis.length<keys.length?`<button class="more" type="button" data-more="${key}">Show all ${keys.length}</button>`:"")+
    (expanded&&keys.length>SHOW+2?`<button class="more" type="button" data-less="${key}">Show fewer</button>`:"");
}
function buildFilters(){
  const items=inCat(), tc={}, fc={};
  $("#shoph").textContent=label();
  items.forEach(p=>{if(p.coll)tc[p.coll]=(tc[p.coll]||0)+1;if(p.fabric_group)fc[p.fabric_group]=(fc[p.fabric_group]||0)+1});
  state.tc=tc;state.fc=fc;
  optList($("#o-type"),"type",tc,false);$("#g-type").hidden=Object.keys(tc).length<2;
  optList($("#o-fab"),"fab",fc,false);$("#g-fab").hidden=Object.keys(fc).length<2;
  const nn=items.filter(p=>p.isnew).length;$("#newopt").hidden=!nn;$("#newn").textContent=nn||"";
  const ns=items.filter(p=>p.onsale).length;$("#saleopt").hidden=!ns;$("#salen").textContent=ns||"";
  $("#o-price").innerHTML=PRICES.map(([v,l])=>`<label class="fopt"><input type="radio" name="price" value="${v}"${sel.price===v?" checked":""}><span>${l}</span></label>`).join("");
  render();
}
const hit=(p,q)=>(p.name+" "+p.id+" "+p.coll+" "+p.fabric_group).toLowerCase().includes(q);
function priceOK(p){if(!sel.price)return true;const [a,b]=sel.price.split("-");return p.price>=(+a||0)&&(!b||p.price<=+b)}
function render(){
  if(!inCat().length){
    $("#count").textContent="Coming soon";$("#active").innerHTML="";
    $("#grid").innerHTML=`<div class="empty"><p>We are adding ${label().toLowerCase()} to the catalogue. Ask us on WhatsApp what is available now.</p><a class="btn wa" href="https://wa.me/${WA}?text=${encodeURIComponent("Hi Tarasvini, do you have "+label().toLowerCase()+" available?")}" target="_blank" rel="noopener">${IC.wa}Ask on WhatsApp</a></div>`;
    return;
  }
  const qv=$("#q").value.trim(), q=qv.toLowerCase(), stock=$("#stock").checked, nw=$("#newonly").checked, so=$("#saleonly").checked, sort=$("#sort").value;
  let list=state.all.filter(p=>p.category===state.cat&&(!sel.type.size||sel.type.has(p.coll))&&(!sel.fab.size||sel.fab.has(p.fabric_group))&&(!stock||!p.sold)&&(!nw||p.isnew)&&(!so||p.onsale)&&priceOK(p)&&(!q||hit(p,q)));
  list.sort((a,b)=>sort==="asc"?a.price-b.price:sort==="desc"?b.price-a.price:(b.feat-a.feat)||(b.isnew-a.isnew)||(a.sold-b.sold)||(a.i-b.i));
  // chips for what is selected
  const chips=[...[...sel.type].map(v=>["type",v,v]),...[...sel.fab].map(v=>["fab",v,v])];
  if(sel.price)chips.push(["price","",PRICES.find(x=>x[0]===sel.price)[1]]);
  if(nw)chips.push(["newonly","","New arrivals"]);
  if(so)chips.push(["saleonly","","On sale"]);
  if(stock)chips.push(["stock","","In stock only"]);
  if(q)chips.push(["q","",`Search: “${qv}”`]);
  $("#active").innerHTML=chips.length?chips.map(([k,v,l])=>`<button class="achip" type="button" data-rm="${k}" data-v="${esc(v)}" aria-label="Remove ${esc(l)}">${esc(l)}<b aria-hidden="true">×</b></button>`).join("")+'<button class="linkbtn" type="button" onclick="clearFilters()">Clear all</button>':"";
  const n=sel.type.size+sel.fab.size+(sel.price?1:0)+(stock?1:0)+(nw?1:0)+(so?1:0);
  $("#fcount").textContent=n||"";
  $("#fdone").textContent=list.length?`Show ${many(list.length)}`:"No matches";
  $("#count").textContent=q?`${many(list.length)} matching “${qv}”`:many(list.length);
  $("#grid").innerHTML=list.length?list.map(cardHTML).join(""):`<div class="empty"><p>No ${CAT()[3]} match ${q?"“"+esc(qv)+"”":"these filters"}.</p>${q?present().filter(c=>c[0]!==state.cat).map(c=>[c,state.all.filter(p=>p.category===c[0]&&hit(p,q)).length]).filter(x=>x[1]).map(([c,n])=>`<button class="btn" type="button" data-cat="${c[0]}">See ${n} in ${esc(c[1])}</button> `).join(""):""}<button class="btn" type="button" onclick="clearFilters()">Clear filters</button></div>`;
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
    ${p.colours>1?`<div class="opt"><h4>Colours</h4><p>Available in ${p.colours} colours. Tell us your colour when you order.</p></div>`:""}
    ${p.description?`<p class="desc">${esc(p.description)}</p>`:""}
    <dl><dt>Code</dt><dd>${esc(p.id)}</dd>
    ${p.fabric_group?`<dt>Fabric</dt><dd>${esc(p.fabric_group)}</dd>`:""}
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
  const rm=e.target.closest("[data-rm]");
  if(rm){const k=rm.dataset.rm,v=rm.dataset.v;if(k==="type"||k==="fab")sel[k].delete(v);else if(k==="price")sel.price="";else if(k==="stock")$("#stock").checked=false;else if(k==="newonly")$("#newonly").checked=false;else if(k==="saleonly")$("#saleonly").checked=false;else if(k==="q")$("#q").value="";
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
  $("#sort").addEventListener("change",render);
  $("#q").addEventListener("input",render);
  $("#fpanel").addEventListener("change",e=>{const t=e.target;
    if(t.dataset.f){sel[t.dataset.f][t.checked?"add":"delete"](t.value)}else if(t.name==="price")sel.price=t.value;
    render()});
  $("#clr").onclick=clearFilters;
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
  if(m=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))d=new Date(+m[1],m[2]-1,+m[3]);
  else if(m=v.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/)){let dd=+m[1],mm=+m[2];if(mm>12&&dd<=12)[dd,mm]=[mm,dd];d=new Date(+(m[3].length==2?"20"+m[3]:m[3]),mm-1,dd)}
  else{const t=Date.parse(v);if(isNaN(t))return null;d=new Date(t)}
  if(end)d.setHours(23,59,59,999);return d}
const OCOL={red:"#B43C18",sindoor:"#B43C18",pink:"#B0185A",rani:"#B0185A",magenta:"#B0185A",teal:"#0F6B6B",green:"#0F6B6B",peacock:"#0F6B6B",gold:"#9A6200",yellow:"#9A6200",marigold:"#9A6200",brown:"#24180C",dark:"#24180C",black:"#24180C"};
function offerLink(o){const l=String(o.button_link||"").trim(),k=l.toLowerCase();
  if(!l)return o.button_text?["index.html#shop",false]:null;
  if(/^https?:\/\//i.test(l))return[l,true];
  if(/whats\s*app/.test(k))return["https://wa.me/"+WA+"?text="+encodeURIComponent("Hi Tarasvini, I'd like to know more about your offer: "+o.headline),true];
  const c=CATS.find(c=>[c[0],c[1],c[2],c[3]].some(x=>x.toLowerCase()===k)||c[0].toLowerCase()+"s"===k);
  if(c)return["index.html?cat="+encodeURIComponent(c[0]),false];
  return["index.html?item="+encodeURIComponent(l),false]}
function loadOffers(){
  const box=$("#offers");if(!box)return;
  findTab(h=>h.includes("headline")).then(t=>{if(!t)return;
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
