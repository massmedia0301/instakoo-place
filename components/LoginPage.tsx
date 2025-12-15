

import React, { useState } from 'react';
import { User } from '../types';
import { db, auth, googleProvider } from '../firebaseConfig'; // Import auth, googleProvider
import { signInWithPopup } from 'firebase/auth'; // Import signInWithPopup
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Import setDoc for auto-signup

interface LoginPageProps {
  onBack: () => void;
  onSignup: () => void;
  onAdminLogin?: () => void;
  onLoginSuccess?: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onBack, onSignup, onAdminLogin, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginFailModal, setShowLoginFailModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Recovery Modal State
  const [recoveryMode, setRecoveryMode] = useState<'NONE' | 'FIND_ID' | 'FIND_PW'>('NONE');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState(''); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 1. Hardcoded Admin Check (Client Side Only)
    if (email === 'ung1994' && password === '4263440') {
      let adminUser: User = {
        id: 0,
        email: 'ung1994',
        name: '관리자',
        password: '',
        phone: '000-0000-0000',
        role: 'ADMIN',
        points: 99999999,
        coupons: 999,
        date: new Date().toISOString(),
        source: 'SYSTEM'
      };
      
      // FIX: Ensure this admin exists in DB so other features (orders, coupons) work
      try {
          const adminRef = doc(db, "users", 'ung1994');
          const adminSnap = await getDoc(adminRef);
          
          if (!adminSnap.exists()) {
              await setDoc(adminRef, adminUser);
          } else {
              // If exists, use the DB data to have latest points/coupons
              adminUser = adminSnap.data() as User;
              // Force role to ADMIN if needed
              if(adminUser.role !== 'ADMIN') {
                 adminUser.role = 'ADMIN';
                 await setDoc(adminRef, { role: 'ADMIN' }, { merge: true });
              }
          }
      } catch (e) {
          console.error("Failed to sync admin to DB", e);
      }

      if (onLoginSuccess) {
        onLoginSuccess(adminUser);
      }
      setIsLoading(false);
      return;
    }

    try {
        // 2. Fetch User from Firestore DB
        const docRef = doc(db, "users", email);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            
            // 3. Verify Password
            if (userData.password === password) {
                if (onLoginSuccess) {
                    onLoginSuccess(userData);
                }
            } else {
                setShowLoginFailModal(true);
            }
        } else {
            // User not found in DB -> Fallback to check LocalStorage (Migration Phase)
            const localUsers: User[] = JSON.parse(localStorage.getItem('site_users') || '[]');
            const localUser = localUsers.find(u => u.email === email && u.password === password);

            if (localUser) {
                // Migrate Local User to DB automatically for better UX
                try {
                    await setDoc(doc(db, "users", localUser.email), localUser);
                } catch(e) { console.error("Migration failed", e); }
                
                if (onLoginSuccess) onLoginSuccess(localUser);
            } else {
                setShowLoginFailModal(true);
            }
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("로그인 중 서버 오류가 발생했습니다.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // --- In-App Browser Detection & Handling (KakaoTalk Fix) ---
    const userAgent = navigator.userAgent;
    const isKakao = /KAKAOTALK/i.test(userAgent);
    const isInApp = /KAKAOTALK|NAVER|Line|Instagram|FBAN|FBAV/i.test(userAgent);

    if (isInApp) {
        // Android: Try to auto-open in Chrome via Intent scheme
        if (/Android/i.test(userAgent)) {
            if (window.confirm("구글 로그인은 보안 정책상 외부 브라우저(크롬 등)에서만 가능합니다.\n\n확인을 누르면 외부 브라우저로 이동합니다.")) {
                 const currentUrl = window.location.href.replace(/^https?:\/\//, '');
                 // Force open in Chrome
                 window.location.href = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
            }
            return;
        } 
        // iOS: Show alert guide
        else {
            alert("⚠️ 구글 보안 정책 안내\n\n카카오톡 등 인앱 브라우저에서는 구글 로그인이 차단됩니다.\n\n[해결방법]\n화면 우측 하단(또는 상단)의 [ ... ] 메뉴를 누른 뒤\n[다른 브라우저로 열기(Safari)]를 선택해주세요.");
            return;
        }
    }
    // ------------------------------------------------------------

    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      if (!googleUser.email) {
        alert("구글 이메일 정보를 불러올 수 없습니다.");
        setIsLoading(false);
        return;
      }

      // Check if user exists in DB
      const docRef = doc(db, "users", googleUser.email);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
         // Case A: 이미 가입된 유저 -> 로그인 성공
         const userData = docSnap.data() as User;
         if (onLoginSuccess) onLoginSuccess(userData);
      } else {
         // Case B: DB에 없는 유저 -> Auto-Signup
         const newUser: User = {
            id: Date.now(),
            email: googleUser.email,
            name: googleUser.displayName || '구글회원',
            password: 'GOOGLE_AUTH_USER', 
            phone: googleUser.phoneNumber || '01000000000', 
            role: 'USER',
            referralCode: 'NONE',
            usedReferralCode: 'GW11', // Default code for Google Login
            points: 0,
            coupons: 3, // 기본 웰컴 쿠폰 지급
            couponHistory: [],
            date: new Date().toISOString(),
            source: 'GOOGLE_LOGIN_AUTO' 
         };

         // Save to DB
         await setDoc(doc(db, "users", newUser.email), newUser);
         
         alert("환영합니다! 구글 계정으로 회원가입이 완료되었습니다.\n웰컴 쿠폰 3장이 지급되었습니다.");
         if (onLoginSuccess) onLoginSuccess(newUser);
      }
      setIsLoading(false);

    } catch (error: any) {
      console.error("Google Login Error:", error);
      setIsLoading(false);
      
      if (error.code === 'auth/invalid-api-key' || error.message.includes('api-key')) {
        alert("⛔ API 키 설정 오류\n\n구글 클라우드 콘솔에서 올바른 API 키를 생성하여 적용해주세요.");
      } else if (error.code === 'auth/operation-not-allowed') {
         alert("⛔ OAuth 설정 필요\n\n구글 클라우드 콘솔 > 'OAuth 동의 화면' 설정을 완료해야 합니다.");
      } else if (error.code === 'auth/popup-closed-by-user') {
         // Ignore close
      } else {
         alert(`로그인 오류: ${error.message}\n(Disallowed UserAgent 오류인 경우 브라우저를 변경해주세요)`);
      }
    }
  };

  // Find ID/PW Logic (Keep existing logic)
  const handleFindId = () => {
    const users: User[] = JSON.parse(localStorage.getItem('site_users') || '[]');
    const user = users.find(u => u.phone === recoveryPhone);
    if (user) {
      alert(`회원님의 아이디(이메일)는 [ ${user.email} ] 입니다.`);
      setRecoveryMode('NONE');
      setRecoveryPhone('');
    } else {
      alert('입력하신 번호로 등록된 정보가 없습니다. (서버 연동 필요)');
    }
  };

  const handleFindPw = () => {
    const users: User[] = JSON.parse(localStorage.getItem('site_users') || '[]');
    const user = users.find(u => u.email === recoveryEmail && u.phone === recoveryPhone);
    if (user) {
      alert(`회원님의 비밀번호는 [ ${user.password} ] 입니다.`);
      setRecoveryMode('NONE');
      setRecoveryPhone('');
      setRecoveryEmail('');
    } else {
      alert('일치하는 회원 정보를 찾을 수 없습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-primaryBg flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-md animate-bounce-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transform -rotate-12">
               <span className="text-white font-bold text-md italic">in</span>
            </div>
            <span className="text-2xl font-bold text-primary tracking-tight">instakoo</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">로그인</h2>
          <p className="text-gray-500 text-sm mt-1">서비스 이용을 위해 로그인해주세요.</p>
        </div>

        {/* Google Login Button (Added) */}
        <div className="mb-6">
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
                <i className="fa-solid fa-spinner fa-spin text-gray-500"></i>
            ) : (
                <i className="fa-brands fa-google text-red-500 text-lg"></i>
            )}
            구글 계정으로 로그인
          </button>
          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-400 text-xs">또는 이메일로 로그인</span>
            </div>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">이메일 (아이디)</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">비밀번호</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="비밀번호 입력"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full text-white font-bold py-3 rounded-xl shadow-lg transition-colors ${isLoading ? 'bg-gray-400' : 'bg-primary hover:bg-primaryLight'}`}
          >
            {isLoading ? '확인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-500">
          <button onClick={() => setRecoveryMode('FIND_ID')} className="hover:text-primary">아이디 찾기</button>
          <span className="h-3 w-px bg-gray-300"></span>
          <button onClick={() => setRecoveryMode('FIND_PW')} className="hover:text-primary">비밀번호 찾기</button>
          <span className="h-3 w-px bg-gray-300"></span>
          <button onClick={onSignup} className="hover:text-primary font-bold">회원가입</button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
             <button 
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-dark transition-colors"
            >
                <i className="fa-solid fa-house"></i>
                홈으로 돌아가기
            </button>
        </div>
      </div>

      {/* Login Failure Modal */}
      {showLoginFailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLoginFailModal(false)}></div>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative z-10 animate-bounce-in text-center shadow-2xl">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-exclamation text-xl text-red-500"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">로그인 실패</h3>
            <p className="text-gray-600 mb-6 text-sm">
              아이디 또는 비밀번호를 확인하세요.<br/>
              (아직 서버에 데이터가 없을 수 있습니다)
            </p>
            <button 
              onClick={() => setShowLoginFailModal(false)}
              className="w-full bg-dark text-white py-3 rounded-xl font-bold hover:bg-black transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* Find ID/PW Modals */}
      {recoveryMode !== 'NONE' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRecoveryMode('NONE')}></div>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative z-10 animate-bounce-in">
             <h3 className="text-lg font-bold text-gray-800 mb-4">{recoveryMode === 'FIND_ID' ? '아이디 찾기' : '비밀번호 찾기'}</h3>
             {recoveryMode === 'FIND_ID' ? (
                 <div className="space-y-4">
                     <input 
                        type="text" 
                        value={recoveryPhone} 
                        onChange={(e) => setRecoveryPhone(e.target.value)} 
                        className="w-full p-3 border rounded-lg" 
                        placeholder="가입 시 입력한 휴대폰 번호" 
                     />
                     <button onClick={handleFindId} className="w-full bg-primary text-white py-3 rounded-lg font-bold">아이디 찾기</button>
                 </div>
             ) : (
                 <div className="space-y-4">
                     <input 
                        type="email" 
                        value={recoveryEmail} 
                        onChange={(e) => setRecoveryEmail(e.target.value)} 
                        className="w-full p-3 border rounded-lg" 
                        placeholder="이메일" 
                     />
                     <input 
                        type="text" 
                        value={recoveryPhone} 
                        onChange={(e) => setRecoveryPhone(e.target.value)} 
                        className="w-full p-3 border rounded-lg" 
                        placeholder="휴대폰 번호" 
                     />
                     <button onClick={handleFindPw} className="w-full bg-primary text-white py-3 rounded-lg font-bold">비밀번호 찾기</button>
                 </div>
             )}
             <button onClick={() => setRecoveryMode('NONE')} className="w-full bg-gray-100 text-gray-500 py-3 rounded-lg font-bold mt-2">닫기</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default LoginPage;
