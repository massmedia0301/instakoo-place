

import React, { useEffect, useState, useRef } from 'react';
import { User, Order, WithdrawalRequest, ServiceOption, Platform, Review } from '../types';
import { db } from '../firebaseConfig';
import { collection, getDocs, setDoc, doc, updateDoc, getDoc, deleteDoc, query, where } from 'firebase/firestore';
import { SERVICE_OPTIONS } from '../constants'; // Fallback for seeding

interface AdminPageProps {
  onLogout: () => void;
  currentUser: User | null;
}

type Tab = 'DASHBOARD' | 'ORDERS' | 'PROFIT' | 'MEMBERS' | 'RECHARGES' | 'WITHDRAWALS' | 'SERVICES' | 'REVIEWS';

const AdminPage: React.FC<AdminPageProps> = ({ onLogout, currentUser }) => {
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [rechargeHistory, setRechargeHistory] = useState<any[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRequest[]>([]);
  const [userList, setUserList] = useState<(User & { totalRecharge?: number })[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  
  // Services Management State
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceOption | null>(null);
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(false); // Track if using local constants
  
  // New User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPw, setNewUserPw] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<'USER' | 'ADMIN'>('USER');

  // Coupon/Point Give State
  const [showGiveModal, setShowGiveModal] = useState(false);
  const [giveMode, setGiveMode] = useState<'COUPON' | 'POINT'>('COUPON');
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [amountToGive, setAmountToGive] = useState(1); // Coupons or Points

  // Grouped Members State
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const [todayStats, setTodayStats] = useState({
    visitors: 0,
    signups: 0,
    revenue: 0,
    totalRevenue: 0, 
    pendingOrders: 0
  });

  const [loading, setLoading] = useState(true);

  // Profit Tab State
  const [profitData, setProfitData] = useState<{
      totalRevenue: number, 
      totalCost: number, 
      totalProfit: number,
      monthly: { [key: string]: { revenue: number, cost: number, profit: number } } 
  }>({ totalRevenue: 0, totalCost: 0, totalProfit: 0, monthly: {} });

  // --- PERMISSIONS LOGIC ---
  // Root Admin: ung1994 (All Permissions)
  const isRoot = currentUser?.email === 'ung1994';
  
  // Super Admin: Root OR specifically marked isSuperAdmin
  // Can Approve Recharges, Process Orders. NO Deletes/Edits/Gifts.
  const isSuper = isRoot || (currentUser?.role === 'ADMIN' && currentUser?.isSuperAdmin === true);

  // Regular Admin: View Only (Neither Root nor Super)
  // Can only view dashboard.

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
        // 1. Fetch Users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const dbUsers = usersSnapshot.docs.map(doc => doc.data() as User);
        dbUsers.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 2. Fetch Recharges
        const rechargesSnapshot = await getDocs(collection(db, "recharges"));
        const dbRecharges = rechargesSnapshot.docs.map(doc => doc.data());
        dbRecharges.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRechargeHistory(dbRecharges);

        // 3. Map Total Recharges to Users
        const userRechargeMap: Record<string, number> = {};
        dbRecharges.forEach((r: any) => {
             if (r.status === 'SUCCESS') {
                 userRechargeMap[r.user] = (userRechargeMap[r.user] || 0) + r.amount;
             }
        });

        const usersWithStats = dbUsers.map(u => ({
            ...u,
            totalRecharge: userRechargeMap[u.email] || 0
        }));
        setUserList(usersWithStats);


        // 4. Fetch Orders & Services for Profit Calc
        const ordersSnapshot = await getDocs(collection(db, "orders"));
        const dbOrders = ordersSnapshot.docs.map(doc => doc.data() as Order);
        dbOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setOrderHistory(dbOrders);

        // 5. Fetch Services
        let currentServices: ServiceOption[] = [];
        const servicesSnapshot = await getDocs(collection(db, "services"));
        if (!servicesSnapshot.empty) {
            currentServices = servicesSnapshot.docs.map(doc => doc.data() as ServiceOption);
            setServices(currentServices);
            setIsUsingFallbackData(false);
        } else {
            currentServices = SERVICE_OPTIONS;
            setServices(SERVICE_OPTIONS); 
            setIsUsingFallbackData(true);
        }

        // --- PROFIT CALCULATION ---
        let totalRev = 0;
        let totalCost = 0;
        const monthlyStats: Record<string, { revenue: number, cost: number, profit: number }> = {};

        dbOrders.forEach(order => {
             // 1. Revenue (Points Sales)
             const revenue = order.amount;
             
             // 2. Cost Calculation
             // Use saved costPrice if available, else find from services list (referring to current settings if snapshot missing)
             let unitCost = order.costPrice;
             if (unitCost === undefined) {
                 const svc = currentServices.find(s => s.id === order.serviceId) || currentServices.find(s => s.name === order.serviceName);
                 unitCost = svc?.costPrice || 0;
             }
             const cost = unitCost * order.quantity;

             // Accumulate Total
             totalRev += revenue;
             totalCost += cost;

             // Accumulate Monthly
             const date = new Date(order.date);
             const monthKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
             
             if (!monthlyStats[monthKey]) monthlyStats[monthKey] = { revenue: 0, cost: 0, profit: 0 };
             monthlyStats[monthKey].revenue += revenue;
             monthlyStats[monthKey].cost += cost;
             monthlyStats[monthKey].profit += (revenue - cost);
        });

        setProfitData({
            totalRevenue: totalRev,
            totalCost: totalCost,
            totalProfit: totalRev - totalCost,
            monthly: monthlyStats
        });
        // --------------------------


        // 6. Fetch Withdrawals
        const withdrawalsSnapshot = await getDocs(collection(db, "withdrawals"));
        const dbWithdrawals = withdrawalsSnapshot.docs.map(doc => doc.data() as WithdrawalRequest);
        dbWithdrawals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setWithdrawalHistory(dbWithdrawals);
        
        // 7. Fetch Reviews
        const reviewsSnapshot = await getDocs(collection(db, "reviews"));
        const dbReviews = reviewsSnapshot.docs.map(doc => doc.data() as Review);
        dbReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAllReviews(dbReviews);

        // 8. Stats
        const rawTraffic = JSON.parse(localStorage.getItem('site_traffic') || '[]');
        const today = new Date().toDateString();
        const todaysTraffic = rawTraffic.filter((t: any) => new Date(t.timestamp).toDateString() === today);
        
        const todaysSignups = dbUsers.filter((u: any) => new Date(u.date).toDateString() === today).length;
        
        const todaysRechargeVal = dbRecharges
            .filter((r: any) => new Date(r.date).toDateString() === today && r.status === 'SUCCESS')
            .reduce((sum: number, r: any) => sum + r.amount, 0);

        const totalRechargeVal = dbRecharges
            .filter((r: any) => r.status === 'SUCCESS')
            .reduce((sum: number, r: any) => sum + r.amount, 0);

        setTodayStats({
            visitors: todaysTraffic.length,
            signups: todaysSignups,
            revenue: todaysRechargeVal,
            totalRevenue: totalRechargeVal,
            pendingOrders: dbOrders.filter(o => o.status === 'PENDING').length
        });

    } catch (e) {
        console.error("Failed to load admin data", e);
        alert("데이터를 불러오는데 실패했습니다.");
    } finally {
        setLoading(false);
    }
  };

  // --- Helper: Platform Icon Badge ---
  const getPlatformBadge = (p: Platform) => {
      switch(p) {
          case Platform.INSTAGRAM: 
            return <span className="bg-pink-50 text-pink-500 px-2 py-1 rounded text-xs font-bold border border-pink-100 flex items-center gap-1 w-fit"><i className="fa-brands fa-instagram"></i> INSTA</span>;
          case Platform.YOUTUBE: 
            return <span className="bg-red-50 text-red-500 px-2 py-1 rounded text-xs font-bold border border-red-100 flex items-center gap-1 w-fit"><i className="fa-brands fa-youtube"></i> YOUTUBE</span>;
          case Platform.NAVER: 
            return <span className="bg-green-50 text-green-500 px-2 py-1 rounded text-xs font-bold border border-green-100 flex items-center gap-1 w-fit"><span className="border border-green-500 text-[9px] px-0.5 rounded leading-none">N</span> NAVER</span>;
          case Platform.DANGGEUN: 
            return <span className="bg-orange-50 text-orange-500 px-2 py-1 rounded text-xs font-bold border border-orange-100 flex items-center gap-1 w-fit"><i className="fa-solid fa-carrot"></i> DANGGEUN</span>;
          case Platform.COUPANG:
            return <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs font-bold border border-red-100 flex items-center gap-1 w-fit"><span className="font-bold text-[9px] border border-red-600 px-0.5 rounded leading-none">C</span> COUPANG</span>;
          default:
            return <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs font-bold">{p}</span>;
      }
  };

  // --- Referral Management ---
  const handleEditReferralCode = async (user: User) => {
      if (!isRoot) return;
      
      const newCode = prompt(`[${user.name || user.email}] 관리자의 새로운 추천인 코드를 입력하세요.\n(현재 코드: ${user.referralCode || '없음'})`, user.referralCode || '');
      if (newCode === null) return; // Cancel
      
      const formattedCode = newCode.trim().toUpperCase();
      
      // Check for empty is allowed if they want to clear it, but usually we want a value
      if (formattedCode === '' && !window.confirm("코드를 지우시겠습니까?")) return;

      try {
          await updateDoc(doc(db, "users", user.email), { referralCode: formattedCode });
          alert(`추천인 코드가 [${formattedCode}]로 변경되었습니다.`);
          loadData();
      } catch (e) {
          alert("변경 실패: " + e);
      }
  };

  const toggleGroup = (code: string) => {
      setExpandedGroups(prev => ({ ...prev, [code]: !prev[code] }));
  };

  // --- Service Management ---
  const handleSeedServices = async () => {
      if (!isRoot) return;
      if(!window.confirm("현재 목록의 모든 서비스를 DB에 저장하시겠습니까? (기존 데이터 덮어씀)")) return;
      try {
          for (const service of SERVICE_OPTIONS) {
              await setDoc(doc(db, "services", service.id), service);
          }
          alert("서비스 데이터가 DB에 일괄 저장되었습니다.");
          loadData();
      } catch (e) {
          console.error(e);
          alert("저장 실패");
      }
  };

  const handleSaveService = async () => {
      if (!isRoot) return;
      if (!editingService) return;
      
      try {
          // If editing existing or new
          await setDoc(doc(db, "services", editingService.id), editingService);
          setShowServiceModal(false);
          setEditingService(null);
          alert("서비스가 저장되었습니다.");
          loadData(); // Refresh
      } catch (e) {
          console.error(e);
          alert("저장 실패");
      }
  };

  const handleDeleteService = async (id: string) => {
      if (!isRoot) return;
      if(!window.confirm("정말 삭제하시겠습니까?")) return;
      try {
          await deleteDoc(doc(db, "services", id));
          loadData();
      } catch (e) {
          alert("삭제 실패");
      }
  };


  // --- User Management ---
  const generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  };

  const handleAddUser = async () => {
      if (!isRoot) {
          alert('권한이 없습니다.');
          return;
      }
      if (!newUserEmail || !newUserPw) {
          alert('이메일과 비밀번호는 필수입니다.');
          return;
      }
      
      if (userList.some((u) => u.email === newUserEmail)) {
          alert('이미 존재하는 이메일입니다.');
          return;
      }

      let refCode = 'NONE';
      if (newUserRole === 'ADMIN') {
          refCode = generateReferralCode();
      }

      const newUser: User = {
          id: Date.now(),
          email: newUserEmail,
          name: newUserName || '관리자생성',
          password: newUserPw,
          phone: newUserPhone,
          role: newUserRole,
          referralCode: refCode,
          points: 0,
          coupons: 0,
          source: 'Admin Created',
          date: new Date().toISOString()
      };

      try {
          await setDoc(doc(db, "users", newUser.email), newUser);
          setShowAddUserModal(false);
          setNewUserEmail('');
          setNewUserName('');
          setNewUserPw('');
          setNewUserPhone('');
          setNewUserRole('USER');
          alert('회원이 추가되었습니다.');
          loadData();
      } catch (e) {
          console.error(e);
          alert('회원 추가 실패');
      }
  };

  const handleDeleteUser = async (email: string) => {
      if (!isRoot) return;
      if(!window.confirm(`[${email}] 계정을 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
      try {
          await deleteDoc(doc(db, "users", email));
          alert("계정이 삭제되었습니다.");
          loadData();
      } catch (e) {
          console.error(e);
          alert("삭제 실패");
      }
  }

  const openGiveModal = (user: User, mode: 'COUPON' | 'POINT') => {
      if (!isRoot) return;
      setTargetUser(user);
      setGiveMode(mode);
      setAmountToGive(mode === 'COUPON' ? 1 : 1000); // Default amounts
      setShowGiveModal(true);
  };

  const handleGiveAction = async () => {
      if (!isRoot || !targetUser) return;
      try {
          if (giveMode === 'COUPON') {
              const newCount = (targetUser.coupons || 0) + amountToGive;
              await updateDoc(doc(db, "users", targetUser.email), { coupons: newCount });
              alert(`쿠폰 ${amountToGive}장 지급 완료.`);
          } else {
              const newPoints = (targetUser.points || 0) + amountToGive;
              await updateDoc(doc(db, "users", targetUser.email), { points: newPoints });
              alert(`포인트 ${amountToGive.toLocaleString()}P 지급 완료.`);
          }
          setShowGiveModal(false);
          loadData();
      } catch (e) {
          alert('지급 중 오류가 발생했습니다.');
      }
  };

  const handleResetPassword = async (email: string) => {
      if (!isRoot) return;
      const newPw = prompt(`[${email}] 회원의 새로운 비밀번호를 입력하세요.`);
      if (!newPw) return;
      try {
          await updateDoc(doc(db, "users", email), { password: newPw });
          alert('비밀번호가 변경되었습니다.');
          loadData();
      } catch (e) {
          alert('변경 실패');
      }
  };

  const handleToggleSuperAdmin = async (user: User) => {
      if (!isRoot) return;
      if (user.email === 'ung1994') return;

      const newStatus = !user.isSuperAdmin;
      if(!window.confirm(`${user.email}님을 슈퍼 관리자(주문/충전 승인 권한)로 ${newStatus ? '지정' : '해제'}하시겠습니까?`)) return;

      try {
          await updateDoc(doc(db, "users", user.email), { isSuperAdmin: newStatus });
          alert(`슈퍼 관리자 권한이 ${newStatus ? '부여' : '해제'}되었습니다.`);
          loadData();
      } catch(e) {
          alert("변경 실패");
      }
  };

  const handleDeleteReview = async (reviewId: string) => {
      if (!isRoot) return;
      if(!window.confirm("이 리뷰를 삭제하시겠습니까?")) return;
      try {
          await deleteDoc(doc(db, "reviews", reviewId));
          alert("리뷰가 삭제되었습니다.");
          loadData();
      } catch(e) {
          console.error(e);
          alert("리뷰 삭제 실패");
      }
  };


  // --- DB Operations for Actions ---

  const handleCompleteWithdrawal = async (id: string) => {
      // Allow only Root to handle Money Withdrawals for security, or Super if desired.
      // Based on prompt: "All authority to ung1994", "Super Admin approve orders/recharges".
      // Withdrawals are payouts, so maybe strictly Root.
      if (!isRoot) {
          alert("출금 승인은 최고 관리자만 가능합니다.");
          return;
      }
      if(!window.confirm('입금 완료 처리하시겠습니까?')) return;
      try {
          await updateDoc(doc(db, "withdrawals", id), { status: 'COMPLETED' });
          loadData();
      } catch (e) {
          console.error(e);
          alert("처리 실패");
      }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'PROCESSING' | 'COMPLETED') => {
       if (!isSuper) {
           alert("권한이 없습니다.");
           return;
       }
       if (!window.confirm('상태를 변경하시겠습니까?')) return;
       try {
           await updateDoc(doc(db, "orders", orderId), { 
               status: newStatus,
               processedBy: currentUser?.email // Log who approved
           });
           loadData();
       } catch (e) {
           console.error(e);
           alert("상태 변경 실패");
       }
  };

  const handleApproveRecharge = async (rechargeId: number) => {
    if (!isSuper) {
        alert("권한이 없습니다.");
        return;
    }

    const targetRecharge = rechargeHistory.find((r: any) => r.id === rechargeId);
    if (!targetRecharge || targetRecharge.status === 'SUCCESS') return;

    try {
        const rechargeDocId = String(rechargeId);
        await updateDoc(doc(db, "recharges", rechargeDocId), { 
            status: 'SUCCESS',
            approvedBy: currentUser?.email // Log who approved
        });

        const userRef = doc(db, "users", targetRecharge.user);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data() as User;
            const addAmount = Number(targetRecharge.amount);
            const bonus = Number(targetRecharge.bonusPoints || 0);
            const newPoints = (userData.points || 0) + addAmount + bonus;
            
            await updateDoc(userRef, { points: newPoints });
            alert('승인 및 포인트 지급 완료');
            loadData();
        } else {
            alert('유저 정보를 찾을 수 없습니다.');
        }
    } catch (e) {
        console.error(e);
        alert('처리 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (isoString: string) => {
      try {
        const d = new Date(isoString);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      } catch (e) { return '-'; }
  }

  // --- Helper for Chart Scale ---
  const getMaxRevenue = () => {
      let max = 0;
      Object.values(profitData.monthly).forEach((d: any) => {
          if(d.revenue > max) max = d.revenue;
      });
      return max > 0 ? max : 10000;
  };

  // --- Organize Users into Groups ---
  const getGroupedUsers = () => {
      const groups: Record<string, typeof userList> = {};
      
      // 1. Identify Admin Codes (Referrers)
      const admins = userList.filter(u => u.role === 'ADMIN' && u.referralCode);
      const adminCodes = admins.map(a => a.referralCode!);
      
      // Initialize buckets for admins
      adminCodes.forEach(code => {
          groups[code] = [];
      });

      // Initialize System bucket
      groups['GW11'] = [];
      groups['NONE'] = [];

      // 2. Sort Users into Buckets
      userList.forEach(user => {
          let used = user.usedReferralCode;
          if (!used || used === '') used = 'GW11'; // Default Fallback
          
          if (groups[used]) {
              groups[used].push(user);
          } else {
              if(!groups['UNKNOWN']) groups['UNKNOWN'] = [];
              groups['UNKNOWN'].push(user);
          }
      });

      return { groups, admins };
  };


  if (loading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 text-slate-500 font-bold gap-4">
             <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
             <p>서버와 동기화 중입니다...</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Admin Navbar */}
      <nav className="bg-slate-800 text-white px-8 py-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-white font-bold p-2 rounded-lg text-sm">ADMIN</div>
          <h1 className="text-xl font-bold tracking-tight">instakoo 관리자</h1>
          {/* Permission Badge */}
          {isRoot ? (
              <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded uppercase font-bold">ROOT</span>
          ) : isSuper ? (
              <span className="bg-orange-500 text-white text-[10px] px-2 py-1 rounded uppercase font-bold">SUPER</span>
          ) : (
              <span className="bg-gray-500 text-white text-[10px] px-2 py-1 rounded uppercase font-bold">VIEWER</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">
              {currentUser?.email}님 접속중
          </span>
          <button onClick={() => window.location.href = '/'} className="text-slate-300 text-sm hover:text-white">
             <i className="fa-solid fa-home mr-1"></i> 홈페이지로
          </button>
          <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
            로그아웃
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8 space-y-8">
        
        {/* Navigation Tabs */}
        <div className="flex gap-4 border-b border-slate-200 pb-2 overflow-x-auto">
            {[
                { id: 'DASHBOARD', label: '대시보드', icon: 'fa-chart-pie' },
                { id: 'PROFIT', label: '영업이익', icon: 'fa-chart-line' },
                { id: 'RECHARGES', label: '충전 관리', icon: 'fa-credit-card' },
                { id: 'WITHDRAWALS', label: '출금 요청', icon: 'fa-money-bill-transfer' },
                { id: 'MEMBERS', label: '회원 관리', icon: 'fa-users' },
                { id: 'ORDERS', label: '주문 내역', icon: 'fa-list-check' },
                { id: 'REVIEWS', label: '리뷰 관리', icon: 'fa-star' },
                { id: 'SERVICES', label: '서비스 설정', icon: 'fa-tags' },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-colors whitespace-nowrap ${
                        activeTab === tab.id 
                        ? 'bg-white text-primary border-b-2 border-primary shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }`}
                >
                    <i className={`fa-solid ${tab.icon}`}></i>
                    {tab.label}
                </button>
            ))}
        </div>

        {/* --- TABS --- */}
        
        {activeTab === 'DASHBOARD' && (
             <div className="space-y-8 animate-bounce-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-2">오늘 방문자</p>
                        <h3 className="text-3xl font-extrabold text-slate-800">{todayStats.visitors.toLocaleString()}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-2">오늘 신규가입</p>
                        <h3 className="text-3xl font-extrabold text-slate-800">{todayStats.signups.toLocaleString()}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-2">오늘 충전 매출</p>
                        <h3 className="text-3xl font-extrabold text-primary">₩{todayStats.revenue.toLocaleString()}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-purple-500">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-2">총 누적 매출</p>
                        <h3 className="text-3xl font-extrabold text-purple-600">₩{todayStats.totalRevenue.toLocaleString()}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-2">대기중인 주문</p>
                        <h3 className="text-3xl font-extrabold text-orange-500">{todayStats.pendingOrders}</h3>
                    </div>
                </div>
            </div>
        )}

        {/* ... (PROFIT Tab code kept as is) ... */}
        {activeTab === 'PROFIT' && (
            <div className="space-y-8 animate-bounce-in">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-2">누적 총 주문 매출 (포인트)</p>
                        <h3 className="text-3xl font-extrabold text-blue-600">{profitData.totalRevenue.toLocaleString()} P</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-2">누적 총 원가 (예상)</p>
                        <h3 className="text-3xl font-extrabold text-red-400">{profitData.totalCost.toLocaleString()} 원</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-green-500">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-2">누적 총 영업이익</p>
                        <h3 className="text-3xl font-extrabold text-green-600">+{profitData.totalProfit.toLocaleString()} 원</h3>
                    </div>
                </div>

                {/* Visual Chart Section */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                        <i className="fa-solid fa-chart-column text-primary"></i> 월별 수익 추이 (Bar Chart)
                    </h2>
                    
                    <div className="w-full h-64 flex items-end justify-start gap-4 md:gap-8 pb-4 border-b border-gray-200">
                        {Object.keys(profitData.monthly).sort().map((month) => {
                            const data = profitData.monthly[month];
                            const max = getMaxRevenue();
                            const heightPercent = Math.max((data.revenue / max) * 100, 5); // Min 5% height
                            
                            return (
                                <div key={month} className="flex flex-col items-center group w-full max-w-[60px]">
                                    {/* Tooltip on hover */}
                                    <div className="opacity-0 group-hover:opacity-100 absolute -mt-12 bg-gray-800 text-white text-xs p-2 rounded pointer-events-none transition-opacity z-10 whitespace-nowrap">
                                        매출: {data.revenue.toLocaleString()} / 이익: {data.profit.toLocaleString()}
                                    </div>
                                    
                                    {/* Bars */}
                                    <div className="w-full bg-gray-100 rounded-t-lg relative flex items-end overflow-hidden" style={{ height: '100%' }}>
                                        <div 
                                            className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-500"
                                            style={{ height: `${heightPercent}%` }}
                                        ></div>
                                        {/* Profit Overlay */}
                                        <div 
                                            className="absolute bottom-0 left-0 w-full bg-green-400/80 hover:bg-green-500 transition-all duration-500"
                                            style={{ height: `${(data.profit / max) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-gray-500 mt-2 font-bold">{month.substring(5)}월</span>
                                </div>
                            );
                        })}
                        {Object.keys(profitData.monthly).length === 0 && (
                            <div className="w-full text-center text-gray-400 self-center">데이터가 없습니다.</div>
                        )}
                    </div>
                    <div className="mt-4 flex gap-4 text-xs text-gray-500 justify-center">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> 총 매출</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-400 rounded-sm"></div> 순이익</div>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold mb-4 text-gray-700">상세 내역</h2>
                    <div className="overflow-x-auto">
                         <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3">기간 (월)</th>
                                    <th className="px-4 py-3 text-right">주문 매출</th>
                                    <th className="px-4 py-3 text-right text-red-400">원가</th>
                                    <th className="px-4 py-3 text-right text-green-600 font-bold">영업이익</th>
                                    <th className="px-4 py-3 text-right">수익률</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(profitData.monthly).sort().reverse().map(month => {
                                    const data = profitData.monthly[month];
                                    const margin = data.revenue > 0 ? ((data.profit / data.revenue) * 100).toFixed(1) : 0;
                                    return (
                                        <tr key={month} className="border-b border-slate-50 hover:bg-slate-50">
                                            <td className="px-4 py-3 font-bold">{month}</td>
                                            <td className="px-4 py-3 text-right">{data.revenue.toLocaleString()} P</td>
                                            <td className="px-4 py-3 text-right text-red-400">-{data.cost.toLocaleString()} 원</td>
                                            <td className="px-4 py-3 text-right font-bold text-green-600">+{data.profit.toLocaleString()} 원</td>
                                            <td className="px-4 py-3 text-right text-gray-400">{margin}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'MEMBERS' && (
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-bounce-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <i className="fa-solid fa-users text-orange-500"></i>
                        전체 회원 관리 (추천인 그룹별)
                    </h2>
                    <div className="flex gap-4 items-center">
                         <span className="text-sm text-slate-500">총 {userList.length}명</span>
                         {isRoot && (
                             <button 
                                onClick={() => setShowAddUserModal(true)}
                                className="bg-primary text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-primaryLight"
                             >
                                 <i className="fa-solid fa-plus mr-1"></i> 회원 추가
                             </button>
                         )}
                    </div>
                </div>
                
                {(() => {
                    const { groups, admins } = getGroupedUsers();
                    
                    // Helper to render user row
                    const renderUserRow = (user: User & { totalRecharge?: number }) => (
                         <tr 
                            key={user.email} 
                            className={`border-b border-slate-50 hover:bg-slate-50`}
                        >
                            <td className="px-4 py-3 font-bold text-slate-800">
                                {user.email}
                                {user.role === 'ADMIN' && <span className="ml-2 text-[10px] bg-purple-200 text-purple-700 px-1 rounded">ADMIN</span>}
                                {user.isSuperAdmin && <span className="ml-2 text-[10px] bg-orange-200 text-orange-700 px-1 rounded">SUPER</span>}
                            </td>
                            <td className="px-4 py-3 text-xs">{user.name || '-'}</td>
                            {/* NEW: Used Code Display */}
                            <td className="px-4 py-3 text-center">
                                <span className={`text-[10px] px-2 py-1 rounded font-bold ${user.usedReferralCode && user.usedReferralCode !== 'NONE' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {user.usedReferralCode || 'NONE'}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-purple-600">
                                {user.totalRecharge?.toLocaleString() || 0}원
                            </td>
                            <td className="px-4 py-3 text-right text-primary font-bold">{user.points?.toLocaleString() || 0} P</td>
                            <td className="px-4 py-3 text-slate-700 font-bold">{user.coupons || 0}장</td>
                            <td className="px-4 py-3 text-xs text-slate-400">{formatDate(user.date)}</td>
                            <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                                {isRoot ? (
                                    <>
                                        {user.role === 'ADMIN' && (
                                            <button 
                                                onClick={() => handleToggleSuperAdmin(user)} 
                                                className={`text-xs px-2 py-1 rounded whitespace-nowrap ${user.isSuperAdmin ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                                            >
                                                {user.isSuperAdmin ? '슈퍼해제' : '슈퍼지정'}
                                            </button>
                                        )}
                                        <button onClick={() => openGiveModal(user, 'POINT')} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded whitespace-nowrap">포인트</button>
                                        <button onClick={() => openGiveModal(user, 'COUPON')} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded whitespace-nowrap">쿠폰</button>
                                        <button onClick={() => handleResetPassword(user.email)} className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded whitespace-nowrap">비번</button>
                                        <button onClick={() => handleDeleteUser(user.email)} className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded whitespace-nowrap">삭제</button>
                                    </>
                                ) : (
                                    <span className="text-gray-400 text-xs">권한없음</span>
                                )}
                            </td>
                        </tr>
                    );

                    return (
                        <div className="space-y-6">
                            {/* 1. GW11 / System Users */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="bg-slate-100 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => toggleGroup('GW11')}>
                                    <div className="font-bold text-slate-700">
                                        <i className="fa-solid fa-earth-americas mr-2 text-blue-500"></i>
                                        일반/기본 가입 (GW11 등)
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs bg-white px-2 py-1 rounded border shadow-sm">
                                            {groups['GW11']?.length || 0}명
                                        </span>
                                        <i className={`fa-solid fa-chevron-down transition-transform ${expandedGroups['GW11'] ? 'rotate-180' : ''}`}></i>
                                    </div>
                                </div>
                                {expandedGroups['GW11'] && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left text-slate-600 bg-white">
                                            <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                                                <tr>
                                                    <th className="px-4 py-3">이메일(ID)</th>
                                                    <th className="px-4 py-3">이름</th>
                                                    <th className="px-4 py-3 text-center">가입코드</th>
                                                    <th className="px-4 py-3 text-right">누적충전</th>
                                                    <th className="px-4 py-3 text-right">포인트</th>
                                                    <th className="px-4 py-3">쿠폰</th>
                                                    <th className="px-4 py-3">가입일</th>
                                                    <th className="px-4 py-3 text-center">관리</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groups['GW11']?.map(renderUserRow)}
                                                {(!groups['GW11'] || groups['GW11'].length === 0) && (
                                                    <tr><td colSpan={8} className="text-center py-4 text-gray-400">회원이 없습니다.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* 2. Admin Referral Groups */}
                            {admins.map(admin => {
                                const code = admin.referralCode || 'NO_CODE';
                                const myUsers = groups[code] || [];
                                const totalRevenue = myUsers.reduce((sum, u) => sum + (u.totalRecharge || 0), 0);
                                
                                return (
                                    <div key={admin.email} className="border border-purple-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="bg-purple-50 px-4 py-3 flex flex-col md:flex-row justify-between md:items-center gap-2">
                                            <div className="flex items-center gap-3" onClick={() => toggleGroup(code)}>
                                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                                    {admin.name?.charAt(0) || 'A'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800 flex items-center gap-2">
                                                        {admin.name} <span className="text-xs text-gray-400 font-normal">({admin.email})</span>
                                                        {admin.isSuperAdmin && <span className="text-[9px] bg-orange-200 text-orange-700 px-1 rounded">SUPER</span>}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        추천인 코드: <span className="font-bold text-purple-600 bg-white px-1 rounded border border-purple-200">{code}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 justify-end">
                                                {/* Edit Code Button - Only Root */}
                                                {isRoot && (
                                                    <button 
                                                        onClick={() => handleEditReferralCode(admin)}
                                                        className="bg-white border border-purple-200 text-purple-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors shadow-sm"
                                                    >
                                                        <i className="fa-solid fa-pen mr-1"></i> 코드 설정
                                                    </button>
                                                )}

                                                <div className="bg-white px-3 py-1.5 rounded-lg border border-purple-100 shadow-sm text-right min-w-[120px]">
                                                    <div className="text-[10px] text-gray-400">유치 회원 매출</div>
                                                    <div className="font-bold text-purple-600">{totalRevenue.toLocaleString()}원</div>
                                                </div>
                                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleGroup(code)}>
                                                     <span className="text-xs font-bold bg-purple-200 text-purple-800 px-2 py-1 rounded">
                                                        {myUsers.length}명
                                                     </span>
                                                     <i className={`fa-solid fa-chevron-down text-purple-400 transition-transform ${expandedGroups[code] ? 'rotate-180' : ''}`}></i>
                                                </div>
                                            </div>
                                        </div>

                                        {expandedGroups[code] && (
                                            <div className="overflow-x-auto border-t border-purple-100">
                                                <table className="w-full text-sm text-left text-slate-600 bg-white">
                                                    <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                                                        <tr>
                                                            <th className="px-4 py-3">이메일(ID)</th>
                                                            <th className="px-4 py-3">이름</th>
                                                            <th className="px-4 py-3 text-center">가입코드</th>
                                                            <th className="px-4 py-3 text-right">누적충전</th>
                                                            <th className="px-4 py-3 text-right">포인트</th>
                                                            <th className="px-4 py-3">쿠폰</th>
                                                            <th className="px-4 py-3">가입일</th>
                                                            <th className="px-4 py-3 text-center">관리</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {myUsers.map(renderUserRow)}
                                                        {myUsers.length === 0 && (
                                                            <tr><td colSpan={8} className="text-center py-4 text-gray-400">아직 유치한 회원이 없습니다.</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            
                            {/* 3. Unknown / Other Codes */}
                            {groups['UNKNOWN'] && groups['UNKNOWN'].length > 0 && (
                                 <div className="border border-gray-200 rounded-xl overflow-hidden mt-4 opacity-70">
                                    <div className="bg-gray-100 px-4 py-3 flex justify-between items-center cursor-pointer" onClick={() => toggleGroup('UNKNOWN')}>
                                        <div className="font-bold text-gray-600">
                                            <i className="fa-solid fa-question-circle mr-2"></i>
                                            기타 / 알 수 없는 코드
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs bg-white px-2 py-1 rounded border shadow-sm">
                                                {groups['UNKNOWN'].length}명
                                            </span>
                                            <i className={`fa-solid fa-chevron-down transition-transform ${expandedGroups['UNKNOWN'] ? 'rotate-180' : ''}`}></i>
                                        </div>
                                    </div>
                                    {expandedGroups['UNKNOWN'] && (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left text-slate-600 bg-white">
                                                <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-3">이메일</th>
                                                        <th className="px-4 py-3">이름</th>
                                                        <th className="px-4 py-3 text-center">입력코드</th>
                                                        <th className="px-4 py-3 text-right">누적충전</th>
                                                        <th className="px-4 py-3 text-right">포인트</th>
                                                        <th className="px-4 py-3">관리</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {groups['UNKNOWN'].map(renderUserRow)}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    );
                })()}
            </div>
        )}

        {/* ... (RECHARGES, WITHDRAWALS, ORDERS Tabs kept as is) ... */}
        {activeTab === 'RECHARGES' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-bounce-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2"><i className="fa-solid fa-credit-card text-green-500"></i> 충전 요청 관리</h2>
                    <span className="text-sm text-slate-500">총 {rechargeHistory.length}건</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                            <tr>
                                <th className="px-4 py-3">신청자</th>
                                <th className="px-4 py-3">실제 입금액 (VAT포함)</th>
                                <th className="px-4 py-3">충전 포인트</th>
                                <th className="px-4 py-3">상태</th>
                                <th className="px-4 py-3">요청일시</th>
                                <th className="px-4 py-3 text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rechargeHistory.map((item: any) => (
                                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                                    <td className="px-4 py-3">{item.user}</td>
                                    <td className="px-4 py-3 font-bold text-slate-800">
                                        ₩{(item.paymentAmount || Math.floor(item.amount * 1.1)).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-primary">+{(item.amount + (item.bonusPoints || 0)).toLocaleString()} P</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col items-center">
                                            {item.status === 'SUCCESS' ? <span className="text-green-600 font-bold bg-green-100 px-2 py-1 rounded text-xs">완료</span> : <span className="text-orange-600 font-bold bg-orange-100 px-2 py-1 rounded text-xs">대기중</span>}
                                            {item.approvedBy && isRoot && <span className="text-[9px] text-gray-400 mt-1">{item.approvedBy}</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-400">{formatDate(item.date)}</td>
                                    <td className="px-4 py-3 text-center">
                                        {item.status === 'PENDING' && isSuper && (
                                            <button onClick={() => handleApproveRecharge(item.id)} className="bg-blue-500 text-white text-xs px-3 py-1 rounded font-bold">승인</button>
                                        )}
                                        {item.status === 'PENDING' && !isSuper && (
                                            <span className="text-xs text-gray-400">권한없음</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'WITHDRAWALS' && (
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-bounce-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2"><i className="fa-solid fa-money-bill-transfer text-orange-500"></i> 출금(환불) 요청 관리</h2>
                    <span className="text-sm text-slate-500">총 {withdrawalHistory.length}건</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                            <tr>
                                <th className="px-4 py-3">요청자</th>
                                <th className="px-4 py-3">예금주</th>
                                <th className="px-4 py-3">계좌</th>
                                <th className="px-4 py-3">출금액</th>
                                <th className="px-4 py-3">상태</th>
                                <th className="px-4 py-3">요청일시</th>
                                <th className="px-4 py-3 text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {withdrawalHistory.map((w) => (
                                <tr key={w.id} className="border-b border-slate-50 hover:bg-slate-50">
                                    <td className="px-4 py-3">{w.userId}</td>
                                    <td className="px-4 py-3 font-bold">{w.userName}</td>
                                    <td className="px-4 py-3 text-xs">{w.bankName} {w.accountNumber}</td>
                                    <td className="px-4 py-3 font-bold text-red-500">-{w.amount.toLocaleString()} P</td>
                                    <td className="px-4 py-3">
                                        {w.status === 'COMPLETED' ? <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs">지급완료</span> : <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded text-xs">대기</span>}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-400">{formatDate(w.date)}</td>
                                    <td className="px-4 py-3 text-center">
                                         {w.status === 'PENDING' && isRoot && (
                                            <button onClick={() => handleCompleteWithdrawal(w.id)} className="bg-green-500 text-white text-xs px-3 py-1 rounded font-bold">입금완료 처리</button>
                                        )}
                                        {w.status === 'PENDING' && !isRoot && <span className="text-gray-400 text-xs">권한없음</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'ORDERS' && (
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-bounce-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2"><i className="fa-solid fa-list-check text-blue-500"></i> 주문 내역</h2>
                    <span className="text-sm text-slate-500">총 {orderHistory.length}건</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                            <tr>
                                <th className="px-4 py-3">사용자</th>
                                <th className="px-4 py-3 w-1/3">서비스/정보</th>
                                <th className="px-4 py-3 text-center">수량</th>
                                <th className="px-4 py-3 text-right">금액</th>
                                <th className="px-4 py-3 text-right text-red-300">원가</th>
                                <th className="px-4 py-3 text-center">상태</th>
                                <th className="px-4 py-3 text-center">관리</th>
                                <th className="px-4 py-3">일시</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orderHistory.map((order) => {
                                // Fallback Cost Calculation for display
                                let displayCost = order.costPrice ? (order.costPrice * order.quantity) : 0;
                                if (!order.costPrice) {
                                     // Try to find service
                                     const svc = services.find(s => s.id === order.serviceId) || services.find(s => s.name === order.serviceName);
                                     if(svc) displayCost = (svc.costPrice || 0) * order.quantity;
                                }

                                return (
                                <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium">{order.userId}</td>
                                    <td className="px-4 py-3 text-xs">
                                        <div className="font-bold mb-1">{order.serviceName}</div>
                                        <div className="text-gray-400 truncate max-w-[200px]">{JSON.stringify(order.details)}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center">{order.quantity.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-blue-600 font-bold">-{order.amount.toLocaleString()} P</td>
                                    <td className="px-4 py-3 text-right text-red-300 text-xs">-{displayCost.toLocaleString()} 원</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' :
                                                order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-600' :
                                                'bg-green-100 text-green-600'
                                            }`}>
                                                {order.status === 'PENDING' ? '대기' : order.status === 'PROCESSING' ? '작업중' : '완료'}
                                            </span>
                                            {order.processedBy && isRoot && <span className="text-[9px] text-gray-400 mt-1">{order.processedBy}</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                         {isSuper ? (
                                             <>
                                                {order.status === 'PENDING' && (
                                                    <button onClick={() => handleUpdateOrderStatus(order.id, 'PROCESSING')} className="bg-blue-500 text-white text-xs px-3 py-1 rounded font-bold">시작</button>
                                                )}
                                                {order.status === 'PROCESSING' && (
                                                    <button onClick={() => handleUpdateOrderStatus(order.id, 'COMPLETED')} className="bg-green-500 text-white text-xs px-3 py-1 rounded font-bold">완료</button>
                                                )}
                                             </>
                                         ) : (
                                             <span className="text-gray-400 text-xs">권한없음</span>
                                         )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-400">{formatDate(order.date)}</td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'SERVICES' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-bounce-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <i className="fa-solid fa-tags text-primary"></i>
                        서비스 품목 관리
                    </h2>
                    <div className="flex gap-2 items-center">
                         <span className="text-sm text-gray-500 font-bold mr-2">총 {services.length}개</span>
                         {isRoot && (
                             <>
                                <button 
                                    onClick={handleSeedServices}
                                    className={`text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-opacity-90 transition-colors ${isUsingFallbackData ? 'bg-orange-500 animate-pulse' : 'bg-gray-500'}`}
                                >
                                    <i className="fa-solid fa-database mr-1"></i> 
                                    {isUsingFallbackData ? '현재 목록 DB에 일괄 저장하기' : 'DB 초기화 (코드 기준)'}
                                </button>
                                <button 
                                    onClick={() => {
                                        setEditingService({
                                            id: `new_${Date.now()}`,
                                            name: '',
                                            platform: Platform.INSTAGRAM,
                                            pricePerUnit: 0,
                                            costPrice: 0,
                                            minQuantity: 10,
                                            description: '',
                                            inputs: [{ key: 'url', label: '링크 입력', type: 'text', placeholder: 'https://...' }]
                                        });
                                        setShowServiceModal(true);
                                    }}
                                    className="bg-primary text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-primaryLight"
                                >
                                    <i className="fa-solid fa-plus mr-1"></i> 서비스 추가
                                </button>
                             </>
                         )}
                    </div>
                </div>
                
                {isUsingFallbackData && (
                    <div className="mb-4 bg-orange-50 text-orange-700 p-3 rounded-xl text-sm border border-orange-200 flex items-center gap-2">
                        <i className="fa-solid fa-circle-info"></i>
                        현재 DB에 서비스 데이터가 없어 기본 설정값(코드)을 불러왔습니다. <strong>[현재 목록 DB에 일괄 저장하기]</strong>를 눌러 DB에 저장해주세요.
                    </div>
                )}
                
                {services.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        표시할 서비스가 없습니다.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                             <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3">플랫폼</th>
                                    <th className="px-4 py-3">서비스명</th>
                                    <th className="px-4 py-3 text-right">판매가</th>
                                    <th className="px-4 py-3 text-right text-red-400">원가</th>
                                    <th className="px-4 py-3 text-center">최소수량</th>
                                    <th className="px-4 py-3 text-center">관리</th>
                                </tr>
                             </thead>
                             <tbody>
                                 {services.map(svc => (
                                     <tr key={svc.id} className="border-b border-slate-50 hover:bg-slate-50">
                                         {/* Platform Icon Badge */}
                                         <td className="px-4 py-3 font-bold">
                                             {getPlatformBadge(svc.platform)}
                                         </td>
                                         <td className="px-4 py-3">{svc.name}</td>
                                         <td className="px-4 py-3 text-right font-bold text-slate-800">{svc.pricePerUnit.toLocaleString()}원</td>
                                         <td className="px-4 py-3 text-right text-red-400">{svc.costPrice?.toLocaleString() || 0}원</td>
                                         <td className="px-4 py-3 text-center">{svc.minQuantity.toLocaleString()}</td>
                                         <td className="px-4 py-3 text-center flex justify-center gap-2">
                                             {isRoot ? (
                                                 <>
                                                    <button 
                                                        onClick={() => { setEditingService({...svc}); setShowServiceModal(true); }}
                                                        className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-bold"
                                                    >수정</button>
                                                    <button 
                                                        onClick={() => handleDeleteService(svc.id)}
                                                        className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold"
                                                    >삭제</button>
                                                 </>
                                             ) : (
                                                 <span className="text-gray-400 text-xs">권한없음</span>
                                             )}
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                        </table>
                    </div>
                )}
            </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'REVIEWS' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-bounce-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2"><i className="fa-solid fa-star text-yellow-500"></i> 고객 리뷰 관리</h2>
                    <span className="text-sm text-slate-500">총 {allReviews.length}건</span>
                </div>
                {allReviews.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <i className="fa-regular fa-star text-4xl mb-3"></i>
                        <p>아직 등록된 리뷰가 없습니다.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3">날짜</th>
                                    <th className="px-4 py-3">플랫폼</th>
                                    <th className="px-4 py-3">작성자(ID)</th>
                                    <th className="px-4 py-3">평점</th>
                                    <th className="px-4 py-3 w-1/3">내용</th>
                                    <th className="px-4 py-3 text-center">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allReviews.map((review) => (
                                    <tr key={review.id} className="border-b border-slate-50 hover:bg-slate-50">
                                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDate(review.date.replace(/\./g, '-'))}</td>
                                        <td className="px-4 py-3">{getPlatformBadge(review.platform)}</td>
                                        <td className="px-4 py-3 font-medium">
                                            {review.name}
                                            {review.userId && <div className="text-xs text-gray-400 font-normal">{review.userId}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <i key={i} className={`fa-solid fa-star ${i < review.rating ? '' : 'text-gray-200'}`}></i>
                                            ))}
                                        </td>
                                        <td className="px-4 py-3 text-xs leading-relaxed max-w-md">
                                            {review.content}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {isRoot ? (
                                                <button 
                                                    onClick={() => handleDeleteReview(String(review.id))} 
                                                    className="bg-red-100 text-red-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-200"
                                                >
                                                    삭제
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-xs">권한없음</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )}

      </div>
       
       {/* Add User Modal */}
       {showAddUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddUserModal(false)}></div>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative z-10 animate-bounce-in">
            <h3 className="text-xl font-bold text-gray-800 mb-4">회원 추가 (DB)</h3>
            <div className="space-y-4">
                <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="w-full p-2 border rounded" placeholder="email@example.com" />
                <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="w-full p-2 border rounded" placeholder="이름" />
                <input type="text" value={newUserPw} onChange={(e) => setNewUserPw(e.target.value)} className="w-full p-2 border rounded" placeholder="Password" />
                <input type="text" value={newUserPhone} onChange={(e) => setNewUserPhone(e.target.value)} className="w-full p-2 border rounded" placeholder="010..." />
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as 'USER' | 'ADMIN')} className="w-full p-2 border rounded">
                    <option value="USER">일반 회원</option>
                    <option value="ADMIN">관리자</option>
                </select>
                <button onClick={handleAddUser} className="w-full bg-primary text-white py-3 rounded-xl font-bold mt-2">추가하기</button>
            </div>
          </div>
        </div>
      )}
      
       {/* Give Coupon/Point Modal */}
      {showGiveModal && targetUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowGiveModal(false)}></div>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative z-10 animate-bounce-in text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{giveMode === 'COUPON' ? '쿠폰' : '포인트'} 지급</h3>
            <p className="text-sm text-gray-500 mb-4">{targetUser.email}님에게 지급할 수량</p>
            <div className="flex items-center justify-center gap-4 mb-6">
                <button 
                  onClick={() => setAmountToGive(Math.max(1, amountToGive - (giveMode === 'POINT' ? 1000 : 1)))} 
                  className="w-10 h-10 bg-gray-100 rounded-full font-bold"
                >-</button>
                <input 
                    type="number" 
                    value={amountToGive} 
                    onChange={(e) => setAmountToGive(Number(e.target.value))}
                    className="text-2xl font-bold text-primary text-center w-32 border-b border-primary focus:outline-none"
                />
                <button 
                  onClick={() => setAmountToGive(amountToGive + (giveMode === 'POINT' ? 1000 : 1))} 
                  className="w-10 h-10 bg-gray-100 rounded-full font-bold"
                >+</button>
            </div>
            <p className="text-xs text-gray-400 mb-4">단위: {giveMode === 'POINT' ? 'P' : '장'}</p>
            <button onClick={handleGiveAction} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">지급하기</button>
          </div>
        </div>
      )}

      {/* Service Edit/Add Modal */}
      {showServiceModal && editingService && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowServiceModal(false)}></div>
              <div className="bg-white rounded-2xl w-full max-w-md p-6 relative z-10 animate-bounce-in max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">{editingService.id.startsWith('new_') ? '서비스 추가' : '서비스 수정'}</h3>
                  <div className="space-y-3 text-sm">
                      <div>
                          <label className="block font-bold mb-1">서비스 ID (변경불가)</label>
                          <input type="text" disabled={!editingService.id.startsWith('new_')} value={editingService.id} onChange={(e) => setEditingService({...editingService, id: e.target.value})} className="w-full p-2 border rounded bg-gray-50" />
                      </div>
                      <div>
                          <label className="block font-bold mb-1">서비스명</label>
                          <input type="text" value={editingService.name} onChange={(e) => setEditingService({...editingService, name: e.target.value})} className="w-full p-2 border rounded" />
                      </div>
                      <div>
                          <label className="block font-bold mb-1">플랫폼</label>
                          <select value={editingService.platform} onChange={(e) => setEditingService({...editingService, platform: e.target.value as Platform})} className="w-full p-2 border rounded">
                              {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                           <div>
                                <label className="block font-bold mb-1">판매가 (P)</label>
                                <input type="number" value={editingService.pricePerUnit} onChange={(e) => setEditingService({...editingService, pricePerUnit: Number(e.target.value)})} className="w-full p-2 border rounded" />
                           </div>
                           <div>
                                <label className="block font-bold mb-1 text-red-500">원가 (참고용)</label>
                                <input type="number" value={editingService.costPrice || 0} onChange={(e) => setEditingService({...editingService, costPrice: Number(e.target.value)})} className="w-full p-2 border rounded" />
                           </div>
                      </div>
                      <div>
                          <label className="block font-bold mb-1">최소 주문 수량</label>
                          <input type="number" value={editingService.minQuantity} onChange={(e) => setEditingService({...editingService, minQuantity: Number(e.target.value)})} className="w-full p-2 border rounded" />
                      </div>
                      <div>
                          <label className="block font-bold mb-1">설명</label>
                          <textarea value={editingService.description} onChange={(e) => setEditingService({...editingService, description: e.target.value})} className="w-full p-2 border rounded h-20" />
                      </div>
                      
                      <button onClick={handleSaveService} className="w-full bg-primary text-white py-3 rounded-xl font-bold mt-2">저장하기</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminPage;