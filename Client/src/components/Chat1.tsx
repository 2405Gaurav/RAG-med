import React, { useState, useRef, useEffect } from "react";
import { Send, FileText, Bot, User, Loader2, MessageSquare, RotateCcw } from "lucide-react";
import { apiClient } from "../lib/api-client";
import { CHAT_PDF } from "../utils/constants";
interface Message {
    id: string;
    type: 'user' | 'bot';
    content: string;
    timestamp: Date;
}

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            type: 'bot',
            content: 'Hello! I\'ve Ask me anything and I\'ll help you understand it better.',
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: inputMessage.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await apiClient.post(CHAT_PDF, {
                query: userMessage.content,
                collectionName: localStorage.getItem("collectionName")
            });

            const data = response.data;

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                content: data.response || 'Sorry, I couldn\'t process your question.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                content: 'Sorry, I encountered an error while processing your question. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };


    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const resetChat = () => {
        setMessages([
            {
                id: '1',
                type: 'bot',
                content: 'Hello! I\'ve successfully processed your PDF document. Ask me anything about its contents and I\'ll help you understand it better.',
                timestamp: new Date()
            }
        ]);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex flex-col relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '4s' }}></div>
            </div>

            {/* Header */}
            <div className="relative z-10 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 p-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl blur-md opacity-50"></div>
                            <div className="relative p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                                <FileText className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                Medical RAG Assistant
                            </h1>
                            <p className="text-gray-400 text-sm">Powered by AI • Ask questions about your document</p>
                        </div>
                    </div>
                    <button
                        onClick={resetChat}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-200 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset</span>
                    </button>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 relative z-10 overflow-hidden">
                <div className="h-full max-w-4xl mx-auto p-6 flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-6 pb-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex items-start space-x-4 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                                    }`}
                            >
                                {/* Avatar */}
                                <div className={`flex-shrink-0 ${message.type === 'user' ? 'order-first' : ''}`}>
                                    <div className={`relative p-2 rounded-full ${message.type === 'user'
                                            ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                                            : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                        }`}>
                                        <div className={`absolute inset-0 rounded-full blur-md opacity-30 ${message.type === 'user'
                                                ? 'bg-gradient-to-r from-emerald-400 to-green-400'
                                                : 'bg-gradient-to-r from-blue-400 to-cyan-400'
                                            }`}></div>
                                        <div className="relative">
                                            {message.type === 'user' ? (
                                                <User className="w-6 h-6 text-white" />
                                            ) : (
                                                <Bot className="w-6 h-6 text-white" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Message Content */}
                                <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                                    <div className={`inline-block max-w-3xl ${message.type === 'user'
                                            ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30'
                                            : 'bg-gray-800/60 border border-gray-700/50'
                                        } rounded-2xl p-4 backdrop-blur-sm`}>
                                        <p className="text-white leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                    <div className={`mt-2 text-xs text-gray-500 ${message.type === 'user' ? 'text-right' : 'text-left'
                                        }`}>
                                        {formatTime(message.timestamp)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="relative p-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500">
                                        <div className="absolute inset-0 rounded-full blur-md opacity-30 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                                        <div className="relative">
                                            <Bot className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="inline-block bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4 backdrop-blur-sm">
                                        <div className="flex items-center space-x-2">
                                            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                            <span className="text-gray-300">Analyzing your question...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-gray-700/50 pt-6">
                        <div className="flex items-end space-x-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask me anything about your PDF..."
                                        disabled={isLoading}
                                        className="w-full px-6 py-4 bg-gray-800/60 border border-gray-700/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                        <MessageSquare className="w-5 h-5 text-gray-500" />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputMessage.trim() || isLoading}
                                className="relative p-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-700 rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed shadow-xl disabled:shadow-none"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur-xl opacity-50"></div>
                                <div className="relative">
                                    {isLoading ? (
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    ) : (
                                        <Send className="w-6 h-6 text-white" />
                                    )}
                                </div>
                            </button>
                        </div>
                        <p className="text-gray-500 text-sm mt-3 text-center">
                            Press Enter to send • The AI will analyze your PDF to provide accurate answers
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;