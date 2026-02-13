'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote, Verified, Briefcase, Heart, Camera, Mail, Shirt } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  category: 'dating' | 'career' | 'style' | 'business' | 'general';
  rating: number;
  avatarGradient: string;
  helpful?: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    quote: "My friends said my dating photos were fine. Three strangers told me the truth - my main photo was killing my matches. Changed it, and got 10x more likes.",
    name: "Verified User #1204",
    role: "Marketing Professional",
    category: 'dating',
    rating: 5,
    avatarGradient: "from-pink-400 to-rose-500",
    helpful: 47
  },
  {
    id: '2',
    quote: "I was torn between two job offers. Three strangers gave me perspectives I hadn't considered - including salary negotiation tips that helped me secure 15% more.",
    name: "Verified User #0892",
    role: "Software Engineer",
    category: 'career',
    rating: 5,
    avatarGradient: "from-blue-400 to-indigo-500",
    helpful: 31
  },
  {
    id: '3',
    quote: "Before my big interview, I submitted my outfit. One reviewer noticed my tie was too casual for finance. That detail probably saved the interview.",
    name: "Verified User #0567",
    role: "Finance Analyst",
    category: 'style',
    rating: 5,
    avatarGradient: "from-emerald-400 to-teal-500",
    helpful: 23
  },
  {
    id: '4',
    quote: "Shared my startup pitch deck. One reviewer caught a major flaw in my pricing model that could have cost me thousands. Worth every penny.",
    name: "Verified User #0341",
    role: "Startup Founder",
    category: 'business',
    rating: 5,
    avatarGradient: "from-purple-400 to-violet-500",
    helpful: 38
  },
  {
    id: '5',
    quote: "Had a delicate email to send to a difficult client. The feedback helped me strike the right tone - professional but firm. Client responded positively.",
    name: "Verified User #0723",
    role: "Account Manager",
    category: 'general',
    rating: 5,
    avatarGradient: "from-orange-400 to-amber-500",
    helpful: 19
  }
];

const categoryIcons = {
  dating: Heart,
  career: Briefcase,
  style: Shirt,
  business: Mail,
  general: Star
};

const categoryLabels = {
  dating: 'Dating Profile',
  career: 'Career Decision',
  style: 'Style Check',
  business: 'Business',
  general: 'General'
};

interface TestimonialsProps {
  variant?: 'carousel' | 'grid';
  showTitle?: boolean;
  className?: string;
}

export function Testimonials({ variant = 'carousel', showTitle = true, className }: TestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance carousel
  useEffect(() => {
    if (variant !== 'carousel' || !isAutoPlaying) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [variant, isAutoPlaying]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  if (variant === 'grid') {
    return (
      <section className={cn("py-16", className)}>
        {showTitle && (
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Real feedback. Real results.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See what happens when you get honest opinions from strangers
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.slice(0, 3).map((testimonial, index) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
          ))}
        </div>
      </section>
    );
  }

  // Carousel variant
  return (
    <section className={cn("py-16", className)}>
      {showTitle && (
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Real feedback. Real results.
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See what happens when you get honest opinions from strangers
          </p>
        </div>
      )}

      <div className="relative max-w-4xl mx-auto px-4">
        {/* Main testimonial */}
        <div className="relative overflow-hidden min-h-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
            >
              <TestimonialCardLarge testimonial={TESTIMONIALS[currentIndex]} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={handlePrev}
            className="w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex gap-2">
            {TESTIMONIALS.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(index);
                }}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentIndex
                    ? "bg-indigo-600 w-6"
                    : "bg-gray-300 hover:bg-gray-400"
                )}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  const CategoryIcon = categoryIcons[testimonial.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
    >
      {/* Category badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          testimonial.category === 'dating' && "bg-pink-100",
          testimonial.category === 'career' && "bg-blue-100",
          testimonial.category === 'style' && "bg-emerald-100",
          testimonial.category === 'business' && "bg-purple-100",
          testimonial.category === 'general' && "bg-orange-100"
        )}>
          <CategoryIcon className={cn(
            "w-4 h-4",
            testimonial.category === 'dating' && "text-pink-600",
            testimonial.category === 'career' && "text-blue-600",
            testimonial.category === 'style' && "text-emerald-600",
            testimonial.category === 'business' && "text-purple-600",
            testimonial.category === 'general' && "text-orange-600"
          )} />
        </div>
        <span className="text-sm font-medium text-gray-600">
          {categoryLabels[testimonial.category]}
        </span>
      </div>

      {/* Rating */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "w-4 h-4",
              i < testimonial.rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-200"
            )}
          />
        ))}
      </div>

      {/* Quote */}
      <Quote className="w-8 h-8 text-indigo-100 mb-2" />
      <p className="text-gray-700 mb-6 leading-relaxed">
        "{testimonial.quote}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold text-sm",
          testimonial.avatarGradient
        )}>
          <Verified className="w-5 h-5" />
        </div>
        <div>
          <div className="font-medium text-gray-900 flex items-center gap-1">
            {testimonial.name}
          </div>
          <div className="text-sm text-gray-500">{testimonial.role}</div>
        </div>
      </div>

      {testimonial.helpful && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
          {testimonial.helpful} people found this helpful
        </div>
      )}
    </motion.div>
  );
}

function TestimonialCardLarge({ testimonial }: { testimonial: Testimonial }) {
  const CategoryIcon = categoryIcons[testimonial.category];

  return (
    <div>
      {/* Top row: Category and Rating */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            testimonial.category === 'dating' && "bg-pink-100",
            testimonial.category === 'career' && "bg-blue-100",
            testimonial.category === 'style' && "bg-emerald-100",
            testimonial.category === 'business' && "bg-purple-100",
            testimonial.category === 'general' && "bg-orange-100"
          )}>
            <CategoryIcon className={cn(
              "w-5 h-5",
              testimonial.category === 'dating' && "text-pink-600",
              testimonial.category === 'career' && "text-blue-600",
              testimonial.category === 'style' && "text-emerald-600",
              testimonial.category === 'business' && "text-purple-600",
              testimonial.category === 'general' && "text-orange-600"
            )} />
          </div>
          <span className="font-medium text-gray-900">
            {categoryLabels[testimonial.category]}
          </span>
        </div>

        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-5 h-5",
                i < testimonial.rating
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-200"
              )}
            />
          ))}
        </div>
      </div>

      {/* Quote */}
      <div className="relative mb-8">
        <Quote className="absolute -top-2 -left-2 w-12 h-12 text-indigo-100" />
        <p className="text-xl md:text-2xl text-gray-700 leading-relaxed relative z-10 pl-6">
          "{testimonial.quote}"
        </p>
      </div>

      {/* Author */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center text-white shadow-lg",
            testimonial.avatarGradient
          )}>
            <Verified className="w-7 h-7" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-lg">
              {testimonial.name}
            </div>
            <div className="text-gray-500">{testimonial.role}</div>
          </div>
        </div>

        {testimonial.helpful && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            <Heart className="w-4 h-4 text-pink-400" />
            <span>{testimonial.helpful} found helpful</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Testimonials;
