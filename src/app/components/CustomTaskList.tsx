import React from "react";
import { WBSTask } from "./mockData";
import { useGanttGroup } from "./GanttGroupContext";

// Column definitions – flex-ratio based auto-sizing
const COLUMN_DEFS = [
  { key: "area",       label: "영역",      flex: 1.1,  groupable: true },
  { key: "phase",      label: "단계",      flex: 0.85, groupable: true },
  { key: "activity",   label: "활동",      flex: 1.1,  groupable: true },
  { key: "deliverable",label: "산출물",    flex: 1.3,  groupable: true },
  { key: "taskName",   label: "작업명",    flex: 1.7,  groupable: false },
  { key: "assigneePlan",label: "담당(기획)",flex: 0.65, groupable: false },
  { key: "assigneeIT", label: "담당(IT)",  flex: 0.65, groupable: false },
  { key: "status",     label: "진행상태",  flex: 0.8,  groupable: false },
  { key: "progress",   label: "진행률",    flex: 0.7,  groupable: false },
  { key: "startDate",  label: "시작일",    flex: 0.9,  groupable: false },
  { key: "endDate",    label: "종료일",    flex: 0.9,  groupable: false },
];

// Total table width (fixed px for gantt-task-react alignment)
export const TOTAL_WIDTH = 860;

const totalFlex = COLUMN_DEFS.reduce((s, c) => s + c.flex, 0);

export const COLUMNS = COLUMN_DEFS.map((c) => ({
  ...c,
  width: Math.round((c.flex / totalFlex) * TOTAL_WIDTH),
}));

// Ensure last column absorbs rounding diff
const sumWidths = COLUMNS.reduce((s, c) => s + c.width, 0);
if (sumWidths !== TOTAL_WIDTH) {
  COLUMNS[COLUMNS.length - 1].width += TOTAL_WIDTH - sumWidths;
}

const cellBase: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  padding: "0 6px",
  borderRight: "1px solid #d5d5d5",
  boxSizing: "border-box",
  flexShrink: 0,
  height: "100%",
  display: "flex",
  alignItems: "center",
  fontSize: "11.5px",
  color: "#333333",
  fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

function formatDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// ─── Pill / Badge ───
const Pill: React.FC<{
  label: string;
  bg: string;
  color: string;
  border?: string;
  maxW?: number;
}> = ({ label, bg, color, border, maxW }) => (
  <span
    style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 10,
      fontSize: "10px",
      fontWeight: 600,
      background: bg,
      color,
      border: border ? `1px solid ${border}` : "none",
      lineHeight: "15px",
      maxWidth: maxW || 999,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }}
    title={label}
  >
    {label}
  </span>
);

// ─── Status styles ───
const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  완료:   { bg: "#e8f5e9", color: "#2e7d32", border: "#c8e6c9" },
  진행중: { bg: "#e3f2fd", color: "#1565c0", border: "#bbdefb" },
  지연:   { bg: "#ffebee", color: "#c62828", border: "#ffcdd2" },
  예정:   { bg: "#f5f5f5", color: "#616161", border: "#e0e0e0" },
  보류:   { bg: "#fff8e1", color: "#e65100", border: "#ffe0b2" },
};

// ─── Area pill colors ───
const AREA_STYLES = [
  { bg: "#fef9e7", color: "#b7791f", border: "#fcefc7" },
  { bg: "#eaf4fc", color: "#2b6cb0", border: "#bee3f8" },
  { bg: "#f0fff4", color: "#276749", border: "#c6f6d5" },
  { bg: "#faf5ff", color: "#6b46c1", border: "#e9d8fd" },
  { bg: "#fff5f5", color: "#c53030", border: "#fed7d7" },
  { bg: "#fffaf0", color: "#c05621", border: "#feebc8" },
  { bg: "#f0fff4", color: "#2f855a", border: "#c6f6d5" },
  { bg: "#ebf8ff", color: "#2c5282", border: "#bee3f8" },
];
const areaStyleMap = new Map<string, (typeof AREA_STYLES)[0]>();
let areaIdx = 0;
function getAreaStyle(a: string) {
  if (!areaStyleMap.has(a)) { areaStyleMap.set(a, AREA_STYLES[areaIdx++ % AREA_STYLES.length]); }
  return areaStyleMap.get(a)!;
}

// ─── Phase pill colors ───
const PHASE_STYLES = [
  { bg: "#fce4ec", color: "#ad1457", border: "#f8bbd0" },
  { bg: "#e8eaf6", color: "#283593", border: "#c5cae9" },
  { bg: "#e0f2f1", color: "#00695c", border: "#b2dfdb" },
  { bg: "#fff3e0", color: "#e65100", border: "#ffe0b2" },
  { bg: "#f3e5f5", color: "#6a1b9a", border: "#ce93d8" },
  { bg: "#e8f5e9", color: "#2e7d32", border: "#c8e6c9" },
];
const phaseStyleMap = new Map<string, (typeof PHASE_STYLES)[0]>();
let phaseIdx = 0;
function getPhaseStyle(p: string) {
  if (!phaseStyleMap.has(p)) { phaseStyleMap.set(p, PHASE_STYLES[phaseIdx++ % PHASE_STYLES.length]); }
  return phaseStyleMap.get(p)!;
}

// ─── Activity pill colors ───
const ACT_STYLES = [
  { bg: "#e3f2fd", color: "#1565c0", border: "#bbdefb" },
  { bg: "#fce4ec", color: "#ad1457", border: "#f8bbd0" },
  { bg: "#e8f5e9", color: "#2e7d32", border: "#c8e6c9" },
  { bg: "#fff8e1", color: "#f57f17", border: "#fff9c4" },
  { bg: "#ede7f6", color: "#4527a0", border: "#d1c4e9" },
  { bg: "#fbe9e7", color: "#bf360c", border: "#ffccbc" },
  { bg: "#e0f7fa", color: "#00838f", border: "#b2ebf2" },
  { bg: "#f1f8e9", color: "#558b2f", border: "#dcedc8" },
];
const actStyleMap = new Map<string, (typeof ACT_STYLES)[0]>();
let actIdx = 0;
function getActStyle(a: string) {
  if (!actStyleMap.has(a)) { actStyleMap.set(a, ACT_STYLES[actIdx++ % ACT_STYLES.length]); }
  return actStyleMap.get(a)!;
}

// Column-level toggle arrow for header
const HeaderToggle: React.FC<{ collapsed: boolean; onClick: () => void }> = ({ collapsed, onClick }) => (
  <span
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 16,
      height: 16,
      borderRadius: 4,
      cursor: "pointer",
      flexShrink: 0,
      fontSize: "9px",
      color: collapsed ? "#1565c0" : "#9e9e9e",
      background: collapsed ? "#e3f2fd" : "transparent",
      border: collapsed ? "1px solid #bbdefb" : "1px solid transparent",
      transition: "all 0.15s",
      marginRight: 2,
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = collapsed ? "#bbdefb" : "#f0f0f0"; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = collapsed ? "#e3f2fd" : "transparent"; }}
    title={collapsed ? "펼치기" : "접기"}
  >
    {collapsed ? "▸" : "▾"}
  </span>
);

// ═══ Header ═══
export const CustomTaskListHeader: React.FC<{
  headerHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
}> = ({ headerHeight }) => {
  const { areaCollapsed, phaseCollapsed, activityCollapsed, deliverableCollapsed,
    toggleAreaColumn, togglePhaseColumn, toggleActivityColumn, toggleDeliverableColumn } = useGanttGroup();

  const toggleMap: Record<string, { collapsed: boolean; toggle: () => void }> = {
    area:        { collapsed: areaCollapsed,        toggle: toggleAreaColumn },
    phase:       { collapsed: phaseCollapsed,       toggle: togglePhaseColumn },
    activity:    { collapsed: activityCollapsed,    toggle: toggleActivityColumn },
    deliverable: { collapsed: deliverableCollapsed, toggle: toggleDeliverableColumn },
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: headerHeight,
        width: TOTAL_WIDTH,
        minWidth: TOTAL_WIDTH,
        borderBottom: "1px solid #d0d0d0",
        background: "#fafafa",
        fontWeight: 600,
        fontSize: "11.5px",
        color: "#555555",
      }}
    >
      {COLUMNS.map((col, i) => {
        const tm = toggleMap[col.key];
        return (
          <div
            key={col.key}
            style={{
              ...cellBase,
              width: col.width,
              borderRight: i === COLUMNS.length - 1 ? "none" : "1px solid #d5d5d5",
              justifyContent: "center",
              color: "#555555",
              fontWeight: 600,
              gap: 2,
            }}
          >
            {tm && <HeaderToggle collapsed={tm.collapsed} onClick={tm.toggle} />}
            {col.label}
          </div>
        );
      })}
    </div>
  );
};

// ═══ Table Rows ═══
export const CustomTaskListTable: React.FC<{
  rowHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
  locale: string;
  tasks: WBSTask[];
  selectedTaskId: string;
  setSelectedTask: (taskId: string) => void;
  onExpanderClick: (task: WBSTask) => void;
}> = ({ rowHeight, tasks, selectedTaskId }) => {
  const { areaCollapsed, phaseCollapsed, activityCollapsed, deliverableCollapsed } = useGanttGroup();

  let lastArea = "";
  let lastAP = "";
  let lastAPA = "";
  let lastDeliverable = "";
  let lastTaskName = "";

  return (
    <div style={{ width: TOTAL_WIDTH, minWidth: TOTAL_WIDTH }}>
      {tasks.map((task: any) => {
        const isSelected = task.id === selectedTaskId;
        const showArea = task.area !== lastArea;
        const curAP = `${task.area}||${task.phase}`;
        const showPhase = curAP !== lastAP;
        const curAPA = `${task.area}||${task.phase}||${task.activity}`;
        const showActivity = curAPA !== lastAPA;

        lastArea = task.area;
        lastAP = curAP;
        lastAPA = curAPA;

        const ss = statusStyles[task.status] || statusStyles["예정"];
        const areaS = getAreaStyle(task.area);
        const phaseS = getPhaseStyle(task.phase);
        const actS = getActStyle(task.activity);

        const areaGroupCount = task.__areaCount || 0;
        const phaseGroupCount = task.__phaseCount || 0;
        const activityGroupCount = task.__activityCount || 0;
        const deliverableGroupCount = task.__deliverableCount || 0;

        const isAreaSummary = showArea && areaCollapsed;
        const isPhaseSummary = showPhase && phaseCollapsed && !areaCollapsed;
        const isActivitySummary = showActivity && activityCollapsed && !areaCollapsed && !phaseCollapsed;
        const isSummary = isAreaSummary || isPhaseSummary || isActivitySummary;

        // Deliverable grouping: show on first occurrence within each activity group
        const curDel = `${task.area}||${task.phase}||${task.activity}||${task.deliverable}`;
        const showDeliverable = !isSummary && (task.deliverable !== lastDeliverable || showActivity);
        const isDeliverableSummary = showDeliverable && deliverableCollapsed && !isSummary;
        const isAnySummary = isSummary || isDeliverableSummary;
        const dim = isAnySummary ? "#bdbdbd" : undefined;

        // TaskName grouping: show on first occurrence within each deliverable group
        const showTaskName = !isAnySummary && (task.taskName !== lastTaskName || showDeliverable);

        if (!isSummary) lastDeliverable = task.deliverable;
        if (!isAnySummary) lastTaskName = task.taskName;

        return (
          <div
            key={task.id}
            style={{
              display: "flex",
              alignItems: "stretch",
              height: rowHeight,
              borderBottom: "1px solid #e8e8e8",
              background: isSelected ? "#e3f2fd" : "#fff",
              cursor: "default",
            }}
            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#fafafa"; }}
            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "#fff"; }}
          >
            {/* 영역 */}
            <div style={{ ...cellBase, width: COLUMNS[0].width, gap: 2, justifyContent: "center" }}>
              {showArea && (
                <>
                  <Pill label={task.area} bg={areaS.bg} color={areaS.color} border={areaS.border} />
                  {areaCollapsed && areaGroupCount > 1 && (
                    <span style={{ fontSize: "9px", color: "#bdbdbd", flexShrink: 0 }}>{areaGroupCount}</span>
                  )}
                </>
              )}
            </div>

            {/* 단계 */}
            <div style={{ ...cellBase, width: COLUMNS[1].width, gap: 2, justifyContent: "center" }}>
              {showPhase && !areaCollapsed && (
                <>
                  <Pill label={task.phase} bg={phaseS.bg} color={phaseS.color} border={phaseS.border} />
                  {phaseCollapsed && phaseGroupCount > 1 && (
                    <span style={{ fontSize: "9px", color: "#bdbdbd", flexShrink: 0 }}>{phaseGroupCount}</span>
                  )}
                </>
              )}
            </div>

            {/* 활동 */}
            <div style={{ ...cellBase, width: COLUMNS[2].width, gap: 2, justifyContent: "center" }}>
              {showActivity && !areaCollapsed && !phaseCollapsed && (
                <>
                  <Pill label={task.activity} bg={actS.bg} color={actS.color} border={actS.border} />
                  {activityCollapsed && activityGroupCount > 1 && (
                    <span style={{ fontSize: "9px", color: "#bdbdbd", flexShrink: 0 }}>{activityGroupCount}</span>
                  )}
                </>
              )}
            </div>

            {/* 산출물 */}
            <div style={{ ...cellBase, width: COLUMNS[3].width, gap: 2, color: dim || "#616161" }}>
              {isSummary ? "—" : (showDeliverable ? (
                <>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={task.deliverable}>{task.deliverable}</span>
                  {deliverableCollapsed && deliverableGroupCount > 1 && (
                    <span style={{ fontSize: "9px", color: "#bdbdbd", flexShrink: 0 }}>{deliverableGroupCount}</span>
                  )}
                </>
              ) : "")}
            </div>

            {/* 작업명 */}
            <div style={{ ...cellBase, width: COLUMNS[4].width, fontWeight: 500, color: dim || "#212121" }}>
              {isAnySummary ? "—" : (showTaskName ? task.taskName : "")}
            </div>

            {/* 담당(기획) */}
            <div style={{ ...cellBase, width: COLUMNS[5].width, justifyContent: "center", color: dim || "#616161" }}>
              {isAnySummary ? "—" : task.assigneePlan}
            </div>

            {/* 담당(IT) */}
            <div style={{ ...cellBase, width: COLUMNS[6].width, justifyContent: "center", color: dim || "#616161" }}>
              {isAnySummary ? "—" : task.assigneeIT}
            </div>

            {/* 진행상태 */}
            <div style={{ ...cellBase, width: COLUMNS[7].width, justifyContent: "center" }}>
              {!isAnySummary && <Pill label={task.status} bg={ss.bg} color={ss.color} border={ss.border} />}
            </div>

            {/* 진행률 */}
            <div style={{ ...cellBase, width: COLUMNS[8].width, justifyContent: "center", gap: 3 }}>
              {(() => {
                let prog: number;
                let total = 0;
                let done = 0;
                if (isAreaSummary) {
                  total = task.__areaCount || 0;
                  done = task.__areaCompleted || 0;
                  prog = total > 0 ? Math.round((done / total) * 100) : 0;
                } else if (isPhaseSummary) {
                  total = task.__phaseCount || 0;
                  done = task.__phaseCompleted || 0;
                  prog = total > 0 ? Math.round((done / total) * 100) : 0;
                } else if (isActivitySummary) {
                  total = task.__activityCount || 0;
                  done = task.__actCompleted || 0;
                  prog = total > 0 ? Math.round((done / total) * 100) : 0;
                } else if (isDeliverableSummary) {
                  total = task.__deliverableCount || 0;
                  done = task.__delCompleted || 0;
                  prog = total > 0 ? Math.round((done / total) * 100) : 0;
                } else {
                  prog = task.status === "완료" ? 100 : 0;
                }
                const barColor = prog === 100 ? "#4caf50" : prog > 0 ? "#42a5f5" : "#e0e0e0";
                const textColor = prog === 100 ? "#2e7d32" : prog > 0 ? "#1565c0" : "#9e9e9e";
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, width: "100%" }}>
                    <div style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      background: "#f0f0f0",
                      overflow: "hidden",
                      minWidth: 20,
                    }}>
                      <div style={{
                        width: `${prog}%`,
                        height: "100%",
                        borderRadius: 3,
                        background: barColor,
                        transition: "width 0.3s ease",
                      }} />
                    </div>
                    <span style={{ fontSize: "10px", color: textColor, fontWeight: 600, flexShrink: 0, minWidth: 28, textAlign: "right" }}>
                      {prog}%
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* 시작일 */}
            <div style={{ ...cellBase, width: COLUMNS[9].width, justifyContent: "center", color: dim || "#424242", fontVariantNumeric: "tabular-nums" }}>
              {isAnySummary ? "—" : formatDate(task.start)}
            </div>

            {/* 종료일 */}
            <div style={{ ...cellBase, width: COLUMNS[10].width, borderRight: "none", justifyContent: "center", color: dim || "#424242", fontVariantNumeric: "tabular-nums" }}>
              {isAnySummary ? "—" : formatDate(task.end)}
            </div>
          </div>
        );
      })}
    </div>
  );
};