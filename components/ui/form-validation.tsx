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
              isActive && isValid && "text-green-600 dark:text-green-400",
              isActive && !isValid && "text-red-600 dark:text-red-400",
              !isActive && "text-gray-400 dark:text-gray-500"
            )}
          >
            {isActive ? (
              isValid ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )
            ) : (
              <div className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600" />
            )}
            {rule.message}
          </div>
        );
      })}
    </div>
  );
}

// Password strength meter
interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
  showRequirements?: boolean;
}

export function PasswordStrengthMeter({ password, className, showRequirements = true }: PasswordStrengthMeterProps) {
  const requirements = [
    { name: 'length', check: (p: string) => p.length >= 8, label: 'At least 8 characters' },
    { name: 'lowercase', check: (p: string) => /[a-z]/.test(p), label: 'Lowercase letter' },
    { name: 'uppercase', check: (p: string) => /[A-Z]/.test(p), label: 'Uppercase letter' },
    { name: 'number', check: (p: string) => /[0-9]/.test(p), label: 'Number' },
    { name: 'special', check: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p), label: 'Special character' },
  ];

  const passedCount = requirements.filter(r => r.check(password)).length;
  const strength = password.length === 0 ? 0 : Math.min(100, (passedCount / requirements.length) * 100);

  const getStrengthLabel = () => {
    if (password.length === 0) return '';
    if (passedCount <= 1) return 'Weak';
    if (passedCount <= 2) return 'Fair';
    if (passedCount <= 3) return 'Good';
    if (passedCount <= 4) return 'Strong';
    return 'Excellent';
  };

  const getStrengthColor = () => {
    if (passedCount <= 1) return 'bg-red-500';
    if (passedCount <= 2) return 'bg-orange-500';
    if (passedCount <= 3) return 'bg-yellow-500';
    if (passedCount <= 4) return 'bg-green-500';
    return 'bg-emerald-500';
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500 dark:text-gray-400">Password strength</span>
          <span className={cn(
            "font-medium",
            passedCount <= 1 && "text-red-600 dark:text-red-400",
            passedCount === 2 && "text-orange-600 dark:text-orange-400",
            passedCount === 3 && "text-yellow-600 dark:text-yellow-400",
            passedCount >= 4 && "text-green-600 dark:text-green-400"
          )}>
            {getStrengthLabel()}
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300 rounded-full", getStrengthColor())}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <div className="grid grid-cols-2 gap-1.5">
          {requirements.map((req) => {
            const passed = req.check(password);
            const isActive = password.length > 0;

            return (
              <div
                key={req.name}
                className={cn(
                  "flex items-center gap-1.5 text-xs transition-colors",
                  isActive && passed && "text-green-600 dark:text-green-400",
                  isActive && !passed && "text-gray-400 dark:text-gray-500",
                  !isActive && "text-gray-400 dark:text-gray-500"
                )}
              >
                {isActive && passed ? (
                  <CheckCircle className="w-3 h-3 flex-shrink-0" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-current flex-shrink-0" />
                )}
                <span>{req.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Character counter with visual progress
interface CharacterCounterProps {
  current: number;
  max: number;
  min?: number;
  className?: string;
  showProgress?: boolean;
}

export function CharacterCounter({
  current,
  max,
  min = 0,
  className,
  showProgress = true
}: CharacterCounterProps) {
  const percentage = Math.min(100, (current / max) * 100);
  const isOverLimit = current > max;
  const isUnderMin = current < min;
  const isNearLimit = current >= max * 0.9;

  return (
    <div className={cn("space-y-1", className)}>
      {showProgress && (
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              isOverLimit && "bg-red-500",
              isNearLimit && !isOverLimit && "bg-amber-500",
              !isNearLimit && !isOverLimit && "bg-indigo-500"
            )}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      )}
      <div className={cn(
        "text-xs text-right transition-colors",
        isOverLimit && "text-red-600 dark:text-red-400 font-medium",
        isNearLimit && !isOverLimit && "text-amber-600 dark:text-amber-400",
        !isNearLimit && !isOverLimit && "text-gray-500 dark:text-gray-400"
      )}>
        {current}/{max}
        {min > 0 && current < min && (
          <span className="ml-1 text-amber-600 dark:text-amber-400">
            (min {min})
          </span>
        )}
        {isOverLimit && (
          <span className="ml-1">
            ({current - max} over)
          </span>
        )}
      </div>
    </div>
  );
}

// Enhanced Input with all the bells and whistles
interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helpText?: string;
  error?: string;
  success?: boolean;
  showSuccessIcon?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({
    className,
    label,
    helpText,
    error,
    success,
    showSuccessIcon = true,
    leftIcon,
    rightIcon,
    required,
    disabled,
    ...props
  }, ref) => {
    const hasError = !!error;
    const showSuccess = success && showSuccessIcon && !hasError;

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full rounded-lg border bg-white dark:bg-gray-900 px-3 py-2 text-sm transition-all duration-200",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-800",
              leftIcon && "pl-10",
              (rightIcon || showSuccess || hasError) && "pr-10",
              hasError && "border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500",
              showSuccess && "border-green-300 dark:border-green-700 focus:ring-green-500 focus:border-green-500",
              !hasError && !showSuccess && "border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500",
              className
            )}
            {...props}
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {hasError && <AlertCircle className="w-4 h-4 text-red-500" />}
            {showSuccess && <CheckCircle className="w-4 h-4 text-green-500" />}
            {!hasError && !showSuccess && rightIcon}
          </div>
        </div>

        {(helpText || error) && (
          <p className={cn(
            "text-xs",
            hasError ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
          )}>
            {error || helpText}
          </p>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = "EnhancedInput";

// Enhanced Textarea with character counter
interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helpText?: string;
  error?: string;
  success?: boolean;
  showCharCounter?: boolean;
  minChars?: number;
}

export const EnhancedTextarea = React.forwardRef<HTMLTextAreaElement, EnhancedTextareaProps>(
  ({
    className,
    label,
    helpText,
    error,
    success,
    showCharCounter = false,
    minChars = 0,
    maxLength,
    required,
    disabled,
    value,
    defaultValue,
    onChange,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(String(defaultValue || ''));
    const currentValue = value !== undefined ? String(value) : internalValue;
    const hasError = !!error;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInternalValue(e.target.value);
      onChange?.(e);
    };

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            maxLength={maxLength}
            className={cn(
              "flex min-h-[100px] w-full rounded-lg border bg-white dark:bg-gray-900 px-3 py-2 text-sm transition-all duration-200 resize-none",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-800",
              hasError && "border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500",
              success && !hasError && "border-green-300 dark:border-green-700 focus:ring-green-500 focus:border-green-500",
              !hasError && !success && "border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500",
              className
            )}
            {...props}
          />

          {hasError && (
            <div className="absolute right-3 top-3">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
          )}
          {success && !hasError && (
            <div className="absolute right-3 top-3">
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
          )}
        </div>

        {showCharCounter && maxLength && (
          <CharacterCounter
            current={currentValue.length}
            max={maxLength}
            min={minChars}
          />
        )}

        {(helpText || error) && !showCharCounter && (
          <p className={cn(
            "text-xs",
            hasError ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
          )}>
            {error || helpText}
          </p>
        )}
      </div>
    );
  }
);

EnhancedTextarea.displayName = "EnhancedTextarea";

// Requirement checklist for forms
interface RequirementChecklistProps {
  requirements: {
    id: string;
    label: string;
    met: boolean;
  }[];
  className?: string;
}

export function RequirementChecklist({ requirements, className }: RequirementChecklistProps) {
  const metCount = requirements.filter(r => r.met).length;
  const allMet = metCount === requirements.length;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">Requirements</span>
        <span className={cn(
          "font-medium",
          allMet ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-300"
        )}>
          {metCount}/{requirements.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {requirements.map((req) => (
          <div
            key={req.id}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              req.met
                ? "text-green-600 dark:text-green-400"
                : "text-gray-400 dark:text-gray-500"
            )}
          >
            {req.met ? (
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-current flex-shrink-0" />
            )}
            <span className={req.met ? "line-through opacity-70" : ""}>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}