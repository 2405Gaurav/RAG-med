import React, { useState, useRef } from "react";
import { Upload, File, CheckCircle, AlertCircle, X, Zap, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/api-client.js"
import { UPLOAD_PDF } from "../utils/constants.js"

const UploadComponent: React.FC = () => {
    const navigate = useNavigate();
    const [files, setFiles] = useState<File[]>([]);
    const [duration, setDuration] = useState('');
    const [patientName, setPatientName] = useState('');
    const [reportType, setReportType] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const navigateToChat = () => {
        navigate("/chat");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            const validFiles = selectedFiles.filter(file => file.type === 'application/pdf');
            
            if (validFiles.length > 0) {
                setFiles(prev => [...prev, ...validFiles]);
                setUploadStatus('idle');
                setErrorMessage('');
            }
            
            if (validFiles.length < selectedFiles.length) {
                setErrorMessage('Some files were skipped (only PDF files are allowed)');
                setUploadStatus('error');
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        const validFiles = droppedFiles.filter(file => file.type === 'application/pdf');
        
        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles]);
            setUploadStatus('idle');
            setErrorMessage('');
        }
        
        if (validFiles.length < droppedFiles.length) {
            setErrorMessage('Some files were skipped (only PDF files are allowed)');
            setUploadStatus('error');
        }
    };

    const handleSubmit = async () => {
        if (files.length === 0) {
            setErrorMessage('Please select at least one PDF file');
            setUploadStatus('error');
            return;
        }

        setIsUploading(true);
        setUploadStatus('idle');

        const formData = new FormData();
        files.forEach((file, index) => {
            formData.append(`pdf${index}`, file);
        });
        formData.append('count', files.length.toString());
        formData.append('duration', duration);
        formData.append('patientName', patientName);
        formData.append('reportType', reportType);

        try {
            const response = await apiClient.post(UPLOAD_PDF, formData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" },
            });
            const { collectionName } = response.data;

            if (collectionName) {
                localStorage.setItem("collectionName", collectionName);
            }

            console.log("Upload Success:", files.map(f => f.name).join(', '));
            setUploadStatus('success');
            setErrorMessage('');

            setTimeout(() => {
                navigateToChat();
            }, 1500);

        } catch (err) {
            console.error("Upload failed:", err);
            setErrorMessage('Failed to upload files. Please try again.');
            setUploadStatus('error');
        } finally {
            setIsUploading(false);
        }
    };

    const removeFile = (indexToRemove: number) => {
        setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        if (files.length === 1) {
            setUploadStatus('idle');
            setErrorMessage('');
        }
    };

    const removeAllFiles = () => {
        setFiles([]);
        setUploadStatus('idle');
        setErrorMessage('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-600 rounded-xl">
                        <Activity className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">MedRAG-Agent</h1>
                        <p className="text-gray-600 text-sm">Medical Q&A with Knowledge Graph</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-4xl w-full">
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center mb-6">
                            <div className="p-6 bg-blue-100 rounded-full">
                                <Activity className="w-16 h-16 text-blue-600" />
                            </div>
                        </div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Upload Medical Reports
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Get trustworthy medical information powered by knowledge graphs and verified sources. All answers include citations.
                        </p>
                    </div>

                    {/* Input Fields Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Patient Name (Optional)
                            </label>
                            <input
                                type="text"
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                                placeholder="Enter patient name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Report Type (Optional)
                            </label>
                            <input
                                type="text"
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                placeholder="e.g., Blood Test, X-Ray"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration/Time Period (Optional)
                        </label>
                        <input
                            type="text"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="e.g., 3 months, 2 weeks, Last year"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Upload Area */}
                    <div
                        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                            isDragOver
                                ? 'border-blue-500 bg-blue-50'
                                : files.length > 0
                                ? 'border-green-400 bg-green-50'
                                : uploadStatus === 'error'
                                ? 'border-red-400 bg-red-50'
                                : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                        } ${isUploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                            multiple
                        />

                        {files.length === 0 ? (
                            <div className="flex flex-col items-center py-8">
                                <div className={`p-4 rounded-full mb-4 transition-all ${
                                    isDragOver ? 'bg-blue-200' : 'bg-blue-100'
                                }`}>
                                    <Upload className="w-12 h-12 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {isDragOver ? 'Release to Upload' : 'Drop PDF Reports Here'}
                                </h3>
                                <p className="text-gray-600 mb-1">
                                    or <span className="text-blue-600 font-medium">browse files</span> from your device
                                </p>
                                <p className="text-sm text-gray-500 mt-3">PDF only • Multiple files • Max 10MB each</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-gray-900 font-semibold">{files.length} file{files.length > 1 ? 's' : ''} selected</p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeAllFiles();
                                        }}
                                        className="px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all"
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-2">
                                    {files.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <File className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-medium text-gray-900 text-sm truncate max-w-md">{file.name}</p>
                                                    <p className="text-gray-500 text-xs">{formatFileSize(file.size)}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFile(index);
                                                }}
                                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
                                            >
                                                <X className="w-4 h-4 text-gray-500" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isUploading && (
                            <div className="absolute inset-0 bg-white/95 flex items-center justify-center rounded-2xl">
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                                        <div className="absolute inset-0 w-16 h-16 border-4 border-t-blue-600 border-r-blue-600 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-gray-900 font-semibold">Processing Upload</p>
                                        <p className="text-gray-600 text-sm">Uploading {files.length} report{files.length > 1 ? 's' : ''}...</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status Messages */}
                    {uploadStatus === 'success' && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3">
                            <div className="p-2 bg-green-500 rounded-full">
                                <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-green-900 font-semibold">Upload Successful</p>
                                <p className="text-green-700 text-sm">Redirecting to Q&A interface...</p>
                            </div>
                        </div>
                    )}

                    {uploadStatus === 'error' && errorMessage && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
                            <div className="p-2 bg-red-500 rounded-full">
                                <AlertCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-red-900 font-semibold">Upload Failed</p>
                                <p className="text-red-700 text-sm">{errorMessage}</p>
                            </div>
                        </div>
                    )}

                    {/* Upload Button */}
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={handleSubmit}
                            disabled={files.length === 0 || isUploading}
                            className={`px-10 py-3.5 rounded-xl font-semibold text-base transition-all flex items-center space-x-3 ${
                                files.length === 0 || isUploading
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-95'
                            }`}
                        >
                            <Upload className="w-5 h-5" />
                            <span>
                                {isUploading 
                                    ? 'Uploading...' 
                                    : files.length > 0 
                                    ? `Upload ${files.length} Report${files.length > 1 ? 's' : ''} & Continue`
                                    : 'Upload Reports & Continue'}
                            </span>
                        </button>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-500 text-sm">
                            HIPAA compliant • End-to-end encryption • Medical data secure
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadComponent;