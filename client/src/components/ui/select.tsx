import { createContext, useContext, useState, type ReactNode } from 'react';

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

export function Select({ 
  value, 
  onValueChange, 
  children 
}: { 
  value: string; 
  onValueChange: (value: string) => void; 
  children: ReactNode;
}) {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      {children}
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ 
  children, 
  className = '',
  ...props
}: { 
  children: ReactNode; 
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <button
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectValue must be used within Select');
  return <span>{context.value || placeholder}</span>;
}

export function SelectContent({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
      <div className="p-1">{children}</div>
    </div>
  );
}

export function SelectItem({ 
  value, 
  children 
}: { 
  value: string; 
  children: ReactNode;
}) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectItem must be used within Select');
  
  return (
    <div
      onClick={() => context.onValueChange(value)}
      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    >
      {children}
    </div>
  );
}
