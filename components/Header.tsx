
import React, { useState, useEffect } from 'react';

interface HeaderProps {
  onLogin: () => void;
  onSignup: () => void;
  onRecharge: () => void;
  onOpenServiceGuide: () => void;
  onOpenContact: () => void;
  onOrderClick: () => void;
  onNavigateToMyPage?: () => void;
  onOpenCoupons?: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToDiagnosis?: () => void; // Added diagnosis navigation
  isLoggedIn: boolean;
  userName?: string;
  userPoints?: number;
  userCoupons?: number;
  userRole?: 'USER' | 'ADMIN';
}

const Header: React.FC<HeaderProps> = ({ 
  onLogin, 
  onSignup, 
  onRecharge, 
  onOpenServiceGuide, 
  onOpenContact,
  onOrderClick,
  onNavigateToMyPage,
  onOpenCoupons,
  onNavigateToAdmin,
  onNavigateToDiagnosis, // Destructure
  isLoggedIn,
  userName,
  userPoints = 0,
  userCoupons = 0,
  userRole
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { 
      name: '무료 진단하기', 
      href: '#', 
      action: onNavigateToDiagnosis,
      highlight: true 
    },
    { 
      name: '주문하기', 
      href: '#order', 
      action: onOrderClick 
    },
    { 
      name: '서비스 안내', 
      href: '#', 
      action: onOpenServiceGuide 
    },
    { 
      name: '충전하기', 
      href: '#', 
      action: onRecharge 
    },
    {
      name: '마이페이지',
      href: '#',
      action: () => { if (onNavigateToMyPage) onNavigateToMyPage(); }
    },
    { 
      name: '고객센터', 
      href: '#', 
      action: onOpenContact,
      external: false
    },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-4'
      }`}
    >
      {/* Changed max-w-5xl to max-w-7xl to prevent layout break on login */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
        
        {/* LEFT GROUP: Logo + Diagnosis Button */}
        <div className="flex items-center gap-6">
            {/* Logo Area */}
            <a href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="relative w-9 h-9 bg-primary rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                <span className="text-white font-bold text-lg italic">in</span>
            </div>
            <span className="text-xl font-bold text-primary tracking-tight">instakoo</span>
            </a>

            {/* Desktop Diagnosis Button (Right of Logo) */}
            <button 
                onClick={onNavigateToDiagnosis}
                className="hidden md:flex items-center gap-1.5 text-primary font-bold bg-pink-50 px-4 py-2 rounded-full border border-pink-100 hover:bg-pink-100 hover:shadow-sm transition-all text-sm animate-bounce-in"
            >
                <i className="fa-solid fa-magnifying-glass"></i>
                무료 진단하기
            </button>
        </div>

        {/* Desktop Nav (Right Side) */}
        <nav className="hidden md:flex items-center gap-6">
          {/* Filter out '무료 진단하기' since it's already shown on the left */}
          {navItems.filter(item => item.name !== '무료 진단하기').map((item) => (
            <a 
              key={item.name} 
              href={item.href} 
              target={item.external ? "_blank" : "_self"}
              onClick={(e) => {
                if (item.action) {
                  e.preventDefault();
                  item.action();
                }
              }}
              className={`font-medium transition-colors text-sm flex items-center gap-1 whitespace-nowrap ${
                item.highlight 
                  ? 'text-primary font-bold bg-pink-50 px-3 py-1.5 rounded-full border border-pink-100 hover:bg-pink-100 hover:shadow-sm' 
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              {item.highlight && <i className="fa-solid fa-magnifying-glass"></i>}
              {item.name}
            </a>
          ))}
          <div className="flex items-center gap-2 ml-2 whitespace-nowrap">
            {/* Coupon Button (Visible to All) */}
            <button 
                onClick={onOpenCoupons}
                className="relative bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 py-1.5 rounded-full font-bold text-xs shadow-md hover:shadow-lg hover:scale-105 transition-all mr-2 flex items-center gap-1 flex-shrink-0"
            >
                <i className="fa-solid fa-gift"></i>
                내 쿠폰함
                {isLoggedIn && userCoupons > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center border border-white">
                        {userCoupons}
                    </span>
                )}
            </button>

            {isLoggedIn ? (
                <>
                 {/* Admin Button */}
                 {userRole === 'ADMIN' && (
                    <button
                        onClick={onNavigateToAdmin}
                        className="bg-gray-800 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-black transition-colors mr-2 shadow-sm flex items-center gap-1 flex-shrink-0"
                    >
                        <i className="fa-solid fa-gear"></i> 관리자
                    </button>
                 )}

                 {/* Point Display Badge */}
                 <div className="flex items-center bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-full mr-2 shadow-sm cursor-default group flex-shrink-0" title="보유 포인트">
                    <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center mr-2 shadow-inner text-white text-[10px] font-black">
                        P
                    </div>
                    <span className="text-gray-800 font-extrabold text-sm tracking-tight group-hover:text-yellow-600 transition-colors">
                        {userPoints.toLocaleString()}
                    </span>
                 </div>

                 <button 
                    onClick={onNavigateToMyPage}
                    className="text-xs text-gray-500 font-medium mr-1 hover:text-primary transition-colors flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 flex-shrink-0"
                 >
                    <i className="fa-regular fa-user"></i>
                    <span className="text-primary font-bold max-w-[80px] truncate">{userName}</span>님
                 </button>
                 <button 
                  onClick={onLogin} // Acts as logout
                  className="text-gray-400 hover:text-gray-600 font-medium transition-colors text-sm ml-1 flex-shrink-0"
                >
                  로그아웃
                </button>
                </>
            ) : (
                <>
                <button 
                onClick={onLogin}
                className="text-primary font-medium hover:text-primaryLight transition-colors text-sm whitespace-nowrap"
                >
                로그인
                </button>
                <button 
                onClick={onSignup}
                className="bg-primary hover:bg-primaryLight text-white px-4 py-1.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-sm whitespace-nowrap"
                >
                회원가입
                </button>
                </>
            )}
          </div>
        </nav>

        {/* Mobile Hamburger */}
        <button 
          className="md:hidden text-gray-700 text-xl"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <i className="fa-solid fa-bars"></i>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-[80%] max-w-sm bg-white h-full shadow-2xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <span className="text-2xl font-bold text-primary">instakoo</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 text-2xl">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            {isLoggedIn ? (
                 <div className="mb-6 p-5 bg-gray-50 rounded-2xl text-center border border-gray-100 shadow-sm">
                    <div className="flex flex-col items-center gap-1 mb-3">
                        <span className="text-gray-500 text-sm">반갑습니다,</span>
                        <div className="text-lg font-bold">
                            <span className="text-primary">{userName}</span>님
                        </div>
                    </div>
                    
                    {/* Mobile Point Badge */}
                    <div className="bg-white border border-yellow-200 rounded-xl p-3 flex justify-between items-center shadow-sm mb-3">
                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                            <i className="fa-solid fa-wallet text-yellow-400"></i> 보유 포인트
                        </span>
                        <span className="font-extrabold text-gray-800 text-lg">
                            {userPoints.toLocaleString()} <span className="text-sm font-bold text-yellow-500">P</span>
                        </span>
                    </div>
                    
                    {userRole === 'ADMIN' && (
                        <button 
                            onClick={() => { setIsMobileMenuOpen(false); if(onNavigateToAdmin) onNavigateToAdmin(); }}
                            className="w-full py-2 bg-gray-800 text-white rounded-lg text-sm font-bold shadow-md active:scale-95 transition-transform mb-2"
                        >
                            <i className="fa-solid fa-gear mr-1"></i> 관리자 페이지
                        </button>
                    )}

                    <button 
                        onClick={() => { setIsMobileMenuOpen(false); if(onNavigateToMyPage) onNavigateToMyPage(); }}
                        className="w-full py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-md active:scale-95 transition-transform"
                    >
                        마이페이지 바로가기
                    </button>
                 </div>
            ) : (
                <div className="mb-6">
                    <div className="p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-500 mb-2">
                        로그인 후 서비스를 이용해보세요.
                    </div>
                </div>
            )}

            {/* Mobile Coupon Button (Visible for all) */}
            <button 
                onClick={() => { setIsMobileMenuOpen(false); if(onOpenCoupons) onOpenCoupons(); }}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-bold shadow-md active:scale-95 transition-transform mb-4 flex items-center justify-center gap-2"
            >
                <i className="fa-solid fa-gift"></i>
                내 쿠폰함 {isLoggedIn && `(${userCoupons}장)`}
            </button>

            <nav className="flex flex-col gap-6">
              {navItems.map((item) => (
                <a 
                  key={item.name} 
                  href={item.href} 
                  target={item.external ? "_blank" : "_self"}
                  className={`text-lg font-medium border-b border-gray-100 pb-2 flex justify-between items-center ${item.highlight ? 'text-primary font-bold' : 'text-gray-800'}`}
                  onClick={(e) => {
                    if (!item.external) {
                      setIsMobileMenuOpen(false);
                      if (item.action) {
                        e.preventDefault();
                        item.action();
                      }
                    }
                  }}
                >
                  <span className="flex items-center gap-2">
                      {item.highlight && <i className="fa-solid fa-magnifying-glass"></i>}
                      {item.name}
                  </span>
                  <i className="fa-solid fa-chevron-right text-gray-300 text-sm"></i>
                </a>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-3">
              {isLoggedIn ? (
                 <button 
                 onClick={() => { setIsMobileMenuOpen(false); onLogin(); }}
                 className="w-full py-3 rounded-xl border border-gray-200 text-gray-500 font-bold"
               >
                 로그아웃
               </button>
              ) : (
                <>
                <button 
                    onClick={() => { setIsMobileMenuOpen(false); onLogin(); }}
                    className="w-full py-3 rounded-xl border border-primary text-primary font-bold"
                >
                    로그인
                </button>
                <button 
                    onClick={() => { setIsMobileMenuOpen(false); onSignup(); }}
                    className="w-full py-3 rounded-xl bg-primary text-white font-bold shadow-lg"
                >
                    회원가입
                </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
