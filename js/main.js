// LANC Jewels — общие скрипты сайта

function initNav(){
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if(toggle && links){
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }
}

function initSplash(){
  const splash = document.getElementById('splash');
  if(!splash) return;

  // generate sparkles
  const field = splash.querySelector('.sparkle-field');
  if(field){
    const count = 26;
    for(let i=0;i<count;i++){
      const s = document.createElement('div');
      const isDiamond = Math.random() > 0.6;
      s.className = 'sparkle' + (isDiamond ? ' diamond' : '');
      const size = 3 + Math.random()*7;
      s.style.width = size+'px';
      s.style.height = size+'px';
      s.style.left = Math.random()*100+'%';
      s.style.top = Math.random()*100+'%';
      s.style.animationDelay = (Math.random()*3)+'s';
      s.style.animationDuration = (1.8 + Math.random()*2.2)+'s';
      field.appendChild(s);
    }
  }

  const seen = sessionStorage.getItem('lancSplashSeen');
  const finish = () => {
    splash.classList.add('hide');
    sessionStorage.setItem('lancSplashSeen','1');
    document.body.style.overflow = '';
  };

  if(seen){
    splash.classList.add('hide');
    return;
  }

  document.body.style.overflow = 'hidden';
  const timer = setTimeout(finish, 4200);
  const skipBtn = document.getElementById('splash-skip');
  const enterBtn = document.getElementById('splash-enter');
  [skipBtn, enterBtn].forEach(btn => {
    if(btn) btn.addEventListener('click', () => { clearTimeout(timer); finish(); });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initSplash();
});
