import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { WBSTask } from "./components/mockData";
import { CustomTaskListHeader, CustomTaskListTable, COL_WIDTHS, STATUS_MAP } from "./components/CustomTaskList";
import { GanttGroupContext } from "./components/GanttGroupContext";
import ExcelManager from "./components/ExcelManager";
import DashboardPopup from "./components/DashboardPopup";
import WeeklyDashboardPopup from "./components/WeeklyDashboardPopup";
import MonthlyDashboardPopup from "./components/MonthlyDashboardPopup";
import ArchitecturePopup from "./components/ArchitecturePopup";
import HistoryDashboard from "./components/HistoryDashboard"; 
import "./components/gantt-overrides.css";
import { BarChart2, ChevronDown, ChevronRight, X, PanelLeftClose, PanelLeftOpen, Database, LayoutDashboard, ExternalLink, Network, CalendarClock, CalendarDays, RotateCcw } from "lucide-react";

interface TreeFilterState { selectedArea: string | null; selectedPhase: string | null; selectedActivity: string | null; }
const viewModeOptions = [ { label: "일", value: ViewMode.Day }, { label: "주", value: ViewMode.Week }, { label: "월", value: ViewMode.Month } ];
const COLUMN_WIDTH_MAP: Record<string, number> = { [ViewMode.Day]: 60, [ViewMode.Week]: 150, [ViewMode.Month]: 300 };

export default function App() {
  const [tasks, setTasks] = useState<WBSTask[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
  const columnWidth = COLUMN_WIDTH_MAP[viewMode] || 300;
  
  const [treeFilter, setTreeFilter] = useState<TreeFilterState>({ selectedArea: null, selectedPhase: null, selectedActivity: null });
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);
  
  const [areaCollapsed, setAreaCollapsed] = useState(false);
  const [phaseCollapsed, setPhaseCollapsed] = useState(false);
  const [activityCollapsed, setActivityCollapsed] = useState(false);
  const [deliverableCollapsed, setDeliverableCollapsed] = useState(false);
  
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isWeeklyDashboardOpen, setIsWeeklyDashboardOpen] = useState(false);
  const [isMonthlyDashboardOpen, setIsMonthlyDashboardOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);

  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfigState] = useState<{ key: string, dir: 'asc'|'desc' } | null>(null);

  const viewParam = new URLSearchParams(window.location.search).get('view');
  const isStandaloneDashboard = viewParam === 'dashboard';
  const isHistoryView = viewParam === 'history';
  const isWeeklyView = viewParam === 'weekly';
  const isMonthlyView = viewParam === 'monthly';

  useEffect(() => {
    const remoteDataUrl = `https://raw.githubusercontent.com/cjsarts0509/gantt-_chart_dashboard/data/public/data.json?t=${new Date().getTime()}`;
    const localDataUrl = `${import.meta.env.BASE_URL}data.json`;

    fetch(remoteDataUrl)
      .then(res => { if (!res.ok) throw new Error('Remote not found'); return res.json(); })
      .catch(err => fetch(localDataUrl).then(res => res.json()))
      .then(data => {
        if (!Array.isArray(data)) return;
        const parsedTasks = data.map((t: any, index: number) => {
          const parsedStart = new Date(t.start);
          const parsedEnd = new Date(t.end);
          // 담당자 이름에서 괄호() 제거용 함수
          const cleanName = (val: any) => val ? String(val).split(',').map(name => name.replace(/\([^)]*\)/g, '').trim()).filter(Boolean).join(', ') : "";
          
          let itVal = t.assigneeIT || t["담당자(IT)"];
          let planVal = t.assigneePlan || t["담당자(기획)"];
          
          if (!itVal) {
             const itKey = Object.keys(t).find(k => k.includes('IT') && (k.includes('담당자') || k.includes('xb2f4')));
             if (itKey) itVal = t[itKey];
          }
          if (!planVal) {
             const planKey = Object.keys(t).find(k => (k.includes('기획') || k.includes('xae')) && (k.includes('담당자') || k.includes('xb2f4')));
             if (planKey) planVal = t[planKey];
          }

          return {
            ...t, 
            id: t.id ? String(t.id) : `task-${index}`, 
            type: "task",
            start: isNaN(parsedStart.getTime()) ? new Date() : parsedStart,
            end: isNaN(parsedEnd.getTime()) ? new Date() : parsedEnd,
            
            // 🌟 taskName(화면명)을 OData 화면명 키값으로 강제 매핑!
            taskName: t["OData__xd654__xba74__xba85_"] || t["화면명"] || "",
            
            assigneePlan: cleanName(planVal),
            assigneeIT: cleanName(itVal),
            progress: STATUS_MAP[t.status]?.progress ?? Number(t.progress) ?? 0 
          };
        });
        setTasks(parsedTasks);
        setExpandedAreas(new Set(parsedTasks.map((t: any) => t.area).filter(Boolean)));
      })
      .catch(err => console.log("로드 실패:", err));
  }, []);

  const toggleAreaColumn = useCallback(() => setAreaCollapsed(p => !p), []);
  const togglePhaseColumn = useCallback(() => setPhaseCollapsed(p => !p), []);
  const toggleActivityColumn = useCallback(() => setActivityCollapsed(p => !p), []);
  const toggleDeliverableColumn = useCallback(() => setDeliverableCollapsed(p => !p), []);
  const toggleColVisibility = useCallback((col: string) => { setHiddenCols(prev => { const n = new Set(prev); n.has(col) ? n.delete(col) : n.add(col); return n; }); }, []);
  const setSortConfig = useCallback((key: string) => { setSortConfigState(prev => prev?.key === key && prev.dir === 'asc' ? { key, dir: 'desc' } : { key, dir: 'asc' }); }, []);

  const groupContextValue = useMemo(() => ({
    areaCollapsed, phaseCollapsed, activityCollapsed, deliverableCollapsed,
    toggleAreaColumn, togglePhaseColumn, toggleActivityColumn, toggleDeliverableColumn,
    hiddenCols, toggleColVisibility, sortConfig, setSortConfig
  }), [areaCollapsed, phaseCollapsed, activityCollapsed, deliverableCollapsed, hiddenCols, sortConfig]);

  const currentListWidth = useMemo(() => Object.entries(COL_WIDTHS).filter(([k]) => !hiddenCols.has(k)).reduce((acc, [_, w]) => acc + w, 0), [hiddenCols]);

  const ganttWrapperRef = useRef<HTMLDivElement>(null);
  const [ganttContainerHeight, setGanttContainerHeight] = useState(0);

  useEffect(() => {
    const el = ganttWrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => { for (const entry of entries) setGanttContainerHeight(entry.contentRect.height); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isStandaloneDashboard, isHistoryView, isWeeklyView, isMonthlyView]);

  if (isHistoryView) return <HistoryDashboard />;
  if (isStandaloneDashboard) return <DashboardPopup tasks={tasks} isStandalone={true} />;
  if (isWeeklyView) return <WeeklyDashboardPopup tasks={tasks} isStandalone={true} />;
  if (isMonthlyView) return <MonthlyDashboardPopup tasks={tasks} isStandalone={true} />;

  const areas = useMemo(() => [...new Set(tasks.map((t) => t.area))].filter(Boolean), [tasks]);
  const phasesByArea = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const area of areas) map.set(area, [...new Set(tasks.filter((t) => t.area === area).map((t) => t.phase))].filter(Boolean));
    return map;
  }, [tasks, areas]);
  const activitiesByAreaPhase = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const [area, phases] of phasesByArea) {
      for (const phase of phases) map.set(`${area}||${phase}`, [...new Set(tasks.filter((t) => t.area === area && t.phase === phase).map((t) => t.activity))].filter(Boolean));
    }
    return map;
  }, [tasks, phasesByArea]);

  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => {
      if (treeFilter.selectedArea && t.area !== treeFilter.selectedArea) return false;
      if (treeFilter.selectedPhase && t.phase !== treeFilter.selectedPhase) return false;
      if (treeFilter.selectedActivity && t.activity !== treeFilter.selectedActivity) return false;
      return true;
    });

    if (sortConfig) {
      result.sort((a: any, b: any) => {
        if (a.area !== b.area) return (a.area || "").localeCompare(b.area || "");
        if (a.phase !== b.phase) return (a.phase || "").localeCompare(b.phase || "");
        if (a.activity !== b.activity) return (a.activity || "").localeCompare(b.activity || "");
        
        let valA = a[sortConfig.key] || "";
        let valB = b[sortConfig.key] || "";
        if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [tasks, treeFilter, sortConfig]);

  const visibleTasks = useMemo(() => {
    const counts = { area: new Map(), phase: new Map(), act: new Map(), del: new Map() };
    const comp = { area: new Map(), phase: new Map(), act: new Map(), del: new Map() };
    for (const t of filteredTasks) {
      counts.area.set(t.area, (counts.area.get(t.area) || 0) + 1);
      const pk = `${t.area}||${t.phase}`; counts.phase.set(pk, (counts.phase.get(pk) || 0) + 1);
      const ak = `${t.area}||${t.phase}||${t.activity}`; counts.act.set(ak, (counts.act.get(ak) || 0) + 1);
      const dk = `${t.area}||${t.phase}||${t.activity}||${t.deliverable}`; counts.del.set(dk, (counts.del.get(dk) || 0) + 1);
      if (t.status === "최종완료" || t.status === "개발제외") {
        comp.area.set(t.area, (comp.area.get(t.area) || 0) + 1);
        comp.phase.set(pk, (comp.phase.get(pk) || 0) + 1);
        comp.act.set(ak, (comp.act.get(ak) || 0) + 1);
        comp.del.set(dk, (comp.del.get(dk) || 0) + 1);
      }
    }
    const seen = { area: new Set(), phase: new Set(), act: new Set(), del: new Set() };
    const result: any[] = [];
    for (const t of filteredTasks) {
      const pk = `${t.area}||${t.phase}`;
      const ak = `${t.area}||${t.phase}||${t.activity}`;
      const dk = `${t.area}||${t.phase}||${t.activity}||${t.deliverable}`;
      const baseMeta = {
        __areaCount: counts.area.get(t.area), __phaseCount: counts.phase.get(pk),
        __activityCount: counts.act.get(ak), __deliverableCount: counts.del.get(dk),
        __areaCompleted: comp.area.get(t.area) || 0, __phaseCompleted: comp.phase.get(pk) || 0,
        __actCompleted: comp.act.get(ak) || 0, __delCompleted: comp.del.get(dk) || 0,
      };
      if (areaCollapsed) { if (!seen.area.has(t.area)) { seen.area.add(t.area); result.push({ ...t, ...baseMeta }); } continue; }
      if (phaseCollapsed) { if (!seen.phase.has(pk)) { seen.phase.add(pk); result.push({ ...t, ...baseMeta }); } continue; }
      if (activityCollapsed) { if (!seen.act.has(ak)) { seen.act.add(ak); result.push({ ...t, ...baseMeta }); } continue; }
      if (deliverableCollapsed) { if (!seen.del.has(dk)) { seen.del.add(dk); result.push({ ...t, ...baseMeta }); } continue; }
      result.push({ ...t, ...baseMeta });
    }
    return result;
  }, [filteredTasks, areaCollapsed, phaseCollapsed, activityCollapsed, deliverableCollapsed]);

  const ganttTasks = useMemo(() => {
    const barBgColor = "#38BDF8";
    const barProgColor = "#0284C7";
    const BASE_START_DATE = new Date("2026-03-01T00:00:00");

    return visibleTasks.map((t: any) => {
      let prog = STATUS_MAP[t.status]?.progress ?? Number(t.progress) ?? 0;

      if (areaCollapsed) prog = Math.round((t.__areaCompleted / (t.__areaCount || 1)) * 100);
      else if (phaseCollapsed) prog = Math.round((t.__phaseCompleted / (t.__phaseCount || 1)) * 100);
      else if (activityCollapsed) prog = Math.round((t.__actCompleted / (t.__activityCount || 1)) * 100);
      else if (deliverableCollapsed) prog = Math.round((t.__delCompleted / (t.__deliverableCount || 1)) * 100);
      
      let finalStart = new Date(t.start instanceof Date ? t.start : new Date(t.start || Date.now()));
      let finalEnd = new Date(t.end instanceof Date ? t.end : new Date(t.end || Date.now()));
      if (finalStart < BASE_START_DATE) finalStart = BASE_START_DATE;
      if (finalEnd < BASE_START_DATE) finalEnd = BASE_START_DATE;

      return {
        ...t, 
        name: (t.deliverable && t.taskName) ? `${t.deliverable}[${t.taskName}]` : (t.deliverable || t.taskName),
        start: finalStart, end: finalEnd, originalStart: t.start, originalEnd: t.end,       
        progress: prog, dependencies: [], 
        styles: { backgroundColor: barBgColor, backgroundSelectedColor: barBgColor, progressColor: barProgColor, progressSelectedColor: barProgColor },
      };
    });
  }, [visibleTasks, areaCollapsed, phaseCollapsed, activityCollapsed, deliverableCollapsed]);

  const resetFilter = () => { setTreeFilter({ selectedArea: null, selectedPhase: null, selectedActivity: null }); };
  const toggleArea = (area: string) => { setExpandedAreas((prev) => { const next = new Set(prev); if (next.has(area)) { next.delete(area); setExpandedPhases((pp) => { const np = new Set(pp); for (const key of pp) { if (key.startsWith(`${area}||`)) np.delete(key); } return np; }); } else { next.add(area); } return next; }); };
  const togglePhase = (area: string, phase: string) => { const key = `${area}||${phase}`; setExpandedPhases((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; }); };
  const selectFilter = (area: string | null, phase: string | null, activity: string | null) => { setTreeFilter({ selectedArea: area, selectedPhase: phase, selectedActivity: activity }); };

  return (
    <GanttGroupContext.Provider value={groupContextValue}>
      <div className="w-screen h-screen bg-[#F1F5F9] flex flex-col overflow-hidden" style={{ fontFamily: "'Pretendard', sans-serif" }}>
        
        <header className="flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-md border-b border-slate-200 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-indigo-200 shadow-md"><BarChart2 className="w-5 h-5 text-white" /></div>
            <div><h1 className="text-[17px] font-extrabold text-slate-800 leading-tight">프로젝트 일정 관리</h1></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsArchitectureOpen(true)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-bold bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm">
              <Network className="w-4 h-4" /> 로직 보기
            </button>
            <a href="https://kyobobookcokr.sharepoint.com/sites/PJT2" target="_self" className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-bold bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-all shadow-sm">
              <ExternalLink className="w-4 h-4" /> 팀 사이트
            </a>
            
            {hiddenCols.size > 0 && (
              <button onClick={() => setHiddenCols(new Set())} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all">
                <RotateCcw className="w-3.5 h-3.5" /> 숨김 취소
              </button>
            )}

            <div className="w-px h-6 bg-slate-200 mx-1" />

            <button onClick={() => setIsWeeklyDashboardOpen(true)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all shadow-sm">
              <CalendarClock className="w-4 h-4" /> 주간 점검
            </button>
            <button onClick={() => setIsMonthlyDashboardOpen(true)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-bold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-all shadow-sm">
              <CalendarDays className="w-4 h-4" /> 월간 점검
            </button>
            <button onClick={() => setIsDashboardOpen(true)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-bold bg-indigo-600 text-white border border-indigo-500 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200">
              <LayoutDashboard className="w-4 h-4" /> 전체 요약
            </button>

            <div className="w-px h-6 bg-slate-200 mx-1" />
            
            <ExcelManager tasks={tasks} visibleTasks={ganttTasks} onUpload={(newTasks) => setTasks(newTasks)} />
            
            <div className="w-px h-6 bg-slate-200 mx-1" />
            
            <div className="flex items-center gap-1 bg-slate-100/80 rounded-lg p-1 border border-slate-200/50">
              {viewModeOptions.map((opt) => (<button key={opt.value} className={`px-4 py-1.5 rounded-md text-[12px] font-bold transition-all ${viewMode === opt.value ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`} onClick={() => setViewMode(opt.value)}>{opt.label}</button>))}
            </div>
          </div>
        </header>

        <div className="flex items-center gap-2 px-5 py-2.5 bg-white border-b border-slate-200 shrink-0">
          <button onClick={() => setFilterPanelOpen(!filterPanelOpen)} className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm ${filterPanelOpen ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-white text-slate-600 border border-slate-200"}`}>
            {filterPanelOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />} 필터 {treeFilter.selectedArea && <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />}
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden min-w-0 p-3 gap-3">
          <div className="shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-300 shadow-sm" style={{ width: filterPanelOpen ? 230 : 0 }}>
             <div className="w-[230px] h-full overflow-y-auto p-3">
                <button onClick={resetFilter} className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-bold hover:bg-slate-50 flex items-center gap-2 mb-2"><BarChart2 className="w-3.5 h-3.5" /> 전체 보기</button>
                {areas.map(area => {
                  const isAreaExpanded = expandedAreas.has(area);
                  const isAreaFiltered = treeFilter.selectedArea === area;
                  const phases = phasesByArea.get(area) || [];
                  return (
                    <div key={area} className="mb-1">
                      <div className="flex items-center gap-1 group">
                         <button onClick={() => toggleArea(area)} className="p-1 rounded-md text-slate-400 hover:bg-slate-100">{isAreaExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</button>
                         <button onClick={() => selectFilter(area, null, null)} className={`flex-1 text-left px-2 py-1.5 rounded-lg text-[12px] font-bold transition-all ${isAreaFiltered ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`}>{area}</button>
                      </div>
                      <div className="overflow-hidden transition-all duration-200 ease-in-out" style={{ maxHeight: isAreaExpanded ? 2000 : 0, opacity: isAreaExpanded ? 1 : 0 }}>
                        {phases.map(phase => {
                          const phaseKey = `${area}||${phase}`;
                          const isPhaseExpanded = expandedPhases.has(phaseKey);
                          const isPhaseFiltered = isAreaFiltered && treeFilter.selectedPhase === phase;
                          const activities = activitiesByAreaPhase.get(phaseKey) || [];
                          return (
                            <div key={phase} className="pl-5 mt-0.5">
                              <div className="flex items-center gap-1 group">
                                <button onClick={() => togglePhase(area, phase)} className="p-1 rounded-md text-slate-400 hover:bg-slate-100">{isPhaseExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}</button>
                                <button onClick={() => selectFilter(area, phase, null)} className={`flex-1 text-left px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all ${isPhaseFiltered ? "bg-indigo-50/70 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}>{phase}</button>
                              </div>
                              <div className="overflow-hidden transition-all duration-200 ease-in-out" style={{ maxHeight: isPhaseExpanded ? 1000 : 0, opacity: isPhaseExpanded ? 1 : 0 }}>
                                {activities.map(act => {
                                  const isActFiltered = isPhaseFiltered && treeFilter.selectedActivity === act;
                                  return (
                                    <div key={act} className="pl-6 mt-0.5">
                                      <button onClick={() => selectFilter(area, phase, act)} className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${isActFiltered ? "bg-blue-50/70 text-blue-600 font-bold" : "text-slate-500 hover:bg-slate-50"}`}>{act}</button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>

          <div ref={ganttWrapperRef} className="flex-1 relative bg-white overflow-hidden shadow-sm border border-slate-200 rounded-xl gantt-wrapper" style={{ '--task-list-width': `${currentListWidth}px` } as React.CSSProperties}>
            {ganttTasks.length > 0 ? (
              <Gantt 
                tasks={ganttTasks} 
                viewMode={viewMode} 
                listCellWidth={String(currentListWidth)} 
                columnWidth={columnWidth} 
                rowHeight={38}
                headerHeight={48} 
                barCornerRadius={6}
                barFill={70} 
                fontSize="12" 
                locale="ko-KR" 
                TaskListHeader={CustomTaskListHeader} 
                TaskListTable={CustomTaskListTable} 
                todayColor="rgba(99, 102, 241, 0.04)" 
                ganttHeight={ganttContainerHeight > 0 ? ganttContainerHeight - 48 - 26 : 500} 
              />
            ) : (<div className="flex flex-col items-center justify-center h-full text-slate-400 gap-5"><Database className="w-12 h-12 text-slate-200" /><p className="text-[15px] font-bold text-slate-400">데이터를 불러오는 중입니다.</p></div>)}
          </div>
        </div>
        
        {isDashboardOpen && <DashboardPopup tasks={tasks} onClose={() => setIsDashboardOpen(false)} />}
        {isWeeklyDashboardOpen && <WeeklyDashboardPopup tasks={tasks} onClose={() => setIsWeeklyDashboardOpen(false)} />}
        {isMonthlyDashboardOpen && <MonthlyDashboardPopup tasks={tasks} onClose={() => setIsMonthlyDashboardOpen(false)} />}
        {isArchitectureOpen && <ArchitecturePopup onClose={() => setIsArchitectureOpen(false)} />}
      </div>
    </GanttGroupContext.Provider>
  );
}