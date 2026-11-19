/* Lab BGP et redistribution */
(function(){
const W = window.WAN = window.WAN || {}; W.TPS = W.TPS || [];

W.TPS.push({
  id:"bgp", order:3, num:"Lab BGP", short:"eBGP entre FAI", sub:"AS 100 ↔ AS 200", theme:"route", tool:"Routeurs 1841 · Packet Tracer / GNS3",
  title:"eBGP entre deux fournisseurs d'accès",
  intro:"Une petite société se connecte à son FAI local (ISP1) par une route par défaut. ISP1 (AS 100) échange ensuite ses routes avec ISP2 (AS 200) grâce à BGP4, le protocole de routage de l'Internet.",
  tags:["bgp","ebgp","as","route par défaut","route statique","show ip bgp"],
  objectives:["Configurer le routeur client avec une route par défaut vers ISP1","Configurer sur ISP1 une route statique de retour vers le réseau du client","Établir une session eBGP entre ISP1 (AS 100) et ISP2 (AS 200)","Lire les tables de routage et la table BGP (show ip bgp)"],
  theory:[
    {t:"IGP et EGP", d:"Un <b>IGP</b> (OSPF, EIGRP, RIP) route à l'intérieur d'un système autonome. Un <b>EGP</b> route entre systèmes autonomes : sur l'Internet, c'est <b>BGP-4</b>. Un <b>AS</b> (Autonomous System) est un ensemble de réseaux sous une même administration, identifié par un numéro (ici 100 et 200)."},
    {t:"eBGP et iBGP", d:"Une session entre routeurs d'AS <b>différents</b> est une session <b>eBGP</b> (ISP1–ISP2, distance administrative 20). Entre routeurs du <b>même</b> AS, c'est de l'<b>iBGP</b> (distance 200), comme entre SP1 et SP3 au TP2. Les voisins BGP sont configurés à la main : <code class='i'>neighbor IP remote-as N</code>."},
    {t:"BGP fonctionne sur TCP", d:"BGP ouvre une session <b>TCP port 179</b> avec chaque voisin. Il n'envoie pas de mises à jour périodiques : une fois la table échangée, seules les modifications sont transmises, accompagnées de messages keepalive."},
    {t:"La commande network en BGP", d:"Contrairement aux IGP, <code class='i'>network</code> en BGP n'active pas BGP sur une interface : il <b>annonce</b> un préfixe, à condition qu'il existe déjà dans la table de routage (route connectée, statique ou IGP). ISP1 peut annoncer 192.168.1.0 parce qu'il possède une route statique vers ce réseau."},
    {t:"Route par défaut côté client", d:"Le client n'a qu'une sortie : inutile de faire tourner BGP chez lui. Une route par défaut <code class='i'>ip route 0.0.0.0 0.0.0.0 10.10.10.2</code> suffit, et le FAI configure une route statique de retour vers le LAN client."},
    {t:"Lire show ip bgp", d:"<b>*</b> = route valide, <b>&gt;</b> = meilleure route. <b>Next Hop 0.0.0.0</b> : réseau annoncé localement. <b>Weight 32768</b> : route d'origine locale. <b>Path</b> : liste des AS traversés (200 i = appris de l'AS 200), <b>i</b> = origine IGP (commande network)."},
  ],
  glossary:[["BGP","Border Gateway Protocol : protocole de routage entre systèmes autonomes, TCP 179."],["AS","Autonomous System : ensemble de réseaux sous une même politique de routage."],["eBGP","Session BGP entre deux AS différents (DA 20)."],["iBGP","Session BGP à l'intérieur d'un même AS (DA 200)."],["AS_PATH","Attribut BGP listant les AS traversés par une route."],["Route par défaut","Route 0.0.0.0/0 utilisée quand aucune route plus précise n'existe."]],
  topo:{vb:[800,460], title:"Client, ISP1 et ISP2", sub:"route par défaut · eBGP AS 100 ↔ AS 200",
    zones:[{x:30,y:30,w:430,h:410,label:"AS 100",sub:"ISP1 et son client",c:"--sky"},{x:480,y:30,w:290,h:200,label:"AS 200",c:"--amber"}],
    nodes:[
      {id:"isp1",label:"ISP1",role:"FAI · AS 100",type:"router",x:300,y:120,c:"--sky",desc:"FAI local du client",ifs:[["s0/0 → CR","10.10.10.2/24"],["s0/1 → ISP2","172.16.1.1/24"],["Loopback0","192.168.100.1/24"]],
       cfg:`ISP1(config)# interface loopback0
ISP1(config-if)# ip address 192.168.100.1 255.255.255.0
ISP1(config)# ip route 192.168.1.0 255.255.255.0 10.10.10.1
ISP1(config)# router bgp 100
ISP1(config-router)# neighbor 172.16.1.2 remote-as 200
ISP1(config-router)# network 192.168.1.0
ISP1(config-router)# network 192.168.100.0
ISP1# copy running-config startup-config`},
      {id:"isp2",label:"ISP2",role:"FAI · AS 200",type:"router",x:620,y:120,c:"--amber",desc:"Fournisseur de transit",ifs:[["s0/0 → ISP1","172.16.1.2/24"],["Loopback0","192.168.200.1/24"]],
       cfg:`ISP2(config)# interface loopback0
ISP2(config-if)# ip address 192.168.200.1 255.255.255.0
ISP2(config)# router bgp 200
ISP2(config-router)# neighbor 172.16.1.1 remote-as 100
ISP2(config-router)# network 192.168.200.0
ISP2# copy running-config startup-config`},
      {id:"lo100",label:"Lo0",role:"192.168.100.1/24",type:"loop",x:120,y:120,desc:"Interface de bouclage d'ISP1"},
      {id:"lo200",label:"Lo0",role:"192.168.200.1/24",type:"loop",x:720,y:190,desc:"Interface de bouclage d'ISP2"},
      {id:"cr",label:"CR",role:"routeur client",type:"router",x:300,y:280,c:"--sky",desc:"Customer Router",ifs:[["s0/0 → ISP1","10.10.10.1/24"],["fa0/0 → LAN","192.168.1.1/24"]],
       cfg:`CR(config)# interface fastethernet0/0
CR(config-if)# ip address 192.168.1.1 255.255.255.0
CR(config)# interface serial0/0
CR(config-if)# ip address 10.10.10.1 255.255.255.0
CR(config)# ip route 0.0.0.0 0.0.0.0 10.10.10.2`},
      {id:"lan",label:"LAN client",role:"192.168.1.0/24",type:"switch",x:300,y:390,desc:"Réseau interne de la société"},
      {id:"pc",label:"PC",role:"192.168.1.10 · gw .1",type:"pc",x:140,y:390,desc:"Hôte client",ifs:[["IP","192.168.1.10/24"],["Passerelle","192.168.1.1"]]},
    ],
    links:[
      {a:"isp1",b:"isp2",type:"serial",label:"172.16.1.0/24",la:"s0/1 .1",lb:"s0/0 .2",side:-1},
      {a:"cr",b:"isp1",type:"serial",label:"10.10.10.0/24",la:"s0/0 .1",lb:"s0/0 .2",ld:.36,side:1,lo:56},
      {a:"isp1",b:"lo100"},{a:"isp2",b:"lo200"},
      {a:"cr",b:"lan",la:"fa0/0 .1",iside:1,io:30},{a:"lan",b:"pc"},
    ],
    scenarios:[
      {label:"PC → 192.168.200.1", cmd:"PC> ping 192.168.200.1", c:"--sky",
       path:[{n:"pc",log:"PC : destination hors LAN → passerelle 192.168.1.1"},{n:"lan"},{n:"cr",cap:"0.0.0.0/0",log:"CR : S* 0.0.0.0/0 via 10.10.10.2 (route par défaut)"},{n:"isp1",cap:"B",log:"ISP1 : B 192.168.200.0/24 [20/0] via 172.16.1.2 (appris en eBGP)",cls:"w"},{n:"isp2",log:"ISP2 : réseau connecté (Loopback0) · retour par B 192.168.1.0/24 via 172.16.1.1"}],
       end:"Reply from 192.168.200.1: bytes=32 time=18ms TTL=253"},
      {label:"Même ping sans BGP", cmd:"PC> ping 192.168.200.1   (avant l'étape 3)", c:"--red",
       path:[{n:"pc"},{n:"lan"},{n:"cr",log:"CR : route par défaut vers ISP1"},{n:"isp1",fail:true,log:"ISP1 : aucune route vers 192.168.200.0/24 → paquet détruit (Destination host unreachable)",cls:"e"}]},
    ]},
  steps:[
    {t:"Étape 1 · Bouclages des FAI", r:"ISP1 et ISP2", cmds:`ISP1> enable
ISP1# configure terminal
ISP1(config)# interface loopback0
ISP1(config-if)# ip address 192.168.100.1 255.255.255.0
ISP2(config)# interface loopback0
ISP2(config-if)# ip address 192.168.200.1 255.255.255.0`},
    {t:"Étape 2 · Route par défaut et route de retour", r:"CR et ISP1", cmds:`CR(config)# ip route 0.0.0.0 0.0.0.0 10.10.10.2
ISP1(config)# ip route 192.168.1.0 255.255.255.0 10.10.10.1
PC> ping 10.10.10.2`},
    {t:"Étape 3 · BGP sur ISP1", r:"ISP1", cmds:`ISP1(config)# router bgp 100
ISP1(config-router)# neighbor 172.16.1.2 remote-as 200
ISP1(config-router)# network 192.168.1.0
ISP1(config-router)# network 192.168.100.0
ISP1(config-router)# end
ISP1# copy running-config startup-config`},
    {t:"Étape 3 · BGP sur ISP2", r:"ISP2", cmds:`ISP2(config)# router bgp 200
ISP2(config-router)# neighbor 172.16.1.1 remote-as 100
ISP2(config-router)# network 192.168.200.0
ISP2(config-router)# end
ISP2# copy running-config startup-config`},
    {t:"Étapes 4 à 6 · Vérifications", r:"tous", cmds:`ISP2# show ip route
ISP1# show ip route
CR# show ip route
PC> ping 192.168.200.1
ISP2# ping 192.168.1.10
ISP1# show ip bgp
ISP2# show ip bgp`},
  ],
  quiz:[
    {q:"Quelle lettre identifie une route apprise par BGP dans <code class='i'>show ip route</code> ?", o:["S","D","B","E"], a:2, e:"B = BGP. S = statique, D = EIGRP, E = EGP (ancien protocole)."},
    {q:"Quel est le type de session entre ISP1 (AS 100) et ISP2 (AS 200) ?", o:["iBGP","eBGP","OSPF inter-area","Statique"], a:1, e:"Les deux routeurs sont dans des AS différents : c'est une session eBGP, de distance administrative 20 (le [20/0] de la table)."},
    {q:"Pourquoi les réseaux 192.168.100.0 et 192.168.200.0 n'apparaissent-ils pas dans la table de CR ?", o:["Parce que BGP est mal configuré","Parce que CR ne fait pas de BGP : il utilise une route par défaut et ISP1 ne lui annonce rien","Parce que les loopbacks sont éteintes","Parce que CR n'a pas de masque"], a:1, e:"CR n'a aucun protocole de routage : tout le trafic externe suit la route par défaut S* vers 10.10.10.2."},
    {q:"Sur quel transport et quel port BGP établit-il ses sessions ?", o:["UDP 520","TCP 179","TCP 646","IP protocole 89"], a:1, e:"BGP utilise TCP 179. UDP 520 = RIP, TCP 646 = LDP, IP 89 = OSPF."},
    {q:"Comment le réseau 192.168.1.0 a-t-il été appris par ISP1 ?", o:["Par BGP depuis CR","Par une route statique configurée sur ISP1","Par OSPF","Il est directement connecté"], a:1, e:"ISP1# ip route 192.168.1.0 255.255.255.0 10.10.10.1 : la table montre « S 192.168.1.0/24 [1/0] via 10.10.10.1 »."},
    {q:"Dans <code class='i'>show ip bgp</code> sur ISP1, que signifie Next Hop 0.0.0.0 pour 192.168.100.0 ?", o:["La route est invalide","Le réseau est annoncé localement par ce routeur","La route vient de l'AS 0","Le voisin est tombé"], a:1, e:"0.0.0.0 comme next hop (avec un weight de 32768) indique un préfixe injecté localement par la commande network."},
    {q:"Que faut-il pour qu'une commande <code class='i'>network</code> BGP annonce un préfixe ?", o:["Que le préfixe existe déjà dans la table de routage","Que l'interface soit en mode passif","Que le voisin soit dans le même AS","Rien de particulier"], a:0, e:"BGP n'annonce un réseau que s'il est présent dans la RIB avec exactement ce masque (connecté, statique ou IGP)."},
  ],
  correction:[
    {q:"CR peut-il atteindre ISP2 ? L'hôte client peut-il atteindre ISP1 ? (étape 1c)", a:"Non pour les deux : sans route par défaut ni protocole de routage, chaque routeur ne connaît que ses réseaux directement connectés. Seuls les pings entre voisins directs réussissent."},
    {q:"Le réseau 192.168.1.0 est-il dans la table de ISP2 ? Quelle lettre ? Que signifie-t-elle ?", a:"Oui : <code class='i'>B 192.168.1.0/24 [20/0] via 172.16.1.1</code>. <b>B</b> signifie que la route a été apprise par <b>BGP</b> (distance 20 = eBGP)."},
    {q:"Le réseau 192.168.100.0 est-il dans la table de ISP2 ? Qui a annoncé 192.168.1.0 ?", a:"Oui, en B via 172.16.1.1. C'est <b>ISP1</b> (AS 100) qui annonce 192.168.1.0 à ISP2 grâce à sa commande network."},
    {q:"Quels réseaux ISP2 signale-t-il à ISP1 ?", a:"Uniquement <b>192.168.200.0/24</b> (sa loopback), visible en B via 172.16.1.2 sur ISP1."},
    {q:"Comment 192.168.1.0 a-t-il été signalé à ISP1 ?", a:"Par la <b>route statique</b> configurée sur ISP1 (S 192.168.1.0/24 [1/0] via 10.10.10.1), pas par un protocole de routage."},
    {q:"ISP1 annonce-t-il des réseaux au routeur client ?", a:"Non. Il n'y a ni session BGP ni IGP entre ISP1 et CR."},
    {q:"Pourquoi 192.168.100.0 et 192.168.200.0 n'apparaissent pas dans la table de CR ?", a:"Parce que CR n'exécute aucun protocole de routage : il n'apprend aucune route. Sa route par défaut (Gateway of last resort 10.10.10.2) suffit pour joindre ces réseaux."},
    {q:"Pourquoi ISP1 n'annonce-t-il pas de réseau au routeur client ? (étape 7)", a:"Le client n'a qu'une seule sortie vers Internet : lui envoyer toute la table BGP serait inutile et lourd pour un petit routeur. Une route par défaut vers le FAI donne le même résultat ; la configuration reste simple et le routeur client n'a besoin d'aucune mémoire supplémentaire."},
  ],
});

W.TPS.push({
  id:"redis", order:4, num:"Lab Redistribution", short:"Redistribution", sub:"OSPF · EIGRP · RIPv2", theme:"route", tool:"GNS3 · Cisco 7200",
  title:"Redistribution entre OSPF, EIGRP et RIPv2",
  intro:"Trois domaines de routage à faire communiquer : OSPF (R1, R2, R3), EIGRP (R2, R3, R4, R5) et RIPv2 (R5, R6). Redistribution mutuelle sur les routeurs frontières, choix des métriques, routes externes, puis correction d'un mauvais chemin par la distance administrative.",
  sim:{dir:"TP_LAB_REDIS", modes:["demo","tutorial"], slides:1665, steps:336},
  tags:["redistribution","ospf","eigrp","rip","métrique","seed metric","distance administrative","metric-type","E2","EX"],
  objectives:["Configurer les trois domaines : OSPF Area 0, EIGRP AS 1, RIPv2","Redistribuer OSPF dans EIGRP (R2, R3) avec une métrique composite","Redistribuer EIGRP dans OSPF avec subnets et metric-type 2","Redistribuer RIP ↔ EIGRP sur R5","Corriger le choix de route de R3 avec distance eigrp 90 105"],
  theory:[
    {t:"Qu'est-ce que la redistribution ?", d:"Chaque protocole de routage ne connaît que ses propres routes. La <b>redistribution</b> injecte les routes d'un protocole dans un autre, sur un routeur qui participe aux deux (routeur frontière, <b>ASBR</b>) : ici R2 et R3 (OSPF/EIGRP) et R5 (EIGRP/RIP)."},
    {t:"La métrique d'amorçage (seed metric)", d:"Les métriques ne se convertissent pas d'un protocole à l'autre. Il faut donc fixer une métrique de départ. Pour <b>EIGRP</b> et <b>RIP</b> elle est <b>obligatoire</b> : sans elle, les routes sont annoncées avec une métrique infinie et ignorées. EIGRP attend 5 valeurs : bande passante, délai, fiabilité, charge, MTU (<code class='i'>metric 100 100 100 100 100</code>)."},
    {t:"Vers OSPF : subnets et metric-type", d:"Le mot-clé <code class='i'>subnets</code> est nécessaire pour redistribuer les sous-réseaux, sinon OSPF ne prend que les réseaux par classe. Sans métrique, OSPF utilise 20. <b>metric-type 2</b> (E2, par défaut) : la métrique reste la même partout (50). <b>metric-type 1</b> (E1) : le coût interne s'ajoute à chaque saut."},
    {t:"Lire les routes externes", d:"Dans les tables : <b>O E2</b> = route externe redistribuée dans OSPF, <b>D EX</b> = route externe redistribuée dans EIGRP (distance 170 au lieu de 90), <b>R</b> = route RIP. RIPv2 résume ici en 172.16.0.0/16 car l'auto-summary est actif par défaut."},
    {t:"Distance administrative", d:"Quand deux protocoles proposent le même préfixe, le routeur garde celui de plus petite <b>distance administrative</b> : connecté 0, statique 1, EIGRP interne 90, OSPF 110, RIP 120, EIGRP externe 170. La redistribution peut fausser ce choix."},
    {t:"Le problème de R3", d:"Pour 172.16.0.0/16 (domaine RIP), R3 reçoit une route <b>O E2 via R1</b> (DA 110) et une route <b>D EX via R4</b> (DA 170). Il choisit OSPF et traverse 3 domaines (R1, R2, R5, R6) au lieu de 2 (R4, R5, R6). <code class='i'>distance eigrp 90 105</code> abaisse la DA des routes EIGRP externes à 105 &lt; 110 : R3 passe désormais par R4."},
  ],
  glossary:[["Redistribution","Injection des routes d'un protocole de routage dans un autre."],["ASBR","Autonomous System Boundary Router : routeur qui redistribue des routes externes dans OSPF."],["Seed metric","Métrique initiale attribuée aux routes redistribuées."],["E1 / E2","Types de routes externes OSPF : E1 cumule le coût interne, E2 non."],["D EX","Route EIGRP externe (redistribuée), distance 170."],["Distance administrative","Fiabilité d'une source de routage : la plus petite gagne."]],
  topo:{vb:[800,480], title:"Trois domaines de routage", sub:"OSPF · EIGRP AS 1 · RIPv2",
    zones:[{x:20,y:20,w:620,h:200,label:"OSPF · AREA 0",c:"--lime"},{x:20,y:228,w:620,h:235,label:"EIGRP · AS 1",c:"--amber"},{x:650,y:150,w:135,h:313,label:"RIPv2",c:"--sky"}],
    nodes:[
      {id:"r1",label:"R1",role:"OSPF",type:"router",x:330,y:80,c:"--lime",desc:"Routeur OSPF · router-id 1.1.1.1",ifs:[["s0/0 → R3","10.0.13.1/24"],["s0/1 → R2","10.0.12.1/24"],["Lo0–Lo3","172.16.30–33.1/24"]],
       cfg:`R1(config)# router ospf 1
R1(config-router)# router-id 1.1.1.1
R1(config-router)# network 172.16.30.0 0.0.0.255 area 0
R1(config-router)# network 172.16.31.0 0.0.0.255 area 0
R1(config-router)# network 172.16.32.0 0.0.0.255 area 0
R1(config-router)# network 172.16.33.0 0.0.0.255 area 0
R1(config-router)# network 10.0.13.0 0.0.0.255 area 0
R1(config-router)# network 10.0.12.0 0.0.0.255 area 0`},
      {id:"r3",label:"R3",role:"ASBR OSPF/EIGRP",type:"router",x:130,y:220,desc:"Routeur frontière OSPF ↔ EIGRP",ifs:[["s0/0/0 → R1","10.0.13.3/24"],["s0/0/1 → R4","10.0.34.3/24"]],
       cfg:`R3(config)# router ospf 1
R3(config-router)# router-id 3.3.3.3
R3(config-router)# network 10.0.13.0 0.0.0.255 area 0
R3(config-router)# redistribute eigrp 1 subnets metric 50 metric-type 2
R3(config)# router eigrp 1
R3(config-router)# no auto-summary
R3(config-router)# network 10.0.34.0 0.0.0.255
R3(config-router)# redistribute ospf 1 metric 100 100 100 100 100
R3(config-router)# distance eigrp 90 105`},
      {id:"r2",label:"R2",role:"ASBR OSPF/EIGRP",type:"router",x:530,y:220,desc:"Routeur frontière OSPF ↔ EIGRP",ifs:[["s0/1 → R1","10.0.12.2/24"],["s0/0 → R5","10.0.25.2/24"]],
       cfg:`R2(config)# router ospf 1
R2(config-router)# router-id 2.2.2.2
R2(config-router)# network 10.0.12.0 0.0.0.255 area 0
R2(config-router)# redistribute eigrp 1 subnets metric 50 metric-type 2
R2(config)# router eigrp 1
R2(config-router)# no auto-summary
R2(config-router)# network 10.0.25.0 0.0.0.255
R2(config-router)# redistribute ospf 1 metric 100 100 100 100 100`},
      {id:"r4",label:"R4",role:"EIGRP",type:"router",x:200,y:395,desc:"Routeur EIGRP",ifs:[["s0/1 → R3","10.0.34.4/24"],["s0/0 → R5","10.0.45.4/24"],["Lo0–Lo3","172.16.20–23.1/24"]],
       cfg:`R4(config)# router eigrp 1
R4(config-router)# no auto-summary
R4(config-router)# network 10.0.34.0 0.0.0.255
R4(config-router)# network 10.0.45.0 0.0.0.255
R4(config-router)# network 172.16.20.0 0.0.0.255
R4(config-router)# network 172.16.21.0 0.0.0.255
R4(config-router)# network 172.16.22.0 0.0.0.255
R4(config-router)# network 172.16.23.0 0.0.0.255`},
      {id:"r5",label:"R5",role:"EIGRP/RIP",type:"router",x:600,y:395,desc:"Routeur frontière EIGRP ↔ RIPv2",ifs:[["s0/1 → R2","10.0.25.5/24"],["s0/0 → R4","10.0.45.5/24"],["s0/2 → R6","10.0.56.5/24"]],
       cfg:`R5(config)# router eigrp 1
R5(config-router)# no auto-summary
R5(config-router)# network 10.0.25.0 0.0.0.255
R5(config-router)# network 10.0.45.0 0.0.0.255
R5(config-router)# redistribute rip metric 100 100 100 100 100
R5(config)# router rip
R5(config-router)# version 2
R5(config-router)# network 10.0.56.0
R5(config-router)# redistribute eigrp 1 metric 5`},
      {id:"r6",label:"R6",role:"RIPv2",type:"router",x:718,y:290,c:"--sky",desc:"Routeur RIPv2",ifs:[["s0/0 → R5","10.0.56.6/24"],["Lo0–Lo3","172.16.10–13.1/24"]],
       cfg:`R6(config)# router rip
R6(config-router)# version 2
R6(config-router)# network 10.0.56.0
R6(config-router)# network 172.16.0.0`},
    ],
    links:[
      {a:"r1",b:"r3",type:"serial",label:"10.0.13.0/24",la:".1",lb:".3",side:-1},
      {a:"r1",b:"r2",type:"serial",label:"10.0.12.0/24",la:".1",lb:".2",side:1},
      {a:"r3",b:"r4",type:"serial",label:"10.0.34.0/24",la:".3",lb:".4",side:-1,lo:40},
      {a:"r2",b:"r5",type:"serial",label:"10.0.25.0/24",la:".2",lb:".5",side:1,lo:38},
      {a:"r4",b:"r5",type:"serial",label:"10.0.45.0/24",la:".4",lb:".5",side:1},
      {a:"r5",b:"r6",type:"serial",label:"10.0.56.0/24",la:".5",lb:".6",side:-1,lo:30},
    ],
    scenarios:[
      {label:"R3 → 172.16.10.1 (avant)", cmd:"R3# traceroute 172.16.10.1", c:"--red",
       path:[{n:"r3",log:"R3 : O E2 172.16.0.0/16 [110/20] via 10.0.13.1 · gagne contre D EX [170] via R4",cls:"w"},{n:"r1",log:"1  10.0.13.1"},{n:"r2",log:"2  10.0.12.2"},{n:"r5",log:"3  10.0.25.5"},{n:"r6",log:"4  10.0.56.6"}],
       end:"Chemin sous-optimal : 3 domaines traversés (OSPF → EIGRP → RIP)", endCls:"w"},
      {label:"Après distance eigrp 90 105", cmd:"R3(config-router)# distance eigrp 90 105  ·  R3# traceroute 172.16.10.1", c:"--teal",
       path:[{n:"r3",log:"R3 : D EX 172.16.0.0/16 [105/…] via 10.0.34.4 · 105 < 110, EIGRP externe gagne"},{n:"r4",log:"1  10.0.34.4"},{n:"r5",log:"2  10.0.45.5"},{n:"r6",log:"3  10.0.56.6"}],
       end:"Chemin optimal : 2 domaines traversés, un saut de moins"},
      {label:"R4 → 172.16.30.1", cmd:"R4# ping 172.16.30.1", c:"--amber",
       path:[{n:"r4",log:"R4 : D EX 172.16.30.1/32 [170/…] via 10.0.34.3 (OSPF redistribué par R3)"},{n:"r3",log:"R3 : O 172.16.30.1 via 10.0.13.1"},{n:"r1",log:"R1 : Loopback0 connectée"}],
       end:"!!!!! Success rate is 100 percent (5/5)"},
    ]},
  steps:[
    {t:"OSPF Area 0", r:"R1, R2, R3", cmds:`R1(config)# router ospf 1
R1(config-router)# router-id 1.1.1.1
R1(config-router)# network 172.16.30.0 0.0.0.255 area 0
R1(config-router)# network 172.16.31.0 0.0.0.255 area 0
R1(config-router)# network 172.16.32.0 0.0.0.255 area 0
R1(config-router)# network 172.16.33.0 0.0.0.255 area 0
R1(config-router)# network 10.0.13.0 0.0.0.255 area 0
R1(config-router)# network 10.0.12.0 0.0.0.255 area 0
R2(config)# router ospf 1
R2(config-router)# router-id 2.2.2.2
R2(config-router)# network 10.0.12.0 0.0.0.255 area 0
R3(config)# router ospf 1
R3(config-router)# router-id 3.3.3.3
R3(config-router)# network 10.0.13.0 0.0.0.255 area 0`},
    {t:"EIGRP AS 1", r:"R2, R3, R4, R5", cmds:`R2(config)# router eigrp 1
R2(config-router)# no auto-summary
R2(config-router)# network 10.0.25.0 0.0.0.255
R3(config)# router eigrp 1
R3(config-router)# no auto-summary
R3(config-router)# network 10.0.34.0 0.0.0.255
R4(config)# router eigrp 1
R4(config-router)# no auto-summary
R4(config-router)# network 10.0.34.0 0.0.0.255
R4(config-router)# network 10.0.45.0 0.0.0.255
R4(config-router)# network 172.16.20.0 0.0.0.255
R4(config-router)# network 172.16.21.0 0.0.0.255
R4(config-router)# network 172.16.22.0 0.0.0.255
R4(config-router)# network 172.16.23.0 0.0.0.255
R5(config)# router eigrp 1
R5(config-router)# no auto-summary
R5(config-router)# network 10.0.25.0 0.0.0.255
R5(config-router)# network 10.0.45.0 0.0.0.255`},
    {t:"RIPv2", r:"R5, R6", cmds:`R5(config)# router rip
R5(config-router)# version 2
R5(config-router)# network 10.0.56.0
R6(config)# router rip
R6(config-router)# version 2
R6(config-router)# network 10.0.56.0
R6(config-router)# network 172.16.0.0
R3# show ip route
R5# show ip route
R2# show ip route`},
    {t:"OSPF → EIGRP", r:"R2 et R3", cmds:`R2(config)# router eigrp 1
R2(config-router)# redistribute ospf 1 metric 100 100 100 100 100
R3(config)# router eigrp 1
R3(config-router)# redistribute ospf 1 metric 100 100 100 100 100
R4# show ip route`, note:"Sur R4, les réseaux OSPF apparaissent en D EX (externes, distance 170)."},
    {t:"EIGRP → OSPF", r:"R2 et R3", cmds:`R2(config)# router ospf 1
R2(config-router)# redistribute eigrp 1 subnets metric 50 metric-type 2
R3(config)# router ospf 1
R3(config-router)# redistribute eigrp 1 subnets metric 50 metric-type 2
R1# show ip route`, note:"Sur R1, les réseaux EIGRP apparaissent en O E2 avec une métrique de 50, via R3 et via R2 (partage de charge)."},
    {t:"RIP ↔ EIGRP", r:"R5", cmds:`R5(config)# router eigrp 1
R5(config-router)# redistribute rip metric 100 100 100 100 100
R5(config)# router rip
R5(config-router)# redistribute eigrp 1 metric 5
R6# show ip route
R3# ping 172.16.10.1`},
    {t:"Distance administrative", r:"R3", cmds:`R3# show ip route
R3# traceroute 172.16.10.1
R3(config)# router eigrp 1
R3(config-router)# distance eigrp 90 105
R3# show ip route
R3# traceroute 172.16.10.1`},
  ],
  quiz:[
    {q:"Que se passe-t-il si on redistribue dans EIGRP sans préciser de métrique ?", o:["EIGRP utilise une métrique de 20","Les routes sont annoncées avec une métrique infinie et ignorées","EIGRP copie la métrique OSPF","La commande est refusée"], a:1, e:"Pour EIGRP (et RIP), une métrique d'amorçage est obligatoire, sinon les routes redistribuées sont inaccessibles."},
    {q:"Que permet le mot-clé <code class='i'>subnets</code> dans <code class='i'>redistribute eigrp 1 subnets</code> ?", o:["De résumer les routes","De redistribuer aussi les sous-réseaux, pas seulement les réseaux par classe","De chiffrer les mises à jour","D'activer EIGRP sur les sous-interfaces"], a:1, e:"Sans subnets, OSPF ne redistribue que les réseaux classful : 10.0.25.0/24 ne passerait pas."},
    {q:"Avec <code class='i'>metric-type 2</code> et <code class='i'>metric 50</code>, quelle métrique voit R1 pour les routes EIGRP ?", o:["50 + le coût du lien","50 sur tous les routeurs OSPF","20","110"], a:1, e:"E2 : la métrique externe reste fixe quel que soit le nombre de sauts. C'est le [110/50] de la table de R1."},
    {q:"Que signifie le préfixe « D EX » dans la table de R4 ?", o:["Route EIGRP interne","Route EIGRP externe, redistribuée depuis un autre protocole","Route statique par défaut","Route expirée"], a:1, e:"EX = externe. Ces routes viennent d'OSPF, redistribuées dans EIGRP par R3 (distance 170)."},
    {q:"Pourquoi R3 passe-t-il par R1 pour joindre 172.16.10.0 avant la correction ?", o:["Parce que le lien R3-R4 est lent","Parce que la route O E2 (DA 110) bat la route D EX (DA 170)","Parce que RIP a une meilleure métrique","Parce que R4 ne connaît pas ce réseau"], a:1, e:"Le routeur compare d'abord les distances administratives : 110 < 170, la route OSPF l'emporte malgré un chemin plus long."},
    {q:"Que fait <code class='i'>distance eigrp 90 105</code> sur R3 ?", o:["Change la métrique EIGRP","Garde 90 pour les routes EIGRP internes et passe les externes à 105","Désactive OSPF","Fixe le délai à 105"], a:1, e:"Les routes D EX passent à 105 < 110 : R3 préfère désormais le chemin via R4 et R5 (2 domaines au lieu de 3)."},
    {q:"Pourquoi R3 voit-il 172.16.0.0/16 et non les /24 de R6 ?", o:["Parce que R6 n'annonce rien","Parce que RIPv2 résume automatiquement en classful (auto-summary)","Parce que OSPF résume toujours en /16","Parce que les loopbacks sont en /16"], a:1, e:"RIPv2 a l'auto-summary actif par défaut : les 172.16.10–13.0/24 sont résumés en 172.16.0.0/16 à la frontière."},
  ],
  correction:[
    {q:"Les routes se propagent-elles avant la redistribution ?", a:"Seulement à l'intérieur de chaque domaine : R3 et R2 voient OSPF et EIGRP (ils participent aux deux), R5 voit EIGRP et RIP. R1 ne connaît pas EIGRP, R4 ne connaît pas OSPF, R6 ne connaît que RIP."},
    {q:"La redistribution OSPF → EIGRP a-t-elle fonctionné ?", a:"Oui : sur R4, les loopbacks de R1 (172.16.30–33.1/32) et les réseaux 10.0.12.0 et 10.0.13.0 apparaissent en <b>D EX [170/26137600] via 10.0.34.3</b>."},
    {q:"La redistribution EIGRP → OSPF a-t-elle fonctionné ?", a:"Oui : R1 connaît 172.16.20–23.0/24, 10.0.25.0, 10.0.45.0 et 10.0.34.0 en <b>O E2 [110/50]</b>, via R3 (10.0.13.3) et via R2 (10.0.12.2)."},
    {q:"R6 connaît-il toutes les routes ?", a:"Oui : après la redistribution EIGRP → RIP sur R5 (metric 5), R6 a des routes R vers 10.0.12.0, 10.0.13.0, 10.0.25.0, 10.0.34.0, 10.0.45.0 et 172.16.0.0/16 via 10.0.56.5."},
    {q:"Quel chemin utilise R3 pour 172.16.10.0/24 et pourquoi ?", a:"Via R1 : traceroute 10.0.13.1 → 10.0.12.2 → 10.0.25.5 → 10.0.56.6. R3 a le choix entre O E2 via R1 (DA 110) et D EX via R5/R4 (DA 170) : la plus petite distance gagne, même si le chemin traverse 3 domaines."},
    {q:"Résultat après distance eigrp 90 105 ?", a:"R3 affiche <b>D EX 172.16.0.0/16 [105/…] via 10.0.34.4</b> : le trafic vers le domaine RIP passe par R4 puis R5, soit 2 domaines au lieu de 3."},
  ],
});
})();
