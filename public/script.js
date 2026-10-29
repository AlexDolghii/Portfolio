/* script.js for Alex Dolghii's portfolio
   A few small extras. Every word on the page is already in index.html,
   so the site still reads fine if this file never loads.
     1. A "Copy email" button in the Contact section.
     2. The nav link for the section you are reading lights up.
     3. Clicking "whoami" replays the intro.
     4. A short note in the browser console.
     5. The tab title changes while you are on another tab.
     6. The 404 page shows which address was not found.
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

  /* ---------- 3. A "whoami" you can run ----------
     Clicking the whoami label (or pressing Enter or Space on it) replays the
     intro: the name and the lines under it hide, then fade back in one at a
     time, 180ms each. Only set up when the visitor allows motion. Without
     JavaScript, or with reduced motion, whoami stays plain text and the intro
     is simply shown. Nothing runs until someone asks for it. */

  function setupWhoami() {
    const motionOK = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const hero = document.querySelector(".hero");
    const label = hero ? hero.querySelector(".hero__prompt") : null;
    if (!hero || !label) return;

    const lines = [".hero__name", ".hero__title", ".hero__firm", ".hero__edu", ".hero__links"]
      .map((selector) => hero.querySelector(selector))
      .filter(Boolean);
    if (lines.length === 0) return;

    const STEP = 140; // ms between lines
    const FADE = 180; // ms each line takes to appear (matches styles.css)
    const word = label.textContent.trim(); // "whoami"

    let button = null;
    let timers = [];

    // Put everything back to fully shown, right now.
    function finish() {
      timers.forEach(clearTimeout);
      timers = [];
      hero.classList.remove("is-running");
      lines.forEach((line) => line.classList.remove("is-shown"));
    }

    function run() {
      // Clicking again mid-replay starts it over cleanly.
      finish();
      hero.classList.add("is-running");
      void hero.offsetWidth; // apply the hidden state before the first line fades in

      lines.forEach((line, index) => {
        timers.push(setTimeout(() => line.classList.add("is-shown"), STEP * (index + 1)));
      });
      timers.push(setTimeout(finish, STEP * lines.length + FADE + STEP));
    }

    // Turn the plain "whoami" label into a real button.
    function enable() {
      if (button) return;
      button = document.createElement("button");
      button.type = "button";
      button.className = "hero__run";
      button.textContent = word;
      // Starts with the visible word, and says the effect is only visual,
      // so screen-reader users know not to expect anything announced.
      button.setAttribute("aria-label", word + ": replay the intro animation");
      button.addEventListener("click", run);

      label.textContent = "";
      label.append(button);
      label.removeAttribute("aria-hidden"); // a real control now, so screen readers should find it
      lines.forEach((line) => line.classList.add("hero__reveal"));
    }

    // Turn it back into plain, decorative text (used when reduced motion is switched on).
    function disable() {
      if (!button) return;
      finish();
      label.textContent = word;
      label.setAttribute("aria-hidden", "true");
      lines.forEach((line) => line.classList.remove("hero__reveal"));
      button = null;
    }

    // If focus moves to anything else in the intro (for example Tab to the Email
    // link) while the replay is still running, show everything at once, so no
    // one ever lands on a link they cannot see.
    hero.addEventListener("focusin", (event) => {
      if (button && event.target !== button) finish();
    });

    // Follow the visitor's motion setting, even if it changes while the page is open.
    motionOK.addEventListener("change", () => {
      if (motionOK.matches) enable();
      else disable();
    });

    if (motionOK.matches) enable();
  }

  /* ---------- 4. A note for people who open the browser console ---------- */

  function greetConsole() {
    const big = "font: 700 16px/1.5 'JetBrains Mono', monospace; color: #8FED9B; background: #07110B; padding: 4px 8px;";
    // Its own dark background too, so it stays readable in a light-theme console.
    const small = "font: 400 12px/1.5 'JetBrains Mono', monospace; color: #B2CFB8; background: #07110B; padding: 2px 8px;";
    console.log("%c$ whoami\n%cAlex Dolghii · Junior Cybersecurity Analyst", big, small);
    console.log(
      "%cPlain HTML, CSS and JavaScript. No frameworks, no build step.\nThe code: https://github.com/AlexDolghii/Portfolio",
      small
    );
  }

  /* ---------- 5. The tab title notices when you switch away ----------
     "fg" is the terminal command that brings a background job back to the
     front. The title goes back to normal the moment the tab is visible again. */

  function setupTabTitle() {
    const original = document.title;
    const away = "$ fg · Alex Dolghii";
    let leaving = false;

    // When the visitor actually leaves the page (link, back button, closing the tab),
    // the browser saves the title into history. "pagehide" fires first, so put the
    // real title back and skip the swap; history then never says "$ fg".
    window.addEventListener("pagehide", () => {
      leaving = true;
      document.title = original;
    });
    window.addEventListener("pageshow", () => {
      leaving = false;
      document.title = original;
    });

    document.addEventListener("visibilitychange", () => {
      document.title = document.hidden && !leaving ? away : original;
    });
  }

  /* ---------- 6. 404 page: show the address that was not found ----------
     Only runs on 404.html, which has an element with id="missing-path".
     textContent (never innerHTML), so a strange address can't inject anything. */

  function setupNotFound() {
    const slot = document.getElementById("missing-path");
    if (!slot) return;
    slot.textContent = window.location.pathname;
  }

  setupCopyEmail();
  setupNav();
  setupWhoami();
  setupNotFound();
  setupTabTitle();
  greetConsole();
})();
