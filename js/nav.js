document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('nav');
  if (!nav) return;
  const menuDiv = nav.querySelector('div');
  if (!menuDiv || nav.querySelector('.menu-btn')) return;

  const btn = document.createElement('button');
  btn.className = 'menu-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Menu');
  btn.innerHTML = '<span></span>';
  nav.appendChild(btn);

  btn.addEventListener('click', () => {
    menuDiv.classList.toggle('open');
  });

  menuDiv.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menuDiv.classList.remove('open');
    });
  });
});
