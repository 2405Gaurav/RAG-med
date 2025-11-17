import React, { useState, useRef, useEffect } from "react";
import { Send, Activity, Loader2 } from "lucide-react";
import { apiClient } from "../lib/api-client";
import { CHAT_PDF } from "../utils/constants";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sample questions
  const sampleQuestions = [
    "What is diabetes?",
    "What are the symptoms of hypertension?",
    "How is asthma treated?",
    "What causes migraine headaches?"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        collectionName: localStorage.getItem("collectionName"),
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

  const handleSampleQuestion = (question: string) => {
    handleSendMessage(question);
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
      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-8">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto py-8">
          {messages.length === 0 ? (
            // Empty State
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
                Get trustworthy medical information powered by knowledge graphs and verified sources. All answers include citations.
              </p>

              {/* Sample Questions */}
              <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto">
                {sampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSampleQuestion(question)}
                    className="text-left px-6 py-4 bg-white border border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-gray-900"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Messages
            <div className="space-y-6">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.type === "user" ? "justify-end" : "justify-start"
                  }`}
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

      {/* Footer Badge */}
      <div className="text-center pb-4">
        <p className="text-gray-500 text-xs flex items-center justify-center gap-1">
          <span className="font-semibold">⚡</span> Made in Bolt
        </p>
      </div>
    </div>
  );
};

export default Chat;