# Atelier Technologies WAN – TP en simulations

**Youssfi Jasser · RSI31 · ISET Nabeul · 2026–2027**

Site : https://youssfijasser05-sudo.github.io/TP_WAN_PROJECTS/

Les travaux pratiques de l'atelier WAN, en simulations interactives ActivePresenter (maquettes GNS3 et Packet Tracer, routeurs Cisco). Tout s'ouvre dans le navigateur, sans rien installer.

Le site contient, pour chacun des 9 TP : théorie, topologie interactive (configurations et paquets animés), simulation intégrée, commandes, quiz et correction. Il propose aussi un mode Défi, une page Progression, une page Ressources (glossaire, ports, distances administratives) et une recherche Ctrl K.

## Structure

- `index.html` : accueil, carte du parcours, modules, liste des TP
- `tp.html?id=…` : page d'un TP (ids : tp1, tp2, bgp, redis, nat, ipsec, gre, fr1, fr2)
- `defi.html`, `progression.html`, `ressources.html`
- `assets/js/app.js` : moteur (navigation, recherche, topologies, quiz)
- `assets/js/data/*.js` : contenu des TP (théorie, topologie, commandes, quiz, corrections)
- `SIMULATIONS/` : exports HTML5 ActivePresenter

Pour modifier un TP, éditez son fichier dans `assets/js/data/`.

Les images des simulations ont été compressées (pngquant + oxipng, jpegoptim) pour que le site reste sous la limite de 1 Go de GitHub Pages.
