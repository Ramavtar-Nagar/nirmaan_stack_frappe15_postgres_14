import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useUserData } from "@/hooks/useUserData";
import { UserContext } from "@/utils/auth/UserProvider";
import { CirclePlus } from "lucide-react";
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../ui/badge";
import { useDialogStore } from "@/zustand/useDialogStore";
import { useProjectCreationStore } from "@/pages/projects/store/useProjectCreationStore";
import { ContinueProjectDialog } from "../ContinueProjectDialog";
import { useProcurementRequestStore } from "@/pages/ProcurementRequests/NewPR/store/useProcurementRequestStore";
import { ContinuePRDialog } from "../ContinuePRDialog";

interface RenderActionButtonProps {
  locationPath: string;
  projectData?: any;
}

const newButtonRoutes: Record<string, { label: string; route: string }> = {
  "/projects": {
    label: "New Project",
    route: "projects/new-project",
  },
  "/users": {
    label: "New User",
    route: "users/new-user",
  },
  "/vendors": {
    label: "New Vendor",
    route: "vendors/new-vendor",
  },
  "/customers": {
    label: "New Customer",
    route: "customers/new-customer",
  },
  "/procurement-requests": {
    label: "New PR",
    route: "prs&milestones/procurement-requests",
  },
  "/service-requests": {
    label: "New SR",
    route: "service-requests-list",
  },
};

export const RenderRightActionButton = ({
  locationPath,
  projectData,
}: RenderActionButtonProps) => {

  const navigate = useNavigate();
  const { role, user_id } = useUserData()
  const { selectedProject } = useContext(UserContext);
  const { toggleNewInflowDialog, toggleNewItemDialog, toggleNewProjectInvoiceDialog, toggleNewNonProjectExpenseDialog } = useDialogStore()

  // Project creation state
  const { hasProgress, resetStore } = useProjectCreationStore();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // PR creation state 
  const { hasProgress: hasPRProgress, resetStore: resetPRStore } = useProcurementRequestStore();
  const [prConfirmState, setPRConfirmState] = useState({ isOpen: false, targetRoute: '' });

  const handleNewProjectClick = () => {
    if (hasProgress()) {
      setIsConfirmDialogOpen(true);
    } else {
      resetStore(); // to reset if it's empty anyway
      navigate("projects/new-project");
    }
  };

  const handleNewPRClick = (route: string) => {
    if (hasPRProgress(selectedProject)) {
      setPRConfirmState({ isOpen: true, targetRoute: route });
    } else {
      resetPRStore(); // to reset if it's empty anyway
      navigate(route);
    }
  };

  return (
    <>
      {(() => {
        if (newButtonRoutes[locationPath]) {
          const routeInfo = newButtonRoutes[locationPath];

          if (locationPath === "/projects") {
            return (
              <Button className="sm:mr-4 mr-2" onClick={handleNewProjectClick}>
                <CirclePlus className="w-5 h-5 pr-1" />
                Add <span className="hidden md:flex pl-1">{routeInfo.label}</span>
              </Button>
            ); 
          }

          return (
            <Button
              className="sm:mr-4 mr-2"
              onClick={() => navigate(routeInfo.route)}
            >
              <CirclePlus className="w-5 h-5 pr-1" />
              Add <span className="hidden md:flex pl-1">{routeInfo.label}</span>
            </Button>
          );
        } else if (locationPath === "/prs&milestones/procurement-requests" && selectedProject) {
          return ["Nirmaan Admin Profile", "Nirmaan Project Lead Profile", "Nirmaan Procurement Executive Profile"].includes(role) || user_id === "Administrator" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="sm:mr-4 mr-2">
                  <CirclePlus className="w-5 h-5 pr-1" />
                  Add New PR
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="mr-16">
                <DropdownMenuItem onClick={() => handleNewPRClick(`/prs&milestones/procurement-requests/${selectedProject}/new-pr`)}>
                  Normal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNewPRClick(`/prs&milestones/procurement-requests/${selectedProject}/new-custom-pr`)}>
                  Custom
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              className="sm:mr-4 mr-2"
              onClick={() =>
                // navigate(`/prs&milestones/procurement-requests/${selectedProject}/new-pr`)
                handleNewPRClick(`/prs&milestones/procurement-requests/${selectedProject}/new-pr`)
              }
            >
              <CirclePlus className="w-5 h-5 pr-1" />
              Add <span className="hidden md:flex pl-1">New PR</span>
            </Button>
          );
        } else if (locationPath === "/service-requests-list" && selectedProject && role != "Nirmaan Project Manager Profile") {
          return (
            <Button
              className="sm:mr-4 mr-2"
              onClick={() => navigate(`/service-requests-list/${selectedProject}/new-sr`)}
            >
              <CirclePlus className="w-5 h-5 pr-1" />
              Add <span className="hidden md:flex pl-1">New SR</span>
            </Button>
          );
        } else if (locationPath === "/products") {
          return (
            <Button onClick={toggleNewItemDialog} className="sm:mr-4 mr-2">
              <CirclePlus className="w-5 h-5 pr-1" />
              Add <span className="hidden md:flex pl-1">New Product</span>
            </Button>
          );
        } else if (locationPath === "/in-flow-payments") {
          return (
            <Button onClick={toggleNewInflowDialog} className="sm:mr-4 mr-2">
              <CirclePlus className="w-5 h-5 pr-1" />
              Add <span className="hidden md:flex pl-1">New Inflow</span>
            </Button>
          );
        } else if (locationPath === "/project-invoices") {
          return (
            <Button onClick={toggleNewProjectInvoiceDialog} className="sm:mr-4 mr-2">
              <CirclePlus className="w-5 h-5 pr-1" />
              Add <span className="hidden md:flex pl-1">New Project Invoice</span>
            </Button>
          );
        } else if (locationPath === "/non-project") {
          return (
            <Button onClick={toggleNewNonProjectExpenseDialog} className="sm:mr-4 mr-2">
              <CirclePlus className="w-5 h-5 pr-1" />
              Add <span className="hidden md:flex pl-1">New Expense</span>
            </Button>
          );
        } else if (
          locationPath === "/" &&
          ["Nirmaan Project Lead Profile", "Nirmaan Procurement Executive Profile", "Nirmaan Admin Profile"].includes(role)
        ) {
          // For admin profiles, render a dropdown menu
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="sm:mr-4 mr-2">
                  <CirclePlus className="w-5 h-5 pr-1" />
                  Add
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="mr-16">
                {role === "Nirmaan Admin Profile" && (
                  <>
                    <DropdownMenuItem onClick={handleNewProjectClick}>
                      New Project
                    </DropdownMenuItem> 
                    <DropdownMenuItem onClick={() => navigate("/users/new-user")}>
                      New User
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/vendors/new-vendor")}>
                      New Vendor
                    </DropdownMenuItem>
                    <Separator />
                  </>
                )}
                <DropdownMenuItem onClick={() => navigate("/prs&milestones/procurement-requests")}>
                  {role === "Nirmaan Admin Profile" ? "New PR" : "Urgent PR"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/prs&milestones/procurement-requests")}>
                  New Custom PR
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/service-requests-list")}>
                  Service Request
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        } else {
          return (
            projectData && (
              <Badge className={`sm:mr-4 mr-2 ${projectData?.project_name?.length > 24 ? "max-sm:text-[9px]" : "max-sm:text-[11px]"}`}>
                {projectData?.project_name}
              </Badge>
            )
          );
        }
      })()}

      <ContinueProjectDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        onContinue={() => {
          navigate('projects/new-project');
        }}
        onRestart={() => {
          resetStore();
          navigate('projects/new-project');
        }}
      />

      <ContinuePRDialog
        isOpen={prConfirmState.isOpen}
        onOpenChange={(open) => setPRConfirmState({ ...prConfirmState, isOpen: open })}
        onContinue={() => {
          navigate(prConfirmState.targetRoute);
        }}
        onRestart={() => {
          resetPRStore();
          navigate(prConfirmState.targetRoute);
        }}
      />
    </>
  );

}