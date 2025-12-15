
import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { SERVICE_OPTIONS } from '../constants';

const StatsSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [realServiceCount, setRealServiceCount] = useState(SERVICE_OPTIONS.length); // Default to constants
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Intersection Observer for animation
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);

    // 2. Fetch Real Service Count from DB
    const fetchServiceCount = async () => {
        try {
            const snap = await getDocs(collection(db, "services"));
            if (!snap.empty) {
                setRealServiceCount(snap.size);
            }
        } catch (e) {
            console.error("Failed to fetch service count", e);
        }
    };
    fetchServiceCount();

    return () => observer.disconnect();
  }, []);

  const Counter = ({ end, label, suffix = '' }: { end: number; label: string; suffix?: string }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!isVisible) return;
      
      let start = 0;
      const duration = 2000;
      const increment = end / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }, [isVisible, end]);

    return (
      <div className="text-center p-4 bg-white rounded-2xl shadow-sm border border-pink-50 hover:border-pink-200 hover:shadow-md transition-all">
        <h3 className="text-2xl font-bold text-primary mb-1">
          {count.toLocaleString()}{suffix}
        </h3>
        <p className="text-gray-500 font-medium text-xs">{label}</p>
      </div>
    );
  };

  return (
    <div ref={ref} className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Counter end={14000} label="누적 주문 건수" suffix="+" />
        <Counter end={realServiceCount} label="제공 중인 서비스" suffix="개" />
        <Counter end={97} label="고객 만족도" suffix="%" />
      </div>
    </div>
  );
};

export default StatsSection;
