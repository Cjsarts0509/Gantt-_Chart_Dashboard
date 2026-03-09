import React, { useState, useRef } from "react";
import XLSX from "xlsx-js-style";
import { WBSTask } from "./mockData";
import { Download, Upload, Lock, X, FileSpreadsheet } from "lucide-react";

const UPLOAD_PASSWORD = "tkdvna";

const TEMPLATE_COLUMNS = [
  "영역",
  "단계",
  "활동",
  "산출물",
  "작업",
  "담당자(기획)",
  "담당자(IT)",
  "진행상태",
  "진행률",
  "시작일",
  "종료일",
];

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateSafe(val: unknown): Date {
  if (val instanceof Date) return val;
  if (typeof val === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(val);
    return new Date(d.y, d.m - 1, d.d);
  }
  if (typeof val === "string" && val.trim()) {
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

interface ExcelManagerProps {
  tasks: WBSTask[];
  visibleTasks: any[];
  onUpload: (tasks: WBSTask[]) => void;
}

const ExcelManager: React.FC<ExcelManagerProps> = ({ tasks, visibleTasks, onUpload }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Download Template ───
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    // Sample row
    const sampleData = [
      TEMPLATE_COLUMNS,
      ["공통", "설계", "UI설계", "화면정의서", "화면 설계서 작성", "홍길동", "김철수", "진행중", 50, "2026-01-05", "2026-02-15"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(sampleData);

    // Column widths
    ws["!cols"] = TEMPLATE_COLUMNS.map((h) => ({
      wch: Math.max(h.length * 2, 14),
    }));

    XLSX.utils.book_append_sheet(wb, ws, "WBS_Template");
    XLSX.writeFile(wb, "WBS_업로드양식.xlsx");
  };

  // ─── Download Current Data ───
  const handleDownloadData = () => {
    const wb = XLSX.utils.book_new();

    // ── 1. Collect all tasks' date info safely ──
    const safeTasks = visibleTasks.map((t: any) => {
      const s = t.start instanceof Date ? t.start : new Date(t.start || Date.now());
      const e = t.end instanceof Date ? t.end : new Date(t.end || Date.now());
      return { ...t, _start: s, _end: e };
    });

    // ── 2. Determine overall date range ──
    let minDate = new Date(9999, 0, 1);
    let maxDate = new Date(2000, 0, 1);
    for (const t of safeTasks) {
      if (t._start < minDate) minDate = new Date(t._start);
      if (t._end > maxDate) maxDate = new Date(t._end);
    }

    // ── 3. Generate week columns (Mon-based) ──
    const startMonday = new Date(minDate);
    startMonday.setDate(startMonday.getDate() - ((startMonday.getDay() + 6) % 7));
    const endSunday = new Date(maxDate);
    endSunday.setDate(endSunday.getDate() + ((7 - endSunday.getDay()) % 7));

    const weekStarts: Date[] = [];
    const cur = new Date(startMonday);
    while (cur <= endSunday) {
      weekStarts.push(new Date(cur));
      cur.setDate(cur.getDate() + 7);
    }

    // If too many weeks, switch to monthly
    const useMonthly = weekStarts.length > 52;

    let periodHeaders: string[] = [];
    let periodRanges: { start: Date; end: Date }[] = [];

    if (useMonthly) {
      const mStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      const mEnd = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
      const mc = new Date(mStart);
      while (mc <= mEnd) {
        const yr = String(mc.getFullYear()).slice(2);
        const mo = String(mc.getMonth() + 1).padStart(2, "0");
        periodHeaders.push(`${yr}.${mo}`);
        const pEnd = new Date(mc.getFullYear(), mc.getMonth() + 1, 0);
        periodRanges.push({ start: new Date(mc), end: pEnd });
        mc.setMonth(mc.getMonth() + 1);
      }
    } else {
      for (const ws of weekStarts) {
        const we = new Date(ws);
        we.setDate(we.getDate() + 6);
        const mo = String(ws.getMonth() + 1).padStart(2, "0");
        const dd = String(ws.getDate()).padStart(2, "0");
        periodHeaders.push(`${mo}.${dd}`);
        periodRanges.push({ start: new Date(ws), end: we });
      }
    }

    // ── 4. Status → background color mapping (ARGB without #) ──
    const statusBgColor: Record<string, string> = {
      완료:   "4CAF50",  // green
      진행중: "42A5F5",  // blue
      지연:   "EF5350",  // red
      보류:   "FFA726",  // orange
      예정:   "BDBDBD",  // gray
    };

    // ── 5. Build header row ──
    const GANTT_SEP = "";
    const headerRow = [...TEMPLATE_COLUMNS, GANTT_SEP, ...periodHeaders];

    // ── 6. Build data rows (base data only, gantt cells as empty strings) ──
    const dataRows = safeTasks.map((t: any) => {
      const baseRow = [
        t.area, t.phase, t.activity, t.deliverable, t.taskName,
        t.assigneePlan, t.assigneeIT, t.status, t.progress, t._start, t._end,
        "", // separator
      ];
      const ganttCells = periodRanges.map(() => "");
      return [...baseRow, ...ganttCells];
    });

    const allData = [headerRow, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(allData, { cellDates: true });

    // ── 7. Apply styles: header row ──
    const ganttStartCol = TEMPLATE_COLUMNS.length + 1; // after separator
    const headerStyle = {
      font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "37474F" } },
      alignment: { horizontal: "center" as const, vertical: "center" as const },
      border: {
        top:    { style: "thin" as const, color: { rgb: "CFD8DC" } },
        bottom: { style: "thin" as const, color: { rgb: "CFD8DC" } },
        left:   { style: "thin" as const, color: { rgb: "CFD8DC" } },
        right:  { style: "thin" as const, color: { rgb: "CFD8DC" } },
      },
    };
    for (let c = 0; c < headerRow.length; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[addr]) {
        ws[addr].s = headerStyle;
      }
    }

    // ── 8. Apply date/number formats + gantt background colors ──
    for (let ri = 0; ri < safeTasks.length; ri++) {
      const r = ri + 1; // row index in sheet (skip header)
      const t = safeTasks[ri];

      // 진행률 (col 8)
      const progCell = ws[XLSX.utils.encode_cell({ r, c: 8 })];
      if (progCell) { progCell.t = "n"; progCell.z = "0"; }
      // 시작일 (col 9)
      const startCell = ws[XLSX.utils.encode_cell({ r, c: 9 })];
      if (startCell) { startCell.t = "d"; startCell.z = "YYYY-MM-DD"; }
      // 종료일 (col 10)
      const endCell = ws[XLSX.utils.encode_cell({ r, c: 10 })];
      if (endCell) { endCell.t = "d"; endCell.z = "YYYY-MM-DD"; }

      // Gantt cells – fill background color where task overlaps period
      const tStart = t._start.getTime();
      const tEnd = t._end.getTime();
      const bgRgb = statusBgColor[t.status] || statusBgColor["예정"];

      for (let pi = 0; pi < periodRanges.length; pi++) {
        const pStart = periodRanges[pi].start.getTime();
        const pEnd = periodRanges[pi].end.getTime();
        const col = ganttStartCol + pi;
        const addr = XLSX.utils.encode_cell({ r, c: col });

        if (tStart <= pEnd && tEnd >= pStart) {
          // Overlap – apply background color
          if (!ws[addr]) ws[addr] = { t: "s", v: "" };
          ws[addr].s = {
            fill: { fgColor: { rgb: bgRgb } },
            border: {
              top:    { style: "thin" as const, color: { rgb: bgRgb } },
              bottom: { style: "thin" as const, color: { rgb: bgRgb } },
              left:   { style: "thin" as const, color: { rgb: bgRgb } },
              right:  { style: "thin" as const, color: { rgb: bgRgb } },
            },
          };
        } else {
          // No overlap – light grid
          if (!ws[addr]) ws[addr] = { t: "s", v: "" };
          ws[addr].s = {
            border: {
              top:    { style: "thin" as const, color: { rgb: "EEEEEE" } },
              bottom: { style: "thin" as const, color: { rgb: "EEEEEE" } },
              left:   { style: "thin" as const, color: { rgb: "EEEEEE" } },
              right:  { style: "thin" as const, color: { rgb: "EEEEEE" } },
            },
          };
        }
      }
    }

    // ── 9. Column widths ──
    const colWidths = [
      ...TEMPLATE_COLUMNS.map((h, i) => ({
        wch: i === 9 || i === 10 ? 14 : Math.max(h.length * 2, 14),
      })),
      { wch: 1 }, // separator
      ...periodHeaders.map(() => ({ wch: useMonthly ? 6 : 4 })),
    ];
    ws["!cols"] = colWidths;

    // ── 10. Add legend sheet ──
    const legendData = [
      ["범례", ""],
      ["완료", ""],
      ["진행중", ""],
      ["지연", ""],
      ["보류", ""],
      ["예정", ""],
    ];
    const wsLegend = XLSX.utils.aoa_to_sheet(legendData);
    const legendColors = ["", "4CAF50", "42A5F5", "EF5350", "FFA726", "BDBDBD"];
    for (let i = 1; i <= 5; i++) {
      const addr = XLSX.utils.encode_cell({ r: i, c: 1 });
      wsLegend[addr] = {
        t: "s", v: "    ",
        s: { fill: { fgColor: { rgb: legendColors[i] } } },
      };
    }
    wsLegend["!cols"] = [{ wch: 10 }, { wch: 10 }];

    XLSX.utils.book_append_sheet(wb, ws, "WBS_Data");
    XLSX.utils.book_append_sheet(wb, wsLegend, "범례");
    XLSX.writeFile(wb, `WBS_조회결과_${formatDate(new Date())}.xlsx`);
  };

  // ─── Upload Flow ───
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPassword("");
    setPasswordError(false);
    setShowPasswordModal(true);
    // Reset file input
    if (fileRef.current) fileRef.current.value = "";
  };

  const handlePasswordSubmit = () => {
    if (password !== UPLOAD_PASSWORD) {
      setPasswordError(true);
      return;
    }
    setPasswordError(false);
    if (pendingFile) {
      processFile(pendingFile);
    }
    setShowPasswordModal(false);
    setPendingFile(null);
    setPassword("");
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length < 2) return;

        // Auto-detect column positions from header row
        const header = (rows[0] as string[]).map((h) => String(h || "").trim());
        const colIdx = {
          area: header.indexOf("영역"),
          phase: header.indexOf("단계"),
          activity: header.indexOf("활동"),
          deliverable: header.indexOf("산출물"),
          taskName: header.indexOf("작업"),
          assigneePlan: header.indexOf("담당자(기획)"),
          assigneeIT: header.indexOf("담당자(IT)"),
          status: header.indexOf("진행상태"),
          progress: header.indexOf("진행률"),
          start: header.indexOf("시작일"),
          end: header.indexOf("종료일"),
        };

        // Fallback: if header detection fails, use positional mapping
        // Old format (10 cols): 영역,단계,활동,산출물,작업,담당자(기획),담당자(IT),진행상태,시작일,종료일
        // New format (11 cols): 영역,단계,활동,산출물,작업,담당자(기획),담당자(IT),진행상태,진행률,시작일,종료일
        if (colIdx.area === -1) colIdx.area = 0;
        if (colIdx.phase === -1) colIdx.phase = 1;
        if (colIdx.activity === -1) colIdx.activity = 2;
        if (colIdx.deliverable === -1) colIdx.deliverable = 3;
        if (colIdx.taskName === -1) colIdx.taskName = 4;
        if (colIdx.assigneePlan === -1) colIdx.assigneePlan = 5;
        if (colIdx.assigneeIT === -1) colIdx.assigneeIT = 6;
        if (colIdx.status === -1) colIdx.status = 7;
        if (colIdx.start === -1) colIdx.start = header.length >= 11 ? 9 : 8;
        if (colIdx.end === -1) colIdx.end = header.length >= 11 ? 10 : 9;
        // progress may not exist in old format

        // Skip header row
        const newTasks: WBSTask[] = [];
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r || !r[colIdx.area]) continue; // skip empty rows
          const task: WBSTask = {
            id: `upload-${Date.now()}-${i}`,
            name: String(r[colIdx.taskName] || ""),
            type: "task",
            start: parseDateSafe(r[colIdx.start]),
            end: parseDateSafe(r[colIdx.end]),
            progress: colIdx.progress !== -1 ? (Number(r[colIdx.progress]) || 0) : 0,
            area: String(r[colIdx.area] || ""),
            phase: String(r[colIdx.phase] || ""),
            activity: String(r[colIdx.activity] || ""),
            deliverable: String(r[colIdx.deliverable] || ""),
            taskName: String(r[colIdx.taskName] || ""),
            assigneePlan: String(r[colIdx.assigneePlan] || ""),
            assigneeIT: String(r[colIdx.assigneeIT] || ""),
            status: String(r[colIdx.status] || "예정"),
          };
          newTasks.push(task);
        }
        if (newTasks.length > 0) {
          onUpload(newTasks);
        }
      } catch (err) {
        console.error("Excel parse error:", err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Download Template */}
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
          title="업로드 양식 다운로드"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          양식
        </button>

        {/* Download Data */}
        <button
          onClick={handleDownloadData}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] bg-emerald-600 text-white hover:bg-emerald-700 transition"
          title="현재 데이터 엑셀 다운로드"
        >
          <Download className="w-3.5 h-3.5" />
          다운로드
        </button>

        {/* Upload */}
        <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer">
          <Upload className="w-3.5 h-3.5" />
          업로드
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[360px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <h3 className="text-[15px] text-slate-900">업로드 인증</h3>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPendingFile(null);
                  setPassword("");
                  setPasswordError(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[12px] text-slate-500 mb-3">
              데이터 업로드를 위해 관리자 암호를 입력하세요.
            </p>
            <input
              type="password"
              className={`w-full h-10 px-3 rounded-lg border text-[13px] outline-none transition ${
                passwordError
                  ? "border-red-400 bg-red-50 focus:ring-red-300"
                  : "border-slate-300 bg-slate-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              }`}
              placeholder="암호 입력"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
              autoFocus
            />
            {passwordError && (
              <p className="text-[11px] text-red-500 mt-1">
                암호가 일치하지 않습니다.
              </p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPendingFile(null);
                }}
                className="px-4 py-2 rounded-lg text-[12px] text-slate-600 hover:bg-slate-100 transition"
              >
                취소
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="px-4 py-2 rounded-lg text-[12px] bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExcelManager;