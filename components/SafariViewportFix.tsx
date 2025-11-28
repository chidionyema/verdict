'use client';

import { useEffect } from 'react';

export default function SafariViewportFix() {
  useEffect(() => {
    // Set dynamic viewport height for Safari mobile
    function setAppHeight() {
      const vh = window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${vh}px`);
      document.documentElement.style.setProperty('--app-height-dynamic', `${vh}px`);
    }
    
    // Set initial height
    setAppHeight();
    
    // Update on resize and orientation change
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', setAppHeight);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', setAppHeight);
      window.removeEventListener('orientationchange', setAppHeight);
    };
  }, []);
  
  return null;
}