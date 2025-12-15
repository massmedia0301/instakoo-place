import React, { useState } from 'react';

const Footer: React.FC = () => {
  const [modalType, setModalType] = useState<'NONE' | 'TERMS' | 'PRIVACY'>('NONE');

  const openTerms = (e: React.MouseEvent) => {
    e.preventDefault();
    setModalType('TERMS');
  };

  const openPrivacy = (e: React.MouseEvent) => {
    e.preventDefault();
    setModalType('PRIVACY');
  };

  const closeModal = () => setModalType('NONE');

  return (
    <>
      <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-4 text-center md:text-left">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-12 gap-8">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                <span className="text-2xl font-bold text-gray-800">instakoo</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                SNS 마케팅 자동화 플랫폼 인스타쿠.<br/>
                쉽고 빠르고 안전하게 계정을 성장시키세요.
              </p>
              <p className="text-gray-400 text-xs mt-4">
                Developer : Martech Lab Team
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-gray-500">
              <p><span className="font-bold">고객센터</span> 032-322-8571 (평일 10:00 ~ 18:00)</p>
              <p>이메일: help.instakoo@gmail.com</p>
              <p>주소: 경기도 부천시 원미구 부일로226, 8층</p>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
            <div className="flex gap-4">
              <a href="#" onClick={openTerms} className="hover:text-gray-600">이용약관</a>
              <a href="#" onClick={openPrivacy} className="hover:text-gray-600">개인정보처리방침</a>
            </div>
            <div className="text-center md:text-right">
                <p>© 2025 instakoo. All rights reserved.</p>
                <p className="text-[10px] text-gray-300 mt-1">Sponsored by martechlab</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Modal */}
      {modalType !== 'NONE' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col relative z-10 shadow-2xl animate-bounce-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                {modalType === 'TERMS' ? '이용약관' : '개인정보처리방침'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-dark text-xl">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-4">
              {modalType === 'TERMS' ? (
                <>
                  <p><strong>제 1 조 (목적)</strong><br/>이 약관은 instakoo(이하 "회사")가 제공하는 서비스의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.</p>
                  <p><strong>제 2 조 (용어의 정의)</strong><br/>"서비스"라 함은 회사가 제공하는 SNS 마케팅 자동화 및 관련 제반 서비스를 의미합니다.</p>
                  <p><strong>제 3 조 (약관의 효력 및 변경)</strong><br/>회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다. 회사는 법률을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</p>
                  <p className="text-gray-400">(이하 생략... 본 약관은 예시입니다.)</p>
                </>
              ) : (
                <>
                  <p><strong>1. 개인정보의 수집 및 이용 목적</strong><br/>회사는 서비스 제공, 회원 관리, 상담 처리 등을 위해 개인정보를 수집합니다.</p>
                  <p><strong>2. 수집하는 개인정보의 항목</strong><br/>이메일, 비밀번호, 결제기록, 서비스 이용 기록 등.</p>
                  <p><strong>3. 개인정보의 보유 및 이용 기간</strong><br/>회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.</p>
                  <p className="text-gray-400">(이하 생략... 본 방침은 예시입니다.)</p>
                </>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 text-right">
              <button 
                onClick={closeModal}
                className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primaryLight transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;