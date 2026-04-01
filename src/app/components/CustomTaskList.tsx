import React, { useContext } from "react";
import { GanttGroupContext } from "./GanttGroupContext";
import { ChevronRight, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, EyeOff } from "lucide-react";

export const COL_WIDTHS = {
  area: 65, phase: 85, activity: 160, deliverable: 140, 
  taskName: 200, assigneePlan: 110, assigneeIT: 110, 
  start: 80, end: 80, progress: 60, status: 75,
};

// 🌟 상태별 진행률 및 디자인 매핑 (요청사항 반영)
export const STATUS_MAP: Record<string, { progress: number; color: string }> = {
  시작전: { progress: 0, color: "bg-slate-50 text-slate-500 border-slate-200" },
  진행중: { progress: 0, color: "bg-blue-50 text-blue-600 border-blue-200" },
  개발완료: { progress: 30, color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  단위테스트중: { progress: 50, color: "bg-purple-50 text-purple-600 border-purple-200" },
  최종완료: { progress: 100, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  수정필요: { progress: 50, color: "bg-orange-50 text-orange-600 border-orange-200" },
  개발제외: { progress: 100, color: "bg-rose-50 text-rose-600 border-rose-200" },
  보류중: { progress: 0, color: "bg-amber-50 text-amber-600 border-amber-200" },
};

const formatDate = (date: Date | string | number) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const getDynamicColor = (text: string, type: 'area' | 'phase') => {
  if (!text) return { bg: "transparent", text: "#334155" };
  const palettes = type === 'area' ? 
    [{ bg: "#EFF6FF", text: "#3B82F6" }, { bg: "#F5F3FF", text: "#8B5CF6" }, { bg: "#FFF7ED", text: "#F97316" }] :
    [{ bg: "#F0FDF4", text: "#10B981" }, { bg: "#FEFCE8", text: "#EAB308" }, { bg: "#ECFEFF", text: "#06B6D4" }];
  const hash = text.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
};

export const CustomTaskListHeader: React.FC<any> = ({ headerHeight, rowWidth, fontFamily, fontSize }) => {
  const ctx = useContext(GanttGroupContext);
  if (!ctx) return null;

  const renderHeader = (key: keyof typeof COL_WIDTHS, label: string, isGroupCol = false, groupToggle?: () => void, isCollapsed?: boolean) => {
    if (ctx.hiddenCols?.has(key)) return null;
    const isSorted = ctx.sortConfig?.key === key;

    return (
      <div className="flex items-center justify-between px-2 text-[12.5px] font-bold text-slate-500 border-r border-slate-200 bg-slate-50 group tracking-tight" style={{ width: COL_WIDTHS[key] }}>
        <div className="flex items-center gap-1 overflow-hidden">
          <span className="truncate">{label}</span>
          {isGroupCol && (
            <button onClick={groupToggle} className="p-0.5 rounded text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all flex-shrink-0">
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
        
        {/* 정렬 & 숨김 버튼 (Hover 시 노출) */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => ctx.setSortConfig(key)} className={`p-0.5 rounded ${isSorted ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-white'}`}>
            {isSorted ? (ctx.sortConfig?.dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
          </button>
          <button onClick={() => ctx.toggleColVisibility(key)} className="p-0.5 rounded text-slate-400 hover:text-rose-500 hover:bg-white" title="열 숨기기">
            <EyeOff className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex border-b border-slate-200 relative z-10" style={{ height: headerHeight, width: rowWidth, fontFamily, fontSize }}>
      {renderHeader('area', '구분', true, ctx.toggleAreaColumn, ctx.areaCollapsed)}
      {renderHeader('phase', '단계', true, ctx.togglePhaseColumn, ctx.phaseCollapsed)}
      {renderHeader('activity', '활동', true, ctx.toggleActivityColumn, ctx.activityCollapsed)}
      {renderHeader('deliverable', '산출물', true, ctx.toggleDeliverableColumn, ctx.deliverableCollapsed)}
      {renderHeader('taskName', '작업')}
      {renderHeader('assigneePlan', '담당자(기획)')}
      {renderHeader('assigneeIT', '담당자(IT)')}
      {renderHeader('start', '시작일')}
      {renderHeader('end', '종료일')}
      {renderHeader('progress', '진행률')}
      {renderHeader('status', '상태')}
    </div>
  );
};

export const CustomTaskListTable: React.FC<any> = ({ rowHeight, rowWidth, fontFamily, fontSize, tasks, selectedTaskId }) => {
  const ctx = useContext(GanttGroupContext);
  if (!ctx) return null;
  
  const cellClass = "flex items-center border-r border-slate-100 last:border-r-0 truncate text-[12px] text-slate-700 h-full justify-center";

  return (
    <div className="bg-white">
      {tasks.map((t: any) => {
        const isSelected = t.id === selectedTaskId;
        const areaColor = getDynamicColor(t.area, 'area');
        const phaseColor = getDynamicColor(t.phase, 'phase');
        const statusMeta = STATUS_MAP[t.status] || { progress: 0, color: "bg-slate-50 text-slate-500" };
        
        return (
          <div key={t.id} className={`flex border-b border-slate-100 transition-colors ${isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50"}`} style={{ height: rowHeight, width: rowWidth, fontFamily, fontSize }}>
            {!ctx.hiddenCols.has('area') && <div className={cellClass} style={{ width: COL_WIDTHS.area, backgroundColor: areaColor.bg, color: areaColor.text, fontWeight: '700' }}>{t.area}</div>}
            {!ctx.hiddenCols.has('phase') && <div className={cellClass} style={{ width: COL_WIDTHS.phase, backgroundColor: phaseColor.bg, color: phaseColor.text, fontWeight: '700' }}>{t.phase}</div>}
            {!ctx.hiddenCols.has('activity') && <div className={`${cellClass} px-3 justify-start`} style={{ width: COL_WIDTHS.activity }}>{t.activity}</div>}
            {!ctx.hiddenCols.has('deliverable') && <div className={`${cellClass} px-3 justify-start`} style={{ width: COL_WIDTHS.deliverable }}>{t.deliverable}</div>}
            {!ctx.hiddenCols.has('taskName') && <div className={`${cellClass} px-3 justify-start font-semibold text-slate-800`} style={{ width: COL_WIDTHS.taskName }}>{t.taskName}</div>}
            {!ctx.hiddenCols.has('assigneePlan') && <div className={`${cellClass} px-3 justify-start text-[11.5px] text-slate-600`} style={{ width: COL_WIDTHS.assigneePlan }}>{t.assigneePlan}</div>}
            {!ctx.hiddenCols.has('assigneeIT') && <div className={`${cellClass} px-3 justify-start text-[11.5px] text-slate-600`} style={{ width: COL_WIDTHS.assigneeIT }}>{t.assigneeIT}</div>}
            {!ctx.hiddenCols.has('start') && <div className={`${cellClass} font-medium text-slate-500`} style={{ width: COL_WIDTHS.start }}>{formatDate(t.originalStart || t.start)}</div>}
            {!ctx.hiddenCols.has('end') && <div className={`${cellClass} font-medium text-slate-500`} style={{ width: COL_WIDTHS.end }}>{formatDate(t.originalEnd || t.end)}</div>}
            
            {/* 진행률은 상태값에 따라 자동 매핑된 값 표출 */}
            {!ctx.hiddenCols.has('progress') && <div className={`${cellClass} font-bold text-indigo-500`} style={{ width: COL_WIDTHS.progress }}>{t.progress}%</div>}
            
            {!ctx.hiddenCols.has('status') && (
              <div className={cellClass} style={{ width: COL_WIDTHS.status }}>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.color}`}>
                  {t.status || '대기'}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};