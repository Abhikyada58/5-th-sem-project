import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as faceapi from '@vladmandic/face-api';
import toast from 'react-hot-toast';
import { ShieldAlert, CheckCircle, Camera, Loader2, ArrowLeft } from 'lucide-react';

export default function FaceVerification() {
  const navigate = useNavigate();
  const videoRef = useRef();
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [statusText, setStatusText] = useState('Initializing Secure Camera...');
  const [isCapturing, setIsCapturing] = useState(false);
  const [verificationToken, setVerificationToken] = useState(null);

  useEffect(() => {
    // 1. Ensure they have the handoff token from the QR scan
    const token = sessionStorage.getItem('faceVerificationToken');
    if (!token) {
      toast.error('Unauthorized access. Please scan the QR code first.');
      navigate('/student');
      return;
    }
    setVerificationToken(token);
    
    // 2. Load models
    loadModels();

    return () => stopCamera();
  }, [navigate]);

  const loadModels = async () => {
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/gh/vladmandic/face-api/model/';
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      startCamera();
    } catch (err) {
      toast.error('Failed to load AI models.');
      setStatusText('Error loading security models.');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setStatusText('Align your face within the frame');
      }
    } catch (err) {
      toast.error('Camera permission required.');
      setStatusText('Camera access denied.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const handleVerify = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    setIsCapturing(true);
    setStatusText('Analyzing biometric data...');

    try {
      const detections = await faceapi.detectAllFaces(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        setStatusText('No face detected. Please try again.');
        setIsCapturing(false);
        return;
      }

      if (detections.length > 1) {
        setStatusText('Multiple faces detected. Ensure only you are in frame.');
        setIsCapturing(false);
        return;
      }

      const detection = detections[0];

      // Bounding box heuristic for "Move closer"
      const box = detection.detection.box;
      const faceArea = box.width * box.height;
      const videoArea = 640 * 480;
      if (faceArea / videoArea < 0.15) {
        setStatusText('Move closer to the camera.');
        setIsCapturing(false);
        return;
      }

      // Quality / Lighting heuristic
      if (detection.detection.score < 0.85) {
        setStatusText('Improve lighting and face the camera directly.');
        setIsCapturing(false);
        return;
      }

      // Extract float array
      const descriptorArray = Array.from(detection.descriptor);
      
      setStatusText('Securing payload and contacting server...');
      
      // Stop camera during network request
      stopCamera();

      // Send to backend for mathematical matching
      const res = await axios.post(import.meta.env.VITE_API_URL + '/attendance/mark', {
        verificationToken,
        liveDescriptor: descriptorArray
      });

      if (res.data.success) {
        toast.success('Face verified successfully! Attendance marked.');
        setStatusText('Face verified successfully');
        sessionStorage.removeItem('faceVerificationToken'); // consume it
        setTimeout(() => navigate('/student'), 2000);
      }
      
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Face verification failed.');
      setStatusText(err.response?.data?.message || 'Verification Failed');
      
      // If it failed due to bad token/expiration, redirect back
      if (err.response?.status === 401 || err.response?.status === 400) {
        sessionStorage.removeItem('faceVerificationToken');
        setTimeout(() => navigate('/student'), 3000);
      } else {
        // Otherwise allow them to retry
        setIsCapturing(false);
        startCamera();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white text-center relative">
          <button 
            onClick={() => navigate('/student')} 
            className="absolute left-4 top-6 text-indigo-100 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-90" />
          <h2 className="text-xl font-bold">Live Verification</h2>
        </div>

        <div className="p-8 flex flex-col items-center">
          
          {/* Status Banner */}
          <div className="mb-6 bg-gray-800 text-indigo-400 px-6 py-3 rounded-full font-semibold border border-gray-700 flex items-center text-sm w-full justify-center text-center">
            {isCapturing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
            {statusText}
          </div>

          {/* Video Feed */}
          <div className="relative rounded-full overflow-hidden border-4 border-indigo-500/50 bg-black shadow-inner" style={{ width: 280, height: 280 }}>
            {!modelsLoaded ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <span className="text-xs">Loading Secure AI...</span>
              </div>
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline
                className={`w-full h-full object-cover ${(isCapturing) ? 'opacity-50 blur-sm' : 'opacity-100'} transition-all`}
              />
            )}
            
            {/* Guide overlay */}
            <div className="absolute inset-0 border-[20px] border-gray-900/40 rounded-full pointer-events-none"></div>
          </div>

          <p className="text-gray-400 text-center text-sm mt-8 mb-6">
            Ensure you are in a well-lit area. Remove any masks or heavy glasses.
          </p>

          <button 
            onClick={handleVerify}
            disabled={isCapturing || !cameraActive}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center"
          >
            {isCapturing ? (
              <>Verifying Identity...</>
            ) : (
              <>
                <CheckCircle className="w-6 h-6 mr-2" /> Verify & Mark Present
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
