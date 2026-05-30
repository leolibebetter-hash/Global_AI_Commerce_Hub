import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white rounded-lg border border-edge shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
}
