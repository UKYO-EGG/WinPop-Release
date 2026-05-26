(function () {
  var video = document.querySelector(".home-video");
  if (!video || !window.fetch || !window.URL || !window.URL.createObjectURL) {
    return;
  }

  var source = video.querySelector("source");
  var initialSource = source && source.getAttribute("src");
  var sourceUrl = initialSource || video.currentSrc || video.getAttribute("src");
  if (!sourceUrl) {
    return;
  }

  var absoluteUrl;
  try {
    absoluteUrl = new URL(sourceUrl, document.baseURI).href;
  } catch (error) {
    return;
  }

  var fallbackStarted = false;
  var objectUrl = null;

  function hasSeekableDuration() {
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      return true;
    }

    for (var index = 0; index < video.seekable.length; index += 1) {
      if (video.seekable.end(index) >= video.duration - 0.75) {
        return true;
      }
    }

    return false;
  }

  function revokeObjectUrl() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  }

  function enableBlobSeekFallback() {
    if (fallbackStarted || video.dataset.seekFallbackReady === "true") {
      return;
    }

    fallbackStarted = true;
    var resumeAt = video.currentTime || 0;

    fetch(absoluteUrl, { cache: "force-cache" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("video fetch failed");
        }
        return response.blob();
      })
      .then(function (blob) {
        revokeObjectUrl();
        objectUrl = URL.createObjectURL(blob);
        video.dataset.seekFallbackReady = "true";
        video.pause();
        if (source) {
          source.removeAttribute("src");
        }
        video.src = objectUrl;
        video.load();
        video.addEventListener(
          "loadedmetadata",
          function () {
            if (resumeAt > 0 && Number.isFinite(video.duration)) {
              video.currentTime = Math.min(resumeAt, Math.max(0, video.duration - 0.5));
            }
          },
          { once: true }
        );
      })
      .catch(function () {
        video.dataset.seekFallbackReady = "error";
      });
  }

  function checkSeekability() {
    window.setTimeout(function () {
      if (!hasSeekableDuration()) {
        enableBlobSeekFallback();
      }
    }, 600);
  }

  if (video.readyState >= 1) {
    checkSeekability();
  } else {
    video.addEventListener("loadedmetadata", checkSeekability, { once: true });
  }

  window.addEventListener("pagehide", revokeObjectUrl, { once: true });
})();

(function () {
  var modal = document.getElementById("download-modal");
  if (!modal) {
    return;
  }

  var panel = modal.querySelector(".download-modal__panel");
  var confirmLink = document.getElementById("download-confirm");
  var closeControls = modal.querySelectorAll("[data-modal-close]");
  var triggers = document.querySelectorAll(".js-download-link");
  var lastFocused = null;

  function focusableElements() {
    return panel.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
  }

  function openModal(event) {
    var url = this.getAttribute("data-download-url") || this.getAttribute("href");
    if (!url) {
      return;
    }

    event.preventDefault();
    lastFocused = document.activeElement;
    confirmLink.setAttribute("href", url);
    modal.hidden = false;
    document.body.classList.add("modal-open");
    panel.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  function trapFocus(event) {
    if (modal.hidden || event.key !== "Tab") {
      return;
    }

    var items = Array.prototype.slice.call(focusableElements());
    if (items.length === 0) {
      event.preventDefault();
      return;
    }

    var first = items[0];
    var last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  Array.prototype.forEach.call(triggers, function (trigger) {
    trigger.addEventListener("click", openModal);
  });

  Array.prototype.forEach.call(closeControls, function (control) {
    control.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.hidden) {
      closeModal();
      return;
    }
    trapFocus(event);
  });
})();

(function () {
  var header = document.querySelector(".site-header");
  var revealTargets = document.querySelectorAll(
    [
      ".home-hero__copy",
      ".home-video-shell",
      ".home-strip article",
      ".home-section__heading",
      ".home-card",
      ".home-compare__copy",
      ".home-checklist span",
      ".home-note",
      ".home-links a",
      ".page-hero-copy",
      ".transfer-visual",
      ".info-card",
      ".rich-panel",
      ".article-summary",
      ".article-content",
      ".content-block",
      ".page-cta-panel",
      ".data-note",
      ".release-overview",
      ".release-note",
      ".download-step",
      ".method-item",
      ".trust-item",
      ".quick-step",
      ".stat-note",
      ".release-card",
      ".release-feature",
      ".page-hero .statement",
      ".page-hero .article-panel",
      ".section-heading",
      ".feature-demo-panel",
      ".demo-point",
      ".card",
      ".statement:not(.plain)",
      ".article-panel",
      ".step",
      ".faq-item",
      ".stats-card",
      ".release-item"
    ].join(",")
  );

  function updateHeader() {
    if (!header) {
      return;
    }
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  if (revealTargets.length === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  document.documentElement.classList.add("reveal-ready");

  Array.prototype.forEach.call(revealTargets, function (item, index) {
    item.classList.add("reveal-item");
    item.style.setProperty("--reveal-delay", Math.min(index % 6, 5) * 55 + "ms");
  });

  if (!("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(revealTargets, function (item) {
      item.classList.add("is-visible");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.12
    }
  );

  Array.prototype.forEach.call(revealTargets, function (item) {
    observer.observe(item);
  });
})();
