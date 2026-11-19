/* VPN IPsec et GRE over IPsec */
(function(){
const W = window.WAN = window.WAN || {}; W.TPS = W.TPS || [];

W.TPS.push({
  id:"ipsec", order:6, num:"TP VPN IPsec", short:"VPN IPsec", sub:"site à site · IKE · ESP", theme:"vpn", tool:"GNS3 · c7200 · Wireshark",
  title:"VPN IPsec site à site",
  intro:"Sécuriser le trafic entre deux LAN (192.168.1.0/24 et 192.168.3.0/24) qui traversent un routeur WAN : activation d'ISAKMP, politique IKE phase 1, transform-set de phase 2, ACL du trafic à chiffrer et crypto map, puis observation dans Wireshark.",
  sim:{dir:"TP_IPSEC", modes:["demo","tutorial"], slides:611, steps:155},
  img:"assets/topologie-ipsec.png",
  tags:["ipsec","ike","isakmp","esp","transform-set","crypto map","aes","sha","diffie-hellman","pre-share"],
  objectives:["Configurer l'adressage et le routage statique, tester PC-A ↔ PC-C","Activer ISAKMP et définir la politique IKE phase 1 (AES, SHA-1, pre-share, DH 2)","Définir la phase 2 : transform-set VPN-SET, ACL 110, crypto map VPN-MAP","Appliquer la crypto map sur les interfaces série de R1 et R3","Vérifier le tunnel (show crypto ipsec sa) et analyser ESP dans Wireshark"],
  theory:[
    {t:"Pourquoi IPsec ?", d:"IPsec protège le trafic IP entre deux sites à travers un réseau non fiable. Il apporte la <b>confidentialité</b> (chiffrement), l'<b>intégrité</b> (hachage HMAC), l'<b>authentification</b> des pairs et la protection contre le rejeu."},
    {t:"IKE phase 1 : le canal de gestion", d:"<b>IKE</b> (Internet Key Exchange) s'appuie sur <b>ISAKMP</b> (UDP 500). La phase 1 authentifie les deux routeurs et crée un canal sécurisé (l'<b>IKE SA</b>). Les deux pairs doivent avoir une politique identique : chiffrement <b>AES</b>, hachage <b>SHA-1</b>, authentification <b>pre-share</b> (clé « cisco »), groupe <b>Diffie-Hellman 2</b>, durée de vie 86400 s."},
    {t:"Diffie-Hellman", d:"DH permet aux deux pairs de calculer une même clé secrète en échangeant uniquement des valeurs publiques : la clé n'est jamais transmise sur le réseau. Le groupe (1, 2 ou 5) fixe la taille des nombres utilisés, donc la robustesse."},
    {t:"IKE phase 2 : les SA IPsec", d:"Dans le canal de phase 1, les pairs négocient les <b>SA IPsec</b> qui protègent les données. Le <b>transform-set</b> fixe les algorithmes : <code class='i'>esp-3des esp-sha-hmac</code> = chiffrement 3DES + intégrité SHA. Une SA est unidirectionnelle : il en faut une par sens."},
    {t:"Trafic intéressant et crypto map", d:"L'<b>ACL 110</b> désigne le trafic à chiffrer (192.168.1.0/24 ↔ 192.168.3.0/24) : c'est le « trafic intéressant », il déclenche la négociation. La <b>crypto map</b> réunit le pair (<code class='i'>set peer</code>), le transform-set et l'ACL, puis s'applique sur l'interface de sortie."},
    {t:"ESP en mode tunnel", d:"<b>ESP</b> (protocole IP 50) chiffre le paquet d'origine entier et l'encapsule derrière un nouvel en-tête IP entre les deux routeurs (10.1.1.2 → 10.2.2.2). Le routeur du milieu et Wireshark ne voient que des paquets ESP : adresses privées et ICMP sont invisibles. AH (protocole 51) authentifie sans chiffrer."},
  ],
  glossary:[["IPsec","Suite de protocoles de sécurisation d'IP : confidentialité, intégrité, authentification."],["IKE","Internet Key Exchange : négociation des clés et des SA."],["ISAKMP","Cadre d'IKE pour gérer les associations de sécurité, UDP 500."],["SA","Security Association : ensemble des paramètres de sécurité d'un sens de communication."],["ESP","Encapsulating Security Payload, protocole IP 50 : chiffrement + intégrité."],["AH","Authentication Header, protocole IP 51 : intégrité sans chiffrement."],["Transform-set","Combinaison d'algorithmes IPsec (ex. esp-3des esp-sha-hmac)."],["Crypto map","Objet qui lie pair, transform-set et ACL, appliqué à une interface."],["Diffie-Hellman","Échange de clés qui calcule un secret commun sans le transmettre."]],
  topo:{vb:[800,400], title:"VPN IPsec entre R1 et R3", sub:"dans la maquette GNS3 : R1 = R2, R2 = WAN",
    nodes:[
      {id:"pca",label:"PC-A",role:"192.168.1.3",type:"pc",x:55,y:280,desc:"Hôte du site 1",ifs:[["IP","192.168.1.3/24"],["Passerelle","192.168.1.1"]]},
      {id:"s1",label:"S1",type:"switch",x:155,y:280},
      {id:"r1",label:"R1",role:"pair IPsec",type:"router",x:270,y:280,c:"--rose",desc:"Extrémité du tunnel côté site 1",ifs:[["fa0/0","192.168.1.1/24"],["s0/0/0","10.1.1.2/30"]],
       cfg:`R1(config)# crypto isakmp enable
R1(config)# access-list 110 permit ip 192.168.1.0 0.0.0.255 192.168.3.0 0.0.0.255
R1(config)# crypto isakmp policy 10
R1(config-isakmp)# encryption aes
R1(config-isakmp)# authentication pre-share
R1(config-isakmp)# group 2
R1(config)# crypto isakmp key cisco address 10.2.2.2
R1(config)# crypto ipsec transform-set VPN-SET esp-3des esp-sha-hmac
R1(config)# crypto map VPN-MAP 10 ipsec-isakmp
R1(config-crypto-map)# description VPN connection to R3
R1(config-crypto-map)# set peer 10.2.2.2
R1(config-crypto-map)# set transform-set VPN-SET
R1(config-crypto-map)# match address 110
R1(config)# interface s0/0/0
R1(config-if)# crypto map VPN-MAP`},
      {id:"r2",label:"R2",role:"WAN (transit)",type:"router",x:400,y:95,desc:"Routeur de transit : ne participe pas au VPN",ifs:[["s0/0/0 → R1","10.1.1.1/30"],["s0/0/1 → R3","10.2.2.1/30"]],
       cfg:`R2(config)# interface s0/0/0
R2(config-if)# ip address 10.1.1.1 255.255.255.252
R2(config-if)# clock rate 64000
R2(config)# interface s0/0/1
R2(config-if)# ip address 10.2.2.1 255.255.255.252
R2(config-if)# clock rate 64000
R2(config)# ip route 192.168.1.0 255.255.255.0 10.1.1.2
R2(config)# ip route 192.168.3.0 255.255.255.0 10.2.2.2`},
      {id:"r3",label:"R3",role:"pair IPsec",type:"router",x:530,y:280,c:"--rose",desc:"Extrémité du tunnel côté site 2",ifs:[["fa0/0","192.168.3.1/24"],["s0/0/1","10.2.2.2/30"]],
       cfg:`R3(config)# crypto isakmp enable
R3(config)# access-list 110 permit ip 192.168.3.0 0.0.0.255 192.168.1.0 0.0.0.255
R3(config)# crypto isakmp policy 10
R3(config-isakmp)# encryption aes
R3(config-isakmp)# authentication pre-share
R3(config-isakmp)# group 2
R3(config)# crypto isakmp key cisco address 10.1.1.2
R3(config)# crypto ipsec transform-set VPN-SET esp-3des esp-sha-hmac
R3(config)# crypto map VPN-MAP 10 ipsec-isakmp
R3(config-crypto-map)# description VPN connection to R1
R3(config-crypto-map)# set peer 10.1.1.2
R3(config-crypto-map)# set transform-set VPN-SET
R3(config-crypto-map)# match address 110
R3(config)# interface s0/0/1
R3(config-if)# crypto map VPN-MAP`},
      {id:"s3",label:"S3",type:"switch",x:645,y:280},
      {id:"pcc",label:"PC-C",role:"192.168.3.3",type:"pc",x:745,y:280,desc:"Hôte du site 2",ifs:[["IP","192.168.3.3/24"],["Passerelle","192.168.3.1"]]},
    ],
    links:[
      {a:"pca",b:"s1",label:"192.168.1.0/24",lo:-16,lx:105,ly:258},{a:"s1",b:"r1",lb:"fa0/0 .1",ld:.45,io:14},
      {a:"r1",b:"r2",type:"serial",label:"10.1.1.0/30",la:"s0/0/0 .2",lb:"s0/0/0 .1",side:-1,lo:26},
      {a:"r2",b:"r3",type:"serial",label:"10.2.2.0/30",la:"s0/0/1 .1",lb:"s0/0/1 .2",side:-1,lo:26},
      {a:"r3",b:"s3",la:"fa0/0 .1",ld:.45,io:14},{a:"s3",b:"pcc",label:"192.168.3.0/24",lx:695,ly:258},
      {a:"r1",b:"r3",type:"tunnel",bend:80,label:"Tunnel IPsec · ESP"},
    ],
    scenarios:[
      {label:"PC-A → PC-C (chiffré)", cmd:"PC-A> ping 192.168.3.3", c:"--rose",
       path:[{n:"pca",cap:"ICMP",log:"PC-A : 192.168.3.3 hors LAN → passerelle 192.168.1.1"},{n:"s1"},
             {n:"r1",cap:"ESP",log:"R1 : correspond à l'ACL 110 → chiffrement 3DES/SHA · nouvel en-tête IP 10.1.1.2 → 10.2.2.2 (proto 50)",cls:"w"},
             {n:"r2",cap:"ESP",log:"R2 : ne voit qu'un paquet ESP entre 10.1.1.2 et 10.2.2.2, contenu illisible"},
             {n:"r3",cap:"ICMP",log:"R3 : déchiffrement, vérification HMAC, paquet d'origine 192.168.1.3 → 192.168.3.3",cls:"w"},{n:"s3"},{n:"pcc",log:"PC-C : Echo reply (retour chiffré par la SA inverse)"}],
       end:"R1# show crypto ipsec sa → #pkts encaps: 4, #pkts encrypt: 4, #pkts decaps: 4, #pkts decrypt: 4"},
      {label:"R1 → 10.2.2.2 (non chiffré)", cmd:"R1# ping 10.2.2.2", c:"--sky",
       path:[{n:"r1",cap:"ICMP",log:"R1 : 10.1.1.2 → 10.2.2.2 ne correspond pas à l'ACL 110 → envoyé en clair",cls:"w"},{n:"r2",cap:"ICMP",log:"R2 : ICMP visible en clair"},{n:"r3"}],
       end:"Seul le trafic défini par l'ACL 110 (trafic intéressant) passe dans le tunnel."},
    ]},
  steps:[
    {t:"Adressage et routage statique", r:"R1, R2, R3", cmds:`R1(config)# interface fa0/0
R1(config-if)# ip address 192.168.1.1 255.255.255.0
R1(config-if)# no shutdown
R1(config)# interface s0/0/0
R1(config-if)# ip address 10.1.1.2 255.255.255.252
R1(config-if)# no shutdown
R1(config)# ip route 0.0.0.0 0.0.0.0 10.1.1.1
R2(config)# interface s0/0/0
R2(config-if)# ip address 10.1.1.1 255.255.255.252
R2(config-if)# clock rate 64000
R2(config-if)# no shutdown
R2(config)# interface s0/0/1
R2(config-if)# ip address 10.2.2.1 255.255.255.252
R2(config-if)# clock rate 64000
R2(config-if)# no shutdown
R2(config)# ip route 192.168.1.0 255.255.255.0 10.1.1.2
R2(config)# ip route 192.168.3.0 255.255.255.0 10.2.2.2
R3(config)# ip route 0.0.0.0 0.0.0.0 10.2.2.1
PC-A> ping 192.168.3.3`},
    {t:"1 · Activation d'ISAKMP", r:"R1 et R3", cmds:`R1(config)# crypto isakmp enable
R3(config)# crypto isakmp enable`},
    {t:"3 · Paramètres IPsec", r:"R1", cmds:`R1(config)# access-list 110 permit ip 192.168.1.0 0.0.0.255 192.168.3.0 0.0.0.255
R1(config)# crypto isakmp policy 10
R1(config-isakmp)# encryption aes
R1(config-isakmp)# authentication pre-share
R1(config-isakmp)# group 2
R1(config-isakmp)# exit
R1(config)# crypto isakmp key cisco address 10.2.2.2
R1(config)# crypto ipsec transform-set VPN-SET esp-3des esp-sha-hmac
R1(config)# crypto map VPN-MAP 10 ipsec-isakmp
R1(config-crypto-map)# description VPN connection to R3
R1(config-crypto-map)# set peer 10.2.2.2
R1(config-crypto-map)# set transform-set VPN-SET
R1(config-crypto-map)# match address 110
R1(config-crypto-map)# exit
R1(config)# interface S0/0/0
R1(config-if)# crypto map VPN-MAP`},
    {t:"4 · Paramètres IPsec", r:"R3", cmds:`R3(config)# access-list 110 permit ip 192.168.3.0 0.0.0.255 192.168.1.0 0.0.0.255
R3(config)# crypto isakmp policy 10
R3(config-isakmp)# encryption aes
R3(config-isakmp)# authentication pre-share
R3(config-isakmp)# group 2
R3(config-isakmp)# exit
R3(config)# crypto isakmp key cisco address 10.1.1.2
R3(config)# crypto ipsec transform-set VPN-SET esp-3des esp-sha-hmac
R3(config)# crypto map VPN-MAP 10 ipsec-isakmp
R3(config-crypto-map)# description VPN connection to R1
R3(config-crypto-map)# set peer 10.1.1.2
R3(config-crypto-map)# set transform-set VPN-SET
R3(config-crypto-map)# match address 110
R3(config-crypto-map)# exit
R3(config)# interface S0/0/1
R3(config-if)# crypto map VPN-MAP`},
    {t:"5 à 7 · Vérifications", r:"R1", cmds:`R1# show crypto ipsec sa
PC-A> ping 192.168.3.3
R1# show crypto isakmp sa
R1# show crypto ipsec sa
R1# show crypto map`},
  ],
  quiz:[
    {q:"Quel protocole et quel port utilise ISAKMP/IKE ?", o:["TCP 443","UDP 500","IP protocole 50","UDP 1701"], a:1, e:"IKE/ISAKMP négocie en UDP 500. Le protocole IP 50 est ESP (les données chiffrées)."},
    {q:"Que fait la phase 1 d'IKE ?", o:["Elle chiffre les données utilisateur","Elle authentifie les pairs et crée un canal sécurisé (IKE SA) pour négocier la phase 2","Elle choisit la route","Elle attribue les adresses IP"], a:1, e:"La phase 1 établit l'IKE SA (AES, SHA, pre-share, DH 2) ; la phase 2 négocie ensuite les SA IPsec qui protègent les données."},
    {q:"À quoi sert l'ACL 110 ?", o:["À bloquer le trafic non autorisé","À désigner le trafic intéressant qui doit être chiffré","À faire du NAT","À filtrer le routage"], a:1, e:"Seuls les paquets 192.168.1.0/24 ↔ 192.168.3.0/24 sont chiffrés et déclenchent la négociation du tunnel."},
    {q:"Pourquoi les ACL de R1 et R3 sont-elles inversées ?", o:["C'est une erreur","Chaque routeur décrit le trafic qu'il envoie : source = son LAN, destination = LAN distant","Pour économiser de la mémoire","Pour activer AH"], a:1, e:"Les ACL doivent être symétriques (miroir) : R1 chiffre 1.0 → 3.0, R3 chiffre 3.0 → 1.0."},
    {q:"Que voit Wireshark sur le lien R1-R2 pendant un ping PC-A → PC-C ?", o:["Des paquets ICMP 192.168.1.3 → 192.168.3.3","Des paquets ESP entre 10.1.1.2 et 10.2.2.2","Des paquets GRE","Rien"], a:1, e:"En mode tunnel, ESP chiffre le paquet d'origine et ajoute un en-tête IP entre les pairs : les adresses privées et l'ICMP sont invisibles."},
    {q:"Avant tout ping, que montre <code class='i'>show crypto ipsec sa</code> ?", o:["Des compteurs encaps/encrypt à 0","Une erreur","Des milliers de paquets","Le mot de passe en clair"], a:0, e:"Tant qu'aucun trafic intéressant n'a circulé, pkts encaps/encrypt/decaps/decrypt sont à 0."},
    {q:"Que signifie <code class='i'>esp-3des esp-sha-hmac</code> ?", o:["Chiffrement SHA et intégrité 3DES","Chiffrement 3DES et intégrité HMAC-SHA","Deux tunnels différents","Authentification par certificat"], a:1, e:"3DES chiffre les données (confidentialité), HMAC-SHA garantit leur intégrité et leur origine."},
  ],
  correction:[
    {q:"État du tunnel avant l'envoi de trafic utile (show crypto ipsec sa)", a:"La crypto map est appliquée mais aucune SA n'est encore active : <b>#pkts encaps, encrypt, decaps et decrypt valent 0</b>."},
    {q:"Que montre Wireshark pendant le ping PC-A → PC-C ? Quelles encapsulations ?", a:"On observe d'abord l'échange ISAKMP (UDP 500) des phases 1 et 2, puis uniquement des paquets <b>ESP</b>. Encapsulation au niveau réseau : <b>nouvel en-tête IP</b> (10.1.1.2 → 10.2.2.2, protocole 50) + <b>en-tête ESP</b> (SPI, numéro de séquence) + <b>paquet d'origine chiffré</b> (IP 192.168.1.3 → 192.168.3.3 + ICMP) + trailer et ICV ESP. Le premier ping peut perdre un paquet le temps de négocier les SA."},
    {q:"État du tunnel après le ping", a:"Les compteurs augmentent : <b>#pkts encaps = #pkts encrypt</b> (paquets chiffrés par R1) et <b>#pkts decaps = #pkts decrypt</b> (réponses déchiffrées). <code class='i'>show crypto isakmp sa</code> montre l'IKE SA à l'état QM_IDLE (active)."},
  ],
});

W.TPS.push({
  id:"gre", order:7, num:"TP GRE over IPsec", short:"GRE over IPsec", sub:"tunnel · NAT · chiffrement", theme:"vpn", tool:"GNS3 · c7200 · Wireshark",
  title:"Tunnel GRE protégé par IPsec",
  intro:"Deux sites en adressage privé (10.0.10.0/24 et 10.0.20.0/24) sortent sur Internet par du PAT. On les relie par un tunnel GRE, on route le trafic inter-sites dans le tunnel, puis on chiffre ce tunnel avec IPsec.",
  sim:{dir:"VPN_GRE_IPSEC", modes:["demo","tutorial","practice","test"], slides:1191, steps:265},
  tags:["gre","tunnel","ipsec","nat","pat","mtu","crypto map","multicast"],
  objectives:["Configurer le NAT/PAT de chaque site en excluant le trafic inter-sites","Créer l'interface Tunnel 0 (GRE) entre RouterA et RouterB","Router le trafic inter-sites dans le tunnel et analyser l'encapsulation GRE","Chiffrer le trafic GRE avec IPsec (crypto map S2SVPN)"],
  theory:[
    {t:"GRE : un tunnel générique", d:"<b>GRE</b> (Generic Routing Encapsulation, protocole IP <b>47</b>) encapsule un paquet dans un nouveau paquet IP entre deux extrémités publiques. Les deux sites voient le tunnel comme un lien direct (172.16.1.0/24), alors qu'il traverse le routeur WAN. GRE <b>ne chiffre rien</b>."},
    {t:"Pourquoi combiner GRE et IPsec ?", d:"IPsec seul ne transporte pas le <b>multicast</b> : impossible d'y faire tourner OSPF ou EIGRP. GRE, lui, transporte le multicast mais sans sécurité. On encapsule donc d'abord dans GRE (unicast), puis on chiffre ce GRE avec IPsec : on obtient routage dynamique + confidentialité."},
    {t:"Interface Tunnel", d:"<code class='i'>tunnel source</code> = interface publique locale, <code class='i'>tunnel destination</code> = adresse publique de l'autre extrémité. L'interface Tunnel 0 reçoit sa propre adresse (172.16.1.1 et .2) et se comporte comme une interface point à point."},
    {t:"MTU 1400", d:"Chaque encapsulation ajoute des en-têtes (GRE 24 octets, ESP environ 50 à 60). Pour éviter la fragmentation sur le lien physique (MTU 1500), on limite la MTU IP du tunnel à <b>1400 octets</b> avec <code class='i'>ip mtu 1400</code>."},
    {t:"NAT et trafic inter-sites", d:"Chaque site sort sur Internet en PAT (<code class='i'>overload</code> sur s0/0). L'ACL 100 <b>refuse</b> d'abord le trafic site 1 → site 2 (<code class='i'>deny</code>) pour qu'il ne soit pas traduit et puisse passer dans le tunnel, puis autorise le reste vers Internet."},
    {t:"Crypto map sur du GRE", d:"L'ACL du trafic intéressant ne vise plus les LAN mais le GRE lui-même : <code class='i'>access-list 101 permit gre host 201.20.20.1 host 204.20.20.2</code>. Tout ce qui passe dans le tunnel est chiffré. Clé : <code class='i'>crypto isakmp key 6 P@ssword</code> (6 = clé stockée chiffrée, 0 = en clair)."},
  ],
  glossary:[["GRE","Generic Routing Encapsulation, protocole IP 47 : tunnel sans chiffrement."],["Tunnel source","Interface ou adresse locale de départ du tunnel."],["Tunnel destination","Adresse publique de l'extrémité distante."],["MTU","Maximum Transmission Unit : taille maximale d'un paquet sans fragmentation."],["S2SVPN","Nom de la crypto map (Site-to-Site VPN)."],["Overload","Mot-clé du PAT : plusieurs hôtes partagent une adresse publique."]],
  topo:{vb:[800,420], title:"GRE over IPsec entre deux sites", sub:"Tunnel 0 · 172.16.1.0/24",
    zones:[{x:20,y:200,w:310,h:200,label:"SITE 1 · 10.0.10.0/24",c:"--sky"},{x:470,y:200,w:310,h:200,label:"SITE 2 · 10.0.20.0/24",c:"--lime"}],
    nodes:[
      {id:"p1",label:"Poste1",role:"10.0.10.10",type:"pc",x:65,y:300,desc:"Hôte du site 1"},
      {id:"sw1",label:"SW1",type:"switch",x:165,y:300},
      {id:"ra",label:"RouterA",role:"NAT · GRE · IPsec",type:"router",x:275,y:300,c:"--rose",desc:"Extrémité du tunnel, site 1",ifs:[["fa0/0 (inside)","10.0.10.1/24"],["s0/0 (outside)","201.20.20.1/30"],["Tunnel 0","172.16.1.1/24"]],
       cfg:`RouterA(config)# access-list 100 deny ip 10.0.10.0 0.0.0.255 10.0.20.0 0.0.0.255
RouterA(config)# access-list 100 permit ip 10.0.10.0 0.0.0.255 any
RouterA(config)# ip nat inside source list 100 interface s0/0 overload
RouterA(config)# interface Tunnel 0
RouterA(config-if)# ip address 172.16.1.1 255.255.255.0
RouterA(config-if)# ip mtu 1400
RouterA(config-if)# tunnel source S0/0
RouterA(config-if)# tunnel destination 204.20.20.2
RouterA(config)# ip route 10.0.20.0 255.255.255.0 172.16.1.2
RouterA(config)# crypto isakmp policy 1
RouterA(config-isakmp)# authentication pre-share
RouterA(config)# crypto isakmp key 6 P@ssword address 204.20.20.2
RouterA(config)# crypto ipsec transform-set strong esp-3des esp-md5-hmac
RouterA(config)# access-list 101 permit gre host 201.20.20.1 host 204.20.20.2
RouterA(config)# crypto map S2SVPN 10 ipsec-isakmp
RouterA(config-crypto-map)# match address 101
RouterA(config-crypto-map)# set peer 204.20.20.2
RouterA(config-crypto-map)# set transform-set strong
RouterA(config)# interface S0/0
RouterA(config-if)# crypto map S2SVPN`},
      {id:"wan",label:"WAN",role:"Internet",type:"router",x:400,y:95,desc:"Routeur de l'opérateur : ne connaît que les adresses publiques",ifs:[["s0/0 → RouterA","201.20.20.2/30"],["s0/1 → RouterB","204.20.20.1/30"]],
       cfg:`WAN(config)# interface s0/0
WAN(config-if)# ip address 201.20.20.2 255.255.255.252
WAN(config-if)# no shut
WAN(config)# interface s0/1
WAN(config-if)# ip address 204.20.20.1 255.255.255.252
WAN(config-if)# no shut`},
      {id:"rb",label:"RouterB",role:"NAT · GRE · IPsec",type:"router",x:525,y:300,c:"--rose",desc:"Extrémité du tunnel, site 2",ifs:[["fa0/0 (inside)","10.0.20.1/24"],["s0/0 (outside)","204.20.20.2/30"],["Tunnel 0","172.16.1.2/24"]],
       cfg:`RouterB(config)# access-list 100 deny ip 10.0.20.0 0.0.0.255 10.0.10.0 0.0.0.255
RouterB(config)# access-list 100 permit ip 10.0.20.0 0.0.0.255 any
RouterB(config)# ip nat inside source list 100 interface s0/0 overload
RouterB(config)# interface Tunnel 0
RouterB(config-if)# ip address 172.16.1.2 255.255.255.0
RouterB(config-if)# ip mtu 1400
RouterB(config-if)# tunnel source S0/0
RouterB(config-if)# tunnel destination 201.20.20.1
RouterB(config)# ip route 10.0.10.0 255.255.255.0 172.16.1.1
RouterB(config)# crypto isakmp key 6 P@ssword address 201.20.20.1
RouterB(config)# access-list 101 permit gre host 204.20.20.2 host 201.20.20.1
RouterB(config)# crypto map S2SVPN 10 ipsec-isakmp
RouterB(config-crypto-map)# set peer 201.20.20.1
RouterB(config)# interface S0/0
RouterB(config-if)# crypto map S2SVPN`},
      {id:"sw2",label:"SW2",type:"switch",x:635,y:300},
      {id:"p2",label:"Poste2",role:"10.0.20.10",type:"pc",x:735,y:300,desc:"Hôte du site 2"},
    ],
    links:[
      {a:"p1",b:"sw1"},{a:"sw1",b:"ra",lb:"fa0/0 .1",ld:.45,io:14},
      {a:"ra",b:"wan",type:"serial",label:"201.20.20.0/30",la:"s0/0 .1",lb:".2",side:-1,lo:26},
      {a:"wan",b:"rb",type:"serial",label:"204.20.20.0/30",la:".1",lb:"s0/0 .2",side:-1,lo:26},
      {a:"rb",b:"sw2",la:"fa0/0 .1",ld:.45,io:14},{a:"sw2",b:"p2"},
      {a:"ra",b:"rb",type:"tunnel",bend:-110,label:"Tunnel 0 · GRE + IPsec"},
    ],
    scenarios:[
      {label:"Poste1 → Poste2 (GRE + IPsec)", cmd:"Poste1> ping 10.0.20.10", c:"--rose",
       path:[{n:"p1",cap:"IP"},{n:"sw1"},{n:"ra",cap:"ESP[GRE[IP]]",log:"RouterA : route 10.0.20.0/24 via Tunnel 0 · ACL 100 deny → pas de NAT · encapsulation GRE (201.20.20.1 → 204.20.20.2, proto 47) · ACL 101 → chiffrement ESP",cls:"w"},
             {n:"wan",cap:"ESP",log:"WAN : ne voit que de l'ESP entre adresses publiques"},{n:"rb",cap:"IP",log:"RouterB : déchiffrement ESP → décapsulation GRE → paquet 10.0.10.10 → 10.0.20.10",cls:"w"},{n:"sw2"},{n:"p2"}],
       end:"84 bytes from 10.0.20.10 icmp_seq=1 ttl=62"},
      {label:"RouterA ping 10.0.20.1 (sans route)", cmd:"RouterA# ping 10.0.20.1   (étape 4)", c:"--red",
       path:[{n:"ra",log:"RouterA : aucune route vers 10.0.20.0/24 → route par défaut vers 201.20.20.2",cls:"w"},{n:"wan",fail:true,log:"WAN : 10.0.20.0/24 est un réseau privé inconnu → paquet détruit. Il faut ip route 10.0.20.0 255.255.255.0 172.16.1.2",cls:"e"}]},
      {label:"Accès Internet du site 1 (PAT)", cmd:"Poste1> ping 204.20.20.1", c:"--sky",
       path:[{n:"p1"},{n:"sw1"},{n:"ra",cap:"201.20.20.1",log:"RouterA : ACL 100 permit → PAT sur l'adresse de s0/0 (201.20.20.1:port)"},{n:"wan",log:"WAN : répond à 201.20.20.1"}],
       end:"Le trafic vers Internet sort en PAT, hors tunnel."},
    ]},
  steps:[
    {t:"Configuration de base", r:"RouterA", cmds:`RouterA(config)# int fa0/0
RouterA(config-if)# ip address 10.0.10.1 255.255.255.0
RouterA(config-if)# ip nat inside
RouterA(config-if)# no shut
RouterA(config)# int s0/0
RouterA(config-if)# ip address 201.20.20.1 255.255.255.252
RouterA(config-if)# ip nat outside
RouterA(config-if)# no shut
RouterA(config)# ip route 0.0.0.0 0.0.0.0 201.20.20.2
RouterA(config)# access-list 100 deny ip 10.0.10.0 0.0.0.255 10.0.20.0 0.0.0.255
RouterA(config)# access-list 100 permit ip 10.0.10.0 0.0.0.255 any
RouterA(config)# ip nat inside source list 100 interface s0/0 overload`},
    {t:"Configuration de base", r:"WAN et RouterB", cmds:`WAN(config)# int s0/0
WAN(config-if)# ip address 201.20.20.2 255.255.255.252
WAN(config-if)# no shut
WAN(config)# int s0/1
WAN(config-if)# ip address 204.20.20.1 255.255.255.252
WAN(config-if)# no shut
RouterB(config)# int fa0/0
RouterB(config-if)# ip address 10.0.20.1 255.255.255.0
RouterB(config-if)# ip nat inside
RouterB(config-if)# no shut
RouterB(config)# int s0/0
RouterB(config-if)# ip address 204.20.20.2 255.255.255.252
RouterB(config-if)# ip nat outside
RouterB(config-if)# no shut
RouterB(config)# ip route 0.0.0.0 0.0.0.0 204.20.20.1
RouterB(config)# access-list 100 deny ip 10.0.20.0 0.0.0.255 10.0.10.0 0.0.0.255
RouterB(config)# access-list 100 permit ip 10.0.20.0 0.0.0.255 any
RouterB(config)# ip nat inside source list 100 interface s0/0 overload`},
    {t:"Tunnel GRE", r:"RouterA et RouterB", cmds:`RouterA(config)# interface Tunnel 0
RouterA(config-if)# ip address 172.16.1.1 255.255.255.0
RouterA(config-if)# ip mtu 1400
RouterA(config-if)# tunnel source S0/0
RouterA(config-if)# tunnel destination 204.20.20.2
RouterB(config)# interface Tunnel 0
RouterB(config-if)# ip address 172.16.1.2 255.255.255.0
RouterB(config-if)# ip mtu 1400
RouterB(config-if)# tunnel source S0/0
RouterB(config-if)# tunnel destination 201.20.20.1
RouterA# ping 172.16.1.2
RouterA# ping 10.0.20.1`},
    {t:"Routage par le tunnel", r:"RouterA et RouterB", cmds:`RouterA(config)# ip route 10.0.20.0 255.255.255.0 172.16.1.2
RouterB(config)# ip route 10.0.10.0 255.255.255.0 172.16.1.1
RouterA# ping 10.0.20.1
RouterA# ping 10.0.20.1 repeat 1
RouterA# show interface tunnel 0`},
    {t:"Partie II · Chiffrement IPsec", r:"RouterA", cmds:`RouterA(config)# crypto isakmp enable
RouterA(config)# crypto isakmp policy 1
RouterA(config-isakmp)# authentication pre-share
RouterA(config)# crypto isakmp key 6 P@ssword address 204.20.20.2
RouterA(config)# crypto ipsec security-association lifetime seconds 4096
RouterA(config)# crypto ipsec transform-set strong esp-3des esp-md5-hmac
RouterA(config)# access-list 101 permit gre host 201.20.20.1 host 204.20.20.2
RouterA(config)# crypto map S2SVPN 10 ipsec-isakmp
RouterA(config-crypto-map)# match address 101
RouterA(config-crypto-map)# set peer 204.20.20.2
RouterA(config-crypto-map)# set transform-set strong
RouterA(config)# interface S0/0
RouterA(config-if)# crypto map S2SVPN`},
    {t:"Partie II · Chiffrement IPsec", r:"RouterB", cmds:`RouterB(config)# crypto isakmp enable
RouterB(config)# crypto isakmp policy 1
RouterB(config-isakmp)# authentication pre-share
RouterB(config)# crypto isakmp key 6 P@ssword address 201.20.20.1
RouterB(config)# crypto ipsec security-association lifetime seconds 4096
RouterB(config)# crypto ipsec transform-set strong esp-3des esp-md5-hmac
RouterB(config)# access-list 101 permit gre host 204.20.20.2 host 201.20.20.1
RouterB(config)# crypto map S2SVPN 10 ipsec-isakmp
RouterB(config-crypto-map)# match address 101
RouterB(config-crypto-map)# set peer 201.20.20.1
RouterB(config-crypto-map)# set transform-set strong
RouterB(config)# interface S0/0
RouterB(config-if)# crypto map S2SVPN
RouterA# ping 10.0.20.1
RouterA# show crypto isakmp sa
RouterA# show crypto ipsec sa
RouterA# show crypto map`},
  ],
  quiz:[
    {q:"Quel numéro de protocole IP identifie GRE ?", o:["6","17","47","50"], a:2, e:"GRE = protocole IP 47. 6 = TCP, 17 = UDP, 50 = ESP."},
    {q:"Pourquoi combine-t-on GRE et IPsec ?", o:["GRE chiffre mieux que IPsec","IPsec ne transporte pas le multicast ; GRE oui, mais sans chiffrement","Pour doubler la bande passante","Pour éviter le NAT"], a:1, e:"GRE permet de faire passer les protocoles de routage (multicast) dans un paquet unicast, qu'IPsec peut ensuite chiffrer."},
    {q:"RouterA# ping 10.0.20.1 échoue juste après la création du tunnel. Pourquoi ?", o:["Le tunnel est down","RouterA n'a pas de route vers 10.0.20.0 par le tunnel : le paquet suit la route par défaut et le WAN ne connaît pas ce réseau privé","Le NAT bloque l'ICMP","La MTU est trop petite"], a:1, e:"Il faut ip route 10.0.20.0 255.255.255.0 172.16.1.2 pour envoyer le trafic inter-sites dans le tunnel."},
    {q:"À quoi sert la ligne <code class='i'>access-list 100 deny ip 10.0.10.0 … 10.0.20.0 …</code> ?", o:["À bloquer le site 2","À empêcher la traduction NAT du trafic inter-sites, qui doit passer par le tunnel","À chiffrer le trafic","À autoriser Internet"], a:1, e:"L'ACL 100 sert au NAT : deny = pas de traduction. Le trafic entre sites garde ses adresses privées et entre dans le tunnel."},
    {q:"Pourquoi fixe-t-on <code class='i'>ip mtu 1400</code> sur le tunnel ?", o:["Pour accélérer le routage","Pour éviter la fragmentation due aux en-têtes GRE et ESP ajoutés","C'est obligatoire pour IPsec","Pour réduire la latence"], a:1, e:"Chaque encapsulation ajoute des octets : avec 1400, le paquet final reste sous la MTU de 1500 du lien série."},
    {q:"Quel trafic désigne l'ACL 101 de la partie II ?", o:["Le trafic des LAN","Le trafic GRE entre les deux adresses publiques des routeurs","Le trafic NAT","Le trafic ICMP"], a:1, e:"permit gre host 201.20.20.1 host 204.20.20.2 : tout le contenu du tunnel est chiffré, quel que soit le trafic transporté."},
    {q:"Dans <code class='i'>crypto isakmp key 6 P@ssword</code>, que signifie le 6 ?", o:["La longueur de la clé","Que la clé est stockée chiffrée (0 = en clair)","Le groupe Diffie-Hellman","Le numéro de politique"], a:1, e:"Comme l'indique l'énoncé : 6 = la clé qui suit doit être chiffrée, 0 = elle ne l'est pas."},
  ],
  correction:[
    {q:"Le ping RouterA → 172.16.1.2 réussit-il ?", a:"Oui : les deux extrémités du tunnel sont directement connectées par Tunnel 0 (réseau 172.16.1.0/24)."},
    {q:"RouterA# ping 10.0.20.1 aboutit-il ? Sinon pourquoi ?", a:"Non. RouterA n'a pas de route vers 10.0.20.0/24 par le tunnel : le paquet suit la route par défaut vers le routeur WAN, qui ne connaît pas ce réseau privé et le détruit. Après <code class='i'>ip route 10.0.20.0 255.255.255.0 172.16.1.2</code> (et la route inverse sur RouterB), le ping réussit."},
    {q:"Encapsulation observée sur S0/0 de RouterA (ping 10.0.20.1 repeat 1)", a:"Deux en-têtes IP : <b>IP externe</b> 201.20.20.1 → 204.20.20.2 (protocole 47) + <b>en-tête GRE</b> (type 0x0800 = IPv4) + <b>IP interne</b> 172.16.1.1 → 10.0.20.1 (le routeur prend l'adresse du Tunnel 0 comme source) + ICMP. La réponse fait le chemin inverse. Le contenu est lisible : GRE ne chiffre pas."},
    {q:"Après la partie II, que voit-on ?", a:"Après la négociation ISAKMP (UDP 500), la capture ne montre plus que des paquets <b>ESP</b> (protocole 50) entre 201.20.20.1 et 204.20.20.2 : le GRE et le paquet d'origine sont chiffrés. <code class='i'>show crypto isakmp sa</code> montre la SA active, <code class='i'>show crypto ipsec sa</code> des compteurs encrypt/decrypt qui augmentent, <code class='i'>show crypto map</code> la map S2SVPN liée à S0/0."},
  ],
});
})();
