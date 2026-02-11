'use client';

export function DashboardStyles() {
  return (
    <style jsx global>{`
      .animate-shimmer {
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        background-size: 200% 100%;
        animation: shimmer 2s infinite;
      }

      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      .animate-float {
        animation: float 6s ease-in-out infinite;
      }

      @keyframes float {
        0%,
        100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-10px);
        }
      }

      .animate-bounce-slow {
        animation: bounce-slow 3s ease-in-out infinite;
      }

      @keyframes bounce-slow {
        0%,
        100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-5px);
        }
      }
    `}</style>
  );
}
