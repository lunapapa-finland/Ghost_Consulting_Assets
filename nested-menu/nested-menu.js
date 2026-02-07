(() => {
  // IMPORTANT: no "g" flag here (avoids lastIndex state bugs)
  const PARENT_RE = /\s*\[?\s*has-child\s*\]?\s*/i;
  const CHILD_RE  = /\s*\[?\s*child\s*\]?\s*/i;

  function getAnchorText(li) {
    const a = li.querySelector(":scope > a");
    return (a?.textContent || li.textContent || "").trim();
  }

  function cleanAnchorText(li) {
    const a = li.querySelector(":scope > a");
    if (!a) return;
    a.textContent = a.textContent
      .replace(/\s*\[?\s*has-child\s*\]?\s*/ig, " ")
      .replace(/\s*\[?\s*child\s*\]?\s*/ig, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isParent(li) {
    return PARENT_RE.test(getAnchorText(li));
  }

  function isChild(li) {
    return CHILD_RE.test(getAnchorText(li));
  }

  function buildNestedMenu(navEl) {
    if (!navEl) return;

    const ul = navEl.querySelector("ul.nav") || navEl.querySelector("ul");
    if (!ul) return;

    navEl.classList.add("nested-menu-container");

    // Store original once
    if (!navEl.dataset.nestedMenuOriginal) {
      navEl.dataset.nestedMenuOriginal = navEl.innerHTML;
    }

    if (navEl.dataset.nestedMenuBuilt === "1") return;

    const topLis = Array.from(ul.querySelectorAll(":scope > li"));

    // 1) Create submenu for each parent
    topLis.forEach((li) => {
      if (!isParent(li)) return;

      li.classList.add("menu-item-has-child");
      cleanAnchorText(li);

      const a = li.querySelector(":scope > a");
      if (a) {
        a.setAttribute("aria-haspopup", "true");
        a.setAttribute("aria-expanded", "false");
      }

      const submenu = document.createElement("ul");
      submenu.className = "nested-menu";
      li.appendChild(submenu);

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "nested-menu-toggle";
      toggle.setAttribute("aria-label", "Toggle submenu");
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = `<span aria-hidden="true">▾</span>`;
      if (a) a.insertAdjacentElement("afterend", toggle);
    });

    // 2) Move child items under the most recent parent
    const refreshedLis = Array.from(ul.querySelectorAll(":scope > li"));
    let currentSubmenu = null;

    refreshedLis.forEach((li) => {
      if (li.classList.contains("menu-item-has-child")) {
        currentSubmenu = li.querySelector(":scope > ul.nested-menu");
        return;
      }
      if (currentSubmenu && isChild(li)) {
        cleanAnchorText(li);
        currentSubmenu.appendChild(li);
      }
    });

    function closeAll(exceptLi = null) {
      ul.querySelectorAll(":scope > li.menu-item-has-child.is-nested-open").forEach((li) => {
        if (exceptLi && li === exceptLi) return;
        li.classList.remove("is-nested-open");
        li.querySelector(":scope > a")?.setAttribute("aria-expanded", "false");
        li.querySelector(":scope > .nested-menu-toggle")?.setAttribute("aria-expanded", "false");
      });
    }

    function toggleLi(li) {
      const willOpen = !li.classList.contains("is-nested-open");
      if (willOpen) closeAll(li);
      li.classList.toggle("is-nested-open", willOpen);
      li.querySelector(":scope > a")?.setAttribute("aria-expanded", willOpen ? "true" : "false");
      li.querySelector(":scope > .nested-menu-toggle")?.setAttribute("aria-expanded", willOpen ? "true" : "false");
    }

    ul.querySelectorAll(".nested-menu-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const li = btn.closest("li.menu-item-has-child");
        if (!li) return;
        toggleLi(li);
      });
    });

    document.addEventListener("click", (e) => {
      if (!navEl.contains(e.target)) closeAll();
    });

    navEl.dataset.nestedMenuBuilt = "1";
    navEl.classList.add("nested-menu-loaded");

    // KEY: tell Edition to recalc overflow after nesting
    window.dispatchEvent(new Event("resize"));
  }

  function init() {
    const nav = document.querySelector("nav.gh-head-menu") || document.querySelector("nav");
    if (!nav) return;

    // Rebuild from original each time (Edition may re-render header)
    if (nav.dataset.nestedMenuOriginal) {
      nav.dataset.nestedMenuBuilt = "0";
      nav.innerHTML = nav.dataset.nestedMenuOriginal;
    }

    buildNestedMenu(nav);
  }

  // Run early (before Edition "..." overflow settles)
  document.addEventListener("DOMContentLoaded", init);

  // Re-init on resize with debounce
  let t = null;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(init, 150);
  });
})();
