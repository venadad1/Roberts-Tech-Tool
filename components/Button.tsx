import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  isLoading, 
  ...props 
}) => {
  const baseStyle = "px-4 py-2 rounded font-medium transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-brand-panel";
  
  const variants = {
    primary: "bg-brand-red hover:bg-brand-redHover text-white shadow-md focus:ring-brand-red",
    secondary: "bg-brand-surface hover:bg-gray-600 text-gray-200 border border-gray-600 focus:ring-gray-500",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    icon: "p-2 bg-transparent hover:bg-gray-700 text-gray-400 hover:text-white rounded-full",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      ) : children}
    </button>
  );
};
