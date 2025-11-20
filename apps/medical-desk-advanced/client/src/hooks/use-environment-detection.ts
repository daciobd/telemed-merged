import { useState, useEffect } from 'react';

interface EnvironmentState {
  isNightMode: boolean;
  isMobileView: boolean;
  ambientLight: 'bright' | 'dim' | 'dark';
  currentShift: 'diurno' | 'noturno' | 'plantao';
  batteryLevel?: number;
  isLowPowerMode: boolean;
}

export function useEnvironmentDetection() {
  const [environment, setEnvironment] = useState<EnvironmentState>({
    isNightMode: false,
    isMobileView: false,
    ambientLight: 'bright',
    currentShift: 'diurno',
    isLowPowerMode: false
  });
  
  const [manualOverride, setManualOverride] = useState<{
    nightMode?: boolean;
    shift?: string;
  }>({});

  useEffect(() => {
    // DETECTION 1: Mobile device detection
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768 || 
                      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      return isMobile;
    };

    // DETECTION 2: Ambient light detection (if available)
    const detectAmbientLight = async () => {
      if ('AmbientLightSensor' in window) {
        try {
          // @ts-ignore - AmbientLightSensor is experimental
          const sensor = new AmbientLightSensor();
          sensor.addEventListener('reading', () => {
            const illuminance = sensor.illuminance;
            let ambientLight: 'bright' | 'dim' | 'dark';
            
            if (illuminance > 100) ambientLight = 'bright';
            else if (illuminance > 10) ambientLight = 'dim';
            else ambientLight = 'dark';
            
            setEnvironment(prev => ({ ...prev, ambientLight }));
          });
          sensor.start();
        } catch (error) {
          console.log('Ambient light sensor not available, using time-based detection');
          return detectByTime();
        }
      } else {
        return detectByTime();
      }
    };

    // DETECTION 3: Time-based shift detection (fallback)
    const detectByTime = () => {
      const hour = new Date().getHours();
      let currentShift: 'diurno' | 'noturno' | 'plantao';
      let ambientLight: 'bright' | 'dim' | 'dark';
      
      if (hour >= 6 && hour < 18) {
        currentShift = 'diurno';
        ambientLight = 'bright';
      } else if (hour >= 18 && hour < 22) {
        currentShift = 'plantao';
        ambientLight = 'dim';
      } else {
        currentShift = 'noturno';
        ambientLight = 'dark';
      }
      
      return { currentShift, ambientLight };
    };

    // DETECTION 4: Battery level and power mode (mobile)
    const detectBatteryStatus = async () => {
      if ('getBattery' in navigator) {
        try {
          // @ts-ignore - getBattery is experimental
          const battery = await navigator.getBattery();
          const batteryLevel = Math.round(battery.level * 100);
          const isLowPowerMode = batteryLevel < 20 && !battery.charging;
          
          setEnvironment(prev => ({ 
            ...prev, 
            batteryLevel,
            isLowPowerMode 
          }));
        } catch (error) {
          console.log('Battery API not available');
        }
      }
    };

    // DETECTION 5: Page Visibility (minimize processing when hidden)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Reduce processing when app is in background
        setEnvironment(prev => ({ ...prev, isLowPowerMode: true }));
      } else {
        // Resume normal processing
        setTimeout(() => {
          setEnvironment(prev => ({ ...prev, isLowPowerMode: false }));
        }, 1000);
      }
    };

    // Initial detection
    const isMobileView = checkMobile();
    const timeBasedDetection = detectByTime();
    
    setEnvironment(prev => ({
      ...prev,
      isMobileView,
      currentShift: manualOverride.shift as any || timeBasedDetection.currentShift,
      ambientLight: timeBasedDetection.ambientLight,
      isNightMode: manualOverride.nightMode ?? 
                   (timeBasedDetection.currentShift === 'noturno' || 
                    timeBasedDetection.ambientLight === 'dark')
    }));

    // Set up listeners
    window.addEventListener('resize', () => {
      setEnvironment(prev => ({ ...prev, isMobileView: checkMobile() }));
    });
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Start ambient light detection
    detectAmbientLight();
    detectBatteryStatus();
    
    // Update shift every hour
    const shiftInterval = setInterval(() => {
      if (!manualOverride.shift) {
        const timeDetection = detectByTime();
        setEnvironment(prev => ({
          ...prev,
          currentShift: timeDetection.currentShift,
          ambientLight: timeDetection.ambientLight,
          isNightMode: manualOverride.nightMode ?? 
                       (timeDetection.currentShift === 'noturno' || 
                        timeDetection.ambientLight === 'dark')
        }));
      }
    }, 3600000); // Every hour

    return () => {
      window.removeEventListener('resize', () => {});
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(shiftInterval);
    };
  }, [manualOverride]);

  // Manual override functions for clinical staff
  const activateNightMode = (manual: boolean = true) => {
    setManualOverride(prev => ({ ...prev, nightMode: manual }));
    setEnvironment(prev => ({ ...prev, isNightMode: manual }));
  };

  const setShift = (shift: 'diurno' | 'noturno' | 'plantao') => {
    setManualOverride(prev => ({ ...prev, shift }));
    setEnvironment(prev => ({ 
      ...prev, 
      currentShift: shift,
      isNightMode: manualOverride.nightMode ?? (shift === 'noturno')
    }));
  };

  const resetToAutomatic = () => {
    setManualOverride({});
    // Trigger re-detection
    const timeDetection = detectByTime();
    setEnvironment(prev => ({
      ...prev,
      currentShift: timeDetection.currentShift,
      ambientLight: timeDetection.ambientLight,
      isNightMode: timeDetection.currentShift === 'noturno' || 
                   timeDetection.ambientLight === 'dark'
    }));
  };

  const detectByTime = () => {
    const hour = new Date().getHours();
    let currentShift: 'diurno' | 'noturno' | 'plantao';
    let ambientLight: 'bright' | 'dim' | 'dark';
    
    if (hour >= 6 && hour < 18) {
      currentShift = 'diurno';
      ambientLight = 'bright';
    } else if (hour >= 18 && hour < 22) {
      currentShift = 'plantao';
      ambientLight = 'dim';
    } else {
      currentShift = 'noturno';
      ambientLight = 'dark';
    }
    
    return { currentShift, ambientLight };
  };

  return {
    environment,
    activateNightMode,
    setShift,
    resetToAutomatic,
    isManualOverride: Object.keys(manualOverride).length > 0
  };
}