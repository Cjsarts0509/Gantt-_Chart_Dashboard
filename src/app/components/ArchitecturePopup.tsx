import React from "react";
import { X, Network } from "lucide-react";

const architectureText = `[ 📊 1. 원본 데이터 관리 ]                         [ 🤖 2. 데이터 배달 (MS Power Automate) ]
 ┌─────────────────┐       파일 수정 감지      ┌───────────────────────────────────┐
 │   SharePoint    ├────────────────────────►│ ⚡ Microsoft Power Automate        │
 │  (WBS 엑셀 파일)  │                        │ 1. [트리거] 파일 수정 시          │
 └─────────────────┘                        │ 2. [작업] 파일 내용 가져오기      │
          ▲                                 │ 3. [작업] n8n Webhook으로 POST 요청│
          │                                 └───────────────┬───────────────────┘
          │                                                 │
          │                                                 │ [JSON 데이터 전송] Webhook (신속)
          │                                                 ▼
[ 🌐 5. 최종 통합 ]                             [ 🤖 3. 자동화 & 가공 (n8n) ]
 ┌─────────────────┐       iframe 삽입        ┌────────────────────────────┐
 │  SharePoint     │◄───────────────────────┤ ⚙️ n8n 워크플로우            │
 │  팀 사이트 화면   │     ?view=dashboard      │ 1. Webhook 트리거 (데이터 수신)   │
 └─────────────────┘      (요약 대시보드)       │ 2. 데이터 JSON 정제               │
                                            │ 3. 기존 data.json 삭제            │
                                            │ 4. 5초 대기 (서버 동기화)         │
                                            │ 5. 새 data.json 생성(Push)        │
                                            └───────────────┬────────────┘
                                                            │
          ┌─────────────────────────────────────────────────┘
          │ [data.json 업데이트]
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
        
        {/* 헤더 부분 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800 shrink-0">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-400" /> 시스템 아키텍처 로직
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 터미널 느낌의 내용 부분 */}
        <div className="p-6 overflow-auto bg-[#0F172A] flex justify-center">
          <pre className="text-emerald-400 font-mono text-[13px] leading-relaxed select-text whitespace-pre">
            {architectureText}
          </pre>
        </div>

      </div>
    </div>
  );
}
