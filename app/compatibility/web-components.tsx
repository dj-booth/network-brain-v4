import React from 'react';

// Web-compatible View component
export const View: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  children, 
  style,
  className = '',
  ...props 
}) => {
  return (
    <div className={`flex flex-col ${className}`} style={style} {...props}>
      {children}
    </div>
  );
};

// Web-compatible Text component
export const Text: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ 
  children, 
  style,
  className = '',
  ...props 
}) => {
  return (
    <p className={`text-gray-900 ${className}`} style={style} {...props}>
      {children}
    </p>
  );
};

// Web-compatible TouchableOpacity component
export const TouchableOpacity: React.FC<{
  onPress?: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}> = ({ 
  onPress, 
  children, 
  style,
  className = '',
}) => {
  return (
    <button 
      onClick={onPress}
      className={`transition-opacity hover:opacity-70 ${className}`}
      style={style}
    >
      {children}
    </button>
  );
};

// Web-compatible StyleSheet
export const StyleSheet = {
  create: (styles: Record<string, React.CSSProperties>) => styles,
}; 