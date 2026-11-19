/* Charge le moteur et les contenus dans l'ordre, puis lance la page */
(function(){
  const files=["assets/js/app.js","assets/js/data/mpls.js","assets/js/data/routage.js","assets/js/data/services.js","assets/js/data/vpn.js","assets/js/data/fr.js"];
  const v="?v=2";
  let i=0;
  const next=()=>{
    if(i>=files.length){ (window.PAGE||function(){})(); return; }
    const s=document.createElement("script"); s.src=files[i++]+v; s.onload=next;
    s.onerror=()=>{console.error("chargement impossible", s.src); next()};
    document.head.appendChild(s);
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",next); else next();
})();
