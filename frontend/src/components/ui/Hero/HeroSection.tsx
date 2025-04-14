import React from "react";
import { motion } from "framer-motion";
import { button as Button } from "motion/react-m";
import { Search } from "lucide-react";
import ChatMessage from "./ChatMessage";
import Input from "./HeroInput";

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
  isUser?: boolean;
}

interface HeroSectionProps {
  onGetStarted?: () => void;
}

const HeroSection = ({ onGetStarted = () => {} }: HeroSectionProps) => {
  // Sample messages for the animated chat interface
  const messages: Message[] = [

      {
        id: 1,
        text: "Hey there! Welcome to Chatbuds 👋",
        sender:"Deekshith",
        timestamp: "10:01 AM",
        isUser: false
      },
      {
        id: 2,
        text: "Thanks! I love how fast the messages appear!",
        sender: "You",
        timestamp: "10:02 AM",
        isUser: true,
      },
      {
        id: 3,
        text: "That's the power of websockets! Real-time communication.",
        sender: "Deekshith",
        timestamp: "10:02 AM",
        isUser: false
      },
      {
        id: 4,
        text: "The user presence indicators are really cool too!",
        sender: "user",
        timestamp: "10:03 AM",
        isUser: true
      },
      {
        id: 5,
        text: "Keep Exploring",
        sender: "Deekshith",
        timestamp: "10:03 AM",
        isUser: false
      },
  ];
  

  return (
    <section className="relative w-full min-h-[700px] bg-gradient-to-br from-neutral-900 to-black flex items-center justify-center px-4 py-16 overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=70')] opacity-5 bg-cover bg-center" />

      <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 z-10">
        {/* Left side - Text content */}
        <div className="flex-1 text-center m-2 lg:text-left">
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Chat in Real-Time with Chatbuds
          </motion.h1>

          <motion.p
            className="text-xl text-neutral-300 mb-8 max-w-xl mx-auto lg:mx-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Experience lightning-fast messaging powered by websockets. Connect,
            chat, and collaborate with friends and colleagues instantly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button
              // size="lg"
              className="bg-blue-600 text-white hover:bg-blue-700 text-lg px-8 py-6 h-auto"
              onClick={onGetStarted}
            >
              Get Started
            </Button>
          </motion.div>
        </div>

        {/* Right side - Animated chat interface */}
        <motion.div
          className="flex-1 md:max-w-xl max-w-xl w-full"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="bg-black rounded-xl shadow-2xl mr-5 mt-2 overflow-hidden border border-neutral-800">
            {/* Chat layout with sidebar and main area */}
            <div className="flex h-[600px]">
              {/* Sidebar */}
              <div className="md:w-[240px] w-[180px] bg-neutral-900 border-r border-neutral-800 flex flex-col">
                {/* Chat header with logo */}
                <div className="md:p-4 p-3 border-b border-neutral-800 flex items-center justify-between">
                  <h3 className="text-white font-medium">ChatBuds</h3>
                  <div className="flex md:space-x-2 space-x-1">
                    <button className="text-neutral-400 hover:text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </button>
                    <button className="text-neutral-400 hover:text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Search bar */}
                <div className="p-3">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="Search Rooms..."
                      className="w-full bg-neutral-800 text-white rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-700"
                    />
                  </div>
                </div>

                {/* User profile */}
                <div className="p-3 border-b border-neutral-800 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden mr-2">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-white text-xs">Deekshith's Group</div>
                </div>
                <div className="p-3 border-b border-neutral-800 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden mr-2">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-white text-xs">Buddies</div>
                </div>
                <div className="p-3 border-b border-neutral-800 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden mr-2">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-white text-xs">Coders</div>
                </div>
                <div className="p-3 border-b border-neutral-800 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden mr-2">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-white text-xs">Trip</div>
                </div>

                {/* Empty space */}
                <div className="flex-grow"></div>
              </div>

              {/* Main chat area */}
              <div className="flex-1 flex flex-col bg-neutral-950">
                {/* Chat header */}
                <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden mr-2">
                      <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=deeks"
                        alt="deeks"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-white font-medium">Deekshith's Group</h3>
                  </div>
                  <button className="text-neutral-400 hover:text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="19" cy="12" r="1"></circle>
                      <circle cx="5" cy="12" r="1"></circle>
                    </svg>
                  </button>
                </div>

                {/* Messages area */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-neutral-950">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      id={message.id}
                      text={message.text}
                      sender={message.sender}
                      timestamp={message.timestamp}
                      isUser={message.isUser}
                    />
                  ))}
                </div>

                {/* Input area */}
                <Input disabled />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;