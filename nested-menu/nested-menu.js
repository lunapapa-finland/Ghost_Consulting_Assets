(() => {
  const PARENT_RE = /\[?\s*has-child\s*\]?/i;
  const CHILD_RE  = /\[?\s*child\s*\]?/i;

  function cleanText(s) {
    return (s || "")
      .replace(/\[?\s*has-child\s*\]?/ig, "")
      .replace(/\[?\s*child\s*\]?/ig, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function initOnNav(nav) {
    if (!nav || nav.dataset.lpNestedDone === "1") return;

    const ul = nav.querySelector("ul.nav") || nav.querySelector("ul");
    if (!ul) return;

    nav.classList.add("nested-menu-container");

    // Only top-level <li> should be processed as Ghost nav is flat
    const topLis = Array.from(ul.querySelectorAll(":scope > li"));

    // 1) Create submenu for each parent
    topLis.forEach((li) => {
      const a = li.querySelector(":scope > a");
      const label = (a?.textContent || "").trim();

      if (!PARENT_RE.test(label)) return;

      li.classList.add("menu-item-has-child");

      if (a) {
        a.textContent = cleanText(a.textContent);
        a.setAttribute("aria-haspopup", "true");
        a.setAttribute("aria-expanded", "false");
      }

      // submenu container
      const submenu = document.createElement("ul");
      submenu.className = "nested-menu";
      li.appendChild(submenu);

      // toggle button (separate from link)
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nested-menu-toggle";
      btn.setAttribute("aria-label", "Toggle submenu");
      btn.setAttribute("aria-expanded", "false");
      btn.innerHTML = `<span aria-hidden="true">▾</span>`;

      if (a) a.insertAdjacentElement("afterend", btn);

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const open = !li.classList.contains("is-nested-open");
        li.classList.toggle("is-nested-open", open);
        a?.setAttribute("aria-expanded", open ? "true" : "false");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });

    // 2) Move children under the latest parent submenu
    // Re-query because we appended submenus/toggles
    const lisNow = Array.from(ul.querySelectorAll(":scope > li"));
    let currentSubmenu = null;

    lisNow.forEach((li) => {
      if (li.classList.contains("menu-item-has-child")) {
        currentSubmenu = li.querySelector(":scope > ul.nested-menu");
        return;
      }

      const a = li.querySelector(":scope > a");
      const label = (a?.textContent || "").trim();

      if (currentSubmenu && CHILD_RE.test(label)) {
        if (a) a.textContent = cleanText(a.textContent);
        currentSubmenu.appendChild(li); // move it under parent
      }
    });

    // Click outside closes (helps mobile)
    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target)) {
        nav.querySelectorAll("li.menu-item-has-child.is-nested-open")
          .forEach((x) => x.classList.remove("is-nested-open"));
      }
    });

    nav.dataset.lpNestedDone = "1";
  }

  // Run when Edition inserts header/nav
  const mo = new MutationObserver(() => {
    const nav = document.querySelector("nav.gh-head-menu");
    if (nav) {
      initOnNav(nav);
      mo.disconnect();
    }
  });

  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
