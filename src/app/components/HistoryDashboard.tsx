import React, { useEffect, useState } from "react";
import { History, Database, Loader2, PlusCircle, RefreshCw } from "lucide-react";

interface HistoryData {
  변경일시: string;
  변경내역: any;
  전체데이터: any;
  parsedData?: any;
  changedFields?: Set<string>;
  changeText?: string;
  reqId?: string;
}

const FIELDS = [
  "업무구분", "요구사항명", "요구사항 내용", "구분(현행/신규/개선/제외)",
  "화면명", "중요도", "개발순위", "출처", "담당자", "요구사항 상태", "변경구분"
];

export default function HistoryDashboard() {
  const [historyList, setHistoryList] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const SUPABASE_URL = "https://cbogmikpdlmwgluahcnz.supabase.co"; 
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib2dtaWtwZGxtd2dsdWFoY256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDIxMjksImV4cCI6MjA4Nzc3ODEyOX0.nagpgjcC7fbk5Bsi812giOSkiKGHG-Y-UZwWndwFbmY";
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
        const rawData = Array.isArray(data) ? data : [];
        const chronological = [...rawData].reverse();
        const lastStateMap: Record<string, any> = {};

        const processedData = chronological.map(row => {
          let fullData: any = {};
          if (typeof row["전체데이터"] === "string") {
            try { fullData = JSON.parse(row["전체데이터"]); } catch (e) {}
          } else if (row["전체데이터"]) {
            fullData = row["전체데이터"];
          }

          const reqId = row["요구사항ID"] || fullData["요구사항ID"] || "-";
          const changedFields = new Set<string>();

          if (lastStateMap[reqId]) {
            FIELDS.forEach(f => {
              if (String(fullData[f] || "") !== String(lastStateMap[reqId][f] || "")) {
                changedFields.add(f);
              }
            });
          }

          lastStateMap[reqId] = { ...fullData };

          let changeText = "-";
          try {
            const parsed = typeof row["변경내역"] === "string" ? JSON.parse(row["변경내역"]) : row["변경내역"];
            changeText = parsed?.["이력"] || String(row["변경내역"] || "-");
          } catch (e) {
            changeText = String(row["변경내역"] || "-");
          }

          return { ...row, parsedData: fullData, changedFields, changeText, reqId };
        });

        setHistoryList(processedData.reverse());
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
    /* 🌟 전체 레이아웃을 flex-col로 잡고 h-screen으로 고정하여 화면 밖으로 안 나가게 함 */
    <div className="flex flex-col w-screen h-screen bg-[#F1F5F9] p-4 md:p-8" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      
      {/* 🌟 흰색 카드를 전체 높이(flex-1)로 잡고 내부 스크롤 허용 */}
      <div className="flex flex-col flex-1 max-w-[1800px] mx-auto w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* 상단 헤더 (고정됨) */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 bg-white z-20">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <History className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-extrabold text-slate-800">요구사항 전체 변경 이력 대시보드</h1>
            <p className="text-[12px] font-semibold text-slate-400 mt-0.5">최근 100건 실시간 데이터 및 항목별 변경 추적</p>
          </div>
        </div>

        {/* 🌟 테이블 본문 영역: 여기가 핵심입니다. 
            flex-1과 overflow-auto를 주어 가로/세로 스크롤바가 항상 이 영역 안에서만 보이게 함 */}
        <div className="flex-1 overflow-auto bg-white">
          {historyList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
              <Database className="w-12 h-12 text-slate-200" />
              <p className="text-[14px] font-bold">아직 변경 이력이 없습니다.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                {/* 🌟 sticky top-0을 사용하여 세로 스크롤 시에도 헤더가 상단에 고정됨 */}
                <tr className="sticky top-0 z-10">
                  <th className="px-4 py-3 text-[13px] font-bold text-slate-600 bg-slate-100 border-b border-slate-200">변경일시</th>
                  <th className="px-4 py-3 text-[13px] font-bold text-slate-600 bg-slate-100 border-b border-slate-200 text-center">구분</th>
                  <th className="px-4 py-3 text-[13px] font-bold text-slate-600 bg-slate-100 border-b border-slate-200">요구사항ID</th>
                  {FIELDS.map(f => (
                    <th key={f} className="px-4 py-3 text-[13px] font-bold text-slate-600 bg-slate-100 border-b border-slate-200">{f}</th>
                  ))}
                  <th className="px-4 py-3 text-[13px] font-bold text-slate-600 bg-slate-100 border-b border-slate-200">상세 변경내역</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyList.map((row, idx) => {
                  const date = row["변경일시"] 
                    ? new Date(row["변경일시"]).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) 
                    : "-";
                  const isNew = String(row.changeText).includes("신규") || String(row.parsedData?.["구분(현행/신규/개선/제외)"] || "").includes("신규");

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-[12px] font-medium text-slate-500 whitespace-nowrap">{date}</td>
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {isNew ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-600">
                            <PlusCircle className="w-3 h-3" />
                            <span className="text-[11px] font-extrabold tracking-tight">신규</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-600">
                            <RefreshCw className="w-3 h-3" />
                            <span className="text-[11px] font-extrabold tracking-tight">변경</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-[11px] font-bold bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                          {row.reqId}
                        </span>
                      </td>
                      {FIELDS.map(f => {
                        const val = row.parsedData?.[f] || "-";
                        const isChanged = row.changedFields?.has(f);
                        const isLongText = f === "요구사항 내용";
                        return (
                          <td key={f} className={`px-4 py-4 text-[12px] ${isLongText ? "min-w-[300px] whitespace-pre-wrap break-keep leading-relaxed" : "whitespace-nowrap"} ${isChanged ? "text-red-500 font-bold" : "text-slate-600 font-medium"}`}>
                            {val}
                          </td>
                        );
                      })}
                      <td className="px-4 py-4 text-[12px] font-medium text-orange-600 leading-relaxed break-keep">
                        {row.changeText}
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
