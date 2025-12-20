'use client';

import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  hasTouchSupport: boolean;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    userAgent: '',
    screenWidth: 1920,
    screenHeight: 1080,
    orientation: 'landscape',
    hasTouchSupport: false
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      if (typeof window === 'undefined') return;

      const userAgent = navigator.userAgent || '';
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const orientation = screenWidth < screenHeight ? 'portrait' : 'landscape';
      const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Mobile detection
      const isMobile = screenWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      // Tablet detection (larger than mobile but has touch)
      const isTablet = hasTouchSupport && screenWidth > 768 && screenWidth <= 1024;
      
      // Desktop detection
      const isDesktop = !isMobile && !isTablet;

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        userAgent,
        screenWidth,
        screenHeight,
        orientation,
        hasTouchSupport
      });
    };

    // Initial detection
    updateDeviceInfo();

    // Listen for resize events
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}