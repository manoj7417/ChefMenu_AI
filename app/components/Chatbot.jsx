"use client";
import { useState, useRef, useEffect } from "react";

export default function Chatbot({ menuItems }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I can help you order from our menu. What would you like?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call your Next.js API route (which calls DeepSeek)
      const response = await fetch("/api/chatApi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      const data = await response.json();
      const botReply = data.choices?.[0]?.message;

      if (botReply) {
        setMessages((prev) => [...prev, botReply]);
      }
    } catch (error) {
      console.error("Error calling DeepSeek:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white shadow-lg rounded-lg flex flex-col h-96">
      {/* Chat UI remains the same as before */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-3 ${msg.role === "user" ? "text-right" : ""}`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-gray-500">Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            // onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 border p-2 rounded-l text-black"
            placeholder="Type your message..."
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="bg-amber-600 text-white px-4 rounded-r disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
