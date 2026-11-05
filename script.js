(function () {
  "use strict";

  // Número do WhatsApp da loja (DDI + DDD + número, só dígitos)
  var WA = "553438410229";
  function link(t) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(t); }
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    a.href = link(a.getAttribute("data-wa"));
  });

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var small = window.matchMedia("(max-width: 760px)");

  // Menu mobile
  var menu = document.getElementById("menu"), burger = document.getElementById("burger");
  function setMenu(o) {
    menu.classList.toggle("open", o);
    burger.setAttribute("aria-expanded", o);
    burger.setAttribute("aria-label", o ? "Fechar menu" : "Abrir menu");
    document.body.classList.toggle("menu-open", o);
    document.documentElement.classList.toggle("menu-open", o);
  }
  burger.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("click", function (e) {
    if (menu.classList.contains("open") && !e.target.closest("#top")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  window.matchMedia("(min-width: 961px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });

  // Carrossel de serviços (celular): pontos de navegação
  var grid = document.getElementById("svc-grid"), dotsBox = document.getElementById("svc-dots");
  if (grid && dotsBox) {
    var cards = Array.prototype.slice.call(grid.children);
    var dots = cards.map(function (c, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Serviço " + (i + 1));
      b.addEventListener("click", function () {
        grid.scrollTo({ left: c.offsetLeft - grid.offsetLeft - parseFloat(getComputedStyle(grid).paddingLeft), behavior: reduce ? "auto" : "smooth" });
      });
      dotsBox.appendChild(b);
      return b;
    });
    var dTick = false;
    function syncDots() {
      dTick = false;
      var gl = grid.getBoundingClientRect().left, best = 0, bd = Infinity;
      cards.forEach(function (c, i) {
        var d = Math.abs(c.getBoundingClientRect().left - gl);
        if (d < bd) { bd = d; best = i; }
      });
      if (grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 4) best = cards.length - 1;
      dots.forEach(function (b, i) { b.classList.toggle("on", i === best); });
    }
    grid.addEventListener("scroll", function () { if (!dTick) { dTick = true; requestAnimationFrame(syncDots); } }, { passive: true });
    syncDots();
  }

  // Esconde a barra fixa enquanto digita no formulário (teclado aberto)
  var formEl = document.getElementById("form");
  formEl.addEventListener("focusin", function (e) {
    if (e.target.matches("input, select, textarea")) document.body.classList.add("typing");
  });
  formEl.addEventListener("focusout", function () {
    setTimeout(function () { if (!formEl.contains(document.activeElement)) document.body.classList.remove("typing"); }, 50);
  });

  // Revelar ao rolar
  var reveals = document.querySelectorAll(".reveal");
  document.querySelectorAll(".grid, .feats").forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty("--d", (i % 3) * 0.1 + "s"); });
  });
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  // Header, progresso e parallax de rolagem
  var top = document.getElementById("top"), bar = document.getElementById("progress");
  var scrollEls = Array.prototype.slice.call(document.querySelectorAll("[data-scroll]"));
  var depthEls = Array.prototype.slice.call(document.querySelectorAll("[data-depth]"));
  var mx = 0, my = 0, cmx = 0, cmy = 0, ticking = false;

  function frame() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    top.classList.toggle("scrolled", y > 20);
    bar.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    if (reduce) return;

    // suaviza o movimento do mouse
    cmx += (mx - cmx) * 0.08; cmy += (my - cmy) * 0.08;

    var offsets = new Map();
    scrollEls.forEach(function (el) {
      var host = el.closest("section") || el.parentElement;
      var r = host.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var center = r.top + r.height / 2 - vh / 2;
      offsets.set(el, [0, -center * parseFloat(el.dataset.scroll) * (small.matches ? 0.5 : 1)]);
    });
    if (window.scrollY < vh * 1.2) {
      depthEls.forEach(function (el) {
        var d = parseFloat(el.dataset.depth) * 40;
        var o = offsets.get(el) || [0, 0];
        offsets.set(el, [o[0] + cmx * d, o[1] + cmy * d]);
      });
    }
    offsets.forEach(function (o, el) {
      el.style.translate = o[0].toFixed(1) + "px " + o[1].toFixed(1) + "px";
    });

    if (Math.abs(mx - cmx) > 0.001 || Math.abs(my - cmy) > 0.001) request();
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  if (fine && !reduce) {
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
      request();
    }, { passive: true });
  }
  frame();

  // Inclinação 3D nos cartões
  if (fine && !reduce) {
    document.querySelectorAll(".tilt").forEach(function (el) {
      var max = parseFloat(el.dataset.tilt) || 10;
      var glare = el.classList.contains("card3d");
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.transition = "transform .12s linear";
        el.style.transform = "rotateX(" + ((0.5 - py) * max).toFixed(2) + "deg) rotateY(" + ((px - 0.5) * max).toFixed(2) + "deg)" + (glare ? "" : " translateZ(10px)");
        el.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
        el.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
      });
      el.addEventListener("mouseleave", function () {
        el.style.transition = "";
        el.style.transform = "";
      });
    });
  }

  // Formulário -> WhatsApp
  document.getElementById("form").addEventListener("submit", function (e) {
    e.preventDefault();
    var n = document.getElementById("nome"), t = document.getElementById("tel");
    [n, t].forEach(function (i) { i.classList.remove("err"); });
    if (!n.value.trim()) { n.classList.add("err"); n.focus(); return; }
    if (t.value.replace(/\D/g, "").length < 10) { t.classList.add("err"); t.focus(); return; }
    var txt = "Olá! Meu nome é " + n.value.trim() + ".\nTelefone: " + t.value.trim() +
      "\nInteresse: " + document.getElementById("interesse").value +
      "\nMensagem: " + (document.getElementById("msg").value.trim() || "—");
    window.open(link(txt), "_blank", "noopener");
    document.getElementById("ok").classList.add("show");
    e.target.reset();
  });

  document.getElementById("ano").textContent = new Date().getFullYear();
})();
