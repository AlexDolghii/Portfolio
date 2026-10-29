/* script.js for Alex Dolghii's portfolio
   Two small extras. Every word on the page is already in index.html,
   so the site still reads fine if this file never loads.
     1. A "Copy email" button in the Contact section.
     2. The nav link for the section you are reading lights up.
   Nothing here moves anything when the page loads. */
(() => {
  "use strict";

  /* ---------- 1. "Copy email" button ---------- */

  // Older way to copy: put the text in an invisible box, select it, copy it,
  // then give keyboard focus back to whatever had it (the button).
  function copyWithSelection(text) {
    const returnFocusTo = document.activeElement;
    const box = document.createElement("textarea");
    box.value = text;
    box.setAttribute("readonly", "");
    box.setAttribute("aria-hidden", "true");
    box.className = "copy-buffer";
    document.body.append(box);
    box.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }

    box.remove();
    if (returnFocusTo && typeof returnFocusTo.focus === "function") {
      returnFocusTo.focus();
    }
    return copied;
  }

  // Try the modern clipboard first. If it is missing or says no, try the older way.
  // Resolves to true when the text really was copied.
  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        // Fall through to the older way below.
      }
    }
    return copyWithSelection(text);
  }

  // Last resort: select the address on the page so it can be copied by hand.
  function selectText(element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function setupCopyEmail() {
    const button = document.querySelector(".copy[data-copy]");
    if (!button) return;

    const status = document.getElementById("copy-status");
    const row = button.closest(".contact__value");
    const link = row ? row.querySelector('a[href^="mailto:"]') : null;
    const idleLabel = button.textContent;
    let resetTimer;

    // The button starts hidden in the HTML, so people without JavaScript never see it.
    button.hidden = false;

    // Show a short result on the button and read a message out to screen readers,
    // then put the button back after 2 seconds.
    function report(label, message) {
      button.textContent = label;

      // Empty the status first, then fill it on the next frame,
      // so screen readers announce a second press too.
      if (status) {
        status.textContent = "";
        requestAnimationFrame(() => {
          status.textContent = message;
        });
      }

      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        button.textContent = idleLabel;
        if (status) status.textContent = "";
      }, 2000);
    }

    button.addEventListener("click", async () => {
      const copied = await copyText(button.getAttribute("data-copy"));

      if (copied) {
        report("Copied", "Copied");
        return;
      }

      // Copying did not work: say so, and select the address so it can be copied by hand.
      if (link) {
        selectText(link);
        report("Not copied", "Not copied. Email address selected");
      } else {
        report("Not copied", "Not copied");
      }
    });
  }

  /* ---------- 2. Highlight the section you are reading ----------
     Only a colour and an underline change. Nothing moves. */

  function setupNav() {
    const header = document.querySelector(".titlebar");
    const pairs = Array.from(document.querySelectorAll('.nav a[href^="#"]'))
      .map((link) => [link, document.getElementById(link.hash.slice(1))])
      .filter((pair) => pair[1]);

    if (pairs.length === 0) return;

    let current = null;
    let picked = null; // the link someone clicked, kept lit until they scroll by hand
    let queued = false;

    function setCurrent(pair) {
      if (pair === current) return;
      if (current) current[0].removeAttribute("aria-current");
      if (pair) pair[0].setAttribute("aria-current", "location");
      current = pair;
    }

    function update() {
      queued = false;

      // A clicked link stays lit, even when the page cannot scroll its section to the top.
      if (picked) {
        setCurrent(picked);
        return;
      }

      // A section counts as "being read" once its top passes a line a quarter
      // of the way down the screen (below the title bar when it is sticky).
      const page = document.documentElement;
      const screen = window.innerHeight;
      const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
      let line = headerBottom + screen * 0.25;

      // The last sections are too short to ever reach that line, so over the
      // last stretch of scrolling the line slides down to the bottom of the
      // screen. That way Education, then Contact, each get their turn.
      const left = page.scrollHeight - screen - window.scrollY;
      if (left < screen * 0.75) {
        line += screen * 0.75 - Math.max(0, left);
      }

      let active = null; // the intro is not in the nav, so nothing is lit up there
      for (const pair of pairs) {
        if (pair[1].getBoundingClientRect().top <= line) active = pair;
      }

      // At the very bottom, the last section always wins.
      if (left <= 2) {
        active = pairs[pairs.length - 1];
      }

      setCurrent(active);
    }

    function queueUpdate() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }

    pairs.forEach((pair) => {
      pair[0].addEventListener("click", () => {
        picked = pair;
        setCurrent(pair);
      });
    });

    // Scrolling by hand, or pressing or clicking anything, lets the page decide again.
    // These all fire before a nav link's own click, so a nav click still wins.
    const release = () => {
      picked = null;
    };
    ["wheel", "touchstart", "pointerdown", "keydown"].forEach((type) => {
      window.addEventListener(type, release, { passive: true, capture: true });
    });

    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    update();
  }

  setupCopyEmail();
  setupNav();
})();
