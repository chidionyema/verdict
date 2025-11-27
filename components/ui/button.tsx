import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md disabled:bg-indigo-300 disabled:cursor-not-allowed",
        secondary: "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm hover:shadow-md disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed",
        outline: "bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed",
        ghost: "bg-transparent hover:bg-gray-100 text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed",
        destructive: "bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md disabled:bg-red-300 disabled:cursor-not-allowed",
        link: "text-indigo-600 underline-offset-4 hover:underline hover:text-indigo-700",
        default: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md disabled:bg-indigo-300 disabled:cursor-not-allowed",
      },
      size: {
        sm: "px-3 py-1.5 text-sm min-h-[36px] rounded-md",
        default: "px-4 py-2 text-base min-h-[44px]",
        lg: "px-6 py-3 text-lg min-h-[48px] rounded-xl",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading...</span>
          </div>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }