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
import { BarChart2, ChevronDown, ChevronRight, X, PanelLeftClose, PanelLeftOpen, Database, LayoutDashboard, ExternalLink, Network, CalendarClock, CalendarDays, RotateCcw, Settings2 } from "lucide-react";

// 🌟 V2 페이지 임포트
import V2AdminPage from "./v2/page";

const viewModeOptions = [ { label: "일", value: ViewMode.Day }, { label: "주", value: ViewMode.Week }, { label: "월", value: ViewMode.Month } ];
const COLUMN_WIDTH_MAP: Record<string, number> = { [ViewMode.Day]: 60, [ViewMode.Week]: 150, [ViewMode.Month]: 300 };

export default function App() {
  const [showV2, setShowV2] = useState(false);
  const [tasks, setTasks] = useState<WBSTask[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
  const [treeFilter, setTreeFilter] = useState({ selectedArea: null, selectedPhase: null, selectedActivity: null });
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
  
  // 데이터 로딩 로직 (useEffect 안에서 안전하게 실행)
  useEffect(() => {
    const remoteDataUrl = `https://raw.githubusercontent.com/cjsarts0509/gantt-_chart_dashboard/data/public/data.json?t=${new Date().getTime()}`;
    fetch(remoteDataUrl)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const parsed = data.map((t: any, index: number) => ({
          ...t,
          id: t.id ? String(t.id) : `task-${index}`,
          type: "task",
          start: new Date(t.start),
          end: new Date(t.end),
          taskName: t["OData__xd654__xba74__xba85_"] || t["화면명"] || "",
          progress: STATUS_MAP[t.status]?.progress ?? Number(t.progress) ?? 0 
        }));
        setTasks(parsed);
      }).catch(e => console.error(e));
  }, []);

  const toggleAreaColumn = useCallback(() => setAreaCollapsed(p => !p), []);
  const togglePhaseColumn = useCallback(() => setPhaseCollapsed(p => !p), []);
  const toggleColVisibility = useCallback((col: string) => { setHiddenCols(prev => { const n = new Set(prev); n.has(col) ? n.delete(col) : n.add(col); return n; }); }, []);
  const setSortConfig = useCallback((key: string) => { setSortConfigState(prev => prev?.key === key && prev.dir === 'asc' ? { key, dir: 'desc' } : { key, dir: 'asc' }); }, []);

  const groupContextValue = useMemo(() => ({
    areaCollapsed, phaseCollapsed, activityCollapsed, deliverableCollapsed,
    toggleAreaColumn, togglePhaseColumn, toggleActivityColumn: () => setActivityCollapsed(p => !p), toggleDeliverableColumn: () => setDeliverableCollapsed(p => !p),
    hiddenCols, toggleColVisibility, sortConfig, setSortConfig
  }), [areaCollapsed, phaseCollapsed, activityCollapsed, deliverableCollapsed, hiddenCols, sortConfig]);

  const currentListWidth = useMemo(() => Object.entries(COL_WIDTHS).filter(([k]) => !hiddenCols.has(k)).reduce((acc, [_, w]) => acc + w, 0), [hiddenCols]);
  const ganttWrapperRef = useRef<HTMLDivElement>(null);

  // 🌟 안정적인 렌더링을 위해 모든 UI를 하나의 Provider 안에 담습니다.
  return (
    <GanttGroupContext.Provider value={groupContextValue}>
      <div className="w-screen h-screen bg-[#F1F5F9] flex flex-col overflow-hidden">
        
        {/* V2 화면일 때의 레이아웃 */}
        {showV2 ? (
          <div className="flex-1 relative animate-in fade-in duration-300">
            <button 
              onClick={() => setShowV2(false)} 
              className="fixed top-4 right-4 z-[9999] px-4 py-2 bg-slate-800 text-white font-bold rounded-lg shadow-xl hover:bg-slate-700 flex items-center gap-2"
            >
              <X className="w-4 h-4" /> 기존 대시보드로 복귀
            </button>
            <V2AdminPage />
          </div>
        ) : (
          /* 기존 메인 대시보드 레이아웃 */
          <>
            {viewParam === 'history' ? <HistoryDashboard /> : (
              <>
                <header className="flex items-center justify-between px-6 py-4 bg-white border-b shrink-0 shadow-sm z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white"><BarChart2 className="w-5 h-5" /></div>
                    <h1 className="text-[17px] font-extrabold text-slate-800">프로젝트 관리</h1>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setIsMonthlyDashboardOpen(true)} className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-teal-50 text-teal-700">월간 점검</button>
                    <button onClick={() => setIsDashboardOpen(true)} className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-indigo-600 text-white">전체 요약</button>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    {/* V2 스위치 버튼 */}
                    <button onClick={() => setShowV2(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-slate-800 text-white border border-slate-700 hover:bg-black transition-all">
                      <Settings2 className="w-4 h-4" /> V2 관리자
                    </button>
                  </div>
                </header>

                <div className="flex-1 flex overflow-hidden p-3 gap-3">
                  <div ref={ganttWrapperRef} className="flex-1 bg-white rounded-xl shadow-sm border overflow-hidden">
                    {tasks.length > 0 ? (
                      <Gantt 
                        tasks={tasks as any} 
                        viewMode={viewMode} 
                        listCellWidth={String(currentListWidth)} 
                        columnWidth={COLUMN_WIDTH_MAP[viewMode]} 
                        locale="ko-KR" 
                        TaskListHeader={CustomTaskListHeader} 
                        TaskListTable={CustomTaskListTable}
                        rowHeight={38}
                        headerHeight={48}
                      />
                    ) : <div className="flex items-center justify-center h-full">데이터 로딩 중...</div>}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* 팝업 모달들 */}
        {isDashboardOpen && <DashboardPopup tasks={tasks} onClose={() => setIsDashboardOpen(false)} />}
        {isMonthlyDashboardOpen && <MonthlyDashboardPopup tasks={tasks} onClose={() => setIsMonthlyDashboardOpen(false)} />}
        {isArchitectureOpen && <ArchitecturePopup onClose={() => setIsArchitectureOpen(false)} />}
      </div>
    </GanttGroupContext.Provider>
  );
}