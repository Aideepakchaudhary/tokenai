import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff, AlertTriangle, TrendingUp, TrendingDown, X } from "lucide-react";

interface WhaleAlert {
  id: string;
  whaleAddress: string;
  alertType: 'large_transfer' | 'new_position' | 'whale_movement';
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
}

interface WhaleAlertsProps {
  followedWhales: Set<string>;
}

export function WhaleAlerts({ followedWhales }: WhaleAlertsProps) {
  const [alerts, setAlerts] = useState<WhaleAlert[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [showAlerts, setShowAlerts] = useState(false);

  // Generate mock alerts for followed whales
  useEffect(() => {
    if (followedWhales.size === 0 || !alertsEnabled) return;

    const generateMockAlert = () => {
      const whaleAddresses = Array.from(followedWhales);
      if (whaleAddresses.length === 0) return;

      const randomWhale = whaleAddresses[Math.floor(Math.random() * whaleAddresses.length)];
      const alertTypes = ['large_transfer', 'new_position', 'whale_movement'] as const;
      const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      
      const messages = {
        large_transfer: `Whale ${randomWhale.slice(0, 6)}...${randomWhale.slice(-4)} transferred $2.3M worth of tokens`,
        new_position: `Whale ${randomWhale.slice(0, 6)}...${randomWhale.slice(-4)} opened new position worth $890K`,
        whale_movement: `Whale ${randomWhale.slice(0, 6)}...${randomWhale.slice(-4)} moved tokens to new address`
      };

      const severityLevels = ['low', 'medium', 'high', 'critical'] as const;
      const randomSeverity = severityLevels[Math.floor(Math.random() * severityLevels.length)];

      const newAlert: WhaleAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        whaleAddress: randomWhale,
        alertType: randomType,
        message: messages[randomType],
        timestamp: new Date().toISOString(),
        severity: randomSeverity,
        read: false
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 19)]); // Keep only 20 most recent alerts
    };

    // Generate alerts every 30-60 seconds for demo
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of generating an alert
        generateMockAlert();
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [followedWhales, alertsEnabled]);

  const unreadCount = alerts.filter(alert => !alert.read).length;

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };

  const deleteAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 border-red-500';
      case 'high': return 'text-orange-500 border-orange-500';
      case 'medium': return 'text-yellow-500 border-yellow-500';
      case 'low': return 'text-green-500 border-green-500';
      default: return 'text-gray-500 border-gray-500';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'large_transfer': return <TrendingDown className="w-4 h-4" />;
      case 'new_position': return <TrendingUp className="w-4 h-4" />;
      case 'whale_movement': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative">
      {/* Alert Toggle Button */}
      <Button
        variant={showAlerts ? "default" : "outline"}
        size="sm"
        onClick={() => setShowAlerts(!showAlerts)}
        className="relative"
      >
        {alertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Alerts Panel */}
      {showAlerts && (
        <Card className="absolute right-0 top-12 w-96 max-h-96 overflow-hidden z-50 glass-card border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="w-5 h-5" />
                Whale Alerts ({alerts.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAlertsEnabled(!alertsEnabled)}
                  className="h-8"
                >
                  {alertsEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAlerts(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {alerts.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {followedWhales.size === 0 
                    ? "Follow some whales to receive alerts"
                    : "No alerts yet. Monitoring your whales..."}
                </p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 p-4">
                {alerts.map((alert) => (
                  <Card 
                    key={alert.id} 
                    className={`${alert.read ? 'bg-muted/30' : 'bg-background'} border-l-4 ${getSeverityColor(alert.severity)} transition-all hover:shadow-md cursor-pointer`}
                    onClick={() => markAsRead(alert.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <div className={`mt-0.5 ${getSeverityColor(alert.severity)}`}>
                            {getAlertIcon(alert.alertType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-relaxed">{alert.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {alert.severity}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(alert.timestamp).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAlert(alert.id);
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}