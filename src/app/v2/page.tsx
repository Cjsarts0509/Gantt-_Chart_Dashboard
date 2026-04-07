import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { Plus, Save, X, RefreshCw, LayoutDashboard, ChevronDown, ChevronRight, BarChart2 } from 'lucide-react';
import "../components/gantt-overrides.css";

// 🌟 Supabase 설정
const supabaseUrl = 'https://cbogmikpdlmwgluahcnz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib2dtaWtwZGxtd2dsdWFoY256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDIxMjksImV4cCI6MjA4Nzc3ODEyOX0.nagpgjcC7fbk5Bsi812giOSkiKGHG-Y-UZwWndwFbmY';
const supabase = createClient(supabaseUrl, supabaseKey);

// 🌟 상태에 따른 진행률 자동 세팅 로직
const getProgressFromStatus = (status: string) => {
  switch(status) {
    case '시작전': return 0;
    case '진행중': return 20;
    case '개발완료': return 40;
    case '단위테스트중': return 50;
    case '최종완료': return 100;
    case '수정필요': return 60;
    case '개발제외': return 0;
    case '보류중': return 0;
    default: return 0;
  }
};

// 🌟 칼럼 너비 설정 (총 너비 약 1540px)
const COL_WIDTHS = {
  project_id: 100, category: 80, phase: 80, area: 80,
  req_id: 90, req_name: 180, req_desc: 200,
  dev_direction: 80, dev_priority: 80,
  screen_id: 100, screen_name: 150,
  assignee_plan: 80, assignee_it: 80,
  start_date: 90, end_date: 90, status: 80
};

// 🌟 간트 차트 좌측 커스텀 헤더
const AdminTaskListHeader = ({ headerHeight, fontFamily, fontSize }: any) => {
  return (
    <div className="flex border-b border-slate-200 bg-slate-100 text-slate-600 font-bold" style={{ height: headerHeight, fontFamily, fontSize: '11px' }}>
      <div className="flex items-center justify-center border-r border-slate-200 shrink-0" style={{ width: COL_WIDTHS.project_id }}>범용성</div>
      <div className="flex items-center justify-center border-r border-slate-200 shrink-0" style={{ width: COL_WIDTHS.category }}>카테고리</div>
      <div className="flex items-center justify-center border-r border-slate-200 shrink-0" style={{ width: COL_WIDTHS.phase }}>단계</div>
      <div className="flex items-center justify-center border-r border-slate-200 shrink-0" style={{ width: COL_WIDTHS.area }}>구분</div>
      <div className="flex items-center justify-center border-r border-slate-200 shrink-0" style={{ width: COL_WIDTHS.req_id }}>요구사항ID</div>
      <div className="flex items-center justify-center border-r border-slate-200 shrink-0" style={{ width: COL_WIDTHS.req_name }}>요구사항명</div>
      <div className="flex items-center justify-center border-r border-slate-200 shrink-0" style={{ width: COL_WIDTHS.req_desc }}>요구사항 내용</div>
      <div className="flex items-center justify-center border-r border-slate-200 shrink-0" style={{ width: COL_WIDTHS.dev_direction }}>개발방향</div>
      <div className="flex items-center justify-center border-r border-slate-200 shrink-0" style={{ width: COL_WIDTHS.dev_priority }}>개발순위</div>
      <div className="flex items-center justify-center border-r border-slate-200 shrink-0" style={{ width: COL_WIDTHS.screen_id }}>화면ID</div>
      <div className="flex items-center justify-center border-r border-slate-200 shrink-0" style={{ width: COL_WIDTHS.screen_name }}>화면명</div>
      <div className="flex items-center justify-center border-r border-slate-200 shrink-0" style={{ width: COL_WIDTHS.assignee_plan }}>담당자(기획)</div>
      <div className="flex items-center justify-center border-r border-slate-200 shrink-0" style={{ width: COL_WIDTHS.assignee_it }}>담당자(IT)</div>
      <div className="flex items-center justify-center border-r border-slate-200 shrink-0" style={{ width: COL_WIDTHS.start_date }}>시작일</div>
      <div className="flex items-center justify-center border-r border-slate-200 shrink-0" style={{ width: COL_WIDTHS.end_date }}>종료일</div>
      <div className="flex items-center justify-center shrink-0" style={{ width: COL_WIDTHS.status }}>상태</div>
    </div>
  );
};

// 🌟 간트 차트 좌측 커스텀 데이터 줄(Row)
const AdminTaskListTable = ({ rowHeight, rowWidth, tasks, fontFamily, fontSize }: any) => {
  return (
    <div style={{ fontFamily, fontSize: '11px' }}>
      {tasks.map((t: any) => {
        const raw = t._raw || {};
        return (
          <div 
            key={t.id} 
            className="flex border-b border-slate-100 hover:bg-indigo-50/40 transition-colors cursor-pointer" 
            style={{ height: rowHeight, width: rowWidth }}
            onDoubleClick={t.onDoubleClick} // 더블클릭 시 수정 모달 오픈
            title="더블클릭하여 수정하세요"
          >
            <div className="flex items-center px-2 border-r border-slate-100 shrink-0 truncate text-slate-500" style={{ width: COL_WIDTHS.project_id }}>{raw.project_id}</div>
            <div className="flex items-center justify-center border-r border-slate-100 shrink-0" style={{ width: COL_WIDTHS.category }}>{raw.category}</div>
            <div className="flex items-center justify-center border-r border-slate-100 shrink-0 font-bold" style={{ width: COL_WIDTHS.phase }}>{raw.phase}</div>
            <div className="flex items-center justify-center border-r border-slate-100 shrink-0" style={{ width: COL_WIDTHS.area }}>{raw.area}</div>
            <div className="flex items-center px-2 border-r border-slate-100 shrink-0 text-[10px] text-slate-400" style={{ width: COL_WIDTHS.req_id }}>{raw.req_id}</div>
            <div className="flex items-center px-2 border-r border-slate-100 shrink-0 font-bold text-slate-700 truncate" style={{ width: COL_WIDTHS.req_name }}>{raw.req_name}</div>
            <div className="flex items-center px-2 border-r border-slate-100 shrink-0 truncate text-slate-500" style={{ width: COL_WIDTHS.req_desc }}>{raw.req_desc}</div>
            <div className="flex items-center justify-center border-r border-slate-100 shrink-0" style={{ width: COL_WIDTHS.dev_direction }}>{raw.dev_direction}</div>
            <div className="flex items-center justify-center border-r border-slate-100 shrink-0" style={{ width: COL_WIDTHS.dev_priority }}>{raw.dev_priority}</div>
            <div className="flex items-center px-2 border-r border-slate-100 shrink-0 text-[10px] text-slate-400 truncate" style={{ width: COL_WIDTHS.screen_id }}>{raw.screen_id}</div>
            <div className="flex items-center px-2 border-r border-slate-100 shrink-0 font-bold text-slate-700 truncate" style={{ width: COL_WIDTHS.screen_name }}>{raw.screen_name}</div>
            <div className="flex items-center justify-center border-r border-slate-100 shrink-0 text-slate-600" style={{ width: COL_WIDTHS.assignee_plan }}>{raw.assignee_plan}</div>
            <div className="flex items-center justify-center border-r border-slate-100 shrink-0 text-indigo-600 font-medium" style={{ width: COL_WIDTHS.assignee_it }}>{raw.assignee_it}</div>
            <div className="flex items-center justify-center border-r border-slate-100 shrink-0 text-slate-500" style={{ width: COL_WIDTHS.start_date }}>{raw.start_date}</div>
            <div className="flex items-center justify-center border-r border-slate-100 shrink-0 text-slate-500" style={{ width: COL_WIDTHS.end_date }}>{raw.end_date}</div>
            <div className="flex items-center justify-center shrink-0" style={{ width: COL_WIDTHS.status }}>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${raw.status === '개발제외' ? 'bg-slate-200 text-slate-500' : 'bg-indigo-50 text-indigo-600'}`}>
                {raw.status}
              </span>
            </div>
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

export default function V2AdminPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>(INITIAL_FORM_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);

  // 필터 관련 상태 (카테고리 -> 단계 -> 구분)
  const [treeFilter, setTreeFilter] = useState({ selectedCategory: null as string | null, selectedPhase: null as string | null, selectedArea: null as string | null });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const fetchTasks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('wbs_tasks_v2').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setTasks(data);
      // 데이터 불러오면 자동으로 최상위 카테고리는 열어두기
      setExpandedCategories(new Set(data.map(t => t.category).filter(Boolean)));
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    let updates: any = { [name]: value };
    
    // 상태값이 변하면 진행률 자동 세팅
    if (name === 'status') {
      updates.progress = getProgressFromStatus(value);
    }
    setFormData((prev: any) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    if (!formData.start_date || !formData.end_date) {
      alert('시작일과 종료일은 필수입니다!'); return;
    }
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
    if (task) { setFormData(task); setIsEditing(true); } 
    else { setFormData(INITIAL_FORM_STATE); setIsEditing(false); }
    setIsModalOpen(true);
  };

  // 🌟 필터용 데이터 추출 (카테고리 -> 단계 -> 구분)
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

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (treeFilter.selectedCategory && t.category !== treeFilter.selectedCategory) return false;
      if (treeFilter.selectedPhase && t.phase !== treeFilter.selectedPhase) return false;
      if (treeFilter.selectedArea && t.area !== treeFilter.selectedArea) return false;
      return true;
    });
  }, [tasks, treeFilter]);

  // 🌟 Gantt 컴포넌트용 데이터 변환
  const ganttTasks = useMemo(() => {
    if (filteredTasks.length === 0) return [];
    return filteredTasks.map((t) => {
      let sd = new Date(t.start_date);
      let ed = new Date(t.end_date);
      if (isNaN(sd.getTime())) sd = new Date();
      if (isNaN(ed.getTime())) ed = new Date();

      return {
        id: t.id,
        name: t.req_name || t.screen_name || '(이름없음)',
        start: sd,
        end: ed,
        progress: t.progress || 0,
        dependencies: [],
        type: 'task',
        styles: { backgroundColor: '#38BDF8', progressColor: '#0284C7' },
        _raw: t, // 커스텀 테이블 렌더링용 원본 데이터 보존
        onDoubleClick: () => openModal(t) // 🌟 더블클릭 이벤트 연결
      };
    });
  }, [filteredTasks]);

  const listWidth = Object.values(COL_WIDTHS).reduce((a, b) => a + b, 0); // 총 1540px

  const toggleCategory = (cat: string) => setExpandedCategories(p => { const n = new Set(p); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  const togglePhase = (cat: string, phase: string) => setExpandedPhases(p => { const k = `${cat}||${phase}`; const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const selectFilter = (cat: string | null, phase: string | null, area: string | null) => setTreeFilter({ selectedCategory: cat, selectedPhase: phase, selectedArea: area });

  return (
    <div className="w-full h-screen bg-[#F1F5F9] flex flex-col font-sans overflow-hidden">
      
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/95 border-b border-slate-200 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shadow-md"><LayoutDashboard className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="text-[17px] font-extrabold text-slate-800 leading-tight">대시보드 V2 데이터 센터</h1>
            <p className="text-[11px] text-slate-500 font-bold tracking-tight">Supabase DB 실시간 연동 모드</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {[{ l: "일", v: ViewMode.Day }, { l: "주", v: ViewMode.Week }, { l: "월", v: ViewMode.Month }].map((opt) => (
              <button key={opt.v} onClick={() => setViewMode(opt.v as ViewMode)} className={`px-4 py-1.5 rounded-md text-[12px] font-bold ${viewMode === opt.v ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{opt.l}</button>
            ))}
          </div>
          <button onClick={fetchTasks} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 bg-white shadow-sm"><RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} /></button>
          <button onClick={() => openModal()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-[12px] hover:bg-indigo-700 flex items-center gap-2 shadow-md">
            <Plus className="w-4 h-4" /> 신규 업무 등록
          </button>
        </div>
      </div>

      {/* 메인 영역 (좌측 사이드바 + 우측 간트차트) */}
      <div className="flex flex-1 overflow-hidden p-3 gap-3">
        
        {/* 🌟 좌측 필터 패널 (카테고리 -> 단계 -> 구분) */}
        <div className="w-[230px] shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-3 bg-slate-50 border-b border-slate-100"><span className="text-[12px] font-extrabold text-slate-700">분류 필터 트리</span></div>
          <div className="flex-1 overflow-y-auto p-2">
            <button onClick={() => selectFilter(null, null, null)} className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-bold hover:bg-slate-100 flex items-center gap-2 mb-2"><BarChart2 className="w-3.5 h-3.5" /> 전체 보기</button>
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

        {/* 🌟 우측 간트 차트 (데이터 그리드 포함) */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm gantt-wrapper">
          {ganttTasks.length > 0 ? (
            <Gantt 
              tasks={ganttTasks} 
              viewMode={viewMode} 
              listCellWidth={String(listWidth)} // 15개 칼럼 전체 너비 할당
              columnWidth={viewMode === ViewMode.Day ? 60 : viewMode === ViewMode.Week ? 150 : 300} 
              rowHeight={38}
              headerHeight={48} 
              barCornerRadius={6}
              barFill={70} 
              fontSize="12" 
              locale="ko-KR" 
              TaskListHeader={AdminTaskListHeader} // 🌟 15개 쫙 펼친 헤더
              TaskListTable={AdminTaskListTable}   // 🌟 15개 쫙 펼친 바디 (더블클릭 지원)
              todayColor="rgba(99, 102, 241, 0.04)" 
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 font-bold text-sm">해당 필터에 데이터가 없습니다. (혹은 로딩 중)</div>
          )}
        </div>
      </div>

      {/* 🌟 수정/등록 모달 팝업 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-center items-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-[800px] max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                <h2 className="text-lg font-black text-slate-800">{isEditing ? '업무 상세 수정' : '신규 업무 등록'}</h2>
                <div className="flex gap-2">
                  {isEditing && <button onClick={handleDelete} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg font-bold text-xs"><Trash2 className="w-4 h-4" /></button>}
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">범용성(프로젝트)</label><input name="project_id" value={formData.project_id} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm bg-slate-50" /></div>
                  <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">카테고리</label><input name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                  <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">단계</label><input name="phase" value={formData.phase} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                  <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">구분</label><input name="area" value={formData.area} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">요구사항ID</label><input name="req_id" value={formData.req_id} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                  <div className="col-span-2"><label className="block text-xs font-bold mb-1 text-slate-500">요구사항명</label><input name="req_name" value={formData.req_name} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm bg-indigo-50/30 font-bold" /></div>
                  <div className="col-span-3"><label className="block text-xs font-bold mb-1 text-slate-500">요구사항 내용</label><textarea name="req_desc" value={formData.req_desc} onChange={handleChange} rows={2} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold mb-1 text-slate-500">개발방향</label>
                    <select name="dev_direction" value={formData.dev_direction} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm bg-white">
                      <option value="신규">신규</option><option value="수정">수정</option><option value="삭제">삭제</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold mb-1 text-slate-500">우선순위</label>
                    <select name="dev_priority" value={formData.dev_priority} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm bg-white">
                      <option value="1순위">1순위</option><option value="2순위">2순위</option><option value="3순위">3순위</option><option value="4순위">4순위</option><option value="5순위">5순위</option>
                    </select>
                  </div>
                  <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">화면ID</label><input name="screen_id" value={formData.screen_id} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                  <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">화면명</label><input name="screen_name" value={formData.screen_name} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                </div>

                <div className="grid grid-cols-4 gap-4 border-t border-slate-100 pt-4">
                  <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">시작일</label><input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                  <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">종료일</label><input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                  <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">담당자(기획)</label><input name="assignee_plan" value={formData.assignee_plan} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                  <div className="col-span-1"><label className="block text-xs font-bold mb-1 text-slate-500">담당자(IT)</label><input name="assignee_it" value={formData.assignee_it} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  <div>
                    <label className="block text-xs font-extrabold mb-1 text-indigo-800">상태 (상태 변경 시 진행률 자동 세팅)</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border border-indigo-200 rounded text-sm bg-white font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="시작전">시작전 (0%)</option>
                      <option value="진행중">진행중 (20%)</option>
                      <option value="개발완료">개발완료 (40%)</option>
                      <option value="단위테스트중">단위테스트중 (50%)</option>
                      <option value="수정필요">수정필요 (60%)</option>
                      <option value="최종완료">최종완료 (100%)</option>
                      <option value="보류중">보류중 (0%, 집계포함)</option>
                      <option value="개발제외">개발제외 (0%, 집계제외)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold mb-1 text-indigo-800">자동 환산 진행률</label>
                    <div className="w-full p-2 border border-indigo-200 rounded text-sm bg-white/50 text-indigo-600 font-black text-center">
                      {formData.progress}%
                    </div>
                  </div>
                </div>
             </div>
             
             <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
               <button onClick={handleSave} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-extrabold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all">
                  <Save className="w-5 h-5" /> 데이터 저장 완료하기
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}