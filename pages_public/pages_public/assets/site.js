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
