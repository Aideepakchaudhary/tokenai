import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Search, Sparkles, MessageCircle, BarChart3, Loader2 } from "lucide-react";
import { ChatMessage } from "@/lib/types";

interface QueryInputProps {
  onRunQuery: (query: string, chain: string) => void;
}

export function QueryInput({ onRunQuery }: QueryInputProps) {
  const [query, setQuery] = useState("");
  const [selectedChain, setSelectedChain] = useState("ethereum");
  const [mode, setMode] = useState<'query' | 'chat'>('query');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize welcome message when switching to chat mode
  useEffect(() => {
    if (mode === 'chat' && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `👋 **Welcome to ChainMate AI!**

I'm your crypto portfolio analyst. I can help you:

🔍 **Analyze crypto portfolios** - Just provide a wallet address
📊 **Calculate diversity scores** - See how balanced holdings are
💡 **Get AI insights** - Receive personalized recommendations

Try asking:
• "Analyze this wallet: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
• "What can you help me with?"
• "How do I analyze a portfolio?"

What would you like to explore? 🚀`,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [mode, messages.length]);

  const prebuiltQueries = mode === 'chat' ? [
    "Analyze Vitalik's wallet: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "Who are the whale holders of RENDER: 0xA0b86a33E6441e47c4C46ff0ba81F73e2D08dE26",
    "What can you help me with?",
    "Show me portfolio diversity scoring"
  ] : [
    "Show me the top 10 AI tokens by holder count",
    "Analyze whale holders for RENDER token: 0xA0b86a33E6441e47c4C46ff0ba81F73e2D08dE26",
    "Who are the biggest holders of FET: 0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85",
    "Token distribution analysis for The Graph: 0xc944E90C64B2c07662A292be6244BDf05Cda44a7"
  ];

  const chains = [
    { value: "ethereum", label: "Ethereum", icon: "⟠" },
    { value: "arbitrum", label: "Arbitrum", icon: "🔵" },
    { value: "polygon", label: "Polygon", icon: "🔷" },
    { value: "optimism", label: "Optimism", icon: "🔴" },
    { value: "base", label: "Base", icon: "🟦" },
    { value: "bsc", label: "BSC", icon: "🟡" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (mode === 'chat') {
        handleChatMessage(query);
      } else {
        onRunQuery(query, selectedChain);
      }
    }
  };

  const handlePrebuiltQuery = (selectedQuery: string) => {
    if (mode === 'chat') {
      handleChatMessage(selectedQuery);
    } else {
      setQuery(selectedQuery);
      onRunQuery(selectedQuery, selectedChain);
    }
  };

  const handleChatMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          chain: selectedChain,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessages(prev => [...prev, result.data]);
      } else {
        setMessages(prev => [...prev, {
          id: `msg_${Date.now()}_error`,
          role: 'assistant',
          content: `❌ **Error**: ${result.error}\n\nPlease try again or contact support if the issue persists.`,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: `❌ **Network Error**: Failed to send message. Please check your connection and try again.`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 network-bg">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-slide-up">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Ask Anything</span> About Tokens
            </h1>
            <p className="text-xl text-muted-foreground">
              Natural language queries powered by LangChain + The Graph Token API
            </p>
            
            {/* Mode Selector */}
            <div className="flex justify-center mt-8 mb-6">
              <div className="glass-card p-1 rounded-lg flex">
                <Button
                  variant={mode === 'query' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('query')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Query Mode
                </Button>
                <Button
                  variant={mode === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('chat')}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat Mode
                </Button>
              </div>
            </div>
          </div>

          {/* Chat Messages (only in chat mode) */}
          {mode === 'chat' && messages.length > 0 && (
            <Card className="glass-card mb-8 animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Chat with ChainMate AI
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                    <div className={`max-w-2xl rounded-lg p-4 ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground ml-12' 
                        : 'bg-muted text-muted-foreground mr-12'
                    }`}>
                      <div className="prose prose-sm max-w-none">
                        {message.content.split('\n').map((line, index) => {
                          if (line.startsWith('•')) {
                            return (
                              <div key={index} className="ml-4 my-2 flex items-start">
                                <span className="text-accent mr-3 mt-1">•</span>
                                <span>{line.substring(1).trim()}</span>
                              </div>
                            );
                          } else if (line.startsWith('**') && line.endsWith('**')) {
                            return <div key={index} className="font-bold my-3">{line.slice(2, -2)}</div>;
                          } else if (line.includes('**')) {
                            const parts = line.split('**');
                            return (
                              <div key={index} className="my-1">
                                {parts.map((part, i) => 
                                  i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
                                )}
                              </div>
                            );
                          }
                          return line ? <div key={index} className="my-1">{line}</div> : <br key={index} />;
                        })}
                      </div>
                      <div className="mt-2 text-xs opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-muted text-muted-foreground rounded-lg p-4 mr-12 flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>ChainMate is thinking...</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Main Query Input */}
          <div className="glass-card p-8 mb-8 animate-slide-up">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={mode === 'chat' ? "Ask me about crypto portfolios... (e.g., 'Analyze this wallet: 0x...')" : "Ask me anything about tokens..."}
                  className="text-lg p-6 pr-16 bg-muted/50 border-border/50 focus:border-primary"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-2 text-muted-foreground hover:text-primary"
                >
                  <Mic className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Select Chain
                  </label>
                  <Select value={selectedChain} onValueChange={setSelectedChain}>
                    <SelectTrigger className="bg-muted/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card">
                      {chains.map((chain) => (
                        <SelectItem key={chain.value} value={chain.value}>
                          <div className="flex items-center gap-2">
                            <span>{chain.icon}</span>
                            <span>{chain.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  type="submit"
                  size="lg"
                  className="btn-neon px-8 py-3"
                  disabled={!query.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5 mr-2" />
                  )}
                  {isLoading ? 'Processing...' : (mode === 'chat' ? 'Send Message' : 'Run Query')}
                </Button>
              </div>
            </form>
          </div>

          {/* Pre-built Queries */}
          <div className="animate-slide-up">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-accent" />
              <h3 className="text-xl font-semibold">
                {mode === 'chat' ? 'Try these portfolio analysis examples:' : 'Try these examples:'}
              </h3>
            </div>
            
            <div className="grid gap-4">
              {prebuiltQueries.map((prebuiltQuery, index) => (
                <button
                  key={index}
                  onClick={() => handlePrebuiltQuery(prebuiltQuery)}
                  className="glass-card p-4 text-left hover:glow-blue transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-foreground group-hover:text-primary transition-colors">
                      {prebuiltQuery}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      Try it
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}