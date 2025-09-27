import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { LandingPage } from "@/components/LandingPage";
import { QueryInput } from "@/components/QueryInput";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { DemoShowcase } from "@/components/DemoShowcase";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState("landing");
  const [currentQuery, setCurrentQuery] = useState("");
  const [currentChain, setCurrentChain] = useState("");

  const handleGetStarted = () => {
    setCurrentScreen("query");
  };

  const handleRunQuery = (query: string, chain: string) => {
    setCurrentQuery(query);
    setCurrentChain(chain);
    setCurrentScreen("results");
  };

  const handleNewQuery = () => {
    setCurrentScreen("query");
  };

  const handleManualMode = () => {
    setCurrentScreen("query");
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case "landing":
        return <LandingPage onGetStarted={handleGetStarted} />;
      case "query":
        return <QueryInput onRunQuery={handleRunQuery} />;
      case "results":
        return (
          <ResultsDashboard 
            query={currentQuery} 
            chain={currentChain} 
            onNewQuery={handleNewQuery} 
          />
        );
      case "demo":
        return <DemoShowcase onManualMode={handleManualMode} />;
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
