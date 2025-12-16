import React, { useState, useEffect, useRef } from "react";
import { getApiBaseUrl } from "../config";

interface DiagnosisPageProps {
  onBack: () => void;
}

type DiagnosisPlatform = "INSTAGRAM" | "NAVER_PLACE" | "NAVER_SHOPPING";
type AnalysisStep = "SELECT" | "INPUT" | "ANALYZING" | "RESULT" | "ERROR";

/* =====================
   Result Interfaces
===================== */

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
  const [step, setStep] = useState<AnalysisStep>("SELECT");
  const [platform, setPlatform] = useState<DiagnosisPlatform>("INSTAGRAM");
  const [inputId, setInputId] = useState("");

  const [loadingText, setLoadingText] = useState("서버 연결 중...");
  const [progress, setProgress] = useState(0);

  const [igResult, setIgResult] = useState<InstagramResponse | null>(null);
  const [npResult, setNpResult] = useState<NaverPlaceResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const textIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* =====================
     Loading Messages
  ===================== */

  const getLoadingMessages = (p: DiagnosisPlatform) =>
    p === "INSTAGRAM"
      ? [
          "분석 서버와 보안 세션 수립 중...",
          "AI 모델 초기화...",
          "계정 데이터 분석 중...",
          "성장 가능성 계산 중...",
          "최종 리포트 생성 중...",
        ]
      : [
          "분석 서버 연결 중...",
          "플레이스 데이터 수집 중...",
          "리뷰·SEO 분석 중...",
          "경쟁력 지수 산출 중...",
          "최종 리포트 생성 중...",
        ];

  /* =====================
     Platform Select
  ===================== */

  const handleSelectPlatform = (p: DiagnosisPlatform) => {
    if (p === "NAVER_SHOPPING") {
      alert("네이버 쇼핑 진단은 준비중입니다.");
      return;
    }
    setPlatform(p);
    setStep("INPUT");
    setInputId("");
    setIgResult(null);
    setNpResult(null);
    setErrorMessage("");
  };

  /* =====================
     Start Analysis
  ===================== */

  const handleStartAnalysis = async () => {
    if (!inputId.trim()) {
      alert(
        platform === "INSTAGRAM"
          ? "인스타그램 아이디를 입력해주세요."
          : "네이버 플레이스 링크를 입력해주세요."
      );
      return;
    }

    setStep("ANALYZING");
    setProgress(0);
    setErrorMessage("");

    const messages = getLoadingMessages(platform);
    let msgIndex = 0;
    setLoadingText(messages[0]);

    textIntervalRef.current && clearInterval(textIntervalRef.current);
    progressIntervalRef.current && clearInterval(progressIntervalRef.current);

    textIntervalRef.current = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setLoadingText(messages[msgIndex]);
    }, 1500);

    progressIntervalRef.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 1 : p));
    }, 120);

    try {
      const API_BASE = getApiBaseUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      /* ===== INSTAGRAM ===== */
      if (platform === "INSTAGRAM") {
        const res = await fetch(
          `${API_BASE}/api/diagnosis/instagram?username=${encodeURIComponent(
            inputId.trim()
          )}`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        const data = await res.json();
        if (!res.ok || !data?.data) throw new Error(data?.message);

        setIgResult(data.data);
        setProgress(100);
        setStep("RESULT");
      }

      /* ===== NAVER PLACE ===== */
      if (platform === "NAVER_PLACE") {
        const res = await fetch(`${API_BASE}/api/diagnosis/naver-place`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: inputId.trim() }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (!res.ok) throw new Error(data?.message);

        const safe: NaverPlaceResponse = {
          placeName: data.placeName ?? "Unknown",
          metrics: data.metrics ?? {
            directionsTextLength: 0,
            storeInfoTextLength: 0,
            photoCount: 0,
            blogReviewCount: 0,
            receiptReviewCount: 0,
            menuCount: 0,
            menuWithDescriptionCount: 0,
          },
          keywords: data.keywords ?? { main: [], sub: [] },
          score: typeof data.score === "number" ? data.score : 0,
          grade: data.grade ?? "D",
          scoreBreakdown: Array.isArray(data.scoreBreakdown)
            ? data.scoreBreakdown
            : [],
          recommendations: Array.isArray(data.recommendations)
            ? data.recommendations
            : [],
        };

        setNpResult(safe);
        setProgress(100);
        setStep("RESULT");
      }
    } catch (e: any) {
      setErrorMessage(e?.message || "분석 중 오류가 발생했습니다.");
      setStep("ERROR");
    } finally {
      textIntervalRef.current && clearInterval(textIntervalRef.current);
      progressIntervalRef.current && clearInterval(progressIntervalRef.current);
    }
  };

  /* =====================
     RESULT RENDER (안전)
  ===================== */

  const renderResult = () => {
    if (platform === "INSTAGRAM") {
      if (!igResult) {
        return (
          <ResultFallback onRetry={() => setStep("INPUT")} />
        );
      }
      return (
        <div className="text-center text-gray-800 font-bold">
          @{igResult.username} / {igResult.score}점 ({igResult.grade})
        </div>
      );
    }

    if (platform === "NAVER_PLACE") {
      if (!npResult) {
        return (
          <ResultFallback onRetry={() => setStep("INPUT")} />
        );
      }
      return (
        <div className="text-center text-gray-800 font-bold">
          {npResult.placeName} / {npResult.score}점 ({npResult.grade})
        </div>
      );
    }

    return <ResultFallback onRetry={() => setStep("SELECT")} />;
  };

  return (
    <div className="min-h-screen bg-primaryBg pt-24 pb-12 px-4">
      {step === "SELECT" && (
        <div className="text-center">
          <button onClick={() => handleSelectPlatform("INSTAGRAM")}>
            인스타그램
          </button>
          <button onClick={() => handleSelectPlatform("NAVER_PLACE")}>
            네이버 플레이스
          </button>
        </div>
      )}

      {step === "INPUT" && (
        <div className="text-center">
          <input
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            placeholder={
              platform === "INSTAGRAM"
                ? "instagram_id"
                : "https://naver.me/xxxx"
            }
          />
          <button onClick={handleStartAnalysis}>진단 시작</button>
        </div>
      )}

      {step === "ANALYZING" && (
        <div className="text-center">
          <p>{loadingText}</p>
          <p>{progress}%</p>
        </div>
      )}

      {step === "RESULT" && renderResult()}

      {step === "ERROR" && (
        <div className="text-center text-red-500">
          <p>{errorMessage}</p>
          <button onClick={() => setStep("INPUT")}>다시 시도</button>
        </div>
      )}
    </div>
  );
};

/* =====================
   Result Fallback
===================== */
const ResultFallback = ({ onRetry }: { onRetry: () => void }) => (
  <div className="text-center">
    <p className="font-bold text-gray-700">결과를 표시할 수 없습니다.</p>
    <button onClick={onRetry}>다시 시도</button>
  </div>
);

export default DiagnosisPage;
