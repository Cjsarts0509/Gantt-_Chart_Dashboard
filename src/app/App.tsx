import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { WBSTask } from "./components/mockData";
import { CustomTaskListHeader, CustomTaskListTable, TOTAL_WIDTH } from "./components/CustomTaskList";
import { GanttGroupContext } from "./components/GanttGroupContext";
import ExcelManager from "./components/ExcelManager";
import DashboardPopup from "./components/DashboardPopup";
import ArchitecturePopup from "./components/ArchitecturePopup";
import "./components/gantt-overrides.css";
import { BarChart2, ChevronDown, ChevronRight, X, PanelLeftClose, PanelLeftOpen, Database, LayoutDashboard, ExternalLink, Network } from "lucide-react";

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
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);

  const isStandaloneDashboard = new URLSearchParams(window.location.search).get('view') === 'dashboard';

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data.json`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const parsedTasks = data.map((t: any, index: number) => ({
          ...t, id: t.id || `task-${index}`, type: "task",
          start: new Date(t.start), end: new Date(t.end)
        }));
        setTasks(parsedTasks);
        setExpandedAreas(new Set(parsedTasks.map((t: any) => t.area).filter(Boolean)));
      })
      .catch(err => console.log("데이터 로드 실패:", err));
  }, []);

  const toggleAreaColumn = useCallback(() => setAreaCollapsed(p => !p), []);
  const togglePhaseColumn = useCallback(() => setPhaseCollapsed(p => !p), []);
  const toggleActivityColumn = useCallback(() => setActivityCollapsed(p => !p), []);
  const toggleDeliverableColumn = useCallback(() => setDeliverableCollapsed(p => !p), []);
  const groupContextValue = useMemo(() => ({
    areaCollapsed, phaseCollapsed, activityCollapsed, deliverableCollapsed,
    toggleAreaColumn, togglePhaseColumn, toggleActivityColumn, toggleDeliverableColumn,
  }), [areaCollapsed, phaseCollapsed, activityCollapsed, deliverableCollapsed, toggleAreaColumn, togglePhaseColumn, toggleActivityColumn, toggleDeliverableColumn]);

  const ganttWrapperRef = useRef<HTMLDivElement>(null);
  const [ganttContainerHeight, setGanttContainerHeight] = useState(0);

  useEffect(() => {
    const el = ganttWrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => { for (const entry of entries) setGanttContainerHeight(entry.contentRect.height); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isStandaloneDashboard]);

  if (isStandaloneDashboard) return <DashboardPopup tasks={tasks} isStandalone={true} />;

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
    return tasks.filter((t) => {
      if (treeFilter.selectedArea && t.area !== treeFilter.selectedArea) return false;
      if (treeFilter.selectedPhase && t.phase !== treeFilter.selectedPhase) return false;
      if (treeFilter.selectedActivity && t.activity !== treeFilter.selectedActivity) return false;
      return true;
    });
  }, [tasks, treeFilter]);

  const visibleTasks = useMemo(() => {
    const counts = { area: new Map(), phase: new Map(), act: new Map(), del: new Map() };
    const comp = { area: new Map(), phase: new Map(), act: new Map(), del: new Map() };
    for (const t of filteredTasks) {
      counts.area.set(t.area, (counts.area.get(t.area) || 0) + 1);
      const pk = `${t.area}||${t.phase}`; counts.phase.set(pk, (counts.phase.get(pk) || 0) + 1);
      const ak = `${t.area}||${t.phase}||${t.activity}`; counts.act.set(ak, (counts.act.get(ak) || 0) + 1);
      const dk = `${t.area}||${t.phase}||${t.activity}||${t.deliverable}`; counts.del.set(dk, (counts.del.get(dk) || 0) + 1);
      if (t.status === "완료") {
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
    // 🚀 요청사항 반영: 마우스 오버 시 나오던 진하고 선명한 색상을 기본으로 변경
    const statusColors: Record<string, string> = {
      완료: "#10B981",     // 진한 Emerald
      진행중: "#3B82F6",   // 진한 Blue
      대기: "#94A3B8",     // 진한 Slate
      지연: "#F43F5E",     // 진한 Rose
      이슈발생: "#EF4444", // 진한 Red
      보류: "#F59E0B",     // 진한 Amber
      취소: "#64748B",     // 진한 Slate
    };

    const BASE_START_DATE = new Date("2026-03-01T00:00:00");

    return visibleTasks.map((t: any) => {
      let prog = t.status === "완료" ? 100 : (Number(t.progress) || 0);
      if (areaCollapsed) prog = Math.round((t.__areaCompleted / (t.__areaCount || 1)) * 100);
      else if (phaseCollapsed) prog = Math.round((t.__phaseCompleted / (t.__phaseCount || 1)) * 100);
      else if (activityCollapsed) prog = Math.round((t.__actCompleted / (t.__activityCount || 1)) * 100);
      else if (deliverableCollapsed) prog = Math.round((t.__delCompleted / (t.__deliverableCount || 1)) * 100);
      
      const barColor = statusColors[t.status] || statusColors["대기"];
      
      let originalStart = t.start instanceof Date ? t.start : new Date(t.start || Date.now());
      let originalEnd = t.end instanceof Date ? t.end : new Date(t.end || Date.now());

      let finalStart = new Date(originalStart);
      let finalEnd = new Date(originalEnd);

      if (finalStart < BASE_START_DATE) finalStart = BASE_START_DATE;
      if (finalEnd < BASE_START_DATE) finalEnd = BASE_START_DATE;

      return {
        ...t, 
        name: t.deliverable || t.taskName,
        start: finalStart,
        end: finalEnd,
        originalStart,
        originalEnd,       
        progress: prog,
        // 배경과 진행색을 통일하여 진한 색상을 고정
        styles: { 
          backgroundColor: barColor, 
          backgroundSelectedColor: barColor, 
          progressColor: barColor, 
          progressSelectedColor: barColor 
        },
      };
    });
  }, [visibleTasks, areaCollapsed, phaseCollapsed, activityCollapsed, deliverableCollapsed]);

  const resetFilter = () => { setTreeFilter({ selectedArea: null, selectedPhase: null, selectedActivity: null }); };
  const isFiltered = treeFilter.selectedArea || treeFilter.selectedPhase || treeFilter.selectedActivity;
  const filterBreadcrumb = [ treeFilter.selectedArea, treeFilter.selectedPhase, treeFilter.selectedActivity ].filter(Boolean).join(" → ");
  
  const toggleArea = (area: string) => { setExpandedAreas((prev) => { const next = new Set(prev); if (next.has(area)) { next.delete(area); setExpandedPhases((pp) => { const np = new Set(pp); for (const key of pp) { if (key.startsWith(`${area}||`)) np.delete(key); } return np; }); } else { next.add(area); } return next; }); };
  const togglePhase = (area: string, phase: string) => { const key = `${area}||${phase}`; setExpandedPhases((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; }); };
  const selectFilter = (area: string | null, phase: string | null, activity: string | null) => { setTreeFilter({ selectedArea: area, selectedPhase: phase, selectedActivity: activity }); };

  return (
    <GanttGroupContext.Provider value={groupContextValue}>
      <div className="w-screen h-screen bg-[#F8FAFC] flex flex-col overflow-hidden" style={{ fontFamily: "'Pretendard', sans-serif" }}>
        
        {/* 상단 헤더 */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-300 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md"><BarChart2 className="w-5 h-5 text-white" /></div>
            <div><h1 className="text-[16px] font-bold text-slate-800 leading-tight">프로젝트 일정 관리</h1><p className="text-[12px] font-medium text-slate-400 leading-tight mt-0.5">WBS 통합 대시보드</p></div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsArchitectureOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors shadow-sm">
              <Network className="w-4 h-4" /> 로직 보기
            </button>
            <a href="https://kyobobookcokr.sharepoint.com/sites/PJT2" target="_self" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold bg-[#0078D4]/10 text-[#0078D4] border border-[#0078D4]/20 hover:bg-[#0078D4]/20 transition-colors shadow-sm">
              <ExternalLink className="w-4 h-4" /> 팀 사이트
            </a>
            <button onClick={() => setIsDashboardOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-sm">
              <LayoutDashboard className="w-4 h-4" /> 요약 대시보드
            </button>
            <div className="w-px h-6 bg-slate-300" />
            <ExcelManager tasks={tasks} visibleTasks={ganttTasks} onUpload={(newTasks) => setTasks(newTasks)} />
            <div className="w-px h-6 bg-slate-300" />
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200/60">
              {viewModeOptions.map((opt) => (<button key={opt.value} className={`px-4 py-1.5 rounded-md text-[12px] font-bold transition-all ${viewMode === opt.value ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`} onClick={() => setViewMode(opt.value)}>{opt.label}</button>))}
            </div>
          </div>
        </header>

        <div className="flex items-center gap-2 px-5 py-2 bg-slate-50 border-b border-slate-300 shrink-0">
          <button onClick={() => setFilterPanelOpen(!filterPanelOpen)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${filterPanelOpen ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"}`}>
            {filterPanelOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />} 필터 {isFiltered && <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />}
          </button>
          {isFiltered && (<div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200"><span>{filterBreadcrumb}</span><button onClick={resetFilter} className="text-blue-500 hover:text-blue-700"><X className="w-3 h-3" /></button></div>)}
          <div className="flex items-center gap-3 ml-auto text-[11px] font-bold text-slate-500"><span>전체 <span className="text-slate-800">{tasks.length}</span></span><span className="text-slate-300">|</span><span>표시 <span className="text-blue-600">{visibleTasks.length}</span></span></div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          <div className="shrink-0 bg-white border-r border-slate-300 overflow-hidden transition-all duration-300 ease-in-out" style={{ width: filterPanelOpen ? 220 : 0, minWidth: filterPanelOpen ? 220 : 0 }}>
            <div className="w-[220px] h-full overflow-y-auto">
              <div className="p-2">
                <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">프로젝트 구조</div>
                <button onClick={resetFilter} className={`w-full text-left px-2 py-1.5 rounded text-[12px] font-bold transition flex items-center gap-1.5 ${!isFiltered ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                  <BarChart2 className="w-3 h-3" /> 전체 보기
                </button>
                {tasks.length === 0 ? (
                  <div className="mt-6 px-2 text-center"><Database className="w-8 h-8 text-slate-300 mx-auto mb-3" /><p className="text-[11px] text-slate-500 font-bold mb-1">데이터가 없습니다</p></div>
                ) : (
                  <div className="mt-1 space-y-0.5">
                    {areas.map((area) => {
                      const isAreaExpanded = expandedAreas.has(area);
                      const isAreaFiltered = treeFilter.selectedArea === area;
                      const areaTaskCount = tasks.filter((t) => t.area === area).length;
                      const phases = phasesByArea.get(area) || [];
                      return (
                        <div key={area}>
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => toggleArea(area)} className="p-0.5 rounded hover:bg-slate-200 text-slate-500">{isAreaExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}</button>
                            <button onClick={() => { if (isAreaFiltered) selectFilter(null, null, null); else { selectFilter(area, null, null); if (!isAreaExpanded) toggleArea(area); } }} className={`flex-1 text-left px-1.5 py-1 rounded text-[12px] font-bold transition flex items-center gap-1 ${isAreaFiltered ? "bg-blue-100 text-blue-800" : "text-slate-700 hover:bg-slate-100"}`}><span className="truncate flex-1">{area}</span><span className="text-[10px] text-slate-400 shrink-0">{areaTaskCount}</span></button>
                          </div>
                          <div className="overflow-hidden transition-all duration-200 ease-in-out" style={{ maxHeight: isAreaExpanded ? 2000 : 0, opacity: isAreaExpanded ? 1 : 0 }}>
                            {phases.map((phase) => {
                              const phaseKey = `${area}||${phase}`;
                              const isPhaseExpanded = expandedPhases.has(phaseKey);
                              const isPhaseFiltered = treeFilter.selectedArea === area && treeFilter.selectedPhase === phase;
                              const phaseTaskCount = tasks.filter((t) => t.area === area && t.phase === phase).length;
                              const activities = activitiesByAreaPhase.get(phaseKey) || [];
                              return (
                                <div key={phase} className="pl-4">
                                  <div className="flex items-center gap-0.5">
                                    <button onClick={() => togglePhase(area, phase)} className="p-0.5 rounded hover:bg-slate-200 text-slate-500">{isPhaseExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}</button>
                                    <button onClick={() => { if (isPhaseFiltered) selectFilter(area, null, null); else { selectFilter(area, phase, null); if (!isPhaseExpanded) togglePhase(area, phase); } }} className={`flex-1 text-left px-1.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 ${isPhaseFiltered ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"}`}><span className="truncate flex-1">{phase}</span><span className="text-[10px] text-slate-400 shrink-0">{phaseTaskCount}</span></button>
                                  </div>
                                  <div className="overflow-hidden transition-all duration-200 ease-in-out" style={{ maxHeight: isPhaseExpanded ? 1000 : 0, opacity: isPhaseExpanded ? 1 : 0 }}>
                                    {activities.map((act) => {
                                      const isActFiltered = treeFilter.selectedArea === area && treeFilter.selectedPhase === phase && treeFilter.selectedActivity === act;
                                      const actTaskCount = tasks.filter((t) => t.area === area && t.phase === phase && t.activity === act).length;
                                      return (
                                        <div key={act} className="pl-5">
                                          <button onClick={() => { if (isActFiltered) selectFilter(area, phase, null); else selectFilter(area, phase, act); }} className={`w-full text-left px-1.5 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 ${isActFiltered ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-500 hover:bg-slate-100"}`}><span className="truncate flex-1">{act}</span><span className="text-[10px] text-slate-400 shrink-0">{actTaskCount}</span></button>
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
                )}
              </div>
            </div>
          </div>

          <div ref={ganttWrapperRef} className="flex-1 overflow-x-auto overflow-y-hidden bg-white shadow-[inset_1px_1px_0_rgba(0,0,0,0.1)] gantt-wrapper">
            {ganttTasks.length > 0 ? (
              <Gantt 
                tasks={ganttTasks} 
                viewMode={viewMode} 
                listCellWidth={String(TOTAL_WIDTH)} 
                columnWidth={columnWidth} 
                rowHeight={46} 
                headerHeight={56} 
                barCornerRadius={4} 
                barFill={65} 
                fontSize="12" 
                locale="ko-KR" 
                TaskListHeader={CustomTaskListHeader} 
                TaskListTable={CustomTaskListTable} 
                todayColor="rgba(59, 130, 246, 0.15)" 
                ganttHeight={ganttContainerHeight > 0 ? ganttContainerHeight - 56 - 20 : 500} 
              />
            ) : (<div className="flex flex-col items-center justify-center h-full text-slate-400 gap-5"><Database className="w-12 h-12 text-slate-300" /><p className="text-[15px] font-bold text-slate-500">데이터를 불러오는 중입니다.</p></div>)}
          </div>
        </div>
        
        {isDashboardOpen && <DashboardPopup tasks={tasks} onClose={() => setIsDashboardOpen(false)} />}
        {isArchitectureOpen && <ArchitecturePopup onClose={() => setIsArchitectureOpen(false)} />}
      </div>
    </GanttGroupContext.Provider>
  );
}
