// ===== Config =====
// Paste the URL of your deployed Cloudflare Worker here (see worker/README.md).
// Until this is set, the form will show a friendly error instead of failing silently.
const APPLICATION_ENDPOINT = "https://asf-cargo-relay.afzaljon0411.workers.dev";

// ===== Footer year =====
document.querySelectorAll('#year').forEach(el => el.textContent = new Date().getFullYear());

// ===== Scroll-reveal animations =====
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReducedMotion) {
  document.documentElement.classList.add('js-anim');
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }
}

// ===== Header scroll state + scroll progress bar =====
const siteHeader = document.querySelector('header.site');
const progressBar = document.getElementById('scrollProgress');
function onScroll() {
  if (siteHeader) siteHeader.classList.toggle('scrolled', window.scrollY > 10);
  if (progressBar) {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    progressBar.style.width = (scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0) + '%';
  }
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ===== Mobile nav =====
const burger = document.getElementById('burgerBtn');
const navLinks = document.getElementById('navLinks');
if (burger) {
  burger.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
}

// ===== Application form =====
const form = document.getElementById('applyForm');
if (form) {
  const statusBox = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!APPLICATION_ENDPOINT || APPLICATION_ENDPOINT === "PASTE_YOUR_WORKER_URL_HERE") {
      showStatus('err', 'This form isn\'t connected yet. See worker/README.md to finish setup.');
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const res = await fetch(APPLICATION_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error('Request failed');

      form.reset();
      showStatus('ok', "Application received — we'll be in touch soon. Thank you!");
    } catch (err) {
      showStatus('err', 'Something went wrong sending your application. Please call us at (412) 588-1575 instead.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Application';
    }
  });

  function showStatus(type, msg) {
    statusBox.textContent = msg;
    statusBox.className = 'form-status show ' + type;
    statusBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
