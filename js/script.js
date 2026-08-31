// Elimika Ung'are — shared site behaviour.
// No build step, no dependencies: include this file on every page.

document.addEventListener("DOMContentLoaded", function () {
  initPageTransitions();
  initHeaderScrollShadow();
  initMobileNav();
  initFaqAccordion();
  initContactForm();
  initBackToTop();
  initScrollReveal();
  initHeroBackgroundRotation();
});

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

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var name = form.querySelector("#name");
    var phone = form.querySelector("#phone");
    if (!name.value || !phone.value) return;

    var firstName = name.value.trim().split(" ")[0];
    var success = form.querySelector(".form__success");
    var successName = form.querySelector(".form__success-name");
    if (successName) successName.textContent = firstName;

    // Ease the fields out first, then swap in the confirmation so the
    // change reads as one motion instead of an instant cut.
    if (fields) fields.classList.add("is-leaving");

    window.setTimeout(function () {
      form.classList.add("is-sent");
      if (success) success.classList.add("is-visible");
    }, fields ? 220 : 0);
  });
}
