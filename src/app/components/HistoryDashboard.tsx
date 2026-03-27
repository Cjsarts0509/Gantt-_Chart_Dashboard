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

// 🌟 엑셀에서 관리하는 11개 핵심 항목 리스트
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
        
        // 🌟 1. 과거순으로 정렬하여 이전 데이터와 비교할 준비를 합니다.
        const chronological = [...rawData].reverse();
        const lastStateMap: Record<string, any> = {};

        // 🌟 2. 데이터를 돌면서 이전 상태와 비교해 바뀐 항목을 찾아냅니다.
        const processedData = chronological.map(row => {
          let fullData: any = {};
          if (typeof row["전체데이터"] === "string") {
            try { fullData = JSON.parse(row["전체데이터"]); } catch (e) {}
          } else if (row["전체데이터"]) {
            fullData = row["전체데이터"];
          }

          const reqId = row["요구사항ID"] || fullData["요구사항ID"] || "-";
          const changedFields = new Set<string>();

          // 이전에 저장된 해당 ID의 데이터가 있다면, 현재와 11개 항목을 각각 비교!
          if (lastStateMap[reqId]) {
            FIELDS.forEach(f => {
              // null, undefined 처리를 위해 String으로 변환 후 비교
              if (String(fullData[f] || "") !== String(lastStateMap[reqId][f] || "")) {
                changedFields.add(f);
              }
            });
          }

          // 현재 상태를 다음 비교를 위해 저장
          lastStateMap[reqId] = { ...fullData };

          // 변경내역 텍스트 파싱
          let changeText = "-";
          try {
            const parsed = typeof row["변경내역"] === "string" ? JSON.parse(row["변경내역"]) : row["변경내역"];
            changeText = parsed?.["이력"] || String(row["변경내역"] || "-");
          } catch (e) {
            changeText = String(row["변경내역"] || "-");
          }

          return { ...row, parsedData: fullData, changedFields, changeText, reqId };
        });

        // 🌟 3. 다시 최신순으로 뒤집어서 화면에 띄웁니다!
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
    <div className="w-screen h-screen bg-[#F1F5F9] overflow-auto p-8" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      <div className="max-w-[1600px] mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 bg-white">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <History className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-extrabold text-slate-800">요구사항 전체 변경 이력 대시보드</h1>
            <p className="text-[12px] font-semibold text-slate-400 mt-0.5">최근 100건의 업데이트 내역 및 상세 비교</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {historyList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
              <Database className="w-12 h-12 text-slate-200" />
              <p className="text-[14px] font-bold">아직 변경 이력이 없습니다.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-[13px] font-bold text-slate-600 whitespace-nowrap bg-[#f1f5f9]">변경일시</th>
                  <th className="px-4 py-3 text-[13px] font-bold text-slate-600 whitespace-nowrap bg-[#f1f5f9]">이력구분</th>
                  <th className="px-4 py-3 text-[13px] font-bold text-slate-600 whitespace-nowrap bg-[#f1f5f9]">요구사항ID</th>
                  {/* 엑셀의 11개 핵심 컬럼을 순서대로 헤더에 배치 */}
                  {FIELDS.map(f => (
                    <th key={f} className="px-4 py-3 text-[13px] font-bold text-slate-600 whitespace-nowrap bg-[#f1f5f9]">{f}</th>
                  ))}
                  <th className="px-4 py-3 text-[13px] font-bold text-slate-600 bg-[#f1f5f9] min-w-[150px]">상세 변경내역</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
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
                      
                      {/* 🌟 11개 컬럼을 돌면서 데이터 출력! (변경되었으면 빨간색 굵게) */}
                      {FIELDS.map(f => {
                        const val = row.parsedData?.[f] || "-";
                        const isChanged = row.changedFields?.has(f);
                        // 요구사항 내용은 길 수 있으므로 넓게 펼쳐줌
                        const isLongText = f === "요구사항 내용"; 

                        return (
                          <td key={f} className={`px-4 py-4 text-[12px] ${isLongText ? "min-w-[250px] whitespace-pre-wrap break-keep leading-relaxed" : "whitespace-nowrap"} ${isChanged ? "text-red-500 font-bold" : "text-slate-600 font-medium"}`}>
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
