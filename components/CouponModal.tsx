

import React, { useState, useEffect } from 'react';
import { User, CouponHistoryItem } from '../types';

interface CouponModalProps {
  onClose: () => void;
  currentUser: User | null;
  onUpdateUser: (user: User) => void;
  onLoginRequest: () => void;
}

const CouponModal: React.FC<CouponModalProps> = ({ onClose, currentUser, onUpdateUser, onLoginRequest }) => {
  const [stage, setStage] = useState<'IDLE' | 'SHAKING' | 'OPENING' | 'RESULT'>('IDLE');
  const [resultAmount, setResultAmount] = useState(0);

  // Generate dynamic fake winners on component mount
  const [fakeWinners] = useState(() => {
      const winners = [];
      const domains = ['naver.com', 'gmail.com', 'kakao.com', 'daum.net', 'nate.com', 'icloud.com', 'hanmail.net'];
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      
      // Generate 50 fake winners
      for(let i=0; i<50; i++) {
          // 1. Generate Random ID Part (length 4~10)
          const idLen = Math.floor(Math.random() * 7) + 4; 
          let idBase = '';
          // Ensure first char is letter
          idBase += 'abcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 26));
          for(let j=0; j<idLen - 1; j++) {
             idBase += chars.charAt(Math.floor(Math.random() * chars.length));
          }

          // 2. Masking (Show first 3 chars, mask rest)
          const visiblePart = idBase.substring(0, 3);
          const maskedId = `${visiblePart}****`;

          // 3. Pick Random Domain
          const domain = domains[Math.floor(Math.random() * domains.length)];
          const fullId = `${maskedId}@${domain}`;
          
          // 4. Weighted Amount 1k - 30k
          const r = Math.random();
          let amount = 1000;
          if (r > 0.98) amount = 30000;       // 2%
          else if (r > 0.9) amount = 15000;   // 8%
          else if (r > 0.7) amount = 5000;    // 20%
          else if (r > 0.4) amount = 3000;    // 30%
          // else 1000 (40%)
          
          winners.push({ id: fullId, amount });
      }
      return winners;
  });

  const handleUseCoupon = () => {
    if (!currentUser) {
        onLoginRequest(); // Trigger Login redirect logic
        return;
    }

    if (currentUser.coupons <= 0) {
        alert('보유한 쿠폰이 없습니다.');
        return;
    }
    setStage('SHAKING');
    
    // 3 seconds animation sequence
    setTimeout(() => {
        setStage('OPENING');
        setTimeout(() => {
            calculateResult();
            setStage('RESULT');
        }, 500);
    }, 2500);
  };

  const calculateResult = () => {
      // Lower probabilities significantly
      // Tiers: 15,000 / 3,000 / 2,000 / 1,000 / 500 / 0 (Lose)
      // High tier probs reduced by approx half
      // 500P and 0P share remaining percentage equally
      
      const rand = Math.random() * 100;
      let amount = 0;

      // New Probabilities:
      // 15,000: 0.25%
      // 3,000:  4.0%
      // 2,000:  5.0%
      // 1,000:  7.5%
      // Remaining: 83.25% -> Split between 500P and 0P (~41.6% each)

      if (rand < 0.25) amount = 15000;
      else if (rand < 4.25) amount = 3000; 
      else if (rand < 9.25) amount = 2000; 
      else if (rand < 16.75) amount = 1000; 
      else if (rand < 58.375) amount = 500; 
      else amount = 0; // Lose

      setResultAmount(amount);

      if (currentUser) {
          // Update User Data
          const users = JSON.parse(localStorage.getItem('site_users') || '[]');
          const updatedUser = { ...currentUser };
          
          updatedUser.coupons -= 1;
          updatedUser.points += amount;
          
          // Add History
          const newHistory: CouponHistoryItem = {
              id: Date.now(),
              date: new Date().toISOString(),
              amount: amount,
              resultType: amount > 0 ? 'WIN' : 'LOSE'
          };
          
          updatedUser.couponHistory = [newHistory, ...(updatedUser.couponHistory || [])];

          // Save
          const updatedUsers = users.map((u: User) => u.email === updatedUser.email ? updatedUser : u);
          localStorage.setItem('site_users', JSON.stringify(updatedUsers));
          
          // Call parent update
          onUpdateUser(updatedUser);
      }
  };

  const resetBox = () => {
      setStage('IDLE');
  };

  // Improved Gift Box Image (3D Style)
  const BOX_IMG = "https://cdn-icons-png.flaticon.com/512/4213/4213958.png";

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={stage === 'IDLE' || stage === 'RESULT' ? onClose : undefined}></div>
      
      <div className="bg-white rounded-[32px] w-full max-w-md relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white text-center">
            <h2 className="text-2xl font-bold mb-1">🎁 행운의 랜덤박스</h2>
            <p className="text-sm opacity-90">
                {currentUser ? (
                    <>보유 쿠폰: <span className="font-bold text-yellow-300 text-lg">{currentUser.coupons}장</span></>
                ) : (
                    <>로그인하고 쿠폰을 확인하세요!</>
                )}
            </p>
        </div>

        {/* Content Body */}
        <div className="p-8 flex flex-col items-center justify-center flex-grow min-h-[300px]">
            
            {/* IDLE STAGE */}
            {stage === 'IDLE' && (
                <div className="text-center animate-bounce-in w-full">
                    <div 
                        onClick={handleUseCoupon}
                        className="cursor-pointer transition-transform hover:scale-105 active:scale-95 mb-6 relative group"
                    >
                        <img src={BOX_IMG} alt="Gift Box" className="w-44 h-44 mx-auto drop-shadow-2xl" />
                        <p className="mt-6 text-sm text-gray-400 font-bold animate-pulse group-hover:text-purple-500 bg-gray-50 inline-block px-4 py-2 rounded-full border border-gray-100">
                            {currentUser ? "👆 상자를 터치해서 열어보세요!" : "👆 로그인 후 열어보기"}
                        </p>
                    </div>
                    
                    {/* Probabilities Hint */}
                    <div className="text-[10px] text-gray-400 mt-2">
                        * 최대 150,000P 당첨 기회!
                    </div>
                </div>
            )}

            {/* SHAKING / OPENING STAGE */}
            {(stage === 'SHAKING' || stage === 'OPENING') && (
                <div className="text-center">
                    <img 
                        src={BOX_IMG}
                        alt="Gift Box" 
                        className={`w-44 h-44 mx-auto drop-shadow-2xl ${stage === 'SHAKING' ? 'animate-shake' : 'animate-pop'}`} 
                    />
                    <p className="mt-8 text-xl font-bold text-purple-600">
                        {stage === 'SHAKING' ? '두근두근... 무엇이 나올까요?' : '개봉박두!'}
                    </p>
                </div>
            )}

            {/* RESULT STAGE */}
            {stage === 'RESULT' && (
                <div className="text-center animate-bounce-in w-full">
                    {resultAmount > 0 ? (
                        <>
                            <div className="text-6xl mb-4">🎉</div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">축하합니다!</h3>
                            <div className="text-4xl font-extrabold text-primary mb-6">
                                +{resultAmount.toLocaleString()} P
                            </div>
                            <p className="text-gray-500 mb-8">포인트가 즉시 지급되었습니다.</p>
                        </>
                    ) : (
                        <>
                            <div className="text-6xl mb-4">😭</div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">아쉽네요...</h3>
                            <div className="text-lg font-bold text-gray-500 mb-6">
                                꽝! 다음 기회에 도전하세요.
                            </div>
                        </>
                    )}
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                        >
                            닫기
                        </button>
                        {currentUser && currentUser.coupons > 0 ? (
                            <button 
                                onClick={resetBox}
                                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-md"
                            >
                                한 번 더!
                            </button>
                        ) : (
                             <button 
                                disabled
                                className="flex-1 py-3 bg-gray-200 text-gray-400 rounded-xl font-bold cursor-not-allowed"
                            >
                                쿠폰 소진
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
        
        {/* Fake Winner Marquee (Vertical) */}
        {stage === 'IDLE' && (
            <div className="bg-gray-50 p-3 border-t border-gray-100 h-32 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-gray-50 to-transparent z-10"></div>
                <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-gray-50 to-transparent z-10"></div>
                
                <h4 className="text-xs font-bold text-gray-500 mb-2 text-center sticky top-0 z-20">🔥 실시간 당첨 현황</h4>
                
                <div className="animate-vertical-marquee">
                    {/* Render fake winners using state */}
                    {[...fakeWinners, ...fakeWinners].map((w, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-gray-600 py-1.5 px-4">
                            <span className="font-mono text-gray-500">{w.id}</span>
                            <span className="font-bold text-green-600">+{w.amount.toLocaleString()} P</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default CouponModal;
