import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

const VideoContext = createContext();

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideo must be used within VideoProvider');
  }
  return context;
};

export const VideoProvider = ({ children }) => {
  // Estado principal
  const [sourceType, setSourceType] = useState(() => {
    const saved = localStorage.getItem('videoSourceType');
    return saved || 'upload';
  });
  
  const [videoUrl, setVideoUrl] = useState(() => {
    const saved = localStorage.getItem('videoUrl');
    return saved || null;
  });
  
  const [videoFile, setVideoFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [detection, setDetection] = useState(null);
  const [detectedPerson, setDetectedPerson] = useState(null);
  const [message, setMessage] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(() => {
    const saved = localStorage.getItem('webcamEnabled');
    return saved === 'true';
  });
  const [screenshot, setScreenshot] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [savedVideoBlob, setSavedVideoBlob] = useState(null);

  // Refs
  const videoRef = useRef(null);
  const webcamRef = useRef(null);
  const detectionInterval = useRef(null);

  // Persistir estado en localStorage
  useEffect(() => {
    localStorage.setItem('videoSourceType', sourceType);
  }, [sourceType]);

  useEffect(() => {
    if (videoUrl) {
      localStorage.setItem('videoUrl', videoUrl);
    } else {
      localStorage.removeItem('videoUrl');
    }
  }, [videoUrl]);

  useEffect(() => {
    localStorage.setItem('webcamEnabled', webcamEnabled);
  }, [webcamEnabled]);

  // Guardar el blob del video cuando se carga
  useEffect(() => {
    if (videoFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const blob = new Blob([reader.result], { type: videoFile.type });
        setSavedVideoBlob(blob);
        localStorage.setItem('savedVideoBlob', reader.result);
      };
      reader.readAsDataURL(videoFile);
    }
  }, [videoFile]);

  // Recuperar video guardado al iniciar
  useEffect(() => {
    const savedBlob = localStorage.getItem('savedVideoBlob');
    if (savedBlob && !videoUrl) {
      fetch(savedBlob)
        .then(res => res.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
        });
    }
  }, []);

  // Guardar tiempo del video
  useEffect(() => {
    if (videoRef.current && isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime(videoRef.current.currentTime);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  // Funciones para manejar el video
  const handleVideoUpload = (file) => {
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoFile(file);
      setWebcamEnabled(false);
      setDetection(null);
      setMessage({ type: 'success', text: 'Video cargado correctamente' });
      setTimeout(() => setMessage(null), 3000);
      
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
      return true;
    }
    return false;
  };

  const startWebcam = () => {
    setWebcamEnabled(true);
    setVideoUrl(null);
    setMessage({ type: 'info', text: 'Cámara web activada' });
    setTimeout(() => setMessage(null), 2000);
  };

  const stopWebcam = () => {
    setWebcamEnabled(false);
    setDetection(null);
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }
    setMessage({ type: 'info', text: 'Cámara web desactivada' });
    setTimeout(() => setMessage(null), 2000);
  };

  const captureScreenshot = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setScreenshot(imageSrc);
      localStorage.setItem('lastScreenshot', imageSrc);
      setMessage({ type: 'success', text: 'Captura de pantalla guardada' });
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSourceChange = (newSource) => {
    if (newSource !== null) {
      setSourceType(newSource);
      if (newSource === 'upload') {
        setWebcamEnabled(false);
      } else {
        setVideoUrl(null);
      }
      setDetection(null);
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    }
  };

  const simulateDetection = () => {
    setIsDetecting(true);
    setTimeout(() => {
      const random = Math.random();
      const personas = ['Ana García', 'Carlos López', 'María Rodríguez', 'Juan Pérez'];
      if (random > 0.6) {
        const persona = personas[Math.floor(Math.random() * personas.length)];
        setDetection('green');
        setDetectedPerson(persona);
        // Guardar detección en localStorage para logs
        const newLog = {
          id: Date.now(),
          name: persona,
          timestamp: new Date().toISOString(),
          status: 'reconocido',
          confidence: Math.floor(Math.random() * 30) + 70
        };
        const existingLogs = JSON.parse(localStorage.getItem('detectionLogs') || '[]');
        localStorage.setItem('detectionLogs', JSON.stringify([newLog, ...existingLogs].slice(0, 50)));
        setMessage({ type: 'success', text: `✅ ${persona} detectado correctamente` });
      } else if (random > 0.3) {
        setDetection('green');
        setDetectedPerson('Persona no registrada');
        setMessage({ type: 'warning', text: '⚠️ Persona detectada pero no registrada' });
      } else {
        setDetection('red');
        setDetectedPerson(null);
        setMessage({ type: 'error', text: '❌ No se detectaron personas' });
      }
      setIsDetecting(false);
      setTimeout(() => setMessage(null), 2000);
    }, 1000);
  };

  // Efecto para la detección continua
  useEffect(() => {
    if ((isPlaying || webcamEnabled) && (videoUrl || webcamEnabled)) {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
      detectionInterval.current = setInterval(simulateDetection, 4000);
    } else if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }
    
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, [isPlaying, webcamEnabled, videoUrl]);

  // Recuperar screenshot guardado
  useEffect(() => {
    const savedScreenshot = localStorage.getItem('lastScreenshot');
    if (savedScreenshot) {
      setScreenshot(savedScreenshot);
    }
  }, []);

  const value = {
    // Estado
    sourceType,
    videoUrl,
    videoFile,
    isPlaying,
    detection,
    detectedPerson,
    message,
    isDetecting,
    webcamEnabled,
    screenshot,
    currentTime,
    videoRef,
    webcamRef,
    savedVideoBlob,
    
    // Funciones
    setSourceType: handleSourceChange,
    setVideoUrl,
    setVideoFile,
    setIsPlaying,
    setDetection,
    setDetectedPerson,
    setMessage,
    setIsDetecting,
    setWebcamEnabled,
    setScreenshot,
    setCurrentTime,
    
    // Acciones
    handleVideoUpload,
    startWebcam,
    stopWebcam,
    captureScreenshot,
    togglePlayPause,
    handleSourceChange,
    simulateDetection,
  };

  return (
    <VideoContext.Provider value={value}>
      {children}
    </VideoContext.Provider>
  );
};