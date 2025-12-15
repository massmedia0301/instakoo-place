import React, { useState } from 'react';

interface ContactModalProps {
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ onClose }) => {
  const handleKakaoClick = () => {
      window.open('https://open.kakao.com/o/s6Ivdi6h', '_blank');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="bg-white rounded-[32px] w-full max-w-sm relative z-10 shadow-2xl p-8 animate-bounce-in flex flex-col items-center text-center">
        
        {/* Icon */}
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <i className="fa-solid fa-headset text-4xl text-primary"></i>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">고객센터 안내</h2>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed break-keep">
          궁금한 점이 있으신가요?<br/>
          연락주시면 언제든 친절하게 상담해드립니다.
        </p>

        {/* Phone Section */}
        <div className="w-full bg-gray-50 rounded-2xl p-5 mb-4 hover:bg-gray-100 transition-colors border border-gray-100 group">
           <div className="text-xs text-gray-400 font-bold mb-1 group-hover:text-primary transition-colors">전화상담</div>
           <a href="tel:032-322-8571" className="text-2xl font-extrabold text-dark flex items-center justify-center gap-2">
              <i className="fa-solid fa-phone text-sm text-gray-400"></i>
              032-322-8571
           </a>
           <div className="text-[10px] text-gray-400 mt-1">평일 10:00 ~ 18:00 (주말/공휴일 휴무)</div>
        </div>

        {/* Kakao Section */}
        <div 
            onClick={handleKakaoClick}
            className="w-full bg-[#FEE500] rounded-2xl p-5 mb-8 hover:brightness-95 transition-all shadow-sm cursor-pointer" 
        >
           <div className="text-xs text-[#3c1e1e] font-bold mb-1 opacity-70">실시간 채팅</div>
           <div className="text-2xl font-extrabold text-[#3c1e1e] flex items-center justify-center gap-2">
              <i className="fa-solid fa-comment text-lg"></i>
              카카오톡 문의
           </div>
        </div>

        <button 
          onClick={onClose} 
          className="w-full py-3.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default ContactModal;