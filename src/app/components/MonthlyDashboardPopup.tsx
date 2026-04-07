import React, { useMemo, useState } from "react";
import { X, CalendarDays, AlertTriangle, CheckCircle2, ListTodo } from "lucide-react";
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

const STATUS_COLUMNS = ['시작전', '진행중', '개발완료', '단위테스트중', '최종완료', '수정필요', '개발제외', '보류중'];

export default function MonthlyDashboardPopup({ tasks, onClose, isStandalone = false }: Props) {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  const targetDate = useMemo(() => {
    const now = new Date();
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return endOfCurrentMonth;
  }, []);

  const { overallPlanned, overallActual, overallStatusCounts, areaStats, detailedTasks, totalValidCount, completedCount, incompleteCount } = useMemo(() => {
    
    const validTasks = tasks.reduce((acc, t) => {
      if (t.phase === '설계' || !t.phase) return acc;
      if (!t.area) return acc;

      const cleanArea = String(t.area).trim();
      const hasMeaningfulChar = /[a-zA-Z0-9가-힣]/.test(cleanArea);
      
      if (!hasMeaningfulChar || cleanArea.includes('기타') || cleanArea.includes('undefined') || cleanArea.includes('null')) {
        return acc; 
      }
      acc.push({ ...t, area: cleanArea });
      return acc;
    }, [] as any[]);
    
    let buildTotalActual = 0, buildTotalPlanned = 0, buildCount = 0;
    let testTotalActual = 0, testTotalPlanned = 0, testCount = 0;
    
    // 진척률 산정에 포함되는 진짜 유효 항목만 카운트
    let activeTaskCount = 0; 
    let compCount = 0;
    
    const overallStatusCounts: Record<string, number> = {};
    STATUS_COLUMNS.forEach(k => overallStatusCounts[k] = 0);

    const aStats: Record<string, any> = {};
    const details: any[] = [];

    validTasks.forEach(t => {
      const area = t.area; 
      
      if (!aStats[area]) {
        aStats[area] = { buildActualSum: 0, buildPlannedSum: 0, buildCount: 0, testActualSum: 0, testPlannedSum: 0, testCount: 0, statusCounts: {} };
        STATUS_COLUMNS.forEach(k => aStats[area].statusCounts[k] = 0);
      }
      
      let rawStatus = String(t.status || "").replace(/\s/g, '');
      if (rawStatus === '대기' || !rawStatus) rawStatus = '시작전';
      if (rawStatus === '보류') rawStatus = '보류중';
      if (rawStatus === '진행') rawStatus = '진행중';
      
      const finalStatus = STATUS_COLUMNS.includes(rawStatus) ? rawStatus : '시작전';
      
      // 🌟 상태값 카운트는 무조건 올림
      aStats[area].statusCounts[finalStatus]++;
      overallStatusCounts[finalStatus]++;

      const actualProg = STATUS_MAP[t.status || ""]?.progress ?? Number(t.progress) ?? 0;
      const plannedProg = getPlannedProgress(t.start, t.end, targetDate);
      const isExcluded = finalStatus === '개발제외';

      // 🌟 진척률 산정 로직: '개발제외'가 아닐 때만 분모/분자에 더함
      if (!isExcluded) {
        activeTaskCount++;
        if (actualProg === 100) compCount++;

        if (t.phase === '구축') {
          buildTotalActual += actualProg; buildTotalPlanned += plannedProg; buildCount++;
          aStats[area].buildActualSum += actualProg; aStats[area].buildPlannedSum += plannedProg; aStats[area].buildCount++;
        } else if (t.phase === '테스트') {
          testTotalActual += actualProg; testTotalPlanned += plannedProg; testCount++;
          aStats[area].testActualSum += actualProg; aStats[area].testPlannedSum += plannedProg; aStats[area].testCount++;
        }
      }

      details.push({ ...t, actualProg, plannedProg, isExcluded });
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
      
      return { area, actualProg: act, plannedProg: pln, gap: act - pln, statusCounts: s.statusCounts };
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

    details.sort((a, b) => {
      const isDelayedA = a.actualProg < a.plannedProg && !a.isExcluded ? 1 : 0;
      const isDelayedB = b.actualProg < b.plannedProg && !b.isExcluded ? 1 : 0;
      if (isDelayedA !== isDelayedB) return isDelayedB - isDelayedA; 
      
      const delA = a.deliverable || "";
      const delB = b.deliverable || "";
      if (delA < delB) return -1;
      if (delA > delB) return 1;
      
      return a.actualProg - b.actualProg;
    });

    return { 
      overallPlanned: oPlanned, 
      overallActual: oActual, 
      overallStatusCounts,
      areaStats: processedAStats, 
      detailedTasks: details,
      totalValidCount: activeTaskCount, // 제외된 항목을 뺀 순수 모수
      completedCount: compCount,
      incompleteCount: activeTaskCount - compCount
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
          <CalendarDays className="w-5 h-5 text-indigo-600" />
          <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">월간 진행률 및 계획 대비 점검</h2>
          <span className="ml-2 text-[12px] text-slate-500 font-medium">(*기준: {targetDate.toLocaleDateString()} / 구축 70% + 테스트 30% / 개발제외 항목 산정 스킵)</span>
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
              <p className="text-[13px] font-bold text-slate-500 mb-1">진척률 산정 대상</p>
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
                  <tr className="bg-slate-50 text-[12px] text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3 text-center border-r border-slate-200" rowSpan={2}>구분</th>
                    <th className="p-3 text-center border-r border-slate-200" rowSpan={2}>GAP</th>
                    <th className="p-2 text-center border-r border-slate-200" colSpan={8}>상태</th>
                    <th className="p-3 text-center border-r border-slate-200" rowSpan={2}>계획 진행률</th>
                    <th className="p-3 text-center" rowSpan={2}>실제 진행률</th>
                  </tr>
                  <tr className="bg-slate-50 text-[11px] text-slate-500 font-bold border-b border-slate-200">
                    {STATUS_COLUMNS.map((col, i) => (
                      <th key={col} className={`p-2 text-center ${i < STATUS_COLUMNS.length - 1 ? 'border-r border-slate-200' : 'border-r border-slate-200'}`}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-indigo-50/50 border-b-2 border-slate-200 text-[12px] font-bold text-slate-800">
                    <td className="p-3 text-center text-indigo-700 border-r border-slate-200">전체 통합 평균</td>
                    <td className={`p-3 text-center border-r border-slate-200 ${overallActual < overallPlanned ? 'text-rose-600' : 'text-emerald-600'}`}>{overallActual - overallPlanned}%</td>
                    {STATUS_COLUMNS.map(k => (
                      <td key={k} className={`p-2 text-center text-slate-600 border-r border-slate-200 ${k === '개발제외' ? 'bg-slate-200/50' : 'bg-indigo-100/30'}`}>{overallStatusCounts[k]}</td>
                    ))}
                    <td className="p-3 text-center text-slate-600 border-r border-slate-200">{overallPlanned}%</td>
                    <td className="p-3 text-center text-indigo-600">{overallActual}%</td>
                  </tr>
                  {areaStats.map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 text-[12px] text-slate-700 font-medium">
                      <td className="p-3 text-center border-r border-slate-200">{s.area}</td>
                      <td className={`p-3 text-center font-bold border-r border-slate-200 ${s.gap < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{s.gap}%</td>
                      {STATUS_COLUMNS.map(k => (
                        <td key={k} className={`p-2 text-center border-r border-slate-200 ${s.statusCounts[k] > 0 ? 'font-bold text-slate-700' : 'text-slate-300'} ${k === '개발제외' ? 'bg-slate-50' : ''}`}>
                          {s.statusCounts[k]}
                        </td>
                      ))}
                      <td className="p-3 text-center text-slate-500 border-r border-slate-200">{s.plannedProg}%</td>
                      <td className="p-3 text-center font-bold text-indigo-600">{s.actualProg}%</td>
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
                          <tr key={idx} className={`border-b border-slate-100 hover:bg-slate-50 text-[12px] text-slate-700 ${isDelayed && !t.isExcluded ? 'bg-rose-50/30' : (t.isExcluded ? 'opacity-50' : '')}`}>
                            <td className="p-3 font-semibold text-slate-500">{t.area}</td>
                            <td className={`p-3 font-bold ${t.isExcluded ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{t.deliverable}</td>
                            <td className={`p-3 font-bold ${t.isExcluded ? 'text-slate-400' : ''}`}>{t.taskName}</td>
                            <td className="p-3">{t.assigneePlan}</td>
                            <td className="p-3 text-indigo-600">{t.assigneeIT}</td>
                            <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${t.isExcluded ? 'bg-slate-200 text-slate-500 border-slate-300' : 'bg-slate-100 border-slate-200'}`}>{t.status || '대기'}</span></td>
                            
                            {/* 🌟 개발제외 항목은 진행률 대신 '-' 및 '제외됨' 표시 */}
                            <td className="p-3 text-right text-slate-400">{t.isExcluded ? '-' : `${t.plannedProg}%`}</td>
                            <td className={`p-3 text-right font-bold ${isDelayed && !t.isExcluded ? 'text-rose-600' : (t.isExcluded ? 'text-slate-400' : 'text-indigo-600')}`}>
                              {t.isExcluded ? <span className="font-medium">제외됨</span> : `${t.actualProg}%`}
                              {isDelayed && !t.isExcluded && <span className="ml-1 text-[10px] text-rose-500">({t.actualProg - t.plannedProg}%)</span>}
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
