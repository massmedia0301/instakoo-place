

import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { db } from '../firebaseConfig';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';

interface RechargePageProps {
  onBack: () => void;
  currentUser?: User | null;
  onNavigateToMyPage?: () => void;
}

const RechargePage: React.FC<RechargePageProps> = ({ onBack, currentUser, onNavigateToMyPage }) => {
  const [amount, setAmount] = useState<number>(30000);
  const [method, setMethod] = useState<'CARD' | 'TRANSFER'>('CARD');
  const [isDirectInput, setIsDirectInput] = useState(false); 
  const [isFirstRecharge, setIsFirstRecharge] = useState(false);
  const [showTransferSuccessModal, setShowTransferSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const amounts = [10000, 30000, 50000, 100000, 300000];

  useEffect(() => {
    const checkHistory = async () => {
        if (currentUser) {
            // Check if user has ANY successful recharges in DB
            const q = query(collection(db, "recharges"), where("user", "==", currentUser.email), where("status", "==", "SUCCESS"));
            const snapshot = await getDocs(q);
            setIsFirstRecharge(snapshot.empty);
        }
    }
    checkHistory();
  }, [currentUser]);

  const handlePayment = async () => {
      if (!currentUser) {
          alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
          onBack();
          return;
      }
      
      if (amount < 1000) {
          alert("최소 충전 금액은 1,000원입니다.");
          return;
      }

      setLoading(true);

      const bonusRate = isFirstRecharge ? 0.1 : 0;
      const bonusPoints = Math.floor(amount * bonusRate);
      
      // VAT Calculation: Actual Payment is 1.1x
      const paymentAmount = Math.floor(amount * 1.1); 
      
      if (method === 'TRANSFER') {
          try {
              const rechargeId = String(Date.now());
              await setDoc(doc(db, "recharges", rechargeId), {
                id: Number(rechargeId), // Store as number for consistency with type, or string
                user: currentUser.email,
                amount: amount, // Point Base (what user gets)
                paymentAmount: paymentAmount, // Actual Money to be paid (VAT included)
                bonusPoints: bonusPoints,
                method: 'TRANSFER',
                status: 'PENDING',
                date: new Date().toISOString()
              });
              
              setLoading(false);
              setShowTransferSuccessModal(true);
          } catch (e) {
              console.error(e);
              setLoading(false);
              alert("충전 요청 실패");
          }
      
      } else {
          setLoading(false);
          alert("카드 결제는 아직 준비중입니다.\n계좌이체 충전을 이용해주세요.");
          return;
      }
  };

  const handleTransferModalConfirm = () => {
      setShowTransferSuccessModal(false);
      if (onNavigateToMyPage) {
          onNavigateToMyPage();
      } else {
          onBack();
      }
  };

  const paymentAmount = Math.floor(amount * 1.1);

  return (
    <div className="min-h-screen bg-primaryBg flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-lg animate-bounce-in">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">포인트 충전</h2>
          <p className="text-gray-500 text-sm mt-1">
             {isFirstRecharge 
                ? <span className="text-pink-600 font-bold">✨ 첫 충전 10% 추가 지급 이벤트 중!</span>
                : <span>안전하고 빠른 포인트 충전</span>
             }
          </p>
          {currentUser && <p className="text-xs text-primary font-bold mt-2">현재 계정: {currentUser.email}</p>}
        </div>

        {/* Amount Selection */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-3">충전 포인트 선택</label>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {amounts.map((amt) => (
              <button
                key={amt}
                onClick={() => { setAmount(amt); setIsDirectInput(false); }}
                className={`py-3 rounded-xl text-sm font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                  !isDirectInput && amount === amt 
                  ? 'bg-primary text-white shadow-md transform -translate-y-0.5' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{amt.toLocaleString()} P</span>
                <span className={`text-[10px] ${!isDirectInput && amount === amt ? 'text-pink-100' : 'text-gray-400'}`}>
                    {(amt * 1.1).toLocaleString()}원 (VAT포함)
                </span>
              </button>
            ))}
            <button
               onClick={() => { setAmount(0); setIsDirectInput(true); }}
               className={`py-3 rounded-xl text-sm font-bold transition-all ${
                  isDirectInput 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
               }`}
            >
              직접 입력
            </button>
          </div>
          
          {/* Direct Input Field */}
          {isDirectInput && (
             <div className="mb-3 animate-bounce-in">
                 <input 
                    type="number"
                    value={amount === 0 ? '' : amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="충전할 포인트 입력 (P)"
                    className="w-full px-4 py-3 rounded-xl border border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 text-right font-bold text-gray-800"
                 />
                 <p className="text-right text-xs text-gray-500 mt-1">
                     결제 예상 금액: <span className="font-bold">{(amount * 1.1).toLocaleString()}원</span> (부가세 포함)
                 </p>
             </div>
          )}

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
             <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-500">충전 포인트</span>
                 <span className="font-bold text-gray-800">{amount.toLocaleString()} P</span>
             </div>
             {isFirstRecharge && amount > 0 && (
                <div className="flex justify-between items-center text-sm">
                    <span className="text-pink-500 font-bold">첫 충전 보너스 (10%)</span>
                    <span className="font-bold text-pink-500">+{Math.floor(amount * 0.1).toLocaleString()} P</span>
                </div>
             )}
             <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-2">
                 <span className="text-gray-500">부가세 (VAT 10%)</span>
                 <span className="text-gray-500 font-medium">+{(paymentAmount - amount).toLocaleString()} 원</span>
             </div>
             
             <div className="flex justify-between items-center pt-2 border-t border-gray-300 mt-2">
                 <span className="text-gray-800 font-bold">최종 결제 금액</span>
                 <span className="text-primary font-extrabold text-xl">
                   {paymentAmount.toLocaleString()} 원
                 </span>
             </div>
             
             <div className="flex justify-between items-center pt-1">
                 <span className="text-gray-500 text-xs">최종 적립 포인트</span>
                 <span className="text-gray-700 font-bold text-sm">
                    {(amount + Math.floor(amount * (isFirstRecharge ? 0.1 : 0))).toLocaleString()} P
                 </span>
             </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-8">
           <label className="block text-sm font-bold text-gray-700 mb-3">결제 수단</label>
           <div className="flex gap-4">
             <button
               onClick={() => setMethod('CARD')}
               className={`flex-1 py-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                 method === 'CARD' ? 'border-primary bg-pink-50 text-primary' : 'border-gray-100 text-gray-400'
               }`}
             >
               <i className="fa-regular fa-credit-card text-2xl"></i>
               <span className="font-bold text-sm">신용카드</span>
             </button>
             <button
               onClick={() => setMethod('TRANSFER')}
               className={`flex-1 py-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                 method === 'TRANSFER' ? 'border-primary bg-pink-50 text-primary' : 'border-gray-100 text-gray-400'
               }`}
             >
               <i className="fa-solid fa-won-sign text-2xl"></i>
               <span className="font-bold text-sm">계좌이체</span>
             </button>
           </div>
        </div>

        <button 
          onClick={handlePayment}
          disabled={loading}
          className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg transition-colors text-lg mb-4 ${loading ? 'bg-gray-400' : 'bg-primary hover:bg-primaryLight'}`}
        >
          {loading ? '처리 중...' : (method === 'TRANSFER' ? '계좌이체 신청하기' : `${paymentAmount.toLocaleString()}원 결제하기`)}
        </button>
        
        <p className="text-center text-xs text-gray-400 mb-6 leading-relaxed">
           {method === 'CARD' 
             ? "* 카드 결제는 준비중입니다." 
             : "* 신청 후 마이페이지에서 계좌번호를 확인해주세요.\n* 입금 후 10분 내로 승인 처리됩니다."}
        </p>

        <button 
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-dark transition-colors text-sm"
        >
            <i className="fa-solid fa-arrow-left"></i>
            뒤로가기
        </button>

      </div>

      {/* Transfer Success Modal */}
      {showTransferSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleTransferModalConfirm}></div>
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm relative z-10 text-center shadow-2xl animate-bounce-in">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-check text-2xl text-blue-500"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">충전신청 완료</h3>
            <p className="text-gray-600 mb-6 text-sm">
              <span className="text-primary font-bold">{paymentAmount.toLocaleString()}원</span>을<br/>
              마이페이지에 안내된 계좌로 입금해주세요.
            </p>
            <button 
              onClick={handleTransferModalConfirm}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primaryLight transition-colors"
            >
              확인 (마이페이지로 이동)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RechargePage;
