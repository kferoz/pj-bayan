const V=window.PJ_ROWS.map((r,i)=>({id:r[0],date:r[1],approx:r[2]===1||r[2]===2,und:r[2]===2,up:r[2]===3,sec:r[3],ch:r[4],ta:r[5],en:r[6],topic:r[7],vh:r[8],vt:r[9],cat:r[10]||"",hay:(r[5]+" "+r[6]+" "+r[7]+" "+r[4]+" "+r[1]).toLowerCase(),vim:r[0][0]==="v"&&r[0].length>9&&/^v\d+$/.test(r[0]),n:i+1}));

const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const $=s=>document.querySelector(s);
let state={q:"",topic:"All",era:"All",desc:false,unseen:false,open:null,view:"talks",pl:null,shown:240,hidePol:false,ctx:null};
const CATS=window.PJ_CATS||{};
let store={seen:{},notes:{},pos:{},auto:true};
try{const s=localStorage.getItem("pj-archive-v1");if(s)store=Object.assign(store,JSON.parse(s))}catch(e){}
const save=()=>{try{localStorage.setItem("pj-archive-v1",JSON.stringify(store))}catch(e){}};

const fmtDate=v=>{const [y,m,d]=v.date.split("-");if(v.und)return `Undated · uploaded ${y}`;if(v.up)return `Uploaded ${+d} ${MONTHS[+m-1]} ${y}`;return v.approx?`c. ${MONTHS[+m-1]} ${y}`:`${+d} ${MONTHS[+m-1]} ${y}`};
const fmtLen=s=>{const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?`${h}:${String(m).padStart(2,"0")}:${String(x).padStart(2,"0")}`:`${m}:${String(x).padStart(2,"0")}`};
const esc=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const era=v=>{if(v.und)return "Undated";const y=+v.date.slice(0,4);return y<2000?"1990s":y<2010?"2000s":y<2020?"2010s":"2020s"};
const thumb=v=>v.vim?"https://i.vimeocdn.com/video/"+v.vt+"-d_640x360":"https://i.ytimg.com/vi/"+v.id+"/mqdefault.jpg";
const url=v=>v.vim?"https://onlinepj.co.in/videos/?id="+v.id.slice(1):"https://www.youtube.com/watch?v="+v.id;

function filtered(){
  const q=state.q.trim().toLowerCase();
  let a=V.filter(v=>(state.topic==="All"||v.topic===state.topic)&&(state.era==="All"||era(v)===state.era)&&(!state.unseen||!store.seen[v.id])&&(!q||v.hay.includes(q)));
  return state.desc?a.slice().reverse():a;
}


const plKey=v=>v.cat||("T:"+v.topic);
const plInfo=k=>CATS[k]?{ta:CATS[k][3],en:CATS[k][0],topic:CATS[k][1],pol:!!CATS[k][2]}:{ta:k.slice(2),en:"Older talks · by topic",topic:k.slice(2),pol:false};
let PL=null;
function playlists(){
  if(PL)return PL;const m=new Map();
  V.forEach(v=>{const k=plKey(v);let p=m.get(k);if(!p){p={key:k,...plInfo(k),items:[]};m.set(k,p)}p.items.push(v)});
  m.forEach(p=>{p.items.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:a.n-b.n);p.first=p.items[0].date;p.last=p.items[p.items.length-1].date;p.hay=(p.ta+" "+p.en+" "+p.topic).toLowerCase()});
  return PL=[...m.values()];
}
const plList=k=>{const p=playlists().find(x=>x.key===k);if(!p)return[];return state.desc?p.items.slice().reverse():p.items};
function more(list,html){return list.length>state.shown?`<div class="more"><button class="btn" id="more">Show more (${Math.min(300,list.length-state.shown)} of ${list.length-state.shown} left)</button></div>`:""}

function card(v){
  return `<button class="card ${store.seen[v.id]?"done":""}" data-id="${v.id}">
    <div class="poster"><span class="yr">${v.date.slice(0,4)}</span><span class="dt ${v.approx?"approx":""}">${fmtDate(v)}</span><img src="${thumb(v)}" alt="" loading="lazy" onerror="this.remove()"><span class="len">${fmtLen(v.sec)}</span><span class="seen"></span></div>
    <div class="info"><h4>${esc(v.ta)}</h4><small>${esc(v.ch)}</small><small class="${v.approx?"approx":""}">${fmtDate(v)} · ${esc(v.topic)}</small><small class="gloss">${esc(v.en)}</small></div></button>`;
}

function rail(nav){
  const topics=["All",...new Set(V.map(v=>v.topic))];
  const eras=["All","1990s","2000s","2010s","2020s","Undated"];
  const cnt=(f)=>V.filter(f).length;
  const done=V.filter(v=>store.seen[v.id]).length;
  return `<aside class="rail">
    ${nav||""}
    <div><h3>Progress</h3><div class="prog">${done} of ${V.length} watched</div><div class="bar"><div style="width:${done/V.length*100}%"></div></div></div>
    ${state.view==="playlists"||state.pl?`<div><label class="chip" style="cursor:pointer"><input type="checkbox" id="hidepol" ${state.hidePol?"checked":""}> Hide rebuttal playlists</label></div>`:""}<div><h3>Era</h3><div class="chips">${eras.map(e=>`<button class="chip" data-era="${e}" aria-pressed="${state.era===e}">${e}<i>${e==="All"?V.length:cnt(v=>era(v)===e)}</i></button>`).join("")}</div></div>
    <div><h3>Topic</h3><div class="chips">${topics.map(t=>`<button class="chip" data-topic="${esc(t)}" aria-pressed="${state.topic===t}">${esc(t)}<i>${t==="All"?V.length:cnt(v=>v.topic===t)}</i></button>`).join("")}</div></div>
  </aside>`;
}

function about(){return `<details class="about"><summary>About these sources</summary>
<p>Every link goes to a public YouTube upload. They come from archive channels that re-upload PJ's talks (ONLINE PJ Kelvi Pathil, OnlinePJ, Online Dawah 24x7, Thowheed Speeches), plus two re-uploads by other accounts (AAFIYAH THOWHEED Media, mohamed Thoufeeq). Channel names are shown on each talk. I have not confirmed which of them PJ's organisation runs.</p>
<p>Dates are the recording dates printed in the video titles or descriptions. Where none was given, the date is the YouTube upload date and is marked <span class="approx">c.</span> Older series that were bulk re-uploaded with no recording date are listed last under the <b>Undated</b> era; their year is only the upload year. Old talks were uploaded years after they were given, so the upload date alone would mislead.</p>
<p>P. Jainulabdeen is a widely followed but contested figure. Other Tamil Muslim groups and scholars dispute parts of his teaching, and several clips in the wider catalogue are rebuttals aimed at his critics. For study, read opposing views alongside him.</p></details>`}

function renderHome(){
  const nav=`<div class="seg"><button class="chip" data-view="talks" aria-pressed="${state.view==="talks"&&!state.pl}">All talks</button><button class="chip" data-view="playlists" aria-pressed="${state.view==="playlists"||!!state.pl}">Playlists</button></div>`;
  if(state.view==="playlists"&&!state.pl){
    const q=state.q.trim().toLowerCase();
    const list=playlists().filter(p=>(state.topic==="All"||p.topic===state.topic)&&(!state.hidePol||!p.pol)&&(!q||p.hay.includes(q))).sort((a,b)=>b.items.length-a.items.length);
    const tiles=list.slice(0,state.shown).map(p=>`<button class="pl" data-pl="${esc(p.key)}"><span class="plc">${p.items.length}</span><b>${esc(p.ta)}</b><small>${esc(p.en)}</small><small>${esc(p.topic)} · ${p.first.slice(0,4)}–${p.last.slice(0,4)}${p.pol?' · <span class="approx">rebuttal</span>':""}</small></button>`).join("");
    $("#app").innerHTML=`<div class="wrap">${rail(nav)}<section><div class="year"><h2>Playlists</h2><span>${list.length} categories · ${list.reduce((a,p)=>a+p.items.length,0)} talks</span></div><div class="plgrid">${tiles||'<div class="empty">No playlists match.</div>'}</div>${more(list)}${about()}</section></div>`;
    return;
  }
  if(state.pl){
    const p=playlists().find(x=>x.key===state.pl);const list=plList(state.pl).filter(v=>!state.unseen||!store.seen[v.id]);
    const q=state.q.trim().toLowerCase();const l2=q?list.filter(v=>v.hay.includes(q)):list;
    $("#app").innerHTML=`<div class="wrap">${rail(nav)}<section><button class="btn back" id="plback">← All playlists</button><div class="year"><h2 style="font-size:24px">${esc(p.ta)}</h2><span>${esc(p.en)} · ${l2.length} talks · ${p.first.slice(0,4)}–${p.last.slice(0,4)}</span></div>${l2.length?`<div class="grid">${l2.slice(0,state.shown).map(card).join("")}</div>${more(l2)}`:'<div class="empty">No talks match.</div>'}${about()}</section></div>`;
    return;
  }
  const list=filtered();
  let html="";
  if(!list.length)html=`<div class="empty">No talks match. Clear the search or filters.</div>`;
  else{
    const groups=[];list.slice(0,state.shown).forEach(v=>{const y=state.era==="Undated"||v.und?"Undated · "+v.date.slice(0,4):v.date.slice(0,4);let g=groups[groups.length-1];if(!g||g.y!==y){g={y,items:[]};groups.push(g)}g.items.push(v)});
    html=groups.map(g=>`<div class="year"><h2>${g.y}</h2><span>${g.items.length} shown</span></div><div class="grid">${g.items.map(card).join("")}</div>`).join("")+more(list);
  }
  $("#app").innerHTML=`<div class="wrap">${rail(nav)}<section><div class="count">${list.length} talks</div>${html}${about()}</section></div>`;
}

function ctxList(v){return state.pl?plList(state.pl):(state.ctxAll||V)}
function renderDesk(id){
  const v=V.find(x=>x.id===id);if(!v){state.open=null;return renderHome()}
  const L=ctxList(v),i=L.indexOf(v),prev=L[i-1],next=L[i+1];
  const up=L.slice(Math.max(0,i-2),i+8);
  $("#app").innerHTML=`<div class="desk"><button class="btn back" id="back">${state.pl?"← Playlist":"← All talks"}</button>
  <div class="deskgrid"><div>
    <div class="stage"><div id="player"></div></div>
    <p class="fallback">Video not loading? <a href="${url(v)}" target="_blank" rel="noopener">Open it on ${v.vim?"onlinepj.co.in":"YouTube"}</a></p>
    <h1 class="dtitle">${esc(v.ta)}</h1><p class="en">${esc(v.en)}</p>
    <div class="meta"><span>${v.up?"Date":"Recorded"} <b class="${v.approx?"approx":""}">${fmtDate(v)}</b></span><span>Length <b>${fmtLen(v.sec)}</b></span><span>Topic <b>${esc(v.topic)}</b></span><span>Channel <b>${esc(v.ch)}</b></span><span>Playlist <b>${esc(plInfo(plKey(v)).en)}</b></span><span>No. <b>${i+1} of ${L.length}</b></span></div>
    <div class="acts">
      <button class="btn" id="seen" aria-pressed="${!!store.seen[v.id]}">${store.seen[v.id]?"✓ Watched":"Mark as watched"}</button>
      <button class="btn" id="auto" aria-pressed="${store.auto}">Auto-play next</button>
      <button class="btn" id="prev" ${prev?"":"disabled"}>← Earlier</button>
      <button class="btn" id="next" ${next?"":"disabled"}>Later →</button>
    </div>
    <div class="notes"><label for="note">My notes</label><textarea id="note" placeholder="Key points, verses, hadith cited, questions to follow up">${esc(store.notes[v.id]||"")}</textarea></div>
  </div>
  <aside class="next"><h3>In order</h3>${up.map(u=>`<button class="row ${u.id===v.id?"cur":""} ${store.seen[u.id]?"done":""}" data-id="${u.id}"><div class="mini"><span>${u.date.slice(0,4)}</span><img src="${thumb(u)}" alt="" loading="lazy" onerror="this.remove()"></div><div><span>${esc(u.ta)}</span><small>${fmtDate(u)} · ${fmtLen(u.sec)}</small></div></button>`).join("")}</aside>
  </div></div>`;
  window.scrollTo(0,0);
  mountPlayer(v);
}

/* YouTube player: resumes where you stopped, marks watched at the end, can auto-advance */
let yt=null,ytReady=false,ytQueue=null,tick=null;
const s=document.createElement("script");s.src="https://www.youtube.com/iframe_api";document.head.appendChild(s);
window.onYouTubeIframeAPIReady=()=>{ytReady=true;if(ytQueue){const v=ytQueue;ytQueue=null;mountPlayer(v)}};
let vp=null,vpLoading=null;
function loadVimeo(){return vpLoading||(vpLoading=new Promise(res=>{const x=document.createElement("script");x.src="https://player.vimeo.com/api/player.js";x.onload=res;document.head.appendChild(x)}))}
function mountVimeo(v){
  loadVimeo().then(()=>{
    if(state.open!==v.id)return;
    const el=document.getElementById("player");if(!el)return;
    el.innerHTML='<iframe src="https://player.vimeo.com/video/'+v.id.slice(1)+'?h='+v.vh+'" style="width:100%;height:100%;border:0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    vp=new Vimeo.Player(el.firstChild);
    const start=Math.max(0,(store.pos[v.id]||0)-3);
    if(start>0)vp.setCurrentTime(start).catch(()=>{});
    vp.on("timeupdate",d=>{store.pos[v.id]=d.seconds;if(Math.floor(d.seconds)%5===0)save()});
    vp.on("pause",()=>{vp.getCurrentTime().then(t=>{store.pos[v.id]=t;save()})});
    vp.on("ended",()=>{store.seen[v.id]=true;store.pos[v.id]=0;save();const L=ctxList(v),i=L.findIndex(x=>x.id===v.id),n=L[i+1];if(store.auto&&n)open(n.id);else route()});
  });
}
function mountPlayer(v){
  clearInterval(tick);
  if(yt&&yt.destroy){try{yt.destroy()}catch(e){}}yt=null;
  if(vp){try{vp.destroy()}catch(e){}vp=null}
  if(v.vim){mountVimeo(v);return}
  if(!ytReady){ytQueue=v;return}
  const start=Math.max(0,(store.pos[v.id]||0)-3);
  yt=new YT.Player("player",{width:"100%",height:"100%",videoId:v.id,
    playerVars:{rel:0,playsinline:1,start:Math.floor(start)},
    events:{
      onStateChange:e=>{
        if(e.data===1){clearInterval(tick);tick=setInterval(()=>{try{store.pos[v.id]=yt.getCurrentTime();save()}catch(x){}},5000)}
        if(e.data===2){try{store.pos[v.id]=yt.getCurrentTime();save()}catch(x){}}
        if(e.data===0){clearInterval(tick);store.seen[v.id]=true;store.pos[v.id]=0;save();
          const L=ctxList(v),i=L.findIndex(x=>x.id===v.id),n=L[i+1];
          if(store.auto&&n)open(n.id);else route()}
      }}});
}
function route(){state.open?renderDesk(state.open):renderHome()}
function open(id){state.open=id;try{history.replaceState(null,"","#"+id)}catch(e){}route()}

document.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.id){if(!state.pl)state.ctxAll=filtered();open(t.dataset.id);return}
  if(t.dataset.view){state.view=t.dataset.view;state.pl=null;state.open=null;state.shown=240;state.ctxAll=null;route();window.scrollTo(0,0);return}
  if(t.dataset.pl){state.pl=t.dataset.pl;state.shown=240;state.view="playlists";window.scrollTo(0,0);route();return}
  if(t.id==="plback"){state.pl=null;state.shown=240;route();return}
  if(t.id==="more"){state.shown+=300;route();return}
  if(t.dataset.era){state.shown=240;state.era=t.dataset.era;route();return}
  if(t.dataset.topic){state.shown=240;state.topic=t.dataset.topic;route();return}
  if(t.id==="back"){state.open=null;state.ctxAll=null;try{history.replaceState(null,"","#")}catch(e){}route();return}
  if(t.id==="auto"){store.auto=!store.auto;save();t.setAttribute("aria-pressed",store.auto);return}
  if(t.id==="seen"){store.seen[state.open]=!store.seen[state.open];save();route();return}
  if(t.id==="prev"||t.id==="next"){const cv=V.find(v=>v.id===state.open),L=ctxList(cv),i=L.findIndex(v=>v.id===state.open);const n=L[i+(t.id==="next"?1:-1)];if(n)open(n.id);return}
  if(t.id==="sort"){state.desc=!state.desc;t.textContent=state.desc?"Newest first":"Oldest first";t.setAttribute("aria-pressed",state.desc);state.open=null;route();return}
  if(t.id==="unseen"){state.unseen=!state.unseen;t.setAttribute("aria-pressed",state.unseen);state.open=null;route();return}
});
document.addEventListener("input",e=>{
  if(e.target.id==="hidepol"){state.hidePol=e.target.checked;state.shown=240;route();return}
  if(e.target.id==="q"){state.shown=240;state.q=e.target.value;if(state.open)state.open=null;renderHome();return}
  if(e.target.id==="note"){store.notes[state.open]=e.target.value;save()}
});
const h=location.hash.slice(1);if(h&&V.some(v=>v.id===h))state.open=h;
route();
