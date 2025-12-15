

import React, { useMemo, useState, useEffect } from 'react';
import { MOCK_REVIEWS } from '../constants';
import { Platform, Review } from '../types';

const Reviews: React.FC = () => {
  const [realReviews, setRealReviews] = useState<Review[]>([]);

  useEffect(() => {
    // Load real reviews from localStorage
    const savedReviews = JSON.parse(localStorage.getItem('site_reviews') || '[]');
    setRealReviews(savedReviews);
  }, []);

  // Merge real reviews with mock reviews
  const displayReviews = useMemo(() => {
      return [...realReviews, ...MOCK_REVIEWS, ...MOCK_REVIEWS];
  }, [realReviews]);

  const getPlatformIcon = (platform: Platform) => {
      switch(platform) {
          case Platform.INSTAGRAM: return "📸";
          case Platform.YOUTUBE: return "📺";
          // Custom Naver Icon (Green N)
          case Platform.NAVER: 
            return (
              <span className="inline-flex items-center justify-center w-5 h-5 bg-[#03C75A] text-white rounded-[4px] text-[11px] font-black align-middle leading-none select-none">
                N
              </span>
            );
          case Platform.DANGGEUN: return "🥕";
          case Platform.COUPANG:
            return (
               <span className="inline-flex items-center justify-center w-5 h-5 bg-[#E60A15] text-white rounded-[4px] text-[11px] font-black align-middle leading-none select-none">
                C
              </span>
            );
          default: return "📱";
      }
  };

  return (
    <section className="bg-gradient-to-b from-white to-primaryBg py-20 overflow-hidden">
      <div className="max-w-full">
        <div className="text-center mb-12 px-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">생생한 고객 후기</h2>
          <p className="text-gray-500">이미 많은 분들이 instakoo와 함께 성장하고 있습니다. (누적 후기 2,300+)</p>
        </div>

        {/* Infinite Scrolling Container */}
        <div className="relative w-full">
          <div className="flex animate-marquee gap-6 px-4">
            {displayReviews.map((review, index) => (
              <div 
                key={`${review.id}-${index}`} 
                // Increased width from 300px to 325px
                className="w-[325px] flex-shrink-0 bg-white p-6 rounded-3xl shadow-sm border border-pink-50 flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold overflow-hidden">
                     {/* If it's a real user review, maybe distinguish avatar slightly or just use initial */}
                     {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-800 flex items-center gap-1">
                        {review.name}
                        {/* Indicate Real Review if from localStorage (check ID type or just assume based on index if needed, but here we treat all same style) */}
                        {index < realReviews.length && <span className="text-[10px] bg-primary/10 text-primary px-1 rounded">구매인증</span>}
                    </p>
                    <div className="flex text-yellow-400 text-xs">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className={`fa-solid fa-star ${i < review.rating ? '' : 'text-gray-300'}`}></i>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-grow line-clamp-3">
                  "{review.content}"
                </p>
                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                  {/* Icon Area */}
                  <span className="text-xl h-6 flex items-center" title={review.platform}>
                      {getPlatformIcon(review.platform)}
                  </span>
                  <span className="text-gray-400">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reviews;
