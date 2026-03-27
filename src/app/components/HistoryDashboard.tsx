import React, { useEffect, useState } from "react";
import { History, Database, Loader2 } from "lucide-react";

interface HistoryData {
  변경일시: string;
  전체데이터: any;
}

export default function HistoryDashboard() {
  const [historyList, setHistoryList] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🌟 브랜치명을 data에서 main으로 완벽하게 수정한 최종 URL입니다!
    const fetchUrl = `https://raw.githubusercontent.com/cjsarts0509/Gantt-_Chart_Dashboard/main/history.json?t=${new Date().getTime()}`;

    fetch(fetchUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
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
        <p className="text-[15px] font-bold">변경 이력을 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#F1F5F9] overflow-auto p-8" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      <div className="max-w-[1400px] mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 bg-white">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <History className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-extrabold text-slate-800">WBS 전체 변경 이력 대시보드</h1>
            <p className="text-[12px] font-semibold text-slate-400 mt-0.5">최근 100건의 업데이트 내역</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {historyList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
              <Database className="w-12 h-12 text-slate-200" />
              <p className="text-[14px] font-bold">최근 변경된 이력이 없습니다.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap">변경일시</th>
                  <th className="px-6 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap">요구사항ID</th>
                  <th className="px-6 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap">화면명 (요구사항명)</th>
                  <th className="px-6 py-4 text-[13px] font-bold text-slate-600">상세 변경내역</th>
                  <th className="px-6 py-4 text-[13px] font-bold text-slate-600 whitespace-nowrap">담당자</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyList.map((row, idx) => {
                  const date = row["변경일시"] 
                    ? new Date(row["변경일시"]).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) 
                    : "-";
                  
                  let fullData = row["전체데이터"];
                  if (typeof fullData === "string") {
                    try { 
                      fullData = JSON.parse(fullData); 
                    } catch (e) { 
                      fullData = {}; 
                    }
                  } else if (!fullData) {
                    fullData = {};
                  }

                  const id = fullData["요구사항ID"] || "-";
                  const name = fullData["화면명"] || fullData["요구사항명"] || "-";
                  const changes = fullData["변경내역"] || "-";
                  const manager = fullData["담당자"] || "-";

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-[13px] font-medium text-slate-500 whitespace-nowrap">
                        {date}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-[12px] font-bold bg-slate-100 text-slate-600 rounded-md border border-slate-200 whitespace-nowrap">
                          {id}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-bold text-slate-700">
                        {name}
                      </td>
                      <td className="px-6 py-4 text-[13px] font-medium text-orange-600 leading-relaxed break-keep">
                        {changes}
                      </td>
                      <td className="px-6 py-4 text-[13px] font-medium text-slate-600 whitespace-nowrap">
                        {manager}
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
