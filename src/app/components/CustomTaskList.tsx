import React, { useContext } from "react";
import { Task } from "gantt-task-react";
import { GanttGroupContext } from "./GanttGroupContext";
import { ChevronRight, ChevronDown } from "lucide-react";

// 🚀 담당자(기획), 담당자(IT) 칼럼 넓이 110px로 확장 (총 넓이 1165px)
const COL_WIDTHS = {
  area: 65, phase: 85, activity: 160, deliverable: 140, 
  taskName: 200, assigneePlan: 110, assigneeIT: 110, 
  start: 80, end: 80, progress: 60, status: 75,
};
export const TOTAL_WIDTH = Object.values(COL_WIDTHS).reduce((a, b) => a + b, 0);

const formatDate = (date: Date | string | number) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear().toString().slice(2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
};

// 🎨 2025 트렌드: 맑고 투명한 파스텔 톤
const getDynamicColor = (text: string, type: 'area' | 'phase') => {
  if (!text) return { bg: "transparent", text: "#334155" };
  const palettes = type === 'area' ? 
    [{ bg: "#EFF6FF", text: "#3B82F6" }, { bg: "#F5F3FF", text: "#8B5CF6" }, { bg: "#FFF7ED", text: "#F97316" }] :
    [{ bg: "#F0FDF4", text: "#10B981" }, { bg: "#FEFCE8", text: "#EAB308" }, { bg: "#ECFEFF", text: "#06B6D4" }];
  const hash = text.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
};

// 🎨 2025 트렌드: Soft & Vibrant Pill 태그 적용
const STATUS_TAG_CLASSES: Record<string, string> = {
  완료: "bg-emerald-50 text-emerald-600 border-emerald-200/50",
  테스트중: "bg-indigo-50 text-indigo-600 border-indigo-200/50",
  진행중: "bg-blue-50 text-blue-600 border-blue-200/50",
  대기: "bg-slate-50 text-slate-500 border-slate-200/50",
  지연: "bg-orange-50 text-orange-600 border-orange-200/50",
  이슈발생: "bg-rose-50 text-rose-600 border-rose-200/50",
  보류: "bg-amber-50 text-amber-600 border-amber-200/50",
  취소: "bg-slate-100 text-slate-400 border-slate-200/50",
};

export const CustomTaskListHeader: React.FC<any> = ({ headerHeight, rowWidth, fontFamily, fontSize }) => {
  const ctx = useContext(GanttGroupContext);
  if (!ctx) return null;
  
  // 🎨 2025 트렌드: 칙칙한 회색을 뺀 미니멀한 라이트 그레이(slate-50)
  const headerClass = "flex items-center justify-center px-1 text-[12.5px] font-bold text-slate-500 border-r border-slate-200 bg-slate-50 text-center tracking-tight";
  const btnClass = "ml-1 p-0.5 rounded text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all flex-shrink-0";
  
  return (
    <div className="flex border-b border-slate-200 relative z-10" style={{ height: headerHeight, width: rowWidth, fontFamily, fontSize }}>
      <div className={headerClass} style={{ width: COL_WIDTHS.area }}>구분 <button onClick={ctx.toggleAreaColumn} className={btnClass}>{ctx.areaCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button></div>
      <div className={headerClass} style={{ width: COL_WIDTHS.phase }}>단계 <button onClick={ctx.togglePhaseColumn} className={btnClass}>{ctx.phaseCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button></div>
      <div className={headerClass} style={{ width: COL_WIDTHS.activity }}>활동 <button onClick={ctx.toggleActivityColumn} className={btnClass}>{ctx.activityCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button></div>
      <div className={headerClass} style={{ width: COL_WIDTHS.deliverable }}>산출물 <button onClick={ctx.toggleDeliverableColumn} className={btnClass}>{ctx.deliverableCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button></div>
      <div className={headerClass} style={{ width: COL_WIDTHS.taskName }}>작업</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.assigneePlan }}>담당자(기획)</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.assigneeIT }}>담당자(IT)</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.start }}>시작일</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.end }}>종료일</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.progress }}>진행률</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.status }}>상태</div>
    </div>
  );
};

export const CustomTaskListTable: React.FC<any> = ({ rowHeight, rowWidth, fontFamily, fontSize, tasks, selectedTaskId }) => {
  const ctx = useContext(GanttGroupContext);
  if (!ctx) return null;
  
  return (
    <div className="bg-white">
      {tasks.map((t: any) => {
        const areaColor = getDynamicColor(t.area, 'area');
        const phaseColor = getDynamicColor(t.phase, 'phase');
        const isSelected = t.id === selectedTaskId;
        
        // 🎨 2025 트렌드: 폰트 컬러 다크 그레이, 경계선 얇고 연하게
        const cellClass = "flex items-center border-r border-slate-100 last:border-r-0 truncate text-[12px] text-slate-700 h-full justify-center";
        
        return (
          // 🎨 2025 트렌드: 호버 시 연한 인디고 톤 적용
          <div key={t.id} className={`flex border-b border-slate-100 transition-colors ${isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50"}`} style={{ height: rowHeight, width: rowWidth, fontFamily, fontSize }}>
            <div className={cellClass} style={{ width: COL_WIDTHS.area, backgroundColor: areaColor.bg, color: areaColor.text, fontWeight: '700' }}>{t.area}</div>
            <div className={cellClass} style={{ width: COL_WIDTHS.phase, backgroundColor: phaseColor.bg, color: phaseColor.text, fontWeight: '700' }}>{t.phase}</div>
            <div className={`${cellClass} px-3 justify-start`} style={{ width: COL_WIDTHS.activity }}>{t.activity}</div>
            <div className={`${cellClass} px-3 justify-start`} style={{ width: COL_WIDTHS.deliverable }}>{t.deliverable}</div>
            <div className={`${cellClass} px-3 justify-start font-semibold text-slate-800`} style={{ width: COL_WIDTHS.taskName }}>{t.taskName}</div>
            <div className={cellClass} style={{ width: COL_WIDTHS.assigneePlan }}>{t.assigneePlan}</div>
            <div className={cellClass} style={{ width: COL_WIDTHS.assigneeIT }}>{t.assigneeIT}</div>
            <div className={`${cellClass} font-medium text-slate-500`} style={{ width: COL_WIDTHS.start }}>{formatDate(t.originalStart || t.start)}</div>
            <div className={`${cellClass} font-medium text-slate-500`} style={{ width: COL_WIDTHS.end }}>{formatDate(t.originalEnd || t.end)}</div>
            <div className={`${cellClass} font-bold text-indigo-500`} style={{ width: COL_WIDTHS.progress }}>{t.progress}%</div>
            
            <div className={cellClass} style={{ width: COL_WIDTHS.status }}>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_TAG_CLASSES[t.status] || STATUS_TAG_CLASSES["대기"]}`}>
                {t.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};