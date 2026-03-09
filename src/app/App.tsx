import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { WBSTask } from "./components/mockData";
import {
  CustomTaskListHeader,
  CustomTaskListTable,
  TOTAL_WIDTH,
} from "./components/CustomTaskList";
import { GanttGroupContext } from "./components/GanttGroupContext";
import ExcelManager from "./components/ExcelManager";
import "./components/gantt-overrides.css";
import {
  BarChart2,
  ChevronDown,
  ChevronRight,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Upload,
  Database,
} from "lucide-react";

interface TreeFilterState {
  selectedArea: string | null;
  selectedPhase: string | null;
  selectedActivity: string | null;
}

const viewModeOptions: { label: string; value: ViewMode }[] = [
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

  // Tree filter
  const [treeFilter, setTreeFilter] = useState<TreeFilterState>({
    selectedArea: null,
    selectedPhase: null,
    selectedActivity: null,
  });
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);

  // ─── Group collapse state (for right-side table) ───
  const [areaCollapsed, setAreaCollapsed] = useState(false);
  const [phaseCollapsed, setPhaseCollapsed] = useState(false);
  const [activityCollapsed, setActivityCollapsed] = useState(false);
  const [deliverableCollapsed, setDeliverableCollapsed] = useState(false);

  // 🚀 n8n에서 깃허브로 쏜 data.json 자동 불러오기 (Vite base 경로 완벽 대응)
  useEffect(() => {
    // import.meta.env.BASE_URL이 vite.config.ts의 base(/Gantt-_Chart_Dashboard/)를 자동으로 가져옵니다.
    fetch(`${import.meta.env.BASE_URL}data.json`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;

        // 문자열로 된 날짜 데이터를 Date 객체로 변환
        const parsedTasks = data.map((t: any, index: number) => ({
          ...t,
          id: t.id || `task-${index}`,
          type: "task",
          start: new Date(t.start),
          end: new Date(t.end)
        }));

        setTasks(parsedTasks);

        // 초기 화면에서 좌측 트리 메뉴의 '영역' 부분을 모두 열어두기
        const allAreas = new Set<string>(parsedTasks.map((t: any) => t.area).filter(Boolean));
        setExpandedAreas(allAreas);
      })
      .catch(err => console.log("데이터 로드 실패 (아직 깃허브에 파일이 없거나 오류 발생):", err));
  }, []);

  const toggleAreaColumn = useCallback(() => setAreaCollapsed((p) => !p), []);
  const togglePhaseColumn = useCallback(() => setPhaseCollapsed((p) => !p), []);
  const toggleActivityColumn = useCallback(() => setActivityCollapsed((p) => !p), []);
  const toggleDeliverableColumn = useCallback(() => setDeliverableCollapsed((p) => !p), []);

  const groupContextValue = useMemo(
    () => ({
      areaCollapsed,
      phaseCollapsed,
      activityCollapsed,
      deliverableCollapsed,
      toggleAreaColumn,
      togglePhaseColumn,
      toggleActivityColumn,
      toggleDeliverableColumn,
    }),
    [areaCollapsed, phaseCollapsed, activityCollapsed, deliverableCollapsed, toggleAreaColumn, togglePhaseColumn, toggleActivityColumn, toggleDeliverableColumn]
  );

  // Gantt container ref
  const ganttWrapperRef = useRef<HTMLDivElement>(null);
  const [ganttContainerHeight, setGanttContainerHeight] = useState(0);

  // Measure gantt wrapper height for ganttHeight prop (enables vertical scrollbar)
  useEffect(() => {
    const el = ganttWrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setGanttContainerHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Unique values for tree
  const areas = useMemo(() => [...new Set(tasks.map((t) => t.area))].filter(Boolean), [tasks]);

  const phasesByArea = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const area of areas) {
      const phases = [...new Set(tasks.filter((t) => t.area === area).map((t) => t.phase))].filter(Boolean);
      map.set(area, phases);
    }
    return map;
  }, [tasks, areas]);

  const activitiesByAreaPhase = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const [area, phases] of phasesByArea) {
      for (const phase of phases) {
        const acts = [
          ...new Set(
            tasks.filter((t) => t.area === area && t.phase === phase).map((t) => t.activity)
          ),
        ].filter(Boolean);
        map.set(`${area}||${phase}`, acts);
      }
    }
    return map;
  }, [tasks, phasesByArea]);

  // Filtered tasks (left panel filter)
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (treeFilter.selectedArea && t.area !== treeFilter.selectedArea) return false;
      if (treeFilter.selectedPhase && t.phase !== treeFilter.selectedPhase) return false;
      if (treeFilter.selectedActivity && t.activity !== treeFilter.selectedActivity) return false;
      return true;
    });
  }, [tasks, treeFilter]);

  // Apply group collapse: keep first task of each collapsed group, hide rest
  const visibleTasks = useMemo(() => {
    // Pre-compute group counts
    const areaCounts = new Map<string, number>();
    const phaseCounts = new Map<string, number>();
    const actCounts = new Map<string, number>();
    const delCounts = new Map<string, number>();

    // Pre-compute completed counts (status === "완료")
    const areaCompleted = new Map<string, number>();
    const phaseCompleted = new Map<string, number>();
    const actCompleted = new Map<string, number>();
    const delCompleted = new Map<string, number>();

    for (const t of filteredTasks) {
      areaCounts.set(t.area, (areaCounts.get(t.area) || 0) + 1);
      const pk = `${t.area}||${t.phase}`;
      phaseCounts.set(pk, (phaseCounts.get(pk) || 0) + 1);
      const ak = `${t.area}||${t.phase}||${t.activity}`;
      actCounts.set(ak, (actCounts.get(ak) || 0) + 1);
      const dk = `${t.area}||${t.phase}||${t.activity}||${t.deliverable}`;
      delCounts.set(dk, (delCounts.get(dk) || 0) + 1);

      if (t.status === "완료") {
        areaCompleted.set(t.area, (areaCompleted.get(t.area) || 0) + 1);
        phaseCompleted.set(pk, (phaseCompleted.get(pk) || 0) + 1);
        actCompleted.set(ak, (actCompleted.get(ak) || 0) + 1);
        delCompleted.set(dk, (delCompleted.get(dk) || 0) + 1);
      }
    }

    const seenArea = new Set<string>();
    const seenPhase = new Set<string>();
    const seenActivity = new Set<string>();
    const seenDeliverable = new Set<string>();

    const result: any[] = [];

    for (const t of filteredTasks) {
      const areaKey = t.area;
      const phaseKey = `${t.area}||${t.phase}`;
      const actKey = `${t.area}||${t.phase}||${t.activity}`;
      const delKey = `${t.area}||${t.phase}||${t.activity}||${t.deliverable}`;

      const baseMeta = {
        __areaCount: areaCounts.get(areaKey) || 0,
        __phaseCount: phaseCounts.get(phaseKey) || 0,
        __activityCount: actCounts.get(actKey) || 0,
        __deliverableCount: delCounts.get(delKey) || 0,
        __areaCompleted: areaCompleted.get(areaKey) || 0,
        __phaseCompleted: phaseCompleted.get(phaseKey) || 0,
        __actCompleted: actCompleted.get(actKey) || 0,
        __delCompleted: delCompleted.get(delKey) || 0,
      };

      // Area collapsed: keep only first task per area
      if (areaCollapsed) {
        if (seenArea.has(areaKey)) continue;
        seenArea.add(areaKey);
        result.push({ ...t, ...baseMeta });
        continue;
      }

      // Phase collapsed: keep only first task per phase
      if (phaseCollapsed) {
        if (seenPhase.has(phaseKey)) continue;
        seenPhase.add(phaseKey);
        result.push({ ...t, ...baseMeta });
        continue;
      }

      // Activity collapsed: keep only first task per activity
      if (activityCollapsed) {
        if (seenActivity.has(actKey)) continue;
        seenActivity.add(actKey);
        result.push({ ...t, ...baseMeta });
        continue;
      }

      // Deliverable collapsed: keep only first task per deliverable
      if (deliverableCollapsed) {
        if (seenDeliverable.has(delKey)) continue;
        seenDeliverable.add(delKey);
        result.push({ ...t, ...baseMeta });
        continue;
      }

      // Normal row
      result.push({ ...t, ...baseMeta });
    }

    return result;
  }, [filteredTasks, areaCollapsed, phaseCollapsed, activityCollapsed, deliverableCollapsed]);

  const ganttTasks = useMemo(() => {
    return visibleTasks.map((t: any) => {
      // Determine progress: only "완료" counts
      let prog = t.status === "완료" ? 100 : 0;

      // For summary rows (collapsed groups), use group completion ratio
      if (areaCollapsed) {
        const total = t.__areaCount || 1;
        const done = t.__areaCompleted || 0;
        prog = Math.round((done / total) * 100);
      } else if (phaseCollapsed) {
        const total = t.__phaseCount || 1;
        const done = t.__phaseCompleted || 0;
        prog = Math.round((done / total) * 100);
      } else if (activityCollapsed) {
        const total = t.__activityCount || 1;
        const done = t.__actCompleted || 0;
        prog = Math.round((done / total) * 100);
      } else if (deliverableCollapsed) {
        const total = t.__deliverableCount || 1;
        const done = t.__delCompleted || 0;
        prog = Math.round((done / total) * 100);
      }

      return {
        ...t,
        name: t.deliverable || t.taskName,
        start: t.start instanceof Date ? t.start : new Date(t.start || Date.now()),
        end: t.end instanceof Date ? t.end : new Date(t.end || Date.now()),
        progress: prog,
        styles: {
          backgroundColor: "#64b5f6",
          backgroundSelectedColor: "#42a5f5",
          progressColor: "#2196f3",
          progressSelectedColor: "#1976d2",
        },
      };
    });
  }, [visibleTasks, areaCollapsed, phaseCollapsed, activityCollapsed, deliverableCollapsed]);

  const handleUpload = useCallback((newTasks: WBSTask[]) => {
    setTasks(newTasks);
    setTreeFilter({ selectedArea: null, selectedPhase: null, selectedActivity: null });
    setAreaCollapsed(false);
    setPhaseCollapsed(false);
    setActivityCollapsed(false);
    setDeliverableCollapsed(false);
    const allAreas = new Set(newTasks.map((t) => t.area).filter(Boolean));
    setExpandedAreas(allAreas);
    setExpandedPhases(new Set());
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const resetFilter = () => {
    setTreeFilter({ selectedArea: null, selectedPhase: null, selectedActivity: null });
  };

  const isFiltered =
    treeFilter.selectedArea || treeFilter.selectedPhase || treeFilter.selectedActivity;

  const filterBreadcrumb = [
    treeFilter.selectedArea,
    treeFilter.selectedPhase,
    treeFilter.selectedActivity,
  ]
    .filter(Boolean)
    .join(" → ");

  // ─── Tree expand/collapse (left panel) ───
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
      <div className="w-screen h-screen bg-white flex flex-col overflow-hidden" style={{ fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {/* ═══ Top Header ═══ */}
        <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
              <BarChart2 className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-[14px] text-gray-800 leading-tight">
                프로젝트 일정 관리
              </h1>
              <p className="text-[10px] text-gray-400 leading-tight">
                WBS 간트 차트 대시보드
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ExcelManager tasks={tasks} visibleTasks={ganttTasks} onUpload={handleUpload} />

            <div className="w-px h-5 bg-gray-200" />

            <div className="flex items-center gap-0.5 bg-gray-50 rounded-full p-0.5 border border-gray-100">
              {viewModeOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`px-3 py-1.5 rounded-full text-[11px] transition-all ${
                    viewMode === opt.value
                      ? "bg-white text-gray-800 shadow-sm border border-gray-200"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => handleViewModeChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ═══ Filter + Summary Bar ═══ */}
        <div className="flex items-center gap-2 px-5 py-2 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] transition-all ${
              filterPanelOpen
                ? "bg-blue-50 text-blue-600 border border-blue-100"
                : "bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100"
            }`}
            title={filterPanelOpen ? "필터 패널 닫기" : "필터 패널 열기"}
          >
            {filterPanelOpen ? (
              <PanelLeftClose className="w-3.5 h-3.5" />
            ) : (
              <PanelLeftOpen className="w-3.5 h-3.5" />
            )}
            필터
            {isFiltered && (
              <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}
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
            <span>
              전체 <span className="text-gray-700">{tasks.length}</span>
            </span>
            <span className="text-gray-200">|</span>
            <span>
              표시 <span className="text-blue-500">{visibleTasks.length}</span>
            </span>
          </div>
        </div>

        {/* ═══ Main Content ═══ */}
        <div className="flex flex-1 overflow-hidden">
          {/* ─── Tree Filter Panel ─── */}
          <div
            className="shrink-0 bg-white border-r border-slate-200 overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              width: filterPanelOpen ? 220 : 0,
              minWidth: filterPanelOpen ? 220 : 0,
            }}
          >
            <div className="w-[220px] h-full overflow-y-auto">
              <div className="p-2">
                <div className="text-[10px] text-slate-400 px-2 py-1 uppercase tracking-wider">
                  프로젝트 구조
                </div>

                <button
                  onClick={resetFilter}
                  className={`w-full text-left px-2 py-1.5 rounded text-[12px] transition flex items-center gap-1.5 ${
                    !isFiltered
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <BarChart2 className="w-3 h-3" />
                  전체 보기
                </button>

                {tasks.length === 0 ? (
                  <div className="mt-6 px-2 text-center">
                    <Database className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-[11px] text-slate-400 mb-1">데이터가 없습니다</p>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      자동 연동을 기다리거나
                      <br />
                      엑셀을 업로드하세요
                    </p>
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
                            <button
                              onClick={() => toggleArea(area)}
                              className="p-0.5 rounded hover:bg-slate-100 text-slate-400"
                            >
                              {isAreaExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                if (isAreaFiltered) {
                                  selectFilter(null, null, null);
                                } else {
                                  selectFilter(area, null, null);
                                  if (!isAreaExpanded) toggleArea(area);
                                }
                              }}
                              className={`flex-1 text-left px-1.5 py-1 rounded text-[12px] transition flex items-center gap-1 ${
                                isAreaFiltered
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span className="truncate flex-1">{area}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {areaTaskCount}
                              </span>
                            </button>
                          </div>

                          <div
                            className="overflow-hidden transition-all duration-200 ease-in-out"
                            style={{
                              maxHeight: isAreaExpanded ? 2000 : 0,
                              opacity: isAreaExpanded ? 1 : 0,
                            }}
                          >
                            {phases.map((phase) => {
                              const phaseKey = `${area}||${phase}`;
                              const isPhaseExpanded = expandedPhases.has(phaseKey);
                              const isPhaseFiltered =
                                treeFilter.selectedArea === area &&
                                treeFilter.selectedPhase === phase;
                              const phaseTaskCount = tasks.filter(
                                (t) => t.area === area && t.phase === phase
                              ).length;
                              const activities = activitiesByAreaPhase.get(phaseKey) || [];

                              return (
                                <div key={phase} className="pl-4">
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      onClick={() => togglePhase(area, phase)}
                                      className="p-0.5 rounded hover:bg-slate-100 text-slate-400"
                                    >
                                      {isPhaseExpanded ? (
                                        <ChevronDown className="w-2.5 h-2.5" />
                                      ) : (
                                        <ChevronRight className="w-2.5 h-2.5" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (isPhaseFiltered) {
                                          selectFilter(area, null, null);
                                        } else {
                                          selectFilter(area, phase, null);
                                          if (!isPhaseExpanded) togglePhase(area, phase);
                                        }
                                      }}
                                      className={`flex-1 text-left px-1.5 py-1 rounded text-[11px] transition flex items-center gap-1 ${
                                        isPhaseFiltered
                                          ? "bg-blue-50 text-blue-600"
                                          : "text-slate-600 hover:bg-slate-50"
                                      }`}
                                    >
                                      <span className="truncate flex-1">{phase}</span>
                                      <span className="text-[10px] text-slate-400 shrink-0">
                                        {phaseTaskCount}
                                      </span>
                                    </button>
                                  </div>

                                  <div
                                    className="overflow-hidden transition-all duration-200 ease-in-out"
                                    style={{
                                      maxHeight: isPhaseExpanded ? 1000 : 0,
                                      opacity: isPhaseExpanded ? 1 : 0,
                                    }}
                                  >
                                    {activities.map((act) => {
                                      const isActFiltered =
                                        treeFilter.selectedArea === area &&
                                        treeFilter.selectedPhase === phase &&
                                        treeFilter.selectedActivity === act;
                                      const actTaskCount = tasks.filter(
                                        (t) =>
                                          t.area === area &&
                                          t.phase === phase &&
                                          t.activity === act
                                      ).length;

                                      return (
                                        <div key={act} className="pl-5">
                                          <button
                                            onClick={() => {
                                              if (isActFiltered) {
                                                selectFilter(area, phase, null);
                                              } else {
                                                selectFilter(area, phase, act);
                                              }
                                            }}
                                            className={`w-full text-left px-1.5 py-1 rounded text-[11px] transition flex items-center gap-1 ${
                                              isActFiltered
                                                ? "bg-blue-100 text-blue-700"
                                                : "text-slate-500 hover:bg-slate-50"
                                            }`}
                                          >
                                            <span className="truncate flex-1">{act}</span>
                                            <span className="text-[10px] text-slate-400 shrink-0">
                                              {actTaskCount}
                                            </span>
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

          {/* ─── Gantt Chart Area ─── */}
          <div
            ref={ganttWrapperRef}
            className="flex-1 overflow-hidden bg-white gantt-sticky-scroll"
          >
            {ganttTasks.length > 0 ? (
              <Gantt
                tasks={ganttTasks}
                viewMode={viewMode}
                listCellWidth={String(TOTAL_WIDTH)}
                columnWidth={columnWidth}
                rowHeight={34}
                headerHeight={44}
                barCornerRadius={3}
                barFill={70}
                fontSize="11"
                locale="ko-KR"
                TaskListHeader={CustomTaskListHeader}
                TaskListTable={CustomTaskListTable}
                todayColor="rgba(59, 130, 246, 0.06)"
                ganttHeight={ganttContainerHeight > 0 ? ganttContainerHeight - 44 - 20 : 300}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-5">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
                  <Upload className="w-10 h-10 text-blue-300" />
                </div>
                <div className="text-center max-w-[380px]">
                  <p className="text-[16px] text-slate-600 mb-2">데이터를 불러와 주세요</p>
                  <div className="space-y-2 text-[12px] text-slate-400">
                    <div className="flex items-start gap-2 text-left bg-slate-50 rounded-lg px-3 py-2">
                      <Database className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-slate-600">자동 연동</span>
                        <span className="text-slate-300 mx-1">—</span>
                        n8n에서 깃허브로 데이터 전송이 <span className="text-blue-500">완료되면 자동으로 표시</span>됩니다
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </GanttGroupContext.Provider>
  );
}