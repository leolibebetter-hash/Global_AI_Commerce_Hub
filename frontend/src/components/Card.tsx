import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-surface rounded-lg border border-border shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
}
