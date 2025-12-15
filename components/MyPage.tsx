

import React, { useState, useEffect } from 'react';
import { User, Order, WithdrawalRequest, Review } from '../types';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, setDoc, doc, updateDoc, increment, getDoc, deleteDoc } from 'firebase/firestore';

interface MyPageProps {
  onBack: () => void;
  currentUser: User;
  onLogout: () => void;
}

type Tab = 'HISTORY' | 'RECHARGE_LOG' | 'REFUND' | 'MY_REVIEWS' | 'SETTINGS'; 

const MyPage: React.FC<MyPageProps> = ({ onBack, currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('HISTORY');
  const [orders, setOrders] = useState<Order[]>([]);
  const [recharges, setRecharges] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [userInfo, setUserInfo] = useState<User>(currentUser);

  // Password Change State
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  // Refund State
  const [refundBank, setRefundBank] = useState('');
  const [refundAccount, setRefundAccount] = useState('');
  const [refundName, setRefundName] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTargetOrder, setReviewTargetOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [editReviewId, setEditReviewId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [currentUser.email]);

  const loadData = async () => {
    // 1. Reload User Info
    const userRef = doc(db, "users", currentUser.email);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) setUserInfo(userSnap.data() as User);

    // 2. Load Orders
    const ordersQ = query(collection(db, "orders"), where("userId", "==", currentUser.email));
    const ordersSnap = await getDocs(ordersQ);
    const myOrders = ordersSnap.docs.map(d => d.data() as Order);
    // Sort
    myOrders.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setOrders(myOrders);

    // 3. Load Recharges
    const rechargesQ = query(collection(db, "recharges"), where("user", "==", currentUser.email));
    const rechargesSnap = await getDocs(rechargesQ);
    const myRecharges = rechargesSnap.docs.map(d => d.data());
    myRecharges.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecharges(myRecharges);

    // 4. Load Withdrawals
    const wdQ = query(collection(db, "withdrawals"), where("userId", "==", currentUser.email));
    const wdSnap = await getDocs(wdQ);
    const myWithdrawals = wdSnap.docs.map(d => d.data() as WithdrawalRequest);
    myWithdrawals.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setWithdrawals(myWithdrawals);

    // 5. Load Reviews
    const reviewsQ = query(collection(db, "reviews"), where("userId", "==", currentUser.email));
    const reviewsSnap = await getDocs(reviewsQ);
    const reviews = reviewsSnap.docs.map(d => d.data() as Review);
    reviews.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setMyReviews(reviews);
  };

  const handleChangePassword = async () => {
    if (currentPw !== userInfo.password) {
      alert('현재 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPw.length < 4) {
      alert('새 비밀번호는 4자 이상이어야 합니다.');
      return;
    }
    if (newPw !== confirmPw) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
        await updateDoc(doc(db, "users", userInfo.email), { password: newPw });
        alert('비밀번호가 성공적으로 변경되었습니다.\n보안을 위해 다시 로그인해주세요.');
        onLogout();
    } catch (e) {
        alert("비밀번호 변경 실패");
    }
  };

  const handleRequestRefund = async () => {
      if (!refundBank || !refundAccount || !refundName) {
          alert('입금받을 계좌 정보를 모두 입력해주세요.');
          return;
      }
      if (refundAmount < 50000) {
          alert('최소 출금 가능 금액은 50,000 P 입니다.');
          return;
      }
      if (refundAmount % 10000 !== 0) {
          alert('출금 금액은 10,000원 단위로만 가능합니다.');
          return;
      }
      if (refundAmount > userInfo.points) {
          alert('보유 포인트보다 많은 금액을 출금할 수 없습니다.');
          return;
      }

      if(!window.confirm(`${refundAmount.toLocaleString()}원을 출금 신청하시겠습니까?`)) return;

      try {
          const wdId = `W-${Date.now()}`;
          const newRequest: WithdrawalRequest = {
              id: wdId,
              userId: userInfo.email,
              userName: refundName,
              bankName: refundBank,
              accountNumber: refundAccount,
              amount: refundAmount,
              status: 'PENDING',
              date: new Date().toISOString()
          };

          await setDoc(doc(db, "withdrawals", wdId), newRequest);
          
          // Deduct Points
          await updateDoc(doc(db, "users", userInfo.email), {
              points: increment(-refundAmount)
          });

          // Update State
          setUserInfo(prev => ({ ...prev, points: prev.points - refundAmount }));
          setWithdrawals([newRequest, ...withdrawals]);
          setRefundAmount(0);
          alert('출금 신청이 완료되었습니다.\n관리자 확인 후 입금 처리됩니다.');
      } catch (e) {
          console.error(e);
          alert("출금 신청 실패");
      }
  };

  const openReviewModal = (order: Order) => {
      setReviewTargetOrder(order);
      setReviewRating(5);
      setReviewContent('');
      setIsEditingReview(false);
      setEditReviewId(null);
      setShowReviewModal(true);
  };

  const handleEditReviewModal = (review: Review) => {
      // Find original order if possible, or create mock for display
      const originalOrder = orders.find(o => o.id === review.orderId) || {
          serviceName: '삭제된 주문',
          quantity: 0,
          platform: review.platform
      } as Order;

      setReviewTargetOrder(originalOrder);
      setReviewRating(review.rating);
      setReviewContent(review.content);
      setIsEditingReview(true);
      setEditReviewId(String(review.id));
      setShowReviewModal(true);
  };

  const handleDeleteReview = async (review: Review) => {
      if(!window.confirm("정말 삭제하시겠습니까?\n삭제된 리뷰는 복구할 수 없으며, 지급된 포인트(500P)는 회수됩니다.")) return;
      
      try {
          // 1. Delete Review Doc
          await deleteDoc(doc(db, "reviews", String(review.id)));

          // 2. Reset Order hasReviewed status (if order exists)
          if(review.orderId) {
             await updateDoc(doc(db, "orders", review.orderId), { hasReviewed: false });
          }

          // 3. Deduct Points
          await updateDoc(doc(db, "users", userInfo.email), { points: increment(-500) });
          setUserInfo(prev => ({ ...prev, points: prev.points - 500 }));

          // Update Local State
          setMyReviews(prev => prev.filter(r => r.id !== review.id));
          setOrders(prev => prev.map(o => o.id === review.orderId ? { ...o, hasReviewed: false } : o));

          alert("리뷰가 삭제되었습니다.");
      } catch(e) {
          console.error(e);
          alert("삭제 실패");
      }
  };

  const handleSubmitReview = async () => {
      if (!reviewTargetOrder) return;
      if (reviewContent.length < 5) {
          alert("리뷰 내용을 5자 이상 작성해주세요.");
          return;
      }

      try {
          const reviewId = isEditingReview && editReviewId ? editReviewId : String(Date.now());
          const newReview: Review = {
              id: isEditingReview ? reviewId : Number(reviewId),
              userId: userInfo.email,
              orderId: reviewTargetOrder.id,
              name: userInfo.name ? `${userInfo.name.substring(0,1)}*${userInfo.name.substring(2)}` : userInfo.email.split('@')[0].substring(0,3) + '***',
              rating: reviewRating,
              content: reviewContent,
              platform: reviewTargetOrder.platform,
              date: new Date().toISOString().split('T')[0].replace(/-/g, '.')
          };
          
          // 1. Save Review to DB
          await setDoc(doc(db, "reviews", reviewId), newReview);

          if (isEditingReview) {
              setMyReviews(prev => prev.map(r => String(r.id) === reviewId ? newReview : r));
              alert("리뷰가 수정되었습니다.");
          } else {
              // 2. Mark Order as Reviewed
              await updateDoc(doc(db, "orders", reviewTargetOrder.id), { hasReviewed: true });
              setOrders(orders.map(o => o.id === reviewTargetOrder.id ? { ...o, hasReviewed: true } : o));

              // 3. Give Points (+500P) only for new reviews
              await updateDoc(doc(db, "users", userInfo.email), { points: increment(500) });
              setUserInfo(prev => ({ ...prev, points: prev.points + 500 }));
              
              setMyReviews([newReview, ...myReviews]);
              alert("소중한 리뷰 감사합니다!\n500P가 지급되었습니다.");
          }

          setShowReviewModal(false);
      } catch (e) {
          console.error(e);
          alert("리뷰 등록 실패");
      }
  };

  const formatDate = (isoString: string) => {
    try {
        const d = new Date(isoString);
        return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    } catch { return '-'; }
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">마이페이지</h1>
                <p className="text-gray-500 text-sm">내 활동 내역과 정보를 관리하세요.</p>
            </div>
            <button 
                onClick={onBack}
                className="text-gray-500 hover:text-dark font-medium text-sm flex items-center gap-1"
            >
                <i className="fa-solid fa-arrow-left"></i> 홈으로
            </button>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary text-3xl font-bold">
                {userInfo.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-grow text-center md:text-left">
                <div className="text-xs text-gray-500 font-bold mb-1">MEMBERSHIP</div>
                <h2 className="text-xl font-bold text-gray-800">{userInfo.email}</h2>
                <div className="flex items-center gap-2 justify-center md:justify-start mt-1">
                    <span className="text-sm text-gray-600">{userInfo.name || '이름 미등록'}</span>
                    <span className="text-xs text-gray-400">| {userInfo.phone || '전화번호 미등록'}</span>
                </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-5 min-w-[200px] text-center md:text-right border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">보유 포인트</div>
                <div className="text-2xl font-extrabold text-primary">{userInfo.points.toLocaleString()} P</div>
            </div>
        </div>

        {/* Deposit Info Card (Featured) */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                        <i className="fa-solid fa-building-columns text-yellow-400"></i>
                        충전 계좌 안내
                    </h3>
                    <p className="text-slate-300 text-sm mb-4">입금 후 <span className="text-white font-bold underline decoration-yellow-400">10분 내</span>로 포인트가 자동 지급됩니다.</p>
                    <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                        <span className="font-bold text-yellow-400">케이뱅크</span>
                        <span className="text-xl font-mono tracking-wider font-bold">100-137-096454</span>
                        <span className="text-sm text-slate-300">(예금주: 이건웅)</span>
                    </div>
                </div>
                <div className="hidden md:block text-5xl opacity-10 rotate-12">
                    <i className="fa-solid fa-wallet"></i>
                </div>
            </div>
        </div>

        {/* Tabs & Content */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[500px] overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar">
                <button 
                    onClick={() => setActiveTab('HISTORY')}
                    className={`flex-1 min-w-[100px] py-4 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'HISTORY' ? 'text-primary border-b-2 border-primary bg-pink-50/30' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <i className="fa-solid fa-list-check mr-2"></i> 서비스 사용
                </button>
                <button 
                    onClick={() => setActiveTab('RECHARGE_LOG')}
                    className={`flex-1 min-w-[100px] py-4 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'RECHARGE_LOG' ? 'text-primary border-b-2 border-primary bg-pink-50/30' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <i className="fa-solid fa-receipt mr-2"></i> 충전 내역
                </button>
                 <button 
                    onClick={() => setActiveTab('MY_REVIEWS')}
                    className={`flex-1 min-w-[100px] py-4 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'MY_REVIEWS' ? 'text-primary border-b-2 border-primary bg-pink-50/30' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <i className="fa-solid fa-star mr-2"></i> 나의 리뷰
                </button>
                <button 
                    onClick={() => setActiveTab('REFUND')}
                    className={`flex-1 min-w-[100px] py-4 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'REFUND' ? 'text-primary border-b-2 border-primary bg-pink-50/30' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <i className="fa-solid fa-hand-holding-dollar mr-2"></i> 포인트 환불
                </button>
                <button 
                    onClick={() => setActiveTab('SETTINGS')}
                    className={`flex-1 min-w-[100px] py-4 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'SETTINGS' ? 'text-primary border-b-2 border-primary bg-pink-50/30' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <i className="fa-solid fa-user-gear mr-2"></i> 설정
                </button>
            </div>

            {/* Content Area */}
            <div className="p-6">
                
                {/* 1. Usage History */}
                {activeTab === 'HISTORY' && (
                    <div className="space-y-4">
                        {orders.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <i className="fa-regular fa-folder-open text-4xl mb-3"></i>
                                <p>아직 이용하신 내역이 없습니다.</p>
                            </div>
                        ) : (
                            orders.map(order => (
                                <div key={order.id} className="border border-gray-100 rounded-2xl p-4 hover:bg-gray-50 transition-colors flex flex-col md:flex-row justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-white bg-slate-400 px-2 py-0.5 rounded">{order.platform}</span>
                                            <span className="text-xs text-gray-400">{formatDate(order.date)}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-800 text-lg mb-1">{order.serviceName}</h4>
                                        <div className="text-sm text-gray-600">
                                            수량: <span className="font-bold">{order.quantity.toLocaleString()}개</span>
                                            {order.details.url && <span className="mx-2 text-gray-300">|</span>}
                                            {order.details.url && <a href={order.details.url} target="_blank" className="text-blue-400 hover:underline truncate max-w-[200px] inline-block align-bottom">{order.details.url}</a>}
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col justify-center items-end gap-2">
                                        <div className="text-red-500 font-bold">-{order.amount.toLocaleString()} P</div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div>
                                                {order.status === 'PENDING' && (
                                                    <span className="text-xs bg-yellow-100 text-yellow-600 px-3 py-1.5 rounded-full font-bold">
                                                        <i className="fa-regular fa-clock mr-1"></i>
                                                        작업 대기
                                                    </span>
                                                )}
                                                {order.status === 'PROCESSING' && (
                                                    <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full font-bold animate-pulse">
                                                        <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                                                        작업 중
                                                    </span>
                                                )}
                                                {order.status === 'COMPLETED' && (
                                                    <span className="text-xs bg-green-100 text-green-600 px-3 py-1.5 rounded-full font-bold">
                                                        <i className="fa-solid fa-check mr-1"></i>
                                                        작업 완료
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Review Button Logic */}
                                            {order.status === 'COMPLETED' && !order.hasReviewed && (
                                                <button 
                                                    onClick={() => openReviewModal(order)}
                                                    className="text-xs bg-purple-100 text-purple-600 px-3 py-1.5 rounded-full font-bold hover:bg-purple-200 transition-colors border border-purple-200"
                                                >
                                                    <i className="fa-solid fa-pen mr-1"></i>
                                                    리뷰 쓰고 500P 받기
                                                </button>
                                            )}
                                            {order.status === 'COMPLETED' && order.hasReviewed && (
                                                <span className="text-xs text-gray-400 font-medium">
                                                    <i className="fa-solid fa-check mr-1"></i>리뷰 작성완료
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* 2. Recharge Log */}
                {activeTab === 'RECHARGE_LOG' && (
                    <div className="space-y-4">
                        {recharges.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <i className="fa-solid fa-receipt text-4xl mb-3"></i>
                                <p>충전 내역이 없습니다.</p>
                            </div>
                        ) : (
                            recharges.map(recharge => (
                                <div key={recharge.id} className="border border-gray-100 rounded-2xl p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">{formatDate(recharge.date)}</div>
                                        <div className="font-bold text-gray-800 text-lg">
                                            {recharge.method === 'TRANSFER' ? '계좌이체 충전' : '카드 결제 충전'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            결제금액: {recharge.amount.toLocaleString()}원
                                            {recharge.bonusPoints > 0 && <span className="text-primary ml-2">(+보너스 {recharge.bonusPoints.toLocaleString()}P)</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-primary font-bold text-lg mb-1">
                                            +{(recharge.amount + recharge.bonusPoints).toLocaleString()} P
                                        </div>
                                        <div>
                                            {recharge.status === 'PENDING' ? (
                                                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded font-bold">
                                                    <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                                                    입금 확인중
                                                </span>
                                            ) : (
                                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded font-bold">
                                                    <i className="fa-solid fa-check mr-1"></i>
                                                    입금완료(충전됨)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                
                {/* 3. My Reviews */}
                {activeTab === 'MY_REVIEWS' && (
                     <div className="space-y-4">
                        {myReviews.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <i className="fa-solid fa-star text-4xl mb-3"></i>
                                <p>작성한 리뷰가 없습니다.</p>
                            </div>
                        ) : (
                            myReviews.map(review => (
                                <div key={review.id} className="border border-gray-100 rounded-2xl p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white bg-slate-400 px-2 py-0.5 rounded">{review.platform}</span>
                                            <div className="flex text-yellow-400 text-xs">
                                                {[...Array(5)].map((_, i) => (
                                                    <i key={i} className={`fa-solid fa-star ${i < review.rating ? '' : 'text-gray-200'}`}></i>
                                                ))}
                                            </div>
                                            <span className="text-xs text-gray-400">{review.date}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleEditReviewModal(review)}
                                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200"
                                            >
                                                수정
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteReview(review)}
                                                className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {review.content}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* 4. Refund (Withdrawal) */}
                {activeTab === 'REFUND' && (
                    <div className="space-y-8">
                        {/* Form */}
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <i className="fa-solid fa-money-bill-transfer text-primary"></i>
                                출금 신청
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">은행명</label>
                                        <input type="text" value={refundBank} onChange={(e) => setRefundBank(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200" placeholder="예: 케이뱅크" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">예금주</label>
                                        <input type="text" value={refundName} onChange={(e) => setRefundName(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200" placeholder="예금주 성함" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">계좌번호</label>
                                    <input type="text" value={refundAccount} onChange={(e) => setRefundAccount(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200" placeholder="- 제외하고 입력" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">출금 신청 금액 (P)</label>
                                    <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(Number(e.target.value))} className="w-full p-3 rounded-xl border border-gray-200" placeholder="10,000원 단위" />
                                    <p className="text-xs text-red-500 mt-2 font-bold">
                                        * 최소 50,000 P 이상, 10,000 P 단위로만 신청 가능합니다.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleRequestRefund}
                                    className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-colors"
                                >
                                    출금 신청하기
                                </button>
                            </div>
                        </div>

                        {/* History */}
                        <div>
                             <h4 className="text-sm font-bold text-gray-500 mb-3">최근 신청 내역</h4>
                             <div className="space-y-3">
                                {withdrawals.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">신청 내역이 없습니다.</p>
                                ) : (
                                    withdrawals.map(w => (
                                        <div key={w.id} className="border border-gray-100 rounded-xl p-4 flex justify-between items-center bg-white">
                                            <div className="text-sm text-gray-600">
                                                <div className="text-xs text-gray-400 mb-0.5">{formatDate(w.date)}</div>
                                                <span className="font-bold">{w.bankName} {w.accountNumber}</span> ({w.userName})
                                            </div>
                                            <div className="text-right">
                                                <div className="text-red-500 font-bold">-{w.amount.toLocaleString()} P</div>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${w.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                    {w.status === 'COMPLETED' ? '지급완료' : '처리대기'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                             </div>
                        </div>
                    </div>
                )}

                {/* 5. Settings */}
                {activeTab === 'SETTINGS' && (
                    <div className="max-w-md mx-auto py-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">비밀번호 변경</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1">현재 비밀번호</label>
                                <input 
                                    type="password"
                                    value={currentPw}
                                    onChange={(e) => setCurrentPw(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                                    placeholder="현재 사용중인 비밀번호"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1">새로운 비밀번호</label>
                                <input 
                                    type="password"
                                    value={newPw}
                                    onChange={(e) => setNewPw(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                                    placeholder="변경할 비밀번호 (4자 이상)"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1">새 비밀번호 확인</label>
                                <input 
                                    type="password"
                                    value={confirmPw}
                                    onChange={(e) => setConfirmPw(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                                    placeholder="새 비밀번호 다시 입력"
                                />
                            </div>
                            <button 
                                onClick={handleChangePassword}
                                className="w-full bg-dark text-white font-bold py-3 rounded-xl hover:bg-black transition-colors shadow-lg mt-4"
                            >
                                비밀번호 변경하기
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Review Write Modal */}
      {showReviewModal && reviewTargetOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowReviewModal(false)}></div>
            <div className="bg-white rounded-[32px] p-6 w-full max-w-md relative z-10 animate-bounce-in shadow-2xl">
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">{isEditingReview ? '리뷰 수정하기' : '리뷰 작성하고 포인트 받기'}</h3>
                    {!isEditingReview && <p className="text-sm text-pink-500 font-bold mt-1">✨ 작성 시 500P가 즉시 지급됩니다!</p>}
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm text-gray-600">
                    <p><span className="font-bold text-gray-800">서비스:</span> {reviewTargetOrder.serviceName}</p>
                    <p><span className="font-bold text-gray-800">수량:</span> {reviewTargetOrder.quantity}개</p>
                </div>

                <div className="space-y-4">
                    {/* Rating */}
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button 
                                key={star} 
                                onClick={() => setReviewRating(star)}
                                className={`text-3xl transition-transform hover:scale-110 ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-200'}`}
                            >
                                <i className="fa-solid fa-star"></i>
                            </button>
                        ))}
                    </div>
                    
                    {/* Content */}
                    <div>
                        <textarea 
                            value={reviewContent}
                            onChange={(e) => setReviewContent(e.target.value)}
                            placeholder="서비스 이용 후기를 5자 이상 남겨주세요."
                            className="w-full h-24 p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-primary resize-none text-sm"
                        />
                    </div>

                    <button 
                        onClick={handleSubmitReview}
                        className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primaryLight transition-colors shadow-md"
                    >
                        {isEditingReview ? '수정 완료' : '작성 완료하고 500P 받기'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default MyPage;