/* Frame Relay de base et avancé */
(function(){
const W = window.WAN = window.WAN || {}; W.TPS = W.TPS || [];

W.TPS.push({
  id:"fr1", order:8, num:"TP Frame Relay", short:"Frame Relay", sub:"PVC · DLCI · Inverse ARP", theme:"fr", tool:"GNS3 · Wireshark",
  title:"Frame Relay : PVC, DLCI et mappage",
  intro:"Un siège et deux agences reliés par un nuage Frame Relay (commutateurs FR2, FR3, FR4). Encapsulation Frame Relay, lecture des PVC et de la signalisation LMI dans Wireshark, mappage dynamique par Inverse ARP, routage statique, puis passage au mappage statique.",
  sim:{dir:"TP_FRAMERELAY_BASIC", modes:["demo","tutorial","practice","test"], slides:634, steps:147},
  tags:["frame relay","dlci","pvc","lmi","inverse arp","map","broadcast","dte","dce"],
  objectives:["Réaliser la topologie sous GNS3 et activer l'encapsulation Frame Relay","Interpréter show frame-relay pvc et show interface serial","Analyser dans Wireshark la signalisation LMI et les messages Inverse ARP","Adresser le WAN en 192.168.2.0/29 et les LAN, ajouter les routes statiques","Remplacer le mappage dynamique par un mappage statique avec broadcast"],
  theory:[
    {t:"Le principe de Frame Relay", d:"Frame Relay est une technologie WAN à <b>commutation de trames</b> de niveau 2. L'opérateur fournit un nuage de commutateurs ; les routeurs clients (<b>DTE</b>) s'y raccordent par une seule interface série vers le commutateur (<b>DCE</b>). Plusieurs circuits virtuels partagent ce même accès physique."},
    {t:"PVC et DLCI", d:"Un <b>PVC</b> (circuit virtuel permanent) relie deux sites à travers le nuage. Il est identifié sur chaque accès par un <b>DLCI</b> (Data Link Connection Identifier). Le DLCI a une <b>signification locale</b> : le siège joint l'Agence 1 par le DLCI 16, et l'Agence 1 joint le siège par le DLCI 61."},
    {t:"LMI : la signalisation", d:"La <b>LMI</b> (Local Management Interface) est un dialogue entre le routeur et le commutateur FR : keepalives (STATUS ENQUIRY / STATUS) et, régulièrement, un <b>Full Status</b> qui liste les DLCI configurés et leur état (Active, Inactive, Deleted). Types : cisco, ansi, q933a. Wireshark l'affiche en Q.933."},
    {t:"Inverse ARP", d:"ARP trouve une MAC à partir d'une IP. <b>Inverse ARP</b> fait l'inverse : sur chaque DLCI actif, le routeur envoie une requête pour découvrir l'<b>adresse IP</b> du routeur à l'autre bout. Il remplit ainsi automatiquement la table <code class='i'>show frame-relay map</code> (entrées « dynamic »)."},
    {t:"Mappage statique et broadcast", d:"Inverse ARP n'est pas toujours fiable : la bonne pratique est le mappage statique <code class='i'>frame-relay map ip 192.168.2.2 16 broadcast</code>. On associe l'adresse IP <b>distante</b> au DLCI <b>local</b>. Le mot-clé <code class='i'>broadcast</code> réplique le trafic de diffusion et multicast sur le PVC, ce que demandent la plupart des protocoles de routage."},
    {t:"NBMA et split horizon", d:"Un réseau Frame Relay multipoint est <b>NBMA</b> (Non Broadcast Multiple Access) : pas de diffusion native. Sur une interface physique multipoint, la règle du split horizon empêche le siège de relayer une route d'une agence vers l'autre : c'est la limite que le TP avancé résout avec les sous-interfaces."},
  ],
  glossary:[["Frame Relay","Technologie WAN de commutation de trames sur circuits virtuels."],["DTE","Data Terminal Equipment : équipement client (routeur)."],["DCE","Data Circuit-terminating Equipment : équipement opérateur (commutateur FR)."],["PVC","Permanent Virtual Circuit : circuit virtuel permanent."],["DLCI","Data Link Connection Identifier : numéro local d'un PVC (16 à 1007)."],["LMI","Local Management Interface : signalisation entre DTE et DCE."],["Inverse ARP","Découverte de l'IP distante associée à un DLCI."],["NBMA","Non Broadcast Multiple Access : réseau multi-accès sans diffusion native."]],
  topo:{vb:[800,470], title:"Siège et deux agences", sub:"WAN FR 192.168.2.0/29",
    zones:[{x:300,y:110,w:250,h:200,label:"NUAGE FRAME RELAY",sub:"FR2 · FR3 · FR4",c:"--teal"}],
    nodes:[
      {id:"siege",label:"Siège",role:"DTE",type:"router",x:190,y:210,desc:"Routeur du siège",ifs:[["s1/0","192.168.2.1/29"],["f0/0 → LAN","192.168.1.1/24"],["DLCI 16","→ Agence 1"],["DLCI 17","→ Agence 2"]],
       cfg:`Siege(config)# interface s1/0
Siege(config-if)# encapsulation frame-relay
Siege(config-if)# ip address 192.168.2.1 255.255.255.248
Siege(config-if)# no frame-relay inverse-arp
Siege(config-if)# frame-relay map ip 192.168.2.2 16 broadcast
Siege(config-if)# frame-relay map ip 192.168.2.3 17 broadcast
Siege(config-if)# no shutdown
Siege(config)# ip route 192.168.3.0 255.255.255.0 192.168.2.2
Siege(config)# ip route 192.168.4.0 255.255.255.0 192.168.2.3`},
      {id:"lan1",label:"LAN Siège",role:"192.168.1.0/24",type:"switch",x:70,y:320},
      {id:"fr",label:"FR",role:"commutateurs DCE",type:"cloud",x:425,y:220,c:"--teal",desc:"Commutation des PVC : (Siège,16) ↔ (Agence1,61) · (Siège,17) ↔ (Agence2,71)"},
      {id:"a1",label:"Agence 1",role:"DTE",type:"router",x:650,y:110,desc:"Routeur de l'agence 1",ifs:[["s1/0","192.168.2.2/29"],["f0/0 → LAN","192.168.3.1/24"],["DLCI 61","→ Siège"]],
       cfg:`Agence1(config)# interface s1/0
Agence1(config-if)# encapsulation frame-relay
Agence1(config-if)# ip address 192.168.2.2 255.255.255.248
Agence1(config-if)# frame-relay map ip 192.168.2.1 61 broadcast
Agence1(config)# ip route 192.168.1.0 255.255.255.0 192.168.2.1
Agence1(config)# ip route 192.168.4.0 255.255.255.0 192.168.2.1`},
      {id:"lan3",label:"LAN Agence 1",role:"192.168.3.0/24",type:"switch",x:735,y:200},
      {id:"a2",label:"Agence 2",role:"DTE",type:"router",x:650,y:330,desc:"Routeur de l'agence 2",ifs:[["s1/0","192.168.2.3/29"],["f0/0 → LAN","192.168.4.1/24"],["DLCI 71","→ Siège"]],
       cfg:`Agence2(config)# interface s1/0
Agence2(config-if)# encapsulation frame-relay
Agence2(config-if)# ip address 192.168.2.3 255.255.255.248
Agence2(config-if)# frame-relay map ip 192.168.2.1 71 broadcast
Agence2(config)# ip route 192.168.1.0 255.255.255.0 192.168.2.1
Agence2(config)# ip route 192.168.3.0 255.255.255.0 192.168.2.1`},
      {id:"lan4",label:"LAN Agence 2",role:"192.168.4.0/24",type:"switch",x:735,y:415},
    ],
    links:[
      {a:"siege",b:"fr",type:"serial",label:"DLCI 16 · 17",la:"s1/0 .1",side:-1,lo:20},
      {a:"fr",b:"a1",type:"serial",label:"DLCI 61",lb:"s1/0 .2",side:-1},
      {a:"fr",b:"a2",type:"serial",label:"DLCI 71",lb:"s1/0 .3",side:1},
      {a:"siege",b:"lan1",la:"f0/0 .1"},{a:"a1",b:"lan3",la:".1"},{a:"a2",b:"lan4",la:".1"},
      {a:"siege",b:"a1",type:"pvc",label:"PVC 16 ↔ 61",lx:470,ly:100},
      {a:"siege",b:"a2",type:"pvc",label:"PVC 17 ↔ 71",lx:470,ly:330},
    ],
    scenarios:[
      {label:"Inverse ARP sur le DLCI 16", cmd:"Siege(config-if)# encapsulation frame-relay", c:"--teal",
       path:[{n:"siege",cap:"InARP ?",log:"Siège : DLCI 16 actif (LMI) → requête Inverse ARP « qui est au bout du DLCI 16 ? » (sender 192.168.2.1)"},{n:"fr",cap:"16→61"},{n:"a1",cap:"192.168.2.2",log:"Agence 1 : réponse Inverse ARP, sender 192.168.2.2",cls:"w"},{n:"fr",cap:"61→16"},{n:"siege",log:"Siège : show frame-relay map → 192.168.2.2 dlci 16, dynamic"}],
       end:"Serial1/0 (up): ip 192.168.2.2 dlci 16(0x10,0x400), dynamic, broadcast, status defined, active"},
      {label:"LAN Siège → LAN Agence 1", cmd:"Siege# ping 192.168.3.1 source f0/0", c:"--amber",
       path:[{n:"lan1",cap:"IP"},{n:"siege",cap:"DLCI 16",log:"Siège : route 192.168.3.0 via 192.168.2.2 · map 192.168.2.2 → DLCI 16"},{n:"fr",cap:"DLCI 61",log:"Nuage FR : commute la trame du DLCI 16 (port siège) vers le DLCI 61 (port agence 1)",cls:"w"},{n:"a1",log:"Agence 1 : trame reçue sur DLCI 61, paquet IP vers son LAN"},{n:"lan3"}],
       end:"!!!!! Success rate is 100 percent (5/5)"},
      {label:"Après no inverse-arp, sans map", cmd:"Siege# clear frame-relay inarp  ·  ping 192.168.2.2", c:"--red",
       path:[{n:"siege",fail:true,log:"Siège : plus aucune correspondance IP ↔ DLCI → « encapsulation failed ». Il faut le mappage statique.",cls:"e"}]},
    ]},
  steps:[
    {t:"Encapsulation Frame Relay", r:"Siège (idem Agence 1 et 2)", cmds:`Siege(config)# interface s1/0
Siege(config-if)# encapsulation frame-relay
Siege(config-if)# no shutdown
Siege# show frame-relay pvc
Siege# show interface serial1/0`},
    {t:"Adressage du WAN (192.168.2.0/29)", r:"Siège, Agence 1, Agence 2", cmds:`Siege(config-if)# ip address 192.168.2.1 255.255.255.248
Agence1(config-if)# ip address 192.168.2.2 255.255.255.248
Agence2(config-if)# ip address 192.168.2.3 255.255.255.248
Siege# show frame-relay map
Siege# ping 192.168.2.2
Siege# ping 192.168.2.3`},
    {t:"LAN et routes statiques", r:"tous", cmds:`Siege(config)# interface f0/0
Siege(config-if)# ip address 192.168.1.1 255.255.255.0
Siege(config-if)# no shutdown
Siege(config)# ip route 192.168.3.0 255.255.255.0 192.168.2.2
Siege(config)# ip route 192.168.4.0 255.255.255.0 192.168.2.3
Agence1(config)# ip route 192.168.1.0 255.255.255.0 192.168.2.1
Agence1(config)# ip route 192.168.4.0 255.255.255.0 192.168.2.1
Agence2(config)# ip route 192.168.1.0 255.255.255.0 192.168.2.1
Agence2(config)# ip route 192.168.3.0 255.255.255.0 192.168.2.1
Siege# ping 192.168.3.1 source f0/0`},
    {t:"Mappage statique", r:"Siège", cmds:`Siege(config)# interface s1/0
Siege(config-if)# no frame-relay inverse-arp
Siege# clear frame-relay inarp
Siege# ping 192.168.2.2
Siege(config-if)# frame-relay map ip 192.168.2.2 16 broadcast
Siege(config-if)# frame-relay map ip 192.168.2.3 17 broadcast
Siege# show frame-relay map`},
    {t:"Mappage statique", r:"Agences", cmds:`Agence1(config-if)# frame-relay map ip 192.168.2.1 61 broadcast
Agence2(config-if)# frame-relay map ip 192.168.2.1 71 broadcast`},
  ],
  quiz:[
    {q:"Que signifie le fait qu'un DLCI ait une signification locale ?", o:["Il est le même aux deux extrémités du PVC","Il identifie le PVC uniquement sur l'accès entre un routeur et son commutateur","Il change à chaque trame","Il n'existe que dans le LAN"], a:1, e:"Le siège voit le PVC vers l'Agence 1 comme DLCI 16, l'Agence 1 le voit comme DLCI 61 : le nuage fait la correspondance."},
    {q:"À quoi sert Inverse ARP ?", o:["À trouver la MAC d'une IP","À découvrir l'adresse IP du routeur au bout d'un DLCI","À chiffrer les trames","À choisir le type de LMI"], a:1, e:"Il associe dynamiquement l'IP distante au DLCI local et remplit la table frame-relay map."},
    {q:"Dans <code class='i'>frame-relay map ip 192.168.2.2 16 broadcast</code>, l'adresse IP est celle…", o:["de l'interface locale","du routeur à l'autre extrémité du PVC","du commutateur FR","du LAN distant"], a:1, e:"On mappe l'IP distante (Agence 1 = 192.168.2.2) au DLCI local (16)."},
    {q:"Pourquoi ajouter le mot-clé <code class='i'>broadcast</code> ?", o:["Pour accélérer les pings","Pour que le trafic de diffusion et multicast (protocoles de routage) soit envoyé sur le PVC","Pour activer Inverse ARP","Pour changer le DLCI"], a:1, e:"Frame Relay est NBMA : sans broadcast, les mises à jour de routage multicast ne traversent pas le PVC."},
    {q:"Quels messages LMI voit-on dans Wireshark entre le siège et FR1 ?", o:["HELLO OSPF","STATUS ENQUIRY et STATUS (keepalive et full status avec l'état des PVC)","DHCP DISCOVER","ARP request"], a:1, e:"Le DTE interroge (STATUS ENQUIRY), le DCE répond (STATUS). Le full status liste les DLCI 16 et 17 actifs."},
    {q:"Que signifie l'état « active » d'un PVC ?", o:["Le PVC est configuré et fonctionnel de bout en bout","Le PVC a été supprimé","Le routeur distant est éteint","La LMI ne répond pas"], a:0, e:"Active = PVC opérationnel. Inactive = le bout distant ne répond pas. Deleted = DLCI inconnu du commutateur."},
  ],
  correction:[
    {q:"Interpréter show frame-relay pvc et show interface serial1/0", a:"Le routeur voit 2 PVC <b>actifs</b> (DLCI 16 et 17, usage LOCAL, status ACTIVE) avec leurs compteurs de paquets. <code class='i'>show interface</code> indique encapsulation FRAME-RELAY, le type de LMI, le nombre d'enquêtes envoyées et de STATUS reçus, et l'interface DTE up/up."},
    {q:"Analyse Wireshark entre le siège (DTE) et FR1 (DCE)", a:"Messages LMI Q.933 : <b>STATUS ENQUIRY</b> du routeur et <b>STATUS</b> du commutateur. La plupart sont de simples keepalives (Link integrity verification) ; périodiquement un <b>Full Status</b> contient des éléments « PVC Status » pour les DLCI 16 et 17 avec le statut Active."},
    {q:"Interpréter show frame-relay map", a:"Serial1/0 (up) : ip 192.168.2.2 dlci 16 et ip 192.168.2.3 dlci 17, <b>dynamic</b> (appris par Inverse ARP), broadcast, status defined, active."},
    {q:"Messages Inverse ARP (Wireshark)", a:"Requête sur le DLCI 16 : opcode Inverse request, sender 192.168.2.1, target 0.0.0.0. Réponse : opcode <b>Inverse reply</b>, sender 192.168.2.2 : le siège associe le DLCI 16 à 192.168.2.2."},
    {q:"À quoi sert de mapper une adresse IP avec un DLCI ?", a:"Sur une interface multipoint, plusieurs PVC partagent la même interface : pour envoyer un paquet vers une IP du réseau 192.168.2.0/29, le routeur doit savoir sur quel DLCI placer la trame. Le mappage joue le rôle de l'ARP d'un réseau Ethernet."},
    {q:"Le DLCI est-il mappé avec l'adresse IP locale ou celle de l'autre extrémité ?", a:"Avec l'adresse IP de <b>l'autre extrémité</b> du PVC, associée au DLCI <b>local</b>. Exemple sur le siège : <code class='i'>frame-relay map ip 192.168.2.2 16 broadcast</code>. <code class='i'>show frame-relay map</code> affiche alors des entrées <b>static</b>."},
  ],
});

W.TPS.push({
  id:"fr2", order:9, num:"TP Frame Relay avancé", short:"FR avancé", sub:"hub & spoke · secours", theme:"fr", tool:"GNS3 · VPCS",
  title:"Frame Relay avancé : sous-interfaces et lien de secours",
  intro:"Topologie hub and spoke : SiteCentral relié à deux agences par un commutateur Frame Relay, plus une liaison PPP de secours vers l'Agence 1. On montre pourquoi une interface physique multipoint empêche le basculement, puis on corrige avec des sous-interfaces point à point et RIPv2.",
  sim:{dir:"FRAMERELAY_ADVANCED", modes:["demo","tutorial","practice","test"], slides:1501, steps:334},
  tags:["frame relay","hub and spoke","sous-interface","point-to-point","ppp","route flottante","distance administrative","ripv2","lmi ansi","frame-relay interface-dlci"],
  objectives:["Configurer le commutateur Frame Relay (PVC 1/16 ↔ 2/16 et 1/17 ↔ 3/16)","Configurer PPP sur le lien 172.16.1.0/24 et Frame Relay LMI ANSI","Créer des routes statiques avec une route flottante (DA 50) via PPP","Constater l'échec du basculement quand s0/1 d'Agence1 tombe","Créer des sous-interfaces point à point, passer en RIPv2 et retester"],
  theory:[
    {t:"Hub and spoke", d:"Le <b>hub</b> (SiteCentral) a un PVC vers chaque <b>spoke</b> (Agence1, Agence2). Les agences ne communiquent qu'en passant par le site central. Côté commutateur : port 1/DLCI 16 ↔ port 2/DLCI 16 (Agence1) et port 1/DLCI 17 ↔ port 3/DLCI 16 (Agence2)."},
    {t:"Route statique flottante", d:"On crée deux routes vers le même LAN : une par Frame Relay (distance 1 par défaut) et une par le lien PPP avec <b>distance administrative 50</b>. Seule la meilleure est installée ; la route flottante n'apparaît dans la table que si la route principale disparaît, c'est-à-dire si son interface de sortie passe <b>down</b>."},
    {t:"Le piège de l'interface multipoint", d:"Sur SiteCentral, s0/1 porte deux PVC. Si Agence1 coupe sa s0/1, le PVC 16 devient inactif mais <b>l'interface physique reste up/up</b> car le PVC 17 vers Agence2 fonctionne toujours. La route statique via le FR reste dans la table : SiteCentral continue d'envoyer vers un PVC mort, les paquets sont perdus. Le routage est asymétrique."},
    {t:"Sous-interfaces point à point", d:"On découpe s0/1 en <b>sous-interfaces</b>, une par PVC : <code class='i'>s0/1.16 point-to-point</code> et <code class='i'>s0/1.17 point-to-point</code>, chacune avec son propre réseau /30 (192.168.0.0/30 et 192.168.100.0/30). Chaque sous-interface suit l'état de <b>son</b> PVC : si le PVC tombe, la sous-interface passe down."},
    {t:"frame-relay interface-dlci", d:"Sur une sous-interface point à point, Inverse ARP ne s'applique pas : il faut affecter explicitement le DLCI avec <code class='i'>frame-relay interface-dlci 16</code>. Tout ce qui sort de la sous-interface part sur ce DLCI, sans table de mappage."},
    {t:"RIPv2 pour le basculement", d:"Avec RIPv2, quand s0/1.16 passe down, la route apprise par ce lien est retirée et la route via PPP (172.16.1.0/24) est utilisée automatiquement. Les sous-interfaces point à point règlent aussi le problème du split horizon en hub and spoke."},
  ],
  glossary:[["Hub and spoke","Topologie en étoile : un site central relié à chaque agence."],["Sous-interface","Interface logique créée sur une interface physique (s0/1.16)."],["Point-to-point","Sous-interface qui porte un seul PVC, comme une ligne louée."],["Route flottante","Route statique de secours avec une distance administrative plus élevée."],["PPP","Point-to-Point Protocol : encapsulation de liaison série point à point."],["LMI ANSI","Type de signalisation LMI (Annex D) choisi dans ce TP."]],
  topo:{vb:[800,490], title:"Hub and spoke avec secours PPP", sub:"FR LMI ANSI · PPP 172.16.1.0/24",
    nodes:[
      {id:"sc",label:"SiteCentral",role:"hub",type:"router",x:400,y:100,c:"--teal",desc:"Site central (hub)",ifs:[["fa0/0 → LAN","192.168.1.254/24"],["s0/0 (PPP)","172.16.1.1/24"],["s0/1.16 → Agence1","192.168.0.1/30 · DLCI 16"],["s0/1.17 → Agence2","192.168.100.1/30 · DLCI 17"]],
       cfg:`SiteCentral(config)# interface s0/0
SiteCentral(config-if)# encapsulation ppp
SiteCentral(config-if)# ip address 172.16.1.1 255.255.255.0
SiteCentral(config)# interface s0/1
SiteCentral(config-if)# encapsulation frame-relay
SiteCentral(config-if)# frame-relay lmi-type ansi
SiteCentral(config-if)# no ip address
SiteCentral(config)# interface s0/1.16 point-to-point
SiteCentral(config-subif)# description PVC-avec-agence1
SiteCentral(config-subif)# ip address 192.168.0.1 255.255.255.252
SiteCentral(config-subif)# frame-relay interface-dlci 16
SiteCentral(config)# interface s0/1.17 point-to-point
SiteCentral(config-subif)# description PVC-avec-agence2
SiteCentral(config-subif)# ip address 192.168.100.1 255.255.255.252
SiteCentral(config-subif)# frame-relay interface-dlci 17
SiteCentral(config)# router rip
SiteCentral(config-router)# version 2
SiteCentral(config-router)# no auto-summary
SiteCentral(config-router)# network 192.168.0.0
SiteCentral(config-router)# network 192.168.1.0
SiteCentral(config-router)# network 192.168.100.0
SiteCentral(config-router)# network 172.16.0.0`},
      {id:"lanc",label:"COMM2",role:"192.168.1.0/24",type:"switch",x:580,y:60},
      {id:"c2",label:"C2",role:"192.168.1.10",type:"pc",x:720,y:60,desc:"Hôte VPCS du site central",ifs:[["IP","192.168.1.10/24"],["Passerelle","192.168.1.254"]]},
      {id:"frsw",label:"FR",role:"commutateur",type:"frsw",x:420,y:300,c:"--teal",desc:"Commutateur Frame Relay : port1/16 ↔ port2/16 · port1/17 ↔ port3/16"},
      {id:"a1",label:"Agence1",role:"spoke",type:"router",x:170,y:240,desc:"Agence 1 : FR + secours PPP",ifs:[["fa0/0 → LAN","192.168.2.254/24"],["s0/0 (PPP)","172.16.1.2/24"],["s0/1.16 (FR)","192.168.0.2/30 · DLCI 16"]],
       cfg:`Agence1(config)# interface s0/0
Agence1(config-if)# encapsulation ppp
Agence1(config-if)# ip address 172.16.1.2 255.255.255.0
Agence1(config)# interface s0/1
Agence1(config-if)# encapsulation frame-relay
Agence1(config-if)# frame-relay lmi-type ansi
Agence1(config)# interface s0/1.16 point-to-point
Agence1(config-subif)# ip address 192.168.0.2 255.255.255.252
Agence1(config-subif)# frame-relay interface-dlci 16
Agence1(config)# router rip
Agence1(config-router)# version 2
Agence1(config-router)# no auto-summary
Agence1(config-router)# network 192.168.0.0
Agence1(config-router)# network 192.168.2.0
Agence1(config-router)# network 172.16.0.0`},
      {id:"lan1",label:"COMM1",role:"192.168.2.0/24",type:"switch",x:90,y:360},
      {id:"c1",label:"C1",role:"192.168.2.10",type:"pc",x:215,y:420,desc:"Hôte VPCS de l'agence 1",ifs:[["IP","192.168.2.10/24"],["Passerelle","192.168.2.254"]]},
      {id:"a2",label:"Agence2",role:"spoke",type:"router",x:640,y:320,desc:"Agence 2",ifs:[["fa0/0 → LAN","192.168.3.254/24"],["s0/0.16 (FR)","192.168.100.2/30 · DLCI 16"]],
       cfg:`Agence2(config)# interface s0/0
Agence2(config-if)# encapsulation frame-relay
Agence2(config-if)# frame-relay lmi-type ansi
Agence2(config)# interface s0/0.16 point-to-point
Agence2(config-subif)# ip address 192.168.100.2 255.255.255.252
Agence2(config-subif)# frame-relay interface-dlci 16
Agence2(config)# router rip
Agence2(config-router)# version 2
Agence2(config-router)# no auto-summary
Agence2(config-router)# network 192.168.100.0
Agence2(config-router)# network 192.168.3.0`},
      {id:"lan3",label:"COMM3",role:"192.168.3.0/24",type:"switch",x:745,y:425},
    ],
    links:[
      {a:"sc",b:"a1",type:"ppp",label:"172.16.1.0/24 · PPP",la:"s0/0 .1",lb:"s0/0 .2",side:-1,lo:22,c:"--amber"},
      {a:"sc",b:"frsw",type:"serial",label:"port 1",la:"s0/1",ld:.42,side:1,lo:22},
      {a:"frsw",b:"a1",type:"serial",label:"port 2 · DLCI 16",lb:"s0/1",side:1,lo:20},
      {a:"frsw",b:"a2",type:"serial",label:"port 3 · DLCI 16",lb:"s0/0",side:-1,lo:18},
      {a:"sc",b:"lanc",la:"fa0/0"},{a:"lanc",b:"c2"},
      {a:"a1",b:"lan1",la:"fa0/0"},{a:"lan1",b:"c1"},
      {a:"a2",b:"lan3",la:"fa0/0"},
    ],
    scenarios:[
      {label:"C2 → C1 (par le FR)", cmd:"C2> ping 192.168.2.10", c:"--teal",
       path:[{n:"c2"},{n:"lanc"},{n:"sc",cap:"DLCI 16",log:"SiteCentral : 192.168.2.0/24 via 192.168.0.2 (FR, distance 1) · la route PPP (DA 50) reste flottante"},{n:"frsw",cap:"port1/16→2/16",log:"FR : commutation port 1 DLCI 16 → port 2 DLCI 16"},{n:"a1"},{n:"lan1"},{n:"c1"}],
       end:"84 bytes from 192.168.2.10 icmp_seq=1 ttl=62"},
      {label:"Partie 1 · s0/1 d'Agence1 coupée", cmd:"Agence1(config-if)# shutdown  ·  C2> ping 192.168.2.10", c:"--red",
       path:[{n:"c2"},{n:"lanc"},{n:"sc",log:"SiteCentral : s0/1 reste up/up (le PVC 17 vers Agence2 est actif) → la route statique via le FR reste installée",cls:"w"},{n:"frsw",fail:true,log:"Le PVC 16 est inactif : paquets perdus. Agence1, elle, a basculé sur PPP → routage asymétrique, le ping échoue.",cls:"e"}]},
      {label:"Partie 2 · sous-interfaces + RIPv2", cmd:"Agence1(config-if)# shutdown  ·  C2> ping 192.168.2.10", c:"--amber",
       path:[{n:"c2"},{n:"lanc"},{n:"sc",cap:"PPP",log:"SiteCentral : s0/1.16 passe down avec son PVC → RIP retire la route · nouvelle route via 172.16.1.2 (PPP)",cls:"w"},{n:"a1",log:"Agence1 : reçu par s0/0 (PPP)"},{n:"lan1"},{n:"c1"}],
       end:"Basculement réussi : trace C2 → 192.168.1.254 → 172.16.1.2 → 192.168.2.10"},
    ]},
  steps:[
    {t:"Interfaces, PPP et Frame Relay", r:"SiteCentral", cmds:`SiteCentral(config)# hostname SiteCentral
SiteCentral(config)# interface fa0/0
SiteCentral(config-if)# ip address 192.168.1.254 255.255.255.0
SiteCentral(config-if)# no shutdown
SiteCentral(config)# interface s0/0
SiteCentral(config-if)# ip address 172.16.1.1 255.255.255.0
SiteCentral(config-if)# encapsulation ppp
SiteCentral(config-if)# no shutdown
SiteCentral(config)# interface s0/1
SiteCentral(config-if)# ip address 192.168.0.1 255.255.255.0
SiteCentral(config-if)# encapsulation frame-relay
SiteCentral(config-if)# frame-relay lmi-type ansi
SiteCentral(config-if)# no shutdown
SiteCentral# show frame-relay lmi
SiteCentral# show frame-relay pvc
SiteCentral# show frame-relay map`},
    {t:"Routes statiques et route flottante", r:"SiteCentral, Agence1, Agence2", cmds:`SiteCentral(config)# ip route 192.168.2.0 255.255.255.0 192.168.0.2
SiteCentral(config)# ip route 192.168.2.0 255.255.255.0 172.16.1.2 50
SiteCentral(config)# ip route 192.168.3.0 255.255.255.0 192.168.0.3
Agence1(config)# ip route 192.168.1.0 255.255.255.0 192.168.0.1
Agence1(config)# ip route 192.168.1.0 255.255.255.0 172.16.1.1 50
Agence2(config)# ip route 192.168.1.0 255.255.255.0 192.168.0.1
SiteCentral# show ip route
SiteCentral# show running-config | include ip route`},
    {t:"Hôtes VPCS et tests", r:"C1, C2, C3", cmds:`C1> ip 192.168.2.10/24 192.168.2.254
C2> ip 192.168.1.10/24 192.168.1.254
C3> ip 192.168.3.10/24 192.168.3.254
C3> ping 192.168.1.10
C1> ping 192.168.1.10`},
    {t:"Panne de s0/1 sur Agence1 (partie 1)", r:"Agence1, SiteCentral", cmds:`Agence1(config)# interface s0/1
Agence1(config-if)# shutdown
Agence1# show ip route
SiteCentral# show ip interface brief
C2> ping 192.168.2.10`},
    {t:"Sous-interfaces point à point (partie 2)", r:"SiteCentral", cmds:`SiteCentral(config)# int s0/1
SiteCentral(config-if)# no ip address
SiteCentral(config-if)# exit
SiteCentral(config)# int s0/1.16 point-to-point
SiteCentral(config-subif)# description PVC-avec-agence1
SiteCentral(config-subif)# ip address 192.168.0.1 255.255.255.252
SiteCentral(config-subif)# frame-relay interface-dlci 16
SiteCentral(config-fr-dlci)# exit
SiteCentral(config-subif)# no shutdown
SiteCentral(config)# int s0/1.17 point-to-point
SiteCentral(config-subif)# description PVC-avec-agence2
SiteCentral(config-subif)# ip address 192.168.100.1 255.255.255.252
SiteCentral(config-subif)# frame-relay interface-dlci 17
SiteCentral(config-fr-dlci)# exit
SiteCentral(config-subif)# no shutdown`},
    {t:"Sous-interfaces des agences", r:"Agence2 et Agence1", cmds:`Agence2(config)# int s0/0.16 point-to-point
Agence2(config-subif)# ip address 192.168.100.2 255.255.255.252
Agence2(config-subif)# frame-relay interface-dlci 16
Agence1(config)# int s0/1.16 point-to-point
Agence1(config-subif)# ip address 192.168.0.2 255.255.255.252
Agence1(config-subif)# frame-relay interface-dlci 16`},
    {t:"RIPv2 à la place des routes statiques", r:"tous", cmds:`SiteCentral(config)# no ip route 192.168.2.0 255.255.255.0 192.168.0.2
SiteCentral(config)# no ip route 192.168.2.0 255.255.255.0 172.16.1.2 50
SiteCentral(config)# router rip
SiteCentral(config-router)# version 2
SiteCentral(config-router)# no auto-summary
SiteCentral(config-router)# network 192.168.0.0
SiteCentral(config-router)# network 192.168.1.0
SiteCentral(config-router)# network 192.168.100.0
SiteCentral(config-router)# network 172.16.0.0
Agence1(config)# interface s0/1
Agence1(config-if)# no shutdown
C2> ping 192.168.3.10
C2> ping 192.168.2.10
Agence1(config-if)# shutdown
Agence1# show ip route
SiteCentral# show ip interface brief
C2> ping 192.168.2.10
C2> trace 192.168.2.10`},
  ],
  quiz:[
    {q:"Pourquoi ajoute-t-on « 50 » à la fin de la route statique via le lien PPP ?", o:["C'est la métrique RIP","C'est une distance administrative plus élevée : la route ne sert qu'en secours (route flottante)","C'est le DLCI","C'est la bande passante"], a:1, e:"Une route statique vaut 1 par défaut. Avec 50, elle n'est installée que si la route via le FR disparaît."},
    {q:"Partie 1 : Agence1 coupe sa s0/1. Pourquoi SiteCentral continue-t-il d'envoyer par le FR ?", o:["Parce que PPP est plus lent","Parce que son interface physique s0/1 reste up/up grâce au PVC vers Agence2 : la route statique reste valide","Parce que le DLCI change","Parce que RIP est désactivé"], a:1, e:"Une route statique n'est retirée que si son interface de sortie tombe. Avec deux PVC sur une même interface, la perte d'un seul PVC ne la fait pas tomber."},
    {q:"Que permet une sous-interface point à point ?", o:["D'augmenter le débit","D'avoir une interface logique par PVC, qui suit l'état de son PVC","De supprimer la LMI","De chiffrer le PVC"], a:1, e:"Si le PVC 16 tombe, seule s0/1.16 passe down : la route qui l'utilise est retirée et le secours prend le relais."},
    {q:"Pourquoi la commande <code class='i'>frame-relay interface-dlci</code> est-elle obligatoire sur une sous-interface point à point ?", o:["Pour activer PPP","Parce qu'Inverse ARP ne fonctionne pas sur une sous-interface point à point : il faut lui attribuer son DLCI","Pour choisir la LMI","Elle est facultative"], a:1, e:"L'énoncé le précise : sans DLCI associé, la sous-interface ne sait pas sur quel PVC envoyer."},
    {q:"Côté commutateur, le PVC SiteCentral ↔ Agence2 utilise…", o:["port 1 DLCI 16 ↔ port 2 DLCI 16","port 1 DLCI 17 ↔ port 3 DLCI 16","port 2 DLCI 17 ↔ port 3 DLCI 17","port 1 DLCI 17 ↔ port 3 DLCI 17"], a:1, e:"Le hub voit Agence2 sur le DLCI 17, Agence2 voit le hub sur son DLCI 16 : les DLCI sont locaux."},
    {q:"Partie 2, après la coupure de s0/1 d'Agence1 : quelle est la route de SiteCentral vers 192.168.2.0/24 ?", o:["Via 192.168.0.2 (FR)","Via 172.16.1.2 (PPP), apprise par RIP","Aucune","Via Agence2"], a:1, e:"s0/1.16 est down, RIP retire la route via le FR et installe celle reçue par le lien PPP."},
  ],
  correction:[
    {q:"Partie 1 · Route opérationnelle sur Agence1 vers 192.168.1.0/24 après le shutdown de s0/1", a:"La route via le FR disparaît (interface down) : la route flottante <b>S 192.168.1.0/24 [50/0] via 172.16.1.1</b> (PPP) est installée."},
    {q:"Partie 1 · État de s0/1 sur SiteCentral, route utilisée, ping C2 → C1", a:"s0/1 reste <b>up/up</b> car le PVC 17 vers Agence2 est toujours actif (seul le PVC 16 devient inactif). SiteCentral garde donc la route via 192.168.0.2 et continue d'envoyer dans le FR : les paquets sont perdus. Le ping C2 → C1 <b>échoue</b> : le retour passe par PPP mais l'aller part dans un PVC mort (routage asymétrique)."},
    {q:"Partie 2 · Pourquoi des sous-interfaces ?", a:"Pour séparer l'interface physique de la configuration des circuits virtuels : une sous-interface par PVC (s0/1.16 et s0/1.17), chacune sur son propre réseau, comme une liaison louée. Inverse ARP ne fonctionnant pas en point à point, le DLCI est attribué avec <code class='i'>frame-relay interface-dlci</code>."},
    {q:"Partie 2 · Après le shutdown de s0/1 sur Agence1 : route vers 192.168.1.0/24", a:"Agence1 apprend 192.168.1.0/24 par RIP via <b>172.16.1.1</b> (s0/0, PPP)."},
    {q:"Partie 2 · État de s0/1 et de s0/1.16 sur SiteCentral, route vers 192.168.2.0/24", a:"s0/1 reste up (PVC 17 actif) mais <b>s0/1.16 passe down</b> (son PVC est inactif). RIP retire la route via le FR : SiteCentral envoie vers 192.168.2.0/24 par <b>172.16.1.2</b> (PPP). Le ping C2 → C1 réussit et <code class='i'>trace</code> montre 192.168.1.254 → 172.16.1.2 → 192.168.2.10."},
  ],
});
})();
