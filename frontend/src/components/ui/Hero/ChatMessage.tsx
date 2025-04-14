import { motion } from "framer-motion";

interface ChatMessageProps {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
  isUser?: boolean;
}

const ChatMessage = ({
  text,
  sender,
  timestamp,
  isUser = false,
}: ChatMessageProps) => {
  return (
    <motion.div
      className={`flex items-start mb-4 ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {!isUser && (
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${sender}`}
              alt={sender}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
      <div className={`max-w-xs ${isUser ? "order-1" : "order-2"}`}>
        {!isUser && (
          <div className="text-orange-500 text-sm font-medium mb-1">
            {sender}
          </div>
        )}
        <div
          className={`md:p-3 p-2 rounded-lg ${
            isUser
              ? "bg-blue-600 text-white rounded-br-none"
              : "bg-neutral-800 text-white rounded-bl-none"
          }`}
        >
          <p className="text-sm">{text}</p>
        </div>
        <div className="text-xs text-neutral-500 mt-1">{timestamp}</div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 ml-3 order-2">
          <div className="md:w-8 md:h-8 h-6 w-6 rounded-full bg-blue-600 overflow-hidden flex items-center justify-center">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
              alt="You"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessage;