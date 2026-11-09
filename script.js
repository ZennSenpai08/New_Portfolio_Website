/* Progressive enhancements. Content, navigation and disclosures work without JS. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  menu.hidden = false;
  const closeMenu = () => {
    nav.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
  };
  menu.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    menu.setAttribute('aria-expanded', String(isOpen));
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('click', (event) => {
    if (!nav.contains(event.target) && !menu.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      closeMenu();
      menu.focus();
    }
  });
  const mobile = window.matchMedia('(max-width: 520px)');
  mobile.addEventListener('change', closeMenu);

  const copyButton = document.querySelector('#copy-email');
  const feedback = document.querySelector('#copy-status');
  const email = document.querySelector('.email-link').textContent.trim();
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    copyButton.disabled = true;
    feedback.textContent = '';
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(email);
      feedback.textContent = 'Email copied to clipboard.';
    } catch {
      feedback.textContent = 'Could not copy. Select the email address above to copy it, or click it to email me.';
    } finally {
      copyButton.disabled = false;
    }
  });
  document.querySelector('#year').textContent = String(new Date().getFullYear());

  // Animate on entry without hiding content in CSS: it stays readable if JS fails.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const animations = new Set();
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        revealObserver.unobserve(target);
        if (reducedMotion.matches || !target.animate || target.contains(document.activeElement)) return;
        const animation = target.animate([
          { opacity: 0.35, transform: 'translateY(22px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 650, easing: 'cubic-bezier(.22, 1, .36, 1)' });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.section-heading, .featured-project, .secondary-project, .github-work, .about-grid, .skill-row, .contact-grid').forEach(element => revealObserver.observe(element));
    reducedMotion.addEventListener('change', () => {
      if (!reducedMotion.matches) return;
      revealObserver.disconnect();
      animations.forEach(animation => animation.cancel());
      animations.clear();
    });
  }

  if ('IntersectionObserver' in window) {
    const sections = document.querySelectorAll('main section[id]');
    const links = nav.querySelectorAll('a');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          if (link.getAttribute('href') === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    sections.forEach((section) => observer.observe(section));
  }
})();
