import React, { useContext } from "react";
import { Task } from "gantt-task-react";
import { GanttGroupContext } from "./GanttGroupContext";
import { ChevronRight, ChevronDown } from "lucide-react";

// 🚀 첨부해주신 이미지의 비율처럼 좁고 빽빽하게 넓이 조정
const COL_WIDTHS = {
  area: 65,          // 구분
  phase: 85,         // 단계
  activity: 110,     // 활동
  deliverable: 140,  // 산출물
  taskName: 170,     // 작업명
  assigneePlan: 75,  // 담당자(기획)
  assigneeIT: 75,    // 담당자(IT) (복구완료!)
  start: 80,         // 시작일 (복구완료!)
  end: 80,           // 종료일 (복구완료!)
  status: 75,        // 진행상태
};

export const TOTAL_WIDTH = Object.values(COL_WIDTHS).reduce((a, b) => a + b, 0);

// 날짜를 26.01.05 형태로 텍스트 낭비 없이 렌더링하는 함수
const formatDate = (date: Date | string | number) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear().toString().slice(2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
};

export const CustomTaskListHeader: React.FC<any> = ({ headerHeight, rowWidth, fontFamily, fontSize }) => {
  const ctx = useContext(GanttGroupContext);
  if (!ctx) return null;

  // 헤더 배경을 확실한 색상으로 채워서 표의 느낌 강조
  const headerClass = "flex items-center justify-center px-1 font-bold text-slate-800 border-r border-slate-300 bg-[#CFD8DC] tracking-tight text-center";
  const btnClass = "ml-1 p-0.5 rounded text-slate-500 hover:bg-slate-400 hover:text-white transition-colors";

  return (
    <div className="flex border-y border-slate-400 text-[12px] shadow-sm relative z-10" style={{ height: headerHeight, width: rowWidth, fontFamily, fontSize }}>
      <div className={headerClass} style={{ width: COL_WIDTHS.area }}>
        구분 <button onClick={ctx.toggleAreaColumn} className={btnClass}>{ctx.areaCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>
      </div>
      <div className={headerClass} style={{ width: COL_WIDTHS.phase }}>
        단계 <button onClick={ctx.togglePhaseColumn} className={btnClass}>{ctx.phaseCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>
      </div>
      <div className={headerClass} style={{ width: COL_WIDTHS.activity }}>
        활동 <button onClick={ctx.toggleActivityColumn} className={btnClass}>{ctx.activityCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>
      </div>
      <div className={headerClass} style={{ width: COL_WIDTHS.deliverable }}>
        산출물 <button onClick={ctx.toggleDeliverableColumn} className={btnClass}>{ctx.deliverableCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>
      </div>
      <div className={headerClass} style={{ width: COL_WIDTHS.taskName }}>작업</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.assigneePlan }}>담당(기획)</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.assigneeIT }}>담당(IT)</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.start }}>시작일</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.end }}>종료일</div>
      <div className={headerClass} style={{ width: COL_WIDTHS.status }}>진행상태</div>
    </div>
  );
};

// 🚀 상태값 뱃지를 없애고, 엑셀처럼 셀 자체를 컬러로 꽉 채우는 컴포넌트
const StatusCell = ({ status }: { status: string }) => {
  const config: Record<string, string> = {
    완료: "bg-[#81C784] text-[#1B5E20]",     // 꽉찬 초록
    진행중: "bg-[#64B5F6] text-[#0D47A1]",   // 꽉찬 파랑
    대기: "bg-[#E0E0E0] text-[#424242]",     // 꽉찬 회색
    지연: "bg-[#E57373] text-[#B71C1C]",     // 꽉찬 빨강
    이슈발생: "bg-[#EF5350] text-[#FFFFFF]", // 꽉찬 찐빨강 (흰 글씨)
    보류: "bg-[#FFB74D] text-[#E65100]",     // 꽉찬 주황
    취소: "bg-[#90A4AE] text-[#263238]",     // 꽉찬 청회색
  };
  const c = config[status] || config["대기"];
  return (
    <div className={`w-full h-full flex items-center justify-center font-bold text-[11px] border-r border-white/30 ${c}`}>
      {status}
    </div>
  );
};

export const CustomTaskListTable: React.FC<any> = ({ rowHeight, rowWidth, fontFamily, fontSize, tasks }) => {
  const ctx = useContext(GanttGroupContext);
  if (!ctx) return null;

  return (
    <div className="bg-white">
      {tasks.map((t: any) => {
        const isCollapsedGroup = ctx.areaCollapsed || ctx.phaseCollapsed || ctx.activityCollapsed || ctx.deliverableCollapsed;
        const baseCellClass = "flex items-center border-r border-slate-300 last:border-r-0 truncate text-[12px] text-slate-800";

        return (
          <div key={t.id} className="flex border-b border-slate-300 hover:bg-blue-50/70 transition-colors" style={{ height: rowHeight, width: rowWidth, fontFamily, fontSize }}>
            
            {/* 🚀 구분(영역) : 눈에 확 띄는 주황 파스텔톤으로 셀 꽉 채우기 */}
            <div className={`${baseCellClass} p-0`} style={{ width: COL_WIDTHS.area }}>
              <div className="w-full h-full bg-[#FFE0B2] flex items-center justify-center px-1 font-bold text-[#E65100] border-r border-white/50">
                <span className="truncate" title={t.area}>{t.area}</span>
              </div>
            </div>

            {/* 🚀 단계 : 눈에 확 띄는 초록 파스텔톤으로 셀 꽉 채우기 */}
            <div className={`${baseCellClass} p-0`} style={{ width: COL_WIDTHS.phase }}>
              <div className={`w-full h-full flex items-center justify-center px-1 font-bold border-r border-white/50 ${!ctx.areaCollapsed ? 'bg-[#C8E6C9] text-[#1B5E20]' : 'bg-transparent'}`}>
                <span className="truncate" title={t.phase}>{!ctx.areaCollapsed ? t.phase : ""}</span>
              </div>
            </div>

            {/* 활동 */}
            <div className={`${baseCellClass} px-2`} style={{ width: COL_WIDTHS.activity }}>
              <span className="truncate font-medium text-slate-700" title={t.activity}>{!ctx.areaCollapsed && !ctx.phaseCollapsed ? t.activity : ""}</span>
            </div>

            {/* 산출물 */}
            <div className={`${baseCellClass} px-2`} style={{ width: COL_WIDTHS.deliverable }}>
              <span className="truncate text-slate-600" title={t.deliverable}>{!ctx.areaCollapsed && !ctx.phaseCollapsed && !ctx.activityCollapsed ? t.deliverable : ""}</span>
            </div>

            {/* 작업명 */}
            <div className={`${baseCellClass} px-2 font-bold`} style={{ width: COL_WIDTHS.taskName }}>
              <span className="truncate" title={t.taskName}>{!isCollapsedGroup ? t.taskName : "-"}</span>
            </div>

            {/* 담당자(기획) */}
            <div className={`${baseCellClass} justify-center px-1`} style={{ width: COL_WIDTHS.assigneePlan }}>
              <span className="truncate text-[11px] font-medium" title={t.assigneePlan}>{!isCollapsedGroup ? t.assigneePlan : ""}</span>
            </div>

            {/* 담당자(IT) */}
            <div className={`${baseCellClass} justify-center px-1`} style={{ width: COL_WIDTHS.assigneeIT }}>
              <span className="truncate text-[11px] font-medium" title={t.assigneeIT}>{!isCollapsedGroup ? t.assigneeIT : ""}</span>
            </div>

            {/* 시작일 */}
            <div className={`${baseCellClass} justify-center px-1 bg-slate-50`} style={{ width: COL_WIDTHS.start }}>
              <span className="truncate text-[11px] text-slate-600 font-mono tracking-tighter">{!isCollapsedGroup ? formatDate(t.start) : ""}</span>
            </div>

            {/* 종료일 */}
            <div className={`${baseCellClass} justify-center px-1 bg-slate-50`} style={{ width: COL_WIDTHS.end }}>
              <span className="truncate text-[11px] text-slate-600 font-mono tracking-tighter">{!isCollapsedGroup ? formatDate(t.end) : ""}</span>
            </div>

            {/* 진행상태 (꽉 찬 셀 배경 적용) */}
            <div className={`${baseCellClass} p-0`} style={{ width: COL_WIDTHS.status }}>
              {!isCollapsedGroup ? <StatusCell status={t.status} /> : <div className="w-full h-full bg-slate-100"></div>}
            </div>

          </div>
        );
      })}
    </div>
  );
};