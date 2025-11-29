import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
  variant?: 'default' | 'gradient';
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  className,
  variant = 'default' 
}: StatCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl p-5 transition-all duration-300 hover:shadow-elevated",
      variant === 'gradient' 
        ? "gradient-bg text-primary-foreground" 
        : "bg-card border shadow-card",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn(
            "text-sm font-medium",
            variant === 'gradient' ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className={cn(
              "text-sm",
              variant === 'gradient' ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {description}
            </p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-sm",
              trend.positive ? "text-success" : "text-destructive"
            )}>
              <span>{trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className={variant === 'gradient' ? "text-primary-foreground/60" : "text-muted-foreground"}>
                vs. periodo anterior
              </span>
            </div>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl",
          variant === 'gradient' 
            ? "bg-primary-foreground/20" 
            : "bg-primary/10"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            variant === 'gradient' ? "text-primary-foreground" : "text-primary"
          )} />
        </div>
      </div>
    </div>
  );
}
