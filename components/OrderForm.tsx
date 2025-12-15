

import React, { useState, useEffect } from 'react';
import { Platform, ServiceOption, Order, User } from '../types';
import { SERVICE_OPTIONS } from '../constants';
import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc, updateDoc, increment, collection, getDocs } from 'firebase/firestore';

interface OrderFormProps {
  targetPlatform?: Platform | null;
  currentUser?: User | null; 
}

type SpeedOption = 'FAST' | 'NORMAL' | 'ANY';

const OrderForm: React.FC<OrderFormProps> = ({ targetPlatform, currentUser }) => {
  const [platform, setPlatform] = useState<Platform>(Platform.INSTAGRAM);
  const [selectedService, setSelectedService] = useState<string>('');
  
  // Dynamic Services loaded from DB
  const [services, setServices] = useState<ServiceOption[]>([]);
  
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [workSpeed, setWorkSpeed] = useState<SpeedOption>('FAST');
  const [quantity, setQuantity] = useState<number>(0);
  const [agreed, setAgreed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    // Fetch Services from DB
    const fetchServices = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "services"));
            if (!querySnapshot.empty) {
                const dbServices = querySnapshot.docs.map(doc => doc.data() as ServiceOption);
                setServices(dbServices);
            } else {
                // Fallback if empty
                setServices(SERVICE_OPTIONS);
            }
        } catch (e) {
            console.error("Failed to fetch services, using default", e);
            setServices(SERVICE_OPTIONS);
        }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (targetPlatform) {
      setPlatform(targetPlatform);
    }
  }, [targetPlatform]);

  const currentServices = services.filter(s => s.platform === platform);
  const currentServiceOption = services.find(s => s.id === selectedService);

  useEffect(() => {
    if (currentServices.length > 0) {
      if (!currentServices.find(s => s.id === selectedService)) {
        setSelectedService(currentServices[0].id);
        setQuantity(currentServices[0].minQuantity);
        setInputValues({}); 
      }
    }
  }, [platform, currentServices, selectedService]);

  useEffect(() => {
    if (currentServiceOption) {
      setQuantity(currentServiceOption.minQuantity);
      setInputValues({}); 
    }
  }, [selectedService]); // Removed currentServiceOption from dependency to avoid infinite loops if object ref changes

  const totalPrice = currentServiceOption ? quantity * currentServiceOption.pricePerUnit : 0;

  const handleInputChange = (key: string, value: string) => {
    setInputValues(prev => ({ ...prev, [key]: value }));
  };

  const handlePayment = async () => {
    if (!currentServiceOption) return;

    if (currentServiceOption.inputs) {
      for (const input of currentServiceOption.inputs) {
        if (!inputValues[input.key]) {
          alert(`${input.label}을(를) 입력해주세요.`);
          return;
        }
      }
    } else {
      if (!inputValues['url']) {
        alert('링크를 입력해주세요.');
        return;
      }
    }

    if (quantity < currentServiceOption.minQuantity) {
      alert(`최소 주문 수량은 ${currentServiceOption.minQuantity}개 입니다.`);
      return;
    }
    if (!agreed) {
      alert('이용약관에 동의해주세요.');
      return;
    }

    if (!currentUser) {
        alert('로그인이 필요한 서비스입니다.');
        return;
    }

    setIsProcessing(true);

    try {
        // 1. Fetch Fresh User Data from DB
        const userRef = doc(db, "users", currentUser.email);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
             alert("회원 정보를 찾을 수 없습니다.");
             setIsProcessing(false);
             return;
        }

        const freshUserData = userSnap.data() as User;
        const currentPoints = freshUserData.points || 0;

        if (currentPoints < totalPrice) {
            alert(`포인트가 부족합니다.\n보유 포인트: ${currentPoints.toLocaleString()} P\n필요 포인트: ${totalPrice.toLocaleString()} P`);
            setIsProcessing(false);
            return;
        }

        const confirmMsg = `[포인트 결제]\n서비스: ${currentServiceOption.name}\n수량: ${quantity}개\n총 차감 포인트: ${totalPrice.toLocaleString()} P\n\n진행하시겠습니까?`;
        if (!window.confirm(confirmMsg)) {
            setIsProcessing(false);
            return;
        }

        // 2. Deduct Points (Transaction safe via atomic increment)
        await updateDoc(userRef, {
            points: increment(-totalPrice)
        });

        // 3. Save Order to Firestore with Snapshot of Cost
        const orderId = `ORD-${Date.now()}`;
        const newOrder: Order = {
            id: orderId,
            userId: currentUser.email,
            serviceName: currentServiceOption.name,
            serviceId: currentServiceOption.id, // Save Service ID
            costPrice: currentServiceOption.costPrice || 0, // Save Cost Snapshot
            amount: totalPrice,
            quantity: quantity,
            platform: platform,
            speed: workSpeed, 
            details: inputValues, 
            status: 'PENDING',
            date: new Date().toISOString()
        };
        
        await setDoc(doc(db, "orders", orderId), newOrder);
        
        setIsProcessing(false);
        setShowSuccessModal(true);

    } catch (e: any) {
        console.error("Order Failed", e);
        alert(`주문 처리 중 오류가 발생했습니다: ${e.message}`);
        setIsProcessing(false);
    }
  };

  const getPlatformIcon = (p: Platform, isActive: boolean) => {
    switch (p) {
      case Platform.YOUTUBE: 
        return <i className={`fa-brands fa-youtube text-xl md:text-base ${isActive ? 'text-red-500' : 'text-gray-300 md:text-red-500'}`}></i>;
      case Platform.INSTAGRAM: 
        return <i className={`fa-brands fa-instagram text-xl md:text-base ${isActive ? 'text-pink-500' : 'text-gray-300 md:text-pink-500'}`}></i>;
      case Platform.NAVER: 
        return <span className={`font-bold text-sm md:text-xs border rounded px-1.5 md:px-1 ${isActive ? 'text-green-500 border-green-500' : 'text-gray-300 border-gray-300 md:text-green-500 md:border-green-500'}`}>N</span>;
      case Platform.DANGGEUN: 
        return <i className={`fa-solid fa-carrot text-xl md:text-base ${isActive ? 'text-orange-500' : 'text-gray-300 md:text-orange-500'}`}></i>;
      case Platform.COUPANG:
        return <span className={`font-bold text-sm md:text-xs border rounded px-1.5 md:px-1 ${isActive ? 'text-red-600 border-red-600' : 'text-gray-300 border-gray-300 md:text-red-600 md:border-red-600'}`}>C</span>;
    }
  };

  const tabs = [
    { key: Platform.INSTAGRAM, label: '인스타그램' },
    { key: Platform.YOUTUBE, label: '유튜브' },
    { key: Platform.NAVER, label: '네이버' },
    { key: Platform.DANGGEUN, label: '당근' },
    { key: Platform.COUPANG, label: '쿠팡' },
  ];

  return (
    <section id="order" className="max-w-2xl mx-auto px-4 py-8 relative z-10">
      {/* Glassmorphism Effect Container */}
      <div className="bg-white/90 backdrop-blur-xl rounded-[32px] md:rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden border border-white/50 ring-1 ring-black/5">
        
        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-primary/90 to-primaryLight/90 p-6 md:p-8 text-center text-white backdrop-blur-md">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-1 tracking-tight drop-shadow-sm">간편 주문하기</h2>
          <p className="opacity-95 text-sm md:text-base font-medium">보유 포인트를 사용하여 마케팅을 시작하세요.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar bg-white/50">
          {tabs.map((tab) => {
            const isActive = platform === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setPlatform(tab.key)}
                className={`flex-1 py-4 md:py-5 px-3 font-bold text-base transition-all flex items-center justify-center gap-2 md:min-w-[120px] tracking-tight relative group ${
                  isActive 
                  ? 'text-primary bg-pink-50/50' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                }`}
              >
                {getPlatformIcon(tab.key, isActive)}
                <span className="hidden md:inline whitespace-nowrap">{tab.label}</span>
                {isActive && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-lg"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Service Selector */}
          <div>
            <label className="block text-gray-800 font-bold mb-2 text-sm ml-1">서비스 선택</label>
            <div className="relative group">
              <select
                value={selectedService}
                onChange={(e) => {
                  setSelectedService(e.target.value);
                }}
                className="w-full appearance-none border border-gray-200 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-pink-500/10 bg-white text-gray-800 font-medium transition-all text-sm shadow-sm hover:border-gray-300 cursor-pointer"
              >
                {currentServices.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} (개당 {service.pricePerUnit.toLocaleString()}원)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-gray-400 group-hover:text-primary transition-colors">
                <i className="fa-solid fa-chevron-down text-sm"></i>
              </div>
            </div>
            {currentServiceOption && (
              <div className="mt-3 text-xs text-gray-500 bg-gray-50/80 p-3 rounded-xl border border-gray-100 leading-relaxed whitespace-pre-wrap flex gap-2 items-start">
                <i className="fa-solid fa-circle-info text-primary mt-0.5"></i>
                <span>{currentServiceOption.description}</span>
              </div>
            )}
          </div>

          {/* Dynamic Inputs */}
          {currentServiceOption && (currentServiceOption.inputs || [{ key: 'url', label: '링크(URL) 입력', type: 'text', placeholder: 'https://...' }]).map((input) => (
            <div key={input.key}>
              <label className="block text-gray-800 font-bold mb-2 text-sm ml-1">
                {input.label}
              </label>
              {input.type === 'textarea' ? (
                <textarea
                  value={inputValues[input.key] || ''}
                  onChange={(e) => handleInputChange(input.key, e.target.value)}
                  placeholder={input.placeholder}
                  className="w-full border border-gray-200 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-pink-500/10 transition-all text-sm h-28 resize-none shadow-sm placeholder:text-gray-300"
                />
              ) : (
                <input
                  type="text"
                  value={inputValues[input.key] || ''}
                  onChange={(e) => handleInputChange(input.key, e.target.value)}
                  placeholder={input.placeholder}
                  className="w-full border border-gray-200 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-pink-500/10 transition-all text-sm shadow-sm placeholder:text-gray-300"
                />
              )}
            </div>
          ))}

          {/* Quantity Input */}
          <div>
            <label className="block text-gray-800 font-bold mb-2 text-sm ml-1 flex justify-between items-center">
              <span>수량</span>
              <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">최소 {currentServiceOption?.minQuantity}개</span>
            </label>
            <input
              type="number"
              value={quantity}
              min={currentServiceOption?.minQuantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-pink-500/10 transition-all text-sm shadow-sm font-bold text-gray-800"
            />
          </div>

          {/* Work Speed Selector */}
          <div>
            <label className="block text-gray-800 font-bold mb-2 text-sm ml-1">작업 속도</label>
            <div className="flex gap-3 p-1 bg-gray-50 rounded-2xl border border-gray-100">
              {[
                { val: 'FAST', label: '⚡ 1일 이내' },
                { val: 'NORMAL', label: '🕒 1~3일' },
                { val: 'ANY', label: '📅 상관없음' }
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setWorkSpeed(opt.val as SpeedOption)}
                  className={`flex-1 py-3 rounded-xl text-xs md:text-sm font-bold transition-all shadow-sm ${
                    workSpeed === opt.val 
                    ? 'bg-white text-primary shadow-md border border-gray-100 ring-1 ring-black/5 transform scale-[1.02]' 
                    : 'bg-transparent text-gray-400 hover:text-gray-600 hover:bg-white/50 border border-transparent'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Calculation Card */}
          <div className="bg-gradient-to-br from-primaryBg to-white rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-3 border border-pink-100 shadow-inner">
            <div className="text-gray-600 font-medium text-xs w-full md:w-auto">
              <p className="flex justify-between md:block items-center">
                <span>선택 서비스:</span> 
                <span className="text-dark font-bold ml-2 bg-white px-2 py-1 rounded-lg border border-pink-50 shadow-sm">{currentServiceOption?.name}</span>
              </p>
            </div>
            <div className="text-right w-full md:w-auto flex justify-between md:block items-end border-t md:border-0 border-gray-200 pt-3 md:pt-0 mt-1 md:mt-0">
              <p className="text-xs text-gray-500 md:text-right mb-1">총 필요 포인트</p>
              <p className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                {totalPrice.toLocaleString()} P
              </p>
            </div>
          </div>

          {/* Agreement & Submit */}
          <div className="pt-2">
            <label className="flex items-start md:items-center gap-3 cursor-pointer mb-5 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="relative flex items-center">
                <input 
                    type="checkbox" 
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-primary checked:bg-primary" 
                />
                <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                    <i className="fa-solid fa-check text-xs"></i>
                </div>
              </div>
              <span className="text-gray-500 text-xs md:text-sm select-none">
                서비스 시작 후에는 <span className="font-bold text-gray-700">취소 및 환불이 불가함</span>을 확인했습니다.
              </span>
            </label>

            {/* Enhanced Button with Shimmer */}
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-[0_10px_20px_rgba(255,95,162,0.3)] transition-all transform hover:-translate-y-1 active:translate-y-0 relative overflow-hidden group ${
                isProcessing 
                ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-primary to-primaryLight hover:shadow-[0_15px_30px_rgba(255,95,162,0.4)]'
              }`}
            >
              {/* Shimmer Effect */}
              {!isProcessing && (
                  <div className="animate-shimmer"></div>
              )}
              
              <span className="relative z-10">
                  {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                          <i className="fa-solid fa-circle-notch fa-spin"></i> 처리중...
                      </span>
                  ) : (
                      currentUser ? '포인트로 결제하기' : '로그인 후 결제하기'
                  )}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)}></div>
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md relative z-10 text-center shadow-2xl animate-bounce-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <i className="fa-solid fa-check text-3xl text-green-500"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">주문이 완료되었습니다!</h3>
            <p className="text-gray-500 mb-8">
              담당자가 확인 후 곧 작업이 시작됩니다.
            </p>
            <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left space-y-3 border border-gray-100 shadow-inner">
              <div className="flex justify-between items-start">
                <span className="text-gray-500 text-sm">서비스</span>
                <span className="font-bold text-gray-800 text-sm text-right w-48 break-keep leading-tight">{currentServiceOption?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">수량</span>
                <span className="font-bold text-gray-800 text-sm">{quantity.toLocaleString()}개</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 mt-1">
                <span className="text-gray-500 text-sm">차감 포인트</span>
                <span className="font-bold text-primary">{totalPrice.toLocaleString()} P</span>
              </div>
            </div>
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-dark text-white py-4 rounded-xl font-bold hover:bg-black transition-colors shadow-lg"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default OrderForm;
