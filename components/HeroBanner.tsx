import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SLIDES } from '../constants';
import { Platform } from '../types';

interface HeroBannerProps {
  onRecharge: () => void;
  onNavigateToOrder: (platform: Platform) => void;
  onOpenCoupons: () => void; // Added
}

const HeroBanner: React.FC<HeroBannerProps> = ({ onRecharge, onNavigateToOrder, onOpenCoupons }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Touch State for Swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset touch end
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  const handleButtonClick = (slideId: number) => {
    if (slideId === 1) {
      // 1. Recharge Slide
      onRecharge();
    } else if (slideId === 2) {
      // 2. YouTube Slide
      onNavigateToOrder(Platform.YOUTUBE);
    } else if (slideId === 3) {
      // 3. Instagram Slide
      onNavigateToOrder(Platform.INSTAGRAM);
    } else if (slideId === 4) {
      // 4. Coupon Slide
      onOpenCoupons();
    }
  };

  return (
    // Height adjusted: h-[325px] -> h-[300px] on mobile for better visibility of content below
    <div className="relative w-full h-[300px] md:h-[410px] overflow-hidden rounded-b-[40px] shadow-sm bg-white pt-16">
      <div 
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {SLIDES.map((slide) => (
          <div key={slide.id} className="w-full flex-shrink-0 h-full relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.bgColor} opacity-90`}></div>
            <div className="relative z-10 h-full flex flex-col justify-center items-center text-center text-white px-6">
              <span className="inline-block px-4 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs md:text-sm font-semibold mb-3 md:mb-4 border border-white/30">
                HOT EVENT
              </span>
              <h2 className="text-2xl md:text-5xl font-bold mb-3 md:mb-4 drop-shadow-md leading-tight">
                {slide.title}
              </h2>
              <p className="text-base md:text-xl font-medium mb-6 md:mb-8 text-white/90 px-2 break-keep">
                {slide.subtitle}
              </p>
              <button 
                onClick={() => handleButtonClick(slide.id)}
                className="bg-white text-primary font-bold px-6 py-2.5 md:px-8 md:py-3 text-sm md:text-base rounded-full shadow-lg hover:bg-gray-50 transition-colors transform hover:scale-105 active:scale-95"
              >
                {slide.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all ${
              currentSlide === idx ? 'bg-white w-5 md:w-6' : 'bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Arrows (Desktop Only) */}
      <button 
        onClick={prevSlide}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/30 rounded-full items-center justify-center text-white backdrop-blur-sm transition-colors"
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>
      <button 
        onClick={nextSlide}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/30 rounded-full items-center justify-center text-white backdrop-blur-sm transition-colors"
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  );
};

export default HeroBanner;