import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { toast } from "react-toastify";
import { X, ScanLine, CheckCircle2, XCircle, AlertCircle, Package, CreditCard, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markBillScannedComplete } from "@/services/bills";

// Success/Error sounds using Web Audio API
const playSound = (type) => {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'success') {
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } else if (type === 'error') {
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
        } else if (type === 'warning') {
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }
    } catch (e) {
        console.log('Audio not supported');
    }
};

// Get status display info based on response status
const getStatusDisplay = (status) => {
    switch (status) {
        case 'marked_complete':
            return {
                icon: CheckCircle2,
                color: 'green',
                bgColor: 'bg-green-500/20',
                borderColor: 'border-green-500/40',
                textColor: 'text-green-400',
                label: 'Delivered & Paid'
            };
        case 'marked_paid':
            return {
                icon: CreditCard,
                color: 'emerald',
                bgColor: 'bg-emerald-500/20',
                borderColor: 'border-emerald-500/40',
                textColor: 'text-emerald-400',
                label: 'Marked as Paid'
            };
        case 'marked_delivered':
            return {
                icon: Truck,
                color: 'blue',
                bgColor: 'bg-blue-500/20',
                borderColor: 'border-blue-500/40',
                textColor: 'text-blue-400',
                label: 'Marked as Delivered'
            };
        case 'already_complete':
            return {
                icon: AlertCircle,
                color: 'amber',
                bgColor: 'bg-amber-500/20',
                borderColor: 'border-amber-500/40',
                textColor: 'text-amber-400',
                label: 'Already Complete'
            };
        case 'not_found':
            return {
                icon: XCircle,
                color: 'red',
                bgColor: 'bg-red-500/20',
                borderColor: 'border-red-500/40',
                textColor: 'text-red-400',
                label: 'Bill Not Found'
            };
        default:
            return {
                icon: XCircle,
                color: 'red',
                bgColor: 'bg-red-500/20',
                borderColor: 'border-red-500/40',
                textColor: 'text-red-400',
                label: 'Error'
            };
    }
};

const ScannerMode = ({ onClose }) => {
    const [activeCollection] = useLocalStorage("activeCollection", null);
    const [scannedValue, setScannedValue] = useState("");
    const [lastScan, setLastScan] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const [flashColor, setFlashColor] = useState(null);
    const inputRef = useRef(null);
    const queryClient = useQueryClient();

    // Focus the hidden input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Handle escape key to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Flash effect
    const showFlash = useCallback((color) => {
        setFlashColor(color);
        setTimeout(() => setFlashColor(null), 400);
    }, []);

    const scanMutation = useMutation({
        mutationFn: markBillScannedComplete,
        onSuccess: (response) => {
            const { bill, already_complete, status } = response.data;
            const statusDisplay = getStatusDisplay(status);

            if (already_complete) {
                showFlash('amber');
                playSound('warning');
            } else {
                showFlash('green');
                playSound('success');
            }

            const scanResult = {
                success: true,
                bill_no: bill.bill_no,
                name: bill.name,
                status,
                statusDisplay,
                timestamp: new Date()
            };

            setLastScan(scanResult);
            setScanHistory(prev => [scanResult, ...prev].slice(0, 5));
            queryClient.invalidateQueries(["bills", activeCollection]);
        },
        onError: (error) => {
            showFlash('red');
            playSound('error');

            const status = error.response?.data?.status || 'error';
            const errorMessage = error.response?.data?.message || 'Failed to process scan';
            const statusDisplay = getStatusDisplay(status);

            const scanResult = {
                success: false,
                bill_no: null,
                name: null,
                status,
                statusDisplay,
                message: errorMessage,
                timestamp: new Date()
            };

            setLastScan(scanResult);
            setScanHistory(prev => [scanResult, ...prev].slice(0, 5));
            toast.error(errorMessage);
        }
    });

    const handleInputChange = (e) => {
        setScannedValue(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const billId = scannedValue.trim();

        if (!billId) return;

        if (!activeCollection) {
            showFlash('red');
            playSound('error');
            toast.error("No collection selected");
            return;
        }

        // UUID validation (basic check)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(billId)) {
            showFlash('red');
            playSound('error');
            const scanResult = {
                success: false,
                bill_no: null,
                name: null,
                status: 'invalid_format',
                statusDisplay: getStatusDisplay('error'),
                message: 'Invalid barcode format',
                timestamp: new Date()
            };
            setLastScan(scanResult);
            setScanHistory(prev => [scanResult, ...prev].slice(0, 5));
            setScannedValue("");
            inputRef.current?.focus();
            return;
        }

        scanMutation.mutate({
            collection_id: activeCollection,
            bill_id: billId
        });

        setScannedValue("");
        inputRef.current?.focus();
    };

    const getFlashBackground = () => {
        switch (flashColor) {
            case 'green': return 'bg-green-500/30';
            case 'red': return 'bg-red-500/30';
            case 'amber': return 'bg-amber-500/30';
            case 'blue': return 'bg-blue-500/30';
            default: return '';
        }
    };

    return (
        <div className={`fixed inset-0 z-50 flex transition-colors duration-300 ${getFlashBackground()}`}>
            {/* Left side - Main scanner area */}
            <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex flex-col items-center justify-center relative">
                {/* Close button - Fixed styling */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onClose}
                    className="absolute top-6 left-6 bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-colors"
                >
                    <X className="size-5" />
                </Button>

                {/* Decorative background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                </div>

                {/* Main content */}
                <div className="text-center space-y-8 relative z-10 px-8">
                    {/* Scanner icon with glow effect */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150" />
                        <div className="relative bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-8 rounded-3xl border border-indigo-500/30 backdrop-blur-sm">
                            <ScanLine className="size-20 text-indigo-400 mx-auto" />
                            {scanMutation.isPending && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="size-24 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">Scanner Mode</h1>
                        <p className="text-xl text-slate-400">Scan bill QR Code to mark as delivered & paid</p>
                    </div>

                    {/* Input for scanner */}
                    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={scannedValue}
                                onChange={handleInputChange}
                                className="w-full bg-slate-800/80 border-2 border-slate-600 rounded-xl px-6 py-4 text-white text-center text-lg focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 placeholder:text-slate-500 transition-all backdrop-blur-sm"
                                placeholder="Scan barcode or type bill ID..."
                                autoComplete="off"
                                autoFocus
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 pointer-events-none" />
                        </div>
                    </form>

                    {/* Last scan result */}
                    {lastScan && (
                        <div className={`mt-6 p-5 rounded-2xl max-w-md mx-auto backdrop-blur-sm border ${lastScan.statusDisplay.bgColor} ${lastScan.statusDisplay.borderColor}`}>
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <lastScan.statusDisplay.icon className={`size-7 ${lastScan.statusDisplay.textColor}`} />
                                <span className={`text-xl font-semibold ${lastScan.statusDisplay.textColor}`}>
                                    {lastScan.statusDisplay.label}
                                </span>
                            </div>
                            {lastScan.bill_no ? (
                                <p className="text-white/90 text-lg">
                                    Bill #{lastScan.bill_no} • {lastScan.name}
                                </p>
                            ) : lastScan.message ? (
                                <p className="text-white/70 text-base">{lastScan.message}</p>
                            ) : null}
                        </div>
                    )}

                    {/* Keyboard shortcut hint */}
                    <div className="text-slate-500 text-sm mt-6 flex items-center justify-center gap-2">
                        Press <kbd className="px-2 py-1 bg-slate-800 rounded-md text-slate-400 font-mono text-xs border border-slate-700">ESC</kbd> to exit
                    </div>
                </div>
            </div>

            {/* Right side - Scan history */}
            <div className="w-80 bg-slate-900/95 border-l border-slate-700 p-6 flex flex-col">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Package className="size-5 text-indigo-400" />
                    Recent Scans
                </h2>

                {scanHistory.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-slate-500 text-center text-sm">
                            No scans yet.<br />Scan a bill to get started.
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 space-y-3 overflow-y-auto">
                        {scanHistory.map((scan, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-xl border ${scan.statusDisplay.bgColor} ${scan.statusDisplay.borderColor}`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <scan.statusDisplay.icon className={`size-4 ${scan.statusDisplay.textColor}`} />
                                    <span className={`text-sm font-medium ${scan.statusDisplay.textColor}`}>
                                        {scan.statusDisplay.label}
                                    </span>
                                </div>
                                {scan.bill_no ? (
                                    <p className="text-white/80 text-sm">
                                        Bill #{scan.bill_no} • {scan.name}
                                    </p>
                                ) : scan.message ? (
                                    <p className="text-white/60 text-xs">{scan.message}</p>
                                ) : null}
                                <p className="text-white/60 text-xs mt-1">
                                    {scan.timestamp.toLocaleTimeString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats summary */}
                {scanHistory.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-500/10 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-green-400">
                                    {scanHistory.filter(s => s.success).length}
                                </p>
                                <p className="text-xs text-green-400/70">Successful</p>
                            </div>
                            <div className="bg-red-500/10 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-red-400">
                                    {scanHistory.filter(s => !s.success).length}
                                </p>
                                <p className="text-xs text-red-400/70">Failed</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScannerMode;
