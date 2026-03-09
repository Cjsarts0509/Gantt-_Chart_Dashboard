import { Task } from "gantt-task-react";

export interface WBSTask extends Task {
  area: string;
  phase: string;
  activity: string;
  deliverable: string;
  taskName: string;
  assigneePlan: string;   // 담당자(기획)
  assigneeIT: string;     // 담당자(IT)
  status: string;         // 진행상태
}

export type StatusType = "예정" | "진행중" | "완료" | "지연" | "보류";
