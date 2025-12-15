
import { Platform, ServiceOption, Review } from './types';

export const SERVICE_OPTIONS: ServiceOption[] = [
  // --- Instagram (Updated List) ---
  {
    id: 'ig_follower_kr',
    name: '👥 인스타그램 팔로워 (한국인 실제계정)',
    pricePerUnit: 150,
    costPrice: 80,
    minQuantity: 100,
    description: '실제 활동 중인 한국인 유저들이 팔로우합니다.',
    platform: Platform.INSTAGRAM,
    inputs: [{ key: 'url', label: '계정 링크(URL) 입력', type: 'text', placeholder: 'https://instagram.com/...' }]
  },
  {
    id: 'ig_follower_foreign',
    name: '🌍 외국인 팔로워',
    pricePerUnit: 15,
    costPrice: 5,
    minQuantity: 500,
    description: '가성비 좋게 계정 규모를 키울 수 있습니다.',
    platform: Platform.INSTAGRAM,
    inputs: [{ key: 'url', label: '계정 링크(URL) 입력', type: 'text', placeholder: 'https://instagram.com/...' }]
  },
  {
    id: 'ig_follower_foreign_premium',
    name: '✨ 외국인 팔로워 (프리미엄)',
    pricePerUnit: 30,
    costPrice: 10,
    minQuantity: 500,
    description: '일반 외국인 팔로워보다 이탈율이 낮고 품질이 좋습니다.',
    platform: Platform.INSTAGRAM,
    inputs: [{ key: 'url', label: '계정 링크(URL) 입력', type: 'text', placeholder: 'https://instagram.com/...' }]
  },
  {
    id: 'ig_like_kr',
    name: '❤️ 한국인 좋아요',
    pricePerUnit: 20,
    costPrice: 10,
    minQuantity: 150,
    description: '게시물에 한국인 좋아요를 늘려줍니다.',
    platform: Platform.INSTAGRAM,
    inputs: [{ key: 'url', label: '게시글 링크(URL) 입력', type: 'text', placeholder: 'https://instagram.com/p/...' }]
  },
  {
    id: 'ig_like_foreign',
    name: '🤍 외국인 좋아요',
    pricePerUnit: 10,
    costPrice: 3,
    minQuantity: 500,
    description: '게시물에 외국인 좋아요를 저렴하게 늘려줍니다.',
    platform: Platform.INSTAGRAM,
    inputs: [{ key: 'url', label: '게시글 링크(URL) 입력', type: 'text', placeholder: 'https://instagram.com/p/...' }]
  },
  {
    id: 'ig_comment_like_kr',
    name: '👍 한국인 댓글 좋아요',
    pricePerUnit: 10,
    costPrice: 5,
    minQuantity: 300,
    description: '특정 댓글의 좋아요 수를 늘려 베스트 댓글로 만듭니다.',
    platform: Platform.INSTAGRAM,
    inputs: [
      { key: 'url', label: '게시글 링크(URL) 입력', type: 'text', placeholder: 'https://instagram.com/p/...' },
      { key: 'content', label: '좋아요를 늘릴 댓글 내용', type: 'textarea', placeholder: '좋아요를 작업할 댓글의 내용을 정확히 적어주세요.' }
    ]
  },
  {
    id: 'ig_comment_kr',
    name: '💬 한국인 실제 댓글',
    pricePerUnit: 200,
    costPrice: 100,
    minQuantity: 30,
    description: '원하는 내용으로 한국인 유저가 댓글을 달아줍니다.',
    platform: Platform.INSTAGRAM,
    inputs: [
      { key: 'url', label: '게시글 링크(URL) 입력', type: 'text', placeholder: 'https://instagram.com/p/...' },
      { key: 'content', label: '작성할 댓글 내용 (줄바꿈으로 구분)', type: 'textarea', placeholder: '댓글내용1\n댓글내용2\n댓글내용3...' }
    ]
  },
  {
    id: 'ig_save_kr',
    name: '📥 한국인 릴스/게시글 저장',
    pricePerUnit: 10,
    costPrice: 5,
    minQuantity: 300,
    description: '게시글 저장 수를 늘려 도달률을 높입니다.',
    platform: Platform.INSTAGRAM,
    inputs: [{ key: 'url', label: '게시글 링크(URL) 입력', type: 'text', placeholder: 'https://instagram.com/p/...' }]
  },
  {
    id: 'ig_save_foreign',
    name: '💾 외국인 릴스/게시글 저장',
    pricePerUnit: 10,
    costPrice: 3,
    minQuantity: 300,
    description: '저렴한 비용으로 게시글 저장 수를 늘립니다.',
    platform: Platform.INSTAGRAM,
    inputs: [{ key: 'url', label: '게시글 링크(URL) 입력', type: 'text', placeholder: 'https://instagram.com/p/...' }]
  },
  {
    id: 'ig_reels_view_foreign',
    name: '👀 외국인 릴스 조회수',
    pricePerUnit: 5,
    costPrice: 1,
    minQuantity: 1000,
    description: '릴스 조회수를 빠르게 증가시킵니다.',
    platform: Platform.INSTAGRAM,
    inputs: [{ key: 'url', label: '게시글 링크(URL) 입력', type: 'text', placeholder: 'https://instagram.com/reel/...' }]
  },
  {
    id: 'ig_reels_boost',
    name: '🚀 릴스 알고리즘 부스팅 (강력추천)',
    pricePerUnit: 180000,
    costPrice: 90000,
    minQuantity: 1,
    description: '계정과 게시글에 동시에 트래픽을 집중시켜 알고리즘 노출을 극대화합니다.',
    platform: Platform.INSTAGRAM,
    inputs: [
      { key: 'url', label: '계정 입력란 (ID 또는 링크)', type: 'text', placeholder: '계정 아이디' },
      { key: 'url2', label: '게시글 입력란 (링크)', type: 'text', placeholder: '게시글 링크' }
    ]
  },

  // --- YouTube ---
  {
    id: 'yt_view',
    name: '▶️ 유튜브 조회수 증가 (고품질)',
    pricePerUnit: 15,
    costPrice: 5,
    minQuantity: 1000,
    description: '실제 사용자와 유사한 패턴으로 조회수가 증가합니다. (이탈률 낮음)',
    platform: Platform.YOUTUBE
  },
  {
    id: 'yt_sub',
    name: '🔔 유튜브 구독자 증가',
    pricePerUnit: 200, 
    costPrice: 100,
    minQuantity: 50,
    description: '채널 성장에 필수적인 구독자를 안전하게 늘려드립니다.',
    platform: Platform.YOUTUBE
  },

  // --- Naver ---
  {
    id: 'nv_autocomplete',
    name: '🔍 검색 자동완성 키워드 월보장',
    pricePerUnit: 180000,
    costPrice: 100000,
    minQuantity: 1,
    description: '주문 시 바로 작업이 들어가며, 노출 후 25일 유지 됩니다. 누락 시 . , - 등을 추가로 넣어 작업을 유지합니다.',
    platform: Platform.NAVER,
    inputs: [
      { key: 'keyword', label: '키워드 (예: 강남병원)', type: 'text', placeholder: '강남병원' },
      { key: 'targetKeyword', label: '노출 키워드 (예: 강남병원 xxx)', type: 'text', placeholder: '강남병원 xxx' }
    ]
  },
  {
    id: 'nv_place_save',
    name: '⭐ 네이버 플레이스 저장하기',
    pricePerUnit: 50,
    costPrice: 20,
    minQuantity: 50,
    description: '플레이스 순위 상승에 도움을 주는 "저장하기" 수를 늘립니다.',
    platform: Platform.NAVER
  },
  {
    id: 'nv_reward_traffic',
    name: '🚀 네이버 리워드 체험단(유입)', 
    pricePerUnit: 40,
    costPrice: 15,
    minQuantity: 100,
    description: '실제 유저가 검색을 통해 유입되어 트래픽 점수를 높여줍니다.',
    platform: Platform.NAVER
  },
  {
    id: 'nv_blog_exp',
    name: '📝 네이버 블로그 체험단', 
    pricePerUnit: 3500,
    costPrice: 2000,
    minQuantity: 5,
    description: '선정된 블로거가 직접 체험 후 리뷰를 작성하여 홍보 효과를 극대화합니다.',
    platform: Platform.NAVER
  },

  // --- Danggeun ---
  {
    id: 'dg_keyword_rank',
    name: '🥕 지역 키워드 검색순위 1-3위 월관리', 
    pricePerUnit: 250000,
    costPrice: 150000,
    minQuantity: 1,
    description: '당근마켓 내 지역 키워드 검색 시 상위(1~3위) 노출을 한 달간 보장 관리합니다.',
    platform: Platform.DANGGEUN
  },

  // --- Coupang ---
  {
    id: 'cp_traffic_30days',
    name: '🚀 쿠팡 상위노출 프로그램 30일',
    pricePerUnit: 50000,
    costPrice: 25000,
    minQuantity: 1,
    description: '필수: 상품번호(products), itemId, vendorItemId만 허용 (다른 파라미터 금지)\n예시: https://www.coupang.com/vp/products/1234567?itemId=12345678&vendorItemId=123456789',
    platform: Platform.COUPANG,
    inputs: [
      { key: 'url', label: '상품링크 (URL) *', type: 'text', placeholder: 'https://www.coupang.com/vp/products/...' },
      { key: 'keyword', label: '대표키워드', type: 'text', placeholder: '예: 원피스' }
    ]
  }
];

// Helper: Generate Random Date from 2025-06-01 to Today (or future)
const getRandomDate = () => {
  // Start date: 2025-06-01
  const start = new Date(2025, 5, 1); 
  // End date: Current time. If current time < start, use start + random buffer (future reviews)
  let end = new Date();
  if (end < start) {
      end = new Date(start.getTime() + (30 * 24 * 60 * 60 * 1000)); // +30 days window
  }
  
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}.${month}.${day}`;
};

// Helper: Auto-generate content parts
const prefixes = ["진짜", "생각보다", "항상", "역시", "기대 이상으로", "너무", "확실히", "완전"];
const cores = ["빨라요", "좋습니다", "만족스럽네요", "최고예요", "추천합니다", "편하네요", "효과 좋네요", "잘 오르네요", "자연스러워요"];
const suffixes = ["감사합니다.", "번창하세요.", "또 이용할게요.", "굿굿.", "👍", "!!", "다음에 또 올게요."];
const names = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오"];
const midNames = ["*영", "*지", "*혜", "*민", "*우", "*소", "*아", "*나", "*진", "*호", "*현", "*미", "*준", "*솔", "*별"];

const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// Generate Random Reviews (Increased Count ~44 total)
const generateReviews = (): Review[] => {
  const fixedReviews = [
    // 1. Fixed High-Quality Positive Reviews
    { name: "이*영", content: "팔로워가 생각보다 빨리 늘어서 만족스럽습니다. 자연스러워서 좋네요.", platform: Platform.INSTAGRAM, rating: 5 },
    { name: "김*지", content: "처리 속도가 정말 빠르네요. 급하게 필요했는데 감사합니다.", platform: Platform.INSTAGRAM, rating: 5 },
    { name: "박*혜", content: "유튜브 조회수 때문에 고민이었는데 확실히 효과가 있습니다.", platform: Platform.YOUTUBE, rating: 5 },
    { name: "최*민", content: "당근 지역광고 덕분에 문의가 많이 늘었습니다. 사업에 큰 도움이 되네요.", platform: Platform.DANGGEUN, rating: 5 },
    { name: "정*우", content: "플레이스 순위 관리에 도움이 많이 됩니다. 꾸준히 이용할게요.", platform: Platform.NAVER, rating: 5 },
    { name: "강*소", content: "블로그 체험단 퀄리티가 좋습니다. 사진도 정성스럽게 찍어주시네요.", platform: Platform.NAVER, rating: 5 },
    { name: "윤*아", content: "인기게시물 노출이 잘 되네요. 신기합니다.", platform: Platform.INSTAGRAM, rating: 5 },
    { name: "한*나", content: "구독자 목표 달성했습니다. 감사합니다.", platform: Platform.YOUTUBE, rating: 5 },
    { name: "오*진", content: "한국인 계정이라 그런지 이탈율이 낮아서 좋습니다.", platform: Platform.INSTAGRAM, rating: 5 },
    { name: "신*호", content: "주문하고 금방 완료되었습니다. 시스템이 편리하네요.", platform: Platform.INSTAGRAM, rating: 5 },

    // 2. Fixed Negative Reviews
    { name: "김*철", content: "작업 시작까지 시간이 조금 걸렸습니다. 여유 있게 주문하는 게 좋겠네요.", platform: Platform.YOUTUBE, rating: 3 },
    { name: "이*수", content: "가격이 조금 부담되긴 하지만 퀄리티는 확실히 좋습니다.", platform: Platform.INSTAGRAM, rating: 4 },
  ];

  // Convert Fixed Reviews to match interface
  const formattedFixedReviews = fixedReviews.map((r, idx) => ({
    id: idx + 1,
    name: r.name,
    rating: r.rating,
    content: r.content,
    platform: r.platform,
    date: getRandomDate()
  }));

  // Generate 32 additional random reviews (Total 44)
  const randomReviews: Review[] = Array.from({ length: 32 }).map((_, idx) => {
    const platformKeys = Object.values(Platform);
    const randomPlatform = platformKeys[Math.floor(Math.random() * platformKeys.length)];
    const randomContent = `${getRandomItem(prefixes)} ${getRandomItem(cores)} ${getRandomItem(suffixes)}`;
    
    // Rating Logic: Mostly 5, ~20% 4 stars, ~5% 3 stars
    const r = Math.random();
    let rating = 5;
    if (r < 0.05) rating = 3;      // 5% chance
    else if (r < 0.25) rating = 4; // 20% chance

    return {
      id: formattedFixedReviews.length + idx + 1,
      name: `${getRandomItem(names)}${getRandomItem(midNames)}`,
      rating: rating, 
      content: randomContent,
      platform: randomPlatform,
      date: getRandomDate()
    };
  });

  return [...formattedFixedReviews, ...randomReviews].sort(() => Math.random() - 0.5);
};

export const MOCK_REVIEWS = generateReviews();

export const SLIDES = [
  // Moved Random Box Event to First
  {
    id: 4,
    title: "🎁 행운의 랜덤박스 이벤트",
    subtitle: "최대 150,000P 당첨 기회! (매주 월/수/금 1장 + 추천인 5장 + 가입 3장)",
    bgColor: "from-yellow-400 to-orange-500",
    buttonText: "내 쿠폰함 확인"
  },
  {
    id: 1,
    title: "첫 충전 10% 추가 지급",
    subtitle: "instakoo 런칭 기념 특별 이벤트",
    bgColor: "from-pink-400 to-purple-500",
    buttonText: "충전하러 가기"
  },
  {
    id: 2,
    title: "유튜브 조회수/노출 패키지",
    subtitle: "알고리즘의 선택을 받는 가장 빠른 방법",
    bgColor: "from-red-400 to-pink-600",
    buttonText: "서비스 보기"
  },
  {
    id: 3,
    title: "인스타그램 인기게시물 도전",
    subtitle: "좋아요/팔로워 관리로 계정 최적화",
    bgColor: "from-purple-500 to-pink-500",
    buttonText: "바로가기"
  }
];
