import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import * as faceapi from '@vladmandic/face-api';
import toast from 'react-hot-toast';
import { ShieldAlert, CheckCircle, Camera, RotateCw } from 'lucide-react';

const ENROLLMENT_STEPS = [
  { id: 1, label: 'Look straight into the camera' },
  { id: 2, label: 'Turn slightly left' },
  { id: 3, label: 'Turn slightly right' },
  { id: 4, label: 'Look slightly upward' },
  { id: 5, label: 'Look slightly downward' },
  { id: 6, label: 'Look straight again' },
];

export default function FaceEnrollment() {
  const { user, fetchUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const videoRef = useRef();
  
  const [consentGiven, setConsentGiven] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [descriptors, setDescriptors] = useState([]);
  const [statusText, setStatusText] = useState('Initializing...');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If they bypass by URL but are already enrolled
    if (user?.faceEnrolled) {
      navigate('/student');
    }
  }, [user, navigate]);

  // Load FaceAPI Models
  const loadModels = async () => {
    try {
      setStatusText('Downloading AI Models (This might take a moment)...');
      // Using jsdelivr CDN for the models to avoid bloating the local repo
      const MODEL_URL = 'https://cdn.jsdelivr.net/gh/vladmandic/face-api/model/';
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      setStatusText('Models loaded. Please grant camera access.');
      startCamera();
    } catch (err) {
      console.error(err);
      toast.error('Failed to load AI models. Please check your connection.');
      setStatusText('Error loading models.');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setStatusText(ENROLLMENT_STEPS[0].label);
      }
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Camera access denied or unavailable.');
      setStatusText('Camera access required.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => stopCamera(); // Cleanup on unmount
  }, []);

  const handleConsent = (e) => {
    setConsentGiven(e.target.checked);
  };

  const handleStart = () => {
    if (!consentGiven) {
      toast.error('You must provide consent to continue.');
      return;
    }
    loadModels();
  };

  const handleCapture = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    setIsCapturing(true);
    setStatusText('Analyzing...');

    try {
      // Detect all faces
      const detections = await faceapi.detectAllFaces(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        toast.error('No face detected. Please ensure you are visible.');
        setStatusText(ENROLLMENT_STEPS[currentStep].label);
        setIsCapturing(false);
        return;
      }

      if (detections.length > 1) {
        toast.error('Multiple faces detected. Please ensure only you are in the frame.');
        setStatusText(ENROLLMENT_STEPS[currentStep].label);
        setIsCapturing(false);
        return;
      }

      const detection = detections[0];
      
      // Basic quality check (e.g., confidence score)
      if (detection.detection.score < 0.8) {
        toast.error('Low confidence face detection. Please improve lighting.');
        setStatusText(ENROLLMENT_STEPS[currentStep].label);
        setIsCapturing(false);
        return;
      }

      // Convert Float32Array to standard array for JSON transport
      const descriptorArray = Array.from(detection.descriptor);
      
      const newDescriptors = [...descriptors, descriptorArray];
      setDescriptors(newDescriptors);
      
      toast.success('Captured!');

      if (currentStep < ENROLLMENT_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
        setStatusText(ENROLLMENT_STEPS[currentStep + 1].label);
      } else {
        // We have all captures, submit to backend
        submitEnrollment(newDescriptors);
      }
    } catch (err) {
      console.error(err);
      toast.error('Capture failed. Please try again.');
      setStatusText(ENROLLMENT_STEPS[currentStep].label);
    } finally {
      setIsCapturing(false);
    }
  };

  const submitEnrollment = async (finalDescriptors) => {
    setIsSubmitting(true);
    setStatusText('Securing and saving your biometric profile...');
    stopCamera();

    try {
      await axios.post(import.meta.env.VITE_API_URL + '/face-enrollment/complete', {
        descriptors: finalDescriptors
      });
      
      toast.success('Face enrollment complete!');
      await fetchUser(); // Update user context, which will trigger redirect via StudentRoute
      navigate('/student');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save enrollment.');
      setStatusText('Enrollment failed. Please retry.');
      // Reset state to try again
      setDescriptors([]);
      setCurrentStep(0);
      startCamera();
    } finally {
      setIsSubmitting(false);
    }
  };

  const retryCurrent = () => {
    toast('Please try capturing this angle again.', { icon: '🔄' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white text-center">
          <ShieldAlert className="w-12 h-12 mx-auto mb-2 opacity-90" />
          <h2 className="text-2xl font-bold">Biometric Face Enrollment</h2>
          <p className="opacity-90">Required for secure attendance verification</p>
        </div>

        <div className="p-8">
          
          {/* Step 1: Consent */}
          {!modelsLoaded && !cameraActive && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded text-yellow-800">
                <p className="font-semibold">Privacy Notice</p>
                <p className="text-sm mt-1">
                  Your raw photographs are <strong>never</strong> sent to the server. 
                  Your browser will locally extract a mathematical template of your face structure 
                  and send only the secure numerical template for storage.
                </p>
              </div>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="mt-1 w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={consentGiven}
                  onChange={handleConsent}
                />
                <span className="text-gray-700 font-medium">
                  I consent to the secure processing of my facial biometric template for attendance verification.
                </span>
              </label>

              <div className="flex justify-between items-center pt-4 border-t">
                <button onClick={logout} className="text-gray-500 hover:text-gray-800 underline text-sm">
                  Logout for now
                </button>
                <button 
                  onClick={handleStart}
                  disabled={!consentGiven}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Start Enrollment
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Camera Feed */}
          {(modelsLoaded || cameraActive) && (
            <div className="flex flex-col items-center">
              
              {/* Progress Indicator */}
              <div className="w-full mb-6">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{currentStep} / {ENROLLMENT_STEPS.length} captures</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${(currentStep / ENROLLMENT_STEPS.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Status Banner */}
              <div className="mb-4 bg-indigo-50 text-indigo-800 px-6 py-3 rounded-full font-semibold border border-indigo-100 flex items-center">
                {isSubmitting ? <CheckCircle className="w-5 h-5 mr-2 animate-pulse" /> : <Camera className="w-5 h-5 mr-2" />}
                {statusText}
              </div>

              {/* Video Wrapper */}
              <div className="relative rounded-lg overflow-hidden border-4 border-gray-200 bg-black shadow-inner" style={{ width: 640, height: 480 }}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline
                  className={`w-full h-full object-cover ${(isCapturing || isSubmitting) ? 'opacity-50' : 'opacity-100'} transition-opacity`}
                />
                
                {/* Face Guide Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-80 border-4 border-dashed border-white opacity-50 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-8 flex space-x-4">
                <button 
                  onClick={retryCurrent}
                  disabled={isCapturing || isSubmitting || currentStep === 0}
                  className="flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  <RotateCw className="w-5 h-5 mr-2" /> Retry Angle
                </button>
                <button 
                  onClick={handleCapture}
                  disabled={isCapturing || isSubmitting || !cameraActive}
                  className="flex items-center px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-md disabled:opacity-50 transition-colors"
                >
                  <Camera className="w-5 h-5 mr-2" /> 
                  {isCapturing ? 'Analyzing...' : 'Capture Face'}
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
