import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Scanner } from '@yudiel/react-qr-scanner';
import toast from 'react-hot-toast';
import { ScanFace, ArrowLeft, Loader2 } from 'lucide-react';

export default function QRScanner() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleScan = async (result) => {
    if (!result || !result[0] || !result[0].rawValue || isProcessing) return;
    
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const qrData = JSON.parse(result[0].rawValue);
      
      if (!qrData.sessionId || !qrData.token) {
        throw new Error('Invalid QR format');
      }

      const res = await axios.post(import.meta.env.VITE_API_URL + '/attendance/verify-qr', {
        sessionId: qrData.sessionId,
        token: qrData.token
      });

      if (res.data.success) {
        toast.success('QR verified! Proceeding to face scan...');
        // Store the short-lived verification token securely in sessionStorage
        sessionStorage.setItem('faceVerificationToken', res.data.verificationToken);
        sessionStorage.setItem('activeSessionId', qrData.sessionId);
        
        // Redirect to Face Verification Page
        navigate('/student/verify-face');
      }
    } catch (err) {
      console.error(err);
      if (err.name === 'SyntaxError') {
        setErrorMsg('Invalid QR Code. Please scan a valid SmartAttend QR.');
      } else {
        setErrorMsg(err.response?.data?.message || 'Failed to verify QR Code');
      }
      // Re-enable scanning after a short delay so they can try again
      setTimeout(() => setIsProcessing(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between shadow-md z-10">
        <button onClick={() => navigate('/student')} className="flex items-center text-gray-300 hover:text-white">
          <ArrowLeft className="w-6 h-6 mr-2" /> Back
        </button>
        <h1 className="font-semibold text-lg flex items-center">
          <ScanFace className="w-5 h-5 mr-2" /> Scan Classroom QR
        </h1>
        <div className="w-8"></div> {/* Spacer */}
      </div>

      {/* Main Scanner Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center bg-gray-950">
        
        <div className="w-full max-w-md relative">
          {/* Instructions Overlay */}
          <div className="absolute -top-16 left-0 right-0 text-center z-10">
            <p className="text-white font-medium drop-shadow-md">Point your camera at the Teacher's screen</p>
          </div>

          <div className="rounded-2xl overflow-hidden border-4 border-gray-800 shadow-2xl relative bg-black">
            {!isProcessing ? (
              <Scanner 
                onScan={handleScan}
                onError={(err) => console.log(err)}
                formats={['qr_code']}
                components={{
                  tracker: true,
                  audio: false
                }}
                styles={{
                  container: { width: '100%', height: '400px' }
                }}
              />
            ) : (
              <div className="w-full h-[400px] flex flex-col items-center justify-center bg-gray-900 text-indigo-400">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="font-semibold">Verifying Secure Token...</p>
              </div>
            )}
          </div>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="mt-8 bg-red-900/90 text-red-100 px-6 py-3 rounded-full font-medium border border-red-700 animate-bounce">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
