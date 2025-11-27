import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const typographyVariants = cva(
  "text-gray-900",
  {
    variants: {
      variant: {
        // Display (Hero headlines only)
        display: "text-4xl md:text-6xl font-bold leading-tight tracking-tight",
        
        // H1 (Page titles)
        h1: "text-3xl md:text-4xl font-bold leading-tight tracking-tight",
        
        // H2 (Section headers)
        h2: "text-2xl md:text-3xl font-semibold leading-tight",
        
        // H3 (Subsection headers) 
        h3: "text-xl md:text-2xl font-semibold leading-normal",
        
        // H4 (Card titles, minor headers)
        h4: "text-lg md:text-xl font-medium leading-normal",
        
        // Body text
        "body-large": "text-lg leading-relaxed",
        "body": "text-base leading-normal",
        "body-small": "text-sm leading-normal",
        
        // Labels and captions
        "caption": "text-sm font-medium",
        "caption-small": "text-xs font-medium uppercase tracking-wide",
        
        // Muted text
        "muted": "text-gray-500 text-sm",
        "muted-large": "text-gray-600 text-base",
      },
      color: {
        default: "text-gray-900",
        muted: "text-gray-500", 
        "muted-dark": "text-gray-600",
        primary: "text-indigo-600",
        secondary: "text-purple-600",
        success: "text-green-600", 
        warning: "text-amber-600",
        danger: "text-red-600",
        white: "text-white",
      },
    },
    defaultVariants: {
      variant: "body",
      color: "default",
    },
  }
)

export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof typographyVariants> {
  as?: React.ElementType
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, color, as, ...props }, ref) => {
    // Smart element selection based on variant
    const getDefaultElement = (variant: string | null | undefined) => {
      switch (variant) {
        case 'display':
        case 'h1':
          return 'h1'
        case 'h2':
          return 'h2'
        case 'h3':
          return 'h3'
        case 'h4':
          return 'h4'
        case 'caption':
        case 'caption-small':
          return 'span'
        default:
          return 'p'
      }
    }
    
    const Component = as || getDefaultElement(variant)
    
    return (
      <Component
        className={cn(typographyVariants({ variant, color, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Typography.displayName = "Typography"

// Convenience components for common patterns
export const PageTitle = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant' | 'as'>>(
  (props, ref) => <Typography variant="h1" as="h1" ref={ref} {...props} />
)
PageTitle.displayName = "PageTitle"

export const SectionTitle = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant' | 'as'>>(
  (props, ref) => <Typography variant="h2" as="h2" ref={ref} {...props} />
)
SectionTitle.displayName = "SectionTitle"

export const CardTitle = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant' | 'as'>>(
  (props, ref) => <Typography variant="h4" as="h3" ref={ref} {...props} />
)
CardTitle.displayName = "CardTitle"

export const BodyText = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant' | 'as'>>(
  (props, ref) => <Typography variant="body" as="p" ref={ref} {...props} />
)
BodyText.displayName = "BodyText"

export const Caption = React.forwardRef<HTMLSpanElement, Omit<TypographyProps, 'variant' | 'as'>>(
  (props, ref) => <Typography variant="caption" as="span" ref={ref} {...props} />
)
Caption.displayName = "Caption"

export { Typography, typographyVariants }