

import { useState, useRef, useCallback } from 'react';
import {
    MapPin, Camera, X, Upload,
    CheckCircle, AlertCircle, Loader
} from 'lucide-react';
import API from '../../api/client';

// gps capture leader
const captureGPS = () => new Promise((resolve) => {
    if (!navigator.geolocation) {
        resolve({ success: false, error: 'GPS not supported on this device' });
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
            success:   true,
            latitude:  pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy:  Math.round(pos.coords.accuracy)
        }),
        (err) => resolve({
            success: false,
            error:   err.code === 1
                ? 'Location permission denied'
                : 'Could not get location'
        }),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
});

// photo preview items
const PhotoPreview = ({ file, index, onRemove }) => {
    const url = URL.createObjectURL(file);
    return (
        <div className="relative group">
            <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg
                           border-2 border-slate-200"
            />
            <button
                onClick={() => onRemove(index)}
                type="button"
                className="absolute -top-1.5 -right-1.5
                           w-5 h-5 bg-red-500 text-white
                           rounded-full flex items-center justify-center
                           opacity-0 group-hover:opacity-100
                           transition-opacity shadow-sm"
            >
                <X size={10} />
            </button>
            <span className="absolute bottom-1 left-1
                             bg-black/50 text-white text-[8px]
                             px-1 rounded">
                {index + 1}
            </span>
        </div>
    );
};

// main component 
const GPSEvidenceUpload = ({
    activityId,           // location_activity_id (required)
    activityName,         // for display
    locationName,         // for display
    uploadEndpoint,       // API endpoint string
    onSuccess,            // callback after upload
    onCancel,             // callback to close/cancel
    role = 'worker'       // 'worker' or 'supervisor'
}) => {

    //state
    const [photos,     setPhotos]     = useState([]);
    const [photoType,  setPhotoType]  = useState('During');
    const [remarks,    setRemarks]    = useState('');
    const [uploading,  setUploading]  = useState(false);
    const [error,      setError]      = useState('');
    const [success,    setSuccess]    = useState(false);

    // GPS state
    const [gpsStatus,  setGpsStatus]  = useState('idle');
    // idle | getting | success | denied | error
    const [gpsData,    setGpsData]    = useState(null);

    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null); 

    //capture gps 
    const handleCaptureGPS = useCallback(async () => {
        setGpsStatus('getting');
        const result = await captureGPS();

        if (result.success) {
            setGpsData(result);
            setGpsStatus('success');
        } else {
            setGpsData(null);
            // setGpsStatus(
            //     result.error.includes('denied') ? 'denied' : 'error'
            // );

            switch ( result.errorCode){
                case 1:
                    setGpsStatus('permission_denied');
                    break;
                case 2:
                    setGpsStatus('position_unavaible');
                    break;
                case 3: 
                    setGpsStatus('timeout');
                    break;
                default: 
                    setGpsStatus('error');
            }
        }
    }, []);

    // handle photo selection 
    const handlePhotos = (files) => {
        const fileArray = Array.from(files);

        // Max 10 photos check
        if (photos.length + fileArray.length > 10) {
            setError('Maximum 10 photos allowed');
            return;
        }

        // Size check (5MB each)
        const oversized = fileArray.filter(f => f.size > 5 * 1024 * 1024);
        if (oversized.length > 0) {
            setError(`${oversized.length} file(s) exceed 5MB limit`);
            return;
        }

        setError('');
        setPhotos(prev => [...prev, ...fileArray]);
    };

    const removePhoto = (index) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    // drag and drop
    // const [dragOver, setDragOver] = useState(false);

    // const onDrop = (e) => {
    //     e.preventDefault();
    //     setDragOver(false);
    //     handlePhotos(e.dataTransfer.files);
    // };

    // submit upload
    const handleSubmit = async () => {
        // Validation
        if (photos.length === 0) {
            setError('Please select at least one photo');
            return;
        }
        if (!activityId) {
            setError('Activity ID is required');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const formData = new FormData();

            //required fields
            formData.append('location_activity_id', activityId);
            formData.append('photo_type',           photoType);

            // optional fields
            if (remarks.trim()) {
                formData.append('remarks', remarks.trim());
            }

            // gps if captured
            if (gpsData?.success) {
                formData.append('latitude',  gpsData.latitude);
                formData.append('longitude', gpsData.longitude);
                formData.append('accuracy',  gpsData.accuracy);
            }

            // photos
            photos.forEach(photo => {
                formData.append('photos', photo);
            });

            // api call
            const endpoint = uploadEndpoint || (
                role === 'supervisor'
                    ? '/supervisor/evidence/upload'
                    : '/worker/evidence/upload'
            );

            const response = await API.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                setSuccess(true);
                // Call parent callback after 1.5s
                setTimeout(() => {
                    onSuccess?.(response.data);
                }, 1500);
            }

        } catch (err) {
            setError(
                err.response?.data?.message || 'Upload failed. Please try again.'
            );
        } finally {
            setUploading(false);
        }
    };

    // ─gps status config
    const gpsConfig = {
        idle: {
            bg:    'bg-slate-50 border-slate-200',
            text:  'text-slate-500',
            icon:  <MapPin size={14} className="text-slate-400" />,
            label: 'Tap to capture GPS location',
            btn:   true
        },
        getting: {
            bg:    'bg-blue-50 border-blue-200',
            text:  'text-blue-600',
            icon:  <Loader size={14} className="animate-spin text-blue-500" />,
            label: 'Getting your location...',
            btn:   false
        },
        success: {
            bg:    'bg-emerald-50 border-emerald-200',
            text:  'text-emerald-700',
            icon:  <CheckCircle size={14} className="text-emerald-500" />,
            label: `GPS captured ✓  (±${gpsData?.accuracy || 0}m accuracy)`,
            btn:   false
        },
        denied: {
            bg:    'bg-amber-50 border-amber-200',
            text:  'text-amber-700',
            icon:  <AlertCircle size={14} className="text-amber-500" />,
            label: 'Location denied — enable in browser settings',
            btn:   true
        },
        error: {
            bg:    'bg-red-50 border-red-200',
            text:  'text-red-600',
            icon:  <AlertCircle size={14} className="text-red-500" />,
            label: 'GPS unavailable — tap to retry',
            btn:   true
        },
    };
    const gps = gpsConfig[gpsStatus];

    // success stats
    if (success) {
        return (
            <div className="flex flex-col items-center justify-center
                            py-12 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full
                                flex items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">
                    Uploaded Successfully!
                </h3>
                <p className="text-sm text-slate-500">
                    {photos.length} photo(s) saved
                    {gpsData?.success ? ' with GPS location' : ''}
                </p>
            </div>
        );
    }

    // main render
    return (
        <div className="space-y-4">

            {/* activity info */}
            {(activityName || locationName) && (
                <div className="bg-slate-50 rounded-lg px-3 py-2.5
                                border border-slate-200">
                    {locationName && (
                        <p className="text-[11px] text-slate-500">
                            📍 {locationName}
                        </p>
                    )}
                    {activityName && (
                        <p className="text-[13px] font-semibold text-slate-700 mt-0.5">
                            {activityName}
                        </p>
                    )}
                </div>
            )}

            {/* photo type selector  */}
            <div>
                <label className="text-[11px] font-semibold text-slate-600
                                   uppercase tracking-wide mb-2 block">
                    Photo Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { key: 'Before', emoji: '🔵', color: 'amber'   },
                        { key: 'During', emoji: '🟡', color: 'blue'    },
                        { key: 'After',  emoji: '🟢', color: 'emerald' },
                        { key: 'Issue',  emoji: '🔴', color: 'red'     },
                    ].map(type => (
                        <button
                            key={type.key}
                            type="button"
                            onClick={() => setPhotoType(type.key)}
                            className={`py-2 rounded-lg text-[12px] font-medium
                                        border transition-all
                                        ${photoType === type.key
                                            ? type.color === 'amber'
                                                ? 'bg-amber-500 text-white border-amber-500'
                                            : type.color === 'blue'
                                                ? 'bg-blue-500 text-white border-blue-500'
                                            : type.color === 'emerald'
                                                ? 'bg-emerald-500 text-white border-emerald-500'
                                            : 'bg-red-500 text-white border-red-500'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                        >
                            {type.emoji} {type.key}
                        </button>
                    ))}
                </div>
            </div>

            {/* gps capture  */}
            <div>
                <label className="text-[11px] font-semibold text-slate-600
                                   uppercase tracking-wide mb-2 block">
                    GPS Location
                    <span className="ml-1 text-slate-400 font-normal normal-case">
                        (recommended)
                    </span>
                </label>
                <div
                    className={`flex items-center gap-3 px-3 py-2.5
                                rounded-lg border transition-all
                                ${gps.bg}`}
                >
                    {gps.icon}
                    <span className={`text-[12px] font-medium flex-1 ${gps.text}`}>
                        {gps.label}
                    </span>
                    {gps.btn && (
                        <button
                            onClick={handleCaptureGPS}
                            type="button"
                            className="text-[11px] font-semibold text-blue-600
                                       bg-white px-2.5 py-1 rounded-md
                                       border border-blue-200
                                       hover:bg-blue-50 transition-colors"
                        >
                            {gpsStatus === 'idle' ? 'Capture' : 'Retry'}
                        </button>
                    )}
                </div>

                {/* GPS Coordinates (shown on success) */}
                {gpsStatus === 'success' && gpsData && (
                    <p className="text-[10px] text-slate-400 mt-1 font-mono pl-1">
                        {gpsData.latitude.toFixed(6)}, {gpsData.longitude.toFixed(6)}
                    </p>
                )}
            </div>

            {/* ── PHOTO UPLOAD AREA ── */}
            <div>
                <label className="text-[11px] font-semibold text-slate-600
                                   uppercase tracking-wide mb-2 block">
                    Photos
                    <span className="ml-1 text-slate-400 font-normal normal-case">
                        (max 10 photos, 5MB each)
                    </span>
                </label>

                {/* Drop Zone */}
            <div className="grid grid-cols-2 gap-3">

            {/* Take Photo */}
            <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center
                   justify-center gap-2 py-5
                   border-2 border-dashed rounded-xl
                   border-blue-200 bg-blue-50/50
                   hover:bg-blue-50 hover:border-blue-400
                   transition-all text-blue-600"
            >
                <Camera size={22} />
                <span className="text-[12px] font-semibold">
                    Take Photo
                </span>
                <span className="text-[10px] text-blue-400">
                    Opens Camera
                </span>
            </button>

            {/* From Gallery */}
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center
                   justify-center gap-2 py-5
                   border-2 border-dashed rounded-xl
                   border-slate-200 bg-slate-50
                   hover:bg-slate-100 hover:border-slate-400
                   transition-all text-slate-600"
            >
            <svg className="w-6 h-6" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0
                     012.828 0L16 16m-2-2l1.586-1.586a2
                     2 0 012.828 0L20 14m-6-6h.01M6 20h12a2
                     2 0 002-2V6a2 2 0 00-2-2H6a2 2 0
                     00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[12px] font-semibold">
                From Gallery
            </span>
            <span className="text-[10px] text-slate-400">
                Choose Existing
            </span>
            </button>
        </div>

        {/* Hidden Inputs */}

    {/* Camera */}      
    <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => handlePhotos(e.target.files)}
    />

    {/* Gallery */}
    <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={e => handlePhotos(e.target.files)}
    />

    {/* Photo count */}
    {photos.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2
                    bg-emerald-50 rounded-lg border
                    border-emerald-200">
            <CheckCircle size={14} className="text-emerald-500" />
            <span className="text-[12px] font-medium text-emerald-700">
                {photos.length} photo(s) ready
            </span>
        </div>
    )}  

                {/* Photo Previews */}
                {photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {photos.map((file, idx) => (
                            <PhotoPreview
                                key={idx}
                                file={file}
                                index={idx}
                                onRemove={removePhoto}
                            />
                        ))}
                        {/* Add More Button */}
                        {photos.length < 10 && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-20 h-20 border-2 border-dashed
                                           border-slate-200 rounded-lg
                                           flex flex-col items-center justify-center
                                           text-slate-400 hover:border-blue-300
                                           hover:text-blue-400 transition-colors"
                            >
                                <Camera size={16} />
                                <span className="text-[9px] mt-1">Add More</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* remarks */}
            <div>
                <label className="text-[11px] font-semibold text-slate-600
                                   uppercase tracking-wide mb-2 block">
                    Remarks
                    <span className="ml-1 text-slate-400 font-normal normal-case">
                        (optional)
                    </span>
                </label>
                <textarea
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="Add any notes about this evidence..."
                    rows={3}
                    maxLength={500}
                    className="w-full text-[13px] px-3 py-2.5
                               border border-slate-200 rounded-lg
                               focus:outline-none focus:border-blue-400
                               resize-none text-slate-700
                               placeholder:text-slate-400"
                />
                <p className="text-[10px] text-slate-400 text-right mt-0.5">
                    {remarks.length}/500
                </p>
            </div>

            {/*error */}
            {error && (
                <div className="flex items-center gap-2 px-3 py-2.5
                                bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                    <p className="text-[12px] text-red-600">{error}</p>
                </div>
            )}

            {/* action buttons  */}
            <div className="flex gap-3 pt-1">

                {/* Cancel */}
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={uploading}
                        className="flex-1 py-2.5 border border-slate-200
                                   rounded-xl text-sm font-medium
                                   text-slate-600 hover:bg-slate-50
                                   transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                )}

                {/* Upload */}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={uploading || photos.length === 0}
                    className="flex-[2] py-2.5 bg-blue-600 text-white
                               rounded-xl text-sm font-semibold
                               flex items-center justify-center gap-2
                               hover:bg-blue-700 transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploading ? (
                        <>
                            <Loader size={15} className="animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload size={15} />
                            Upload {photos.length > 0
                                ? `${photos.length} Photo${photos.length > 1 ? 's' : ''}`
                                : 'Photos'
                            }
                            {gpsStatus === 'success' && (
                                <span className="text-[10px] bg-white/20
                                                 px-1.5 py-0.5 rounded-full">
                                    📍
                                </span>
                            )}
                        </>
                    )}
                </button>
            </div>

            {/* GPS reminder */}
            {gpsStatus === 'idle' && photos.length > 0 && (
                <p className="text-[11px] text-center text-amber-600
                               bg-amber-50 rounded-lg py-2 px-3
                               border border-amber-200">
                    💡 Tip: Capture GPS location to verify you were at the site
                </p>
            )}
        </div>
    );
};

export default GPSEvidenceUpload;