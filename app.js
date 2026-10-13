/* Tarasvini website script, shared by every page.
   SETTINGS: the only lines you normally need to change. */
const CSV_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vS9qQBcSytVNNAHcNGVlK4E-JdTrTEHP4oKuYvKhzIn24d9zHl_zm6iq6k9UlgLdw/pub?output=csv"; // published CSV of the Website tab
const REVIEWS_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vRb2S-qjo-0bX-2i7J1DDT6V1v6I27PaHz97hULeNk8Gxv0POvyKnnCLhDEPCml8Q/pub?output=csv"; // published CSV of the Reviews sheet
const WA="918925552441"; // WhatsApp number with country code, no +
const BACKUP_CSV="catalogue-backup.csv"; // saved copy, used only if Google Sheets cannot be reached
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const state={all:[],cat:"Saree",fab:"All"};
// Website tabs: [value in the sheet's Category column, tab label, one item, many items]
const CATS=[["Saree","Sarees","saree","sarees"],["Salwar","Salwar Suits","salwar suit","salwar suits"],["Kurti","Kurtis & Gowns","style","styles"],["Lehenga","Lehengas","lehenga","lehengas"],["Cord-set","Cord-sets","cord-set","cord-sets"]];
// Sheet headings the site understands (any capitals, spaces or dashes): heading -> internal name
const ALIAS={product_code:"id",code:"id",model_no:"id",product_name:"name",sub_category:"collection",subcategory:"collection",type:"collection",fabric:"fabric_group",colours:"colours",colors:"colours",number_of_colours:"colours",selling_price:"price",availability:"available",photo_1:"image_url",photo_2:"image_url_2",photo_3:"image_url_3",video:"video_url"};
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
const title=s=>s.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
const inr=n=>"₹"+n.toLocaleString("en-IN");
const waLink=p=>"https://wa.me/"+WA+"?text="+encodeURIComponent(
  p?`Hi Tarasvini, I'd like to order:\n${p.name}\nCode: ${p.id}\nPrice: ${inr(p.price)}${p.colours>1?"\nColour: ":""}${p.sizes?"\nSize: ":""}\nPlease confirm availability and delivery.`
   :"Hi Tarasvini, I'd like to know more about your products.");

function hue(s){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))%360;return [16,30,48,78,95,110,24][h%7]}
function ph(p,withImg,imgIdx=0){
  const h=hue(p.id), imgs=p.imgs;
  const bg=`background:linear-gradient(160deg,hsl(${h} 40% 84%),hsl(${(h+18)%360} 36% 72%))`;
  const img=imgs[imgIdx]?`<img src="${esc(imgs[imgIdx])}" alt="${esc(p.name)}" loading="lazy" onerror="this.remove()">`:"";
  return `<div class="ph" style="${bg}"><b>${esc(p.id)}</b><span>Photo coming soon</span>${img}${tags(p)}${!withImg&&imgs.length>1?`<span class="cnt">${imgs.length} photos</span>`:""}</div>`;
}
const tags=p=>p.sold?'<span class="tag sold">Sold out</span>':p.feat?'<span class="tag feat">Featured</span>':"";

const getImgs=o=>{const seen=[];Object.keys(o).filter(k=>/^image_url(_\d+)?$/.test(k)).sort((a,b)=>(parseInt(a.split("_")[2])||1)-(parseInt(b.split("_")[2])||1)).forEach(k=>String(o[k]||"").split(/[\s,|]+/).forEach(u=>{u=u.trim();if(u&&!seen.includes(u))seen.push(u)}));return seen.slice(0,8)};
function load(){
  fetch(CSV_URL).then(r=>{if(!r.ok)throw 0;return r.text()}).then(t=>{const h=(parseCSV(t)[0]||[]).map(hkey);if(!h.includes("id")||!h.includes("name"))throw 0;return t}).catch(()=>{$("#note").hidden=false;return fetch(BACKUP_CSV).then(r=>{if(!r.ok)throw 0;return r.text()})}).then(t=>{
    const rows=parseCSV(t), head=rows[0].map(hkey);
    state.all=rows.slice(1).map(r=>{const o={};head.forEach((h,i)=>o[h]=(r[i]||"").trim());return o})
      .filter(o=>o.id&&o.name&&!/^hid/i.test(o.available)).map((o,i)=>({...o,i,category:catKey(o.category),colours:parseInt(o.colours)||0,
        price:Number(String(o.price).replace(/[^\d.]/g,""))||0,
        coll:(c=>c===c.toLowerCase()?title(c):c)(String(o.collection||"").replace(/\s+/g," ").trim()),
        imgs:getImgs(o),sold:/^sold/i.test(o.available),feat:/^y/i.test(o.featured)}));
    init();
  }).catch(()=>{
    $("#count").innerHTML='Could not load the catalogue. <button class="chip" onclick="location.reload()">Try again</button>';
  });
}

function chips(el,key,vals){
  el.innerHTML=vals.map(v=>`<button class="chip" data-k="${key}" data-v="${esc(v)}" aria-pressed="${state[key]===v}">${esc(v)}</button>`).join("");
}
function init(){
  const m=CATS.find(c=>c[0].toLowerCase()===(new URLSearchParams(location.search).get("cat")||"").toLowerCase()); if(m)state.cat=m[0];
  const qp=new URLSearchParams(location.search).get("q"); if(qp)$("#q").value=qp;
  const it=new URLSearchParams(location.search).get("item"),ip=it&&state.all.find(x=>x.id===it); if(ip&&CATS.some(c=>c[0]===ip.category))state.cat=ip.category;
  if(!state.all.some(p=>p.category===state.cat)){const f=CATS.find(c=>state.all.some(p=>p.category===c[0]));if(f)state.cat=f[0]}
  $("#menu").innerHTML=CATS.filter(c=>c[0]===state.cat||state.all.some(p=>p.category===c[0])).map(([k,l])=>`<button class="tab" data-cat="${k}" aria-pressed="${state.cat===k}">${l}</button>`).join("");
  buildFilters();
  if(ip)openDlg(ip.id);
}
function buildFilters(){
  const items=inCat();
  const fabs=[...new Set(items.map(p=>p.fabric_group).filter(Boolean))];
  const colls=[...new Set(items.map(p=>p.coll).filter(Boolean))].sort();
  state.fab="All";
  const box=$("#chips"); box.innerHTML="";
  if(fabs.length>1) chips(box,"fab",["All",...fabs]);
  box.parentElement.hidden=fabs.length<2;
  $("#coll").innerHTML='<option value="">All types</option>'+colls.map(c=>`<option>${esc(c)}</option>`).join("");
  $("#coll").parentElement.hidden=!colls.length;
  renderColl();
  render();
}
function render(){
  if(!inCat().length){
    $("#count").textContent=label()+" are coming soon";
    $("#grid").innerHTML=`<p class="empty">We are adding ${label().toLowerCase()} to the catalogue. Message us on WhatsApp to ask what is available.<br><br><a class="btn primary" href="https://wa.me/${WA}?text=${encodeURIComponent("Hi Tarasvini, do you have "+label().toLowerCase()+" available?")}" target="_blank" rel="noopener">Ask on WhatsApp</a></p>`;
    return;
  }
  const q=$("#q").value.toLowerCase().trim(), coll=$("#coll").value, stock=$("#stock").checked, sort=$("#sort").value, lo=Number($("#pmin").value)||0, hi=Number($("#pmax").value)||0;
  let list=state.all.filter(p=>
    p.category===state.cat&&(state.fab==="All"||p.fabric_group===state.fab)&&
    (!coll||p.coll===coll)&&(!stock||!p.sold)&&(!lo||p.price>=lo)&&(!hi||p.price<=hi)&&
    (!q||(p.name+" "+p.id+" "+p.coll+" "+p.fabric_group).toLowerCase().includes(q)));
  list.sort((a,b)=>sort==="asc"?a.price-b.price:sort==="desc"?b.price-a.price:(b.feat-a.feat)||(a.i-b.i));
  $("#count").textContent=many(list.length);
  $("#grid").innerHTML=list.length?list.map(p=>`
    <article class="card">
      <button class="open" data-id="${esc(p.id)}" aria-label="View ${esc(p.name)}">
        ${ph(p)}
        <div class="info"><h3>${esc(p.name)}</h3>
          <div class="meta">${[esc(p.coll),cols(p)].filter(Boolean).join(" · ")}</div>
          <div class="price">${p.price?inr(p.price):""}</div></div>
      </button>
      ${acts(p)}
    </article>`).join(""):'<p class="empty">Nothing matches these filters. Clear the search or choose All.</p>';
}
function openDlg(id){
  const p=state.all.find(x=>x.id===id); if(!p)return;
  const imgs=p.imgs;
  const v=p.video_url;
  const yt=v&&v.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  const vid=!v?"":yt?`<iframe src="https://www.youtube.com/embed/${yt[1]}" allowfullscreen loading="lazy" title="Video"></iframe>`
    :/\.(mp4|webm)(\?|$)/i.test(v)?`<video src="${esc(v)}" controls playsinline></video>`
    :`<p><a href="${esc(v)}" target="_blank" rel="noopener">Watch video</a></p>`;
  const d=$("#dlg");
  d.innerHTML=`<button class="x" aria-label="Close" onclick="this.closest('dialog').close()">×</button>
  <div class="dg"><div style="position:relative" class="gal">${ph(p,true,0)}
    ${imgs.length>1?`<button class="gnav gprev" type="button" aria-label="Previous photo">&#8249;</button><button class="gnav gnext" type="button" aria-label="Next photo">&#8250;</button><div class="thumbs">${imgs.map((u,i)=>`<button type="button" data-i="${i}" aria-label="Photo ${i+1}"><img src="${esc(u)}" alt=""></button>`).join("")}</div>`:""}</div>
  <div class="body"><h2>${esc(p.name)}</h2><div class="price">${p.price?inr(p.price):""}</div>
    <dl><dt>Code</dt><dd>${esc(p.id)}</dd>
    ${p.coll?`<dt>Type</dt><dd>${esc(p.coll)}</dd>`:""}
    ${p.fabric_group?`<dt>Fabric</dt><dd>${esc(p.fabric_group)}</dd>`:""}
    ${p.colours>1?`<dt>Colours</dt><dd>Available in ${p.colours} colours. Tell us which one when you order.</dd>`:""}
    ${p.sizes?`<dt>Sizes</dt><dd>${esc(p.sizes)}</dd>`:""}
    ${p.delivery?`<dt>Delivery</dt><dd>${esc(p.delivery)} (working days)</dd>`:""}</dl>
    ${p.description?`<p>${esc(p.description)}</p>`:""}${vid}
    <div style="margin-top:16px">${acts(p)}</div>
  </div></div>`;
  let cur=0;d.onkeydown=null;
  const show=i=>{cur=(i+imgs.length)%imgs.length;const w=d.querySelector(".dg .ph"),old=w.querySelector("img");if(old)old.remove();
    const im=document.createElement("img");im.src=imgs[cur];im.alt=p.name+" photo "+(cur+1);im.onerror=()=>im.remove();w.appendChild(im);
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
  d.showModal();
}

document.addEventListener("click",e=>{
  const c=e.target.closest(".chip[data-k]");
  if(c){state[c.dataset.k]=c.dataset.v;document.querySelectorAll(`.chip[data-k="${c.dataset.k}"]`).forEach(b=>b.setAttribute("aria-pressed",b===c));render();return}
  const t=e.target.closest(".tab");
  if(t){state.cat=t.dataset.cat;document.querySelectorAll(".tab").forEach(b=>b.setAttribute("aria-pressed",b===t));buildFilters();return}
  const o=e.target.closest(".open"); if(o)openDlg(o.dataset.id);
  if(e.target.id==="dlg")e.target.close();
});
if($("#grid"))["#q","#coll","#sort","#stock","#pmin","#pmax"].forEach(s=>$(s).addEventListener("input",render));
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
function acts(p){
  const wa=p.sold?'<button class="btn" disabled>Sold out</button>':`<a class="btn primary" href="${waLink(p)}" target="_blank" rel="noopener">${IC.wa}Order on WhatsApp</a>`;
  return `<div class="acts">${wa}<div class="acts2"><a class="btn" href="${IG_DM}" target="_blank" rel="noopener">${IC.ig}Instagram</a><button class="btn ico" type="button" data-share="${esc(p.id)}" aria-label="Share ${esc(p.name)}" title="Share">${IC.sh}</button></div></div>`;
}
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

function renderColl(){
  const sec=document.querySelector(".collsec"),tr=$("#ctrack");
  if(sec._cat===state.cat)return;
  sec._cat=state.cat;
  const g={};
  inCat().forEach(p=>{if(!p.coll)return;(g[p.coll]=g[p.coll]||{coll:p.coll,items:[]}).items.push(p)});
  const list=Object.values(g);
  sec.hidden=!list.length;
  if(!list.length){tr.innerHTML="";return}
  $("#collh").textContent="Shop "+label().toLowerCase()+" by type";
  for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]]}
  tr.innerHTML=list.map(c=>{
    const prices=c.items.map(p=>p.price).filter(Boolean),n=c.items.length;
    const th=c.items.slice().sort(()=>Math.random()-.5).slice(0,3).map(p=>`<i style="background:linear-gradient(160deg,hsl(${hue(p.id)} 40% 84%),hsl(${(hue(p.id)+18)%360} 36% 72%))">${p.imgs[0]?`<img src="${esc(p.imgs[0])}" alt="" loading="lazy" onerror="this.remove()">`:""}</i>`).join("")+'<i class="blank"></i>'.repeat(Math.max(0,3-n));
    return `<button class="cslide" type="button" data-cat="${esc(state.cat)}" data-coll="${esc(c.coll)}" aria-label="${esc(c.coll)}, ${many(n)}"><span class="cthumbs">${th}</span><span class="cname">${esc(c.coll)}</span><span class="cmeta">${many(n)}${prices.length?", from "+inr(Math.min(...prices)):""}</span></button>`}).join("");
  tr.scrollLeft=0;
  if(sec._ready)return;
  sec._ready=true;
  const step=()=>{const s=tr.querySelector(".cslide");return s?s.offsetWidth+16:300};
  const go=d=>{
    if(d>0&&tr.scrollLeft+tr.clientWidth>=tr.scrollWidth-4)tr.scrollTo({left:0,behavior:"smooth"});
    else if(d<0&&tr.scrollLeft<=4)tr.scrollTo({left:tr.scrollWidth,behavior:"smooth"});
    else tr.scrollBy({left:d*step(),behavior:"smooth"});
  };
  $("#cprev").onclick=()=>go(-1);$("#cnext").onclick=()=>go(1);
  let paused=matchMedia("(prefers-reduced-motion: reduce)").matches,hold=false;
  const pb=$("#cpause"),sync=()=>{pb.textContent=paused?"Play":"Pause";pb.setAttribute("aria-pressed",paused)};
  sync();pb.onclick=()=>{paused=!paused;sync()};
  sec.addEventListener("mouseenter",()=>hold=true);sec.addEventListener("mouseleave",()=>hold=false);
  sec.addEventListener("focusin",()=>hold=true);sec.addEventListener("focusout",()=>hold=false);
  sec.addEventListener("touchstart",()=>hold=true,{passive:true});sec.addEventListener("touchend",()=>setTimeout(()=>hold=false,4000),{passive:true});
  setInterval(()=>{if(!paused&&!hold&&!document.hidden&&!sec.hidden)go(1)},4500);
}
document.addEventListener("click",e=>{
  const c=e.target.closest(".cslide");if(!c)return;
  state.cat=c.dataset.cat;
  document.querySelectorAll(".tab").forEach(b=>b.setAttribute("aria-pressed",b.dataset.cat===state.cat));
  buildFilters();$("#coll").value=c.dataset.coll;render();
  document.getElementById("shop").scrollIntoView({behavior:"smooth"});
});

if($("#grid")){
  const fd=document.querySelector(".filters");if(fd&&matchMedia("(max-width:860px)").matches)fd.open=false;
  $("#clr").onclick=()=>{["#q","#pmin","#pmax"].forEach(s=>$(s).value="");$("#coll").value="";$("#stock").checked=false;$("#sort").value="featured";buildFilters()};
  $("#hsearch").addEventListener("submit",e=>{e.preventDefault();render();document.getElementById("shop").scrollIntoView({behavior:"smooth"})});
}
if($("#grid"))load();
