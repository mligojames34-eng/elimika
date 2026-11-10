// Elimika Ung'are — shared site behaviour.
// No build step, no dependencies: include this file on every page.

document.addEventListener("DOMContentLoaded", function () {
  initPageLoader();
  initThemeToggle();
  initLanguageToggle();
  initPageTransitions();
  initHeaderScrollShadow();
  initMobileNav();
  initFaqAccordion();
  initContactForm();
  initBackToTop();
  initScrollReveal();
  initHeroBackgroundRotation();
  initPosterSlider();
  initScrollProgress();
  initCardTilt();
});

/* Slim gold progress bar across the top of the viewport, tracking scroll depth */
function initScrollProgress() {
  var bar = document.querySelector(".scroll-progress");
  if (!bar) return;
  function update() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var pct = height > 0 ? (scrollTop / height) * 100 : 0;
    bar.style.width = pct + "%";
  }
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

/*
 * Subtle 3D tilt on cards for pointer devices only (mice/trackpads), so it
 * never interferes with touch scrolling on phones and tablets.
 */
function initCardTilt() {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  var cards = document.querySelectorAll(".service-card, .why-card, .poster-card");
  cards.forEach(function (card) {
    card.style.willChange = "transform";
    card.addEventListener("mousemove", function (e) {
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = "perspective(700px) rotateX(" + (-y * 5) + "deg) rotateY(" + (x * 5) + "deg) translateY(-4px)";
    });
    card.addEventListener("mouseleave", function () {
      card.style.transform = "";
    });
  });
}

/*
 * A quiet three-dot loader shown while the page's own assets (fonts,
 * images) are still loading. It's removed once everything is ready, with a
 * short minimum display time so it never just flashes on fast connections.
 */
function initPageLoader() {
  var loader = document.querySelector(".page-loader");
  if (!loader) return;
  var minDisplay = 1200;
  var shownAt = Date.now();

  function hide() {
    var elapsed = Date.now() - shownAt;
    var wait = Math.max(0, minDisplay - elapsed);
    setTimeout(function () {
      loader.classList.add("is-hidden");
      setTimeout(function () {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 500);
    }, wait);
  }

  if (document.readyState === "complete") {
    hide();
  } else {
    window.addEventListener("load", hide);
  }
}

/* Dark mode toggle. The theme is applied instantly on every page load by a
 * tiny inline script in <head> (before the stylesheet paints), so there is
 * no flash of the wrong theme; this function only wires up the toggle
 * button and keeps the saved preference (localStorage) in sync.
 */
function initThemeToggle() {
  var STORAGE_KEY = "elimika-theme";
  var html = document.documentElement;
  var buttons = document.querySelectorAll("[data-theme-toggle]");
  if (!buttons.length) return;

  function currentTheme() {
    return html.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function setTheme(theme) {
    html.setAttribute("data-theme", theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  });
}

/*
 * Kiswahili / English language toggle. Swahili is the source language
 * written directly in the HTML; any element that should be translatable
 * carries a data-en (or data-en-placeholder / data-en-aria-label /
 * data-en-title / data-en-content / data-en-alt) attribute holding the
 * English copy. On first switch to English the original Swahili value is
 * cached on the element (data-sw-*) so switching back is instant and never
 * loses the original wording, even across repeated toggles.
 */
function initLanguageToggle() {
  var STORAGE_KEY = "elimika-lang";
  var html = document.documentElement;
  var buttons = document.querySelectorAll("[data-lang-toggle]");

  var ATTR_MAP = [
    { en: "data-en", sw: "data-sw-text", prop: "text" },
    { en: "data-en-placeholder", sw: "data-sw-placeholder", attr: "placeholder" },
    { en: "data-en-aria-label", sw: "data-sw-aria-label", attr: "aria-label" },
    { en: "data-en-alt", sw: "data-sw-alt", attr: "alt" },
    { en: "data-en-title", sw: "data-sw-title", prop: "title" },
    { en: "data-en-content", sw: "data-sw-content", attr: "content" }
  ];

  function applyLang(lang) {
    var isEn = lang === "en";

    ATTR_MAP.forEach(function (map) {
      document.querySelectorAll("[" + map.en + "]").forEach(function (el) {
        if (map.prop === "text") {
          if (!el.hasAttribute(map.sw)) el.setAttribute(map.sw, el.innerHTML);
          if (isEn) {
            el.textContent = el.getAttribute(map.en);
          } else {
            el.innerHTML = el.getAttribute(map.sw);
          }
        } else if (map.prop === "title") {
          if (!el.hasAttribute(map.sw)) el.setAttribute(map.sw, document.title);
          document.title = isEn ? el.getAttribute(map.en) : el.getAttribute(map.sw);
        } else {
          if (!el.hasAttribute(map.sw)) el.setAttribute(map.sw, el.getAttribute(map.attr) || "");
          el.setAttribute(map.attr, isEn ? el.getAttribute(map.en) : el.getAttribute(map.sw));
        }
      });
    });

    html.setAttribute("lang", isEn ? "en" : "sw");

    buttons.forEach(function (btn) {
      btn.textContent = isEn ? "SW" : "EN";
      btn.setAttribute("aria-label", isEn ? "Badili kuwa Kiswahili" : "Switch to English");
    });

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  if (buttons.length) {
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var current = html.getAttribute("lang") === "en" ? "en" : "sw";
        applyLang(current === "en" ? "sw" : "en");
      });
    });
  }

  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  applyLang(saved === "en" ? "en" : "sw");
}

/*
 * Homepage hero backdrop: cross-fades through the stacked .hero__bg-img
 * layers (only present on index.html) so the certificate/license images
 * behind the hero alternate one after another. Does nothing on pages
 * that don't have this markup. Respects prefers-reduced-motion by simply
 * leaving the first image in place.
 */
function initHeroBackgroundRotation() {
  var items = document.querySelectorAll(".hero__bg-img");
  if (items.length < 2) return;

  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  var current = 0;
  window.setInterval(function () {
    items[current].classList.remove("is-active");
    current = (current + 1) % items.length;
    items[current].classList.add("is-active");
  }, 4500);
}

/*
 * Page transitions: fades the page in on load (the <body> starts with
 * class="is-entering", set in the HTML, so there's no flash of visible
 * content before this runs) and fades it out before following a link to
 * another page on this site, so navigation feels like one continuous motion
 * rather than a hard cut.
 */
function initPageTransitions() {
  // Let the browser paint the initial (invisible) state first, then drop the
  // class on the next frame so the opacity change is actually transitioned.
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      document.body.classList.remove("is-entering");
    });
  });

  var PAGE_TRANSITION_MS = 220;

  document.querySelectorAll("a[href]").forEach(function (link) {
    var url = link.getAttribute("href");
    if (!url || url.charAt(0) === "#") return;
    if (link.target === "_blank") return;
    if (url.indexOf("mailto:") === 0 || url.indexOf("tel:") === 0) return;
    if (/^https?:\/\//i.test(url) && link.hostname !== window.location.hostname) return;

    link.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      e.preventDefault();
      document.body.classList.add("is-leaving");
      window.setTimeout(function () {
        window.location.href = url;
      }, PAGE_TRANSITION_MS);
    });
  });
}

/*
 * Scroll reveal: elements marked with data-reveal fade/slide in the first
 * time they cross into the viewport. Siblings that share a common
 * [data-reveal-group] ancestor (card grids, lists, etc.) are staggered
 * automatically based on their order.
 */
function initScrollReveal() {
  var items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;

  document.querySelectorAll("[data-reveal-group]").forEach(function (group) {
    var children = group.querySelectorAll("[data-reveal]");
    children.forEach(function (child, i) {
      child.style.setProperty("--reveal-delay", Math.min(i * 90, 450) + "ms");
    });
  });

  if (!("IntersectionObserver" in window)) {
    items.forEach(function (item) { item.classList.add("is-visible"); });
    return;
  }

  var observer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

  items.forEach(function (item) { observer.observe(item); });
}

/* Shows the back-to-top button once the page is scrolled, scrolls smoothly on click. */
function initBackToTop() {
  var button = document.querySelector(".fab--top");
  if (!button) return;

  var onScroll = function () {
    button.classList.toggle("is-visible", window.scrollY > 400);
  };
  onScroll();
  window.addEventListener("scroll", onScroll);

  button.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* Adds a shadow/border to the sticky header once the page is scrolled. */
function initHeaderScrollShadow() {
  var header = document.querySelector(".header");
  if (!header) return;
  var onScroll = function () {
    header.classList.toggle("header--scrolled", window.scrollY > 10);
  };
  onScroll();
  window.addEventListener("scroll", onScroll);
}

/* Opens/closes the mobile navigation sidebar (burger, backdrop, close button, Esc key). */
function initMobileNav() {
  var burger = document.querySelector(".burger");
  var nav = document.querySelector(".nav");
  var backdrop = document.querySelector(".nav__backdrop");
  var closeBtn = document.querySelector(".nav__close");
  if (!burger || !nav) return;

  var isOpen = function () { return nav.classList.contains("nav--open"); };

  var openNav = function () {
    nav.classList.add("nav--open");
    burger.classList.add("burger--open");
    burger.setAttribute("aria-expanded", "true");
    if (backdrop) backdrop.classList.add("is-visible");
    document.body.style.overflow = "hidden";
  };

  var closeNav = function () {
    nav.classList.remove("nav--open");
    burger.classList.remove("burger--open");
    burger.setAttribute("aria-expanded", "false");
    if (backdrop) backdrop.classList.remove("is-visible");
    document.body.style.overflow = "";
  };

  burger.addEventListener("click", function () {
    if (isOpen()) { closeNav(); } else { openNav(); }
  });

  if (closeBtn) closeBtn.addEventListener("click", closeNav);
  if (backdrop) backdrop.addEventListener("click", closeNav);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen()) closeNav();
  });

  // Close the drawer whenever a nav link is tapped.
  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  // Collapse the sidebar automatically if the viewport grows back to desktop width.
  window.addEventListener("resize", function () {
    if (window.innerWidth > 720 && isOpen()) closeNav();
  });
}

/*
 * Poster slider (Home): a lightweight carousel for the marketing poster
 * images. Supports click arrows, dot navigation, drag/swipe, autoplay
 * (paused on hover and disabled for prefers-reduced-motion), and works
 * with more than one slider on a page since it's initialised per
 * [data-slider] element found.
 */
function initPosterSlider() {
  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-slider]").forEach(function (root) {
    var track = root.querySelector("[data-slider-track]");
    if (!track) return;
    var slides = track.children;
    var count = slides.length;
    if (count < 2) return;

    var prevBtn = root.querySelector("[data-slider-prev]");
    var nextBtn = root.querySelector("[data-slider-next]");
    var dotsWrap = root.querySelector("[data-slider-dots]");
    var index = 0;
    var dots = [];
    var timer = null;

    if (dotsWrap) {
      for (var i = 0; i < count; i++) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "slider__dot";
        dot.setAttribute("aria-label", "Nenda tangazo " + (i + 1) + " kati ya " + count);
        dot.addEventListener("click", (function (targetIndex) {
          return function () { goTo(targetIndex); };
        })(i));
        dotsWrap.appendChild(dot);
        dots.push(dot);
      }
    }

    function update() {
      track.style.transform = "translateX(-" + (index * 100) + "%)";
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === index); });
    }

    function goTo(i) {
      index = (i + count) % count;
      update();
      restartAutoplay();
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    if (prevBtn) prevBtn.addEventListener("click", prev);
    if (nextBtn) nextBtn.addEventListener("click", next);

    // Drag / swipe support via Pointer Events (covers touch, mouse, pen).
    var dragStartX = null;
    track.addEventListener("pointerdown", function (e) { dragStartX = e.clientX; });
    track.addEventListener("pointerup", function (e) {
      if (dragStartX === null) return;
      var diff = e.clientX - dragStartX;
      dragStartX = null;
      if (Math.abs(diff) < 40) return;
      if (diff < 0) { next(); } else { prev(); }
    });

    function startAutoplay() {
      if (prefersReducedMotion) return;
      stopAutoplay();
      timer = window.setInterval(next, 5500);
    }
    function stopAutoplay() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }
    function restartAutoplay() { if (timer) startAutoplay(); }

    root.addEventListener("mouseenter", stopAutoplay);
    root.addEventListener("mouseleave", startAutoplay);

    update();
    startAutoplay();
  });
}

/* Expand/collapse behaviour for FAQ items (Contact page). */
function initFaqAccordion() {
  var items = document.querySelectorAll(".faq__item");
  if (!items.length) return;

  items.forEach(function (item) {
    var question = item.querySelector(".faq__question");
    var icon = item.querySelector(".faq__icon");
    if (!question) return;

    question.addEventListener("click", function () {
      var isOpen = item.classList.contains("faq__item--open");

      // Close any other open item so only one is expanded at a time.
      items.forEach(function (other) {
        other.classList.remove("faq__item--open");
        var otherQuestion = other.querySelector(".faq__question");
        var otherIcon = other.querySelector(".faq__icon");
        if (otherQuestion) otherQuestion.setAttribute("aria-expanded", "false");
        if (otherIcon) otherIcon.textContent = "+";
      });

      if (!isOpen) {
        item.classList.add("faq__item--open");
        question.setAttribute("aria-expanded", "true");
        if (icon) icon.textContent = "\u2212";
      }
    });
  });
}

/*
 * Contact form: this is a front-end-only confirmation, since a static
 * GitHub Pages site has no server to receive the submission. To collect
 * real enquiries, point the <form> at a service such as Formspree
 * (https://formspree.io) by setting its action/method attributes, or
 * wire this handler up to your own API endpoint.
 */
function initContactForm() {
  var form = document.querySelector(".contact__form");
  if (!form) return;

  var fields = form.querySelector(".form__fields");
  var CONTACT_EMAIL = "elimikaungaretz@gmail.com";

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var name = form.querySelector("#name");
    var phone = form.querySelector("#phone");
    var need = form.querySelector("#need");
    if (!name.value || !phone.value) return;

    var firstName = name.value.trim().split(" ")[0];
    var success = form.querySelector(".form__success");
    var successName = form.querySelector(".form__success-name");
    if (successName) successName.textContent = firstName;

    /*
     * No backend, no monthly form-service fee: submitting opens the
     * visitor's own email app with a message already addressed to us and
     * every field filled in, so they only need to press Send. This is the
     * simplest, zero-cost way to get real enquiries landing in the inbox
     * while the firm is starting out; it can be swapped for a form API or
     * server endpoint later without changing anything else on the page.
     */
    var subject = "Ombi Jipya la Usajili - Tovuti ya Elimika Ung'are";
    var bodyLines = [
      "Jina / Name: " + name.value.trim(),
      "Namba ya Simu / Phone: " + phone.value.trim(),
      "",
      "Anachohitaji kusajili / What they need to register:",
      (need && need.value.trim()) ? need.value.trim() : "(Hakuna maelezo ya ziada / No further details given)",
      "",
      "-- Limetumwa kutoka fomu ya mawasiliano ya tovuti / Sent from the website contact form --"
    ];
    var mailtoUrl = "mailto:" + CONTACT_EMAIL
      + "?subject=" + encodeURIComponent(subject)
      + "&body=" + encodeURIComponent(bodyLines.join("\r\n"));

    // Ease the fields out first, then swap in the confirmation so the
    // change reads as one motion instead of an instant cut.
    if (fields) fields.classList.add("is-leaving");

    window.setTimeout(function () {
      form.classList.add("is-sent");
      if (success) success.classList.add("is-visible");
      window.location.href = mailtoUrl;
    }, fields ? 220 : 0);
  });
}
