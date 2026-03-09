import React, { createContext, useContext } from "react";

export interface GroupCollapseState {
  areaCollapsed: boolean;
  phaseCollapsed: boolean;
  activityCollapsed: boolean;
  deliverableCollapsed: boolean;
  toggleAreaColumn: () => void;
  togglePhaseColumn: () => void;
  toggleActivityColumn: () => void;
  toggleDeliverableColumn: () => void;
}

const defaultState: GroupCollapseState = {
  areaCollapsed: false,
  phaseCollapsed: false,
  activityCollapsed: false,
  deliverableCollapsed: false,
  toggleAreaColumn: () => {},
  togglePhaseColumn: () => {},
  toggleActivityColumn: () => {},
  toggleDeliverableColumn: () => {},
};

export const GanttGroupContext = createContext<GroupCollapseState>(defaultState);

export const useGanttGroup = () => useContext(GanttGroupContext);
