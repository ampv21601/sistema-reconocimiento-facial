import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';

const VideoContext = createContext();

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideo must be used within VideoProvider');
  }
  return context;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  const [detectionConfidence, setDetectionConfidence] = useState(0); // ← AÑADIR ESTA LÍNEA
  const [message, setMessage] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(() => {
    const saved = localStorage.getItem('webcamEnabled');
    return saved === 'true';
  });
  const [screenshot, setScreenshot] = useState(null);
  
  const videoRef = useRef(null);
  const webcamRef = useRef(null);
  const detectionInterval = useRef(null);
  const activePersonsRef = useRef(new Map());
  const detectionInFlightRef = useRef(false);
  const EXIT_GRACE_PERIOD_MS = 30_000;

  // Función para capturar frame del video
  const captureFrame = () => {
    let source = null;
    
    if (sourceType === 'upload' && videoRef.current && videoRef.current.readyState >= 2) {
      source = videoRef.current;
    } else if (sourceType === 'webcam' && webcamRef.current && webcamRef.current.video.readyState === 4) {
      source = webcamRef.current.video;
    }
    
    if (source) {
      const maxWidth = 640;
      let width = source.videoWidth || 640;
      let height = source.videoHeight || 480;

      if (width > maxWidth) {
        const scale = maxWidth / width;
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.7);
    }
    return null;
  };

  // Función para enviar frame al backend y detectar
  const sendFrameForDetection = async () => {
    if (detectionInFlightRef.current) {
      return;
    }

    if ((sourceType === 'upload' && (!isPlaying || !videoUrl)) || (sourceType === 'webcam' && !webcamEnabled)) {
      return;
    }
    
    const frameData = captureFrame();
    if (!frameData) return;
    
    detectionInFlightRef.current = true;
    setIsDetecting(true);
    
    try {
      const formData = new FormData();
      formData.append('image', frameData);
      
      const response = await axios.post(`${API_URL}/api/detect-frame`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });
      
      const detections = Array.isArray(response.data.detections) ? response.data.detections : (response.data.detected ? [response.data] : []);

      if (detections.length > 0) {
        const nowMs = Date.now();
        const now = new Date(nowMs).toISOString();
        const existingLogs = JSON.parse(localStorage.getItem('detectionLogs') || '[]');
        const nextLogs = [...existingLogs];
        const currentActive = new Map(activePersonsRef.current);
        const seenKeys = new Set();

        detections.forEach((detectionItem) => {
          const personName = detectionItem.person_name || 'Persona no registrada';
          const personKey = detectionItem.person_id ? `person:${detectionItem.person_id}` : `name:${personName}`;
          seenKeys.add(personKey);

          if (!currentActive.has(personKey)) {
            const newLog = {
              id: Date.now() + Math.random(),
              name: personName,
              timestamp: now,
              eventType: 'entrada',
              status: detectionItem.recognized ? 'reconocido' : 'no reconocido',
              confidence: detectionItem.confidence || 0,
            };
            nextLogs.unshift(newLog);
          }

          currentActive.set(personKey, { name: personName, lastSeenAt: nowMs });
        });

        for (const [personKey, value] of currentActive.entries()) {
          if (!seenKeys.has(personKey)) {
            const timeSinceLastSeen = nowMs - (value.lastSeenAt || nowMs);
            if (timeSinceLastSeen >= EXIT_GRACE_PERIOD_MS) {
              const exitLog = {
                id: Date.now() + Math.random(),
                name: value.name,
                timestamp: now,
                eventType: 'salida',
                status: 'salida',
                confidence: 0,
              };
              nextLogs.unshift(exitLog);
              currentActive.delete(personKey);
            }
          }
        }

        activePersonsRef.current = currentActive;
        localStorage.setItem('detectionLogs', JSON.stringify(nextLogs.slice(0, 100)));

        const overlayNames = detections.map((item) => item.person_name || 'Persona no registrada').join(', ');
        setDetection('green');
        setDetectedPerson(overlayNames);
        setDetectionConfidence(detections[0]?.confidence || 0);
        
        // setMessage({ 
        //   type: detections.some((item) => item.recognized) ? 'success' : 'warning', 
        //   text: `✅ ${overlayNames}`
        // });
      } else {
        const currentActive = new Map(activePersonsRef.current);
        const nextLogs = [...JSON.parse(localStorage.getItem('detectionLogs') || '[]')];
        const nowMs = Date.now();
        const now = new Date(nowMs).toISOString();

        for (const [personKey, value] of currentActive.entries()) {
          const timeSinceLastSeen = nowMs - (value.lastSeenAt || nowMs);
          if (timeSinceLastSeen >= EXIT_GRACE_PERIOD_MS) {
            nextLogs.unshift({
              id: Date.now() + Math.random(),
              name: value.name,
              timestamp: now,
              eventType: 'salida',
              status: 'salida',
              confidence: 0,
            });
            currentActive.delete(personKey);
          }
        }

        activePersonsRef.current = currentActive;
        localStorage.setItem('detectionLogs', JSON.stringify(nextLogs.slice(0, 100)));

        setDetection('red');
        setDetectedPerson(null);
        setDetectionConfidence(0);
        // setMessage({ type: 'error', text: '❌ No se detectaron rostros' });
      }
      
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error('Error en detección:', error);
      setDetection('red');
      setDetectionConfidence(0); // ← AÑADIR ESTA LÍNEA
      setMessage({ type: 'error', text: 'Error de conexión con el servidor' });
      setTimeout(() => setMessage(null), 2000);
    } finally {
      detectionInFlightRef.current = false;
      setIsDetecting(false);
    }
  };

  // Iniciar detección periódica
  useEffect(() => {
    if ((sourceType === 'upload' && isPlaying && videoUrl) || 
        (sourceType === 'webcam' && webcamEnabled)) {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
      detectionInterval.current = setInterval(() => {
        void sendFrameForDetection();
      }, 4000);
    } else if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }
    
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, [isPlaying, webcamEnabled, sourceType, videoUrl]);

  // Handle video upload
  const handleVideoUpload = (file) => {
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoFile(file);
      setWebcamEnabled(false);
      setDetection(null);
      setDetectedPerson(null);
      setDetectionConfidence(0); // ← AÑADIR ESTA LÍNEA
      setMessage({ type: 'success', text: 'Video cargado correctamente' });
      setTimeout(() => setMessage(null), 3000);
      return true;
    }
    return false;
  };

  // Webcam controls
  const startWebcam = () => {
    setWebcamEnabled(true);
    setVideoUrl(null);
    setDetection(null);
    setDetectedPerson(null);
    setDetectionConfidence(0); // ← AÑADIR ESTA LÍNEA
    setMessage({ type: 'info', text: 'Cámara web activada - Iniciando detección...' });
    setTimeout(() => setMessage(null), 2000);
  };

  const stopWebcam = () => {
    setWebcamEnabled(false);
    setDetection(null);
    setDetectedPerson(null);
    setDetectionConfidence(0); // ← AÑADIR ESTA LÍNEA
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }
    setMessage({ type: 'info', text: 'Cámara web desactivada' });
    setTimeout(() => setMessage(null), 2000);
  };

  // Capture screenshot
  const captureScreenshot = () => {
    const frameData = captureFrame();
    if (frameData) {
      setScreenshot(frameData);
      localStorage.setItem('lastScreenshot', frameData);
      setMessage({ type: 'success', text: 'Captura guardada' });
      setTimeout(() => setMessage(null), 2000);
    }
  };

  // Toggle play/pause
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

  // Change source type
  const handleSourceChange = (newSource) => {
    if (newSource !== null) {
      setSourceType(newSource);
      if (newSource === 'upload') {
        setWebcamEnabled(false);
      } else {
        setVideoUrl(null);
      }
      setDetection(null);
      setDetectedPerson(null);
      setDetectionConfidence(0); // ← AÑADIR ESTA LÍNEA
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    }
  };

  // Restaurar screenshot guardado
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
    detectionConfidence, // ← AÑADIR ESTA LÍNEA
    message,
    isDetecting,
    webcamEnabled,
    screenshot,
    videoRef,
    webcamRef,
    
    // Funciones
    setSourceType: handleSourceChange,
    setVideoUrl,
    setVideoFile,
    setIsPlaying,
    setDetection,
    setDetectedPerson,
    setDetectionConfidence, // ← AÑADIR ESTA LÍNEA
    setMessage,
    setIsDetecting,
    setWebcamEnabled,
    setScreenshot,
    
    // Acciones
    handleVideoUpload,
    startWebcam,
    stopWebcam,
    captureScreenshot,
    togglePlayPause,
    handleSourceChange,
    sendFrameForDetection,
  };

  return (
    <VideoContext.Provider value={value}>
      {children}
    </VideoContext.Provider>
  );
};