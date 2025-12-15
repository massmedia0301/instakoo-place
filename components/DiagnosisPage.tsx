
import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../config';

interface DiagnosisPageProps {
  onBack: () => void;
}

type DiagnosisPlatform = 'INSTAGRAM' | 'NAVER_PLACE' | 'NAVER_SHOPPING';
type AnalysisStep = 'SELECT' | 'INPUT' | 'ANALYZING' | 'RESULT' | 'ERROR';

// Instagram Result Interface
interface InstagramResponse {
  username: string;
  followers: number;
  following: number;
  posts: number;
  score: number;
  grade: string;
  tips: string[];
  status: string;
}

// Naver Result Interface
interface NaverPlaceResponse {
    placeName: string;
    metrics: {
        directionsTextLength: number;
        storeInfoTextLength: number;
        photoCount: number;
        blogReviewCount: number;
        receiptReviewCount: number;
        menuCount: number;
        menuWithDescriptionCount: number;
    };
    keywords: {
        main: string[];
        sub: string[];
    };
    score: number;
    grade: string;
    scoreBreakdown: {
        name: string;
        score: number;
        max: number;
        notes: string;
    }[];
    recommendations: string[];
}

const DiagnosisPage: React.FC<DiagnosisPageProps> = ({ onBack }) => {
  const [step, setStep] = useState<AnalysisStep>('SELECT');
  const [platform, setPlatform] = useState<DiagnosisPlatform>('INSTAGRAM');
  const [inputId, setInputId] = useState('');
  
  // Loading State
  const [loadingText, setLoadingText] = useState('서버 연결 중...');
  const [progress, setProgress] = useState(0);
  
  // Result Data State
  const [igResult, setIgResult] = useState<InstagramResponse | null>(null);
  const [npResult, setNpResult] = useState<NaverPlaceResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // --- Step 1: Select Platform ---
  const handleSelectPlatform = (p: DiagnosisPlatform) => {
    if (p === 'NAVER_SHOPPING') {
        alert("네이버 쇼핑 진단은 준비중입니다.");
        return;
    }
    setPlatform(p);
    setStep('INPUT');
    setInputId('');
    setErrorMessage('');
  };

  // --- Step 2: Start Analysis ---
  const handleStartAnalysis = async () => {
    if (!inputId.trim()) {
      alert(platform === 'INSTAGRAM' ? '아이디(계정)를 입력해주세요.' : '네이버 플레이스 링크를 입력해주세요.');
      return;
    }

    setStep('ANALYZING');
    setProgress(0);
    setLoadingText('분석 요청 시작...');

    // Progress Simulation
    const progressTimer = setInterval(() => {
        setProgress(prev => {
            if (prev >= 90) return prev;
            return prev + Math.floor(Math.random() * 5);
        });
        
        // Random Loading Texts
        const texts = [
            "페이지 데이터 수집 중...", 
            "텍스트 및 키워드 추출 중...", 
            "이미지 분석 중...", 
            "리뷰 데이터 확인 중...", 
            "최적화 점수 계산 중..."
        ];
        setLoadingText(texts[Math.floor(Math.random() * texts.length)]);
    }, 500);

    try {
        const API_BASE = getApiBaseUrl(); 

        if (platform === 'INSTAGRAM') {
             const response = await fetch(`${API_BASE}/api/diagnosis/instagram?username=${inputId.trim()}`);
             const data = await response.json();
             
             clearInterval(progressTimer);
             setProgress(100);

             if (response.ok && data.success) {
                 setIgResult(data.data);
                 setStep('RESULT');
             } else {
                 throw new Error(data.message || '진단에 실패했습니다.');
             }

        } else if (platform === 'NAVER_PLACE') {
             const response = await fetch(`${API_BASE}/api/diagnosis/naver-place`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ url: inputId.trim() })
             });
             const data = await response.json();

             clearInterval(progressTimer);
             setProgress(100);

             if (response.ok) {
                 setNpResult(data);
                 setStep('RESULT');
             } else {
                 throw new Error(data.message || '네이버 플레이스 분석에 실패했습니다.');
             }
        }

    } catch (error: any) {
        clearInterval(progressTimer);
        console.error("Diagnosis Failed:", error);
        
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
             setErrorMessage("서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
        } else {
             setErrorMessage(error.message);
        }
        setStep('ERROR');
    }
  };

  // --- Render Components ---

  const renderPlatformSelection = () => (
    <div className="max-w-5xl mx-auto space-y-6 animate-bounce-in">
        <button onClick={onBack} className="text-gray-500 hover:text-dark font-medium text-sm flex items-center gap-1 mb-2">
            <i className="fa-solid fa-arrow-left"></i> 홈으로 돌아가기
        </button>
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">무료 계정/스토어 진단</h2>
            <p className="text-gray-500 text-sm mt-2">공개된 데이터를 분석하여 최적화 점수를 알려드립니다.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => handleSelectPlatform('INSTAGRAM')} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-pink-200 transition-all group text-center">
                <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <i className="fa-brands fa-instagram"></i>
                </div>
                <h3 className="font-bold text-gray-800">인스타그램 진단</h3>
                <p className="text-xs text-gray-400 mt-1">팔로워/게시물/활동성 분석</p>
            </button>
            <button onClick={() => handleSelectPlatform('NAVER_PLACE')} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-green-200 transition-all group text-center">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-map-location-dot"></i>
                </div>
                <h3 className="font-bold text-gray-800">네이버 플레이스</h3>
                <p className="text-xs text-gray-400 mt-1">SEO/키워드/정보충실도 분석</p>
            </button>
            <button disabled className="p-6 bg-gray-50 border border-gray-100 rounded-2xl cursor-not-allowed opacity-60 text-center">
                <div className="w-16 h-16 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                    <i className="fa-solid fa-bag-shopping"></i>
                </div>
                <h3 className="font-bold text-gray-500">네이버 쇼핑</h3>
                <p className="text-xs text-gray-400 mt-1">준비중</p>
            </button>
        </div>
    </div>
  );

  const renderInput = () => (
    <div className="max-w-md mx-auto animate-bounce-in">
        <button onClick={() => setStep('SELECT')} className="text-gray-400 text-sm mb-4 flex items-center gap-1 hover:text-gray-600">
            <i className="fa-solid fa-arrow-left"></i> 뒤로가기
        </button>
        <div className="bg-white p-8 rounded-[32px] shadow-lg border border-gray-100 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 ${platform === 'INSTAGRAM' ? 'bg-pink-50 text-pink-500' : 'bg-green-50 text-green-500'}`}>
                <i className={platform === 'INSTAGRAM' ? "fa-brands fa-instagram" : "fa-solid fa-map-location-dot"}></i>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
                {platform === 'INSTAGRAM' ? '인스타그램 아이디 입력' : '네이버 플레이스 링크 입력'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
                {platform === 'INSTAGRAM' ? (
                    <>분석할 계정의 아이디를 정확히 입력해주세요.<br/><span className="text-red-400 text-xs">* 비공개 계정은 분석 불가</span></>
                ) : (
                    <>플레이스 공유 링크(naver.me)를 입력해주세요.<br/><span className="text-gray-400 text-xs">예: https://naver.me/GuM...</span></>
                )}
            </p>
            <input 
                type="text" 
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartAnalysis()}
                placeholder={platform === 'INSTAGRAM' ? "예: instakoo_official" : "예: https://naver.me/..."}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-primary text-center font-bold text-lg"
            />
            <button 
                onClick={handleStartAnalysis}
                className={`w-full text-white font-bold py-4 rounded-xl shadow-md transition-transform hover:scale-105 ${platform === 'INSTAGRAM' ? 'bg-primary hover:bg-primaryLight' : 'bg-green-500 hover:bg-green-600'}`}
            >
                실시간 분석 시작
            </button>
        </div>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="max-w-md mx-auto text-center py-10 animate-bounce-in">
        <div className="mb-6 relative">
            <div className={`w-24 h-24 border-4 border-gray-100 rounded-full animate-spin mx-auto ${platform === 'INSTAGRAM' ? 'border-t-primary' : 'border-t-green-500'}`}></div>
            <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-600 text-sm">{progress}%</div>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">AI 정밀 분석 중</h2>
        <p className="text-gray-500 text-sm animate-pulse">{loadingText}</p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-6 mb-2">
            <div className={`h-2.5 rounded-full transition-all duration-300 ${platform === 'INSTAGRAM' ? 'bg-primary' : 'bg-green-500'}`} style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-xs text-gray-400">데이터 양에 따라 최대 30초가 소요될 수 있습니다.</p>
    </div>
  );

  const renderError = () => (
    <div className="max-w-md mx-auto text-center py-10 animate-bounce-in">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fa-solid fa-triangle-exclamation text-3xl text-red-500"></i>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">분석 실패</h2>
        <p className="text-gray-600 mb-6 px-4 break-keep font-medium bg-red-50 p-4 rounded-xl border border-red-100">
            {errorMessage}
        </p>
        
        <button 
            onClick={() => setStep('INPUT')}
            className="px-8 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-black transition-colors"
        >
            다시 시도하기
        </button>
    </div>
  );

  // --- RESULT RENDERERS ---

  const renderResult = () => {
      if (platform === 'INSTAGRAM') return renderInstagramResult();
      if (platform === 'NAVER_PLACE') return renderNaverResult();
      return null;
  };

  const renderInstagramResult = () => {
      if (!igResult) return null;
      const { score, grade, followers, following, posts, tips, status, username } = igResult;
      
      let gradeColor = 'text-red-500';
      if (grade === 'S') gradeColor = 'text-purple-600';
      else if (grade === 'A') gradeColor = 'text-green-500';
      else if (grade === 'B') gradeColor = 'text-blue-500';
      else if (grade === 'C') gradeColor = 'text-orange-500';

      return (
        <div className="max-w-5xl mx-auto animate-bounce-in">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">인스타그램 진단 결과</h2>
                <button onClick={() => { setStep('INPUT'); setInputId(''); }} className="text-gray-500 text-sm hover:text-dark">
                    <i className="fa-solid fa-rotate-right mr-1"></i> 다시 조회
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full p-[2px] mb-3 shadow-md">
                             <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                                <i className="fa-regular fa-user text-3xl text-gray-300"></i>
                             </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">@{username}</h3>
                        <p className="text-sm text-gray-500 mt-1">상태: <span className="font-bold text-green-500">{status}</span></p>
                        
                        <div className="flex gap-4 mt-6 text-sm text-gray-600 bg-gray-50 px-6 py-3 rounded-xl w-full justify-around">
                            <div className="text-center"><span className="block font-bold text-lg">{posts.toLocaleString()}</span>게시물</div>
                            <div className="w-px bg-gray-200"></div>
                            <div className="text-center"><span className="block font-bold text-lg">{followers.toLocaleString()}</span>팔로워</div>
                            <div className="w-px bg-gray-200"></div>
                            <div className="text-center"><span className="block font-bold text-lg">{following.toLocaleString()}</span>팔로잉</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center">
                    <h3 className="font-bold text-gray-800 mb-6">종합 최적화 점수</h3>
                    <div className="relative w-48 h-24 bg-gray-100 rounded-t-full overflow-hidden mb-4">
                        <div 
                            className="absolute bottom-0 left-0 w-full h-full origin-bottom transition-transform duration-1000 ease-out"
                            style={{ 
                                background: `conic-gradient(from 180deg, ${grade === 'D' ? '#EF4444' : grade === 'C' ? '#F97316' : grade === 'B' ? '#3B82F6' : grade === 'A' ? '#22C55E' : '#9333EA'} ${(score / 100) * 180}deg, transparent 0deg)`
                            }}
                        ></div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-18 bg-white rounded-t-full flex items-end justify-center pb-2">
                             <div className="text-center">
                                 <span className={`text-5xl font-black ${gradeColor} tracking-tighter`}>{grade}</span>
                             </div>
                        </div>
                    </div>
                    <div className="text-center">
                        <span className="text-2xl font-bold text-gray-800">{score}</span>
                        <span className="text-gray-400 text-sm"> / 100점</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">진단 리포트 & 솔루션</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                    {tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg">
                            <i className="fa-solid fa-check text-green-500 mt-0.5"></i>
                            <span>{tip}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      );
  };

  const renderNaverResult = () => {
      if (!npResult) return null;
      const { placeName, score, grade, scoreBreakdown, recommendations, metrics, keywords } = npResult;

      let gradeColor = 'text-red-500';
      if (grade === 'S') gradeColor = 'text-purple-600';
      else if (grade === 'A') gradeColor = 'text-green-500';
      else if (grade === 'B') gradeColor = 'text-blue-500';
      else if (grade === 'C') gradeColor = 'text-orange-500';

      return (
        <div className="max-w-6xl mx-auto animate-bounce-in">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="bg-green-500 text-white w-6 h-6 rounded flex items-center justify-center text-xs">N</span>
                    플레이스 진단 결과
                </h2>
                <button onClick={() => { setStep('INPUT'); setInputId(''); }} className="text-gray-500 text-sm hover:text-dark">
                    <i className="fa-solid fa-rotate-right mr-1"></i> 다시 조회
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                
                {/* 1. Score Card */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{placeName}</h3>
                    <p className="text-xs text-gray-500 mb-6">SEO 최적화 점수</p>
                    
                     <div className="relative w-48 h-24 bg-gray-100 rounded-t-full overflow-hidden mb-4">
                        <div 
                            className="absolute bottom-0 left-0 w-full h-full origin-bottom transition-transform duration-1000 ease-out"
                            style={{ 
                                background: `conic-gradient(from 180deg, ${grade === 'D' ? '#EF4444' : grade === 'C' ? '#F97316' : grade === 'B' ? '#3B82F6' : grade === 'A' ? '#22C55E' : '#9333EA'} ${(score / 100) * 180}deg, transparent 0deg)`
                            }}
                        ></div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-18 bg-white rounded-t-full flex items-end justify-center pb-2">
                             <div className="text-center">
                                 <span className={`text-5xl font-black ${gradeColor} tracking-tighter`}>{grade}</span>
                             </div>
                        </div>
                    </div>
                    <div className="text-center mb-4">
                        <span className="text-3xl font-bold text-gray-800">{score}</span>
                        <span className="text-gray-400 text-sm"> / 100점</span>
                    </div>
                    <p className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">상위 30% 수준입니다.</p>
                </div>

                {/* 2. Metrics Grid */}
                <div className="lg:col-span-2 bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">📊 상세 분석 데이터</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">방문자 리뷰</p>
                            <p className="font-bold text-lg text-slate-700">{metrics.receiptReviewCount.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">블로그 리뷰</p>
                            <p className="font-bold text-lg text-slate-700">{metrics.blogReviewCount.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">사진 수</p>
                            <p className="font-bold text-lg text-slate-700">~{metrics.photoCount}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">메뉴/설명</p>
                            <p className="font-bold text-lg text-slate-700">{metrics.menuCount} / {metrics.menuWithDescriptionCount}</p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h4 className="text-sm font-bold text-gray-700 mb-2">🔍 추출 키워드 TOP 5</h4>
                        <div className="flex flex-wrap gap-2">
                            {keywords.main.length > 0 ? keywords.main.map((k, i) => (
                                <span key={i} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold border border-blue-100">#{k}</span>
                            )) : <span className="text-xs text-gray-400">키워드 데이터 부족</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Breakdown & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-list-check text-green-500"></i> 항목별 세부 점수
                    </h3>
                    <div className="space-y-4">
                        {scoreBreakdown.map((item, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-bold text-gray-700">{item.name}</span>
                                    <span className="text-gray-500">{item.score}/{item.max}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                                    <div className={`h-2 rounded-full ${item.score === item.max ? 'bg-green-500' : 'bg-yellow-400'}`} style={{ width: `${(item.score / item.max) * 100}%` }}></div>
                                </div>
                                <p className="text-[10px] text-gray-400">{item.notes}</p>
                            </div>
                        ))}
                    </div>
                 </div>

                 <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-lightbulb text-yellow-500"></i> 최적화 가이드
                    </h3>
                    {recommendations.length > 0 ? (
                        <ul className="space-y-3">
                            {recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-2 bg-red-50 p-3 rounded-lg border border-red-100">
                                    <i className="fa-solid fa-circle-exclamation text-red-500 mt-0.5 text-xs"></i>
                                    <span className="text-xs text-gray-700 font-medium leading-relaxed">{rec}</span>
                                </li>
                            ))}
                            <li className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <i className="fa-solid fa-info-circle text-blue-500 mt-0.5 text-xs"></i>
                                <span className="text-xs text-gray-700 font-medium leading-relaxed">
                                    정기적인 "플레이스 저장" 및 "리뷰 관리"는 상위 노출의 핵심입니다.
                                </span>
                            </li>
                        </ul>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                            <i className="fa-solid fa-check-circle text-4xl text-green-500 mb-2"></i>
                            <p>특별한 개선사항이 발견되지 않았습니다.<br/>현재 상태를 훌륭하게 유지하고 계십니다!</p>
                        </div>
                    )}
                 </div>
            </div>
        </div>
      );
  };

  return (
    <div className="min-h-screen bg-primaryBg pt-24 pb-12 px-4">
      {step === 'SELECT' && renderPlatformSelection()}
      {step === 'INPUT' && renderInput()}
      {step === 'ANALYZING' && renderAnalyzing()}
      {step === 'RESULT' && renderResult()}
      {step === 'ERROR' && renderError()}
    </div>
  );
};

export default DiagnosisPage;
