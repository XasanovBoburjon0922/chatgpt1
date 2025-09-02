import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-black/85 flex flex-col text-white">
      <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl font-bold mb-4 lg:text-4xl">About Imzo AI</h1>
          <p className="text-gray-300 text-sm mb-4 lg:text-base">
            Imzo AI is an advanced AI-powered platform designed to assist users in generating applications, answering questions, and providing seamless multilingual support. Our mission is to make your interactions with technology intuitive and efficient.
          </p>
          <p className="text-gray-300 text-sm mb-4 lg:text-base">
            Built by a dedicated team, Imzo AI leverages cutting-edge artificial intelligence to empower users with tools for productivity and creativity. Whether you're drafting documents or seeking answers, we're here to help.
          </p>
          <p className="text-gray-400 text-xs mb-6 lg:text-sm">
            Version 1.20 | © 2025 Imzo AI. All rights reserved.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm lg:px-6 lg:py-3 transition-colors duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default About;