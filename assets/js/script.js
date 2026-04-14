'use strict';

const elementToggleFunc = function (elem) {
  if (elem) {
    elem.classList.toggle("active");
  }
};

const loadSharedSidebar = async function () {
  const placeholder = document.querySelector("[data-sidebar-include]");

  if (!placeholder) {
    return;
  }

  const sidebarPath = placeholder.getAttribute("data-sidebar-include");

  if (!sidebarPath) {
    return;
  }

  try {
    const response = await fetch(sidebarPath);
    if (!response.ok) {
      throw new Error(`Failed to load sidebar partial: ${response.status}`);
    }

    const sidebarMarkup = await response.text();
    placeholder.outerHTML = sidebarMarkup;
  } catch (error) {
    console.error(error);
  }
};

const initSidebar = function () {
  const sidebar = document.querySelector("[data-sidebar]");
  const sidebarBtn = document.querySelector("[data-sidebar-btn]");

  if (sidebar && sidebarBtn && sidebarBtn.dataset.bound !== "true") {
    sidebarBtn.addEventListener("click", function () {
      elementToggleFunc(sidebar);
    });
    sidebarBtn.dataset.bound = "true";
  }
};

const initTestimonialsModal = function () {
  const testimonialsItems = document.querySelectorAll("[data-testimonials-item]");
  const modalContainer = document.querySelector("[data-modal-container]");
  const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
  const overlay = document.querySelector("[data-overlay]");
  const modalImg = document.querySelector("[data-modal-img]");
  const modalTitle = document.querySelector("[data-modal-title]");
  const modalText = document.querySelector("[data-modal-text]");

  const toggleModal = function () {
    if (modalContainer && overlay) {
      modalContainer.classList.toggle("active");
      overlay.classList.toggle("active");
    }
  };

  for (let i = 0; i < testimonialsItems.length; i++) {
    if (modalImg && modalTitle && modalText) {
      testimonialsItems[i].addEventListener("click", function () {
        const avatar = this.querySelector("[data-testimonials-avatar]");
        const title = this.querySelector("[data-testimonials-title]");
        const text = this.querySelector("[data-testimonials-text]");

        if (!avatar || !title || !text) {
          return;
        }

        modalImg.src = avatar.src;
        modalImg.alt = avatar.alt;
        modalTitle.innerHTML = title.innerHTML;
        modalText.innerHTML = text.innerHTML;
        toggleModal();
      });
    }
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", toggleModal);
  }

  if (overlay) {
    overlay.addEventListener("click", toggleModal);
  }
};

const initPortfolioFilters = function () {
  const select = document.querySelector("[data-select]");
  const selectItems = document.querySelectorAll("[data-select-item]");
  const selectValue = document.querySelector("[data-select-value]");
  const filterButtons = document.querySelectorAll("[data-filter-btn]");
  const filterItems = document.querySelectorAll("[data-filter-item]");

  if (!select && filterButtons.length === 0) {
    return;
  }

  const filterFunc = function (selectedValue) {
    for (let i = 0; i < filterItems.length; i++) {
      if (selectedValue === "all" || selectedValue === filterItems[i].dataset.category) {
        filterItems[i].classList.add("active");
      } else {
        filterItems[i].classList.remove("active");
      }
    }
  };

  if (select) {
    select.addEventListener("click", function () {
      elementToggleFunc(this);
    });
  }

  for (let i = 0; i < selectItems.length; i++) {
    selectItems[i].addEventListener("click", function () {
      const selectedValue = this.innerText.toLowerCase();

      if (selectValue) {
        selectValue.innerText = this.innerText;
      }

      elementToggleFunc(select);
      filterFunc(selectedValue);
    });
  }

  let lastClickedBtn = filterButtons[0];

  for (let i = 0; i < filterButtons.length; i++) {
    filterButtons[i].addEventListener("click", function () {
      const selectedValue = this.innerText.toLowerCase();

      if (selectValue) {
        selectValue.innerText = this.innerText;
      }

      filterFunc(selectedValue);

      if (lastClickedBtn) {
        lastClickedBtn.classList.remove("active");
      }

      this.classList.add("active");
      lastClickedBtn = this;
    });
  }
};

const initContactForm = function () {
  const form = document.querySelector("[data-form]");
  const formInputs = document.querySelectorAll("[data-form-input]");
  const formBtn = document.querySelector("[data-form-btn]");

  const toggleFormButtonState = function () {
    if (!form || !formBtn) {
      return;
    }

    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }
  };

  for (let i = 0; i < formInputs.length; i++) {
    formInputs[i].addEventListener("input", function () {
      toggleFormButtonState();
    });
  }

  if (form) {
    toggleFormButtonState();
  }
};

const syncHeadMetadata = function (sourceDoc) {
  const selectors = [
    'meta[name="description"]',
    'meta[name="robots"]',
    'meta[name="author"]',
    'meta[property="og:type"]',
    'meta[property="og:locale"]',
    'meta[property="og:title"]',
    'meta[property="og:description"]',
    'meta[property="og:image"]',
    'meta[name="twitter:card"]',
    'meta[name="twitter:title"]',
    'meta[name="twitter:description"]',
    'meta[name="twitter:image"]',
    'link[rel="canonical"]'
  ];

  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i];
    const incoming = sourceDoc.head.querySelector(selector);
    const current = document.head.querySelector(selector);

    if (incoming) {
      const clone = incoming.cloneNode(true);

      if (current) {
        current.replaceWith(clone);
      } else {
        document.head.appendChild(clone);
      }
    } else if (current) {
      current.remove();
    }
  }

  const currentSchemas = document.head.querySelectorAll('script[type="application/ld+json"][data-seo-schema]');
  for (let i = 0; i < currentSchemas.length; i++) {
    currentSchemas[i].remove();
  }

  const incomingSchemas = sourceDoc.head.querySelectorAll('script[type="application/ld+json"][data-seo-schema]');
  for (let i = 0; i < incomingSchemas.length; i++) {
    document.head.appendChild(incomingSchemas[i].cloneNode(true));
  }
};

const hydrateDynamicPage = function () {
  initTestimonialsModal();
  initPortfolioFilters();
  initContactForm();
};

let latestNavigationRequest = 0;

const navigateMainContent = async function (targetHref, pushHistory) {
  const currentMainContent = document.querySelector(".main-content");
  const requestId = ++latestNavigationRequest;

  if (!currentMainContent) {
    window.location.href = targetHref;
    return;
  }

  currentMainContent.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(targetHref, {
      headers: { "X-Requested-With": "portfolio-nav" }
    });

    if (!response.ok) {
      throw new Error(`Failed to navigate: ${response.status}`);
    }

    const markup = await response.text();
    const parsed = new DOMParser().parseFromString(markup, "text/html");
    const nextMainContent = parsed.querySelector(".main-content");

    if (requestId !== latestNavigationRequest) {
      return;
    }

    if (!nextMainContent) {
      throw new Error("Target page is missing .main-content");
    }

    currentMainContent.replaceWith(nextMainContent);

    if (parsed.title) {
      document.title = parsed.title;
    }

    syncHeadMetadata(parsed);

    if (pushHistory) {
      const destination = new URL(targetHref, window.location.href);
      const historyPath = `${destination.pathname}${destination.search}${destination.hash}`;
      window.history.pushState({}, "", historyPath);
    }

    window.scrollTo(0, 0);
    hydrateDynamicPage();
  } catch (error) {
    console.error(error);
    window.location.href = targetHref;
  }
};

const initNavbarNavigation = function () {
  if (document.body.dataset.navBound === "true") {
    return;
  }

  document.body.dataset.navBound = "true";

  document.addEventListener("click", function (event) {
    const link = event.target.closest("a.navbar-link");

    if (!link) {
      return;
    }

    if (event.defaultPrevented || event.button !== 0) {
      return;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const href = link.getAttribute("href");

    if (!href || href.startsWith("#")) {
      return;
    }

    if (link.target && link.target !== "_self") {
      return;
    }

    const destination = new URL(link.href, window.location.href);
    const current = new URL(window.location.href);

    if (destination.origin !== current.origin) {
      return;
    }

    if (
      destination.pathname === current.pathname &&
      destination.search === current.search &&
      destination.hash === current.hash
    ) {
      return;
    }

    event.preventDefault();
    navigateMainContent(destination.href, true);
  });

  window.addEventListener("popstate", function () {
    navigateMainContent(window.location.href, false);
  });
};

const initApp = async function () {
  await loadSharedSidebar();
  initSidebar();
  hydrateDynamicPage();
  initNavbarNavigation();
};

initApp();
