import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      primary: 'bg-ru-red-impact text-white hover:bg-ru-berry active:bg-ru-maroon focus-visible:ring-ru-red-impact shadow-sm hover:shadow',
      secondary: 'bg-ru-light-gray text-ru-text hover:bg-ru-border active:bg-ru-border focus-visible:ring-ru-gray',
      ghost: 'bg-transparent text-ru-text hover:bg-ru-light-gray active:bg-ru-border focus-visible:ring-ru-gray',
      danger: 'bg-ru-ladybug text-white hover:bg-ru-berry active:bg-ru-maroon focus-visible:ring-ru-ladybug shadow-sm hover:shadow',
    };

    const sizeStyles = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
