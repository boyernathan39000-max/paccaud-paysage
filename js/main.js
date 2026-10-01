/* Paccaud Paysage — interactions */
(function () {
  "use strict";

  /* ---------- menu mobile ---------- */
  var entete = document.querySelector(".entete");
  var burger = document.querySelector(".entete__burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var ouvert = entete.classList.toggle("ouvert");
      burger.setAttribute("aria-expanded", ouvert);
      burger.innerHTML = ouvert ? '<i class="ti ti-x"></i>' : '<i class="ti ti-menu-2"></i>';
    });
  }

  /* ---------- apparition au défilement ---------- */
  var aVoir = document.querySelectorAll(".apparait");
  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("vu"); obs.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    aVoir.forEach(function (el, i) {
      var parent = el.parentElement;
      if (parent && parent.hasAttribute("data-cascade")) {
        el.style.transitionDelay = (Array.prototype.indexOf.call(parent.children, el) * 90) + "ms";
      }
      obs.observe(el);
    });
  } else {
    aVoir.forEach(function (el) { el.classList.add("vu"); });
  }

  /* ---------- carrousel : carte active au centre, voisines floutées ---------- */
  document.querySelectorAll("[data-carrousel]").forEach(function (racine) {
    var piste = racine.querySelector(".carrousel__piste");
    var originales = Array.prototype.slice.call(piste.children);
    var n = originales.length;
    // 3 copies pour une boucle infinie
    originales.forEach(function (c) { piste.appendChild(c.cloneNode(true)); });
    originales.forEach(function (c) { piste.insertBefore(c.cloneNode(true), piste.firstChild); });
    var cartes = piste.children;
    var index = n;
    function placer(anime) {
      var carte = cartes[index];
      var decalage = carte.offsetLeft - (racine.clientWidth - carte.offsetWidth) / 2;
      piste.style.transition = anime ? "" : "none";
      piste.style.transform = "translateX(" + (-decalage) + "px)";
      Array.prototype.forEach.call(cartes, function (c, i) { c.classList.toggle("active", i === index); });
    }
    function aller(delta) {
      index += delta;
      placer(true);
    }
    piste.addEventListener("transitionend", function (e) {
      if (e.target !== piste) return;
      if (index >= 2 * n) { index -= n; placer(false); }
      if (index < n) { index += n; placer(false); }
    });
    racine.querySelector(".carrousel__fleche--g").addEventListener("click", function () { aller(-1); });
    racine.querySelector(".carrousel__fleche--d").addEventListener("click", function () { aller(1); });
    Array.prototype.forEach.call(cartes, function (c, i) {
      c.addEventListener("click", function () { if (i !== index) { index = i; placer(true); } });
    });
    var x0 = null;
    racine.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    racine.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) aller(dx < 0 ? 1 : -1);
      x0 = null;
    });
    window.addEventListener("resize", function () { placer(false); });
    window.addEventListener("load", function () { placer(false); });
    placer(false);
  });

  /* ---------- carrousel des prestations (aménagement) ---------- */
  document.querySelectorAll("[data-services]").forEach(function (racine) {
    var fenetre = racine.querySelector(".services-car__fenetre");
    var piste = racine.querySelector(".services-car__piste");
    var slides = Array.prototype.slice.call(piste.children);
    var onglets = racine.querySelectorAll(".services-car__onglets button");
    var compteur = racine.querySelector(".services-car__compteur");
    var i = 0;
    function deux(n) { return (n < 10 ? "0" : "") + n; }
    function aller(n, defiler) {
      i = (n + slides.length) % slides.length;
      fenetre.scrollLeft = 0;
      piste.style.transform = "translateX(" + (-i * 100) + "%)";
      fenetre.style.height = slides[i].offsetHeight + "px";
      onglets.forEach(function (b, k) { b.classList.toggle("actif", k === i); });
      if (compteur) compteur.textContent = deux(i + 1) + " / " + deux(slides.length);
      slides.forEach(function (s, k) { s.setAttribute("aria-hidden", k !== i); });
      if (defiler) racine.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    racine.querySelectorAll(".services-car__fleche--g").forEach(function (b) { b.addEventListener("click", function () { aller(i - 1); }); });
    racine.querySelectorAll(".services-car__fleche--d").forEach(function (b) { b.addEventListener("click", function () { aller(i + 1); }); });
    onglets.forEach(function (b, k) { b.addEventListener("click", function () { aller(k); }); });
    var x0 = null;
    fenetre.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    fenetre.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) aller(dx < 0 ? i + 1 : i - 1);
      x0 = null;
    });
    function depuisAncre() {
      var id = location.hash.slice(1);
      var k = slides.findIndex(function (s) { return s.id === id; });
      if (k >= 0) { aller(k, true); return true; }
      return false;
    }
    window.addEventListener("hashchange", depuisAncre);
    window.addEventListener("resize", function () { aller(i); });
    window.addEventListener("load", function () { if (!depuisAncre()) aller(i); });
    // les liens #moquette… de la page ouvrent la bonne prestation
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var k = slides.findIndex(function (s) { return s.id === id; });
      if (k >= 0) a.addEventListener("click", function (e) { e.preventDefault(); aller(k, true); });
    });
    aller(0);
  });

  /* ---------- galerie filtrable + visionneuse ---------- */
  document.querySelectorAll("[data-galerie]").forEach(function (bloc) {
    var items = Array.prototype.slice.call(bloc.querySelectorAll(".galerie__item"));
    var boutons = bloc.querySelectorAll(".filtres button");
    boutons.forEach(function (b) {
      b.addEventListener("click", function () {
        boutons.forEach(function (x) { x.classList.toggle("actif", x === b); });
        var f = b.getAttribute("data-filtre");
        items.forEach(function (it) {
          it.classList.toggle("cache", f !== "tout" && it.getAttribute("data-cat") !== f);
        });
      });
    });

    var vis = document.querySelector(".visionneuse");
    if (!vis) return;
    var img = vis.querySelector("img"), leg = vis.querySelector("p"), courant = 0;
    function visibles() { return items.filter(function (it) { return !it.classList.contains("cache") && it.querySelector("img"); }); }
    function montrer(i) {
      var liste = visibles();
      courant = (i + liste.length) % liste.length;
      var it = liste[courant];
      img.src = it.getAttribute("data-grande");
      img.alt = it.querySelector("img").alt;
      leg.textContent = it.querySelector("figcaption") ? it.querySelector("figcaption").textContent : "";
      vis.classList.add("ouverte");
    }
    items.forEach(function (it) {
      if (!it.querySelector("img")) return;
      it.addEventListener("click", function () { montrer(visibles().indexOf(it)); });
    });
    vis.querySelector(".visionneuse__fermer").addEventListener("click", function () { vis.classList.remove("ouverte"); });
    vis.querySelector(".visionneuse__prec").addEventListener("click", function (e) { e.stopPropagation(); montrer(courant - 1); });
    vis.querySelector(".visionneuse__suiv").addEventListener("click", function (e) { e.stopPropagation(); montrer(courant + 1); });
    vis.addEventListener("click", function (e) { if (e.target === vis) vis.classList.remove("ouverte"); });
    document.addEventListener("keydown", function (e) {
      if (!vis.classList.contains("ouverte")) return;
      if (e.key === "Escape") vis.classList.remove("ouverte");
      if (e.key === "ArrowLeft") montrer(courant - 1);
      if (e.key === "ArrowRight") montrer(courant + 1);
    });
  });

  /* ---------- bouton flottant WhatsApp / Appeler ----------
     masqué tant qu'un héros couvre plus de la moitié de l'écran,
     et quand le formulaire passe sous la bande du bouton */
  var flottant = document.querySelector(".flottant");
  if (flottant) {
    var heros = document.querySelectorAll(".heros");
    var masques = document.querySelectorAll("[data-sans-flottant]");
    var enAttente = false;
    function verifier() {
      enAttente = false;
      var h = window.innerHeight, cache = false;
      heros.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var couvert = Math.max(0, Math.min(r.bottom, h) - Math.max(r.top, 0));
        if (couvert > h / 2) cache = true;
      });
      masques.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < h && r.bottom > h - 90) cache = true;
      });
      flottant.classList.toggle("visible", !cache);
    }
    window.addEventListener("scroll", function () { if (!enAttente) { enAttente = true; requestAnimationFrame(verifier); } }, { passive: true });
    window.addEventListener("resize", verifier);
    verifier();
  }

  /* ---------- formulaire (maquette : pas d'envoi réel) ---------- */
  var form = document.querySelector(".formulaire form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.closest(".formulaire").classList.add("envoye");
    });
  }

  /* ---------- année ---------- */
  document.querySelectorAll("[data-annee]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
