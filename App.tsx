
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import StatsSection from './components/StatsSection';
import OrderForm from './components/OrderForm';
import GuideSection from './components/GuideSection';
import Reviews from './components/Reviews';
import Footer from './components/Footer';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import RechargePage from './components/RechargePage';
import AdminPage from './components/AdminPage';
import MyPage from './components/MyPage';
import DiagnosisPage from './components/DiagnosisPage'; // Imported
import ServiceDetailModal from './components/ServiceDetailModal';
import NoticePopup from './components/NoticePopup'; 
import EventPopup from './components/EventPopup'; 
import ContactModal from './components/ContactModal'; 
import CouponModal from './components/CouponModal';
import { Platform, User } from './types';
import { db } from './firebaseConfig';
import { doc, updateDoc, increment } from 'firebase/firestore';

type ViewState = 'home' | 'login' | 'signup' | 'recharge' | 'admin' | 'mypage' | 'diagnosis';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  
  // Popups State
  const [isNoticePopupOpen, setIsNoticePopupOpen] = useState(false);
  const [isEventPopupOpen, setIsEventPopupOpen] = useState(false); 

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false); 
  const [targetPlatform, setTargetPlatform] = useState<Platform | null>(null);
  
  // Login Redirect State
  const [loginRedirectTarget, setLoginRedirectTarget] = useState<'COUPON' | null>(null);

  // User Session State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Initial Logic: Traffic Log & Popups Check
  useEffect(() => {
    // 1. Traffic Log (Keep local for simplicity)
    try {
      const trafficLogs = JSON.parse(localStorage.getItem('site_traffic') || '[]');
      trafficLogs.push({
        timestamp: new Date().toISOString(),
        path: window.location.pathname
      });
      if (trafficLogs.length > 1000) {
        trafficLogs.shift();
      }
      localStorage.setItem('site_traffic', JSON.stringify(trafficLogs));
    } catch (e) {
      console.error("Traffic logging failed", e);
    }

    // 2. Check Popup Logic
    const now = new Date();
    
    // Notice Popup Check
    try {
        const hideNoticeUntil = localStorage.getItem('notice_hide_until');
        if (!hideNoticeUntil || now > new Date(hideNoticeUntil)) {
            setTimeout(() => setIsNoticePopupOpen(true), 500);
        }
    } catch (e) { console.error("Notice check failed", e); }

    // Event Popup Check
    try {
        const hideEventUntil = localStorage.getItem('event_hide_until');
        if (!hideEventUntil || now > new Date(hideEventUntil)) {
             setTimeout(() => setIsEventPopupOpen(true), 500);
        }
    } catch (e) { console.error("Event check failed", e); }

  }, []);

  // Coupon Scheduler Logic (Mon, Wed, Fri at 01:00 AM)
  useEffect(() => {
      if (currentUser) {
          const checkAndGiveCoupon = async () => {
              const now = new Date();
              const day = now.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
              const hour = now.getHours();

              // Logic: Must be Mon(1), Wed(3), or Fri(5) AND past 01:00 AM
              // Also check if we already gave it today.
              if ((day === 1 || day === 3 || day === 5) && hour >= 1) {
                  const lastCouponDate = localStorage.getItem(`coupon_last_date_${currentUser.email}`);
                  const todayStr = now.toDateString();

                  if (lastCouponDate !== todayStr) {
                      try {
                          // Give Coupon in Firestore
                          await updateDoc(doc(db, "users", currentUser.email), {
                              coupons: increment(1)
                          });
                          
                          // Update Local State
                          setCurrentUser(prev => prev ? ({ ...prev, coupons: (prev.coupons || 0) + 1 }) : null);

                          localStorage.setItem(`coupon_last_date_${currentUser.email}`, todayStr);
                          alert("🎁 오늘은 행운박스 이벤트 날입니다!\n쿠폰 1장이 지급되었습니다.");
                      } catch (e) {
                          console.error("Coupon auto-give failed", e);
                      }
                  }
              }
          };
          checkAndGiveCoupon();
      }
  }, [currentUser?.email]);


  const handleDontShowNoticeToday = () => {
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    localStorage.setItem('notice_hide_until', tomorrow.toISOString());
    setIsNoticePopupOpen(false);
  };

  const handleDontShowEventToday = () => {
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    localStorage.setItem('event_hide_until', tomorrow.toISOString());
    setIsEventPopupOpen(false);
  };

  // --- Navigate Logic ---

  const navigateToHome = () => {
    setCurrentView('home');
    window.scrollTo(0, 0);
  };

  const navigateToLogin = () => {
    setCurrentView('login');
    window.scrollTo(0, 0);
  };

  const navigateToSignup = () => {
    setCurrentView('signup');
    window.scrollTo(0, 0);
  };

  const navigateToRecharge = () => {
    if (!currentUser) {
      alert('로그인이 필요한 서비스입니다.');
      navigateToLogin();
      return;
    }
    setCurrentView('recharge');
    window.scrollTo(0, 0);
  };
  
  const navigateToAdmin = () => {
    setCurrentView('admin');
    window.scrollTo(0, 0);
  };

  const navigateToMyPage = () => {
      if (!currentUser) {
          navigateToLogin();
          return;
      }
      setCurrentView('mypage');
      window.scrollTo(0, 0);
  };

  const navigateToDiagnosis = () => {
      // Login Check Added
      if (!currentUser) {
          alert('무료 진단은 로그인 후 이용 가능합니다.');
          navigateToLogin();
          return;
      }
      setCurrentView('diagnosis');
      window.scrollTo(0, 0);
  }

  // --- Hero & Banner Actions ---

  const handleHeroOrderNavigate = (platform: Platform) => {
    if (!currentUser) {
      alert('주문을 하려면 로그인이 필요합니다.');
      navigateToLogin();
      return;
    }
    if (currentView !== 'home') setCurrentView('home');
    setTargetPlatform(platform); 
    setTimeout(() => {
        const orderSection = document.getElementById('order');
        if (orderSection) {
            const headerOffset = 88;
            const elementPosition = orderSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
    }, 100);
  };

  const handleHeaderOrderClick = () => {
    if (!currentUser) {
      alert('주문을 하려면 로그인이 필요합니다.');
      navigateToLogin();
      return;
    }
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => {
        const orderSection = document.getElementById('order');
        if (orderSection) orderSection.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
        const orderSection = document.getElementById('order');
        if (orderSection) {
             const headerOffset = 88; 
             const elementPosition = orderSection.getBoundingClientRect().top;
             const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
             window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
    }
  };

  // --- Deep Link / Redirect Logic ---

  const handleGoToCouponFromEvent = () => {
      setIsEventPopupOpen(false);
      // Close notice too for better UX
      setIsNoticePopupOpen(false);

      if (currentUser) {
          setIsCouponModalOpen(true);
      } else {
          // Set flag to open coupon after login
          setLoginRedirectTarget('COUPON');
          navigateToLogin();
      }
  };

  const handleLoginRequestFromCoupon = () => {
      setIsCouponModalOpen(false);
      setLoginRedirectTarget('COUPON');
      navigateToLogin();
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    // After login, go to Home instead of potentially direct admin routing (handled via button now)
    navigateToHome();
    
    // Check Redirects
    if (loginRedirectTarget === 'COUPON') {
        setTimeout(() => setIsCouponModalOpen(true), 500);
        setLoginRedirectTarget(null); // Reset
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigateToHome();
    alert('로그아웃 되었습니다.');
  };

  // --- View Rendering ---

  if (currentView === 'admin' && currentUser?.role === 'ADMIN') {
    return <AdminPage onLogout={navigateToHome} currentUser={currentUser} />;
  }

  if (currentView === 'login') {
    return (
        <LoginPage 
            onBack={navigateToHome} 
            onSignup={navigateToSignup} 
            onAdminLogin={navigateToAdmin} // Kept for interface compatibility but logic moved to success
            onLoginSuccess={handleLoginSuccess}
        />
    );
  }

  if (currentView === 'signup') {
    return <SignupPage onBack={navigateToHome} onLogin={navigateToLogin} />;
  }

  if (currentView === 'recharge') {
    return (
        <RechargePage 
            onBack={navigateToHome} 
            currentUser={currentUser} 
            onNavigateToMyPage={navigateToMyPage}
        />
    );
  }

  if (currentView === 'mypage' && currentUser) {
      return (
          <MyPage 
            onBack={navigateToHome} 
            currentUser={currentUser} 
            onLogout={handleLogout}
          />
      );
  }

  if (currentView === 'diagnosis') {
      return (
          <DiagnosisPage onBack={navigateToHome} />
      );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-dark relative">
      <Header 
        onLogin={currentUser ? handleLogout : navigateToLogin} 
        onSignup={navigateToSignup} 
        onRecharge={navigateToRecharge}
        onOpenServiceGuide={() => setIsServiceModalOpen(true)}
        onOpenContact={() => setIsContactModalOpen(true)}
        isLoggedIn={!!currentUser}
        userName={currentUser?.email.split('@')[0]}
        userPoints={currentUser?.points} 
        userCoupons={currentUser?.coupons}
        userRole={currentUser?.role} // Pass Role
        onOrderClick={handleHeaderOrderClick}
        onNavigateToMyPage={navigateToMyPage}
        onOpenCoupons={() => setIsCouponModalOpen(true)}
        onNavigateToAdmin={navigateToAdmin} // Pass Admin Nav Function
        onNavigateToDiagnosis={navigateToDiagnosis} // Pass Diagnosis Nav
      />
      <main className="flex-grow">
        <HeroBanner 
            onRecharge={navigateToRecharge}
            onNavigateToOrder={handleHeroOrderNavigate}
            onOpenCoupons={() => setIsCouponModalOpen(true)}
        />
        
        <div className="relative z-10 -mt-6"> 
            <OrderForm targetPlatform={targetPlatform} currentUser={currentUser} />
        </div>

        <StatsSection />
        
        <GuideSection />
        <Reviews />
      </main>
      <Footer />

      {/* Popups Container - Center Alignment Logic */}
      {(isNoticePopupOpen || isEventPopupOpen) && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
             <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto" onClick={() => { setIsNoticePopupOpen(false); setIsEventPopupOpen(false); }}></div>
             
             <div className="relative z-20 flex flex-col md:flex-row gap-4 items-center justify-center max-w-5xl w-full pointer-events-none">
                 {/* Each popup handles its own click events via pointer-events-auto in its root div */}
                 
                 {isNoticePopupOpen && (
                    <div className="pointer-events-auto w-full max-w-md">
                        <NoticePopup 
                            onClose={() => setIsNoticePopupOpen(false)} 
                            onDontShowToday={handleDontShowNoticeToday}
                        />
                    </div>
                 )}

                 {isEventPopupOpen && (
                    <div className="pointer-events-auto w-full max-w-md">
                         <EventPopup 
                            onClose={() => setIsEventPopupOpen(false)}
                            onGoToCoupon={handleGoToCouponFromEvent}
                            onDontShowToday={handleDontShowEventToday}
                         />
                    </div>
                 )}
             </div>
         </div>
      )}


      {isServiceModalOpen && (
        <ServiceDetailModal onClose={() => setIsServiceModalOpen(false)} />
      )}

      {isContactModalOpen && (
        <ContactModal onClose={() => setIsContactModalOpen(false)} />
      )}

      {isCouponModalOpen && (
        <CouponModal 
            onClose={() => setIsCouponModalOpen(false)} 
            currentUser={currentUser}
            onUpdateUser={(u) => setCurrentUser(u)}
            onLoginRequest={handleLoginRequestFromCoupon}
        />
      )}

      {/* Floating Kakao Button (Enhanced) */}
      <a 
        href="https://open.kakao.com/o/s6Ivdi6h" 
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1 group no-underline"
        title="카카오톡 상담하기"
      >
        <div className="w-12 h-12 md:w-16 md:h-16 bg-[#FEE500] rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer border-2 border-white">
            <i className="fa-solid fa-comment text-[#3c1e1e] text-xl md:text-3xl"></i>
        </div>
        <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] md:text-xs font-bold text-gray-700 shadow-md border border-gray-100 group-hover:bg-white transition-colors">
            1대1 문의
        </span>
      </a>
    </div>
  );
};

export default App;
