import React, { useEffect, useState } from "react";
import { History, Database, Loader2, PlusCircle, RefreshCw } from "lucide-react";

interface HistoryData {
  history_id?: number;
  요구사항ID?: string;
  변경일시?: string;
  변경내역?: any;
  전체데이터?: any;
}

export default function HistoryDashboard() {
  const [historyList, setHistoryList] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🌟 수파베이스 Project URL & API Key
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
      <div className="max-w-[1600px] mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* 상단 헤더 영역 */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 bg-white">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <History className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-extrabold text-slate-800">요구사항 전체 변경 이력 대시보드</h1>
            <p className="text-[12px] font-semibold text-slate-400 mt-0.5">수파베이스 DB 실시간 연동 완료 🚀</p>
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
                  <th className="px-4 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap">변경일시</th>
                  <th className="px-4 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap text-center">이력구분</th>
                  <th className="px-4 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap">요구사항ID</th>
                  <th className="px-4 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap">분류 (시트명 &gt; 업무구분)</th>
                  <th className="px-4 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap">대상 (화면명 / 요구사항명)</th>
                  <th className="px-4 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap">담당자</th>
                  <th className="px-4 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap">상태정보</th>
                  <th className="px-4 py-4 text-[13px] font-bold text-slate-600">상세 변경내역</th>
                  <th className="px-4 py-4 text-[13px] font-bold text-slate-600">요구사항 상세 내용</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyList.map((row, idx) => {
                  // 1. 날짜 세팅 (UTC 시간 -> 한국 시간으로 변환)
                  const date = row["변경일시"] 
                    ? new Date(row["변경일시"]).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) 
                    : "-";
                  
                  // 2. JSON 데이터 파싱 (전체데이터 컬럼)
                  let fullData = row["전체데이터"];
                  if (typeof fullData === "string") {
                    try { fullData = JSON.parse(fullData); } catch (e) { fullData = {}; }
                  } else if (!fullData) {
                    fullData = {};
                  }

                  // 3. JSON 데이터 파싱 (변경내역 컬럼 안에 들어있는 '이력' 텍스트 뽑기)
                  let changeHistory = row["변경내역"];
                  let changeText = "-";
                  if (typeof changeHistory === "string") {
                    try { 
                      const parsed = JSON.parse(changeHistory); 
                      changeText = parsed["이력"] || changeHistory;
                    } catch (e) { 
                      changeText = changeHistory || "-"; 
                    }
                  } else if (changeHistory && typeof changeHistory === "object") {
                    changeText = changeHistory["이력"] || JSON.stringify(changeHistory);
                  }

                  // 4. 요구사항 명세서의 모든 칼럼 데이터 싹싹 긁어오기 (CSV 기준)
                  const id = row["요구사항ID"] || fullData["요구사항ID"] || "-";
                  const sheetName = fullData["시트명"] || "-";
                  const workCategory = fullData["업무구분"] || "-";
                  const screenName = fullData["화면명"] || "-";
                  const reqName = fullData["요구사항명"] || "";
                  const assignee = fullData["담당자"] || "-";
                  const reqStatus = fullData["요구사항 상태"] || "-";
                  const reqType = fullData["구분(현행/신규/개선/제외)"] || fullData["유형"] || "-";
                  const importance = fullData["중요도"] || "";
                  
                  // 아주 긴 요구사항 내용
                  const reqContent = fullData["요구사항 내용"] || "-";

                  // 5. 보기 좋게 데이터 조립
                  const categoryPath = [sheetName, workCategory].filter(c => c && c !== "-").join(" > ") || "-";
                  const names = [screenName, reqName].filter(n => n && n !== "-").join(" / ") || "-";
                  const statusDisplay = [reqStatus, reqType].filter(s => s && s !== "-").join(" | ") || "-";

                  // 6. 🌟 신규 vs 변경 뱃지 판단 로직 (문자열에 "신규"가 포함되어 있으면 신규)
                  const isNew = String(changeText).includes("신규") || String(reqType).includes("신규");

                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      {/* 날짜 */}
                      <td className="px-4 py-4 text-[12px] font-medium text-slate-500 whitespace-nowrap">{date}</td>
                      
                      {/* 신규/변경 뱃지 영역 */}
                      <td className="px-4 py-4 text-center">
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

                      {/* 요구사항 ID */}
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 text-[11px] font-bold bg-slate-100 text-slate-600 rounded-md border border-slate-200 whitespace-nowrap">
                          {id}
                        </span>
                      </td>
                      
                      {/* 텍스트 데이터들 */}
                      <td className="px-4 py-4 text-[12px] font-semibold text-slate-500 whitespace-nowrap">{categoryPath}</td>
                      
                      {/* 화면명/요구사항명 + 중요도 뱃지 */}
                      <td className="px-4 py-4 text-[13px] font-extrabold text-slate-700 whitespace-nowrap">
                        {names}
                        {importance && importance !== "minor" && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-red-50 text-red-500 rounded border border-red-100 uppercase">
                            {importance}
                          </span>
                        )}
                      </td>
                      
                      <td className="px-4 py-4 text-[12px] font-medium text-slate-600 whitespace-nowrap">{assignee}</td>
                      <td className="px-4 py-4 text-[12px] font-bold text-slate-600 whitespace-nowrap">{statusDisplay}</td>
                      
                      {/* 파싱된 이력 텍스트 (예: ✨ 신규 요구사항 등록) */}
                      <td className="px-4 py-4 text-[13px] font-medium text-orange-600 leading-relaxed break-keep min-w-[150px]">
                        {changeText}
                      </td>

                      {/* 매우 긴 요구사항 상세 내용 (줄바꿈 허용) */}
                      <td className="px-4 py-4 text-[12px] font-medium text-slate-600 whitespace-pre-wrap leading-relaxed min-w-[300px] break-keep">
                        {reqContent}
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
