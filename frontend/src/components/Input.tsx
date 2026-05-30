import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1">
        <label htmlFor={inputId} className="block text-sm font-medium text-content">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border border-edge bg-white px-4 py-2 text-sm text-content
            placeholder:text-gray-400 transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-red-500 focus:ring-red-500" : ""}
            ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
