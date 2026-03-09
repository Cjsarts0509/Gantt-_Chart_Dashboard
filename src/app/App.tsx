import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { WBSTask } from "./components/mockData";
import { CustomTaskListHeader, CustomTaskListTable, TOTAL_WIDTH } from "./components/CustomTaskList";
import { GanttGroupContext } from "./components/GanttGroupContext";
import ExcelManager from "./components/ExcelManager";
import "./components/gantt-overrides.css";
import { BarChart2, ChevronDown, ChevronRight, X, PanelLeftClose, PanelLeftOpen, Upload, Database } from "lucide-react";

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
    // 🎨 세련된 파스텔톤 컬러 팔레트로 변경
    const statusColors: Record<string, { bg: string, prog: string }> = {
      완료: { bg: "#81C784", prog: "#4CAF50" },     // 산뜻한 초록
      진행중: { bg: "#64B5F6", prog: "#2196F3" },   // 밝은 파랑
      대기: { bg: "#E0E0E0", prog: "#9E9E9E" },     // 부드러운 회색
      지연: { bg: "#E57373", prog: "#F44336" },     // 연한 빨강
      이슈발생: { bg: "#EF5350", prog: "#D32F2F" }, // 강렬한 빨강
      보류: { bg: "#FFB74D", prog: "#FF9800" },     // 따뜻한 주황
      취소: { bg: "#90A4AE", prog: "#607D8B" },     // 청회색
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

  return (
    <GanttGroupContext.Provider value={groupContextValue}>
      <div className="w-screen h-screen bg-[#F8FAFC] flex flex-col overflow-hidden" style={{ fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif" }}>
        {/* 헤더 부분 스타일 현대화 */}
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

        <div className="flex flex-1 overflow-hidden">
          {/* 간트 차트 메인 영역 */}
          <div ref={ganttWrapperRef} className="flex-1 overflow-hidden bg-white gantt-sticky-scroll rounded-tl-xl shadow-[inset_1px_1px_0_rgba(0,0,0,0.05)]">
            {ganttTasks.length > 0 ? (
              <Gantt
                tasks={ganttTasks}
                viewMode={viewMode}
                listCellWidth={String(TOTAL_WIDTH)}
                columnWidth={columnWidth}
                // 🚀 시인성 개선 핵심: 행 높이와 헤더 높이 확장, 막대 라운드 처리
                rowHeight={46}       // 기존 34 -> 46 (약 15개 정도만 여유롭게 보이게 됨)
                headerHeight={56}    // 기존 44 -> 56 (헤더를 큼직하게)
                barCornerRadius={6}  // 요즘 스타일로 둥글게
                barFill={65}         // 막대를 너무 두껍지 않고 슬림하게
                fontSize="12"
                locale="ko-KR"
                TaskListHeader={CustomTaskListHeader}
                TaskListTable={CustomTaskListTable}
                todayColor="rgba(59, 130, 246, 0.08)" // 오늘 날짜 강조선 색상 부드럽게
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
      </div>
    </GanttGroupContext.Provider>
  );
}