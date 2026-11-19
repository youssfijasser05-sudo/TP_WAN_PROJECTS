/* TP1 et TP2 — cœur MPLS */
(function(){
const W = window.WAN = window.WAN || {}; W.TPS = W.TPS || [];

const mplsTopo = (extra={}) => ({
  vb:[800,470],
  zones:[
    {x:200,y:30,w:400,h:200,label:"BACKBONE MPLS · OSPF AREA 0",sub:"opérateur · AS 1",c:"--violet"},
    {x:20,y:250,w:760,h:205,label:"CLIENT A · EIGRP AS 100",c:"--sky"},
  ],
  nodes:[
    {id:"sp1",label:"SP1",role:"PE",type:"router",x:270,y:165,desc:"Provider Edge · face au site SIÈGE",
     ifs:[["Loopback0","1.1.1.1/25"],["f0/0 → SP2","192.168.23.1/24"],["e1/0 → SIEGE","192.168.12.1/24"]],
     cfg:extra.sp1||`SP1(config)# interface loopback 0
SP1(config-if)# ip address 1.1.1.1 255.255.255.128
SP1(config-if)# ip ospf network point-to-point
SP1(config)# router ospf 1
SP1(config-router)# router-id 1.1.1.1
SP1(config-router)# network 1.1.1.0 0.0.0.127 area 0
SP1(config-router)# network 192.168.23.0 0.0.0.255 area 0
SP1(config)# mpls ldp router-id loopback 0 force
SP1(config)# interface f0/0
SP1(config-if)# mpls ip`},
    {id:"sp2",label:"SP2",role:"P",type:"router",x:400,y:90,desc:"Provider · cœur du backbone (LSR)",
     ifs:[["Loopback0","2.2.2.2/25"],["f0/0 → SP1","192.168.23.2/24"],["e1/0 → SP3","192.168.34.1/24"]],
     cfg:`SP2(config)# ip cef
SP2(config)# mpls ldp router-id loopback 0 force
SP2(config)# interface f0/0
SP2(config-if)# mpls ip
SP2(config)# interface e1/0
SP2(config-if)# mpls ip
SP2(config)# router ospf 1
SP2(config-router)# router-id 2.2.2.2
SP2(config-router)# network 2.2.2.0 0.0.0.127 area 0
SP2(config-router)# network 192.168.23.0 0.0.0.255 area 0
SP2(config-router)# network 192.168.34.0 0.0.0.255 area 0`},
    {id:"sp3",label:"SP3",role:"PE",type:"router",x:530,y:165,desc:"Provider Edge · face au site AGENCE",
     ifs:[["Loopback0","3.3.3.3/25"],["e1/0 → SP2","192.168.34.2/24"],["f0/0 → AGENCE","192.168.45.1/24"]],
     cfg:extra.sp3||`SP3(config)# router ospf 1
SP3(config-router)# router-id 3.3.3.3
SP3(config-router)# network 3.3.3.0 0.0.0.127 area 0
SP3(config-router)# network 192.168.34.0 0.0.0.255 area 0
SP3(config)# mpls ldp router-id loopback 0 force
SP3(config)# interface e1/0
SP3(config-if)# mpls ip`},
    {id:"siege",label:"SIEGE",role:"CE",type:"router",x:180,y:320,c:"--sky",desc:"Customer Edge · site siège",
     ifs:[["f0/0 → SP1","192.168.12.2/24"],["e1/0 → LAN","10.10.10.1/24"]],
     cfg:`SIEGE(config)# router eigrp 100
SIEGE(config-router)# network 10.10.10.0 0.0.0.255
SIEGE(config-router)# network 192.168.12.0
SIEGE(config-router)# no auto-summary`},
    {id:"agence",label:"AGENCE",role:"CE",type:"router",x:620,y:320,c:"--sky",desc:"Customer Edge · site agence",
     ifs:[["f0/0 → SP3","192.168.45.2/24"],["e1/0 → LAN","192.168.1.1/24"]],
     cfg:`AGENCE(config)# router eigrp 100
AGENCE(config-router)# network 192.168.1.0
AGENCE(config-router)# network 192.168.45.0
AGENCE(config-router)# no auto-summary`},
    {id:"lan1",label:"LAN SIEGE",role:"10.10.10.0/24",type:"switch",x:80,y:405,desc:"Réseau local du siège"},
    {id:"lan2",label:"LAN AGENCE",role:"192.168.1.0/24",type:"switch",x:720,y:405,desc:"Réseau local de l'agence"},
  ],
  links:[
    {a:"siege",b:"sp1",label:"192.168.12.0/24",la:".2",lb:".1",side:-1},
    {a:"sp1",b:"sp2",label:"192.168.23.0/24",la:".1",lb:".2",side:1},
    {a:"sp2",b:"sp3",label:"192.168.34.0/24",la:".1",lb:".2",side:-1},
    {a:"sp3",b:"agence",label:"192.168.45.0/24",la:".1",lb:".2",side:1},
    {a:"siege",b:"lan1",la:".1"},
    {a:"agence",b:"lan2",la:".1"},
  ],
  ...extra.more
});

W.TPS.push({
  id:"tp1", order:1, num:"TP1", short:"Backbone MPLS", sub:"OSPF · EIGRP · LDP", theme:"mpls", tool:"GNS3 · Cisco 7200",
  title:"Backbone MPLS : OSPF, EIGRP et LDP",
  intro:"Construire le cœur d'un réseau d'opérateur capable d'offrir un service MPLS : trois routeurs SP sous OSPF Area 0, un client en EIGRP AS 100, puis activation de MPLS/LDP et lecture des labels.",
  pdf:"SIMULATIONS/TP1_1_2/Compte-rendu_TP1_MPLS.pdf",
  tags:["mpls","ldp","ospf","eigrp","label","lfib","lib","php"],
  objectives:["Monter la maquette sous GNS3 et configurer interfaces physiques et loopbacks","Configurer OSPF (zone 0 unique) dans le backbone de l'opérateur","Configurer EIGRP (AS 100) dans le réseau du client","Activer MPLS/LDP et analyser les labels échangés (LIB, LFIB, PHP)"],
  theory:[
    {t:"Pourquoi MPLS ?", d:"MPLS (<b>Multi Protocol Label Switching</b>) commute les paquets à partir d'une étiquette courte (le <b>label</b>, 20 bits) au lieu de refaire une recherche IP complète à chaque saut. Le label est inséré entre l'en-tête de niveau 2 et l'en-tête IP (on parle de couche « 2,5 »). C'est la base des services opérateurs : VPN de niveau 3, ingénierie de trafic, QoS."},
    {t:"Rôles des routeurs : CE, PE, P", d:"<b>CE</b> (Customer Edge) : routeur du client, ne connaît pas MPLS (SIEGE, AGENCE). <b>PE</b> (Provider Edge) : routeur de bordure de l'opérateur, il ajoute (push) ou retire les labels (SP1, SP3). <b>P</b> (Provider) : routeur de cœur qui ne fait que commuter des labels (SP2)."},
    {t:"Le rôle de l'IGP (OSPF)", d:"MPLS s'appuie sur la table de routage : LDP attribue un label à chaque préfixe appris par l'IGP. Il faut donc d'abord une connectivité IP complète dans le backbone (OSPF Area 0). Les loopbacks servent d'identifiants stables (router-ID OSPF, LDP et plus tard BGP)."},
    {t:"Loopback /25 et point-to-point", d:"Par défaut OSPF annonce une loopback en <b>/32</b>, quel que soit le masque configuré. Avec <code class='i'>ip ospf network point-to-point</code> sur la loopback, OSPF annonce le vrai masque (/25). Cela évite une incohérence entre le préfixe annoncé et le préfixe pour lequel LDP distribue un label."},
    {t:"LDP : distribution des labels", d:"<b>LDP</b> (Label Distribution Protocol) découvre ses voisins en UDP 646 (hello multicast), puis ouvre une session TCP 646. Chaque routeur choisit un label local pour chaque préfixe et l'annonce à ses voisins. <code class='i'>mpls ldp router-id loopback 0 force</code> fixe l'identifiant LDP sur la loopback."},
    {t:"LIB et LFIB", d:"La <b>LIB</b> (Label Information Base, <code class='i'>show mpls ldp bindings</code>) contient pour chaque préfixe le label local et tous les labels reçus des voisins. La <b>LFIB</b> (<code class='i'>show mpls forwarding-table</code>) ne garde que le label sortant du meilleur prochain saut : c'est la table réellement utilisée pour commuter."},
    {t:"PHP et imp-null", d:"Pour un préfixe qui lui est directement connecté, le routeur annonce le label spécial <b>implicit-null</b> (valeur 3). L'avant-dernier routeur retire alors le label (<b>Pop Label</b>) avant de transmettre : c'est le <b>Penultimate Hop Popping</b>. Le dernier routeur n'a ainsi qu'une recherche IP à faire."},
  ],
  glossary:[["MPLS","Multi Protocol Label Switching : commutation de paquets par labels."],["LSR","Label Switch Router : routeur qui commute des labels (P)."],["LER","Label Edge Router : routeur de bordure qui pose ou retire les labels (PE)."],["LSP","Label Switched Path : chemin suivi par les paquets labellisés."],["LDP","Label Distribution Protocol, TCP/UDP 646."],["LIB","Label Information Base : tous les labels connus par préfixe."],["LFIB","Label Forwarding Information Base : table de commutation des labels."],["PHP","Penultimate Hop Popping : retrait du label à l'avant-dernier saut."],["imp-null","Label implicit-null (3) qui demande le PHP."],["FEC","Forwarding Equivalence Class : ensemble de paquets traités de la même manière."]],
  topo: Object.assign(mplsTopo(), {title:"Backbone MPLS", sub:"3 routeurs SP · 2 sites client",
    scenarios:[
      {label:"SP3 → 1.1.1.1 (labels)", cmd:"SP3# ping 1.1.1.1 source 3.3.3.3", c:"--violet",
       path:[{n:"sp3",cap:"IP",log:"SP3 : LFIB → préfixe 1.1.1.0/25, label sortant <b>16</b> via e1/0",cls:"w"},{n:"sp2",cap:"label 16",log:"SP2 : label entrant 16 → <b>Pop Label</b> (PHP), SP2 est l'avant-dernier saut",cls:"w"},{n:"sp1",cap:"IP",log:"SP1 : paquet IP reçu sans label, simple recherche IP (loopback locale)"}],
       end:"!!!!! Success rate is 100 percent (5/5)"},
      {label:"SIEGE → AGENCE (avant VPN)", cmd:"SIEGE# ping 192.168.1.1", c:"--red",
       path:[{n:"siege",cap:"?",log:"SIEGE : aucune route vers 192.168.1.0/24 (pas de voisin EIGRP à travers l'opérateur)",cls:"w"},{n:"sp1",fail:true,log:"Le backbone ne transporte pas encore les routes du client : il faudra le VPN MPLS (TP2).",cls:"e"}],
       end:""}
    ]}),
  steps:[
    {t:"Configuration de base", r:"SP1 (idem SP2, SP3)", cmds:`SP1(config)# hostname SP1
SP1(config)# no ip domain-lookup
SP1(config)# interface loopback 0
SP1(config-if)# ip address 1.1.1.1 255.255.255.128
SP1(config)# interface fastethernet 0/0
SP1(config-if)# ip address 192.168.23.1 255.255.255.0
SP1(config-if)# no shutdown
SP1(config)# interface ethernet 1/0
SP1(config-if)# ip address 192.168.12.1 255.255.255.0
SP1(config-if)# no shutdown
SP1# show ip interface brief`},
    {t:"OSPF Area 0 dans le backbone", r:"SP1", cmds:`SP1(config)# interface loopback 0
SP1(config-if)# ip ospf network point-to-point
SP1(config)# interface fastethernet 0/0
SP1(config-if)# ip ospf network point-to-point
SP1(config)# router ospf 1
SP1(config-router)# router-id 1.1.1.1
SP1(config-router)# network 1.1.1.0 0.0.0.127 area 0
SP1(config-router)# network 192.168.12.0 0.0.0.255 area 0
SP1(config-router)# network 192.168.23.0 0.0.0.255 area 0
SP1# show ip ospf neighbor
SP1# show ip route ospf
SP1# ping 3.3.3.3 source 1.1.1.1`},
    {t:"EIGRP AS 100 chez le client", r:"SIEGE (idem AGENCE)", cmds:`SIEGE(config)# router eigrp 100
SIEGE(config-router)# network 10.10.10.0 0.0.0.255
SIEGE(config-router)# network 192.168.12.0
SIEGE(config-router)# no auto-summary
SIEGE# show ip eigrp neighbors`, note:"Aucun voisin EIGRP n'apparaît : l'opérateur ne transporte pas encore le routage du client."},
    {t:"Activation de MPLS / LDP", r:"SP2 (idem SP1 et SP3 sur leurs liens SP)", cmds:`SP2(config)# ip cef
SP2(config)# mpls ldp router-id loopback 0 force
SP2(config)# interface fastethernet 0/0
SP2(config-if)# mpls ip
SP2(config)# interface ethernet 1/0
SP2(config-if)# mpls ip`, note:"Le message %LDP-5-NBRCHG confirme l'établissement des adjacences LDP."},
    {t:"Vérifications MPLS", r:"SP1, SP2, SP3", cmds:`SP2# show mpls ldp neighbor
SP2# show mpls interfaces
SP2# show mpls forwarding-table
SP2# show mpls ldp bindings`},
  ],
  quiz:[
    {q:"Quel routeur de la maquette joue le rôle de routeur P (Provider) ?", o:["SP1","SP2","SP3","SIEGE"], a:1, e:"SP2 est au cœur du backbone : il ne fait que commuter des labels entre SP1 et SP3, sans lien vers un client."},
    {q:"Où se place l'en-tête MPLS dans une trame ?", o:["Avant l'en-tête Ethernet","Entre l'en-tête de niveau 2 et l'en-tête IP","Après l'en-tête TCP","Dans le champ options d'IP"], a:1, e:"Le label (shim header de 32 bits) s'insère entre la couche 2 et la couche 3, d'où le surnom de couche 2,5."},
    {q:"Pourquoi applique-t-on <code class='i'>ip ospf network point-to-point</code> sur les loopbacks ?", o:["Pour accélérer la convergence OSPF","Pour qu'OSPF annonce le vrai masque /25 au lieu d'un /32","Pour activer MPLS sur la loopback","Pour en faire une interface passive"], a:1, e:"Sans cette commande OSPF annonce toujours une loopback en /32, ce qui crée une incohérence avec le préfixe /25 utilisé par LDP."},
    {q:"Quel port utilise LDP pour ses sessions entre voisins ?", o:["TCP 179","UDP 520","TCP 646","UDP 1701"], a:2, e:"LDP découvre ses voisins en UDP 646 puis ouvre une session TCP 646. TCP 179 est BGP, UDP 520 est RIP."},
    {q:"Dans la LFIB de SP2, le préfixe 1.1.1.0/25 a « Pop Label » comme label sortant. Pourquoi ?", o:["SP2 ne connaît pas ce préfixe","SP1 a annoncé imp-null : SP2, avant-dernier saut, retire le label (PHP)","Le lien SP1-SP2 n'a pas MPLS","C'est une erreur de configuration"], a:1, e:"SP1 possède ce préfixe et annonce le label implicit-null. SP2 retire donc le label avant d'envoyer le paquet : c'est le PHP."},
    {q:"Quelle table contient TOUS les labels reçus des voisins pour chaque préfixe ?", o:["La LFIB","La RIB","La LIB","La table ARP"], a:2, e:"La LIB (show mpls ldp bindings) garde tous les bindings ; la LFIB ne garde que celui du meilleur prochain saut."},
    {q:"Après ce TP, SIEGE peut-il joindre le LAN AGENCE ?", o:["Oui, grâce à MPLS","Oui, grâce à OSPF","Non, le backbone ne transporte pas encore les routes du client","Oui, par la route par défaut"], a:2, e:"Les CE ne sont pas encore voisins EIGRP à travers l'opérateur : c'est l'objet du VPN MPLS (VRF + MP-BGP) du TP2."},
  ],
  correction:[
    {q:"Les interfaces sont-elles opérationnelles ?", a:"Oui : <code class='i'>show ip interface brief</code> montre les interfaces utilisées à l'état up/up sur SP1 et SIEGE, et les pings SIEGE→SP1 (192.168.12.1) et AGENCE→SP3 (192.168.45.1) réussissent à 100 %."},
    {q:"OSPF fonctionne-t-il dans le backbone ?", a:"SP1 a une adjacence FULL avec SP2 (2.2.2.2). Sa table de routage contient les loopbacks de SP2 et SP3 en /25 ainsi que 192.168.34.0/24 et 192.168.45.0/24. Le ping <code class='i'>ping 3.3.3.3 source 1.1.1.1</code> confirme la connectivité totale."},
    {q:"Les routeurs CE sont-ils voisins EIGRP ?", a:"Non. <code class='i'>show ip eigrp neighbors</code> sur SIEGE est vide : l'opérateur ne transporte pas encore le routage du client, les deux LAN ne communiquent pas."},
    {q:"Quelles adjacences LDP observe-t-on ?", a:"SP2 est voisin LDP de SP1 (1.1.1.1) et de SP3 (3.3.3.3). SP1 et SP3 n'ont qu'un voisin, SP2 (2.2.2.2). Toutes les sessions sont à l'état Oper."},
    {q:"Quelles interfaces fonctionnent avec MPLS ?", a:"Uniquement les liaisons entre routeurs SP : f0/0 sur SP1, f0/0 et e1/0 sur SP2, e1/0 sur SP3. Les liens vers les CE ne sont pas concernés."},
    {q:"Quels labels sont utilisés pour le préfixe 1.1.1.0/25 ?", a:"SP1 : imp-null (préfixe local, il demande le retrait du label). SP2 : label local 16, sortant <b>Pop Label</b> vers 192.168.23.1 (PHP). SP3 : label local 16, sortant 16 vers 192.168.34.1. Un paquet de SP3 part donc avec le label 16, SP2 le retire et transmet le paquet IP à SP1. Les deux « 16 » sont une coïncidence : les labels ont une signification locale."},
  ],
});

W.TPS.push({
  id:"tp2", order:2, num:"TP2", short:"VPN MPLS", sub:"VRF · MP-BGP", theme:"mpls", tool:"GNS3 · Cisco 7200",
  title:"VPN MPLS : VRF et MP-BGP",
  intro:"Relier les deux sites du Client A à travers le backbone : une VRF par client sur les PE, EIGRP dans la VRF côté client, MP-BGP VPNv4 entre SP1 et SP3, puis redistribution mutuelle et observation du double label.",
  sim:{dir:"TP2_MPLS_VPN", modes:["demo","tutorial","practice","test"], slides:1232, steps:366},
  tags:["vrf","rd","route-target","mp-bgp","vpnv4","eigrp","redistribution","label stacking"],
  objectives:["Créer une instance VRF Client_A (RD 100:1, RT 1:100) sur SP1 et SP3","Associer la VRF aux interfaces PE-CE et tester avec ping vrf","Configurer EIGRP dans la VRF (address-family ipv4 vrf)","Monter une session MP-BGP VPNv4 entre les loopbacks des PE et redistribuer EIGRP ↔ BGP","Observer les en-têtes MPLS et le label stacking avec Wireshark et traceroute"],
  theory:[
    {t:"VRF : une table de routage par client", d:"Une <b>VRF</b> (Virtual Routing and Forwarding) est une table de routage isolée sur le PE. Chaque client a la sienne : deux clients peuvent utiliser les mêmes adresses privées sans conflit. Les interfaces vers le CE sont placées dans la VRF avec <code class='i'>ip vrf forwarding</code>."},
    {t:"RD : rendre les préfixes uniques", d:"Le <b>Route Distinguisher</b> (64 bits, ex. 100:1) est ajouté devant le préfixe IPv4 pour former une adresse <b>VPNv4</b> unique dans le backbone. 10.10.10.0/24 du client A devient 100:1:10.10.10.0/24. Le RD sert uniquement à distinguer, pas à filtrer."},
    {t:"RT : qui importe quoi", d:"Le <b>Route Target</b> est une communauté BGP étendue attachée aux routes VPNv4. <code class='i'>route-target export</code> marque les routes qui sortent de la VRF, <code class='i'>import</code> choisit celles qui y entrent. <code class='i'>both</code> fait les deux. Une route avec un RT 100:100 n'est donc pas importée dans une VRF configurée en 1:100."},
    {t:"Effet de ip vrf forwarding", d:"Placer une interface dans une VRF <b>efface son adresse IP</b> : il faut la ressaisir. Ensuite, le réseau PE-CE n'est plus dans la table globale : <code class='i'>ping 192.168.12.2</code> échoue, il faut <code class='i'>ping vrf Client_A 192.168.12.2</code>."},
    {t:"EIGRP dans une VRF", d:"Sur le PE on démarre <code class='i'>router eigrp 1</code> (AS de l'opérateur, sans signification pour le client), puis <code class='i'>address-family ipv4 vrf Client_A</code> avec <code class='i'>autonomous-system 100</code> pour parler au CE dans son AS. Les routes apprises vont dans la table VRF, jamais dans la table globale."},
    {t:"MP-BGP VPNv4", d:"Les PE échangent les routes des clients par une session <b>iBGP</b> entre loopbacks (<code class='i'>update-source Loopback0</code>). L'<code class='i'>address-family vpnv4</code> active le transport des préfixes VPNv4, et <code class='i'>send-community both</code> est indispensable pour transmettre les Route Targets."},
    {t:"Redistribution EIGRP ↔ BGP", d:"Sur chaque PE, les routes EIGRP du CE sont redistribuées dans BGP (<code class='i'>redistribute eigrp 100</code>), et les routes BGP venant de l'autre PE sont redistribuées dans EIGRP avec une métrique composite : bande passante 1500, délai 4000, fiabilité 200, charge 10, MTU 1500."},
    {t:"Double label (label stacking)", d:"Un paquet client traversant le backbone porte <b>deux labels</b> : le label <b>externe</b> (LDP) qui l'amène au PE de sortie, et le label <b>interne</b> (VPN, distribué par MP-BGP) qui indique au PE de sortie la VRF et le CE de destination. Traceroute et Wireshark permettent de les voir."},
  ],
  glossary:[["VRF","Virtual Routing and Forwarding : table de routage isolée par client."],["RD","Route Distinguisher : préfixe 64 bits qui rend une route VPNv4 unique."],["RT","Route Target : communauté étendue BGP qui contrôle l'import/export des routes VPN."],["VPNv4","Famille d'adresses RD + IPv4 transportée par MP-BGP."],["MP-BGP","Multiprotocol BGP : extensions BGP pour d'autres familles d'adresses."],["Label stacking","Empilement de plusieurs labels MPLS (transport + VPN)."]],
  topo: Object.assign(mplsTopo({
    sp1:`SP1(config)# ip vrf Client_A
SP1(config-vrf)# rd 100:1
SP1(config-vrf)# route-target both 1:100
SP1(config)# interface e1/0
SP1(config-if)# ip vrf forwarding Client_A
SP1(config-if)# ip address 192.168.12.1 255.255.255.0
SP1(config)# router eigrp 1
SP1(config-router)# address-family ipv4 vrf Client_A
SP1(config-router-af)# network 192.168.12.0
SP1(config-router-af)# autonomous-system 100
SP1(config-router-af)# redistribute bgp 1 metric 1500 4000 200 10 1500
SP1(config)# router bgp 1
SP1(config-router)# neighbor 3.3.3.3 remote-as 1
SP1(config-router)# neighbor 3.3.3.3 update-source Loopback0
SP1(config-router)# address-family vpnv4
SP1(config-router-af)# neighbor 3.3.3.3 activate
SP1(config-router-af)# neighbor 3.3.3.3 send-community both
SP1(config-router)# address-family ipv4 vrf Client_A
SP1(config-router-af)# redistribute eigrp 100`,
    sp3:`SP3(config)# ip vrf Client_A
SP3(config-vrf)# rd 100:1
SP3(config-vrf)# route-target both 1:100
SP3(config)# interface f0/0
SP3(config-if)# ip vrf forwarding Client_A
SP3(config-if)# ip address 192.168.45.1 255.255.255.0
SP3(config)# router eigrp 1
SP3(config-router)# address-family ipv4 vrf Client_A
SP3(config-router-af)# network 192.168.45.0
SP3(config-router-af)# autonomous-system 100
SP3(config-router-af)# redistribute bgp 1 metric 1500 4000 200 10 1500
SP3(config)# router bgp 1
SP3(config-router)# neighbor 1.1.1.1 remote-as 1
SP3(config-router)# neighbor 1.1.1.1 update-source Loopback0
SP3(config-router)# address-family vpnv4
SP3(config-router-af)# neighbor 1.1.1.1 activate
SP3(config-router-af)# neighbor 1.1.1.1 send-community both
SP3(config-router)# address-family ipv4 vrf Client_A
SP3(config-router-af)# redistribute eigrp 100`
  }), {title:"VPN MPLS du Client A", sub:"VRF Client_A · RD 100:1 · RT 1:100",
    scenarios:[
      {label:"SIEGE → 192.168.1.1", cmd:"SIEGE# ping 192.168.1.1", c:"--violet",
       path:[{n:"siege",cap:"IP",log:"SIEGE : route EIGRP D EX vers 192.168.1.0/24 (redistribuée par SP1)"},
             {n:"sp1",cap:"[LDP|VPN]",log:"SP1 (PE) : table VRF Client_A → route B via 3.3.3.3 · <b>push</b> label VPN (interne) + label LDP (externe)",cls:"w"},
             {n:"sp2",cap:"[VPN]",log:"SP2 (P) : commute le label externe → <b>pop</b> (PHP vers SP3) · le label VPN reste",cls:"w"},
             {n:"sp3",cap:"IP",log:"SP3 (PE) : label VPN → VRF Client_A · retire le label, transmet en IP vers AGENCE",cls:"w"},
             {n:"agence",log:"AGENCE : 192.168.1.1 répond"}],
       end:"!!!!! Success rate is 100 percent (5/5)"},
      {label:"SP1 ping 192.168.12.2 (sans VRF)", cmd:"SP1# ping 192.168.12.2", c:"--red",
       path:[{n:"sp1",log:"SP1 : 192.168.12.0/24 n'est plus dans la table globale (interface dans la VRF)",cls:"w"},{n:"siege",fail:true,log:"Échec. Il faut : SP1# ping vrf Client_A 192.168.12.2",cls:"e"}]},
    ]}),
  steps:[
    {t:"Étape 1 · VRF Client_A sur les PE", r:"SP1 et SP3", cmds:`SP1(config)# ip vrf Client_A
SP1(config-vrf)# rd 100:1
SP1(config-vrf)# route-target both 1:100
SP1(config)# interface e1/0
SP1(config-if)# ip vrf forwarding Client_A
! l'adresse IP a été effacée : on la ressaisit
SP1(config-if)# ip address 192.168.12.1 255.255.255.0
SP1(config-if)# no shutdown
SP1# ping vrf Client_A 192.168.12.2
SP1# show ip vrf`},
    {t:"Étape 2 · EIGRP dans la VRF", r:"SP3 (idem SP1 avec 192.168.12.0)", cmds:`SP3(config)# router eigrp 1
SP3(config-router)# address-family ipv4 vrf Client_A
SP3(config-router-af)# network 192.168.45.0
SP3(config-router-af)# no auto-summary
SP3(config-router-af)# autonomous-system 100
SP3(config-router-af)# exit-address-family
SP3# show ip route
SP3# show ip route vrf Client_A`},
    {t:"Étape 3 · MP-BGP entre SP1 et SP3", r:"SP1", cmds:`SP1(config)# router bgp 1
SP1(config-router)# neighbor 3.3.3.3 remote-as 1
SP1(config-router)# neighbor 3.3.3.3 update-source Loopback0
SP1(config-router)# address-family vpnv4
SP1(config-router-af)# neighbor 3.3.3.3 activate
SP1(config-router-af)# neighbor 3.3.3.3 send-community both
SP1(config-router-af)# exit-address-family`},
    {t:"Étape 3 · MP-BGP entre SP1 et SP3", r:"SP3", cmds:`SP3(config)# router bgp 1
SP3(config-router)# neighbor 1.1.1.1 remote-as 1
SP3(config-router)# neighbor 1.1.1.1 update-source Loopback0
SP3(config-router)# address-family vpnv4
SP3(config-router-af)# neighbor 1.1.1.1 activate
SP3(config-router-af)# neighbor 1.1.1.1 send-community both
SP3(config-router-af)# exit-address-family
SP3# show bgp vpnv4 unicast all summary`},
    {t:"Étape 3 · Redistribution BGP ↔ EIGRP", r:"SP1 et SP3", cmds:`SP1(config)# router eigrp 1
SP1(config-router)# address-family ipv4 vrf Client_A
SP1(config-router-af)# redistribute bgp 1 metric 1500 4000 200 10 1500
SP1(config)# router bgp 1
SP1(config-router)# address-family ipv4 vrf Client_A
SP1(config-router-af)# redistribute eigrp 100
SP3# show ip route vrf Client_A`},
    {t:"Étape 4 · Tests de connectivité", r:"SIEGE et AGENCE", cmds:`SIEGE# ping 192.168.1.1
AGENCE# ping 10.10.10.1
AGENCE# traceroute 10.10.10.1
SIEGE# traceroute 192.168.1.1`, note:"Capturer avec Wireshark entre SP2 et SP3 : on voit deux en-têtes MPLS devant l'en-tête IP."},
  ],
  quiz:[
    {q:"SP1 reçoit par MP-BGP une route VPNv4 avec le Route Target 100:100. Sera-t-elle importée dans la VRF Client_A ?", o:["Oui, toutes les routes VPNv4 sont importées","Non, la VRF n'importe que le RT 1:100","Oui, car le RD vaut 100:1","Seulement si send-community est absent"], a:1, e:"L'import dépend du RT, pas du RD. La VRF est configurée avec route-target both 1:100 : une route marquée 100:100 est ignorée."},
    {q:"Pourquoi faut-il ressaisir l'adresse IP après <code class='i'>ip vrf forwarding</code> ?", o:["Parce que l'interface redémarre","Parce que l'association à une VRF efface l'adresse IP de l'interface","Pour changer de masque","Ce n'est pas nécessaire"], a:1, e:"IOS supprime l'adresse IP quand on déplace une interface dans une VRF, puisqu'elle change de table de routage."},
    {q:"SP1# ping 192.168.12.2 échoue mais SIEGE# ping 192.168.12.1 réussit. Pourquoi ?", o:["SIEGE bloque l'ICMP","Le réseau 192.168.12.0 est dans la table VRF de SP1, pas dans sa table globale","Le lien est coupé dans un sens","OSPF n'est pas configuré"], a:1, e:"SIEGE n'a qu'une table, SP1 cherche dans sa table globale par défaut. Il faut ping vrf Client_A 192.168.12.2."},
    {q:"À quoi sert le RD 100:1 ?", o:["À filtrer les routes importées","À rendre un préfixe client unique dans le backbone (adresse VPNv4)","À chiffrer le trafic","À identifier le voisin BGP"], a:1, e:"Le RD est concaténé au préfixe IPv4 pour former une adresse VPNv4 unique, même si deux clients ont le même plan d'adressage."},
    {q:"Quelle commande est indispensable pour que les Route Targets soient transmis entre PE ?", o:["neighbor x activate","neighbor x send-community both","neighbor x next-hop-self","redistribute connected"], a:1, e:"Les RT sont des communautés étendues : sans send-community (extended ou both) le voisin ne les reçoit pas et n'importe rien."},
    {q:"Combien de labels porte un paquet SIEGE → AGENCE entre SP1 et SP2 ?", o:["Aucun","Un seul","Deux : label LDP externe + label VPN interne","Trois"], a:2, e:"Le label externe (LDP) achemine vers SP3, le label interne (VPN, appris par MP-BGP) indique à SP3 la VRF de destination."},
    {q:"Dans la table de routage VRF de SP3, comment apparaissent les réseaux du site SIEGE ?", o:["En D (EIGRP)","En O (OSPF)","En B (BGP)","En C (connecté)"], a:2, e:"Ils sont appris de SP1 par MP-BGP VPNv4 : routes B. SP3 les redistribue ensuite dans EIGRP vers AGENCE."},
  ],
  correction:[
    {q:"Une route VPNv4 avec le RT 100:100 sera-t-elle importée dans la VRF ?", a:"Non. La VRF Client_A importe uniquement les routes portant le RT <b>1:100</b> (route-target both 1:100). Le RD n'intervient pas dans la décision d'import."},
    {q:"Pourquoi SP1# ping 192.168.12.2 échoue-t-il ?", a:"Après ip vrf forwarding, le réseau 192.168.12.0/24 n'est plus dans la table de routage globale de SP1 mais dans la table VRF. Le ping par défaut utilise la table globale. <code class='i'>ping vrf Client_A 192.168.12.2</code> réussit."},
    {q:"Les PE ont-ils une route vers 192.168.12.0/24 ou 192.168.45.0/24 dans la table globale ?", a:"Non. <code class='i'>show ip route</code> ne montre que le backbone (OSPF, loopbacks). Ces réseaux sont uniquement visibles avec <code class='i'>show ip route vrf Client_A</code>."},
    {q:"Y a-t-il des routes EIGRP (D) dans la table VRF ?", a:"Oui : chaque PE apprend en D les réseaux de SON CE (10.10.10.0/24 sur SP1, 192.168.1.0/24 sur SP3)."},
    {q:"SIEGE et SP1 ont-ils des routes vers les réseaux côté AGENCE (et inversement) ?", a:"Pas avant l'étape 3 : sans MP-BGP, rien ne transporte les routes d'un PE à l'autre. Après MP-BGP et la redistribution, SP1 a des routes B vers le côté AGENCE et SIEGE les reçoit en D EX."},
    {q:"Que montre Wireshark entre SP2 et SP3 ?", a:"Les paquets ICMP sont précédés d'en-têtes MPLS : entre SP1 et SP2 on voit deux labels (LDP + VPN, bit S=1 sur le dernier). Après le PHP de SP2, il ne reste que le label VPN entre SP2 et SP3."},
    {q:"Que montrent les traceroutes ?", a:"Chaque saut du backbone affiche les labels utilisés (MPLS: Labels x/y), ce qui permet de vérifier le label stacking : label de transport puis label VPN."},
  ],
});
})();
