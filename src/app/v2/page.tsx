"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Edit2, Trash2, Save, X, RefreshCw, LayoutDashboard } from 'lucide-react';

// 🌟 V2: 깃허브 페이지용 다이렉트 하드코딩 (환경변수 에러 방지)
const supabaseUrl = 'https://cbogmikpdlmwgluahcnz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib2dtaWtwZGxtd2dsdWFoY256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDIxMjksImV4cCI6MjA4Nzc3ODEyOX0.nagpgjcC7fbk5Bsi812giOSkiKGHG-Y-UZwWndwFbmY';
const supabase = createClient(supabaseUrl, supabaseKey);

// V2 테이블 타입 정의
interface TaskV2 {
  id?: string;
  project_id: string;
  category: string;
  phase: string;
  area: string;
  req_id: string;
  req_name: string;
  req_desc: string;
  dev_direction: string;
  dev_priority: string;
  screen_id: string;
  screen_name: string;
  assignee_plan: string;
  assignee_it: string;
  start_date: string;
  end_date: string;
  progress: number;
  status: string;
}

const INITIAL_FORM_STATE: TaskV2 = {
  project_id: 'DEFAULT_PROJECT',
  category: '', phase: '', area: '',
  req_id: '', req_name: '', req_desc: '',
  dev_direction: '', dev_priority: '', screen_id: '', screen_name: '',
  assignee_plan: '', assignee_it: '',
  start_date: '', end_date: '',
  progress: 0, status: '시작전'
};

export default function V2AdminPage() {
  const [tasks, setTasks] = useState<TaskV2[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<TaskV2>(INITIAL_FORM_STATE);
  const [isEditing, setIsEditing] = useState(false);

  // 🌟 데이터 불러오기 (Read)
  const fetchTasks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('wbs_tasks_v2')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    } else {
      setTasks(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // 🌟 폼 입력 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 🌟 데이터 저장 (Create & Update)
  const handleSave = async () => {
    if (!formData.req_name || !formData.start_date || !formData.end_date) {
      alert('요구사항명, 시작일, 종료일은 필수 입력값입니다.');
      return;
    }

    setIsLoading(true);
    if (isEditing && formData.id) {
      // 수정
      const { error } = await supabase.from('wbs_tasks_v2').update(formData).eq('id', formData.id);
      if (error) alert('수정 실패: ' + error.message);
    } else {
      // 신규 생성
      const { id, ...newTask } = formData; // id는 빼고 insert
      const { error } = await supabase.from('wbs_tasks_v2').insert([newTask]);
      if (error) alert('저장 실패: ' + error.message);
    }
    
    setIsModalOpen(false);
    fetchTasks(); // 목록 갱신
  };

  // 🌟 데이터 삭제 (Delete)
  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 항목을 삭제하시겠습니까?')) return;
    
    setIsLoading(true);
    const { error } = await supabase.from('wbs_tasks_v2').delete().eq('id', id);
    if (error) alert('삭제 실패: ' + error.message);
    else fetchTasks();
  };

  // 모달 열기 (신규/수정)
  const openModal = (task?: TaskV2) => {
    if (task) {
      setFormData(task);
      setIsEditing(true);
    } else {
      setFormData(INITIAL_FORM_STATE);
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      <div className="max-w-[1600px] mx-auto flex flex-col h-[90vh]">
        
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <LayoutDashboard className="w-7 h-7 text-indigo-600" />
              대시보드 V2 통합 관리자
            </h1>
            <p className="text-slate-500 text-sm mt-1">DB 연동형 차세대 WBS 프로젝트 관리 시스템</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchTasks} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 font-bold text-sm transition-colors text-slate-600">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
            <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 font-bold text-sm transition-colors">
              <Plus className="w-4 h-4" />
              신규 업무 등록
            </button>
          </div>
        </div>

        {/* 데이터 테이블 영역 (엑셀 뷰) */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm border-b border-slate-200">
                <tr className="text-[12px] font-bold text-slate-600">
                  <th className="p-3 border-r border-slate-200">관리</th>
                  <th className="p-3 border-r border-slate-200">상태</th>
                  <th className="p-3 border-r border-slate-200">진행률</th>
                  <th className="p-3 border-r border-slate-200">프로젝트</th>
                  <th className="p-3 border-r border-slate-200">단계/구분</th>
                  <th className="p-3 border-r border-slate-200">요구사항ID/명</th>
                  <th className="p-3 border-r border-slate-200">화면명 (Task)</th>
                  <th className="p-3 border-r border-slate-200">담당자(기획/IT)</th>
                  <th className="p-3">일정 (시작~종료)</th>
                </tr>
              </thead>
              <tbody className="overflow-y-auto">
                {isLoading && tasks.length === 0 ? (
                  <tr><td colSpan={9} className="p-10 text-center text-slate-400">데이터를 불러오는 중입니다...</td></tr>
                ) : tasks.length === 0 ? (
                  <tr><td colSpan={9} className="p-10 text-center text-slate-400">등록된 데이터가 없습니다. 우측 상단의 '신규 업무 등록'을 눌러주세요.</td></tr>
                ) : (
                  tasks.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors text-[13px] text-slate-700">
                      <td className="p-3 border-r border-slate-100">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openModal(t)} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => t.id && handleDelete(t.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                      <td className="p-3 border-r border-slate-100 font-bold">
                        <span className="px-2 py-1 bg-slate-100 rounded text-[11px]">{t.status}</span>
                      </td>
                      <td className="p-3 border-r border-slate-100 font-extrabold text-indigo-600">{t.progress}%</td>
                      <td className="p-3 border-r border-slate-100 text-slate-500">{t.project_id}</td>
                      <td className="p-3 border-r border-slate-100">
                        <span className="font-bold text-slate-800">{t.phase}</span> <span className="text-slate-400">|</span> {t.area}
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <span className="text-slate-400 text-[11px] block">{t.req_id}</span>
                        <span className="font-bold">{t.req_name}</span>
                      </td>
                      <td className="p-3 border-r border-slate-100 font-bold">{t.screen_name}</td>
                      <td className="p-3 border-r border-slate-100">
                        {t.assignee_plan} <span className="text-slate-300">/</span> <span className="text-indigo-600">{t.assignee_it}</span>
                      </td>
                      <td className="p-3 text-slate-500 font-medium">
                        {t.start_date} ~ {t.end_date}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🌟 입력/수정 모달 (사이드 패널 형태) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="w-[800px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                {isEditing ? <Edit2 className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                {isEditing ? '업무 정보 수정' : '신규 업무 등록'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* 섹션 1: 분류 정보 */}
              <section>
                <h3 className="text-sm font-extrabold text-indigo-900 border-b border-indigo-100 pb-2 mb-4">1. 기본 분류 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">프로젝트 식별자 (범용성)</label><input name="project_id" value={formData.project_id} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded text-sm bg-slate-50" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">카테고리</label><input name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">단계 (Phase)</label><input name="phase" value={formData.phase} onChange={handleChange} placeholder="예: 구축, 테스트" className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">구분 (Area)</label><input name="area" value={formData.area} onChange={handleChange} placeholder="예: 공통, 물류, SCM" className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500" /></div>
                </div>
              </section>

              {/* 섹션 2: 요구사항 및 화면 정보 */}
              <section>
                <h3 className="text-sm font-extrabold text-indigo-900 border-b border-indigo-100 pb-2 mb-4">2. 요구사항 및 개발 상세</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">요구사항 ID</label><input name="req_id" value={formData.req_id} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">요구사항명 *</label><input name="req_name" value={formData.req_name} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm bg-indigo-50/30" /></div>
                  <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">요구사항 상세 내용</label><textarea name="req_desc" value={formData.req_desc} onChange={handleChange} rows={2} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                  
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">화면 ID</label><input name="screen_id" value={formData.screen_id} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">화면명 (Task 명)</label><input name="screen_name" value={formData.screen_name} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">개발방향</label><input name="dev_direction" value={formData.dev_direction} onChange={handleChange} placeholder="신규, 수정 등" className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">우선순위</label><input name="dev_priority" value={formData.dev_priority} onChange={handleChange} placeholder="H, M, L" className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                </div>
              </section>

              {/* 섹션 3: 일정, 담당자, 진척률 */}
              <section>
                <h3 className="text-sm font-extrabold text-indigo-900 border-b border-indigo-100 pb-2 mb-4">3. 일정 및 담당자 배정</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">담당자 (기획)</label><input name="assignee_plan" value={formData.assignee_plan} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">담당자 (IT)</label><input name="assignee_it" value={formData.assignee_it} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">시작일 *</label><input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">종료일 *</label><input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm" /></div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">상태</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded text-sm bg-white">
                      <option value="시작전">시작전</option>
                      <option value="진행중">진행중</option>
                      <option value="개발완료">개발완료</option>
                      <option value="단위테스트중">단위테스트중</option>
                      <option value="최종완료">최종완료</option>
                      <option value="수정필요">수정필요</option>
                      <option value="개발제외">개발제외</option>
                      <option value="보류중">보류중</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">진행률 (%)</label>
                    <div className="flex items-center gap-2">
                      <input type="range" name="progress" min="0" max="100" value={formData.progress} onChange={handleChange} className="flex-1 accent-indigo-600" />
                      <span className="w-12 text-right font-bold text-indigo-600">{formData.progress}%</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors">취소</button>
              <button onClick={handleSave} className="px-5 py-2.5 rounded-lg font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 shadow-md transition-colors">
                <Save className="w-4 h-4" />
                {isLoading ? '저장 중...' : '데이터 저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
