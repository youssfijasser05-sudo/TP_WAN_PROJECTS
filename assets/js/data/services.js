/* TP3 — DHCP et NAT */
(function(){
const W = window.WAN = window.WAN || {}; W.TPS = W.TPS || [];

W.TPS.push({
  id:"nat", order:5, num:"TP3", short:"DHCP & NAT", sub:"DHCP · relais · NAT · PAT", theme:"svc", tool:"Packet Tracer · routeurs 1841",
  title:"DHCP, relais DHCP, NAT statique, dynamique et PAT",
  intro:"L'intranet de la société ABC : routage statique, serveur DHCP centralisé sur R2 avec agents relais, publication du serveur web par NAT statique, NAT dynamique avec un pool d'adresses publiques, puis surcharge (PAT) vers le FAI.",
  sim:{dir:"NAT_PAT_NATD", modes:["demo","tutorial"], slides:2385, steps:401},
  tags:["dhcp","helper-address","relais","nat","pat","overload","pool","acl","inside","outside","static"],
  objectives:["Configurer les routes statiques et routes par défaut de l'intranet","Faire de R2 le serveur DHCP des réseaux 192.168.10.0, 192.168.11.0 et 192.168.30.0","Configurer R1 et R3 en agents relais DHCP (ip helper-address)","Publier le serveur web (NAT statique 192.168.20.2 ↔ 77.77.77.77) et les serveurs du FAI","Mettre en place un NAT dynamique (pool MY-NAT-POOL), puis le remplacer par du PAT"],
  theory:[
    {t:"DHCP en 4 messages : DORA", d:"Un client sans adresse envoie un <b>DISCOVER</b> en broadcast, le serveur répond par une <b>OFFER</b>, le client confirme par une <b>REQUEST</b> et le serveur valide par un <b>ACK</b>. Le serveur fournit l'adresse IP, le masque, la passerelle (<code class='i'>default-router</code>) et le DNS (<code class='i'>dns-server</code>)."},
    {t:"Exclure les adresses fixes", d:"Le serveur suppose que toutes les adresses du pool sont libres. Les adresses déjà utilisées (interfaces des routeurs, serveurs, imprimantes) doivent être exclues avec <code class='i'>ip dhcp excluded-address</code>, sinon elles risquent d'être attribuées deux fois."},
    {t:"Agent relais : ip helper-address", d:"Le DISCOVER est un broadcast : il ne traverse pas les routeurs. Quand le serveur est sur un autre réseau, le routeur du LAN client (R1, R3) le relaie en unicast vers le serveur grâce à <code class='i'>ip helper-address 10.10.10.2</code> sur son interface LAN. Le serveur choisit le pool d'après l'adresse de l'interface relais (champ giaddr)."},
    {t:"Inside et outside", d:"Le NAT s'applique entre une interface <b>inside</b> (réseau privé) et une interface <b>outside</b> (vers le FAI). Vocabulaire : <b>inside local</b> = adresse privée de l'hôte, <b>inside global</b> = adresse publique qui le représente sur Internet."},
    {t:"NAT statique", d:"Correspondance <b>fixe 1 pour 1</b> entre une adresse privée et une adresse publique : <code class='i'>ip nat inside source static 192.168.20.2 77.77.77.77</code>. Indispensable pour un serveur qui doit être joignable depuis Internet (web, DNS, FTP)."},
    {t:"NAT dynamique", d:"Les adresses privées autorisées par une <b>ACL</b> sont traduites à la volée vers les adresses libres d'un <b>pool</b> public (209.165.200.241 à .246). Une adresse publique par hôte actif : quand le pool est épuisé, les hôtes suivants ne peuvent plus sortir."},
    {t:"PAT (surcharge)", d:"Le <b>PAT</b> (NAT overload) fait partager une seule adresse publique à tous les hôtes en différenciant les sessions par le <b>numéro de port</b> source. <code class='i'>ip nat inside source list NAT interface S0/1/0 overload</code> utilise l'adresse de l'interface de sortie. C'est ce que fait une box Internet."},
    {t:"Routage retour chez le FAI", d:"Le FAI doit savoir où renvoyer le trafic destiné aux adresses publiques de la société : route vers 77.77.77.77/32 et vers le pool 209.165.200.240/28 par l'interface série qui mène à R2."},
  ],
  glossary:[["DHCP","Dynamic Host Configuration Protocol : attribution automatique d'adresses (UDP 67/68)."],["DORA","Discover, Offer, Request, Ack : les 4 messages DHCP."],["Agent relais","Routeur qui transmet les broadcasts DHCP vers un serveur distant (ip helper-address)."],["NAT","Network Address Translation : traduction d'adresses privées en adresses publiques."],["PAT","Port Address Translation : NAT avec surcharge, plusieurs hôtes sur une adresse publique."],["Inside local","Adresse privée réelle d'un hôte interne."],["Inside global","Adresse publique qui représente un hôte interne."]],
  topo:{vb:[820,545], title:"Intranet de la société ABC", sub:"DHCP sur R2 · NAT vers le FAI",
    zones:[
      {x:15,y:20,w:225,h:120,label:"ZONE PUBLIQUE ABC",c:"--lime"},
      {x:15,y:200,w:500,h:335,label:"ZONE PRIVÉE ABC",c:"--amber"},
      {x:530,y:225,w:280,h:210,label:"HÉBERGEMENT FAI",c:"--sky"},
    ],
    nodes:[
      {id:"web",label:"Serveur Web",role:"192.168.20.2 ↔ 77.77.77.77",type:"server",x:85,y:80,desc:"Serveur web de la société, publié par NAT statique",ifs:[["Inside local","192.168.20.2"],["Inside global","77.77.77.77"]]},
      {id:"r2",label:"R2",role:"DHCP · NAT",type:"router",x:330,y:120,c:"--lime",desc:"Routeur central : serveur DHCP et NAT/PAT",ifs:[["fa0/0 (inside) → Web","192.168.20.1/29"],["s0/0/0 (inside) → R1","10.10.10.2/30"],["s0/0/1 (inside) → R3","10.10.9.2/30"],["s0/1/0 (outside) → ISP","209.165.200.225/30"]],
       cfg:`R2(config)# ip dhcp excluded-address 192.168.10.1
R2(config)# ip dhcp excluded-address 192.168.10.10
R2(config)# ip dhcp pool R1Fa0/0
R2(dhcp-config)# network 192.168.10.0 255.255.255.0
R2(dhcp-config)# default-router 192.168.10.1
R2(dhcp-config)# dns-server 88.88.88.88
R2(config)# ip nat inside source static 192.168.20.2 77.77.77.77
R2(config)# ip access-list extended NAT
R2(config-ext-nacl)# permit ip 192.168.10.0 0.0.0.255 any
R2(config-ext-nacl)# permit ip 192.168.11.0 0.0.0.255 any
R2(config-ext-nacl)# permit ip 192.168.30.0 0.0.0.255 any
R2(config)# ip nat inside source list NAT interface s0/1/0 overload
R2(config)# interface s0/1/0
R2(config-if)# ip nat outside`},
      {id:"r1",label:"R1",role:"relais DHCP",type:"router",x:190,y:290,c:"--amber",desc:"Routeur des LAN 192.168.10.0 et 192.168.11.0",ifs:[["s0/0/0 → R2","10.10.10.1/30"],["f0/0 → LAN 10","192.168.10.1/24"],["f0/1 → LAN 11","192.168.11.1/24"]],
       cfg:`R1(config)# ip route 192.168.30.0 255.255.255.0 10.10.10.2
R1(config)# ip route 10.10.9.0 255.255.255.252 10.10.10.2
R1(config)# ip route 192.168.20.0 255.255.255.248 10.10.10.2
R1(config)# ip route 0.0.0.0 0.0.0.0 10.10.10.2
R1(config)# interface f0/0
R1(config-if)# ip helper-address 10.10.10.2
R1(config)# interface f0/1
R1(config-if)# ip helper-address 10.10.10.2`},
      {id:"r3",label:"R3",role:"relais DHCP",type:"router",x:430,y:290,c:"--amber",desc:"Routeur du LAN 192.168.30.0",ifs:[["s0/0/1 → R2","10.10.9.1/30"],["f0/0 → LAN 30","192.168.30.1/24"]],
       cfg:`R3(config)# ip route 192.168.20.0 255.255.255.248 10.10.9.2
R3(config)# ip route 192.168.10.0 255.255.255.0 10.10.9.2
R3(config)# ip route 192.168.11.0 255.255.255.0 10.10.9.2
R3(config)# ip route 0.0.0.0 0.0.0.0 10.10.9.2
R3(config)# interface f0/0
R3(config-if)# ip helper-address 10.10.9.2`},
      {id:"l10",label:"LAN 10",role:"192.168.10.0/24",type:"switch",x:80,y:385},
      {id:"pc1",label:"PC1",role:"DHCP → 192.168.10.2",type:"pc",x:80,y:478,desc:"Client DHCP",ifs:[["Adresse","192.168.10.2 (DHCP)"],["Passerelle","192.168.10.1"],["DNS","88.88.88.88"]]},
      {id:"l11",label:"LAN 11",role:"192.168.11.0/24",type:"switch",x:250,y:420},
      {id:"l30",label:"LAN 30",role:"192.168.30.0/24",type:"switch",x:430,y:420},
      {id:"isp",label:"ISP",role:"FAI",type:"router",x:600,y:120,c:"--sky",desc:"Routeur du fournisseur d'accès",ifs:[["s0/0/0 (outside) → R2","209.165.200.226/30"],["s0/0/1 → Routeur4","209.165.200.229/30"],["fa0/0 (inside) → hébergement","192.168.10.1/24"]],
       cfg:`ISP(config)# ip nat inside source static 192.168.10.3 88.88.88.88
ISP(config)# ip nat inside source static 192.168.10.2 66.66.66.66
ISP(config)# interface fa0/0
ISP(config-if)# ip nat inside
ISP(config)# interface s0/0/0
ISP(config-if)# ip nat outside
ISP(config)# ip route 77.77.77.77 255.255.255.255 serial 0/0/0
ISP(config)# ip route 209.165.200.240 255.255.255.240 serial 0/0/0`},
      {id:"hsw",label:"",type:"switch",x:600,y:300},
      {id:"dns",label:"DNS-ISP",role:"192.168.10.3 ↔ 88.88.88.88",type:"server",x:600,y:395,desc:"Serveur DNS du FAI"},
      {id:"ftp",label:"FTP Cofad",role:"192.168.10.2 ↔ 66.66.66.66",type:"server",x:735,y:330,desc:"Serveur FTP hébergé"},
      {id:"r4",label:"Routeur4",role:"PAT internautes",type:"router",x:740,y:120,desc:"Routeur de l'internaute (tâche 9)",ifs:[["s0/0 → ISP","209.165.200.230/30"],["fa0/0 → LAN","192.168.1.1/24"]],
       cfg:`Router4(config)# access-list 1 permit 192.168.1.0 0.0.0.255
Router4(config)# ip nat inside source list 1 interface s0/0 overload
Router4(config)# interface fa0/0
Router4(config-if)# ip nat inside
Router4(config)# interface s0/0
Router4(config-if)# ip nat outside`},
      {id:"inet",label:"Internaute",role:"192.168.1.0/24 · PAT",type:"pc",x:740,y:30,ly:-22,desc:"Client sur Internet"},
    ],
    links:[
      {a:"web",b:"r2",label:"192.168.20.0/29",la:".2",lb:".1",side:-1},
      {a:"r2",b:"r1",type:"serial",label:"10.10.10.0/30",la:".2",lb:".1",side:1},
      {a:"r2",b:"r3",type:"serial",label:"10.10.9.0/30",la:".2",lb:".1",side:-1},
      {a:"r1",b:"l10",la:"f0/0 .1",ld:.5,iside:1},{a:"l10",b:"pc1"},
      {a:"r1",b:"l11",la:"f0/1 .1",ld:.5},
      {a:"r3",b:"l30",la:"f0/0 .1",ld:.55,io:26},
      {a:"r2",b:"isp",type:"serial",label:"209.165.200.224/30",la:".225",lb:".226",side:-1},
      {a:"isp",b:"r4",type:"serial",label:".228/30",la:".229",lb:".230",side:-1},
      {a:"r4",b:"inet"},
      {a:"isp",b:"hsw",label:"192.168.10.0/24",la:".1",side:1,lo:52},{a:"hsw",b:"dns"},{a:"hsw",b:"ftp"},
    ],
    scenarios:[
      {label:"PC1 obtient une adresse (DHCP)", cmd:"PC1> ipconfig /renew", c:"--lime",
       path:[{n:"pc1",cap:"DISCOVER",log:"PC1 : DHCPDISCOVER en broadcast (0.0.0.0 → 255.255.255.255)"},{n:"l10"},{n:"r1",cap:"relais",log:"R1 f0/0 : ip helper-address → relaie en unicast vers 10.10.10.2 (giaddr 192.168.10.1)",cls:"w"},{n:"r2",cap:"OFFER",log:"R2 : pool R1Fa0/0 → offre 192.168.10.2, gw 192.168.10.1, DNS 88.88.88.88",cls:"w"},{n:"r1",cap:"OFFER"},{n:"l10"},{n:"pc1",cap:"ACK",log:"PC1 : REQUEST puis ACK · adresse 192.168.10.2/24 configurée"}],
       end:"R2# show ip dhcp binding → 192.168.10.2  0004.9AD8.83A8  Automatic"},
      {label:"Internaute → 77.77.77.77", cmd:"Internaute> http://77.77.77.77", c:"--sky",
       path:[{n:"inet",cap:"→77.77.77.77"},{n:"r4",cap:"PAT",log:"Routeur4 : PAT 192.168.1.x → 209.165.200.230:port"},{n:"isp",log:"ISP : ip route 77.77.77.77/32 serial 0/0/0"},{n:"r2",cap:"→192.168.20.2",log:"R2 : NAT statique 77.77.77.77 → 192.168.20.2 (inside global → inside local)",cls:"w"},{n:"web",log:"Serveur web : requête HTTP reçue"}],
       end:"HTTP/1.1 200 OK"},
      {label:"PC1 → Internet (PAT)", cmd:"PC1> ping 209.165.200.226", c:"--amber",
       path:[{n:"pc1",cap:"192.168.10.2"},{n:"l10"},{n:"r1",log:"R1 : route par défaut via 10.10.10.2"},{n:"r2",cap:".225:1025",log:"R2 : ACL NAT → traduit 192.168.10.2:icmp en 209.165.200.225:1025 (overload)",cls:"w"},{n:"isp",log:"ISP : réponse vers 209.165.200.225, R2 retraduit vers 192.168.10.2"}],
       end:"R2# show ip nat translations → icmp 209.165.200.225:1025 192.168.10.2:1"},
    ]},
  steps:[
    {t:"Tâche 1 · Routes statiques", r:"R1, R2, R3", cmds:`R1(config)# ip route 192.168.30.0 255.255.255.0 10.10.10.2
R1(config)# ip route 10.10.9.0 255.255.255.252 10.10.10.2
R1(config)# ip route 192.168.20.0 255.255.255.248 10.10.10.2
R1(config)# ip route 0.0.0.0 0.0.0.0 10.10.10.2
R2(config)# ip route 192.168.10.0 255.255.255.0 10.10.10.1
R2(config)# ip route 192.168.11.0 255.255.255.0 10.10.10.1
R2(config)# ip route 192.168.30.0 255.255.255.0 10.10.9.1
R2(config)# ip route 0.0.0.0 0.0.0.0 209.165.200.226
R3(config)# ip route 192.168.20.0 255.255.255.248 10.10.9.2
R3(config)# ip route 192.168.10.0 255.255.255.0 10.10.9.2
R3(config)# ip route 192.168.11.0 255.255.255.0 10.10.9.2
R3(config)# ip route 0.0.0.0 0.0.0.0 10.10.9.2`},
    {t:"Tâche 2 · Serveur DHCP", r:"R2", cmds:`R2(config)# ip dhcp excluded-address 192.168.10.10
R2(config)# ip dhcp excluded-address 192.168.10.1
R2(config)# ip dhcp excluded-address 192.168.11.10
R2(config)# ip dhcp excluded-address 192.168.11.1
R2(config)# ip dhcp pool R1Fa0/0
R2(dhcp-config)# network 192.168.10.0 255.255.255.0
R2(dhcp-config)# default-router 192.168.10.1
R2(dhcp-config)# dns-server 88.88.88.88
R2(config)# ip dhcp pool R1F0/1
R2(dhcp-config)# network 192.168.11.0 255.255.255.0
R2(dhcp-config)# default-router 192.168.11.1
R2(dhcp-config)# dns-server 88.88.88.88
R2(config)# ip dhcp pool R3F0/0
R2(dhcp-config)# network 192.168.30.0 255.255.255.0
R2(dhcp-config)# default-router 192.168.30.1
R2(dhcp-config)# dns-server 88.88.88.88`},
    {t:"Agents relais DHCP", r:"R1 et R3", cmds:`R3(config)# interface f0/0
R3(config-if)# ip helper-address 10.10.9.2
R1(config)# interface f0/0
R1(config-if)# ip helper-address 10.10.10.2
R1(config-if)# exit
R1(config)# interface f0/1
R1(config-if)# ip helper-address 10.10.10.2
R2# show ip dhcp binding`},
    {t:"NAT statique du serveur web", r:"R2", cmds:`R2(config)# ip nat inside source static 192.168.20.2 77.77.77.77
R2(config)# interface serial 0/1/0
R2(config-if)# ip nat outside
R2(config-if)# interface fa0/0
R2(config-if)# ip nat inside`},
    {t:"NAT statique des serveurs du FAI", r:"ISP", cmds:`ISP(config)# ip nat inside source static 192.168.10.3 88.88.88.88
ISP(config)# ip nat inside source static 192.168.10.2 66.66.66.66
ISP(config)# interface fa0/0
ISP(config-if)# ip nat inside
ISP(config-if)# interface s0/0/0
ISP(config-if)# ip nat outside
ISP(config)# ip route 77.77.77.77 255.255.255.255 serial 0/0/0
ISP# show ip nat translations`},
    {t:"Tâche 7 · NAT dynamique (pool)", r:"R2 et ISP", cmds:`R2(config)# ip nat pool MY-NAT-POOL 209.165.200.241 209.165.200.246 netmask 255.255.255.248
R2(config)# ip access-list extended NAT
R2(config-ext-nacl)# permit ip 192.168.10.0 0.0.0.255 any
R2(config-ext-nacl)# permit ip 192.168.11.0 0.0.0.255 any
R2(config-ext-nacl)# permit ip 192.168.30.0 0.0.0.255 any
R2(config)# ip nat inside source list NAT pool MY-NAT-POOL
R2(config)# interface s0/0/0
R2(config-if)# ip nat inside
R2(config-if)# interface s0/0/1
R2(config-if)# ip nat inside
R2(config-if)# interface s0/1/0
R2(config-if)# ip nat outside
ISP(config)# ip route 209.165.200.240 255.255.255.240 serial 0/0/0
R2# show ip nat translations
R2# show ip nat statistics`},
    {t:"Tâche 8 · PAT (surcharge)", r:"R2", cmds:`R2(config)# no ip nat inside source list NAT pool MY-NAT-POOL
R2(config)# no ip nat pool MY-NAT-POOL 209.165.200.241 209.165.200.246 netmask 255.255.255.248
! si « Pool MY-NAT-POOL in use » :
R2# clear ip nat translation *
R2(config)# ip nat inside source list NAT interface S0/1/0 overload
R2# show ip nat translations
R2# show ip nat statistics`},
    {t:"Tâche 9 · PAT pour l'internaute", r:"Routeur4", cmds:`Router4(config)# access-list 1 permit 192.168.1.0 0.0.0.255
Router4(config)# ip nat inside source list 1 interface s0/0 overload
Router4(config)# interface fa0/0
Router4(config-if)# ip nat inside
Router4(config-if)# interface s0/0
Router4(config-if)# ip nat outside`},
  ],
  quiz:[
    {q:"Dans quel ordre se déroulent les messages DHCP ?", o:["Request, Offer, Discover, Ack","Discover, Offer, Request, Ack","Offer, Discover, Ack, Request","Discover, Request, Offer, Ack"], a:1, e:"DORA : Discover (client), Offer (serveur), Request (client), Ack (serveur)."},
    {q:"Pourquoi faut-il <code class='i'>ip helper-address</code> sur R1 ?", o:["Pour que R1 devienne serveur DHCP","Parce que le DISCOVER est un broadcast qui ne traverse pas les routeurs : R1 le relaie vers R2","Pour activer le NAT","Pour joindre le DNS"], a:1, e:"Le serveur DHCP (R2) n'est pas sur le LAN des clients. L'agent relais transforme le broadcast en unicast vers 10.10.10.2."},
    {q:"Pourquoi exclut-on 192.168.10.1 du pool DHCP ?", o:["C'est une adresse de broadcast","C'est l'adresse de l'interface de R1 (la passerelle), déjà utilisée","Elle est réservée au DNS","Par convention, sans raison technique"], a:1, e:"Le serveur suppose toutes les adresses libres ; attribuer l'adresse de la passerelle créerait un conflit."},
    {q:"Quel type de NAT faut-il pour rendre le serveur web joignable depuis Internet ?", o:["PAT","NAT dynamique","NAT statique","Aucun"], a:2, e:"Un serveur doit être joignable à une adresse publique fixe : 192.168.20.2 ↔ 77.77.77.77, correspondance permanente."},
    {q:"Avec un pool de 6 adresses (209.165.200.241 à .246), que se passe-t-il pour le 7e hôte qui veut sortir ?", o:["Il est traduit sur la première adresse","Il ne peut pas être traduit : ses paquets sont rejetés tant qu'une traduction n'a pas expiré","Il obtient une adresse privée","Le routeur crée une 7e adresse"], a:1, e:"Le NAT dynamique donne une adresse publique par hôte actif. Pool épuisé = plus de traduction possible. Le PAT règle ce problème."},
    {q:"Qu'est-ce qui permet au PAT de faire partager une seule adresse publique ?", o:["L'adresse MAC","Le numéro de port source","Le TTL","Le champ ToS"], a:1, e:"Chaque session est identifiée par adresse + port : le routeur tient une table de correspondance ports privés ↔ ports publics."},
    {q:"Que doit configurer le FAI pour renvoyer le trafic vers le pool de R2 ?", o:["Rien","Une route vers 209.165.200.240/28 via l'interface série qui mène à R2","Un serveur DHCP","Une ACL"], a:1, e:"ISP(config)# ip route 209.165.200.240 255.255.255.240 serial 0/0/0. Sans elle, les réponses ne reviendraient pas."},
  ],
  correction:[
    {q:"Que renvoie show ip dhcp binding ?", a:"Les adresses DHCP actuellement attribuées avec l'adresse MAC du client et le type : par exemple 192.168.10.2 (0004.9AD8.83A8), 192.168.11.2, 192.168.30.2 et 192.168.30.3, toutes « Automatic »."},
    {q:"Pourquoi R1 et R3 ont-ils besoin d'un agent relais ?", a:"Les clients DHCP ne sont pas sur le même réseau que le serveur (R2). Les broadcasts de couche 2 ne traversent pas les routeurs : <code class='i'>ip helper-address</code> transmet les messages DHCP en unicast vers R2."},
    {q:"Comment vérifier la traduction d'adresses ?", a:"Ping étendu depuis PC1 ou depuis l'interface Fast Ethernet de R1 vers ISP, puis <code class='i'>show ip nat translations</code> (entrées inside local ↔ inside global) et <code class='i'>show ip nat statistics</code> (hits, misses, interfaces inside/outside)."},
    {q:"Que se passerait-il avec plus d'hôtes que les six adresses du pool ?", a:"Au-delà de six hôtes simultanés, le pool est épuisé : les nouveaux hôtes ne peuvent pas être traduits et leurs paquets sont rejetés (misses dans les statistiques) jusqu'à l'expiration d'une traduction. La surcharge NAT (PAT) résout ce problème en partageant une adresse grâce aux ports."},
    {q:"Que faire si « %Pool MY-NAT-POOL in use, cannot destroy » ?", a:"Des traductions utilisent encore le pool : on les efface avec <code class='i'>clear ip nat translation *</code>, puis on supprime le pool."},
    {q:"Tâche 9 · Configuration de Routeur4 pour les internautes", a:"ACL des adresses internes (<code class='i'>access-list 1 permit 192.168.1.0 0.0.0.255</code>), surcharge sur l'interface vers le FAI (<code class='i'>ip nat inside source list 1 interface s0/0 overload</code>), fa0/0 en inside et s0/0 en outside. Les internautes accèdent alors à 77.77.77.77, 88.88.88.88 et 66.66.66.66 avec l'adresse publique 209.165.200.230."},
  ],
});
})();
