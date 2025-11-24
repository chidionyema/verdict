'use client';

interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    id: number;
    title: string;
    subtitle?: string;
  }>;
  className?: string;
}

export function FormProgress({ currentStep, totalSteps, steps, className = '' }: FormProgressProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isUpcoming = step.id > currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              {/* Step Circle */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  transition-all duration-200 relative
                  ${
                    isCompleted
                      ? 'bg-blue-600 text-white'
                      : isCurrent
                      ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }
                `}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span>{step.id}</span>
                )}
              </div>

              {/* Step Label */}
              <div className="mt-2 text-center">
                <p
                  className={`
                    text-xs font-medium
                    ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'}
                  `}
                >
                  {step.title}
                </p>
                {step.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{step.subtitle}</p>
                )}
              </div>

              {/* Connecting Line (except for last step) */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    absolute top-4 h-0.5 transition-all duration-300
                    ${isCompleted ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                  style={{
                    left: '50%',
                    width: `calc(${100 / steps.length}% - 1rem)`,
                    transform: 'translateX(-50%)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current Step Description */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Step {currentStep} of {totalSteps}
        </p>
      </div>
    </div>
  );
}