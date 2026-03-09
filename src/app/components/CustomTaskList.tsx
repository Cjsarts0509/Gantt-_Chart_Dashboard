import React, { useContext } from "react";
import { Task } from "gantt-task-react";
import { GanttGroupContext } from "./GanttGroupContext";
import { Layers, CheckCircle2, CircleDashed, AlertCircle, XCircle, Clock, PauseCircle, ChevronRight, ChevronDown } from "lucide-react";

const COL_WIDTHS = {
  area: 120, phase: 120, activity: 140, deliverable: 180, taskName: 200,
  assignee: 90, status: 90,
};

export const TOTAL_WIDTH = Object.values(COL_WIDTHS).reduce((a, b) => a + b, 0);

interface TaskListHeaderProps { headerHeight: number; rowWidth: string; fontFamily: string; fontSize: string; }

export const CustomTaskListHeader: React.FC<TaskListHeaderProps> = ({ headerHeight, rowWidth, fontFamily, fontSize }) => {
  const ctx = useContext(GanttGroupContext);
  if (!ctx) return null;

  const headerClass = "flex items-center px-3 font-semibold text-slate-600 border-r border-slate-200/60 last:border-r-0 tracking-tight";
  const btnClass = "ml-1.5 p-0.5 rounded-md hover:bg-slate-200/80 text-slate-400 transition-colors";

  return (
    <div
      className="flex border-b border-slate-200 bg-[#F8FAFC] text-[12px] shadow-sm relative z-10"
      style={{ height: headerHeight, width: rowWidth, fontFamily, fontSize }}
    >
      <div className={headerClass} style={{ width: COL_WIDTHS.area }}>
        영역
        <button onClick={ctx.toggleAreaColumn} className={btnClass}>{ctx.areaCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>
      </div>
      <div className={headerClass} style={{ width: COL_WIDTHS.phase }}>
        단계
        <button onClick={ctx.togglePhaseColumn} className={btnClass}>{ctx.phaseCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>
      </div>
      <div className={headerClass} style={{ width: COL_WIDTHS.activity }}>
        활동
        <button onClick={ctx.toggleActivityColumn} className={btnClass}>{ctx.activityCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>
      </div>
      <div className={headerClass} style={{ width: COL_WIDTHS.deliverable }}>
        산출물
        <button onClick={ctx.toggleDeliverableColumn} className={btnClass}>{ctx.deliverableCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>
      </div>
      <div className={headerClass} style={{ width: COL_WIDTHS.taskName }}>작업명</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.assignee, justifyContent: "center" }}>담당(기획)</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.status, justifyContent: "center" }}>상태</div>
    </div>
  );
};

// --- 상태 뱃지 렌더러 ---
const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { bg: string, text: string, icon: any }> = {
    완료: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: CheckCircle2 },
    진행중: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: Layers },
    대기: { bg: "bg-slate-100 border-slate-200", text: "text-slate-600", icon: CircleDashed },
    지연: { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: Clock },
    이슈발생: { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", icon: AlertCircle },
    보류: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: PauseCircle },
    취소: { bg: "bg-slate-50 border-slate-300", text: "text-slate-500", icon: XCircle },
  };
  const c = config[status] || config["대기"];
  const Icon = c.icon;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${c.bg} ${c.text} text-[11px] font-medium shadow-sm`}>
      <Icon className="w-3 h-3" />
      <span>{status}</span>
    </div>
  );
};

export const CustomTaskListTable: React.FC<{
  rowHeight: number; rowWidth: string; fontFamily: string; fontSize: string;
  tasks: Task[];
}> = ({ rowHeight, rowWidth, fontFamily, fontSize, tasks }) => {
  const ctx = useContext(GanttGroupContext);
  if (!ctx) return null;

  return (
    <div className="bg-white">
      {tasks.map((t: any, i) => {
        const isCollapsedGroup = ctx.areaCollapsed || ctx.phaseCollapsed || ctx.activityCollapsed || ctx.deliverableCollapsed;
        const cellClass = `flex items-center px-3 border-r border-slate-100 last:border-r-0 truncate text-[12px] text-slate-700 ${isCollapsedGroup ? "font-semibold bg-slate-50/50" : ""}`;

        return (
          <div
            key={t.id}
            className="flex border-b border-slate-100 hover:bg-blue-50/40 transition-colors group"
            style={{ height: rowHeight, width: rowWidth, fontFamily, fontSize }}
          >
            <div className={cellClass} style={{ width: COL_WIDTHS.area }}>
              <span className="truncate" title={t.area}>{t.area}</span>
              {ctx.areaCollapsed && <span className="ml-1.5 text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded-md">{t.__areaCount}</span>}
            </div>
            <div className={cellClass} style={{ width: COL_WIDTHS.phase }}>
              <span className="truncate text-slate-600" title={t.phase}>{!ctx.areaCollapsed ? t.phase : ""}</span>
              {ctx.phaseCollapsed && !ctx.areaCollapsed && <span className="ml-1.5 text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded-md">{t.__phaseCount}</span>}
            </div>
            <div className={cellClass} style={{ width: COL_WIDTHS.activity }}>
              <span className="truncate text-slate-600" title={t.activity}>{!ctx.areaCollapsed && !ctx.phaseCollapsed ? t.activity : ""}</span>
              {ctx.activityCollapsed && !ctx.phaseCollapsed && !ctx.areaCollapsed && <span className="ml-1.5 text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded-md">{t.__activityCount}</span>}
            </div>
            <div className={cellClass} style={{ width: COL_WIDTHS.deliverable }}>
              <span className="truncate text-slate-600" title={t.deliverable}>{!ctx.areaCollapsed && !ctx.phaseCollapsed && !ctx.activityCollapsed ? t.deliverable : ""}</span>
              {ctx.deliverableCollapsed && !ctx.activityCollapsed && !ctx.phaseCollapsed && !ctx.areaCollapsed && <span className="ml-1.5 text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded-md">{t.__deliverableCount}</span>}
            </div>
            <div className={`${cellClass} font-medium text-slate-800`} style={{ width: COL_WIDTHS.taskName }}>
              <span className="truncate" title={t.taskName}>{!isCollapsedGroup ? t.taskName : "-"}</span>
            </div>
            <div className={`${cellClass} justify-center`} style={{ width: COL_WIDTHS.assignee }}>
              {!isCollapsedGroup && t.assigneePlan ? (
                <div className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[11px] truncate max-w-full" title={t.assigneePlan}>
                  {t.assigneePlan}
                </div>
              ) : ""}
            </div>
            <div className={`${cellClass} justify-center`} style={{ width: COL_WIDTHS.status }}>
              {!isCollapsedGroup && <StatusBadge status={t.status} />}
            </div>
          </div>
        );
      })}
    </div>
  );
};