import React, { useMemo, useState } from "react";
import { X, CalendarClock, AlertTriangle, TrendingDown, CheckCircle2, ListTodo } from "lucide-react";
import { WBSTask } from "./mockData";
import { STATUS_MAP } from "./CustomTaskList";

interface Props {
  tasks: WBSTask[];
  onClose?: () => void;
  isStandalone?: boolean;
}

const getPlannedProgress = (start: Date, end: Date, targetDate: Date) => {
  const t = targetDate.getTime();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (t < s) return 0;
  if (t >= e) return 100;
  if (s === e) return 100;
  return Math.round(((t - s) / (e - s)) * 100);
};

export default function WeeklyDashboardPopup({ tasks, onClose, isStandalone = false }: Props) {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  // 주간 목표일: 직전 일요일 자정
  const targetDate = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -7 : -day; 
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() + diff);
    lastSunday.setHours(23, 59, 59, 999);
    return lastSunday;
  }, []);

  const { overallPlanned, overallActual, areaStats, detailedTasks, totalValidCount, completedCount, incompleteCount } = useMemo(() => {
    // 설계 및 '기타/빈칸' 영역 제외
    const validTasks = tasks.filter(t => t.phase !== '설계' && t.phase && t.area && String(t.area).trim() !== '');
    
    let buildTotalActual = 0, buildTotalPlanned = 0, buildCount = 0;
    let testTotalActual = 0, testTotalPlanned = 0, testCount = 0;
    let compCount = 0;
    
    const aStats: Record<string, any> = {};
    const details: any[] = [];

    validTasks.forEach(t => {
      const area = String(t.area).trim();
      if (!aStats[area]) {
        aStats[area] = { buildActualSum: 0, buildPlannedSum: 0, buildCount: 0, testActualSum: 0, testPlannedSum: 0, testCount: 0 };
      }
      
      const actualProg = STATUS_MAP[t.status || ""]?.progress ?? Number(t.progress) ?? 0;
      const plannedProg = getPlannedProgress(t.start, t.end, targetDate);
      
      if (actualProg === 100) compCount++;

      if (t.phase === '구축') {
        buildTotalActual += actualProg; buildTotalPlanned += plannedProg; buildCount++;
        aStats[area].buildActualSum += actualProg; aStats[area].buildPlannedSum += plannedProg; aStats[area].buildCount++;
      } else if (t.phase === '테스트') {
        testTotalActual += actualProg; testTotalPlanned += plannedProg; testCount++;
        aStats[area].testActualSum += actualProg; aStats[area].testPlannedSum += plannedProg; aStats[area].testCount++;
      }

      details.push({ ...t, actualProg, plannedProg });
    });

    const processedAStats = Object.keys(aStats).map(area => {
      const s = aStats[area];
      const bActAvg = s.buildCount > 0 ? s.buildActualSum / s.buildCount : 0;
      const bPlnAvg = s.buildCount > 0 ? s.buildPlannedSum / s.buildCount : 0;
      const tActAvg = s.testCount > 0 ? s.testActualSum / s.testCount : 0;
      const tPlnAvg = s.testCount > 0 ? s.testPlannedSum / s.testCount : 0;
      
      let wSum = 0;
      if (s.buildCount > 0) wSum += 0.7;
      if (s.testCount > 0) wSum += 0.3;
      
      const act = wSum > 0 ? Math.round(((bActAvg * 0.7) + (tActAvg * 0.3)) / wSum) : 0;
      const pln = wSum > 0 ? Math.round(((bPlnAvg * 0.7) + (tPlnAvg * 0.3)) / wSum) : 0;
      
      return { area, actualProg: act, plannedProg: pln, gap: act - pln };
    });

    const buildActualAvg = buildCount > 0 ? buildTotalActual / buildCount : 0;
    const buildPlannedAvg = buildCount > 0 ? buildTotalPlanned / buildCount : 0;
    const testActualAvg = testCount > 0 ? testTotalActual / testCount : 0;
    const testPlannedAvg = testCount > 0 ? testTotalPlanned / testCount : 0;

    let wSum = 0;
    if (buildCount > 0) wSum += 0.7;
    if (testCount > 0) wSum += 0.3;
    
    const oActual = wSum > 0 ? Math.round(((buildActualAvg * 0.7) + (testActualAvg * 0.3)) / wSum) : 0;
    const oPlanned = wSum > 0 ? Math.round(((buildPlannedAvg * 0.7) + (testPlannedAvg * 0.3)) / wSum) : 0;

    // 🌟 정렬 로직 업데이트 적용
    details.sort((a, b) => {
      // 1순위: 계획 대비 지연 항목을 무조건 최상단으로 올림
      const isDelayedA = a.actualProg < a.plannedProg ? 1 : 0;
      const isDelayedB = b.actualProg < b.plannedProg ? 1 : 0;
      if (isDelayedA !== isDelayedB) return isDelayedB - isDelayedA; 
      
      // 2순위: 산출물 오름차순 (가나다순)
      const delA = a.deliverable || "";
      const delB = b.deliverable || "";
      if (delA < delB) return -1;
      if (delA > delB) return 1;
      
      // 3순위: 실제 진행률 오름차순 (낮은게 위로)
      return a.actualProg - b.actualProg;
    });

    return { 
      overallPlanned: oPlanned, 
      overallActual: oActual, 
      areaStats: processedAStats, 
      detailedTasks: details,
      totalValidCount: validTasks.length,
      completedCount: compCount,
      incompleteCount: validTasks.length - compCount
    };
  }, [tasks, targetDate]);

  const filteredTasks = selectedArea ? detailedTasks.filter(t => t.area === selectedArea) : [];

  const containerClass = isStandalone
    ? "w-screen h-screen bg-[#F8FAFC] flex flex-col overflow-hidden font-sans"
    : "bg-white rounded-xl shadow-2xl w-[1200px] h-[85vh] max-w-[95vw] flex flex-col overflow-hidden relative border border-slate-200 font-sans";

  const popupContent = (
    <div className={containerClass}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-indigo-600" />
          <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">주간 진행률 및 계획 대비 점검</h2>
          <span className="ml-2 text-[12px] text-slate-500 font-medium">(*기준: {targetDate.toLocaleDateString()} / 구축 70% + 테스트 30%)</span>
        </div>
        {isStandalone ? (
          <button onClick={() => window.location.href = '?'} className="px-3 py-1.5 rounded-md text-[12px] font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            메인 차트로 돌아가기
          </button>
        ) : (
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-[#F8FAFC] p-6 gap-6">
        <div className="grid grid-cols-3 gap-5 shrink-0">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-slate-500 mb-1">전체 대상 항목</p>
              <div className="flex items-baseline gap-1"><p className="text-[30px] font-extrabold text-slate-800 leading-none">{totalValidCount}</p><span className="text-[14px] font-bold text-slate-400">건</span></div>
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center"><ListTodo className="w-6 h-6 text-slate-600" /></div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between border-l-4 border-l-emerald-500">
            <div>
              <p className="text-[13px] font-bold text-emerald-600 mb-1">완료 (100%)</p>
              <div className="flex items-baseline gap-1"><p className="text-[30px] font-extrabold text-emerald-700 leading-none">{completedCount}</p><span className="text-[14px] font-bold text-slate-400">건</span></div>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between border-l-4 border-l-rose-500">
            <div>
              <p className="text-[13px] font-bold text-rose-600 mb-1">미완료 (진행중/지연)</p>
              <div className="flex items-baseline gap-1"><p className="text-[30px] font-extrabold text-rose-700 leading-none">{incompleteCount}</p><span className="text-[14px] font-bold text-slate-400">건</span></div>
            </div>
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-rose-500" /></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-white shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => setSelectedArea(null)} className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-all ${!selectedArea ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>전체 통계 요약</button>
              {areaStats.map(s => (
                <button key={s.area} onClick={() => setSelectedArea(s.area)} className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-all ${selectedArea === s.area ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {s.area}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-white flex flex-col">
            {!selectedArea ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[13px] text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-4">구분</th>
                    <th className="p-4 text-center">계획 진행률</th>
                    <th className="p-4 text-center">실제 진행률</th>
                    <th className="p-4 text-center">GAP</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-indigo-50/50 border-b-2 border-slate-200 text-[13px] font-bold text-slate-800">
                    <td className="p-4 text-indigo-700">전체 통합 평균</td>
                    <td className="p-4 text-center text-slate-600">{overallPlanned}%</td>
                    <td className="p-4 text-center text-indigo-600">{overallActual}%</td>
                    <td className={`p-4 text-center ${overallActual < overallPlanned ? 'text-rose-600' : 'text-emerald-600'}`}>{overallActual - overallPlanned}%</td>
                  </tr>
                  {areaStats.map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 text-[13px] text-slate-700 font-medium">
                      <td className="p-4">{s.area}</td>
                      <td className="p-4 text-center text-slate-500">{s.plannedProg}%</td>
                      <td className="p-4 text-center font-bold text-indigo-600">{s.actualProg}%</td>
                      <td className={`p-4 text-center font-bold ${s.gap < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{s.gap}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col h-full">
                {(() => {
                  const stat = areaStats.find(s => s.area === selectedArea);
                  if (!stat) return null;
                  return (
                    <div className="flex items-center justify-between px-5 py-3 bg-indigo-50/30 border-b border-indigo-100 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        <span className="text-[14px] font-extrabold text-indigo-900">{stat.area} 진행 현황 요약</span>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-md border border-indigo-100 shadow-sm text-[12px] font-bold">
                          <span className="text-slate-500">계획 진행률</span>
                          <span className="text-slate-700">{stat.plannedProg}%</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-md border border-indigo-100 shadow-sm text-[12px] font-bold">
                          <span className="text-indigo-600">실제 진행률</span>
                          <span className="text-indigo-700">{stat.actualProg}%</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-md border border-indigo-100 shadow-sm text-[12px] font-bold">
                          <span className="text-slate-500">GAP</span>
                          <span className={stat.gap < 0 ? 'text-rose-600' : 'text-emerald-600'}>{stat.gap}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                <div className="flex-1 overflow-auto p-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[12px] text-slate-500 font-bold border-b border-slate-200">
                        <th className="p-3">구분</th>
                        <th className="p-3">산출물</th>
                        <th className="p-3">화면명</th>
                        <th className="p-3">담당자(기획)</th>
                        <th className="p-3">담당자(IT)</th>
                        <th className="p-3 text-center">상태</th>
                        <th className="p-3 text-right">계획 진행률</th>
                        <th className="p-3 text-right">실제 진행률</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((t, idx) => {
                        const isDelayed = t.actualProg < t.plannedProg;
                        return (
                          <tr key={idx} className={`border-b border-slate-100 hover:bg-slate-50 text-[12px] text-slate-700 ${isDelayed ? 'bg-rose-50/30' : ''}`}>
                            <td className="p-3 font-semibold text-slate-500">{t.area}</td>
                            <td className="p-3 font-bold text-slate-600">{t.deliverable}</td>
                            <td className="p-3 font-bold">{t.taskName}</td>
                            <td className="p-3">{t.assigneePlan}</td>
                            <td className="p-3 text-indigo-600">{t.assigneeIT}</td>
                            <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-bold border border-slate-200">{t.status || '대기'}</span></td>
                            <td className="p-3 text-right text-slate-400">{t.plannedProg}%</td>
                            <td className={`p-3 text-right font-bold ${isDelayed ? 'text-rose-600' : 'text-indigo-600'}`}>
                              {t.actualProg}% {isDelayed && <span className="ml-1 text-[10px] text-rose-500">({t.actualProg - t.plannedProg}%)</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isStandalone) return popupContent;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      {popupContent}
    </div>
  );
}