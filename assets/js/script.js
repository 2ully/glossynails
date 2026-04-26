/* GlossyNails — main script */

/* ── NAV scroll effect ── */
const navWrapper = document.querySelector('.nav-wrapper');
window.addEventListener('scroll', () => {
  navWrapper.classList.toggle('scrolled', window.scrollY > 40);
});

/* ── Hamburger mobile menu ── */
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
let menuOpen = false;

hamburger.addEventListener('click', () => {
  menuOpen = !menuOpen;
  mobileMenu.style.display = menuOpen ? 'block' : 'none';
  hamburger.classList.toggle('open', menuOpen);
});

mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    menuOpen = false;
    mobileMenu.style.display = 'none';
  });
});

/* ── Gallery carousel ── */
const filterBtns  = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');
const galleryTrack = document.getElementById('galleryTrack');

let rafId        = null;
let autoScrollOn = true;

function startAutoScroll() {
  autoScrollOn = true;
  function tick() {
    if (!autoScrollOn) return;
    galleryTrack.scrollLeft += 0.7;
    if (galleryTrack.scrollLeft >= galleryTrack.scrollWidth - galleryTrack.clientWidth - 1) {
      galleryTrack.scrollLeft = 0;
    }
    rafId = requestAnimationFrame(tick);
  }
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(tick);
}

function stopAutoScroll() {
  autoScrollOn = false;
  cancelAnimationFrame(rafId);
}

/* Pause auto-scroll on hover (desktop) */
galleryTrack.addEventListener('mouseenter', () => { if (autoScrollOn) cancelAnimationFrame(rafId); });
galleryTrack.addEventListener('mouseleave', () => { if (autoScrollOn) startAutoScroll(); });

/* Touch / drag to scroll (works in both modes) */
let dragStart = null;
galleryTrack.addEventListener('touchstart', e => { dragStart = e.touches[0].clientX; }, { passive: true });
galleryTrack.addEventListener('touchmove', e => {
  if (dragStart === null) return;
  const dx = dragStart - e.touches[0].clientX;
  galleryTrack.scrollLeft += dx;
  dragStart = e.touches[0].clientX;
}, { passive: true });
galleryTrack.addEventListener('touchend', () => { dragStart = null; });

/* Mouse drag */
let mouseDown = false, startX, startScroll;
galleryTrack.addEventListener('mousedown', e => {
  mouseDown = true; startX = e.pageX; startScroll = galleryTrack.scrollLeft;
  galleryTrack.classList.add('dragging');
});
window.addEventListener('mouseup', () => { mouseDown = false; galleryTrack.classList.remove('dragging'); });
galleryTrack.addEventListener('mousemove', e => {
  if (!mouseDown) return;
  galleryTrack.scrollLeft = startScroll - (e.pageX - startX);
});

/* Filter buttons */
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;

    galleryItems.forEach(item => {
      const match = filter === 'all' || item.dataset.cat === filter;
      item.classList.toggle('hidden', !match);
    });

    galleryTrack.scrollLeft = 0;
    if (filter === 'all') startAutoScroll();
    else stopAutoScroll();
  });
});

/* Start auto-scroll once layout is painted */
window.addEventListener('load', () => setTimeout(startAutoScroll, 100));

/* ── Testimonials slider ── */
const track = document.getElementById('testimonialTrack');
if (track) {
  const cards    = track.querySelectorAll('.testi-card');
  const dotsWrap = document.getElementById('testiDots');
  const prevBtn  = document.getElementById('testiPrev');
  const nextBtn  = document.getElementById('testiNext');

  let current = 0;
  const getVisible = () => window.innerWidth <= 768 ? 1 : window.innerWidth <= 1024 ? 2 : 3;

  function buildDots() {
    dotsWrap.innerHTML = '';
    const pages = Math.ceil(cards.length / getVisible());
    for (let i = 0; i < pages; i++) {
      const d = document.createElement('button');
      d.className = 'testi-dot' + (i === Math.floor(current / getVisible()) ? ' active' : '');
      d.addEventListener('click', () => goTo(i * getVisible()));
      dotsWrap.appendChild(d);
    }
  }

  function goTo(idx) {
    const v = getVisible();
    const max = cards.length - v;
    current = Math.max(0, Math.min(idx, max));
    const cardWidth = cards[0].offsetWidth + 24;
    track.style.transform = `translateX(-${current * cardWidth}px)`;
    updateDots();
  }

  function updateDots() {
    const v = getVisible();
    dotsWrap.querySelectorAll('.testi-dot').forEach((d, i) => {
      d.classList.toggle('active', i === Math.floor(current / v));
    });
  }

  prevBtn.addEventListener('click', () => goTo(current - getVisible()));
  nextBtn.addEventListener('click', () => goTo(current + getVisible()));

  buildDots();
  window.addEventListener('resize', () => { buildDots(); goTo(0); });

  let autoSlide = setInterval(() => goTo(current + getVisible()), 5000);
  [prevBtn, nextBtn].forEach(b => b.addEventListener('click', () => {
    clearInterval(autoSlide);
    autoSlide = setInterval(() => goTo(current + getVisible()), 5000);
  }));
}


/* ── Booking form ── */
const bookingForm = document.getElementById('bookingForm');
const formSuccess = document.getElementById('formSuccess');

const dateInput = document.getElementById('date');
dateInput.min = new Date().toISOString().split('T')[0];

bookingForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!bookingForm.checkValidity()) { bookingForm.reportValidity(); return; }

  const btn = bookingForm.querySelector('button[type="submit"]');
  btn.textContent = 'Booking…';
  btn.disabled = true;

  const data = {
    fname:   document.getElementById('fname').value,
    lname:   document.getElementById('lname').value,
    email:   document.getElementById('email').value,
    phone:   document.getElementById('phone').value,
    service: document.getElementById('service').value,
    date:    document.getElementById('date').value,
    time:    document.getElementById('time').value,
    notes:   document.getElementById('notes').value,
  };

  try {
    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      bookingForm.style.opacity = '.4';
      bookingForm.style.pointerEvents = 'none';
      formSuccess.classList.add('show');
      btn.textContent = 'Confirmed!';
    } else {
      btn.textContent = 'Something went wrong. Try again.';
      btn.disabled = false;
    }
  } catch {
    btn.textContent = 'Something went wrong. Try again.';
    btn.disabled = false;
  }
});

/* ── Newsletter form ── */
const newsletterForm = document.getElementById('newsletterForm');
newsletterForm.addEventListener('submit', e => {
  e.preventDefault();
  const input = newsletterForm.querySelector('input');
  const btn   = newsletterForm.querySelector('button');
  btn.textContent = '✓';
  btn.style.background = '#4caf50';
  input.value = '';
  input.placeholder = 'Thanks for subscribing!';
  input.disabled = true;
  btn.disabled = true;
});

/* ── Scroll reveal ── */
const reveals = document.querySelectorAll(
  '.service-card, .section-header, .about-text, .about-images, .testi-card, .booking-info, .booking-form, .contact-info, .contact-map'
);

reveals.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 60);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

reveals.forEach(el => observer.observe(el));

/* ── Active nav link on scroll ── */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => {
        a.style.color = a.getAttribute('href') === '#' + entry.target.id
          ? 'var(--rose)'
          : '';
      });
    }
  });
}, { threshold: 0.5 });

sections.forEach(s => sectionObserver.observe(s));
