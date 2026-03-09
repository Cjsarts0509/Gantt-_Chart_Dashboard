import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { WBSTask } from "./components/mockData";
import { CustomTaskListHeader, CustomTaskListTable, TOTAL_WIDTH } from "./components/CustomTaskList";
import { GanttGroupContext } from "./components/GanttGroupContext";
import ExcelManager from "./components/ExcelManager";
import DashboardPopup from "./components/DashboardPopup";
import "./components/gantt-overrides.css";
import { BarChart2, ChevronDown, ChevronRight, X, PanelLeftClose, PanelLeftOpen, Upload, Database, LayoutDashboard } from "lucide-react";

interface TreeFilterState {
  selectedArea: string | null;
  selectedPhase: string | null;
  selectedActivity: string | null;
}

const viewModeOptions = [
  { label: "일", value: ViewMode.Day },
  { label: "주", value: ViewMode.Week },
  { label: "월", value: ViewMode.Month },
];

const COLUMN_WIDTH_MAP: Record<string, number> = {
  [ViewMode.Day]: 60,
  [ViewMode.Week]: 150,
  [ViewMode.Month]: 300,
};

export default function App() {
  const [tasks, setTasks] = useState<WBSTask[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const columnWidth = COLUMN_WIDTH_MAP[viewMode] || 300;

  const [treeFilter, setTreeFilter] = useState<TreeFilterState>({
    selectedArea: null, selectedPhase: null, selectedActivity: null,
  });
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);

  const [areaCollapsed, setAreaCollapsed] = useState(false);
  const [phaseCollapsed, setPhaseCollapsed] = useState(false);
  const [activityCollapsed, setActivityCollapsed] = useState(false);
  const [deliverableCollapsed, setDeliverableCollapsed] = useState(false);

  // 대시보드 팝업 열림/닫힘 상태
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

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
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setGanttContainerHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const areas = useMemo(() => [...new Set(tasks.map((t) => t.area))].filter(Boolean), [tasks]);
  const phasesByArea = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const area of areas) {
      map.set(area, [...new Set(tasks.filter((t) => t.area === area).map((t) => t.phase))].filter(Boolean));
    }
    return map;
  }, [tasks, areas]);

  const activitiesByAreaPhase = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const [area, phases] of phasesByArea) {
      for (const phase of phases) {
        map.set(`${area}||${phase}`, [...new Set(tasks.filter((t) => t.area === area && t.phase === phase).map((t) => t.activity))].filter(Boolean));
      }
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
    const statusColors: Record<string, { bg: string, prog: string }> = {
      완료: { bg: "#81C784", prog: "#4CAF50" },
      진행중: { bg: "#64B5F6", prog: "#2196F3" },
      대기: { bg: "#E0E0E0", prog: "#9E9E9E" },
      지연: { bg: "#E57373", prog: "#F44336" },
      이슈발생: { bg: "#EF5350", prog: "#D32F2F" },
      보류: { bg: "#FFB74D", prog: "#FF9800" },
      취소: { bg: "#90A4AE", prog: "#607D8B" },
    };

    return visibleTasks.map((t: any) => {
      let prog = t.status === "완료" ? 100 : (Number(t.progress) || 0);

      if (areaCollapsed) prog = Math.round((t.__areaCompleted / (t.__areaCount || 1)) * 100);
      else if (phaseCollapsed) prog = Math.round((t.__phaseCompleted / (t.__phaseCount || 1)) * 100);
      else if (activityCollapsed) prog = Math.round((t.__actCompleted / (t.__activityCount || 1)) * 100);
      else if (deliverableCollapsed) prog = Math.round((t.__delCompleted / (t.__deliverableCount || 1)) * 100);

      const colors = statusColors[t.status] || statusColors["대기"];

      return {
        ...t,
        name: t.deliverable || t.taskName,
        start: t.start instanceof Date ? t.start : new Date(t.start || Date.now()),
        end: t.end instanceof Date ? t.end : new Date(t.end || Date.now()),
        progress: prog,
        styles: {
          backgroundColor: colors.bg,
          backgroundSelectedColor: colors.prog,
          progressColor: colors.prog,
          progressSelectedColor: colors.prog,
        },
      };
    });
  }, [visibleTasks, areaCollapsed, phaseCollapsed, activityCollapsed, deliverableCollapsed]);

  const resetFilter = () => {
    setTreeFilter({ selectedArea: null, selectedPhase: null, selectedActivity: null });
  };

  const isFiltered = treeFilter.selectedArea || treeFilter.selectedPhase || treeFilter.selectedActivity;

  const filterBreadcrumb = [
    treeFilter.selectedArea,
    treeFilter.selectedPhase,
    treeFilter.selectedActivity,
  ].filter(Boolean).join(" → ");

  const toggleArea = (area: string) => {
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(area)) {
        next.delete(area);
        setExpandedPhases((pp) => {
          const np = new Set(pp);
          for (const key of pp) {
            if (key.startsWith(`${area}||`)) np.delete(key);
          }
          return np;
        });
      } else {
        next.add(area);
      }
      return next;
    });
  };

  const togglePhase = (area: string, phase: string) => {
    const key = `${area}||${phase}`;
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectFilter = (area: string | null, phase: string | null, activity: string | null) => {
    setTreeFilter({ selectedArea: area, selectedPhase: phase, selectedActivity: activity });
  };

  return (
    <GanttGroupContext.Provider value={groupContextValue}>
      <div className="w-screen h-screen bg-[#F8FAFC] flex flex-col overflow-hidden" style={{ fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif" }}>
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[16px] font-bold text-slate-800 leading-tight">프로젝트 일정 관리</h1>
              <p className="text-[12px] font-medium text-slate-400 leading-tight mt-0.5">WBS 통합 대시보드</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            
            <button
              onClick={() => setIsDashboardOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-colors shadow-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              요약 대시보드
            </button>

            <div className="w-px h-6 bg-slate-200" />

            <ExcelManager tasks={tasks} visibleTasks={ganttTasks} onUpload={(newTasks) => setTasks(newTasks)} />
            
            <div className="w-px h-6 bg-slate-200" />
            
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200/60">
              {viewModeOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`px-4 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                    viewMode === opt.value ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
                  onClick={() => setViewMode(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="flex items-center gap-2 px-5 py-2 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] transition-all ${
              filterPanelOpen
                ? "bg-blue-50 text-blue-600 border border-blue-100"
                : "bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100"
            }`}
          >
            {filterPanelOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
            필터
            {isFiltered && <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />}
          </button>
          {isFiltered && (
            <div className="flex items-center gap-1.5 text-[11px] text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              <span>{filterBreadcrumb}</span>
              <button onClick={resetFilter} className="text-blue-400 hover:text-blue-600">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 ml-auto text-[11px] text-gray-400">
            <span>전체 <span className="text-gray-700">{tasks.length}</span></span>
            <span className="text-gray-200">|</span>
            <span>표시 <span className="text-blue-500">{visibleTasks.length}</span></span>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div
            className="shrink-0 bg-white border-r border-slate-200 overflow-hidden transition-all duration-300 ease-in-out"
            style={{ width: filterPanelOpen ? 220 : 0, minWidth: filterPanelOpen ? 220 : 0 }}
          >
            <div className="w-[220px] h-full overflow-y-auto">
              <div className="p-2">
                <div className="text-[10px] text-slate-400 px-2 py-1 uppercase tracking-wider">프로젝트 구조</div>
                <button
                  onClick={resetFilter}
                  className={`w-full text-left px-2 py-1.5 rounded text-[12px] transition flex items-center gap-1.5 ${
                    !isFiltered ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <BarChart2 className="w-3 h-3" /> 전체 보기
                </button>
                {tasks.length === 0 ? (
                  <div className="mt-6 px-2 text-center">
                    <Database className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-[11px] text-slate-400 mb-1">데이터가 없습니다</p>
                  </div>
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
                            <button onClick={() => toggleArea(area)} className="p-0.5 rounded hover:bg-slate-100 text-slate-400">
                              {isAreaExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => {
                                if (isAreaFiltered) selectFilter(null, null, null);
                                else { selectFilter(area, null, null); if (!isAreaExpanded) toggleArea(area); }
                              }}
                              className={`flex-1 text-left px-1.5 py-1 rounded text-[12px] transition flex items-center gap-1 ${
                                isAreaFiltered ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span className="truncate flex-1">{area}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">{areaTaskCount}</span>
                            </button>
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
                                    <button onClick={() => togglePhase(area, phase)} className="p-0.5 rounded hover:bg-slate-100 text-slate-400">
                                      {isPhaseExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (isPhaseFiltered) selectFilter(area, null, null);
                                        else { selectFilter(area, phase, null); if (!isPhaseExpanded) togglePhase(area, phase); }
                                      }}
                                      className={`flex-1 text-left px-1.5 py-1 rounded text-[11px] transition flex items-center gap-1 ${
                                        isPhaseFiltered ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                                      }`}
                                    >
                                      <span className="truncate flex-1">{phase}</span>
                                      <span className="text-[10px] text-slate-400 shrink-0">{phaseTaskCount}</span>
                                    </button>
                                  </div>
                                  <div className="overflow-hidden transition-all duration-200 ease-in-out" style={{ maxHeight: isPhaseExpanded ? 1000 : 0, opacity: isPhaseExpanded ? 1 : 0 }}>
                                    {activities.map((act) => {
                                      const isActFiltered = treeFilter.selectedArea === area && treeFilter.selectedPhase === phase && treeFilter.selectedActivity === act;
                                      const actTaskCount = tasks.filter((t) => t.area === area && t.phase === phase && t.activity === act).length;

                                      return (
                                        <div key={act} className="pl-5">
                                          <button
                                            onClick={() => {
                                              if (isActFiltered) selectFilter(area, phase, null);
                                              else selectFilter(area, phase, act);
                                            }}
                                            className={`w-full text-left px-1.5 py-1 rounded text-[11px] transition flex items-center gap-1 ${
                                              isActFiltered ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-50"
                                            }`}
                                          >
                                            <span className="truncate flex-1">{act}</span>
                                            <span className="text-[10px] text-slate-400 shrink-0">{actTaskCount}</span>
                                          </button>
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

          <div ref={ganttWrapperRef} className="flex-1 overflow-hidden bg-white gantt-sticky-scroll rounded-tl-xl shadow-[inset_1px_1px_0_rgba(0,0,0,0.05)]">
            {ganttTasks.length > 0 ? (
              <Gantt
                tasks={ganttTasks}
                viewMode={viewMode}
                listCellWidth={String(TOTAL_WIDTH)}
                columnWidth={columnWidth}
                rowHeight={46}
                headerHeight={56}
                barCornerRadius={6}
                barFill={65}
                fontSize="12"
                locale="ko-KR"
                TaskListHeader={CustomTaskListHeader}
                TaskListTable={CustomTaskListTable}
                todayColor="rgba(59, 130, 246, 0.08)"
                ganttHeight={ganttContainerHeight > 0 ? ganttContainerHeight - 56 - 20 : 500}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-5">
                <Database className="w-12 h-12 text-slate-300" />
                <p className="text-[15px] font-medium text-slate-500">데이터를 불러오는 중이거나 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {isDashboardOpen && (
          <DashboardPopup tasks={tasks} onClose={() => setIsDashboardOpen(false)} />
        )}
      </div>
    </GanttGroupContext.Provider>
  );
}