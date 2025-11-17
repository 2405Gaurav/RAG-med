import React, { useState, useRef, useEffect } from "react";
import { Send, Activity, Loader2, Upload, File, X, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { apiClient } from "../lib/api-client";
import { CHAT_PDF, UPLOAD_PDF } from "../utils/constants";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
}

const UnifiedMedRAGChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [duration, setDuration] = useState('');
  const [patientName, setPatientName] = useState('');
  const [reportType, setReportType] = useState('');
  const [isUploadExpanded, setIsUploadExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasUploadedDocs, setHasUploadedDocs] = useState(false);
  const [collectionName, setCollectionName] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleQuestions = [
    "What is diabetes?",
    "What are the symptoms of hypertension?",
    "How is asthma treated?",
    "What causes migraine headaches?"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Check if there's already a collection name in localStorage
    const storedCollection = localStorage.getItem("collectionName");
    if (storedCollection) {
      setCollectionName(storedCollection);
      setHasUploadedDocs(true);
    }
  }, []);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await apiClient.post(CHAT_PDF, {
        query: userMessage.content,
        collectionName: collectionName || localStorage.getItem("collectionName"),
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: response.data.response || "Sorry, I couldn't process that.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content:
          "Sorry, I encountered an error while processing your question. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
  };

  const handleUploadDocuments = async () => {
    if (files.length === 0) {
      setErrorMessage('Please select at least one PDF file');
      setUploadStatus('error');
      return;
    }

    setUploadStatus('uploading');

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
      const { collectionName: newCollectionName } = response.data;

      if (newCollectionName) {
        localStorage.setItem("collectionName", newCollectionName);
        setCollectionName(newCollectionName);
      }

      console.log("Upload Success:", files.map(f => f.name).join(', '));
      setUploadStatus('success');
      setHasUploadedDocs(true);
      setErrorMessage('');
      
      setTimeout(() => {
        setIsUploadExpanded(false);
        setUploadStatus('idle');
      }, 2000);

    } catch (err) {
      console.error("Upload failed:", err);
      setErrorMessage('Failed to upload files. Please try again.');
      setUploadStatus('error');
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">MedRAG-Agent</h1>
              <p className="text-gray-600 text-sm">Medical Q&A with Knowledge Graph</p>
            </div>
          </div>
          {hasUploadedDocs && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium text-sm">{files.length} Document{files.length > 1 ? 's' : ''} Uploaded</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-8">
        {/* Upload Section */}
        <div className="mt-6">
          <button
            onClick={() => setIsUploadExpanded(!isUploadExpanded)}
            className="w-full flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-all"
          >
            <div className="flex items-center space-x-3">
              <Upload className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <p className="font-semibold text-gray-900">
                  {hasUploadedDocs ? 'Manage Your Medical Reports' : 'Upload Medical Reports (Optional)'}
                </p>
                <p className="text-sm text-gray-600">
                  {hasUploadedDocs 
                    ? 'Add more documents or manage existing ones' 
                    : 'Get personalized insights by uploading your reports'}
                </p>
              </div>
            </div>
            {isUploadExpanded ? (
              <ChevronUp className="w-5 h-5 text-blue-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-blue-600" />
            )}
          </button>

          {isUploadExpanded && (
            <div className="mt-4 p-6 bg-gray-50 border border-gray-200 rounded-xl">
              {/* Optional Input Fields */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration/Time Period (Optional)
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 3 months, 2 weeks, Last year"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-blue-400'
                } ${uploadStatus === 'uploading' ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
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
                  <div className="py-6">
                    <Upload className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                    <p className="text-gray-900 font-medium mb-1">
                      Drop PDF files here or click to browse
                    </p>
                    <p className="text-sm text-gray-500">Multiple files supported</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <File className="w-5 h-5 text-blue-600" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                            <p className="text-gray-500 text-xs">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadStatus === 'uploading' && (
                  <div className="absolute inset-0 bg-white/95 flex items-center justify-center rounded-xl">
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                      <p className="text-gray-900 font-medium">Uploading...</p>
                    </div>
                  </div>
                )}
              </div>

              {uploadStatus === 'success' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-700 text-sm font-medium">Documents uploaded successfully!</p>
                </div>
              )}

              {uploadStatus === 'error' && errorMessage && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700 text-sm">{errorMessage}</p>
                </div>
              )}

              {files.length > 0 && uploadStatus !== 'uploading' && uploadStatus !== 'success' && (
                <button
                  onClick={handleUploadDocuments}
                  className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                >
                  Upload {files.length} Document{files.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto py-8">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center mb-6">
                <div className="p-6 bg-blue-100 rounded-full">
                  <Activity className="w-16 h-16 text-blue-600" />
                </div>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Ask a Medical Question
              </h2>
              <p className="text-gray-600 text-lg mb-12 max-w-2xl mx-auto">
                Get trustworthy medical information powered by knowledge graphs. Upload your reports for personalized insights, or ask general medical questions.
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto">
                {sampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(question)}
                    className="text-left px-6 py-4 bg-white border border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-gray-900"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-3xl rounded-2xl px-6 py-4 ${
                      msg.type === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-3xl rounded-2xl px-6 py-4 bg-gray-100 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-gray-900">Analyzing your question...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 py-6 bg-white sticky bottom-0">
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask a medical question..."
              rows={1}
              className="flex-1 px-5 py-3 border-2 border-gray-300 rounded-2xl resize-none focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              disabled={isLoading}
              style={{ minHeight: '52px', maxHeight: '150px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className={`p-3 rounded-2xl transition-all ${
                !inputMessage.trim() || isLoading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          <p className="text-center text-gray-500 text-sm mt-3">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedMedRAGChat;