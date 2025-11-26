import * as React from "react"
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  message?: string;
  type?: 'error' | 'warning' | 'success' | 'info';
}

// Real-time validation hook
export function useValidation(
  value: any,
  rules: ((value: any) => ValidationResult)[],
  debounceMs: number = 300
) {
  const [validation, setValidation] = React.useState<ValidationResult>({ isValid: true });
  const [isDirty, setIsDirty] = React.useState(false);

  React.useEffect(() => {
    if (!isDirty) return;

    const timeoutId = setTimeout(() => {
      // Run all validation rules
      for (const rule of rules) {
        const result = rule(value);
        if (!result.isValid) {
          setValidation(result);
          return;
        }
      }
      
      // All rules passed
      setValidation({ isValid: true, type: 'success' });
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, rules, debounceMs, isDirty]);

  const markDirty = React.useCallback(() => {
    setIsDirty(true);
  }, []);

  const reset = React.useCallback(() => {
    setIsDirty(false);
    setValidation({ isValid: true });
  }, []);

  return {
    validation,
    isDirty,
    markDirty,
    reset
  };
}

// Common validation rules
export const validationRules = {
  required: (message = "This field is required") => (value: any): ValidationResult => ({
    isValid: value != null && value !== '' && value !== undefined,
    message: message,
    type: 'error' as const
  }),

  minLength: (min: number, message?: string) => (value: string): ValidationResult => ({
    isValid: !value || value.length >= min,
    message: message || `Must be at least ${min} characters`,
    type: 'error' as const
  }),

  maxLength: (max: number, message?: string) => (value: string): ValidationResult => ({
    isValid: !value || value.length <= max,
    message: message || `Must be no more than ${max} characters`,
    type: 'error' as const
  }),

  email: (message = "Please enter a valid email address") => (value: string): ValidationResult => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: !value || emailRegex.test(value),
      message: message,
      type: 'error' as const
    };
  },

  fileSize: (maxSizeMB: number, message?: string) => (file: File): ValidationResult => ({
    isValid: !file || file.size <= maxSizeMB * 1024 * 1024,
    message: message || `File must be smaller than ${maxSizeMB}MB`,
    type: 'error' as const
  }),

  fileType: (allowedTypes: string[], message?: string) => (file: File): ValidationResult => ({
    isValid: !file || allowedTypes.includes(file.type),
    message: message || `File type must be one of: ${allowedTypes.join(', ')}`,
    type: 'error' as const
  }),

  custom: (fn: (value: any) => boolean, message: string) => (value: any): ValidationResult => ({
    isValid: fn(value),
    message: message,
    type: 'error' as const
  })
};

// Form field wrapper with validation feedback
interface ValidatedFieldProps {
  children: React.ReactNode;
  validation?: ValidationResult;
  isDirty?: boolean;
  label?: string;
  helpText?: string;
  required?: boolean;
  className?: string;
}

export function ValidatedField({ 
  children, 
  validation, 
  isDirty = false,
  label, 
  helpText, 
  required = false,
  className 
}: ValidatedFieldProps) {
  const showValidation = isDirty && validation && !validation.isValid;
  const showSuccess = isDirty && validation && validation.isValid && validation.type === 'success';

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {children}
        
        {/* Success indicator */}
        {showSuccess && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
        )}
        
        {/* Error indicator */}
        {showValidation && validation.type === 'error' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>

      {/* Help text */}
      {helpText && !showValidation && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}

      {/* Validation message */}
      {showValidation && (
        <div className={cn(
          "flex items-center gap-2 text-xs",
          validation.type === 'error' && "text-red-600",
          validation.type === 'warning' && "text-yellow-600",
          validation.type === 'info' && "text-blue-600"
        )}>
          {validation.type === 'error' && <AlertCircle className="w-3 h-3" />}
          {validation.type === 'warning' && <AlertCircle className="w-3 h-3" />}
          {validation.type === 'info' && <Info className="w-3 h-3" />}
          {validation.message}
        </div>
      )}
    </div>
  );
}

// Enhanced input component with validation
interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  validationRules?: ((value: any) => ValidationResult)[];
  label?: string;
  helpText?: string;
  onValidationChange?: (validation: ValidationResult) => void;
}

export const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ 
    className, 
    validationRules = [], 
    label, 
    helpText,
    onValidationChange,
    required,
    onBlur,
    onChange,
    ...props 
  }, ref) => {
    const [value, setValue] = React.useState(props.defaultValue || '');
    const { validation, isDirty, markDirty } = useValidation(value, validationRules);

    React.useEffect(() => {
      onValidationChange?.(validation);
    }, [validation, onValidationChange]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      markDirty();
      onBlur?.(e);
    };

    const inputClasses = cn(
      "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
      "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
      "placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
      "disabled:cursor-not-allowed disabled:opacity-50",
      isDirty && !validation.isValid && "border-red-300 focus:ring-red-500",
      isDirty && validation.isValid && validation.type === 'success' && "border-green-300 focus:ring-green-500",
      className
    );

    return (
      <ValidatedField
        validation={validation}
        isDirty={isDirty}
        label={label}
        helpText={helpText}
        required={required}
      >
        <input
          {...props}
          ref={ref}
          className={inputClasses}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </ValidatedField>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";

// Enhanced textarea component with validation
interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  validationRules?: ((value: any) => ValidationResult)[];
  label?: string;
  helpText?: string;
  showCharCount?: boolean;
  onValidationChange?: (validation: ValidationResult) => void;
}

export const ValidatedTextarea = React.forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ 
    className, 
    validationRules = [], 
    label, 
    helpText,
    showCharCount = false,
    maxLength,
    onValidationChange,
    required,
    onBlur,
    onChange,
    ...props 
  }, ref) => {
    const [value, setValue] = React.useState(props.defaultValue || '');
    const { validation, isDirty, markDirty } = useValidation(value, validationRules);

    React.useEffect(() => {
      onValidationChange?.(validation);
    }, [validation, onValidationChange]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      markDirty();
      onBlur?.(e);
    };

    const textareaClasses = cn(
      "flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
      "ring-offset-background placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
      "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
      isDirty && !validation.isValid && "border-red-300 focus:ring-red-500",
      isDirty && validation.isValid && validation.type === 'success' && "border-green-300 focus:ring-green-500",
      className
    );

    return (
      <ValidatedField
        validation={validation}
        isDirty={isDirty}
        label={label}
        helpText={helpText}
        required={required}
      >
        <div className="relative">
          <textarea
            {...props}
            ref={ref}
            className={textareaClasses}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength={maxLength}
          />
          
          {showCharCount && maxLength && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              {String(value).length}/{maxLength}
            </div>
          )}
        </div>
      </ValidatedField>
    );
  }
);

ValidatedTextarea.displayName = "ValidatedTextarea";

// Form validation summary component
interface ValidationSummaryProps {
  validations: Record<string, ValidationResult>;
  className?: string;
}

export function ValidationSummary({ validations, className }: ValidationSummaryProps) {
  const errors = Object.entries(validations).filter(([_, validation]) => 
    !validation.isValid && validation.type === 'error'
  );

  if (errors.length === 0) return null;

  return (
    <div className={cn(
      "rounded-md bg-red-50 border border-red-200 p-4",
      className
    )}>
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
        <h3 className="text-sm font-medium text-red-800">
          Please fix the following errors:
        </h3>
      </div>
      <ul className="mt-2 text-sm text-red-700 space-y-1">
        {errors.map(([field, validation]) => (
          <li key={field}>• {validation.message}</li>
        ))}
      </ul>
    </div>
  );
}

// Progressive validation - shows hints as user types
interface ProgressiveValidationProps {
  value: string;
  rules: {
    name: string;
    validator: (value: string) => boolean;
    message: string;
  }[];
  className?: string;
}

export function ProgressiveValidation({ value, rules, className }: ProgressiveValidationProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {rules.map((rule) => {
        const isValid = rule.validator(value);
        const isActive = value.length > 0;
        
        return (
          <div 
            key={rule.name}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              isActive && isValid && "text-green-600",
              isActive && !isValid && "text-red-600",
              !isActive && "text-gray-400"
            )}
          >
            {isActive ? (
              isValid ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )
            ) : (
              <div className="w-3 h-3 rounded-full border border-gray-300" />
            )}
            {rule.message}
          </div>
        );
      })}
    </div>
  );
}