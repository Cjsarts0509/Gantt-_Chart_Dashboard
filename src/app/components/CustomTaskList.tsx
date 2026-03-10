import React, { useContext } from "react";
import { Task } from "gantt-task-react";
import { GanttGroupContext } from "./GanttGroupContext";
import { ChevronRight, ChevronDown } from "lucide-react";

const COL_WIDTHS = {
  area: 65, phase: 85, activity: 110, deliverable: 140, taskName: 170,
  assigneePlan: 75, assigneeIT: 75, start: 80, end: 80, status: 75,
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

// 🚀 구분(area)과 단계(phase)의 색상 팔레트를 분리해 서로 안 겹치도록 보장
const getDynamicColor = (text: string, type: 'area' | 'phase') => {
  if (!text) return { bg: "transparent", text: "#333" };
  
  // 구분: 파랑, 보라, 핑크, 딥인디고 등 차가운 느낌 위주의 팔레트
  const areaPalettes = [
    { bg: "#E3F2FD", text: "#1565C0" }, // Blue
    { bg: "#F3E5F5", text: "#6A1B9A" }, // Purple
    { bg: "#FCE4EC", text: "#AD1457" }, // Pink
    { bg: "#E8EAF6", text: "#283593" }, // Indigo
  ];
  
  // 단계: 초록, 주황, 청록, 노랑, 갈색 등 따뜻/어스 느낌 위주의 팔레트
  const phasePalettes = [
    { bg: "#E8F5E9", text: "#2E7D32" }, // Green
    { bg: "#FFF3E0", text: "#E65100" }, // Orange
    { bg: "#E0F2F1", text: "#00695C" }, // Teal
    { bg: "#FFF8E1", text: "#F57F17" }, // Yellow/Amber
    { bg: "#EFEBE9", text: "#4E342E" }, // Brown
  ];
  
  const hash = text.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const palettes = type === 'area' ? areaPalettes : phasePalettes;
  return palettes[hash % palettes.length];
};

export const CustomTaskListHeader: React.FC<any> = ({ headerHeight, rowWidth, fontFamily, fontSize }) => {
  const headerClass = "flex items-center justify-center px-1 font-bold text-slate-800 border-r border-slate-300 bg-[#CFD8DC] text-center";
  return (
    <div className="flex border-y border-slate-400 text-[12px] relative z-10" style={{ height: headerHeight, width: rowWidth, fontFamily, fontSize }}>
      <div className={headerClass} style={{ width: COL_WIDTHS.area }}>구분</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.phase }}>단계</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.activity }}>활동</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.deliverable }}>산출물</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.taskName }}>작업</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.assigneePlan }}>기획</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.assigneeIT }}>IT</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.start }}>시작</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.end }}>종료</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.status }}>상태</div>
    </div>
  );
};

export const CustomTaskListTable: React.FC<any> = ({ rowHeight, rowWidth, fontFamily, fontSize, tasks }) => {
  const ctx = useContext(GanttGroupContext);
  if (!ctx) return null;
  return (
    <div className="bg-white">
      {tasks.map((t: any) => {
        const areaColor = getDynamicColor(t.area, 'area');
        const phaseColor = getDynamicColor(t.phase, 'phase');
        const cellClass = "flex items-center border-r border-slate-300 last:border-r-0 truncate text-[12px] text-slate-800 h-full justify-center";
        const statusColors: any = { 완료: "bg-[#81C784]", 진행중: "bg-[#64B5F6]", 대기: "bg-[#E0E0E0]", 지연: "bg-[#E57373]", 이슈발생: "bg-[#EF5350] text-white", 보류: "bg-[#FFB74D]", 취소: "bg-[#90A4AE]" };
        return (
          <div key={t.id} className="flex border-b border-slate-300 hover:bg-blue-50/70 transition-colors" style={{ height: rowHeight, width: rowWidth, fontFamily, fontSize }}>
            <div className={cellClass} style={{ width: COL_WIDTHS.area, backgroundColor: areaColor.bg, color: areaColor.text, fontWeight: 'bold' }}>{t.area}</div>
            <div className={cellClass} style={{ width: COL_WIDTHS.phase, backgroundColor: phaseColor.bg, color: phaseColor.text, fontWeight: 'bold' }}>{t.phase}</div>
            <div className={`${cellClass} px-2 justify-start`} style={{ width: COL_WIDTHS.activity }}>{t.activity}</div>
            <div className={`${cellClass} px-2 justify-start`} style={{ width: COL_WIDTHS.deliverable }}>{t.deliverable}</div>
            <div className={`${cellClass} px-2 justify-start font-bold`} style={{ width: COL_WIDTHS.taskName }}>{t.taskName}</div>
            <div className={cellClass} style={{ width: COL_WIDTHS.assigneePlan }}>{t.assigneePlan}</div>
            <div className={cellClass} style={{ width: COL_WIDTHS.assigneeIT }}>{t.assigneeIT}</div>
            <div className={`${cellClass} bg-slate-50`} style={{ width: COL_WIDTHS.start }}>{formatDate(t.originalStart || t.start)}</div>
            <div className={`${cellClass} bg-slate-50`} style={{ width: COL_WIDTHS.end }}>{formatDate(t.originalEnd || t.end)}</div>
            <div className={`${cellClass} font-bold ${statusColors[t.status] || "bg-slate-100"}`} style={{ width: COL_WIDTHS.status }}>{t.status}</div>
          </div>
        );
      })}
    </div>
  );
};
