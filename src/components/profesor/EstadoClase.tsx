import { CheckCircle2, XCircle, FileText, ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EstadoClaseProps {
  tieneGuia: boolean;
  tienePreQuiz: boolean;
  tienePostQuiz: boolean;
  className?: string;
}

export const EstadoClase = ({ tieneGuia, tienePreQuiz, tienePostQuiz, className = '' }: EstadoClaseProps) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-1.5">
        {tieneGuia ? (
          <CheckCircle2 className="w-4 h-4 text-success" />
        ) : (
          <XCircle className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <FileText className="w-3 h-3" />
          Guía
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {tienePreQuiz ? (
          <CheckCircle2 className="w-4 h-4 text-success" />
        ) : (
          <XCircle className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <ClipboardList className="w-3 h-3" />
          Pre-quiz
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {tienePostQuiz ? (
          <CheckCircle2 className="w-4 h-4 text-success" />
        ) : (
          <XCircle className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <ClipboardList className="w-3 h-3" />
          Post-quiz
        </span>
      </div>
    </div>
  );
};

