'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';

// Import the gradient background with SSR enabled for faster initial render
const GradientBackground = dynamic(
  () => import('@/components/auth/gradient-background'),
  { ssr: true }
);

interface AuthLayoutProps {
  children: React.ReactNode;
}

const testimonials = [
  {
    text: "Dhananjay holds high work ethics and is a compassionate professional. It's been my privilege to have Dhananjay as a dependable HR partner and a great friend.",
    name: 'Pramod Tiwari',
    position: 'Head of Tactical Marketing At SWAL',
  },
  {
    text: 'Joining Dots provided me with invaluable guidance in my career journey. Their expertise in HR systems helped me navigate complex challenges and achieve my professional goals.',
    name: 'Sarah Johnson',
    position: 'Senior Project Manager at Tech Innovations',
  },
  {
    text: 'The coaching and support I received from Joining Dots transformed my approach to leadership. I now feel more confident and equipped to lead my team effectively.',
    name: 'Michael Smith',
    position: 'Director of Operations at Global Solutions',
  },
];

export default function AuthLayout({ children }: AuthLayoutProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000); // Change testimonial every 5 seconds

    return () => clearInterval(interval); // Clear interval on unmount
  }, []);
  return (
    <div className="min-h-screen flex">
      {/* Left side with gradient background */}
      <GradientBackground className="hidden lg:flex flex-1 flex-col p-8 rounded-3xl m-8">
        <div className="flex flex-col h-full justify-between">
          {/* Logo positioned in top-left corner */}
          <div className="flex items-start justify-start ml-8">
            <div className="w-20 h-20 flex items-center justify-center">
              <ThemeAwareLogo
                width={250}
                height={100}
                className="filter brightness-0 invert drop-shadow-lg"
              />
            </div>
          </div>

          {/* New Text Section */}
          <div className="mt-4 flex flex-col">
            <h2 className="text-[64px] font-bold text-white leading-tight">
              Start your
            </h2>
            <h2 className="text-[64px] font-bold text-white leading-tight">
              journey with us.
            </h2>
            <p className="mt-5 text-[20px] text-white leading-relaxed">
              We excel in Capability Building, Organization Development, HR
              System Design & Implementation and Executive Coaching.
            </p>
          </div>

          {/* Updated Testimonials Section with horizontal scrolling and dots */}
          <div className="mt-5 bg-white bg-opacity-15 dark:bg-black dark:bg-opacity-15 p-2 rounded-lg relative">
            <div className="flex justify-center p-4">
              <div className="flex-shrink-0 w-full">
                <p className="text-white">{testimonials[currentIndex].text}</p>
                <p className="font-semibold text-white mt-2">
                  {testimonials[currentIndex].name}
                </p>
                <p className="text-white">
                  {testimonials[currentIndex].position}
                </p>
              </div>
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {testimonials.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${index === currentIndex ? 'bg-white' : 'bg-gray-400'}`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </GradientBackground>

      {/* Right side content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[520px] relative">
          {/* Mobile-only logo - shows only on small screens */}
          <div className="lg:hidden flex justify-center mb-8 px-4">
            <div className="w-48 h-32 sm:w-52 sm:h-36 flex items-center justify-center">
              <Image
                src="/assets/images/logo.png"
                alt="Company Logo"
                width={208}
                height={144}
                className="max-w-full max-h-full object-contain drop-shadow-sm"
                priority
              />
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
