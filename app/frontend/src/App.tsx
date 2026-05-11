import React, { useRef, useState, useEffect } from 'react'
import * as faceapi from 'face-api.js'
import './App.css'

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [detections, setDetections] = useState<any[]>([])
  const [knownPersons, setKnownPersons] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    // const loadModels = async () => {
    //   await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
    //   await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
    //   await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    // }
    // loadModels()
  }, [])

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setVideoFile(file)
      const url = URL.createObjectURL(file)
      if (videoRef.current) {
        videoRef.current.src = url
      }
    }
  }

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
      // detectFaces()
    }
  }

  // const detectFaces = async () => {
  //   if (!videoRef.current || !canvasRef.current) return

  //   const video = videoRef.current
  //   const canvas = canvasRef.current
  //   const displaySize = { width: video.videoWidth, height: video.videoHeight }
  //   faceapi.matchDimensions(canvas, displaySize)

  //   const detect = async () => {
  //     if (video.paused || video.ended) return

  //     const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors()
  //     const resizedDetections = faceapi.resizeResults(detections, displaySize)

  //     // Match with known persons
  //     const matchedDetections = await Promise.all(resizedDetections.map(async (detection) => {
  //       const descriptor = detection.descriptor
  //       // Send to backend for matching
  //       const response = await fetch('/api/detections', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ vector: Array.from(descriptor) })
  //       })
  //       const result = await response.json()
  //       return { ...detection, matched: result.recognized, name: result.known_person?.name || 'Unknown' }
  //     }))

  //     setDetections(matchedDetections)

  //     const ctx = canvas.getContext('2d')
  //     if (ctx) {
  //       ctx.clearRect(0, 0, canvas.width, canvas.height)
  //       matchedDetections.forEach(detection => {
  //         const box = detection.detection.box
  //         ctx.strokeStyle = detection.matched ? 'green' : 'red'
  //         ctx.lineWidth = 3
  //         ctx.strokeRect(box.x, box.y, box.width, box.height)
  //         ctx.fillStyle = detection.matched ? 'green' : 'red'
  //         ctx.fillText(detection.name, box.x, box.y - 10)
  //       })
  //     }

  //     requestAnimationFrame(detect)
  //   }

  //   detect()
  // }

  const handleAddPerson = () => {
    // TODO: Implement add person modal
    alert('Add person functionality')
  }

  const handleViewLogs = async () => {
    const response = await fetch('/api/detections')
    const data = await response.json()
    setLogs(data)
  }

  return (
    <div className="App">
      <div className="main-container">
        <div className="video-section">
          <input type="file" accept="video/*" onChange={handleVideoUpload} />
          <button onClick={handlePlay} disabled={!videoFile}>Play Video</button>
          <div className="video-container">
            <video ref={videoRef} width="100%" height="auto" />
            <canvas ref={canvasRef} className="overlay" />
          </div>
        </div>
        <div className="control-panel">
          <button onClick={handleAddPerson}>Añadir Persona</button>
          <button onClick={handleViewLogs}>Ver Logs</button>
          <div className="logs">
            <h3>Detecciones</h3>
            <ul>
              {logs.map((log, index) => (
                <li key={index}>{log.id}: {log.recognized ? 'Reconocido' : 'Desconocido'} - {log.first_moment}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App