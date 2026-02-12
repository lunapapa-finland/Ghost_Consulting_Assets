var html = document.documentElement;
var body = document.body;
var timeout;
var st = 0;

cover();
featured();
pagination(false);

/**
 * Nested navigation for Ghost (ConsultingTemplate)
 * - Builds submenu structure using [has-child] and [child] markers in nav labels
 * - Disables default nav overflow collapsing ("..." button)
 */
(function () {
    const PARENT_REPLACE = /\s*\[?\s*has-child\s*\]?\s*/ig;
    const CHILD_REPLACE = /\s*\[?\s*child\s*\]?\s*/ig;
    const PARENT_TEST = /\[?\s*has-child\s*\]?/i;
    const CHILD_TEST = /\[?\s*child\s*\]?/i;

    function getAnchorText(li) {
        const a = li.querySelector(':scope > a');
        return (a?.textContent || li.textContent || '').trim();
    }

    function cleanAnchorText(li) {
        const a = li.querySelector(':scope > a');
        if (!a) return;
        a.textContent = a.textContent
            .replace(PARENT_REPLACE, ' ')
            .replace(CHILD_REPLACE, ' ')
            .replace(/\s+/g, ' ')
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
        const ul = navEl.querySelector('ul.nav') || navEl.querySelector('ul');
        if (!ul) return;

        navEl.classList.add('nested-menu-container');

        if (!navEl.dataset.nestedMenuOriginal) {
            navEl.dataset.nestedMenuOriginal = navEl.innerHTML;
        }

        if (navEl.dataset.nestedMenuBuilt === '1') return;

        const topLis = Array.from(ul.querySelectorAll(':scope > li'));

        topLis.forEach((li) => {
            if (!isParent(li)) return;

            li.classList.add('menu-item-has-child');
            cleanAnchorText(li);

            const a = li.querySelector(':scope > a');
            if (a) {
                a.setAttribute('aria-haspopup', 'true');
                a.setAttribute('aria-expanded', 'false');
            }

            const submenu = document.createElement('ul');
            submenu.className = 'nested-menu';

            const submenuId = `nested-menu-${Math.random().toString(16).slice(2)}`;
            submenu.id = submenuId;
            if (a) a.setAttribute('aria-controls', submenuId);

            li.appendChild(submenu);

            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'nested-menu-toggle';
            toggle.setAttribute('aria-label', 'Toggle submenu');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.innerHTML = '<span aria-hidden="true">▾</span>';
            if (a) a.insertAdjacentElement('afterend', toggle);
        });

        const refreshedLis = Array.from(ul.querySelectorAll(':scope > li'));
        let currentSubmenu = null;

        refreshedLis.forEach((li) => {
            if (li.classList.contains('menu-item-has-child')) {
                currentSubmenu = li.querySelector(':scope > ul.nested-menu');
                return;
            }

            if (currentSubmenu && isChild(li)) {
                li.classList.add('nested-menu-item');
                cleanAnchorText(li);
                currentSubmenu.appendChild(li);
            }
        });

        function closeAll(exceptLi = null) {
            ul.querySelectorAll(':scope > li.menu-item-has-child.is-nested-open').forEach((li) => {
                if (exceptLi && li === exceptLi) return;
                li.classList.remove('is-nested-open');
                const a = li.querySelector(':scope > a');
                const t = li.querySelector(':scope > .nested-menu-toggle');
                if (a) a.setAttribute('aria-expanded', 'false');
                if (t) t.setAttribute('aria-expanded', 'false');
            });
        }

        function toggleLi(li) {
            const willOpen = !li.classList.contains('is-nested-open');
            if (willOpen) closeAll(li);
            li.classList.toggle('is-nested-open', willOpen);

            const a = li.querySelector(':scope > a');
            const t = li.querySelector(':scope > .nested-menu-toggle');
            if (a) a.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            if (t) t.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        }

        ul.querySelectorAll('.nested-menu-toggle').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const li = btn.closest('li.menu-item-has-child');
                if (!li) return;
                toggleLi(li);
            });
        });

        document.addEventListener('click', (e) => {
            if (!navEl.contains(e.target)) closeAll();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeAll();
        });

        navEl.dataset.nestedMenuBuilt = '1';
        navEl.classList.add('nested-menu-loaded');
    }

    function restoreCollapsedItems(nav) {
        const moreToggle = nav.querySelector('.nav-more-toggle');
        if (!moreToggle) return;

        const dropdown = moreToggle.querySelector('.gh-dropdown');
        const navList = nav.querySelector('ul.nav') || nav.querySelector('ul');
        if (dropdown && navList) {
            const movedItems = Array.from(dropdown.children);
            movedItems.forEach((li) => navList.appendChild(li));
        }

        moreToggle.remove();
    }

    function init() {
        const nav = document.querySelector('nav.gh-head-menu') || document.querySelector('nav');
        if (!nav) return;

        restoreCollapsedItems(nav);

        if (nav.dataset.nestedMenuOriginal) {
            nav.dataset.nestedMenuBuilt = '0';
            nav.innerHTML = nav.dataset.nestedMenuOriginal;
            restoreCollapsedItems(nav);
        }

        buildNestedMenu(nav);
    }

    document.addEventListener('DOMContentLoaded', init);
    window.addEventListener('load', init);

    let t = null;
    window.addEventListener('resize', () => {
        clearTimeout(t);
        t = setTimeout(init, 150);
    });
})();

window.addEventListener('scroll', function () {
    'use strict';
    if (body.classList.contains('home-template') && body.classList.contains('with-full-cover') && !document.querySelector('.cover').classList.contains('half')) {
        if (timeout) {
            window.cancelAnimationFrame(timeout);
        }
        timeout = window.requestAnimationFrame(portalButton);
    }
});

if (document.querySelector('.cover') && document.querySelector('.cover').classList.contains('half')) {
    body.classList.add('portal-visible');
}

function portalButton() {
    'use strict';
    st = window.scrollY;

    if (st > 300) {
        body.classList.add('portal-visible');
    } else {
        body.classList.remove('portal-visible');
    }
}

function cover() {
    'use strict';
    var cover = document.querySelector('.cover');
    if (!cover) return;

    imagesLoaded(cover, function () {
        cover.classList.remove('image-loading');
    });

    document.querySelector('.cover-arrow').addEventListener('click', function () {
        var element = cover.nextElementSibling;
        element.scrollIntoView({behavior: 'smooth', block: 'start'});
    });
}

function featured() {
    'use strict';
    var feed = document.querySelector('.featured-feed');
    if (!feed) return;

    tns({
        container: feed,
        controlsText: [
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M20.547 22.107L14.44 16l6.107-6.12L18.667 8l-8 8 8 8 1.88-1.893z"></path></svg>',
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M11.453 22.107L17.56 16l-6.107-6.12L13.333 8l8 8-8 8-1.88-1.893z"></path></svg>',
        ],
        gutter: 30,
        loop: false,
        nav: false,
        responsive: {
            0: {
                items: 1,
            },
            768: {
                items: 2,
            },
            992: {
                items: 3,
            },
        },
    });
}
