import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavigationProps {
  currentScreen: string;
  onScreenChange: (screen: string) => void;
}

export function Navigation({ currentScreen, onScreenChange }: NavigationProps) {
  const screens = [
    { id: "landing", label: "Home" },
    { id: "query", label: "Query" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src="/ChainMate%20logo.png"
              alt="ChainMate"
              className="w-8 h-8 rounded-lg"
            />
            <span className="text-xl font-bold text-gradient">ChainMate</span>
            <Badge variant="secondary" className="ml-2">
              ETHGlobal
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            {screens.map((screen) => (
              <Button
                key={screen.id}
                variant={currentScreen === screen.id ? "default" : "ghost"}
                className={
                  currentScreen === screen.id ? "btn-neon" : "btn-ghost-neon"
                }
                onClick={() => onScreenChange(screen.id)}
              >
                {screen.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
