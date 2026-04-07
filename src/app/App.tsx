import React, { useState, useEffect, useMemo, useCallback, useRef, useContext } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { createClient } from '@supabase/supabase-js';
import { Plus, Save, X, RefreshCw, LayoutDashboard, ChevronDown, ChevronRight, BarChart2, Trash2, CalendarDays, RotateCcw, ArrowUpDown, Network } from 'lucide-react';
import "./components/gantt-overrides.css";

// 기존 컴포넌트 임포트 (경로 유지)
import { GanttGroupContext } from "./components/GanttGroupContext";
import ExcelManager from "./components/ExcelManager";
import DashboardPopup from "./components/DashboardPopup";
import WeeklyDashboardPopup from "./components/WeeklyDashboardPopup";
import MonthlyDashboardPopup from "./components/MonthlyDashboardPopup";
import ArchitecturePopup from "./components/ArchitecturePopup";

// 🌟 Supabase 설정 (V2 엔진)
const supabaseUrl = 'https://cbogmikpdlmwgluahcnz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib2dtaWtwZGxtd2dsdWFoY256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDIxMjksImV4cCI6MjA4Nzc3ODEyOX0.nagpgjcC7fbk5Bsi812giOSkiKGHG-Y-UZwWndwFbmY';
const supabase = createClient(supabaseUrl, supabaseKey);

// 🌟 상태 -> 진행률 자동 변환기
const getProgressFromStatus = (status: string) => {
  switch(status) {
    case '시작전': return 0;
    case '진행중': return 20;
    case '개발완료': return 40;
    case '단위테스트중': return 50;
    case '수정필요': return 60;
    case '최종완료': return 100;
    case '개발제외': return 0;
    case '보류중': return 0;
    default: return 0;
  }
};

// 🌟 V2 전용 15개 칼럼 정의
const COL_DEF = [
  { id: 'project_id', label: '범용성', width: 90 },
  { id: 'category', label: '카테고리', width: 80 },
  { id: 'phase', label: '단계', width: 80 },
  { id: 'area', label: '구분', width: 80 },
  { id: 'req_id', label: '요구사항ID', width: 90 },
  { id: 'req_name', label: '요구사항명', width: 160 },
  { id: 'req_desc', label: '요구사항 내용', width: 160 },
  { id: 'dev_direction', label: '개발방향', width: 70 },
  { id: 'dev_priority', label: '개발순위', width: 70 },
  { id: 'screen_id', label: '화면ID', width: 90 },
  { id: 'screen_name', label: '화면명', width: 140 },
  { id: 'assignee_plan', label: '담당자(기획)', width: 80 },
  { id: 'assignee_it', label: '담당자(IT)', width: 80 },
  { id: 'start_date', label: '시작일', width: 90 },
  { id: 'end_date', label: '종료일', width: 90 },
  { id: 'status', label: '상태', width: 80 }
];

// 🌟 간트 차트 좌측 V2 헤더 (정렬 기능 내장)
const V2TaskListHeader = ({ headerHeight, fontFamily, fontSize }: any) => {
  const { hiddenCols, sortConfig, setSortConfig } = useContext(GanttGroupContext);
  return (
    <div className="flex border-b border-slate-200 bg-slate-100 text-slate-600 font-bold" style={{ height: headerHeight, fontFamily, fontSize: '11px' }}>
      {COL_DEF.map(col => {
        if (hiddenCols.has(col.id)) return null;
        const isSorted = sortConfig?.key === col.id;
        return (
          <div 
            key={col.id} 
            className="flex items-center justify-center border-r border-slate-200 shrink-0 cursor-pointer hover:bg-slate-200 transition-colors select-none" 
            style={{ width: col.width }}
            onClick={() => setSortConfig(col.id)}
          >
            {col.label}
            {isSorted && <ArrowUpDown className="w-3 h-3 ml-1 text-indigo-500" />}
          </div>
        );
      })}
    </div>
  );
};

// 🌟 간트 차트 좌측 V2 테이블 바디 (더블클릭 수정 내장)
const V2TaskListTable = ({ rowHeight, rowWidth, tasks, fontFamily, fontSize }: any) => {
  const { hiddenCols } = useContext(GanttGroupContext);
  return (
    <div style={{ fontFamily, fontSize: '11px' }}>
      {tasks.map((t: any) => {
        const raw = t._raw || {};
        return (
          <div 
            key={t.id} 
            className="flex border-b border-slate-100 hover:bg-indigo-50/40 transition-colors cursor-pointer" 
            style={{ height: rowHeight, width: rowWidth }}
            onDoubleClick={(e) => { e.stopPropagation(); if (t.onDoubleClick) t.onDoubleClick(e); }}
            title="더블클릭하여 수정"
          >
            {!hiddenCols.has('project_id') && <div className="flex items-center px-2 border-r border-slate-100 shrink-0 truncate text-slate-500" style={{ width: COL_DEF.find(c=>c.id==='project_id')?.width }}>{raw.project_id}</div>}
            {!hiddenCols.has('category') && <div className="flex items-center justify-center border-r border-slate-100 shrink-0" style={{ width: COL_DEF.find(c=>c.id==='category')?.width }}>{raw.category}</div>}
            {!hiddenCols.has('phase') && <div className="flex items-center justify-center border-r border-slate-100 shrink-0 font-bold" style={{ width: COL_DEF.find(c=>c.id==='phase')?.width }}>{raw.phase}</div>}
            {!hiddenCols.has('area') && <div className="flex items-center justify-center border-r border-slate-100 shrink-0" style={{ width: COL_DEF.find(c=>c.id==='area')?.width }}>{raw.area}</div>}
            {!hiddenCols.has('req_id') && <div className="flex items-center px-2 border-r border-slate-100 shrink-0 text-[10px] text-slate-400" style={{ width: COL_DEF.find(c=>c.id==='req_id')?.width }}>{raw.req_id}</div>}
            {!hiddenCols.has('req_name') && <div className="flex items-center px-2 border-r border-slate-100 shrink-0 font-bold text-slate-700 truncate" style={{ width: COL_DEF.find(c=>c.id==='req_name')?.width }}>{raw.req_name}</div>}
            {!hiddenCols.has('req_desc') && <div className="flex items-center px-2 border-r border-slate-100 shrink-0 truncate text-slate-500" style={{ width: COL_DEF.find(c=>c.id==='req_desc')?.width }}>{raw.req_desc}</div>}
            {!hiddenCols.has('dev_direction') && <div className="flex items-center justify-center border-r border-slate-100 shrink-0" style={{ width: COL_DEF.find(c=>c.id==='dev_direction')?.width }}>{raw.dev_direction}</div>}
            {!hiddenCols.has('dev_priority') && <div className="flex items-center justify-center border-r border-slate-100 shrink-0" style={{ width: COL_DEF.find(c=>c.id==='dev_priority')?.width }}>{raw.dev_priority}</div>}
            {!hiddenCols.has('screen_id') && <div className="flex items-center px-2 border-r border-slate-100 shrink-0 text-[10px] text-slate-400 truncate" style={{ width: COL_DEF.find(c=>c.id==='screen_id')?.width }}>{raw.screen_id}</div>}
            {!hiddenCols.has('screen_name') && <div className="flex items-center px-2 border-r border-slate-100 shrink-0 font-bold text-slate-700 truncate" style={{ width: COL_DEF.find(c=>c.id==='screen_name')?.width }}>{raw.screen_name}</div>}
            {!hiddenCols.has('assignee_plan') && <div className="flex items-center justify-center border-r border-slate-100 shrink-0 text-slate-600" style={{ width: COL_DEF.find(c=>c.id==='assignee_plan')?.width }}>{raw.assignee_plan}</div>}
            {!hiddenCols.has('assignee_it') && <div className="flex items-center justify-center border-r border-slate-100 shrink-0 text-indigo-600 font-medium" style={{ width: COL_DEF.find(c=>c.id==='assignee_it')?.width }}>{raw.assignee_it}</div>}
            {!hiddenCols.has('start_date') && <div className="flex items-center justify-center border-r border-slate-100 shrink-0 text-slate-500" style={{ width: COL_DEF.find(c=>c.id==='start_date')?.width }}>{raw.start_date}</div>}
            {!hiddenCols.has('end_date') && <div className="flex items-center justify-center border-r border-slate-100 shrink-0 text-slate-500" style={{ width: COL_DEF.find(c=>c.id==='end_date')?.width }}>{raw.end_date}</div>}
            {!hiddenCols.has('status') && <div className="flex items-center justify-center shrink-0" style={{ width: COL_DEF.find(c=>c.id==='status')?.width }}>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${raw.status === '개발제외' ? 'bg-slate-200 text-slate-500' : 'bg-indigo-50 text-indigo-600'}`}>{raw.status}</span>
            </div>}
          </div>
        );
      })}
    </div>
  );
};

const INITIAL_FORM_STATE = {
  project_id: '기본프로젝트', category: '', phase: '', area: '',
  req_id: '', req_name: '', req_desc: '', dev_direction: '신규', dev_priority: '3순위',
  screen_id: '', screen_name: '', assignee_plan: '', assignee_it: '',
  start_date: '', end_date: '', status: '시작전', progress: 0
};

export default function App() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);

  // 컨텍스트 및 UI 상태
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfigState] = useState<{ key: string, dir: 'asc'|'desc' } | null>(null);
  const [treeFilter, setTreeFilter] = useState({ selectedCategory: null as string | null, selectedPhase: null as string | null, selectedArea: null as string | null });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);

  // 모달 및 팝업 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>(INITIAL_FORM_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isWeeklyDashboardOpen, setIsWeeklyDashboardOpen] = useState(false);
  const [isMonthlyDashboardOpen, setIsMonthlyDashboardOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);

  // Supabase 데이터 로드
  const fetchTasks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('wbs_tasks_v2').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setTasks(data);
      setExpandedCategories(new Set(data.map(t => t.category).filter(Boolean)));
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  // CRUD 핸들러
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    let updates: any = { [name]: value };
    if (name === 'status') updates.progress = getProgressFromStatus(value);
    setFormData((prev: any) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    if (!formData.start_date || !formData.end_date) { alert('시작일과 종료일은 필수입니다!'); return; }
    setIsLoading(true);
    try {
      if (isEditing && formData.id) await supabase.from('wbs_tasks_v2').update(formData).eq('id', formData.id);
      else { const { id, ...newTask } = formData; await supabase.from('wbs_tasks_v2').insert([newTask]); }
      setIsModalOpen(false);
      fetchTasks();
    } catch (err: any) { alert('저장 실패: ' + err.message); }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!formData.id || !confirm('정말 삭제할까요?')) return;
    setIsLoading(true);
    await supabase.from('wbs_tasks_v2').delete().eq('id', formData.id);
    setIsModalOpen(false);
    fetchTasks();
  };

  const openModal = (task?: any) => {
    if (task) { const safeTask = JSON.parse(JSON.stringify(task)); setFormData(safeTask); setIsEditing(true); } 
    else { setFormData(INITIAL_FORM_STATE); setIsEditing(false); }
    setIsModalOpen(true);
  };

  const handleExcelUpload = async (newTasks: any[]) => {
    setIsLoading(true);
    try {
      const formattedTasks = newTasks.map(t => ({
        project_id: t.project_id || '기본프로젝트', category: t.category || '', phase: t.phase || '', area: t.area || '',
        req_id: t.req_id || '', req_name: t.req_name || '', req_desc: t.req_desc || '',
        dev_direction: t.dev_direction || '신규', dev_priority: t.dev_priority || '3순위',
        screen_id: t.screen_id || '', screen_name: t.screen_name || t.taskName || '',
        assignee_plan: t.assignee_plan || t.assigneePlan || '', assignee_it: t.assignee_it || t.assigneeIT || '',
        start_date: t.start instanceof Date ? t.start.toISOString().split('T')[0] : t.start_date,
        end_date: t.end instanceof Date ? t.end.toISOString().split('T')[0] : t.end_date,
        status: t.status || '시작전', progress: t.progress || 0
      }));
      await supabase.from('wbs_tasks_v2').insert(formattedTasks);
      fetchTasks();
      alert('엑셀 데이터가 DB에 성공적으로 업로드되었습니다!');
    } catch (err: any) { alert('엑셀 업로드 실패: ' + err.message); }
    setIsLoading(false);
  };

  // 컨텍스트 등록 (정렬, 숨기기)
  const toggleColVisibility = useCallback((col: string) => { setHiddenCols(prev => { const n = new Set(prev); n.has(col) ? n.delete(col) : n.add(col); return n; }); }, []);
  const setSortConfig = useCallback((key: string) => { setSortConfigState(prev => prev?.key === key && prev.dir === 'asc' ? { key, dir: 'desc' } : { key, dir: 'asc' }); }, []);
  const groupContextValue = useMemo(() => ({ hiddenCols, toggleColVisibility, sortConfig, setSortConfig }), [hiddenCols, sortConfig]);

  // 데이터 가공 로직
  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks.filter(t => {
      if (treeFilter.selectedCategory && t.category !== treeFilter.selectedCategory) return false;
      if (treeFilter.selectedPhase && t.phase !== treeFilter.selectedPhase) return false;
      if (treeFilter.selectedArea && t.area !== treeFilter.selectedArea) return false;
      return true;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let valA = String(a[sortConfig.key] || "");
        let valB = String(b[sortConfig.key] || "");
        if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [tasks, treeFilter, sortConfig]);

  const ganttTasks = filteredAndSortedTasks.map((t) => {
    let sd = new Date(t.start_date);
    let ed = new Date(t.end_date);
    if (isNaN(sd.getTime())) sd = new Date();
    if (isNaN(ed.getTime())) ed = new Date();
    return {
      id: t.id, name: t.req_name || t.screen_name || '(이름없음)',
      start: sd, end: ed, progress: t.progress || 0,
      dependencies: [], type: 'task',
      styles: { backgroundColor: '#38BDF8', progressColor: '#0284C7' },
      _raw: t, onDoubleClick: () => openModal(t)
    };
  });

  // 대시보드 및 엑셀용 호환 데이터 변환 (기존 기능 100% 호환용)
  const dashboardCompatibleTasks = useMemo(() => tasks.map(t => ({
    id: t.id, area: t.area, phase: t.phase, deliverable: t.req_name, taskName: t.screen_name,
    assigneePlan: t.assignee_plan, assigneeIT: t.assignee_it,
    start: new Date(t.start_date || Date.now()), end: new Date(t.end_date || Date.now()),
    progress: t.progress, status: t.status
  })), [tasks]);

  const categories = useMemo(() => [...new Set(tasks.map(t => t.category).filter(Boolean))], [tasks]);
  const phasesByCategory = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const cat of categories) map.set(cat, [...new Set(tasks.filter(t => t.category === cat).map(t => t.phase).filter(Boolean))]);
    return map;
  }, [tasks, categories]);
  const areasByCategoryPhase = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const [cat, phases] of phasesByCategory) {
      for (const phase of phases) map.set(`${cat}||${phase}`, [...new Set(tasks.filter(t => t.category === cat && t.phase === phase).map(t => t.area).filter(Boolean))]);
    }
    return map;
  }, [tasks, phasesByCategory]);

  const listWidth = COL_DEF.filter(c => !hiddenCols.has(c.id)).reduce((a, c) => a + c.width, 0);

  const resetFilter = () => setTreeFilter({ selectedCategory: null, selectedPhase: null, selectedArea: null });
  const toggleCategory = (cat: string) => setExpandedCategories(p => { const n = new Set(p); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  const togglePhase = (cat: string, phase: string) => setExpandedPhases(p => { const k = `${cat}||${phase}`; const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const selectFilter = (cat: string | null, phase: string | null, area: string | null) => setTreeFilter({ selectedCategory: cat, selectedPhase: phase, selectedArea: area });

  return (
    <GanttGroupContext.Provider value={groupContextValue}>
      <div className="w-screen h-screen bg-[#F1F5F9] flex flex-col overflow-hidden" style={{ fontFamily: "'Pretendard', sans-serif" }}>
        
        {/* 헤더 */}
        <header className="flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-md border-b border-slate-200 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-indigo-200 shadow-md"><LayoutDashboard className="w-5 h-5 text-white" /></div>
            <div>
              <h1 className="text-[17px] font-extrabold text-slate-800 leading-tight">프로젝트 관리 V2</h1>
              <p className="text-[11px] text-slate-500 font-bold tracking-tight">Supabase 통합 데이터 센터</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsArchitectureOpen(true)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-bold bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"><Network className="w-4 h-4" /> 로직 보기</button>
            {hiddenCols.size > 0 && <button onClick={() => setHiddenCols(new Set())} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"><RotateCcw className="w-3.5 h-3.5" /> 숨김 취소</button>}
            
            <div className="w-px h-6 bg-slate-200 mx-1" />
            
            <button onClick={() => setIsWeeklyDashboardOpen(true)} className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shadow-sm">주간 점검</button>
            <button onClick={() => setIsMonthlyDashboardOpen(true)} className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 shadow-sm"><CalendarDays className="w-4 h-4 inline mr-1" /> 월간 점검</button>
            <button onClick={() => setIsDashboardOpen(true)} className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold bg-indigo-600 text-white border border-indigo-500 hover:bg-indigo-700 shadow-md">전체 요약</button>
            
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <ExcelManager tasks={dashboardCompatibleTasks} visibleTasks={ganttTasks} onUpload={handleExcelUpload} />
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <button onClick={fetchTasks} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 bg-white"><RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} /></button>
            <button onClick={() => openModal()} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold text-[12px] hover:bg-black shadow-md flex items-center gap-2"><Plus className="w-4 h-4" /> 신규 등록</button>
            <div className="flex items-center gap-1 bg-slate-100/80 rounded-lg p-1 ml-1 border border-slate-200/50">
              {[{ l: "일", v: ViewMode.Day }, { l: "주", v: ViewMode.Week }, { l: "월", v: ViewMode.Month }].map((opt) => (
                <button key={opt.v} onClick={() => setViewMode(opt.v as ViewMode)} className={`px-4 py-1.5 rounded-md text-[12px] font-bold transition-all ${viewMode === opt.v ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{opt.l}</button>
              ))}
            </div>
          </div>
        </header>

        {/* 메인 뷰 */}
        <div className="flex flex-1 overflow-hidden p-3 gap-3">
          
          {/* 필터 트리 */}
          <div className="w-[230px] shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[12px] font-extrabold text-slate-700">분류 필터 트리</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <button onClick={resetFilter} className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-bold hover:bg-slate-100 flex items-center gap-2 mb-2"><BarChart2 className="w-3.5 h-3.5" /> 전체 보기</button>
              {categories.map(cat => {
                const isCatExp = expandedCategories.has(cat);
                const isCatSel = treeFilter.selectedCategory === cat;
                return (
                  <div key={cat} className="mb-1">
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleCategory(cat)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">{isCatExp ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</button>
                      <button onClick={() => selectFilter(cat, null, null)} className={`flex-1 text-left px-2 py-1.5 rounded-lg text-[12px] font-bold ${isCatSel ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`}>{cat}</button>
                    </div>
                    {isCatExp && (
                      <div className="pl-5 mt-0.5 border-l border-slate-100 ml-2.5">
                        {(phasesByCategory.get(cat) || []).map(phase => {
                          const isPhaseExp = expandedPhases.has(`${cat}||${phase}`);
                          const isPhaseSel = isCatSel && treeFilter.selectedPhase === phase;
                          return (
                            <div key={phase} className="mt-0.5">
                              <div className="flex items-center gap-1">
                                <button onClick={() => togglePhase(cat, phase)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">{isPhaseExp ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}</button>
                                <button onClick={() => selectFilter(cat, phase, null)} className={`flex-1 text-left px-2 py-1.5 rounded-lg text-[11px] font-bold ${isPhaseSel ? "bg-indigo-50/70 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}>{phase}</button>
                              </div>
                              {isPhaseExp && (
                                <div className="pl-6 mt-0.5">
                                  {(areasByCategoryPhase.get(`${cat}||${phase}`) || []).map(area => {
                                    const isAreaSel = isPhaseSel && treeFilter.selectedArea === area;
                                    return (
                                      <button key={area} onClick={() => selectFilter(cat, phase, area)} className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] font-semibold mt-0.5 ${isAreaSel ? "bg-blue-50/70 text-blue-600 font-bold" : "text-slate-500 hover:bg-slate-50"}`}>{area}</button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 간트 차트 (가로 스크롤 대응) */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden bg-white border border-slate-200 rounded-xl shadow-sm gantt-wrapper">
            <div style={{ minWidth: '2400px', height: '100%' }}>
              {ganttTasks.length > 0 ? (
                <Gantt 
                  tasks={ganttTasks} 
                  viewMode={viewMode} 
                  listCellWidth={String(listWidth)} 
                  columnWidth={viewMode === ViewMode.Day ? 60 : viewMode === ViewMode.Week ? 150 : 300} 
                  rowHeight={38}
                  headerHeight={48} 
                  barCornerRadius={6}
                  barFill={70} 
                  fontSize="12" 
                  locale="ko-KR" 
                  TaskListHeader={V2TaskListHeader} 
                  TaskListTable={V2TaskListTable}   
                  todayColor="rgba(99, 102, 241, 0.04)" 
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 font-bold text-sm">해당 필터에 데이터가 없습니다.</div>
              )}
            </div>
          </div>
        </div>

        {/* 팝업 컴포넌트들 */}
        {isDashboardOpen && <DashboardPopup tasks={dashboardCompatibleTasks} onClose={() => setIsDashboardOpen(false)} />}
        {isWeeklyDashboardOpen && <WeeklyDashboardPopup tasks={dashboardCompatibleTasks} onClose={() => setIsWeeklyDashboardOpen(false)} />}
        {isMonthlyDashboardOpen && <MonthlyDashboardPopup tasks={dashboardCompatibleTasks} onClose={() => setIsMonthlyDashboardOpen(false)} />}
        {isArchitectureOpen && <ArchitecturePopup onClose={() => setIsArchitectureOpen(false)} />}

        {/* 신규 등록/수정 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex justify-center items-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-[800px] max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                  <h2 className="text-lg font-black text-slate-800">{isEditing ? '업무 상세 수정' : '신규 업무 등록'}</h2>
                  <div className="flex gap-2">
                    {isEditing && <button onClick={handleDelete} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                    <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5" /></button>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">범용성</label><input name="project_id" value={formData.project_id || ''} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                    <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">카테고리</label><input name="category" value={formData.category || ''} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                    <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">단계</label><input name="phase" value={formData.phase || ''} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                    <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">구분</label><input name="area" value={formData.area || ''} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">요구사항ID</label><input name="req_id" value={formData.req_id || ''} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                    <div className="col-span-2"><label className="block text-xs font-bold mb-1 text-slate-500">요구사항명</label><input name="req_name" value={formData.req_name || ''} onChange={handleChange} className="w-full p-2 border rounded font-bold" /></div>
                    <div className="col-span-3"><label className="block text-xs font-bold mb-1 text-slate-500">요구사항 내용</label><textarea name="req_desc" value={formData.req_desc || ''} onChange={handleChange} rows={2} className="w-full p-2 border rounded" /></div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1">
                      <label className="block text-xs font-bold mb-1 text-slate-500">개발방향</label>
                      <select name="dev_direction" value={formData.dev_direction || '신규'} onChange={handleChange} className="w-full p-2 border rounded">
                        <option value="신규">신규</option><option value="수정">수정</option><option value="삭제">삭제</option>
                      </select>
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-bold mb-1 text-slate-500">우선순위</label>
                      <select name="dev_priority" value={formData.dev_priority || '3순위'} onChange={handleChange} className="w-full p-2 border rounded">
                        <option value="1순위">1순위</option><option value="2순위">2순위</option><option value="3순위">3순위</option><option value="4순위">4순위</option><option value="5순위">5순위</option>
                      </select>
                    </div>
                    <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">화면ID</label><input name="screen_id" value={formData.screen_id || ''} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                    <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">화면명</label><input name="screen_name" value={formData.screen_name || ''} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">시작일</label><input type="date" name="start_date" value={formData.start_date || ''} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                    <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">종료일</label><input type="date" name="end_date" value={formData.end_date || ''} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                    <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">기획 담당</label><input name="assignee_plan" value={formData.assignee_plan || ''} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                    <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">IT 담당</label><input name="assignee_it" value={formData.assignee_it || ''} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <div>
                      <label className="block text-xs font-extrabold mb-1 text-indigo-800">상태</label>
                      <select name="status" value={formData.status || '시작전'} onChange={handleChange} className="w-full p-2 border border-indigo-200 rounded font-bold text-indigo-700 outline-none">
                        <option value="시작전">시작전 (0%)</option><option value="진행중">진행중 (20%)</option><option value="개발완료">개발완료 (40%)</option>
                        <option value="단위테스트중">단위테스트중 (50%)</option><option value="수정필요">수정필요 (60%)</option><option value="최종완료">최종완료 (100%)</option>
                        <option value="보류중">보류중 (0%)</option><option value="개발제외">개발제외 (0%)</option>
                      </select>
                    </div>
                    <div><label className="block text-xs font-extrabold mb-1 text-indigo-800">진행률</label><div className="w-full p-2 border border-indigo-200 rounded bg-white text-indigo-600 font-black text-center">{formData.progress}%</div></div>
                  </div>
               </div>
               
               <div className="px-6 py-4 bg-slate-50 border-t shrink-0">
                 <button onClick={handleSave} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-extrabold text-sm hover:bg-indigo-700 shadow-md flex justify-center items-center gap-2">
                    <Save className="w-5 h-5" /> 저장 완료
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </GanttGroupContext.Provider>
  );
}