import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { LandingPage } from "@/components/LandingPage";
import { ChatWithAI } from "@/components/ChatWithAI";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState("landing");

  const handleGetStarted = () => {
    setCurrentScreen("query");
  };


  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case "landing":
        return <LandingPage onGetStarted={handleGetStarted} />;
      case "query":
        return <ChatWithAI />;
      default:
        return <LandingPage onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation 
        currentScreen={currentScreen} 
        onScreenChange={setCurrentScreen} 
      />
      {renderCurrentScreen()}
    </div>
  );
};

export default Index;
