(() => {
  // ===== Lunapapa Nested Menu (Edition) — stable version =====
  // Key fix: NEVER use /g regex with .test() (stateful lastIndex). Use separate TEST regex.

  // For replace (global is OK)
  const PARENT_REPLACE = /\s*\[?\s*has-child\s*\]?\s*/ig;
  const CHILD_REPLACE  = /\s*\[?\s*child\s*\]?\s*/ig;

  // For test (IMPORTANT: no "g")
  const PARENT_TEST = /\[?\s*has-child\s*\]?/i;
  const CHILD_TEST  = /\[?\s*child\s*\]?/i;

  function getAnchorText(li) {
    const a = li.querySelector(":scope > a");
    return (a?.textContent || li.textContent || "").trim();
  }

  function cleanAnchorText(li) {
    const a = li.querySelector(":scope > a");
    if (!a) return;
    a.textContent = a.textContent
      .replace(PARENT_REPLACE, " ")
      .replace(CHILD_REPLACE, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isParent(li) {
    return PARENT_TEST.test(getAnchorText(li));
  }

  function isChild(li) {
    return CHILD_TEST.test(getAnchorText(li));
  }

  function buildNestedMenu(navEl) {
    if (!navEl) return;

    const ul = navEl.querySelector("ul.nav") || navEl.querySelector("ul");
    if (!ul) return;

    navEl.classList.add("nested-menu-container");

    // Store original HTML once
    if (!navEl.dataset.nestedMenuOriginal) {
      navEl.dataset.nestedMenuOriginal = navEl.innerHTML;
    }

    // Avoid double init
    if (navEl.dataset.nestedMenuBuilt === "1") return;

    const topLis = Array.from(ul.querySelectorAll(":scope > li"));

    // 1) Create submenu UL for each parent
    topLis.forEach((li) => {
      if (!isParent(li)) return;

      li.classList.add("menu-item-has-child");
      cleanAnchorText(li);

      const a = li.querySelector(":scope > a");
      if (a) {
        a.setAttribute("aria-haspopup", "true");
        a.setAttribute("aria-expanded", "false");
      }

      // submenu
      const submenu = document.createElement("ul");
      submenu.className = "nested-menu";

      const submenuId = `nested-menu-${Math.random().toString(16).slice(2)}`;
      submenu.id = submenuId;
      if (a) a.setAttribute("aria-controls", submenuId);

      li.appendChild(submenu);

      // toggle button (separate from link)
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "nested-menu-toggle";
      toggle.setAttribute("aria-label", "Toggle submenu");
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = `<span aria-hidden="true">▾</span>`;
      if (a) a.insertAdjacentElement("afterend", toggle);
    });

    // 2) Move child items under the most recent parent submenu
    const refreshedLis = Array.from(ul.querySelectorAll(":scope > li"));
    let currentSubmenu = null;

    refreshedLis.forEach((li) => {
      if (li.classList.contains("menu-item-has-child")) {
        currentSubmenu = li.querySelector(":scope > ul.nested-menu");
        return;
      }

      if (currentSubmenu && isChild(li)) {
        li.classList.add("nested-menu-item");
        cleanAnchorText(li);
        currentSubmenu.appendChild(li);
      }
    });

    function closeAll(exceptLi = null) {
      ul.querySelectorAll(":scope > li.menu-item-has-child.is-nested-open").forEach((li) => {
        if (exceptLi && li === exceptLi) return;
        li.classList.remove("is-nested-open");
        const a = li.querySelector(":scope > a");
        const t = li.querySelector(":scope > .nested-menu-toggle");
        if (a) a.setAttribute("aria-expanded", "false");
        if (t) t.setAttribute("aria-expanded", "false");
      });
    }

    function toggleLi(li) {
      const willOpen = !li.classList.contains("is-nested-open");
      if (willOpen) closeAll(li);
      li.classList.toggle("is-nested-open", willOpen);

      const a = li.querySelector(":scope > a");
      const t = li.querySelector(":scope > .nested-menu-toggle");
      if (a) a.setAttribute("aria-expanded", willOpen ? "true" : "false");
      if (t) t.setAttribute("aria-expanded", willOpen ? "true" : "false");
    }

    // Toggle button click
    ul.querySelectorAll(".nested-menu-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const li = btn.closest("li.menu-item-has-child");
        if (!li) return;
        toggleLi(li);
      });
    });

    // Click outside closes
    document.addEventListener("click", (e) => {
      if (!navEl.contains(e.target)) closeAll();
    });

    // ESC closes
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });

    navEl.dataset.nestedMenuBuilt = "1";
    navEl.classList.add("nested-menu-loaded");
  }

  function init() {
    const nav = document.querySelector("nav.gh-head-menu") || document.querySelector("nav");
    if (!nav) return;

    // Rebuild from original each init (Edition header can re-layout)
    if (nav.dataset.nestedMenuOriginal) {
      nav.dataset.nestedMenuBuilt = "0";
      nav.innerHTML = nav.dataset.nestedMenuOriginal;
    }

    buildNestedMenu(nav);
  }

  // Run early + on full load
  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", init);

  // Rebuild on resize (Edition can reflow header)
  let t = null;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(init, 150);
  });
})();