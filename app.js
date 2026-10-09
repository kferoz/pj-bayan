const V=window.PJ_ROWS.map((r,i)=>({id:r[0],date:r[1],approx:r[2]===1||r[2]===2,und:r[2]===2,up:r[2]===3,sec:r[3],ch:r[4],ta:r[5],en:r[6],topic:r[7],vh:r[8],vt:r[9],cat:r[10]||"",hay:(r[5]+" "+r[6]+" "+r[7]+" "+r[4]+" "+r[1]).toLowerCase(),vim:r[0][0]==="v"&&r[0].length>9&&/^v\d+$/.test(r[0]),n:i+1}));

const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const $=s=>document.querySelector(s);
let state={qsub:"All",q:"",topic:"All",era:"All",desc:false,unseen:false,open:null,view:"talks",pl:null,shown:240,hidePol:false,ctx:null};
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
const BYID=new Map(V.map(v=>[v.id,v]));
let SER=null;
function series(){
  if(SER)return SER;
  return SER=(window.PJ_SER||[]).map((s,i)=>{
    const items=s[2].map(id=>BYID.get(id)).filter(Boolean),parts={};s[2].forEach((id,j)=>parts[id]=s[3][j]);
    const tc={};items.forEach(v=>tc[v.topic]=(tc[v.topic]||0)+1);
    return {key:"S:"+i,kind:"series",ta:s[0],en:s[1],topic:Object.entries(tc).sort((a,b)=>b[1]-a[1])[0][0],pol:false,items,parts,first:items.reduce((m,v)=>v.date<m?v.date:m,"9"),last:items.reduce((m,v)=>v.date>m?v.date:m,"0"),hay:(s[0]+" "+s[1]).toLowerCase()};
  }).filter(p=>p.items.length>=2);
}
/* sub-topics: keyword rules in topics.js, first match wins; the rest go to "Other talks" */
let SUB=null;
function subs(){
  if(SUB)return SUB;
  const defs=window.PJ_SUBS||[],m=new Map();
  defs.forEach(d=>m.set(d[0],{key:"U:"+d[0],kind:"sub",id:d[0],en:d[1],ta:d[2],group:d[3],topic:d[3],pol:d[0]==="sects",items:[],kw:d[4]}));
  m.set("misc",{key:"U:misc",kind:"sub",id:"misc",en:"Other talks",ta:"பிற உரைகள்",group:"Other",topic:"Other",pol:false,items:[],kw:[]});
  const list=[...m.values()].filter(x=>x.id!=="misc");
  V.forEach(v=>{const h=(v.ta+" "+v.en).toLowerCase();let hit=null;for(const d of list){if(d.kw.some(k=>h.includes(k))){hit=d;break}}(hit||m.get("misc")).items.push(v);v.sub=(hit||m.get("misc")).id});
  m.forEach(p=>{if(p.items.length){p.first=p.items[0].date;p.last=p.items[p.items.length-1].date;p.hay=(p.ta+" "+p.en+" "+p.group).toLowerCase()}});
  return SUB=[...m.values()].filter(p=>p.items.length);
}
const col=k=>k[0]==="S"&&k[1]===":"?series().find(x=>x.key===k):k[0]==="U"&&k[1]===":"?subs().find(x=>x.key===k):playlists().find(x=>x.key===k);
const plList=k=>{const p=col(k);if(!p)return[];return state.desc?p.items.slice().reverse():p.items};
const viewOf=k=>k[1]===":"?(k[0]==="S"?"series":"topics"):"playlists";
const plThumb=p=>{const v=p.items.find(x=>!x.vim)||p.items[0];return v?thumb(v):""};
const plTile=(p,t,s1,s2)=>`<button class="pl" data-pl="${esc(p.key)}"><div class="plposter"><img src="${plThumb(p)}" alt="" loading="lazy" onerror="this.remove()"><span class="plc"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 3h10v1.6H1zm0 4h10v1.6H1zm0 4h6v1.6H1zM12 8l4 2.5-4 2.5z"/></svg>${p.items.length} videos</span></div><div class="plinfo"><b>${esc(t)}</b>${s1?`<small>${esc(s1)}</small>`:""}${s2?`<small>${s2}</small>`:""}</div></button>`;
const tabsBar=()=>`<nav class="tabs" aria-label="Sections">${[["talks","Videos"],["playlists","Playlists"],["series","Series"],["topics","Topics"],["qa","Q&A"]].map(([k,l])=>`<button data-view="${k}" aria-pressed="${state.view===k}">${l}</button>`).join("")}</nav>`;
function more(list,html){return list.length>state.shown?`<div class="more"><button class="btn" id="more">Show more (${Math.min(300,list.length-state.shown)} of ${list.length-state.shown} left)</button></div>`:""}

function card(v){
  return `<button class="card ${store.seen[v.id]?"done":""}" data-id="${v.id}">
    <div class="poster"><span class="yr">${state.pl&&col(state.pl)&&col(state.pl).parts?"Part "+col(state.pl).parts[v.id]:v.date.slice(0,4)}</span><span class="dt ${v.approx?"approx":""}">${fmtDate(v)}</span><img src="${thumb(v)}" alt="" loading="lazy" onerror="this.remove()"><span class="len">${fmtLen(v.sec)}</span><span class="seen"></span></div>
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
<p>Every link goes to a public upload: YouTube, or Vimeo for videos that come from PJ's own site onlinepj.co.in. Sources are PJ's own channels and site (OnlinePJ, ONLINE PJ Kelvi Pathil, onlinepj.co.in), plus archive channels that re-upload his talks (Online Dawah 24x7, Thowheed Speeches). Third-party channels were kept only where the description names P. Jainulabdeen as the speaker. The channel is shown on each talk.</p>
<p><b>Series</b> are groups of titles that share a name and part numbers, shown in part order (same-part re-uploads on other channels are removed). <b>Topics</b> and the <b>Q&amp;A</b> filters are sorted automatically by keywords in the title, so a few talks land in the wrong topic or in "Other talks". <b>Playlists</b> follow the categories on onlinepj.co.in (rebuttal and dispute series are marked as such); the rest are grouped by topic or channel and year. <b>Dates:</b> talks with a recording date print it. Short clips carry their upload date ("Uploaded …"), which is not when they were recorded. Older series bulk re-uploaded with no date are listed last under <b>Undated</b>.</p>
<p>Most of the short clips are Tamil titles only; I have not written English glosses for them. P. Jainulabdeen is a widely followed but contested figure. Other Tamil Muslim groups and scholars dispute parts of his teaching, and several playlists on his own site are rebuttals aimed at his critics (such as TNTJ). For study, read opposing views alongside him.</p></details>`}

function renderHome(){
  const nav="",tb=tabsBar();
  if(state.view==="playlists"&&!state.pl){
    const q=state.q.trim().toLowerCase();
    const list=playlists().filter(p=>(state.topic==="All"||p.topic===state.topic)&&(!state.hidePol||!p.pol)&&(!q||p.hay.includes(q))).sort((a,b)=>b.items.length-a.items.length);
    const tiles=list.slice(0,state.shown).map(p=>plTile(p,p.ta,p.en,esc(p.topic)+" · "+p.first.slice(0,4)+"–"+p.last.slice(0,4)+(p.pol?' · <span class="approx">rebuttal</span>':""))).join("");
    $("#app").innerHTML=`<div class="wrap">${rail(nav)}<section>${tb}<div class="year"><h2>Playlists</h2><span>${list.length} categories · ${list.reduce((a,p)=>a+p.items.length,0)} talks</span></div><div class="plgrid">${tiles||'<div class="empty">No playlists match.</div>'}</div>${more(list)}${about()}</section></div>`;
    return;
  }
  if(state.view==="series"&&!state.pl){
    const q=state.q.trim().toLowerCase();
    const list=series().filter(p=>(state.topic==="All"||p.topic===state.topic)&&(!q||p.hay.includes(q))).sort((a,b)=>b.items.length-a.items.length);
    const tiles=list.slice(0,state.shown).map(p=>plTile(p,p.ta,p.en,esc(p.topic)+" · "+p.first.slice(0,4)+"–"+p.last.slice(0,4))).join("");
    $("#app").innerHTML=`<div class="wrap">${rail(nav)}<section>${tb}<div class="year"><h2>Series</h2><span>${list.length} multi-part series · ${list.reduce((a,p)=>a+p.items.length,0)} talks, in part order</span></div><div class="plgrid">${tiles||'<div class="empty">No series match.</div>'}</div>${more(list)}${about()}</section></div>`;
    return;
  }
  if(state.view==="topics"&&!state.pl){
    const q=state.q.trim().toLowerCase();
    const list=subs().filter(p=>!q||p.hay.includes(q));
    const groups=[];list.forEach(p=>{let g=groups.find(x=>x.g===p.group);if(!g){g={g:p.group,items:[]};groups.push(g)}g.items.push(p)});
    groups.forEach(g=>g.items.sort((a,b)=>(a.id==="misc")-(b.id==="misc")||b.items.length-a.items.length));
    const body=groups.map(g=>`<div class="year"><h2>${esc(g.g)}</h2><span>${g.items.reduce((a,p)=>a+p.items.length,0)} talks</span></div><div class="plgrid">${g.items.map(p=>plTile(p,p.en,p.ta,p.pol?'<span class="approx">includes rebuttals</span>':"")).join("")}</div>`).join("");
    $("#app").innerHTML=`<div class="wrap">${rail(nav)}<section>${tb}<div class="year" style="margin-top:6px"><h2>Topics</h2><span>${list.length} sub-topics, sorted by keywords in each title</span></div>${body||'<div class="empty">No topics match.</div>'}${about()}</section></div>`;
    return;
  }
  if(state.view==="qa"&&!state.pl){
    const q=state.q.trim().toLowerCase(),sl=subs();
    const base=V.filter(v=>v.topic==="Q&A"&&(!state.unseen||!store.seen[v.id])&&(!q||v.hay.includes(q)));
    const cnt={};base.forEach(v=>cnt[v.sub]=(cnt[v.sub]||0)+1);
    let l2=state.qsub==="All"?base:base.filter(v=>v.sub===state.qsub);if(state.desc)l2=l2.slice().reverse();
    const chips=`<div class="chips qchips"><button class="chip" data-qsub="All" aria-pressed="${state.qsub==="All"}">All<i>${base.length}</i></button>${sl.filter(p=>cnt[p.id]).sort((a,b)=>cnt[b.id]-cnt[a.id]).map(p=>`<button class="chip" data-qsub="${p.id}" aria-pressed="${state.qsub===p.id}">${esc(p.en)}<i>${cnt[p.id]}</i></button>`).join("")}</div>`;
    $("#app").innerHTML=`<div class="wrap">${rail(nav)}<section>${tb}<div class="year" style="margin-top:6px"><h2>Questions &amp; answers</h2><span>${l2.length} answers</span></div>${chips}${l2.length?`<div class="grid">${l2.slice(0,state.shown).map(card).join("")}</div>${more(l2)}`:'<div class="empty">No answers match.</div>'}${about()}</section></div>`;
    return;
  }
  if(state.pl){
    const p=col(state.pl);const list=plList(state.pl).filter(v=>!state.unseen||!store.seen[v.id]);
    const q=state.q.trim().toLowerCase();const l2=q?list.filter(v=>v.hay.includes(q)):list;
    $("#app").innerHTML=`<div class="wrap">${rail(nav)}<section>${tb}<button class="btn back" id="plback">← All ${p.kind==="series"?"series":p.kind==="sub"?"topics":"playlists"}</button><div class="year"><h2 style="font-size:24px">${esc(p.kind==="sub"?p.en:p.ta)}</h2><span>${esc(p.kind==="sub"?p.ta:p.en)} · ${l2.length} talks · ${p.first.slice(0,4)}–${p.last.slice(0,4)}</span></div>${l2.length?`<div class="grid">${l2.slice(0,state.shown).map(card).join("")}</div>${more(l2)}`:'<div class="empty">No talks match.</div>'}${about()}</section></div>`;
    return;
  }
  const list=filtered();
  let html="";
  if(!list.length)html=`<div class="empty">No talks match. Clear the search or filters.</div>`;
  else{
    const groups=[];list.slice(0,state.shown).forEach(v=>{const y=state.era==="Undated"||v.und?"Undated · "+v.date.slice(0,4):v.date.slice(0,4);let g=groups[groups.length-1];if(!g||g.y!==y){g={y,items:[]};groups.push(g)}g.items.push(v)});
    html=groups.map(g=>`<div class="year"><h2>${g.y}</h2><span>${g.items.length} shown</span></div><div class="grid">${g.items.map(card).join("")}</div>`).join("")+more(list);
  }
  $("#app").innerHTML=`<div class="wrap">${rail(nav)}<section>${tb}<div class="count">${list.length} talks</div>${html}${about()}</section></div>`;
}

function ctxList(v){return state.pl?plList(state.pl):(state.ctxAll||V)}
function renderDesk(id){
  const v=V.find(x=>x.id===id);if(!v){state.open=null;return renderHome()}
  const L=ctxList(v),i=L.indexOf(v),prev=L[i-1],next=L[i+1];
  const up=L.slice(Math.max(0,i-2),i+8);
  $("#app").innerHTML=`<div class="desk"><button class="btn back" id="back">${state.pl?"← "+(col(state.pl)&&col(state.pl).kind==="series"?"Series":col(state.pl)&&col(state.pl).kind==="sub"?"Topic":"Playlist"):"← Back"}</button>
  <div class="deskgrid"><div>
    <div class="stage"><div id="player"></div></div>
    <p class="fallback">Video not loading? <a href="${url(v)}" target="_blank" rel="noopener">Open it on ${v.vim?"onlinepj.co.in":"YouTube"}</a></p>
    <h1 class="dtitle">${esc(v.ta)}</h1><p class="en">${esc(v.en)}</p>
    <div class="meta"><span>${v.up?"Date":"Recorded"} <b class="${v.approx?"approx":""}">${fmtDate(v)}</b></span><span>Length <b>${fmtLen(v.sec)}</b></span><span>Topic <b>${esc(v.topic)}</b></span><span>Channel <b>${esc(v.ch)}</b></span><span>${state.pl&&col(state.pl)?col(state.pl).kind==="series"?"Series":col(state.pl).kind==="sub"?"Topic":"Playlist":"Playlist"} <b>${esc(state.pl&&col(state.pl)?(col(state.pl).kind==="sub"?col(state.pl).en:col(state.pl).en||col(state.pl).ta):plInfo(plKey(v)).en)}</b></span><span>No. <b>${i+1} of ${L.length}</b></span></div>
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
  if(t.dataset.id){if(!state.pl)state.ctxAll=state.view==="qa"?V.filter(v=>v.topic==="Q&A"&&(state.qsub==="All"||v.sub===state.qsub)&&(!state.q.trim()||v.hay.includes(state.q.trim().toLowerCase()))):filtered();open(t.dataset.id);return}
  if(t.dataset.view){state.view=t.dataset.view;state.pl=null;state.open=null;state.shown=240;state.ctxAll=null;route();window.scrollTo(0,0);return}
  if(t.dataset.qsub){state.qsub=t.dataset.qsub;state.shown=240;route();return}
  if(t.dataset.pl){state.pl=t.dataset.pl;state.shown=240;state.view=viewOf(t.dataset.pl);window.scrollTo(0,0);route();return}
  if(t.id==="plback"){state.pl=null;state.shown=240;route();return}
  if(t.id==="more"){state.shown+=300;route();return}
  if(t.dataset.era){state.shown=240;state.era=t.dataset.era;route();return}
  if(t.dataset.topic){state.shown=240;state.topic=t.dataset.topic;route();return}
  if(t.id==="back"){state.open=null;state.ctxAll=null;try{history.replaceState(null,"","#")}catch(e){}route();return}
  if(t.id==="auto"){store.auto=!store.auto;save();t.setAttribute("aria-pressed",store.auto);return}
  if(t.id==="seen"){store.seen[state.open]=!store.seen[state.open];save();route();return}
  if(t.id==="prev"||t.id==="next"){const cv=V.find(v=>v.id===state.open),L=ctxList(cv),i=L.findIndex(v=>v.id===state.open);const n=L[i+(t.id==="next"?1:-1)];if(n)open(n.id);return}
  if(t.id==="theme"){const dark=(document.documentElement.getAttribute("data-theme")||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"))==="dark";const n=dark?"light":"dark";document.documentElement.setAttribute("data-theme",n);try{localStorage.setItem("pj-theme",n)}catch(e){}return}
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
