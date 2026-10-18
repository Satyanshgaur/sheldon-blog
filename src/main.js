import { initHeroGraph } from './components/heroGraph.js';
import { initPropagationSim } from './components/propagationSim.js';
import { initEnforcementDiorama } from './components/enforcementDiorama.js';
import { initStructureVsVector } from './components/structureVsVector.js';
import { initBenchmarkViewer } from './components/benchmarkViewer.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize WebGL Three.js Illustrations
  try {
    initHeroGraph('hero-graph-canvas');
  } catch (err) {
    console.error('Failed to init hero graph:', err);
  }

  try {
    initPropagationSim('prop-sim-canvas');
  } catch (err) {
    console.error('Failed to init propagation sim:', err);
  }

  try {
    initEnforcementDiorama('enforcement-canvas');
  } catch (err) {
    console.error('Failed to init enforcement diorama:', err);
  }

  try {
    initStructureVsVector('struct-canvas');
  } catch (err) {
    console.error('Failed to init structure vs vector:', err);
  }

  // Initialize Interactive Benchmark Inspector
  try {
    initBenchmarkViewer('benchmark-inspector');
  } catch (err) {
    console.error('Failed to init benchmark viewer:', err);
  }

  // Nav Bar Surface Adaptation
  const navBar = document.getElementById('main-nav');
  const darkSections = document.querySelectorAll('.surface-dark');

  function updateNavTheme() {
    if (!navBar) return;
    const navRect = navBar.getBoundingClientRect();
    const navCenterY = navRect.top + navRect.height / 2;

    let isOverDark = false;
    darkSections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= navCenterY && rect.bottom >= navCenterY) {
        isOverDark = true;
      }
    });

    if (isOverDark) {
      navBar.classList.add('dark-mode');
    } else {
      navBar.classList.remove('dark-mode');
    }
  }

  // Hover Index Active Section Tracking & Smooth Scroll
  const indexLinks = document.querySelectorAll('.index-link');
  const sections = ['section-01', 'section-02', 'section-03', 'section-04', 'section-05']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  function updateActiveIndex() {
    const scrollPos = window.scrollY + window.innerHeight * 0.35;
    let activeId = 'section-01';

    sections.forEach(sec => {
      if (sec.offsetTop <= scrollPos) {
        activeId = sec.id;
      }
    });

    indexLinks.forEach(link => {
      const target = link.getAttribute('data-target');
      if (target === activeId) {
        link.style.fontWeight = '700';
        link.style.color = 'var(--color-focal)';
      } else {
        link.style.fontWeight = '500';
        link.style.color = '#111111';
      }
    });
  }

  indexLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  window.addEventListener('scroll', () => {
    updateNavTheme();
    updateActiveIndex();
  }, { passive: true });

  updateNavTheme();
  updateActiveIndex();
});
