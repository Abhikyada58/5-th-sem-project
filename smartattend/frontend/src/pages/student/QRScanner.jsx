import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Scanner } from '@yudiel/react-qr-scanner';
import toast from 'react-hot-toast';
import { ScanFace, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';

export default function QRScanner() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleScan = async (result) => {
    if (!result || isProcessing) return;
    
    // @yudiel/react-qr-scanner can return the string directly, an object with text, or an array of objects
    let rawString = '';
    if (typeof result === 'string') {
      rawString = result;
    } else if (Array.isArray(result) && result.length > 0) {
      rawString = result[0].rawValue || result[0].text;
    } else if (result.text || result.rawValue) {
      rawString = result.text || result.rawValue;
    }

    if (!rawString) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const qrData = JSON.parse(rawString);
      
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
    <div className="fixed inset-0 bg-black flex flex-col z-50 overflow-hidden font-sans">
      
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent pt-10">
        <button 
          onClick={() => navigate('/student')} 
          className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all shadow-lg"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center shadow-lg">
          <ScanFace className="w-5 h-5 mr-2 text-indigo-400" />
          <span className="text-white font-medium text-sm tracking-wide">Scan Class QR</span>
        </div>
        <div className="w-12 h-12"></div>
      </div>

      {/* Main Scanner Feed */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center">
        {!isProcessing ? (
          <>
            <Scanner 
              onScan={handleScan}
              onError={(err) => console.log(err)}
              formats={['qr_code']}
              components={{
                tracker: true,
                audio: false
              }}
              styles={{
                container: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
                video: { objectFit: 'cover' }
              }}
            />
            {/* Custom Scan Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/30 rounded-3xl relative">
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-3xl"></div>
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-3xl"></div>
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-3xl"></div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-3xl"></div>
                
                {/* Scanning line animation */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>
              <p className="mt-8 text-white font-medium tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Align QR within frame
              </p>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="w-24 h-24 relative mb-6">
              <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Verifying Token</h2>
            <p className="text-indigo-200">Securing your session...</p>
          </div>
        )}

        {/* Error Feedback */}
        {errorMsg && (
          <div className="absolute bottom-12 left-6 right-6 z-40 bg-rose-600/95 backdrop-blur-md text-white p-4 rounded-2xl font-medium border border-rose-400 shadow-2xl animate-bounce text-center flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {errorMsg}
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
