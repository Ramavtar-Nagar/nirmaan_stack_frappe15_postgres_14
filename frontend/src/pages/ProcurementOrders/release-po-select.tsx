import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useUserData } from "@/hooks/useUserData";
import { ProcurementOrder as ProcurementOrdersType } from "@/types/NirmaanStack/ProcurementOrders";
import { Projects } from "@/types/NirmaanStack/Projects";
import { formatDate } from "@/utils/FormatDate";
import formatToIndianRupee from "@/utils/FormatPrice";
import { getPOTotal, getTotalAmountPaid } from "@/utils/getAmounts";
import { useDocCountStore } from "@/zustand/useDocCountStore";
import { useNotificationStore } from "@/zustand/useNotificationStore";
import { ColumnDef } from "@tanstack/react-table";
import { Radio } from "antd";
import { FrappeConfig, FrappeContext, useFrappeDocTypeEventListener, useFrappeGetDocList } from "frappe-react-sdk";
import { useContext, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "../../components/ui/badge";
import { TableSkeleton } from "../../components/ui/skeleton";
import { useToast } from "../../components/ui/use-toast";
import { ApproveSelectAmendPO } from "../approve-select-amend-po";
import { ApproveSelectVendor } from "../ProcurementRequests/ApproveVendorQuotes/approve-select-vendor";
import { ApproveSelectSentBack } from "../Sent Back Requests/approve-select-sent-back";


// interface ReleasePOSelectProps {
//     status: string
//     not: boolean
// }

export const ReleasePOSelect = () => {

    const [searchParams] = useSearchParams();

    const { role, user_id } = useUserData()

    const [tab, setTab] = useState<string>(searchParams.get("tab") || ((["Nirmaan Admin Profile", "Nirmaan Project Lead Profile"].includes(role) || user_id === "Administrator") ? "Approve PO" : "Approved PO"));

    const { data: procurement_order_list, isLoading: procurement_order_list_loading, error: procurement_order_list_error, mutate: mutate } = useFrappeGetDocList("Procurement Orders",
        {
            fields: ["*"],
            filters: [["status", (tab === "Dispatched PO" || role === "Nirmaan Estimates Executive Profile") ? "not in" : "in", tab === "Dispatched PO" ? ["PO Approved", "PO Amendment", "Merged", "Partially Delivered", "Delivered"] : (role === "Nirmaan Estimates Executive Profile" ? ["PO Amendment", "Merged"] : tab === "Approved PO" ? ["PO Approved"] : ["Partially Delivered", "Delivered"])]],
            limit: 10000,
            orderBy: { field: "modified", order: "desc" }
        },
    );

    const { data: projectPayments, isLoading: projectPaymentsLoading, error: projectPaymentsError } = useFrappeGetDocList("Project Payments", {
            fields: ["*"],
            limit: 100000
        })
    // console.log("data", procurement_order_list)

    useFrappeDocTypeEventListener("Procurement Orders", async (event) => {
        await mutate()
    })

    const { data: projects, isLoading: projects_loading, error: projects_error } = useFrappeGetDocList<Projects>("Projects", {
        fields: ["name", "project_name"],
        limit: 1000
    })

    const { data: vendorsList, isLoading: vendorsListLoading, error: vendorsError } = useFrappeGetDocList("Vendors", {
        fields: ["vendor_name", 'vendor_type'],
        filters: [["vendor_type", "in", ["Material", "Material & Service"]]],
        limit: 1000
    },
        "Material Vendors"
    )

    const vendorOptions = vendorsList?.map((ven) => ({ label: ven.vendor_name, value: ven.vendor_name }))
    const project_values = projects?.map((item) => ({ label: `${item.project_name}`, value: `${item.name}` })) || []

    const getAmountPaid = (id) => {
        const payments = projectPayments?.filter((payment) => payment?.document_name === id && payment?.status === "Paid");
        return getTotalAmountPaid(payments);
    }

    const { newPOCount, otherPOCount, adminNewPOCount, adminOtherPOCount, adminDispatchedPOCount, dispatchedPOCount, adminPrCounts, prCounts, adminAmendPOCount, amendPOCount, adminNewApproveSBCount, newSBApproveCount } = useDocCountStore()

    const { notifications, mark_seen_notification } = useNotificationStore()

    const { db } = useContext(FrappeContext) as FrappeConfig
    const handleNewPRSeen = (notification) => {
        if (notification) {
            mark_seen_notification(db, notification)
        }
    }

    // useEffect(() => {
    //     const currentTab = searchParams.get("tab") || "Approved PO";
    //     setTab(currentTab);
    //     updateURL("tab", currentTab);
    // }, []);

    const updateURL = (key, value) => {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.pushState({}, "", url);
    };

    // const setPOTab = (changeTab) => {
    //   if (tab === changeTab) return; // Prevent redundant updates
    //   setTab(changeTab);
    //   updateURL("tab", changeTab);
    // };

    const onClick = (value) => {

        if (tab === value) return; // Prevent redundant updates

        const newTab = value;
        setTab(newTab);
        updateURL("tab", newTab);

    };

    // type MenuItem = Required<MenuProps>["items"][number];

    const adminTabs = [
        ...(["Nirmaan Project Lead Profile", "Nirmaan Admin Profile"].includes(
            role
          ) || user_id == "Administrator" ? [
            {
                label: (
                    <div className="flex items-center">
                        <span>Approve PO</span>
                        <span className="ml-2 text-xs font-bold">
                            {(role === "Nirmaan Admin Profile" || user_id === "Administrator") ? adminPrCounts.approve
                                : prCounts.approve}
                        </span>
                    </div>
                ),
                value: "Approve PO",
            },
            {
                label: (
                    <div className="flex items-center">
                        <span>Approve Amended PO</span>
                        <span className="ml-2 text-xs font-bold">
                            {(role === "Nirmaan Admin Profile" || user_id === "Administrator") ? adminAmendPOCount
                                : amendPOCount}
                        </span>
                    </div>
                ),
                value: "Approve Amended PO",
            },
            {
                label: (
                    <div className="flex items-center">
                        <span>Approve Sent Back PO</span>
                        <span className="ml-2 text-xs font-bold">
                            {(role === "Nirmaan Admin Profile" || user_id === "Administrator") ? adminNewApproveSBCount
                    : newSBApproveCount}
                        </span>
                    </div>
                ),
                value: "Approve Sent Back PO",
            },
          ] : []),
    ]

    const items = [
        {
            label: (
                <div className="flex items-center">
                    <span>Approved PO</span>
                    <span className="ml-2 text-xs font-bold">
                        {(role === "Nirmaan Admin Profile" || user_id === "Administrator") ? adminNewPOCount : newPOCount}
                    </span>
                </div>
            ),
            value: "Approved PO",
        },
        {
            label: (
                <div className="flex items-center">
                    <span>Dispatched PO</span>
                    <span className="ml-2 rounded text-xs font-bold">
                        {(role === "Nirmaan Admin Profile" || user_id === "Administrator") ? adminDispatchedPOCount : dispatchedPOCount}
                    </span>
                </div>
            ),
            value: "Dispatched PO",
        },
        {
            label: (
                <div className="flex items-center">
                    <span>Delivered PO</span>
                    <span className="ml-2 rounded text-xs font-bold">
                        {(role === "Nirmaan Admin Profile" || user_id === "Administrator") ? adminOtherPOCount : otherPOCount}
                    </span>
                </div>
            ),
            value: "Delivered PO",
        },
    ];

    const columns: ColumnDef<ProcurementOrdersType>[] = useMemo(
        () => [
            {
                accessorKey: "name",
                header: ({ column }) => {
                    return (
                        <DataTableColumnHeader column={column} title="ID" />
                    )
                },
                cell: ({ row }) => {
                    const data = row.original
                    const id = data?.name
                    const poId = id?.replaceAll("/", "&=")
                    const isNew = notifications.find(
                        (item) => tab === "Approved PO" && item.docname === id && item.seen === "false" && item.event_id === "po:new"
                    )
                    return (
                        <div onClick={() => handleNewPRSeen(isNew)} className="font-medium relative min-w-[150px] flex flex-col">
                            {isNew && (
                                <div className="w-2 h-2 bg-red-500 rounded-full absolute top-1.5 -left-8 animate-pulse" />
                            )}
                            <Link
                                className="underline hover:underline-offset-2"
                                to={`${poId}?tab=${tab}`}
                            >
                                {id?.toUpperCase()}
                            </Link>
                            {data?.custom === "true" && (
                                <Badge className="w-[100px] flex items-center justify-center">Custom</Badge>
                            )}
                        </div>
                    )
                }
            },
            {
                accessorKey: "procurement_request",
                header: ({ column }) => {
                    return (
                        <DataTableColumnHeader column={column} title="PR No" />
                    )
                },
                cell: ({ row }) => {
                    return (
                        <div className="font-medium">
                            {row.getValue("procurement_request")?.slice(-4)}
                        </div>
                    )
                }
            },
            {
                accessorKey: "creation",
                header: ({ column }) => {
                    return (
                        <DataTableColumnHeader column={column} title="Date" />
                    )
                },
                cell: ({ row }) => {
                    return (
                        <div className="font-medium">
                            {formatDate(row.getValue("creation")?.split(" ")[0])}
                        </div>
                    )
                }
            },
            {
                accessorKey: "project",
                header: ({ column }) => {
                    return (
                        <DataTableColumnHeader column={column} title="Project" />
                    )
                },
                cell: ({ row }) => {
                    const project = project_values.find(
                        (project) => project.value === row.getValue("project")
                    )
                    if (!project) {
                        return null;
                    }

                    return (
                        <div className="font-medium">
                            {project.label}
                        </div>
                    )
                },
                filterFn: (row, id, value) => {
                    return value.includes(row.getValue(id))
                },
            },
            {
                accessorKey: "vendor_name",
                header: ({ column }) => {
                    return (
                        <DataTableColumnHeader column={column} title="Vendor" />
                    )
                },
                cell: ({ row }) => {
                    return (
                        <div className="font-medium">
                            {row.getValue("vendor_name")}
                        </div>
                    )
                },
                filterFn: (row, id, value) => {
                    return value.includes(row.getValue(id))
                }
            },
            {
                accessorKey: "status",
                header: ({ column }) => {
                    return (
                        <DataTableColumnHeader column={column} title="Status" />
                    )
                },
                cell: ({ row }) => {
                    return (
                        <Badge variant={row.getValue("status") === "PO Approved" ? "default" : row.getValue("status") === "PO Sent" ? "yellow" : row.getValue("status") === "Dispatched" ? "orange" : "green"}>{row.getValue("status") === "Partially Delivered" ? "Delivered" : row.getValue("status")}</Badge>
                    )
                }
            },
            {
                id: "totalWithoutGST",
                header: ({ column }) => {
                    return (
                        <DataTableColumnHeader column={column} title="Amt (exc. GST)" />
                    )
                },
                cell: ({ row }) => {
                    const data = row.original;
                    return (
                        <div className="font-medium">
                            {formatToIndianRupee(getPOTotal(data,  parseFloat(data?.loading_charges), parseFloat(data?.freight_charges))?.total)}
                        </div>
                    )
                }
            },
            {
                id: "totalWithGST",
                header: ({ column }) => {
                    return (
                        <DataTableColumnHeader column={column} title="Amt (inc. GST)" />
                    )
                },
                cell: ({ row }) => {
                    const data = row.original;
                    return (
                        <div className="font-medium">
                            {formatToIndianRupee(getPOTotal(data,  parseFloat(data?.loading_charges), parseFloat(data?.freight_charges))?.totalAmt)}
                        </div>
                    )
                }
            },
            {
                id: "Amount_paid",
                header: "Amt Paid",
                cell: ({ row }) => {
                    const data = row.original
                    return <div className="font-medium">
                        {formatToIndianRupee(getAmountPaid(data?.name))}
                    </div>
                },
            },
            {
                accessorKey: 'order_list',
                header: ({ column }) => {
                    return <h1 className="hidden">:</h1>
                },
                cell: ({ row }) => <span className="hidden">hh</span>
            }
        ],
        [project_values, procurement_order_list, projectPayments]
    )

    const { toast } = useToast()

    if (procurement_order_list_error || projects_error || vendorsError || projectPaymentsError) {
        console.log("Error in release-po-select.tsx", procurement_order_list_error?.message, projects_error?.message, vendorsError?.message)
        toast({
            title: "Error!",
            description: `Error ${procurement_order_list_error?.message || projects_error?.message || vendorsError?.message}`,
            variant: "destructive"
        })
    }

    return (
        <>
            <div className="flex-1 space-y-4">
                {role !== "Nirmaan Estimates Executive Profile" && (
                    <div className="flex items-center max-md:items-start gap-4 max-md:flex-col">
                        {
                            adminTabs && (
                                <Radio.Group
                                    block
                                    options={adminTabs}
                                    optionType="button"
                                    buttonStyle="solid"
                                    value={tab}
                                    onChange={(e) => onClick(e.target.value)}
                                />
                            )
                        }
                        {
                            items && (
                                <Radio.Group
                                    block
                                    options={items}
                                    defaultValue="Approved PO"
                                    optionType="button"
                                    buttonStyle="solid"
                                    value={tab}
                                    onChange={(e) => onClick(e.target.value)}
                                />
                            )
                        }

                    </div>
                )}
                {["Approve PO", "Approve Amended PO", "Approve Sent Back PO"].includes(tab) ? (
                    tab === "Approve PO" ? (
                        <ApproveSelectVendor />
                    ) : tab === "Approve Amended PO" ? (
                        <ApproveSelectAmendPO />
                    ) : (
                        <ApproveSelectSentBack />
                    )
                ) : (
                    (procurement_order_list_loading || projects_loading || vendorsListLoading || projectPaymentsLoading) ? (<TableSkeleton />) : (
                        <DataTable columns={columns} data={procurement_order_list?.filter((po) => po?.status !== "Cancelled") || []} project_values={project_values} vendorOptions={vendorOptions} itemSearch={true} />
                    )
                )}

            </div>

        </>
    )
}

