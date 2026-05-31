document.addEventListener('DOMContentLoaded', function () {
  var title    = document.querySelector('.hero-title');
  var lead     = document.querySelector('.hero-lead');
  var twEl     = document.getElementById('typewriter');

  var TYPEWRITER_TEXT = 'Kurslar, topshiriqlar, baholash va xabarnomalarni bitta zamonaviy platformada boshqaring.';
  var CHAR_DELAY      = 22;   
  var TITLE_DURATION  = 750;  
  var TITLE_DELAY     = 0;   

  var animate = (window.Motion && window.Motion.animate)
    || (window.motion && window.motion.animate)
    || null;


  function startTypewriter() {
    if (!twEl) return;

    var i = 0;
    function typeNext() {
      if (i < TYPEWRITER_TEXT.length) {
        twEl.textContent += TYPEWRITER_TEXT[i];
        i++;
        setTimeout(typeNext, CHAR_DELAY);
      }
    }
    typeNext();
  }

  if (!animate) {
    if (title) {
      title.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      title.style.opacity    = '1';
      title.style.transform  = 'translateY(0)';
    }
    if (lead) {
      lead.style.opacity = '1';
    }
    startTypewriter();
    return;
  }

  if (title) {
    animate(
      title,
      { opacity: [0, 1], transform: ['translateY(-20px)', 'translateY(0px)'] },
      { duration: TITLE_DURATION / 1000, easing: [0.22, 0.9, 0.38, 1] }
    );
  }

  if (lead) {
    lead.style.opacity = '1'; 
  }

  var typewriterStart = TITLE_DELAY + TITLE_DURATION + 100;
  setTimeout(startTypewriter, typewriterStart);
});
