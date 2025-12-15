import React from 'react';

interface ServiceDetailModalProps {
  onClose: () => void;
}

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="bg-white rounded-[32px] w-full max-w-3xl max-h-[85vh] relative z-10 shadow-2xl flex flex-col animate-bounce-in overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <div>
            <h2 className="text-xl font-bold text-gray-800">서비스 상세 안내</h2>
            <p className="text-sm text-gray-500">인스타쿠만의 차별화된 고품질 서비스를 확인해보세요.</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <i className="fa-solid fa-times text-lg"></i>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto leading-relaxed text-gray-700 space-y-8 custom-scrollbar">
          
          {/* Instagram */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-pink-500 mb-3">
              <i className="fa-brands fa-instagram text-xl"></i> 인스타그램 (Instagram)
            </h3>
            <div className="bg-pink-50 rounded-2xl p-5 space-y-3 text-sm">
              <p>
                <span className="font-bold text-gray-900">📸 한국인 팔로워/좋아요:</span><br/>
                실제 활동하는 한국인 계정으로 유입되어 계정 지수에 긍정적인 영향을 줍니다.
              </p>
              <p>
                <span className="font-bold text-gray-900">🌍 외국인 팔로워/좋아요:</span><br/>
                저렴한 비용으로 빠르게 계정 규모(Social Proof)를 키우고 싶을 때 추천합니다.
              </p>
              <p>
                <span className="font-bold text-gray-900">🛡️ 자동 이탈 관리:</span><br/>
                작업 후 팔로워가 감소할 경우, 일정 기간 동안 자동으로 복구(AS) 해드립니다.
              </p>
              <p>
                <span className="font-bold text-gray-900">🔒 비밀번호 불필요:</span><br/>
                계정 비밀번호 없이, 오직 ‘링크’만으로 안전하게 작업됩니다.
              </p>
            </div>
          </section>

          {/* YouTube */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-red-500 mb-3">
              <i className="fa-brands fa-youtube text-xl"></i> 유튜브 (YouTube)
            </h3>
            <div className="bg-red-50 rounded-2xl p-5 space-y-3 text-sm">
              <p>
                <span className="font-bold text-gray-900">▶️ 고품질 조회수:</span><br/>
                단순 클릭이 아닌 실제 시청 시간을 확보하여 영상의 추천 확률을 높여줍니다.
              </p>
              <p>
                <span className="font-bold text-gray-900">🐢 안전한 속도:</span><br/>
                유튜브 알고리즘에 감지되지 않도록 자연스러운 속도로 유입됩니다.
              </p>
              <p>
                <span className="font-bold text-gray-900">🎯 다양한 타겟팅:</span><br/>
                한국인 타겟, 전 세계 타겟 등 영상 성격에 맞춰 선택 가능합니다.
              </p>
            </div>
          </section>

          {/* Naver */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-green-500 mb-3">
              <span className="border border-green-500 text-xs px-1 rounded font-black">N</span> 네이버 (Naver)
            </h3>
            <div className="bg-green-50 rounded-2xl p-5 space-y-3 text-sm">
              <p>
                <span className="font-bold text-gray-900">⭐ 플레이스 저장(찜):</span><br/>
                내 가게의 ‘저장’ 수를 늘려 지도 상위 노출 경쟁력을 확보합니다.
              </p>
              <p>
                <span className="font-bold text-gray-900">📝 방문자 리뷰:</span><br/>
                실제 유저들이 남기는 자연스러운 키워드 리뷰로 신뢰도를 높입니다.
              </p>
              <p>
                <span className="font-bold text-gray-900">👥 블로그 체험단:</span><br/>
                블로그 리뷰에 실제 유저를 참여 시켜 플레이스에 도움이 되도록 합니다.
              </p>
              <p>
                <span className="font-bold text-gray-900">🚀 트래픽 관리:</span><br/>
                플레이스 및 사이트에 유효 타수를 발생시켜 인기도를 상승시킵니다.
              </p>
            </div>
          </section>

           {/* Danggeun & Others */}
           <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-orange-500 mb-3">
              <i className="fa-solid fa-carrot text-xl"></i> 당근마켓 & 기타 플랫폼
            </h3>
            <div className="bg-orange-50 rounded-2xl p-5 space-y-3 text-sm">
              <p>
                <span className="font-bold text-gray-900">📍 지역 키워드 노출:</span><br/>
                맛집, 병원 등 지역 키워드 검색 시 상위에 노출하게 만들어 매장 인지도를 높힙니다.
              </p>
              <p>
                <span className="font-bold text-gray-900">👀 조회수 증가:</span><br/>
                게시글이 동네 이웃들에게 더 많이 노출되도록 조회수를 관리합니다.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section className="pt-4 border-t border-gray-100">
             <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
              💡 자주 묻는 질문 (FAQ)
            </h3>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="font-bold text-gray-900 mb-2">Q. 제 계정이 정지당하지 않나요?</p>
                <p className="text-gray-600 text-sm">
                  A. 인스타쿠는 플랫폼별 권장 속도와 로직을 준수하여 안전하게 작업합니다. 
                  무리한 속도로 작업하지 않기 때문에 계정 정지 위험이 없습니다.
                </p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="font-bold text-gray-900 mb-2">Q. 주문 후 언제 시작되나요?</p>
                <p className="text-gray-600 text-sm">
                  A. 결제 완료 즉시 시스템이 자동으로 주문을 접수하며, 보통 5분~1시간 이내에 작업이 시작됩니다. 
                  (서버 상황이나 주문량에 따라 다를 수 있습니다.)
                </p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="font-bold text-gray-900 mb-2">Q. AS는 어떻게 받나요?</p>
                <p className="text-gray-600 text-sm">
                  A. 보장형 서비스를 구매하신 경우, 고객 센터로 연락 주시면 안내 해드리겠습니다.
                </p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primaryLight transition-colors shadow-md"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailModal;