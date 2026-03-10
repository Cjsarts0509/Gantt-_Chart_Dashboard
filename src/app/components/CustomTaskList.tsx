import React, { useContext } from "react";
import { Task } from "gantt-task-react";
import { GanttGroupContext } from "./GanttGroupContext";
import { ChevronRight, ChevronDown } from "lucide-react";

// 🚀 칼럼 넓이 완벽 유지 (활동 160, 담당자 105, 진행률 60 포함 총 1155px)
const COL_WIDTHS = {
  area: 65, 
  phase: 85, 
  activity: 160, 
  deliverable: 140, 
  taskName: 200,      
  assigneePlan: 105,  
  assigneeIT: 105,    
  start: 80, 
  end: 80, 
  progress: 60,
  status: 75,
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

// 🚀 기존에 시인성 좋았던 파스텔 동적 컬러 원상 복구
const getDynamicColor = (text: string, type: 'area' | 'phase') => {
  if (!text) return { bg: "transparent", text: "#333" };
  const palettes = type === 'area' ? 
    [{ bg: "#E3F2FD", text: "#1565C0" }, { bg: "#F3E5F5", text: "#6A1B9A" }, { bg: "#FFF3E0", text: "#E65100" }] :
    [{ bg: "#E8F5E9", text: "#2E7D32" }, { bg: "#FFF8E1", text: "#F57F17" }, { bg: "#E0F7FA", text: "#006064" }];
  const hash = text.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
};

// 🚀 상태값 세련된 태그 디자인 유지
const STATUS_TAG_CLASSES: Record<string, string> = {
  완료: "bg-emerald-100 text-emerald-800 border-emerald-200",
  테스트중: "bg-indigo-100 text-indigo-800 border-indigo-200",
  진행중: "bg-blue-100 text-blue-800 border-blue-200",
  대기: "bg-slate-100 text-slate-600 border-slate-200",
  지연: "bg-orange-100 text-orange-800 border-orange-200",
  이슈발생: "bg-rose-100 text-rose-800 border-rose-200",
  보류: "bg-yellow-100 text-yellow-800 border-yellow-200",
  취소: "bg-slate-200 text-slate-500 border-slate-300",
};

export const CustomTaskListHeader: React.FC<any> = ({ headerHeight, rowWidth, fontFamily, fontSize }) => {
  const ctx = useContext(GanttGroupContext);
  if (!ctx) return null;
  // 🚀 기존의 단단하고 깔끔했던 bg-[#CFD8DC] 헤더 원복
  const headerClass = "flex items-center justify-center px-1 font-bold text-slate-800 border-r border-slate-300 bg-[#CFD8DC] text-center";
  const btnClass = "ml-1 p-0.5 rounded text-slate-500 hover:bg-slate-500 hover:text-white transition-colors flex-shrink-0";
  
  return (
    <div className="flex border-y border-slate-400 text-[12px] relative z-10" style={{ height: headerHeight, width: rowWidth, fontFamily, fontSize }}>
      <div className={headerClass} style={{ width: COL_WIDTHS.area }}>구분 <button onClick={ctx.toggleAreaColumn} className={btnClass}>{ctx.areaCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button></div>
      <div className={headerClass} style={{ width: COL_WIDTHS.phase }}>단계 <button onClick={ctx.togglePhaseColumn} className={btnClass}>{ctx.phaseCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button></div>
      <div className={headerClass} style={{ width: COL_WIDTHS.activity }}>활동 <button onClick={ctx.toggleActivityColumn} className={btnClass}>{ctx.activityCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button></div>
      <div className={headerClass} style={{ width: COL_WIDTHS.deliverable }}>산출물 <button onClick={ctx.toggleDeliverableColumn} className={btnClass}>{ctx.deliverableCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button></div>
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
        const cellClass = "flex items-center border-r border-slate-300 last:border-r-0 truncate text-[12px] text-slate-800 h-full justify-center";
        
        return (
          // 🚀 행 높이가 간트차트와 1:1로 정확히 맞물리도록 원복
          <div key={t.id} className={`flex border-b border-slate-300 transition-colors ${isSelected ? "bg-indigo-50" : "hover:bg-blue-50/70"}`} style={{ height: rowHeight, width: rowWidth, fontFamily, fontSize }}>
            <div className={cellClass} style={{ width: COL_WIDTHS.area, backgroundColor: areaColor.bg, color: areaColor.text, fontWeight: 'bold' }}>{t.area}</div>
            <div className={cellClass} style={{ width: COL_WIDTHS.phase, backgroundColor: phaseColor.bg, color: phaseColor.text, fontWeight: 'bold' }}>{t.phase}</div>
            <div className={`${cellClass} px-2 justify-start`} style={{ width: COL_WIDTHS.activity }}>{t.activity}</div>
            <div className={`${cellClass} px-2 justify-start`} style={{ width: COL_WIDTHS.deliverable }}>{t.deliverable}</div>
            <div className={`${cellClass} px-2 justify-start font-bold`} style={{ width: COL_WIDTHS.taskName }}>{t.taskName}</div>
            <div className={cellClass} style={{ width: COL_WIDTHS.assigneePlan }}>{t.assigneePlan}</div>
            <div className={cellClass} style={{ width: COL_WIDTHS.assigneeIT }}>{t.assigneeIT}</div>
            <div className={`${cellClass} bg-slate-50`} style={{ width: COL_WIDTHS.start }}>{formatDate(t.originalStart || t.start)}</div>
            <div className={`${cellClass} bg-slate-50`} style={{ width: COL_WIDTHS.end }}>{formatDate(t.originalEnd || t.end)}</div>
            <div className={`${cellClass} font-bold text-blue-600 bg-blue-50/30`} style={{ width: COL_WIDTHS.progress }}>{t.progress}%</div>
            
            <div className={cellClass} style={{ width: COL_WIDTHS.status }}>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_TAG_CLASSES[t.status] || STATUS_TAG_CLASSES["대기"]}`}>
                {t.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};