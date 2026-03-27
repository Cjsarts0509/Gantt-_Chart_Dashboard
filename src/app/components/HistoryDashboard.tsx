import React, { useEffect, useState } from "react";
import { History, Database, Loader2, PlusCircle, RefreshCw } from "lucide-react";

interface HistoryData {
  변경일시: string;
  전체데이터: any;
}

export default function HistoryDashboard() {
  const [historyList, setHistoryList] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🌟 수파베이스 Project URL & API Key (소문자 e 시작 적용 완료)
    const SUPABASE_URL = "https://cbogmikpdlmwgluahcnz.supabase.co"; 
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib2dtaWtwZGxtd2dsdWFoY256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDIxMjksImV4cCI6MjA4Nzc3ODEyOX0.nagpgjcC7fbk5Bsi812giOSkiKGHG-Y-UZwWndwFbmY";

    // 🌟 모든 데이터를 가져오는 REST API
    const fetchUrl = `${SUPABASE_URL}/rest/v1/N8N_WBS_HISTORY?select=*&order=${encodeURIComponent('변경일시')}.desc&limit=100`;

    fetch(fetchUrl, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`수파베이스 연결 실패: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setHistoryList(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("이력 데이터 로드 실패:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-[#F1F5F9] text-slate-500 gap-4" style={{ fontFamily: "'Pretendard', sans-serif" }}>
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-[15px] font-bold">변경 이력을 실시간으로 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#F1F5F9] overflow-auto p-8" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      <div className="max-w-[1500px] mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* 상단 헤더 영역 */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 bg-white">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <History className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-extrabold text-slate-800">WBS 전체 변경 이력 대시보드</h1>
            <p className="text-[12px] font-semibold text-slate-400 mt-0.5">수파베이스 실시간 연동 완료 🚀</p>
          </div>
        </div>

        {/* 테이블 영역 */}
        <div className="overflow-x-auto">
          {historyList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
              <Database className="w-12 h-12 text-slate-200" />
              <p className="text-[14px] font-bold">최근 변경된 이력이 없습니다.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap">변경일시</th>
                  <th className="px-5 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap text-center">구분</th>
                  <th className="px-5 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap">요구사항ID</th>
                  <th className="px-5 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap">분류 (영역 &gt; 단계 &gt; 활동)</th>
                  <th className="px-5 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap">산출물 / 화면명</th>
                  <th className="px-5 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap">담당자 (기획/IT)</th>
                  <th className="px-5 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap">일정 (시작~종료)</th>
                  <th className="px-5 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap">상태 (진척율)</th>
                  <th className="px-5 py-4 text-[13px] font-bold text-slate-600">상세 변경내역</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyList.map((row, idx) => {
                  // 1. 날짜 세팅
                  const date = row["변경일시"] 
                    ? new Date(row["변경일시"]).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) 
                    : "-";
                  
                  // 2. JSON 데이터 안전하게 파싱
                  let fullData = row["전체데이터"];
                  if (typeof fullData === "string") {
                    try { fullData = JSON.parse(fullData); } catch (e) { fullData = {}; }
                  } else if (!fullData) {
                    fullData = {};
                  }

                  // 3. 🌟 모든 칼럼 데이터 싹싹 긁어오기 (한글/영문 키값 대응)
                  const id = fullData["요구사항ID"] || fullData["id"] || "-";
                  const area = fullData["영역"] || fullData["area"] || "";
                  const phase = fullData["단계"] || fullData["phase"] || "";
                  const activity = fullData["활동"] || fullData["activity"] || "";
                  const deliverable = fullData["산출물"] || fullData["deliverable"] || "";
                  const taskName = fullData["화면명"] || fullData["요구사항명"] || fullData["taskName"] || "";
                  
                  const start = fullData["시작일"] || fullData["start"] || "";
                  const end = fullData["종료일"] || fullData["end"] || "";
                  const status = fullData["상태"] || fullData["status"] || "-";
                  const progress = fullData["진척율"] || fullData["progress"] || "";
                  
                  const planAssignee = fullData["담당자(기획)"] || fullData["담당자"] || fullData["assigneePlan"] || "";
                  const itAssignee = fullData["담당자(IT)"] || fullData["assigneeIT"] || "";
                  const changes = fullData["변경내역"] || "-";

                  // 4. 데이터 보기 좋게 조립
                  const categoryPath = [area, phase, activity].filter(Boolean).join(" > ") || "-";
                  const names = [deliverable, taskName].filter(Boolean).join(" / ") || "-";
                  const schedule = (start || end) ? `${start || '?'} ~ ${end || '?'}` : "-";
                  const statusDisplay = progress ? `${status} (${progress}%)` : status;
                  const assignees = [planAssignee, itAssignee].filter(Boolean).join(" / ") || "-";

                  // 5. 🌟 신규 vs 변경 뱃지 판단 로직
                  // "신규"라는 단어가 변경내역, 이력구분, 상태 등에 있으면 신규로 판정!
                  const isNew = 
                    String(fullData["이력구분"]).includes("신규") || 
                    String(fullData["작업구분"]).includes("신규") || 
                    String(changes).includes("신규");

                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 text-[12px] font-medium text-slate-500 whitespace-nowrap">{date}</td>
                      
                      {/* 신규/변경 뱃지 영역 */}
                      <td className="px-5 py-4 text-center">
                        {isNew ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-600">
                            <PlusCircle className="w-3 h-3" />
                            <span className="text-[12px] font-extrabold tracking-tight">신규</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-600">
                            <RefreshCw className="w-3 h-3" />
                            <span className="text-[12px] font-extrabold tracking-tight">변경</span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="px-2 py-1 text-[11px] font-bold bg-slate-100 text-slate-600 rounded-md border border-slate-200 whitespace-nowrap">
                          {id}
                        </span>
                      </td>
                      
                      <td className="px-5 py-4 text-[12px] font-semibold text-slate-500 whitespace-nowrap">{categoryPath}</td>
                      <td className="px-5 py-4 text-[13px] font-extrabold text-slate-700 whitespace-nowrap">{names}</td>
                      <td className="px-5 py-4 text-[12px] font-medium text-slate-600 whitespace-nowrap">{assignees}</td>
                      <td className="px-5 py-4 text-[12px] font-medium text-slate-500 whitespace-nowrap tracking-tight">{schedule}</td>
                      <td className="px-5 py-4 text-[12px] font-bold text-slate-600 whitespace-nowrap">{statusDisplay}</td>
                      
                      <td className="px-5 py-4 text-[13px] font-medium text-orange-600 leading-relaxed break-keep min-w-[250px]">
                        {changes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
      </div>
    </div>
  );
}
