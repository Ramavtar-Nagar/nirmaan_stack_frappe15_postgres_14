import { useFrappeGetDoc, useFrappeGetDocList } from 'frappe-react-sdk';
import { NavBar } from '../nav/nav-bar';
import React, { useEffect, useState } from 'react';
import { useFrappeDataStore } from '@/zustand/useFrappeDataStore';
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from '../ui/sidebar';
import { NewSidebar } from './NewSidebar';
import ErrorBoundaryWithNavigationReset from '../common/ErrorBoundaryWrapper';
import ScrollToTop from '@/hooks/ScrollToTop';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Separator } from '../ui/separator';
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../ui/breadcrumb';
import { UserNav } from '../nav/user-nav';
import { Notifications } from '../nav/notifications';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';

export const MainLayout = ({children} : {children : React.ReactNode}) => {

    const {setProcurementRequestError, setProcurementRequestList, setProcurementRequestLoading, setProjects, setProjectsError, setProjectsLoading} = useFrappeDataStore()

    const [locationsPaths, setLocationsPaths] = useState(null)

    const [project, setProject] = useState(null)

    console.log("project", project)

    const [prId, setPrId] = useState(null)
    const [poId, setPoId] = useState(null)
    const [sbId, setSbId] = useState(null)
    const [srId, setSrId] = useState(null)

    const {data : prData} = useFrappeGetDoc("Procurement Requests", prId, prId ? undefined : null)
    const {data : poData} = useFrappeGetDoc("Procurement Orders", poId, poId ? undefined : null)
    const {data : sbData} = useFrappeGetDoc("Sent Back Category", sbId, sbId ? undefined : null)
    const {data : srData} = useFrappeGetDoc("Service Requests", srId, srId ? undefined : null)

    const {data : projectData} = useFrappeGetDoc("Projects", (project || prData?.project || poData?.project || sbData?.project || srData?.project ), (project || prData || poData || sbData || srData) ? undefined : null)

    const location = useLocation()

    useEffect(() => {
        const locations = location.pathname?.slice(1)?.split("/")
        setLocationsPaths(locations)
        const project = locations?.find((i) => i?.includes("PROJ"))
        const prId = locations?.find((i) => i?.includes("PR"))
        const poId = locations?.find((i) => i?.includes("PO"))?.replaceAll("&=", "/")
        const sbId = locations?.find((i) => i?.includes("SB"))
        const srId = locations?.find((i) => i?.includes("SR"))
        setProject(project)
        setPrId(prId)
        setPoId(poId)
        setSbId(sbId)
        setSrId(srId)

    }, [location])


    const { data: procurement_request_list, isLoading: procurement_request_list_loading, error: procurement_request_list_error } = useFrappeGetDocList("Procurement Requests",
        {
            fields: ["*"],
            limit: 1000,
        },
        "All Procurement Requests"
    );
    const { data: projects, isLoading: projects_loading, error: projects_error } = useFrappeGetDocList("Projects",
        {
            fields: ["*"],
            limit: 1000
        },
        "All Projects"
    )

    useEffect(() => {
        if(procurement_request_list) {
            setProcurementRequestList(procurement_request_list)
        }
        setProcurementRequestError(procurement_request_list_error)
        setProcurementRequestLoading(procurement_request_list_loading)
    }, [procurement_request_list, procurement_request_list_loading, procurement_request_list_error])

    useEffect(() => {
        if(projects) {
            setProjects(projects)
        }
        setProjectsError(projects_error)
        setProjectsLoading(projects_loading)
    }, [projects, projects_loading, projects_error])

    const {state, isMobile} = useSidebar()

    return (
        <>
            <div className='flex w-full'>
                <NewSidebar />
            <div className='flex flex-col w-full overflow-auto'>
                <header className="flex justify-between h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                       <SidebarTrigger className="-ml-1" />
                       <Separator orientation="vertical" className="mr-2 h-4" />
                       <Breadcrumb>
            <BreadcrumbList>
              {locationsPaths?.length > 2 ? (
                <>
                  {/* First Item */}
                  <BreadcrumbItem>
                    <Link to={`/${locationsPaths[0]}`}>
                      <BreadcrumbLink>{locationsPaths[0]?.toUpperCase()}</BreadcrumbLink>
                    </Link>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />

                  {/* Ellipsis Dropdown */}
                  <BreadcrumbItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-1">
                        <BreadcrumbEllipsis className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {locationsPaths.slice(1, -1).map((route, index) => (
                          <DropdownMenuItem key={index}>
                            <Link to={`/${locationsPaths.slice(0, index + 2).join('/')}`}>
                              {route.toUpperCase()}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />

                  {/* Last Item */}
                  <BreadcrumbItem>
                    <BreadcrumbPage>{locationsPaths[locationsPaths.length - 1]?.toUpperCase()}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : (
                // Render normally if paths are less than or equal to 2
                locationsPaths?.map((route, index) => {
                  const toNavigate = locationsPaths.slice(0, index + 1).join('/');
                  return (
                    index < locationsPaths.length - 1 ? (
                      <React.Fragment key={index}>
                        <BreadcrumbItem>
                          <Link to={`/${toNavigate}`}>
                            <BreadcrumbLink>{route?.toUpperCase()}</BreadcrumbLink>
                          </Link>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                      </React.Fragment>
                    ) : (
                      <BreadcrumbItem key={index}>
                        <BreadcrumbPage>{route?.toUpperCase()}</BreadcrumbPage>
                      </BreadcrumbItem>
                    )
                  );
                })
              )}
            </BreadcrumbList>
          </Breadcrumb>
                    </div>
                    {isMobile ? (
                    <div className='flex items-center space-x-4 mr-4'>
                        <Notifications isMobileMain />
                        <UserNav isMobileMain />
                    </div>
                    ) : (
                        projectData && <Badge className='mr-4'>{projectData?.project_name}</Badge>
                    )}
                </header>
                <main 
                    className={`flex flex-1 flex-col p-4 pt-0 transition-all duration-300 ease-in-out overflow-auto  ${state === "expanded" ? "max-h-[93.5vh]" : "max-h-[94.5vh]"}`}
                >
                <ErrorBoundaryWithNavigationReset>
                    <ScrollToTop />
                    <Outlet />
                </ErrorBoundaryWithNavigationReset>
                </main>
            </div>
        </div>
        </>
    );
};