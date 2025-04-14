import React, { useState } from "react";
import { Send } from "lucide-react";

interface InputProps {
  onSend?: (message: string) => void;
  disabled?: boolean;
}

const Input = ({ onSend = () => {}, disabled = false }: InputProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center p-3 border-t border-neutral-800 bg-neutral-900"
    >
      <input
        type="text"
        placeholder="Type a message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled}
        className="flex-1 bg-neutral-800 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="ml-2 p-2 rounded-full bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send size={18} />
      </button>
    </form>
  );
};

export default Input;