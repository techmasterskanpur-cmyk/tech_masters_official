import React, { useState, useEffect } from 'react';
import { Clock, Truck, CheckCircle, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface DeliveryTimerProps {
  createdAt: Date;
  estimatedDelivery: Date;
  isDelivered?: boolean;
  deliveredAt?: Date;
  compact?: boolean;
}

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  totalHours: number;
  percentage: number;
}

export const DeliveryTimer: React.FC<DeliveryTimerProps> = ({
  createdAt,
  estimatedDelivery,
  isDelivered = false,
  deliveredAt,
  compact = false,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalHours: 50,
    percentage: 100, // ✅ Fixed: Start full
  });

  useEffect(() => {
    if (isDelivered) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const created = new Date(createdAt).getTime();
      const estimated = new Date(estimatedDelivery).getTime();
      
      const totalDuration = estimated - created;
      const remaining = estimated - now;

      if (remaining <= 0) {
        setTimeRemaining({
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalHours: 0,
          percentage: 0, // ✅ Fixed: Empty when time runs out
        });
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      
      // ✅ Fixed: Math calculates how much time is LEFT as a percentage.
      // Math.max prevents negative percentages if there's a clock sync issue.
      const percentage = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));

      setTimeRemaining({
        hours,
        minutes,
        seconds,
        totalHours: hours + minutes / 60,
        percentage,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [createdAt, estimatedDelivery, isDelivered]);

  // Determine color based on time remaining
  const getStatusColor = () => {
    if (isDelivered) return 'success';
    if (timeRemaining.totalHours > 24) return 'success';
    if (timeRemaining.totalHours > 12) return 'warning';
    return 'destructive';
  };

  const status = getStatusColor();

  if (isDelivered) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-success",
        compact ? "text-sm" : ""
      )}>
        <CheckCircle className={cn("shrink-0", compact ? "h-4 w-4" : "h-5 w-5")} />
        <span className="font-medium">
          Delivered {deliveredAt ? new Date(deliveredAt).toLocaleDateString() : ''}
        </span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Clock className={cn(
          "h-4 w-4",
          status === 'success' && "text-success",
          status === 'warning' && "text-warning",
          status === 'destructive' && "text-destructive"
        )} />
        <span className={cn(
          "text-sm font-medium",
          status === 'success' && "text-success",
          status === 'warning' && "text-warning",
          status === 'destructive' && "text-destructive"
        )}>
          {timeRemaining.hours}h {timeRemaining.minutes}m remaining
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className={cn(
            "h-5 w-5",
            status === 'success' && "text-success",
            status === 'warning' && "text-warning",
            status === 'destructive' && "text-destructive"
          )} />
          <span className="font-medium">Delivery Timeline</span>
        </div>
        {status === 'destructive' && (
          <div className="flex items-center gap-1 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Urgent</span>
          </div>
        )}
      </div>

      {/* Timer Display */}
      <div className={cn(
        "flex items-center justify-center gap-4 p-4 rounded-lg",
        status === 'success' && "bg-success/10",
        status === 'warning' && "bg-warning/10",
        status === 'destructive' && "bg-destructive/10"
      )}>
        <div className="text-center">
          <div className={cn(
            "text-3xl font-bold font-mono",
            status === 'success' && "text-success",
            status === 'warning' && "text-warning",
            status === 'destructive' && "text-destructive"
          )}>
            {String(timeRemaining.hours).padStart(2, '0')}
          </div>
          <div className="text-xs text-muted-foreground uppercase">Hours</div>
        </div>
        <div className="text-2xl font-bold text-muted-foreground">:</div>
        <div className="text-center">
          <div className={cn(
            "text-3xl font-bold font-mono",
            status === 'success' && "text-success",
            status === 'warning' && "text-warning",
            status === 'destructive' && "text-destructive"
          )}>
            {String(timeRemaining.minutes).padStart(2, '0')}
          </div>
          <div className="text-xs text-muted-foreground uppercase">Minutes</div>
        </div>
        <div className="text-2xl font-bold text-muted-foreground">:</div>
        <div className="text-center">
          <div className={cn(
            "text-3xl font-bold font-mono",
            status === 'success' && "text-success",
            status === 'warning' && "text-warning",
            status === 'destructive' && "text-destructive"
          )}>
            {String(timeRemaining.seconds).padStart(2, '0')}
          </div>
          <div className="text-xs text-muted-foreground uppercase">Seconds</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <Progress 
          value={timeRemaining.percentage} 
          className={cn(
            "h-2",
            status === 'success' && "[&>div]:bg-success",
            status === 'warning' && "[&>div]:bg-warning",
            status === 'destructive' && "[&>div]:bg-destructive"
          )}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Order Placed</span>
          <span>Out for Delivery</span>
          <span>Delivered</span>
        </div>
      </div>
    </div>
  );
};