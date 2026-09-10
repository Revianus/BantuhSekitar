document.querySelectorAll('nav').forEach(nav => {
  if (nav.querySelector('.menu-btn')) return;
  const brand = nav.querySelector('.brand');
  const links = nav.querySelector(':scope > div');
  if (!brand || !links) return;
  if (nav.querySelector('.nav-row')) return;
  const row = document.createElement('div');
  row.className = 'nav-row';
  const btn = document.createElement('button');
  btn.className = 'menu-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Buka menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span></span>';
  links.classList.add('nav-links');
  row.append(brand, btn);
  nav.prepend(row);
  brand.remove();
  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  links.querySelectorAll('a, button').forEach(a => a.addEventListener('click', () => {
    if (innerWidth <= 820) {
      links.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  }));
});
