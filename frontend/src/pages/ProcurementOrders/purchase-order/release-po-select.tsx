import { DataTable, SearchFieldOption } from '@/components/data-table/new-data-table';
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { ItemsHoverCard } from "@/components/helpers/ItemsHoverCard";
import LoadingFallback from "@/components/layout/loaders/LoadingFallback";
import { useUserData } from "@/hooks/useUserData";
import { ProcurementOrder as ProcurementOrdersType } from "@/types/NirmaanStack/ProcurementOrders";
import { ProjectPayments } from "@/types/NirmaanStack/ProjectPayments";
import { Projects } from "@/types/NirmaanStack/Projects";
import { formatDate } from "@/utils/FormatDate";
import { formatToRoundedIndianRupee } from "@/utils/FormatPrice";
import { getPOTotal, getTotalAmountPaid, getTotalInvoiceAmount } from "@/utils/getAmounts";
import { parseNumber } from "@/utils/parseNumber";
import { useDocCountStore } from "@/zustand/useDocCountStore";
import { ColumnDef } from "@tanstack/react-table";
import { Radio } from "antd";
import { Filter, FrappeConfig, FrappeContext, FrappeDoc, useFrappeDocTypeEventListener, useFrappeGetDocList, GetDocListArgs } from "frappe-react-sdk";
import memoize from 'lodash/memoize';
import React, { Suspense, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../../components/ui/badge";
import { TableSkeleton } from "../../../components/ui/skeleton";
import { PaymentsDataDialog } from "../../ProjectPayments/PaymentsDataDialog";
import { InvoiceDataDialog } from "./components/InvoiceDataDialog";
import { getUrlStringParam, useServerDataTable } from "@/hooks/useServerDataTable";
import { urlStateManager } from "@/utils/urlStateManager";
import { useUsersList } from '../../ProcurementRequests/ApproveNewPR/hooks/useUsersList';
import { useVendorsList } from '../../ProcurementRequests/VendorQuotesSelection/hooks/useVendorsList';
import { getProjectListOptions, queryKeys } from '@/config/queryKeys';
import { DEFAULT_PO_FIELDS_TO_FETCH, getReleasePOSelectStaticFilters, PO_DATE_COLUMNS, PO_SEARCHABLE_FIELDS } from './config/purchaseOrdersTable.config';
import { AlertDestructive } from '@/components/layout/alert-banner/error-alert';

const ApproveSelectVendor = React.lazy(() => import("../../ProcurementRequests/ApproveVendorQuotes/approve-select-vendor"));
const ApproveSelectSentBack = React.lazy(() => import("../../Sent Back Requests/approve-select-sent-back"));
const ApproveSelectAmendPO = React.lazy(() => import("../amend-po/approve-select-amend-po"));

const DOCTYPE = 'Procurement Orders';
const URL_SYNC_KEY = 'po'; // Unique key for URL state for this table instance

export const ReleasePOSelect: React.FC = () => {

    const { role } = useUserData()

    // --- State for Dialogs ---
    const [selectedInvoicePO, setSelectedInvoicePO] = useState<ProcurementOrdersType | undefined>();
    const [selectedPaymentPO, setSelectedPaymentPO] = useState<ProcurementOrdersType | undefined>();


    // --- Tab State Management ---
    const initialTab = useMemo(() => {
        // Determine initial tab based on role, default to "Approved PO" if not admin/lead
        const defaultTab = ["Nirmaan Admin Profile", "Nirmaan Project Lead Profile"].includes(role) ? "Approve PO" : "Approved PO";
        return getUrlStringParam("tab", defaultTab);
    }, [role]); // Calculate only once based on role

    const [tab, setTab] = useState<string>(initialTab);

    // Effect to sync tab state TO URL
    useEffect(() => {
        // Only update URL if the state `tab` is different from the URL's current 'tab' param
        if (urlStateManager.getParam("tab") !== tab) {
            urlStateManager.updateParam("tab", tab);
        }
    }, [tab]);

    // Effect to sync URL state TO tab state (for popstate/direct URL load)
    useEffect(() => {
        const unsubscribe = urlStateManager.subscribe("tab", (_, value) => {
            // Update state only if the new URL value is different from current state
            const newTab = value || initialTab; // Fallback to initial if param removed
            if (tab !== newTab) {
                setTab(newTab);
            }
        });
        return unsubscribe; // Cleanup subscription
    }, [initialTab]); // Depend on `tab` to avoid stale closures

    const { data: projectPayments, isLoading: projectPaymentsLoading, error: projectPaymentsError } = useFrappeGetDocList<ProjectPayments>("Project Payments", {
        fields: ["name", "document_name", "status", "amount", "payment_date", "creation", "utr", "payment_attachment", "tds"],
        limit: 100000
    })

    // useFrappeDocTypeEventListener("Procurement Orders", async (event) => {
    //     await mutate()
    // })

    const projectsFetchOptions = getProjectListOptions();

    // --- Generate Query Keys ---
    const projectQueryKey = queryKeys.projects.list(projectsFetchOptions);

    // --- Supporting Data & Hooks ---
    const { data: projects, isLoading: projectsLoading, error: projectsError } = useFrappeGetDocList<Projects>(
        "Projects", projectsFetchOptions as GetDocListArgs<FrappeDoc<Projects>>, projectQueryKey
    );

    const { data: vendorsList, isLoading: vendorsListLoading, error: vendorsError } = useVendorsList()

    const { data: userList, isLoading: userListLoading, error: userError } = useUsersList()

    const vendorOptions = useMemo(() => vendorsList?.map((ven) => ({ label: ven.vendor_name, value: ven.name })) || [], [vendorsList])

    const projectOptions = useMemo(() => projects?.map((item) => ({ label: `${item.project_name}`, value: `${item.name}` })) || [], [projects])

    // const getAmountPaid = useMemo(() => memoize((id: string) => {
    //     const payments = projectPayments?.filter((payment) => payment?.document_name === id && payment?.status === "Paid") || [];
    //     return getTotalAmountPaid(payments);
    // }, (id: string) => id), [projectPayments])

    // --- Memoized Calculation Functions ---
    // Define these outside the main component body or ensure dependencies are stable
    // Using useMemo ensures they are stable if dependencies don't change.
    const getAmountPaid = useMemo(() => {
        if (!projectPayments) return () => 0; // Return a function that returns 0 if data not ready
        // Create a map for faster lookups
        const paymentsMap = new Map<string, number>();
        projectPayments.forEach(p => {
            if (p.document_name && p.status === "Paid") {
                const currentTotal = paymentsMap.get(p.document_name) || 0;
                paymentsMap.set(p.document_name, currentTotal + parseNumber(p.amount));
            }
        });
        // Return the memoized lookup function
        return memoize((id: string) => paymentsMap.get(id) || 0);
    }, [projectPayments]); // Recalculate only when projectPayments changes

    const { newPOCount, adminNewPOCount, adminDispatchedPOCount, dispatchedPOCount, adminPrCounts, prCounts, adminAmendPOCount, amendPOCount, adminNewApproveSBCount, newSBApproveCount, partiallyDeliveredPOCount, adminPartiallyDeliveredPOCount, deliveredPOCount, adminDeliveredPOCount } = useDocCountStore()

    const staticFiltersForTab = useMemo(
        () => getReleasePOSelectStaticFilters(tab, role),
        [tab, role]
    );

    const fieldsToFetch = useMemo(() => DEFAULT_PO_FIELDS_TO_FETCH.concat(['creation', 'modified', 'order_list', 'loading_charges', 'freight_charges', 'invoice_data']), []);

    const poSearchableFieldsOptions = useMemo(() => PO_SEARCHABLE_FIELDS.concat([{ value: "owner", label: "Approved By", placeholder: "Search by Approved By..." }]), []);
    const dateColumns = PO_DATE_COLUMNS;


    const adminTabs = useMemo(() => [
        ...(["Nirmaan Project Lead Profile", "Nirmaan Admin Profile"].includes(
            role
        ) ? [
            {
                label: (
                    <div className="flex items-center">
                        <span>Approve PO</span>
                        <span className="ml-2 text-xs font-bold">
                            {role === "Nirmaan Admin Profile" ? adminPrCounts.approve
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
                            {role === "Nirmaan Admin Profile" ? adminAmendPOCount
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
                            {role === "Nirmaan Admin Profile" ? adminNewApproveSBCount
                                : newSBApproveCount}
                        </span>
                    </div>
                ),
                value: "Approve Sent Back PO",
            },
        ] : []),
    ], [role, adminPrCounts, prCounts, adminAmendPOCount, amendPOCount, adminNewApproveSBCount, newSBApproveCount])

    const items = useMemo(() => [
        {
            label: (
                <div className="flex items-center">
                    <span>Approved PO</span>
                    <span className="ml-2 text-xs font-bold">
                        {role === "Nirmaan Admin Profile" ? adminNewPOCount : newPOCount}
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
                        {role === "Nirmaan Admin Profile" ? adminDispatchedPOCount : dispatchedPOCount}
                    </span>
                </div>
            ),
            value: "Dispatched PO",
        },
        { // Use the new state variable here
            label: (
                <div className="flex items-center">
                    <span>Partially Delivered PO</span>
                    <span className="ml-2 rounded text-xs font-bold">
                        {role === "Nirmaan Admin Profile" ? adminPartiallyDeliveredPOCount : partiallyDeliveredPOCount}
                    </span>
                </div>
            ),
            value: "Partially Delivered PO",
        },
        { // Use the renamed state variable here
            label: (
                <div className="flex items-center">
                    <span>Delivered PO</span>
                    <span className="ml-2 rounded text-xs font-bold">
                        {role === "Nirmaan Admin Profile" ? adminDeliveredPOCount : deliveredPOCount}
                    </span>
                </div>
            ),
            value: "Delivered PO",
        },
    ], [role, adminNewPOCount, newPOCount, adminDispatchedPOCount, dispatchedPOCount, adminPartiallyDeliveredPOCount, partiallyDeliveredPOCount, adminDeliveredPOCount, deliveredPOCount])


    // --- Define columns using TanStack's ColumnDef ---
    const columns = useMemo<ColumnDef<ProcurementOrdersType>[]>(() => [
        {
            accessorKey: 'name',
            header: ({ column }) => <DataTableColumnHeader column={column} title="#PO" />,
            cell: ({ row }) => (
                <>
                    <div className="flex gap-1 items-center">
                        <Link
                            className="font-medium underline hover:underline-offset-2 whitespace-nowrap"
                            // Adjust the route path as needed
                            to={`/purchase-orders/${row.original.name?.replaceAll("/", "&=")}?tab=${tab}`}
                        >
                            {row.original.name}
                        </Link>
                        <ItemsHoverCard order_list={row.original?.order_list?.list} />
                    </div>
                    {row.original?.custom === "true" && (
                        <Badge className="w-[100px] flex items-center justify-center">Custom</Badge>
                    )}
                </>
            ),
            size: 200,
            meta: {
                exportHeaderName: "PO ID",
                exportValue: (row) => {
                    return row.name;
                }
            }
        },
        {
            accessorKey: 'creation',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Created On" />,
            cell: ({ row }) => (
                <div className="font-medium whitespace-nowrap">
                    {formatDate(row.getValue<string>('creation'))}
                </div>
            ),
            enableColumnFilter: false,
            size: 150,
            meta: {
                exportHeaderName: "Created On",
                exportValue: (row) => {
                    return formatDate(row.creation);
                }
            }
        },
        {
            accessorKey: 'project',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Project" />,
            cell: ({ row }) => (
                <div className="font-medium">{row.original.project_name}</div>
            ),
            enableColumnFilter: true, // Enable faceted filter for project
            size: 250,
            meta: {
                exportHeaderName: "Project",
                exportValue: (row) => {
                    return row.project_name;
                }
            }
        },
        {
            accessorKey: 'vendor',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor" />,
            cell: ({ row }) => (
                <div className="font-medium">{row.original.vendor_name}</div>
            ),
            enableColumnFilter: true, // Enable faceted filter for vendor
            size: 250,
            meta: {
                exportHeaderName: "Vendor",
                exportValue: (row) => {
                    return row.vendor_name;
                }
            }
        },

        {
            accessorKey: "owner",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Approved By" />,
            cell: ({ row }) => {
                const data = row.original
                const ownerUser = userList?.find((entry) => data?.owner === entry.name)
                return (
                    <div className="font-medium">
                        {ownerUser?.full_name || data?.owner || "--"}
                    </div>
                );
            },
            size: 180,
            meta: {
                exportHeaderName: "Approved By",
                exportValue: (row) => {
                    const data = row
                    const ownerUser = userList?.find((entry) => data?.owner === entry.name)
                    return ownerUser?.full_name || data?.owner || "--";
                }
            }
        },
        {
            id: "po_amount",
            header: ({ column }) => {
                return (
                    <DataTableColumnHeader column={column} title="PO Amt" />
                )
            },
            cell: ({ row }) => {
                const orderData = Array.isArray(row.original?.order_list?.list) ? row.original.order_list.list : [];
                const loading = parseNumber(row.original?.loading_charges);
                const freight = parseNumber(row.original?.freight_charges);

                const poTotal = getPOTotal({ order_list: { list: orderData } }, loading, freight);
                return (<div className="font-medium pr-2">{formatToRoundedIndianRupee(poTotal?.totalAmt)}</div>);

            },
            size: 200,
            enableSorting: false,
            meta: {
                exportHeaderName: "PO Amount",
                exportValue: (row) => {
                    const orderData = Array.isArray(row.order_list?.list) ? row.order_list.list : [];
                    const loading = parseNumber(row.loading_charges);
                    const freight = parseNumber(row.freight_charges);

                    const poTotal = getPOTotal({ order_list: { list: orderData } }, loading, freight);
                    return formatToRoundedIndianRupee(poTotal?.totalAmt);
                }
            }
        },
        ...(["Dispatched PO", "Partially Delivered PO", "Delivered PO"].includes(tab) ? [
            {
                id: "invoice_amount",
                header: ({ column }) => {
                    return (
                        <DataTableColumnHeader column={column} title="Inv Amt" />
                    )
                },
                cell: ({ row }) => {
                    const invoiceAmount = getTotalInvoiceAmount(row.original?.invoice_data);
                    return (
                        <div className={`font-medium pr-2 ${invoiceAmount ? "underline cursor-pointer text-blue-600 hover:text-blue-800" : ""}`} onClick={() => invoiceAmount && setSelectedInvoicePO(row.original)} >
                            {formatToRoundedIndianRupee(invoiceAmount || 0)} {/* Show 0 if no amount */}
                        </div>
                    )
                },
                size: 200,
                enableSorting: false,
                meta: {
                    exportHeaderName: "Invoice Amount",
                    exportValue: (row) => {
                        const invoiceAmount = getTotalInvoiceAmount(row.invoice_data);
                        return formatToRoundedIndianRupee(invoiceAmount || 0);
                    }
                }
            } as ColumnDef<ProcurementOrdersType>,
        ] : []),
        {
            id: "Amount_paid",
            header: "Amt Paid",
            cell: ({ row }) => {
                const amountPaid = getAmountPaid(row.original?.name);
                return (
                    <div className={`font-medium pr-2 ${amountPaid ? "cursor-pointer underline text-blue-600 hover:text-blue-800" : ""}`} onClick={() => amountPaid && setSelectedPaymentPO(row.original)} >
                        {formatToRoundedIndianRupee(amountPaid || 0)}
                    </div>
                );

            },
            size: 200,
            enableSorting: false,
            meta: {
                exportHeaderName: "Amount Paid",
                exportValue: (row) => {
                    const amountPaid = getAmountPaid(row.name);
                    return formatToRoundedIndianRupee(amountPaid || 0);
                }
            }
        },
        // {
        //     accessorKey: 'order_list',
        //     header: () => null,
        //     cell: () => null,
        //     size: 0,
        // }
    ], [tab, userList, getAmountPaid, vendorsList, projects, getTotalInvoiceAmount, getPOTotal]);


    const facetFilterOptions = useMemo(() => ({
        // Use the 'accessorKey' or 'id' of the column
        project: { title: "Project", options: projectOptions }, // Or use 'project' if filtering by ID
        vendor: { title: "Vendor", options: vendorOptions }, // Or use 'vendor' if filtering by ID
        // status: { title: "Status", options: statusOptions },
    }), [projectOptions, vendorOptions]);


    // --- useServerDataTable Hook Instantiation ---
    // Only instantiate if the current tab is supposed to show a data table
    const shouldShowTable = useMemo(() =>
        ["Approved PO", "Dispatched PO", "Partially Delivered PO", "Delivered PO"].includes(tab),
        [tab]);

    // Define which columns should use the date filter
    // const dateColumns = useMemo(() => ["creation", "modified"], []); // Add other date column IDs if needed

    const serverDataTable = useServerDataTable<ProcurementOrdersType>(
        (shouldShowTable ? {
            doctype: DOCTYPE,
            columns: columns,
            fetchFields: fieldsToFetch,
            // defaultSearchField: "name", // Search PO ID by default when specific search is on
            // globalSearchFieldList: poGlobalSearchFields,
            searchableFields: poSearchableFieldsOptions,
            // enableRowSelection: true,
            urlSyncKey: URL_SYNC_KEY,
            defaultSort: 'modified desc', // Default sort order
            additionalFilters: staticFiltersForTab,

            // enableItemSearch: enableItemSearchFeature, // Pass flag to enable item search possibility
        } : { // Provide minimal config when table shouldn't render to satisfy hook types
            doctype: DOCTYPE, columns: [], fetchFields: ["name"], searchableFields: [{ value: "name", label: "PO ID", placeholder: "Search by PO ID..." }]
        }));

    // --- Tab Change Handler ---
    const handleTabClick = useCallback((value: string) => {
        if (tab !== value) {
            setTab(value);
            // Reset pagination/search/filters when changing tabs? Optional.
            // If urlSyncKey is used, the hook will re-initialize state based on URL
            // If you want a full reset, you might need to manually clear URL params
            // or call specific setters from the hook. For now, relying on URL state.
        }
    }, [tab]);


    // --- Determine which view to render based on tab ---
    const renderTabView = () => {
        if (tab === "Approve PO") return <ApproveSelectVendor />;
        if (tab === "Approve Amended PO") return <ApproveSelectAmendPO />;
        if (tab === "Approve Sent Back PO") return <ApproveSelectSentBack />;

        // Handle tabs that should show the DataTable
        if (shouldShowTable) {
            // Show loading skeleton if *any* supporting data is loading
            if (projectsLoading || vendorsListLoading || userListLoading || projectPaymentsLoading) {
                return <TableSkeleton />; // Use your skeleton component
            }
            // Show error if supporting data failed
            if (!projects || !vendorsList || !userList /* || !projectPayments - handle partial errors? */) {
                return <div className="text-red-600 text-center p-4">Error loading supporting data for table view.</div>;
            }
            // Render the DataTable
            return (
                <DataTable<ProcurementOrdersType>
                    table={serverDataTable.table}
                    columns={columns} // Pass dynamically calculated columns
                    isLoading={serverDataTable.isLoading}
                    error={serverDataTable.error}
                    totalCount={serverDataTable.totalCount}
                    // globalFilterValue={serverDataTable.globalFilter}
                    // onGlobalFilterChange={serverDataTable.setGlobalFilter}
                    // globalSearchConfig={{
                    //     isEnabled: serverDataTable.isGlobalSearchEnabled,
                    //     toggle: serverDataTable.toggleGlobalSearch,
                    //     specificPlaceholder: "Search by PO ID...",
                    //     globalPlaceholder: "Search All PO Fields..."
                    // }}

                    // --- Pass new props ---
                    // searchPlaceholder="Search POs (Global)..." // Placeholder for global search
                    // showItemSearchToggle={serverDataTable.showItemSearchToggle} // From hook
                    // itemSearchConfig={{ // Config for the item search toggle
                    //     isEnabled: serverDataTable.isItemSearchEnabled,
                    //     toggle: serverDataTable.toggleItemSearch,
                    //     label: "Item Search" // Optional custom label
                    // }}
                    // --- End new props ---
                    // --- NEW Search Props ---
                    searchFieldOptions={poSearchableFieldsOptions}
                    selectedSearchField={serverDataTable.selectedSearchField} // From hook
                    onSelectedSearchFieldChange={serverDataTable.setSelectedSearchField} // From hook
                    searchTerm={serverDataTable.searchTerm} // From hook
                    onSearchTermChange={serverDataTable.setSearchTerm} // From hook
                    // --- END NEW ---
                    facetFilterOptions={facetFilterOptions}
                    dateFilterColumns={dateColumns}
                    showExportButton={true}
                    onExport={'default'}
                // showRowSelection={serverDataTable.isRowSelectionActive}
                />
            );
        }

        // Fallback if tab doesn't match any view
        return <div>Invalid Tab Selected</div>;

    };
    // --- End Render View Logic ---

    const combinedErrorOverall = projectsError || vendorsError || projectPaymentsError || userError || serverDataTable.error;

    if (combinedErrorOverall && !serverDataTable?.data?.length) { // Show prominent error if main list fails
        return <AlertDestructive error={combinedErrorOverall} />
    }

    return (
        <>
            <InvoiceDataDialog
                open={!!selectedInvoicePO}
                onOpenChange={(open) => !open && setSelectedInvoicePO(undefined)}
                invoiceData={selectedInvoicePO?.invoice_data}
                project={selectedInvoicePO?.project_name}
                poNumber={selectedInvoicePO?.name}
                vendor={selectedInvoicePO?.vendor_name}
            />

            <PaymentsDataDialog
                open={!!selectedPaymentPO}
                onOpenChange={(open) => !open && setSelectedPaymentPO(undefined)}
                payments={projectPayments}
                data={selectedPaymentPO}
                projects={projects}
                vendors={vendorsList}
                isPO
            />
            <div className="flex-1 space-y-4">
                {role !== "Nirmaan Estimates Executive Profile" && (
                    <div className="flex items-center max-md:items-start gap-4 max-md:flex-col">
                        {
                            adminTabs && (
                                <Radio.Group
                                    options={adminTabs}
                                    optionType="button"
                                    buttonStyle="solid"
                                    value={tab}
                                    onChange={(e) => handleTabClick(e.target.value)}
                                />
                            )
                        }
                        {
                            items && (
                                <Radio.Group
                                    options={items}
                                    defaultValue="Approved PO"
                                    optionType="button"
                                    buttonStyle="solid"
                                    value={tab}
                                    onChange={(e) => handleTabClick(e.target.value)}
                                />
                            )
                        }

                    </div>
                )}

                <Suspense fallback={<LoadingFallback />}>
                    {renderTabView()}
                </Suspense>
            </div>
        </>
    )
}

