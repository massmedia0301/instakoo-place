import React from 'react';

interface NoticePopupProps {
  onClose: () => void;
  onDontShowToday: () => void;
}

const NoticePopup: React.FC<NoticePopupProps> = ({ onClose, onDontShowToday }) => {
  return (
    // Wrapper div removed, now just the card content to allow layout control in App.tsx
      <div className="bg-white rounded-[24px] w-full max-h-[80vh] relative z-20 shadow-2xl flex flex-col animate-bounce-in overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-primaryBg flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">📌 서비스 이용 필독사항</h2>
            <p className="text-xs text-gray-500">주문 전 꼭 확인해주세요!</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors shadow-sm"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto leading-relaxed text-gray-700 space-y-6 custom-scrollbar text-sm">
          
          {/* Quick Summary Section */}
          <div className="space-y-4">
             {/* Instagram */}
            <div className="bg-white border border-pink-100 rounded-xl p-3 shadow-sm">
              <h3 className="font-bold text-pink-500 mb-1 flex items-center gap-1">
                <i className="fa-brands fa-instagram"></i> 인스타그램
              </h3>
              <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                <li><span className="font-bold text-gray-800">한국인 팔로워/좋아요:</span> 실제 계정으로 안전하게 작업</li>
                <li><span className="font-bold text-gray-800">외국인 서비스:</span> 가성비 좋은 계정 성장 추천</li>
                <li><span className="font-bold text-gray-800">자동 이탈 관리(AS):</span> 이탈 시 자동 복구 시스템 가동</li>
                <li className="text-red-500 font-bold">비밀번호는 절대 요구하지 않습니다.</li>
              </ul>
            </div>

            {/* YouTube */}
            <div className="bg-white border border-red-100 rounded-xl p-3 shadow-sm">
              <h3 className="font-bold text-red-500 mb-1 flex items-center gap-1">
                <i className="fa-brands fa-youtube"></i> 유튜브
              </h3>
              <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                <li><span className="font-bold text-gray-800">고품질 조회수:</span> 실제 시청 시간 확보로 추천 확률 UP</li>
                <li><span className="font-bold text-gray-800">안전한 속도:</span> 알고리즘 감지 없는 자연스러운 유입</li>
              </ul>
            </div>

            {/* Others */}
            <div className="bg-white border border-green-100 rounded-xl p-3 shadow-sm">
               <h3 className="font-bold text-green-600 mb-1 flex items-center gap-1">
                <span className="font-black border border-green-600 rounded px-0.5 text-[10px] mr-1">N</span>
                네이버 & 기타
              </h3>
              <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                <li>플레이스 저장/리뷰로 상위 노출 경쟁력 확보</li>
                <li>당근마켓 지역 키워드 노출 및 조회수 관리</li>
              </ul>
            </div>

             {/* FAQ Short */}
             <div className="bg-gray-50 rounded-xl p-3">
               <p className="font-bold text-xs text-gray-800 mb-1">💡 자주 묻는 질문</p>
               <p className="text-xs text-gray-500">
                 Q. 계정 정지 위험은 없나요?<br/>
                 A. 권장 속도를 준수하여 <span className="text-primary font-bold">100% 안전</span>합니다.
               </p>
               <p className="text-xs text-gray-500 mt-2">
                 Q. 작업 시작 시간은?<br/>
                 A. 결제 후 시스템이 <span className="text-primary font-bold">5분~1시간 이내</span> 자동 시작합니다.
               </p>
             </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="flex border-t border-gray-100">
          <button 
            onClick={onDontShowToday}
            className="flex-1 py-3.5 bg-gray-50 text-gray-500 text-xs font-medium hover:bg-gray-100 transition-colors border-r border-gray-200"
          >
            오늘 하루 보지 않기
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 bg-primary text-white text-sm font-bold hover:bg-primaryLight transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
  );
};

export default NoticePopup;