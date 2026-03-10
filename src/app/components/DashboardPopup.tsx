import React from "react";
import { X, CheckCircle2, ListTodo, TrendingUp, BarChart } from "lucide-react";
import { WBSTask } from "./mockData";

interface Props {
  tasks: WBSTask[];
  onClose?: () => void;
  isStandalone?: boolean; 
}

export default function DashboardPopup({ tasks, onClose, isStandalone = false }: Props) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "완료").length;
  const progressRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const areaStats = tasks.reduce((acc, task) => {
    if (!task.area) return acc;
    if (!acc[task.area]) acc[task.area] = { total: 0, completed: 0 };
    acc[task.area].total += 1;
    if (task.status === "완료") acc[task.area].completed += 1;
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  if (isStandalone) {
    return (
      <div className="w-screen h-screen bg-white flex flex-col overflow-hidden font-sans">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <BarChart className="w-6 h-6 text-indigo-600" />
          <h2 className="text-[18px] font-bold text-slate-800 tracking-tight">프로젝트 진행 요약</h2>
        </div>
        <DashboardContent progressRate={progressRate} totalTasks={totalTasks} completedTasks={completedTasks} areaStats={areaStats} />
      </div>
    );
  }

  // 🚀 모달의 세로 길이를 대폭 확장 (h-[850px], max-h-[95vh])하여 스크롤 발생 방지
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[900px] h-[850px] max-h-[95vh] flex flex-col overflow-hidden relative border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <BarChart className="w-5 h-5 text-indigo-600" />
            <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">프로젝트 진행 요약</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <DashboardContent progressRate={progressRate} totalTasks={totalTasks} completedTasks={completedTasks} areaStats={areaStats} />
      </div>
    </div>
  );
}

function DashboardContent({ progressRate, totalTasks, completedTasks, areaStats }: any) {
  return (
    <div className="flex-1 p-6 bg-[#F8FAFC] flex flex-col gap-6 overflow-y-auto">
      <div className="grid grid-cols-3 gap-5 shrink-0">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <div>
            <p className="text-[13px] font-bold text-slate-500 mb-1">전체 진행률</p>
            <div className="flex items-baseline gap-1">
              <p className="text-[32px] font-extrabold text-slate-800 leading-none">{progressRate}</p>
              <span className="text-[18px] font-bold text-slate-400">%</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-blue-600" /></div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-400"></div>
          <div>
            <p className="text-[13px] font-bold text-slate-500 mb-1">전체 작업</p>
            <div className="flex items-baseline gap-1">
              <p className="text-[32px] font-extrabold text-slate-800 leading-none">{totalTasks}</p>
              <span className="text-[14px] font-bold text-slate-400">개</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center"><ListTodo className="w-6 h-6 text-slate-600" /></div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div>
            <p className="text-[13px] font-bold text-slate-500 mb-1">완료 작업</p>
            <div className="flex items-baseline gap-1">
              <p className="text-[32px] font-extrabold text-slate-800 leading-none">{completedTasks}</p>
              <span className="text-[14px] font-bold text-slate-400">개</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 shrink-0"><h3 className="text-[14px] font-bold text-slate-800">구분별 상세 달성률</h3></div>
        <div className="p-6 overflow-y-auto space-y-6">
          {Object.entries(areaStats).map(([area, stats]: any) => {
            const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            return (
              <div key={area} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-bold text-slate-700 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-400"></span>{area}</span>
                  <div className="text-[13px] text-slate-500 font-medium"><span className="text-blue-600 font-bold mr-2">{rate}%</span> <span className="text-slate-400">({stats.completed} / {stats.total})</span></div>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${rate}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
