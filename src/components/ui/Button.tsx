import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'kakao'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-pink-500 hover:bg-pink-600 text-white shadow-sm': variant === 'primary',
            'bg-gray-100 hover:bg-gray-200 text-gray-800': variant === 'secondary',
            'border-2 border-pink-500 text-pink-500 hover:bg-pink-50': variant === 'outline',
            'text-gray-700 hover:bg-gray-100': variant === 'ghost',
            'bg-[#FEE500] hover:bg-[#F0DA00] text-[#191919] gap-2': variant === 'kakao',
          },
          {
            'text-sm px-3 py-2': size === 'sm',
            'text-base px-5 py-3': size === 'md',
            'text-lg px-7 py-4': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            처리중...
          </span>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
