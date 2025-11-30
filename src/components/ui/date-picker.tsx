import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: string; // YYYY-MM-DD format
  onChange: (value: string) => void; // Returns YYYY-MM-DD format
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  ({ value, onChange, placeholder = "Selecciona una fecha", disabled, className }, ref) => {
    const [open, setOpen] = React.useState(false);
    
    // Parse YYYY-MM-DD to Date object
    // Add T00:00:00 to avoid timezone issues
    const date = value ? new Date(value + 'T00:00:00') : undefined;
    
    // Format date for display (DD/MM/YYYY)
    const displayValue = date ? format(date, "dd/MM/yyyy", { locale: es }) : "";

    const handleSelect = (selectedDate: Date | undefined) => {
      if (selectedDate) {
        // Convert Date to YYYY-MM-DD format (maintains the format sent to backend)
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        onChange(formattedDate);
        setOpen(false);
      } else {
        // Allow clearing the date
        onChange('');
        setOpen(false);
      }
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              className
            )}
            disabled={disabled}
            type="button"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayValue || <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
            locale={es}
          />
        </PopoverContent>
      </Popover>
    );
  }
);

DatePicker.displayName = "DatePicker";

