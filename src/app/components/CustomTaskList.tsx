import React, { useContext, useMemo } from "react";
import { WBSTask } from "./mockData";
import { GanttGroupContext } from "./GanttGroupContext";
// Icon 변경: Lucide 아이콘 일관성 유지
import { ArrowLeftToLine, ArrowRightToLine, ChevronDown, ChevronRight, Activity, Zap, Flag, CalendarCheck, Package, CircleDot } from "lucide-react";

export const GROUP_WIDTHS = { area: 150, phase: 150, activity: 200, deliverable: 200 };
export const TASK_WIDTHS = { status: 90, progress: 65, duration: 60, pm: 90, startDate: 100, endDate: 100 };
export const TOTAL_WIDTH = Object.values(GROUP_WIDTHS).reduce((a, b) => a + b, 0) + Object.values(TASK_WIDTHS).reduce((a, b) => a + b, 0);

// 🎨 DESIGN UPDATE: WBS 상태 태그 스타일 정의 (밝고 선명한 요즘 스타일)
const STATUS_TAG_CLASSES: Record<string, string> = {
  완료: "bg-emerald-50 text-emerald-800 border-emerald-200",
  테스트중: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
  진행중: "bg-blue-50 text-blue-800 border-blue-200",
  대기: "bg-slate-50 text-slate-600 border-slate-200",
  지연: "bg-orange-50 text-orange-900 border-orange-200",
  이슈발생: "bg-rose-50 text-rose-900 border-rose-200",
  보류: "bg-yellow-50 text-yellow-900 border-yellow-200",
  취소: "bg-slate-100 text-slate-500 border-slate-300",
};

export const CustomTaskListHeader: React.FC<any> = ({ headerHeight, listCellWidth }) => {
  const { toggleAreaColumn, togglePhaseColumn, toggleActivityColumn, toggleDeliverableColumn, areaCollapsed, phaseCollapsed, activityCollapsed, deliverableCollapsed } = useContext(GanttGroupContext);

  const col = (key: string, label: string, widths: Record<string, number>, isGroup: boolean = false, toggleHandler?: () => void, isCollapsed?: boolean, isRight: boolean = false) => {
    const width = widths[key];
    const isMainTitle = label === "Area" || label === "Status";
    return (
      <div key={key} className={`flex items-center gap-1.5 px-3 border-slate-300 border-r first:border-l shrink-0 ${isGroup ? "cursor-pointer select-none hover:bg-slate-100" : ""} group h-full transition-colors`} style={{ width: `${width}px` }} onClick={isGroup ? toggleHandler : undefined}>
        {toggleHandler && (
          <div className="w-5 h-5 flex items-center justify-center rounded-md bg-white border border-slate-200 shadow-sm transition group-hover:border-blue-300 group-hover:text-blue-600">
            {isCollapsed ? <ArrowRightToLine className="w-3.5 h-3.5" /> : <ArrowLeftToLine className="w-3.5 h-3.5" />}
          </div>
        )}
        <span className={`flex-1 text-[12px] ${isMainTitle ? "font-bold text-slate-900" : "font-semibold text-slate-600"} tracking-tight ${isRight ? "text-right" : "text-left"}`}>{label}</span>
      </div>
    );
  };

  const GROUP_COLS = [
    { key: "area", label: "Area", h: toggleAreaColumn, c: areaCollapsed },
    { key: "phase", label: "Phase", h: togglePhaseColumn, c: phaseCollapsed },
    { key: "activity", label: "Activity", h: toggleActivityColumn, c: activityCollapsed },
    { key: "deliverable", label: "Deliverable", h: toggleDeliverableColumn, c: deliverableCollapsed },
  ];
  const TASK_COLS = [
    { key: "status", label: "Status" }, { key: "progress", label: "Prog%", r: true }, { key: "duration", label: "일수", r: true },
    { key: "pm", label: "PM" }, { key: "startDate", label: "시작일", r: true }, { key: "endDate", label: "종료일", r: true },
  ];

  return (
    // 🎨 DESIGN UPDATE: 헤더 배경색을 연한 Slate 그레이로 변경하고 테두리를 밝게 처리
    <div className="flex bg-slate-100 border-b border-slate-300 shrink-0 select-none custom-task-list-header shadow-[0_1px_2px_rgba(0,0,0,0.02)]" style={{ height: `${headerHeight}px`, width: `var(--task-list-width)` }}>
      {GROUP_COLS.map(c => col(c.key, c.label, GROUP_WIDTHS, true, c.h, c.c))}
      {TASK_COLS.map(c => col(c.key, c.label, TASK_WIDTHS, false, undefined, undefined, c.r))}
    </div>
  );
};

export const CustomTaskListTable: React.FC<any> = ({ rowHeight, tasks, selectedTaskId }) => {
  const { areaCollapsed, phaseCollapsed, activityCollapsed, deliverableCollapsed } = useContext(GanttGroupContext);

  const groupCells = useMemo(() => {
    const counts = { area: new Map(), phase: new Map(), act: new Map() };
    tasks.forEach((t: WBSTask) => {
      counts.area.set(t.area, (counts.area.get(t.area) || 0) + 1);
      const pk = `${t.area}||${t.phase}`; counts.phase.set(pk, (counts.phase.get(pk) || 0) + 1);
      const ak = `${pk}||${t.activity}`; counts.act.set(ak, (counts.act.get(ak) || 0) + 1);
    });

    const cells: React.ReactNode[] = [];
    const seen = { area: new Set(), phase: new Set(), act: new Set() };
    const baseClass = "px-3 border-r border-slate-200 first:border-l shrink-0 flex items-start pt-2 h-full gap-1.5 transition-colors"; // 🎨 DESIGN UPDATE: pt-2로 여백 증가

    tasks.forEach((t: WBSTask) => {
      const rowPk = `${t.area}||${t.phase}`;
      const rowAk = `${rowPk}||${t.activity}`;
      const isSelected = t.id === selectedTaskId;
      // 🎨 DESIGN UPDATE: 호버 및 선택 시 Indigo 계열 하이라이트 적용
      const rowBase = `flex items-center shrink-0 border-b border-slate-200 w-full transition-colors ${isSelected ? "bg-indigo-50" : "bg-white hover:bg-slate-100"}`;

      const groupBlock = (type: string, val: string, key: string, label: string, widths: Record<string, number>, Icon: any) => {
        const span = counts[type as keyof typeof counts].get(val) || 1;
        if (!seen[type as keyof typeof seen].has(val)) {
          seen[type as keyof typeof seen].add(val);
          // 🎨 DESIGN UPDATE: 폰트 굵기 조정 (semi-bold) 및 컬러 Slate
          return (
            <div key={`${t.id}-${type}`} className={`${baseClass}`} style={{ width: `${widths[key]}px`, height: `${span * rowHeight}px` }}>
              <Icon className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-[12px] font-semibold text-slate-800 leading-tight block truncate" title={label}>{label}</span>
                {span > 1 && <span className="text-[10px] font-bold text-slate-400 mt-0.5 inline-block">{span} tasks</span>}
              </div>
            </div>
          );
        }
        return <div key={`${t.id}-${type}-placeholder`} className="border-r border-slate-200 shrink-0 first:border-l h-full" style={{ width: `${widths[key]}px`, opacity: 0 }} />;
      };

      const c: React.ReactNode[] = [];
      if (areaCollapsed) c.push(groupBlock("area", t.area, "area", t.area, GROUP_WIDTHS, Flag));
      else {
        c.push(groupBlock("area", t.area, "area", t.area, GROUP_WIDTHS, Flag));
        if (phaseCollapsed) c.push(groupBlock("phase", rowPk, "phase", t.phase, GROUP_WIDTHS, Package));
        else {
          c.push(groupBlock("phase", rowPk, "phase", t.phase, GROUP_WIDTHS, Package));
          if (activityCollapsed) c.push(groupBlock("act", rowAk, "activity", t.activity, GROUP_WIDTHS, Zap));
          else {
            c.push(groupBlock("act", rowAk, "activity", t.activity, GROUP_WIDTHS, Zap));
            if (deliverableCollapsed) c.push(<div key={`${t.id}-del`} className={`${baseClass}`} style={{ width: `${GROUP_WIDTHS.deliverable}px` }}><CircleDot className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5"/><span className="text-[11px] font-medium text-slate-600 leading-tight truncate" title={t.deliverable}>{t.deliverable}</span></div>);
            else c.push(<div key={`${t.id}-del-name`} className={`${baseClass}`} style={{ width: `${GROUP_WIDTHS.deliverable}px` }}><CircleDot className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5"/><span className="text-[11px] font-medium text-slate-600 leading-tight truncate" title={t.taskName}>{t.taskName}</span></div>);
          }
        }
      }

      cells.push(<div key={t.id} className={rowBase} style={{ height: `${rowHeight}px` }}>{c}</div>);
    });
    return cells;
  }, [tasks, rowHeight, selectedTaskId, areaCollapsed, phaseCollapsed, activityCollapsed, deliverableCollapsed]);

  const taskCells = useMemo(() => {
    return tasks.map((t: WBSTask) => {
      const isSelected = t.id === selectedTaskId;
      // 🎨 DESIGN UPDATE: 데이터 셀 여백 증가
      const baseClass = "px-3 border-r border-slate-200 shrink-0 flex items-center h-full transition-colors";
      const txt = (widths: Record<string, number>, key: string, val: string, isRight: boolean = false) => (
        <div key={`${t.id}-${key}`} className={`${baseClass}`} style={{ width: `${widths[key]}px` }}>
          <span className={`flex-1 text-[11px] font-medium text-slate-700 truncate ${isRight ? "text-right" : "text-left"}`}>{val}</span>
        </div>
      );

      return (
        // 🎨 DESIGN UPDATE: 호버 및 선택 시 하이라이트 일치 (Indigo)
        <div key={t.id} className={`flex items-center shrink-0 border-b border-slate-200 w-full transition-colors ${isSelected ? "bg-indigo-50" : "bg-white hover:bg-slate-100"}`} style={{ height: `${rowHeight}px` }}>
          {/* 🎨 DESIGN UPDATE: Status 태그 디자인을 Pill 형태로 깔끔하게 변경 */}
          <div className={`${baseClass}`} style={{ width: `${TASK_WIDTHS.status}px` }}>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_TAG_CLASSES[t.status] || STATUS_TAG_CLASSES["대기"]}`}>{t.status}</span>
          </div>
          {txt(TASK_WIDTHS, "progress", `${(tasks.find((gt:any) => gt.id === t.id) as any)?.progress || t.progress}%`, true)}
          {txt(TASK_WIDTHS, "duration", `${t.duration}d`, true)}
          {txt(TASK_WIDTHS, "pm", t.pm)}
          {txt(TASK_WIDTHS, "startDate", t.start.toISOString().split("T")[0], true)}
          {txt(TASK_WIDTHS, "endDate", t.end.toISOString().split("T")[0], true)}
        </div>
      );
    });
  }, [tasks, rowHeight, selectedTaskId]);

  return (
    // 🎨 DESIGN UPDATE: CustomTaskList 전체 배경색을 화이트로 깨끗하게
    <div className="flex-1 bg-white select-none custom-task-list-table overflow-hidden" style={{ width: `var(--task-list-width)` }}>
      <div className="w-full h-full flex custom-scrollbar">
        {groupCells.length > 0 && <div className="shrink-0 h-full">{groupCells}</div>}
        <div className="shrink-0 h-full" style={{ width: `${Object.values(TASK_WIDTHS).reduce((a,b)=>a+b,0)}px` }}>{taskCells}</div>
      </div>
    </div>
  );
};