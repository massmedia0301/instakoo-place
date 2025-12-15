

import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { auth, googleProvider, db } from '../firebaseConfig'; // Import db
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore'; // Firestore functions

interface SignupPageProps {
  onBack: () => void;
  onLogin: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onBack, onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phone, setPhone] = useState(''); 
  const [referralCode, setReferralCode] = useState('');
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [bonusCouponGiven, setBonusCouponGiven] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  
  // Captcha State
  const [captcha, setCaptcha] = useState({ n1: 0, n2: 0 });
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    setCaptcha({
      n1: Math.floor(Math.random() * 9) + 1,
      n2: Math.floor(Math.random() * 9) + 1
    });
    setCaptchaAnswer('');
  };

  // --- Firestore Helper: Save User ---
  const saveUserToFirestore = async (user: User) => {
      // Use email as Document ID for easy lookup
      await setDoc(doc(db, "users", user.email), user);
  };

  // --- Firestore Helper: Check User Exists ---
  const checkUserExists = async (email: string) => {
      const docRef = doc(db, "users", email);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
  }

  // Google Sign Up Handler
  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      if (!googleUser.email) {
        alert("구글 계정의 이메일 정보를 가져올 수 없습니다.");
        setIsLoading(false);
        return;
      }

      // 1. Check DB for Duplicate
      const exists = await checkUserExists(googleUser.email);

      if (exists) {
        alert(`이미 가입된 계정입니다.\n이메일: ${googleUser.email}\n로그인 페이지로 이동합니다.`);
        setIsLoading(false);
        onLogin();
        return;
      }

      // 2. Create New User Object
      const newUser: User = {
        id: Date.now(),
        email: googleUser.email,
        name: googleUser.displayName || '구글회원',
        password: 'GOOGLE_AUTH_USER', 
        phone: googleUser.phoneNumber || '01000000000', 
        role: 'USER',
        referralCode: 'NONE',
        usedReferralCode: 'GW11', // Default code for Google Signups
        points: 0,
        coupons: 3, 
        couponHistory: [],
        date: new Date().toISOString(),
        source: 'GOOGLE' 
      };

      // 3. Save to DB
      await saveUserToFirestore(newUser);
      
      // Also save to LocalStorage for session persistence (optional backup)
      const users: User[] = JSON.parse(localStorage.getItem('site_users') || '[]');
      users.unshift(newUser);
      localStorage.setItem('site_users', JSON.stringify(users));

      setBonusCouponGiven(false);
      setShowSuccessModal(true);
      setIsLoading(false);

    } catch (error: any) {
      console.error("Google Auth Error:", error);
      setIsLoading(false);
      if (error.code === 'auth/popup-closed-by-user') return;
      
      // Handle API Key Restriction Errors specifically
      if (error.code === 'auth/invalid-api-key' || error.message.includes('api-key-not-valid')) {
        alert("⛔ API 키 설정 오류\n\nGoogle Cloud Console에서 API 키의 '애플리케이션 제한(HTTP 리퍼러)' 설정을 확인해주세요.\n현재 도메인(instakoo.shop)이 허용 목록에 추가되어야 합니다.");
        return;
      }

      // More specific error messages
      if (error.code === 'auth/operation-not-allowed') {
          alert("구글 로그인이 비활성화되어 있습니다.\nFirebase 콘솔 > Authentication > Sign-in method에서 'Google'을 사용 설정해주세요.");
      } else if (error.code === 'auth/unauthorized-domain') {
          alert(`도메인 승인이 필요합니다.\nFirebase 콘솔 > Authentication > Settings > Authorized domains에\n현재 도메인(${window.location.hostname})을 추가해주세요.`);
      } else {
          alert(`구글 로그인 중 오류가 발생했습니다.\n(${error.code}) ${error.message}`);
      }
    }
  };
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if(!email || !name || !password || !passwordConfirm || !phone || !captchaAnswer) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    
    if (password.length < 7) {
      alert('비밀번호는 7자리 이상이어야 합니다.');
      return;
    }

    if (password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    const correctAnswer = captcha.n1 + captcha.n2;
    if (parseInt(captchaAnswer) !== correctAnswer) {
      alert('자동 가입 방지 퀴즈 정답이 틀렸습니다.\n다시 시도해주세요.');
      generateCaptcha(); 
      return;
    }

    try {
      setIsLoading(true);

      // 1. Check Duplicate in DB
      const exists = await checkUserExists(email);
      if (exists) {
        setShowDuplicateModal(true);
        setIsLoading(false);
        return;
      }

      // 2. Referral Logic
      // If user input code, use it. If empty, default to 'GW11'
      let finalReferralCode = 'GW11';
      let totalCoupons = 3;
      
      if (referralCode.trim().length > 0) {
          finalReferralCode = referralCode.trim().toUpperCase();
          totalCoupons += 5; // Bonus for manually entering a code
          setBonusCouponGiven(true);
      } else {
          // If defaulted to GW11 automatically, do we give bonus? 
          // Assuming basic 3 coupons for no manual input.
          setBonusCouponGiven(false);
      }

      const newUser: User = {
        id: Date.now(),
        email: email,
        name: name,
        password: password,
        phone: phone,
        role: 'USER',
        referralCode: 'NONE',
        usedReferralCode: finalReferralCode,
        points: 0,
        coupons: totalCoupons,
        couponHistory: [],
        date: new Date().toISOString(),
        source: 'Web' 
      };
      
      // 3. Save to DB
      await saveUserToFirestore(newUser);

      // LocalStorage Backup
      const users: User[] = JSON.parse(localStorage.getItem('site_users') || '[]');
      users.unshift(newUser);
      localStorage.setItem('site_users', JSON.stringify(users));
      
      setShowSuccessModal(true);
      setIsLoading(false);
      
    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
      alert(`오류가 발생했습니다: ${err.message}`);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    onLogin();
  };

  const isPasswordMismatch = password.length > 0 && passwordConfirm.length > 0 && password !== passwordConfirm;

  return (
    <div className="min-h-screen bg-primaryBg flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-md animate-bounce-in">
        <div className="text-center mb-6">
           <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transform rotate-12">
               <span className="text-white font-bold text-md italic">in</span>
            </div>
            <span className="text-2xl font-bold text-primary tracking-tight">instakoo</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">회원가입</h2>
          <p className="text-gray-500 text-sm mt-1">간편하게 가입하고 서비스를 이용해보세요.</p>
        </div>

        {/* Google Signup Button */}
        <div className="mb-6">
          <button 
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
                <i className="fa-solid fa-spinner fa-spin text-gray-500"></i>
            ) : (
                <i className="fa-brands fa-google text-red-500 text-lg"></i>
            )}
            구글 계정으로 3초만에 시작하기
          </button>
          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-400 text-xs">또는 이메일로 가입</span>
            </div>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSignup}>
          
          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">이메일 (아이디)</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="example@email.com"
            />
          </div>

          {/* Name */}
           <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">이름</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="실명 입력"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">핸드폰 번호</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="01012345678 (숫자만 입력)"
              maxLength={11}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">비밀번호</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="비밀번호 (7자 이상)"
            />
          </div>
           <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-gray-700">비밀번호 확인</label>
                {isPasswordMismatch && (
                    <span className="text-xs text-red-500 font-bold animate-pulse">
                        비밀번호와 일치하지 않습니다.
                    </span>
                )}
            </div>
            <input 
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 ${
                  isPasswordMismatch 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-200 focus:border-primary focus:ring-primary'
              }`}
              placeholder="비밀번호 다시 입력"
            />
          </div>

          {/* Referral Code */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">추천인 코드 <span className="text-gray-400 font-normal">(선택)</span></label>
            <input 
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="미입력 시 'GW11' 자동 적용"
            />
             <p className="text-[10px] text-pink-500 mt-1 font-bold">
               * 추천인 코드 직접 입력 시 쿠폰 +5장 (총 8장) 지급!
             </p>
          </div>

          {/* Anti-Bot Quiz */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
             <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <i className="fa-solid fa-robot text-primary"></i>
                자동 가입 방지 퀴즈
             </label>
             <div className="flex items-center gap-3">
                 <div className="flex-1 bg-white border border-gray-300 rounded-lg py-2 px-3 text-center font-bold text-gray-600 select-none">
                    {captcha.n1} + {captcha.n2} = ?
                 </div>
                 <input 
                    type="number"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="정답 입력"
                 />
             </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full text-white font-bold py-3 rounded-xl shadow-lg transition-colors mt-4 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primaryLight'}`}
          >
            {isLoading ? '처리 중...' : '회원가입 완료'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          이미 계정이 있으신가요? 
          <button onClick={onLogin} className="ml-2 text-primary font-bold hover:underline">로그인</button>
        </p>

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

      {/* Duplicate Account Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDuplicateModal(false)}></div>
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm relative z-10 text-center shadow-2xl animate-bounce-in">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-user-check text-2xl text-orange-500"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">이미 가입된 계정입니다</h3>
            <p className="text-gray-600 mb-6 text-sm">
              입력하신 이메일(아이디)은<br/>이미 회원가입이 되어있습니다.
            </p>
            <div className="space-y-2">
                <button 
                  onClick={onLogin}
                  className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primaryLight transition-colors"
                >
                  로그인 하러가기
                </button>
                <button 
                  onClick={() => setShowDuplicateModal(false)}
                  className="w-full bg-gray-100 text-gray-500 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  다시 입력하기
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleSuccessConfirm}></div>
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm relative z-10 text-center shadow-2xl animate-bounce-in">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-check text-2xl text-green-500"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">회원가입 완료!</h3>
            <p className="text-gray-600 mb-6">
              환영합니다! <br/>
              <span className="text-primary font-bold">기본 쿠폰 3장</span>이 지급되었습니다.
              {bonusCouponGiven && (
                  <span className="block mt-2 text-pink-600 font-bold bg-pink-50 p-2 rounded-lg text-sm">
                      🎁 추천인 보너스: +5장 추가 지급 완료! (총 8장)
                  </span>
              )}
            </p>
            <button 
              onClick={handleSuccessConfirm}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primaryLight transition-colors"
            >
              로그인 하러가기
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SignupPage;
