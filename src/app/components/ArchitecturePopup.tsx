import React from "react";
import { X, Network } from "lucide-react";

const architectureText = `[ 📊 1. 원본 데이터 (SharePoint) ]               [ ⚡ 2. 배달 (Power Automate & Mail) ]
 ┌─────────────────┐       30분 주기 스케줄러 ┌───────────────────────────────────┐
 │   SharePoint    ├───────────────────────►│ ⚙️ Microsoft Power Automate       │
 │  (WBS 엑셀 파일)│                        │ 1. 30분 마다 엑셀 파일 가져오기   │
 └─────────────────┘                        │ 2. Outlook을 통해 메일 전송       │
          ▲                                 │    (엑셀 파일을 첨부파일로 추가)  │
          │                                 └───────────────┬───────────────────┘
          │                                                 │
          │                                                 │ [이메일 전송] Outlook ➔ Gmail
          │                                                 ▼
[ 🌐 5. 최종 통합 ]                             [ 🤖 3. 자동화 & 가공 (n8n) ]
 ┌─────────────────┐       iframe 삽입        ┌────────────────────────────┐
 │  SharePoint     │◄───────────────────────┤ ⚙️ n8n 워크플로우            │
 │  팀 사이트 화면 │     ?view=dashboard      │ 1. Gmail 트리거 (새 메일 수신)    │
 └─────────────────┘      (요약 대시보드)       │ 2. 첨부파일(엑셀) 추출/JSON 변환  │
                                            │ 3. 기존 data.json 삭제            │
                                            │ 4. 5초 대기 (서버 동기화)         │
                                            │ 5. 새 data.json 생성(Push)        │
                                            └───────────────┬────────────┘
                                                            │
          ┌─────────────────────────────────────────────────┘
          │ [data.json 업데이트 (GitHub API)]
          ▼
[ 🐙 4. 저장소 & 웹 배포 (GitHub) ]              [ 💻 4. 프론트엔드 (React) ]
 ┌─────────────────────────────┐  data.json 읽기 ┌───────────────────────────┐
 │ 🗄️ GitHub Repository        ├───────────────►│ ⚛️ 간트 차트 대시보드 Web │
 │ - public/data.json (업데이트)│               │ - 데이터 Fetch            │
 │ - React 소스 코드           │◄──────────────┤ - 간트 차트 렌더링        │
 └──────────────┬──────────────┘ 배포           └───────────────────────────┘
                │
                │ ⚡ GitHub Actions 자동 빌드
                ▼
      ┌─────────────────────┐
      │ 🌐 GitHub Pages URL │ (무료 웹 호스팅)
      └─────────────────────┘`;

export default function ArchitecturePopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1E293B] rounded-xl shadow-2xl w-[900px] max-w-[95vw] flex flex-col overflow-hidden border border-slate-700">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800 shrink-0">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-400" /> 시스템 아키텍처 로직
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-auto bg-[#0F172A] flex justify-center">
          <pre className="text-emerald-400 font-mono text-[13px] leading-relaxed select-text whitespace-pre">
            {architectureText}
          </pre>
        </div>

      </div>
    </div>
  );
}
