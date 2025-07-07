import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';


export interface Phase1_ProjectDetails {
  projectName: string;
  customer: string;
  projectValue?: string | null;
  projectType: string;
  project_gst_number?: {
    list: {
      location: string;
      gst: string;
    }[];
  };
  subdivisions: string;
  subdivisionNames?: { name: string; status: string }[];
}

export interface Phase2_AddressDetails {
  addressLine1: string;
  addressLine2: string;
  project_city?: string;
  project_state?: string;
  pin?: string;
  email?: string | null;
  phone?: string | null;
}

export interface Phase3_Timeline {
  projectStartDate: Date;
  projectEndDate: Date;
//   projectDuration: number;
}

export interface Phase4_Assignees {
  projectLead?: string | null;
  projectManager?: string | null;
  procurementLead?: string | null;
  designLead?: string | null;
  accountant?: string | null;
}

export interface Phase5_Packages {
  workPackages?: {
    work_package_name: string;
    category_list: {
      list: {
        name: string;
        makes: { label: string; value: string }[];
      }[];
    };
  }[];
}


interface ProjectCreationState{
    currentStep?: number | null;
    projectId: string | null;

    // Grouped data from Each Phase
    phase1: Partial<Phase1_ProjectDetails>;
    phase2: Partial<Phase2_AddressDetails>;
    phase3: Partial<Phase3_Timeline>;
    phase4: Partial<Phase4_Assignees>;
    phase5: Partial<Phase5_Packages>;

    // Actions to update the state
    setPhase1Data: (data: Partial<Phase1_ProjectDetails>) => void;
    setPhase2Data: (data: Partial<Phase2_AddressDetails>) => void;
    setPhase3Data: (data: Partial<Phase3_Timeline>) => void;
    setPhase4Data: (data: Partial<Phase4_Assignees>) =>  void;
    setPhase5Data: (data: Partial<Phase5_Packages>) => void;

    goToStep: (step: number) => void;
    setProjectId: (id: string) => void;
    resetStore: () => void;
    hasProgress: () => boolean;
    
};

const initialState = {
    currentStep: 1,
    projectId: null,
    
    phase1: {},
    phase2: {},
    phase3: {},
    phase4: {},
    phase5: { workPackages: []},
};

 // fallback for date handling
function ensureDate(date: any): Date {
    if (date instanceof Date) return date;
    if (typeof date === 'string' || typeof date === 'number') return new Date(date);
    return new Date();
}

function isPersistedState(state: unknown): state is Partial<ProjectCreationState> {
    return typeof state === 'object' && state !== null;
}

export const useProjectCreationStore = create<ProjectCreationState>()(
    persist(
        (set, get) => ({
            ...initialState,
            // --- actions ---
            //  setPhase1Data: (data) => set((state) => ({ phase1: { ...state.phase1, ...data } })),

            setPhase1Data: (data) => set((state) => ({ 
                phase1: { 
                    ...state.phase1, 
                    ...data,
                    // subdivisionNames: data.subdivisionNames || state.phase1.subdivisionNames || [],
                    subdivisionNames: data.subdivisionNames !== undefined ? data.subdivisionNames : state.phase1.subdivisionNames
                } 
            })),

             setPhase2Data: (data) => set((state) => ({ phase2: { ...state.phase2, ...data } })),

            //  setPhase3Data: (data) => set((state) => ({ phase3: { ...state.phase3, ...data } })),
            // setPhase3Data: (data) => set((state) => ({ 
            //       phase3: { 
            //           ...state.phase3, 
            //           projectStartDate: data.projectStartDate instanceof Date ? data.projectStartDate : new Date(data.projectStartDate),
            //           projectEndDate: data.projectEndDate instanceof Date ? data.projectEndDate : new Date(data.projectEndDate)
            //       } 
            //   })),


            // setPhase3Data: (data) => {
            //     const startDate = data.projectStartDate ? ensureDate(data.projectStartDate) : new Date();
            //     const endDate = data.projectEndDate ? ensureDate(data.projectEndDate) : undefined;
                
            //     return set((state) => ({
            //         phase3: {
            //             ...state.phase3,
            //             projectStartDate: startDate,
            //             projectEndDate: endDate
            //         }
            //     }));
            // },

            setPhase3Data: (data) => {
              const startDate = data.projectStartDate instanceof Date ? 
                data.projectStartDate : 
                new Date(data.projectStartDate);
              
              const endDate = data.projectEndDate instanceof Date ? 
                data.projectEndDate : 
                (data.projectEndDate ? new Date(data.projectEndDate) : undefined);

              return set((state) => ({
                phase3: {
                  ...state.phase3,
                  projectStartDate: startDate,
                  projectEndDate: endDate
                }
              }));
            },

             setPhase4Data: (data) => set((state) => ({ phase4: { ...state.phase4, ...data } })),
             setPhase5Data: (data) => set((state) => ({ phase5: { ...state.phase5, ...data } })),

             goToStep: (step) => set({ currentStep: step }),
             setProjectId: (id) => set({ projectId: id }),
            //  reset: () => set({
            //     ...initialState,
            //     phase3: {
            //         ...initialState.phase3,
            //         projectStartDate: new Date(),
            //     }
            // }),
            resetStore: () => set({
              ...initialState,
              projectId: null,
              phase1: { subdivisionNames: [] },
              phase2: {},
              phase3: { projectStartDate: new Date() }, // Ensure default start date
              phase4: {},
              phase5: { workPackages: [] },
            }),

            // -------- Logic for checking the store  --------
            hasProgress: () => {
                const state = get();

                if (state.currentStep && state.currentStep > 1) {
                    return true;
                }
                const { projectName, customer, projectValue, projectType, subdivisions } = state.phase1;
                if (
                    (projectName && projectName.length > 0) ||
                    (customer && customer.length > 0) ||
                    (projectValue && projectValue.length > 0) ||
                    (projectType && projectType.length > 0) ||
                    (subdivisions && subdivisions.length > 0)
                ) {
                    return true;
                }
                if (Object.values(state.phase2).some(value => value && String(value).length > 0)) {
                    return true;
                }   
                if (state.phase3.projectEndDate) {
                    return true;
                }
                if (Object.values(state.phase4).some(value => value && String(value).length > 0)) {
                    return true;
                }
                if (state.phase5.workPackages && state.phase5.workPackages.length > 0) {
                    return true;
                }
                return false;
            },
        }),
        {
            name: 'project-creation-store',
            storage: createJSONStorage(() => sessionStorage),

            serialize: (state) => {
                // Convert Dates to ISO strings before serialization
                const serializedState = {
                  ...state,
                  state: {
                    ...state.state,
                    phase3: {
                      ...state.state.phase3,
                      projectStartDate: state.state.phase3.projectStartDate?.toISOString(),
                      projectEndDate: state.state.phase3.projectEndDate?.toISOString(),
                    }
                  }
                };
                return JSON.stringify(serializedState);
              },
              deserialize: (str) => {
                const parsed = JSON.parse(str);
                // Convert ISO strings back to Dates
                return {
                  ...parsed,
                  state: {
                    ...parsed.state,
                    phase3: {
                      ...parsed.state.phase3,
                      projectStartDate: parsed.state.phase3.projectStartDate ? new Date(parsed.state.phase3.projectStartDate) : null,
                      projectEndDate: parsed.state.phase3.projectEndDate ? new Date(parsed.state.phase3.projectEndDate) : null,
                    }
                  }
                };
              },

            

            // Add migration in case of state structure changes
            migrate: (persistedState: unknown, version) => {
            if (!isPersistedState(persistedState)) return initialState;
                
                if (persistedState.phase1 && !persistedState.phase1.subdivisionNames) {
                    persistedState.phase1.subdivisionNames = [];
                }
                
                return persistedState as ProjectCreationState;
            },
            version: 4,
        }

    )
);