import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-lg' },
    md: { icon: 'w-8 h-8', text: 'text-xl' },
    lg: { icon: 'w-10 h-10', text: 'text-2xl' }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="gradient-bg rounded-xl p-2 shadow-soft">
        <Brain className={cn(sizes[size].icon, 'text-primary-foreground')} />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn(sizes[size].text, 'font-bold gradient-text')}>
            EduThink
          </span>
          {size === 'lg' && (
            <span className="text-xs text-muted-foreground">
              Plataforma Educativa con IA
            </span>
          )}
        </div>
      )}
    </div>
  );
}
