/* ===== Atelier WAN — moteur commun ===== */
(function(){
"use strict";
const W = window.WAN = window.WAN || {};
W.TPS = W.TPS || [];
W.THEMES = {
  mpls:  {name:"Cœur MPLS",       c:"var(--violet)", d:"Backbone opérateur, LDP, VRF et MP-BGP."},
  route: {name:"Routage inter-domaines", c:"var(--sky)", d:"eBGP entre FAI et redistribution entre IGP."},
  svc:   {name:"Services IP",     c:"var(--lime)",   d:"DHCP, relais DHCP, NAT statique, dynamique et PAT."},
  vpn:   {name:"VPN & sécurité",  c:"var(--rose)",   d:"IPsec site à site et tunnels GRE chiffrés."},
  fr:    {name:"Frame Relay",     c:"var(--teal)",   d:"PVC, DLCI, LMI, Inverse ARP, hub & spoke."},
};
W.MODES = {demo:"Démo", tutorial:"Tutoriel", practice:"Pratique", test:"Test"};
W.SIM = "SIMULATIONS/";
const $ = (s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
W.$=$; W.$$=$$;
const esc = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
W.esc = esc;
W.tp = id => W.TPS.find(t=>t.id===id);
W.sorted = () => [...W.TPS].sort((a,b)=>a.order-b.order);
W.color = v => getComputedStyle(document.documentElement).getPropertyValue(v.replace(/var\((.*)\)/,"$1")).trim() || v;

/* ---------- stockage / progression ---------- */
const KEY="atelier-wan-v1";
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}};
const save=d=>{try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){}};
W.store = {
  all: load,
  visit(id){const d=load(); d.v=d.v||{}; d.v[id]=Date.now(); save(d)},
  tab(id,tab){const d=load(); d.t=d.t||{}; d.t[id]=d.t[id]||{}; d.t[id][tab]=1; save(d)},
  quiz(id,score,total){const d=load(); d.q=d.q||{}; const p=d.q[id]; if(!p||score/total>=p.s/p.n) d.q[id]={s:score,n:total,at:Date.now()}; save(d)},
  defi(score,total,time){const d=load(); d.d=d.d||[]; d.d.unshift({s:score,n:total,time,at:Date.now()}); d.d=d.d.slice(0,20); save(d)},
  reset(){save({})}
};

/* ---------- thème ---------- */
const th = localStorage.getItem("atelier-wan-theme");
if(th) document.documentElement.dataset.theme = th;
W.toggleTheme = ()=>{
  const n = document.documentElement.dataset.theme==="light" ? "dark" : "light";
  document.documentElement.dataset.theme = n; try{localStorage.setItem("atelier-wan-theme",n)}catch(e){}
  document.dispatchEvent(new CustomEvent("themechange"));
};

/* ---------- icônes ---------- */
const I = W.ICONS = {
  logo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  pdf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h6"/></svg>',
  ext:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/></svg>',
  bolt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M4 16a4 4 0 0 1 4-4h12"/></svg>',
  net:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7 7l3.5 9M17 7l-3.5 9M7.5 6h9"/></svg>',
  term:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 17l6-6-6-6M12 19h8"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
  layers:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
  route:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/></svg>',
  box:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>',
  cloud:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9a4.5 4.5 0 0 0 1 9z"/></svg>',
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 14v4M8 21h8"/></svg>',
};
W.THEME_ICON = {mpls:I.layers, route:I.route, svc:I.box, vpn:I.shield, fr:I.cloud};

/* ---------- en-tête / pied ---------- */
W.shell = function(active){
  const links=[["index.html","Accueil","home"],["index.html#parcours","Les TP","tps"],["defi.html","Défi","defi"],["progression.html","Progression","prog"],["ressources.html","Ressources","res"]];
  const h=document.createElement("header"); h.className="hdr";
  h.innerHTML=`<div class="wrap">
    <a class="brand" href="index.html"><span class="logo">${I.logo}</span><span><b>Atelier WAN</b><small>RSI31 · ISET NABEUL</small></span></a>
    <nav class="nav" id="nav">${links.map(([u,t,k])=>`<a href="${u}" class="${k===active?"on":""}">${t}</a>`).join("")}</nav>
    <div class="hdr-r">
      <button class="kbtn" id="skBtn" aria-label="Rechercher">${I.search}<span>Rechercher</span><kbd>Ctrl K</kbd></button>
      <button class="ibtn" id="thBtn" aria-label="Changer de thème">${document.documentElement.dataset.theme==="light"?I.moon:I.sun}</button>
      <button class="ibtn burger" id="bgBtn" aria-label="Menu">${I.menu}</button>
    </div></div>`;
  document.body.prepend(h);
  const f=document.createElement("footer"); f.className="ftr";
  f.innerHTML=`<div class="wrap"><div><b>Youssfi Jasser</b> · RSI31 · ISET Nabeul · 2026–2027</div>
    <div>Atelier Technologies WAN · <a href="ressources.html">Ressources</a> · <a href="progression.html">Progression</a></div></div>`;
  document.body.append(f);
  $("#thBtn").onclick=()=>{W.toggleTheme(); $("#thBtn").innerHTML=document.documentElement.dataset.theme==="light"?I.moon:I.sun};
  $("#bgBtn").onclick=()=>$("#nav").classList.toggle("open");
  $("#skBtn").onclick=()=>W.search.open();
  W.search.init();
};

/* ---------- recherche Ctrl K ---------- */
W.search = {
  idx:null,
  build(){
    const out=[];
    W.sorted().forEach(t=>{
      out.push({k:"TP",t:`${t.num} · ${t.title}`,s:t.sub,u:`tp.html?id=${t.id}`,x:[t.title,t.sub,t.num,t.short,(t.tags||[]).join(" ")].join(" ")});
      (t.theory||[]).forEach(c=>out.push({k:"Notion",t:c.t,s:t.num+" · "+t.short,u:`tp.html?id=${t.id}#theorie`,x:c.t+" "+c.d.replace(/<[^>]+>/g,"")}));
      (t.glossary||[]).forEach(g=>out.push({k:"Glossaire",t:g[0],s:g[1],u:`ressources.html?q=${encodeURIComponent(g[0])}`,x:g[0]+" "+g[1]}));
      (t.steps||[]).forEach(st=>st.cmds.split("\n").forEach(line=>{
        const c=line.replace(/^\s+/,""); if(!c||c.startsWith("!")) return;
        out.push({k:"Commande",t:c,s:`${t.num} · ${st.t}${st.r?" · "+st.r:""}`,u:`tp.html?id=${t.id}#commandes`,x:c+" "+st.t,code:1});
      }));
    });
    const seen=new Set(); this.idx=out.filter(o=>{const k=o.k+o.t+o.u; if(seen.has(k)) return false; seen.add(k); return true});
  },
  init(){
    if($("#sk")) return;
    const d=document.createElement("div"); d.className="sk"; d.id="sk";
    d.innerHTML=`<div class="sk-box" role="dialog" aria-label="Recherche"><div class="sk-in">${I.search}<input id="skIn" placeholder="Chercher une commande, une notion, un TP…" autocomplete="off"><kbd>Échap</kbd></div><div class="sk-res" id="skRes"></div><div class="sk-foot"><span>↑↓ naviguer</span><span>↵ ouvrir</span><span>Échap fermer</span></div></div>`;
    document.body.append(d);
    d.addEventListener("click",e=>{if(e.target===d) this.close()});
    const inp=$("#skIn"); let sel=0;
    const render=()=>{
      if(!this.idx) this.build();
      const q=inp.value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
      const terms=q.split(/\s+/).filter(Boolean);
      let r = !terms.length ? this.idx.filter(o=>o.k==="TP") :
        this.idx.map(o=>{const x=(o.t+" "+o.x).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,""); if(!terms.every(t=>x.includes(t))) return null;
          let sc=0; const tt=o.t.toLowerCase(); terms.forEach(t=>{if(tt.startsWith(t)) sc+=5; if(tt.includes(t)) sc+=3}); sc+= {TP:4,Notion:3,Glossaire:2,Commande:1}[o.k]; return [sc,o]}).filter(Boolean).sort((a,b)=>b[0]-a[0]).map(a=>a[1]);
      r=r.slice(0,40); sel=Math.min(sel,Math.max(0,r.length-1));
      $("#skRes").innerHTML = r.length ? r.map((o,i)=>`<a class="sk-it${i===sel?" sel":""}" href="${o.u}"><span class="k">${o.k}</span><div>${o.code?`<code>${esc(o.t)}</code>`:`<b>${esc(o.t)}</b>`}<span>${esc(o.s||"")}</span></div></a>`).join("") : `<div class="sk-empty">Aucun résultat pour « ${esc(inp.value)} »</div>`;
    };
    inp.addEventListener("input",()=>{sel=0;render()});
    inp.addEventListener("keydown",e=>{
      const its=$$(".sk-it");
      if(e.key==="ArrowDown"){e.preventDefault(); sel=Math.min(sel+1,its.length-1)}
      else if(e.key==="ArrowUp"){e.preventDefault(); sel=Math.max(sel-1,0)}
      else if(e.key==="Enter"){ if(its[sel]) location.href=its[sel].getAttribute("href"); return }
      else return;
      its.forEach((x,i)=>x.classList.toggle("sel",i===sel)); its[sel]&&its[sel].scrollIntoView({block:"nearest"});
    });
    document.addEventListener("keydown",e=>{
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault(); this.open()}
      else if(e.key==="Escape") this.close();
      else if(e.key==="/"&&!/input|textarea/i.test(document.activeElement.tagName)){e.preventDefault(); this.open()}
    });
    this.render=render;
  },
  open(){ $("#sk").classList.add("on"); const i=$("#skIn"); i.value=""; this.render(); setTimeout(()=>i.focus(),10) },
  close(){ const s=$("#sk"); s&&s.classList.remove("on") }
};

/* ---------- blocs de code ---------- */
W.codeHTML = function(txt){
  return txt.split("\n").map(l=>{
    if(/^\s*!/.test(l)) return `<span class="cm">${esc(l)}</span>`;
    const m=l.match(/^(\s*)([\w\-.]+(?:\([\w\-.]+\))?[#>])(\s?)(.*)$/);
    if(m && /[#>]$/.test(m[2]) && /^[A-Za-z]/.test(m[2])) return `${m[1]}<span class="pr">${esc(m[2])}</span>${m[3]}${esc(m[4])}`;
    return esc(l);
  }).join("\n");
};
W.codeBlock = function(txt){
  return `<div class="codewrap"><pre class="code">${W.codeHTML(txt)}</pre><button class="copy" data-copy>copier</button></div>`;
};
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-copy]"); if(!b) return;
  const pre=b.parentElement.querySelector("pre");
  const txt=pre.innerText.split("\n").map(l=>l.replace(/^\s*[\w\-.]+(\([\w\-.]+\))?[#>]\s?/,"")).filter(l=>!/^\s*!/.test(l)).join("\n");
  (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>{b.textContent="copié ✓"; setTimeout(()=>b.textContent="copier",1400)}).catch(()=>{b.textContent="Ctrl+C"});
});

/* ---------- topologie interactive ---------- */
const NODE_ICON = {
  router:(c)=>`<path d="M-9 -4h13l-3.5 -3.5M9 4H-4l3.5 3.5" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  switch:(c)=>`<path d="M-10 -4h16l-3-3M10 4H-6l3 3" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M-10 -9h20M-10 9h20" stroke="${c}" stroke-width="1" opacity=".5"/>`,
  pc:(c)=>`<rect x="-10" y="-9" width="20" height="13" rx="2" fill="none" stroke="${c}" stroke-width="2"/><path d="M-5 9h10M0 4v5" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,
  server:(c)=>`<rect x="-8" y="-11" width="16" height="22" rx="2.5" fill="none" stroke="${c}" stroke-width="2"/><path d="M-4 -5h8M-4 0h8" stroke="${c}" stroke-width="2" stroke-linecap="round"/><circle cx="0" cy="6" r="1.6" fill="${c}"/>`,
  cloud:(c)=>`<path d="M-9 6h17a5 5 0 0 0 .6-10A7.5 7.5 0 0 0 -5.5 -6 5.6 5.6 0 0 0 -9 6z" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>`,
  frsw:(c)=>`<text x="0" y="4.5" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="12" font-weight="700" fill="${c}">FR</text>`,
  loop:(c)=>`<circle r="7" fill="none" stroke="${c}" stroke-width="2"/><circle r="2" fill="${c}"/>`,
};
W.topo = function(root, T, opts={}){
  const accent = opts.color || "var(--amber)";
  const vb = T.vb || [800,460];
  const N = Object.fromEntries(T.nodes.map(n=>[n.id,n]));
  root.innerHTML = `<div class="topo">
    <div><div class="topo-stage"><svg viewBox="0 0 ${vb[0]} ${vb[1]}" role="img" aria-label="Topologie du TP"></svg>
      <div class="topo-bar"><span class="lbl">Scénarios</span><span class="pings"></span><button class="btn sm ghost" data-reset>Réinitialiser</button></div></div></div>
    <div class="topo-side"><div class="card tp-panel"></div><div class="console" aria-live="polite"></div></div></div>`;
  const svg=$("svg",root), panel=$(".tp-panel",root), cons=$(".console",root);
  const col = v => W.color(v);
  const draw = ()=>{
    const A=col(accent), L=col("--line3"), TX=col("--text2"), MU=col("--muted");
    let g=`<defs><filter id="tglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${MU}"/></marker></defs>`;
    (T.zones||[]).forEach(z=>{const c=col(z.c||"--muted");
      g+=`<rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="16" fill="${c}" fill-opacity=".05" stroke="${c}" stroke-opacity=".45" stroke-dasharray="5 6"/><text class="t-zone" x="${z.x+14}" y="${z.y+19}" fill="${c}">${esc(z.label)}</text>`;
      if(z.sub) g+=`<text class="t-role" x="${z.x+14}" y="${z.y+33}">${esc(z.sub)}</text>`;});
    T.links.forEach((k,i)=>{
      const a=N[k.a], b=N[k.b]; let x1=a.x,y1=a.y,x2=b.x,y2=b.y;
      const dx=x2-x1,dy=y2-y1,Ln=Math.hypot(dx,dy),ux=dx/Ln,uy=dy/Ln,nx=-uy,ny=ux;
      const mx=(x1+x2)/2,my=(y1+y2)/2; let d;
      if(k.type==="serial"||k.type==="ppp"){const p=(t,o)=>`${(mx+ux*t+nx*o).toFixed(1)},${(my+uy*t+ny*o).toFixed(1)}`; d=`M${x1},${y1} L${p(-11,0)} L${p(-4,8)} L${p(4,-8)} L${p(11,0)} L${x2},${y2}`}
      else if(k.type==="tunnel"){const bend=k.bend||-70; d=`M${x1},${y1} Q${mx+nx*bend},${my+ny*bend} ${x2},${y2}`}
      else d=`M${x1},${y1} L${x2},${y2}`;
      const lc = k.type==="tunnel" ? col(k.c||"--rose") : k.type==="pvc" ? col(k.c||"--teal") : k.c? col(k.c) : L;
      const dash = k.type==="tunnel"?'stroke-dasharray="7 6"':k.type==="pvc"?'stroke-dasharray="3 5"':"";
      const sw = k.type==="tunnel"?2.6:k.type==="serial"||k.type==="ppp"?2.2:1.8;
      g+=`<path id="lk${i}" d="${d}" fill="none" stroke="${lc}" stroke-width="${sw}" ${dash} stroke-linecap="round" ${k.type==="tunnel"?'class="tun"':""}/>`;
      const off=(k.lo??18);
      if(k.label){ let lx=mx+nx*off*(k.side||1), ly=my+ny*off*(k.side||1);
        if(k.type==="tunnel"){const bend=k.bend||-70; lx=mx+nx*bend*0.5-nx*14*(bend>0?-1:1); ly=my+ny*bend*0.5-ny*14*(bend>0?-1:1)}
        if(k.lx!=null){lx=k.lx;ly=k.ly}
        g+=`<text class="t-net" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" fill="${k.type==="tunnel"?lc:k.type==="pvc"?lc:A}">${esc(k.label)}</text>`;}
      const r=k.ld??0.27;
      [[k.la,x1+dx*r,y1+dy*r,-1],[k.lb,x2-dx*r,y2-dy*r,1]].forEach(([t,x,y,s])=>{ if(!t) return;
        const o=(k.io??12)*(k.iside||-1);
        g+=`<text class="t-if" x="${(x+nx*o).toFixed(1)}" y="${(y+ny*o+3).toFixed(1)}" text-anchor="middle">${esc(t)}</text>`;});
    });
    T.nodes.forEach(n=>{
      const c = col(n.c || (["pc","server","switch","loop"].includes(n.type) ? "--text2" : accent));
      const big = n.type==="router"||n.type==="frsw"||n.type==="cloud";
      const s = n.type==="cloud"?30:big?24:20;
      g+=`<g class="tnode" data-id="${n.id}" tabindex="0" transform="translate(${n.x},${n.y})">
        <rect class="bx" x="${-s}" y="${-s}" width="${2*s}" height="${2*s}" rx="${n.type==="cloud"?s:11}" fill="${col("--panel")}" stroke="${c}" stroke-width="1.6"/>
        <rect x="${-s+6}" y="${-s+6}" width="${2*s-12}" height="${2*s-12}" rx="8" fill="${c}" fill-opacity=".1"/>
        ${(NODE_ICON[n.type]||NODE_ICON.router)(c)}
        <text class="t-name" x="${n.lx??0}" y="${n.ly??(s+17)}" text-anchor="${n.la||"middle"}">${esc(n.label)}</text>
        ${n.role?`<text class="t-role" x="${n.lx??0}" y="${(n.ly??(s+17))+13}" text-anchor="${n.la||"middle"}">${esc(n.role)}</text>`:""}
      </g>`;
    });
    g+=`<g id="pk"></g>`;
    svg.innerHTML=g;
  };
  draw(); document.addEventListener("themechange",draw);

  const legend = `<div class="legend">
    <span><svg viewBox="0 0 28 10"><path d="M0 5h28" stroke="${col("--line3")}" stroke-width="2"/></svg>Ethernet</span>
    <span><svg viewBox="0 0 28 10"><path d="M0 5h9l3-4 4 8 3-4h9" fill="none" stroke="${col("--line3")}" stroke-width="2"/></svg>Série</span>
    <span><svg viewBox="0 0 28 10"><path d="M0 5h28" stroke="${col("--rose")}" stroke-width="2.4" stroke-dasharray="6 4"/></svg>Tunnel / VPN</span>
    <span><svg viewBox="0 0 28 10"><path d="M0 5h28" stroke="${col("--teal")}" stroke-width="2" stroke-dasharray="3 4"/></svg>PVC</span></div>`;
  const home = ()=>{ panel.innerHTML=`<h4>${esc(T.title||"Topologie")}</h4><div class="role">${esc(T.sub||"cliquez un équipement")}</div>
    <p class="hint">Cliquez sur un routeur pour voir ses interfaces et sa configuration. Lancez un scénario pour suivre un paquet sur le réseau.</p>${legend}`;
    $$(".tnode",svg).forEach(x=>x.classList.remove("sel")); };
  home();
  const show = id=>{ const n=N[id]; $$(".tnode",svg).forEach(x=>x.classList.toggle("sel",x.dataset.id===id));
    panel.innerHTML=`<h4>${esc(n.label)}</h4><div class="role">${esc(n.desc||n.role||"")}</div>
      ${n.ifs?`<ul>${n.ifs.map(([a,b])=>`<li><span>${esc(a)}</span><b>${esc(b)}</b></li>`).join("")}</ul>`:""}
      ${n.cfg?W.codeBlock(n.cfg):""}`; };
  svg.addEventListener("click",e=>{const n=e.target.closest(".tnode"); if(n) show(n.dataset.id); else home()});
  svg.addEventListener("keydown",e=>{const n=e.target.closest(".tnode"); if(n&&(e.key==="Enter"||e.key===" ")){e.preventDefault();show(n.dataset.id)}});

  /* console + paquets */
  const log=(t,cls="")=>{cons.innerHTML+=`<div class="${cls}">${t}</div>`; cons.scrollTop=cons.scrollHeight};
  cons.innerHTML=`<div class="d">// console de simulation · choisissez un scénario</div>`;
  let run=0;
  const anim=(x1,y1,x2,y2,ms,id)=>new Promise(res=>{const t0=performance.now(); const pk=$("#pk",svg);
    const step=t=>{ if(id!==run) return res(false); const p=Math.min(1,(t-t0)/ms), e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
      const x=x1+(x2-x1)*e, y=y1+(y2-y1)*e; const c=pk.querySelector("circle"); c.setAttribute("cx",x); c.setAttribute("cy",y);
      const tx=pk.querySelector("text"); if(tx){tx.setAttribute("x",x); tx.setAttribute("y",y-14)}
      if(p<1) requestAnimationFrame(step); else res(true)}; requestAnimationFrame(step)});
  const sleep=(ms,id)=>new Promise(r=>setTimeout(()=>r(id===run),ms));
  const play = async sc=>{
    const id=++run; const pk=$("#pk",svg); const c=col(sc.c||accent);
    cons.innerHTML=""; log(`<span class="p">$</span> ${esc(sc.cmd||sc.label)}`);
    pk.innerHTML=`<circle r="7" fill="${c}" filter="url(#tglow)"/><text class="t-cap" text-anchor="middle" fill="${c}"></text>`;
    const path=sc.path; let p0=N[path[0].n||path[0]];
    pk.querySelector("circle").setAttribute("cx",p0.x); pk.querySelector("circle").setAttribute("cy",p0.y);
    for(let i=0;i<path.length;i++){
      const h=typeof path[i]==="string"?{n:path[i]}:path[i]; const n=N[h.n];
      if(i>0){ const prev=N[(typeof path[i-1]==="string"?path[i-1]:path[i-1].n)];
        if(h.cap!==undefined) pk.querySelector("text").textContent=h.cap;
        const ok=await anim(prev.x,prev.y,n.x,n.y,h.ms||900,id); if(!ok) return; }
      else if(h.cap) pk.querySelector("text").textContent=h.cap;
      $$(".tnode",svg).forEach(x=>x.classList.toggle("sel",x.dataset.id===h.n));
      if(h.log) log(h.log, h.cls||"");
      if(h.fail){ pk.querySelector("circle").setAttribute("fill",col("--red")); pk.querySelector("text").setAttribute("fill",col("--red")); pk.querySelector("text").textContent="✕ perdu"; if(!h.log) log("Paquet perdu.","e"); break; }
      if(!(await sleep(h.wait||350,id))) return;
    }
    if(id===run && sc.end) log(sc.end, sc.endCls||"p");
  };
  const pings=$(".pings",root);
  (T.scenarios||[]).forEach((sc,i)=>{const b=document.createElement("button"); b.className="btn sm"+(i===0?" pri":""); b.innerHTML=`${I.play}${esc(sc.label)}`; b.style.setProperty("--acc",col(accent)); b.onclick=()=>play(sc); pings.append(b)});
  $("[data-reset]",root).onclick=()=>{run++; $("#pk",svg).innerHTML=""; cons.innerHTML=`<div class="d">// console réinitialisée</div>`; home()};
};

/* ---------- quiz ---------- */
W.quiz = function(root, qs, {id, color, onDone}={}){
  let done=0, good=0;
  root.innerHTML = `<div class="quiz">${qs.map((q,i)=>`<div class="card qq" data-i="${i}"><div class="qn">QUESTION ${i+1} / ${qs.length}</div><h4>${q.q}</h4>
    <div class="opts">${q.o.map((o,j)=>`<button class="opt" data-j="${j}"><span class="l">${"ABCDE"[j]}</span><span>${o}</span></button>`).join("")}</div>
    <div class="expl"></div></div>`).join("")}<div class="card score" hidden></div></div>`;
  root.onclick = e=>{
    if(e.target.closest("[data-retry]")) return W.quiz(root,qs,{id,color,onDone});
    const b=e.target.closest(".opt"); if(!b||b.disabled) return;
    const card=b.closest(".qq"), q=qs[+card.dataset.i], j=+b.dataset.j, ok=j===q.a;
    $$(".opt",card).forEach((x,k)=>{x.disabled=true; if(k===q.a) x.classList.add("ok")}); if(!ok) b.classList.add("ko");
    const ex=$(".expl",card); ex.innerHTML=`<b>${ok?"Exact.":"Pas tout à fait."}</b> ${q.e}`; ex.classList.add("on"); if(!ok) ex.classList.add("ko");
    done++; if(ok) good++;
    if(done===qs.length){
      const p=Math.round(good/qs.length*100); const sc=$(".score",root); sc.hidden=false;
      sc.innerHTML=`<div class="ring" style="--p:${p};--c:${p>=70?"var(--teal)":p>=50?"var(--amber)":"var(--red)"}"><b>${good}/${qs.length}</b></div>
        <div><h4 style="margin:0 0 4px;font-size:20px">${p>=85?"Excellent !":p>=70?"Bien joué.":p>=50?"Pas mal, à revoir.":"À retravailler."}</h4>
        <div class="muted">Score enregistré dans votre <a href="progression.html">progression</a>. Relisez la correction pour les points manqués.</div></div>
        <button class="btn sm" data-retry style="margin-left:auto">Recommencer</button>`;
      if(id) W.store.quiz(id,good,qs.length);
      sc.scrollIntoView({behavior:"smooth",block:"center"}); onDone&&onDone(good,qs.length);
    }
  };
};
})();
