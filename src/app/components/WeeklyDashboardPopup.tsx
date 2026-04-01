import React, { useMemo, useState } from "react";
import { X, CalendarClock, AlertTriangle, TrendingDown } from "lucide-react";
import { WBSTask } from "./mockData";
import { STATUS_MAP } from "./CustomTaskList";

interface Props {
  tasks: WBSTask[];
  onClose: () => void;
}

// 오늘 날짜 기준으로 이 작업이 '이론적으로' 몇 % 진행되어야 하는지 계산
const getPlannedProgress = (start: Date, end: Date) => {
  const today = new Date().getTime();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  
  if (today < s) return 0;
  if (today > e) return 100;
  if (s === e) return 100;
  return Math.round(((today - s) / (e - s)) * 100);
};

export default function WeeklyDashboardPopup({ tasks, onClose }: Props) {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  const { overallPlanned, overallActual, delayedTasks, areaStats } = useMemo(() => {
    // 1) 단계 '설계' 제외
    const validTasks = tasks.filter(t => t.phase !== '설계' && t.phase);
    
    let buildTotalActual = 0, buildTotalPlanned = 0, buildCount = 0;
    let testTotalActual = 0, testTotalPlanned = 0, testCount = 0;
    const delayed: any[] = [];
    const aStats: Record<string, { total: number; delayed: number; actualSum: number; plannedSum: number }> = {};

    validTasks.forEach(t => {
      const area = t.area || '기타';
      if (!aStats[area]) aStats[area] = { total: 0, delayed: 0, actualSum: 0, plannedSum: 0 };
      
      const actualProg = STATUS_MAP[t.status || ""]?.progress ?? Number(t.progress) ?? 0;
      const plannedProg = getPlannedProgress(new Date(t.start), new Date(t.end));
      
      aStats[area].total += 1;
      aStats[area].actualSum += actualProg;
      aStats[area].plannedSum += plannedProg;

      if (t.phase === '구축') {
        buildTotalActual += actualProg; buildTotalPlanned += plannedProg; buildCount++;
      } else if (t.phase === '테스트') {
        testTotalActual += actualProg; testTotalPlanned += plannedProg; testCount++;
      }

      // 계획 대비 실적이 떨어지는 항목 수집
      if (actualProg < plannedProg && t.status !== '최종완료' && t.status !== '개발제외') {
        delayed.push({ ...t, actualProg, plannedProg });
        aStats[area].delayed += 1;
      }
    });

    // 2) 가중치 계산: 구축 70%, 테스트 30%
    const buildActualAvg = buildCount > 0 ? buildTotalActual / buildCount : 0;
    const buildPlannedAvg = buildCount > 0 ? buildTotalPlanned / buildCount : 0;
    const testActualAvg = testCount > 0 ? testTotalActual / testCount : 0;
    const testPlannedAvg = testCount > 0 ? testTotalPlanned / testCount : 0;

    let wSum = 0;
    if (buildCount > 0) wSum += 0.7;
    if (testCount > 0) wSum += 0.3;
    
    const oActual = wSum > 0 ? Math.round(((buildActualAvg * 0.7) + (testActualAvg * 0.3)) / wSum) : 0;
    const oPlanned = wSum > 0 ? Math.round(((buildPlannedAvg * 0.7) + (testPlannedAvg * 0.3)) / wSum) : 0;

    // 지연 항목 정렬: 달성률 낮은 순, 최종완료는 후순위
    delayed.sort((a, b) => {
      if (a.status === '최종완료' && b.status !== '최종완료') return 1;
      if (a.status !== '최종완료' && b.status === '최종완료') return -1;
      return a.actualProg - b.actualProg;
    });

    return { overallPlanned: oPlanned, overallActual: oActual, delayedTasks: delayed, areaStats: aStats };
  }, [tasks]);

  const filteredDelayedTasks = selectedArea ? delayedTasks.filter(t => t.area === selectedArea) : delayedTasks;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[1000px] h-[85vh] flex flex-col overflow-hidden relative border border-slate-200 font-sans">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">주간 진행률 및 계획 대비 점검</h2>
            <span className="ml-2 text-[12px] text-slate-500 font-medium">(*설계 단계 제외 / 구축 70% + 테스트 30% 가중치 반영)</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col bg-[#F8FAFC] p-6 gap-6">
          {/* 상단 요약 카드 */}
          <div className="grid grid-cols-2 gap-5 shrink-0">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold text-slate-500 mb-1">현재 계획 상 목표 진행률 (조회일 기준)</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-[36px] font-extrabold text-slate-800 leading-none">{overallPlanned}</p>
                  <span className="text-[18px] font-bold text-slate-400">%</span>
                </div>
              </div>
            </div>
            <div className={`p-6 rounded-xl shadow-sm border flex items-center justify-between ${overallActual < overallPlanned ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div>
                <p className={`text-[13px] font-bold mb-1 ${overallActual < overallPlanned ? 'text-rose-600' : 'text-emerald-600'}`}>실제 달성 진행률 (구축/테스트 가중치)</p>
                <div className="flex items-baseline gap-1">
                  <p className={`text-[36px] font-extrabold leading-none ${overallActual < overallPlanned ? 'text-rose-700' : 'text-emerald-700'}`}>{overallActual}</p>
                  <span className="text-[18px] font-bold opacity-70">%</span>
                </div>
              </div>
              {overallActual < overallPlanned && <TrendingDown className="w-10 h-10 text-rose-500/50" />}
            </div>
          </div>

          {/* 지연/이슈 작업 리스트 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <h3 className="text-[14px] font-bold text-slate-800">계획 대비 지연 항목 점검</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedArea(null)} className={`px-3 py-1 rounded-md text-[12px] font-bold transition-all ${!selectedArea ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>전체</button>
                {Object.keys(areaStats).map(area => (
                  <button key={area} onClick={() => setSelectedArea(area)} className={`px-3 py-1 rounded-md text-[12px] font-bold transition-all flex items-center gap-1 ${selectedArea === area ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    {area} <span className="opacity-70 text-[10px]">{areaStats[area].delayed}건</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {filteredDelayedTasks.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 font-bold text-[14px]">계획보다 지연된 항목이 없습니다! 🎉</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[12px] text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-3">구분/단계</th>
                      <th className="p-3">작업명</th>
                      <th className="p-3">담당자</th>
                      <th className="p-3 text-center">상태</th>
                      <th className="p-3 text-right">계획 진행률</th>
                      <th className="p-3 text-right">실제 진행률</th>
                      <th className="p-3 text-right">Gap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDelayedTasks.map((t, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 text-[12px] text-slate-700">
                        {/* 🌟 에러 수정: '>' 대신 '&gt;' 사용 */}
                        <td className="p-3 font-semibold text-slate-500">{t.area} &gt; {t.phase}</td>
                        <td className="p-3 font-bold">{t.taskName}</td>
                        <td className="p-3">{t.assigneePlan} / {t.assigneeIT}</td>
                        <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-bold">{t.status}</span></td>
                        <td className="p-3 text-right text-slate-400">{t.plannedProg}%</td>
                        <td className="p-3 text-right font-bold text-rose-600">{t.actualProg}%</td>
                        <td className="p-3 text-right font-bold text-rose-500">-{t.plannedProg - t.actualProg}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
