
import React from 'react';

interface EventPopupProps {
  onClose: () => void;
  onGoToCoupon: () => void;
  onDontShowToday: () => void;
}

const EventPopup: React.FC<EventPopupProps> = ({ onClose, onGoToCoupon, onDontShowToday }) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
       {/* Use pointer-events-none on container so clicks pass through to backdrop if needed, but inner content has pointer-events-auto */}
       
      <div className="bg-white rounded-[24px] w-full max-w-sm relative z-20 shadow-2xl flex flex-col animate-bounce-in overflow-hidden border-2 border-purple-100 pointer-events-auto">
        
        {/* Header Image Area */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <h2 className="text-2xl font-bold text-white relative z-10 mb-1">🎁 매일 매일 행운박스</h2>
            <p className="text-purple-100 text-sm relative z-10">최대 150,000P 당첨 기회!</p>
            <div className="absolute -bottom-6 -right-6 text-8xl opacity-20 rotate-12">🎁</div>
        </div>

        <div className="p-6 text-center space-y-4">
            <div className="space-y-2 text-sm text-gray-600">
                <p>
                    <span className="font-bold text-purple-600">월/수/금 새벽 1시</span>마다<br/>
                    행운박스 쿠폰이 <span className="font-bold">무조건 지급</span>됩니다.
                </p>
                <div className="bg-gray-50 p-3 rounded-xl text-xs">
                    <p>✅ <span className="font-bold">회원가입 시:</span> 쿠폰 3장 즉시 지급</p>
                    <p>✅ <span className="font-bold">추천인 입력 시:</span> 친구도 나도 +5장</p>
                    <p>✅ <span className="font-bold">최대 당첨금:</span> <span className="text-red-500 font-bold">150,000 P</span></p>
                </div>
            </div>

            <button 
                onClick={onGoToCoupon}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all transform hover:scale-105"
            >
                내 쿠폰함 열기 👆
            </button>
        </div>

        {/* Footer Action */}
        <div className="flex border-t border-gray-100">
          <button 
            onClick={onDontShowToday}
            className="flex-1 py-3 bg-gray-50 text-gray-500 text-xs font-medium hover:bg-gray-100 transition-colors border-r border-gray-200"
          >
            오늘 하루 보지 않기
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-white text-gray-500 text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventPopup;
