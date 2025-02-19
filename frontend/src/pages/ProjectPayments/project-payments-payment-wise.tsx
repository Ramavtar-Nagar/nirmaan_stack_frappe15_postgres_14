import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/utils/FormatDate";
import formatToIndianRupee from "@/utils/FormatPrice";
import { Radio } from "antd";
import { useFrappeDeleteDoc, useFrappeDocTypeEventListener, useFrappeFileUpload, useFrappeGetDocList, useFrappePostCall, useFrappeUpdateDoc } from "frappe-react-sdk";
import { Paperclip, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { TailSpin } from "react-loader-spinner";
import { Link, useSearchParams } from "react-router-dom";
import { ProjectPaymentsList } from "./project-payments-list";

export const ProjectPaymentsPaymentWise = () => {

    const [searchParams] = useSearchParams();

    const [tab, setTab] = useState<string>(searchParams.get("tab") || "New Payments");

    const [dialogType, setDialogType] = useState<"fulfill" | "delete">("fulfill");

    const { upload: upload, loading: upload_loading } = useFrappeFileUpload()
    
    const { call } = useFrappePostCall('frappe.client.set_value')

    const { updateDoc, loading: updateLoading } = useFrappeUpdateDoc()

    const { deleteDoc, loading: deleteLoading } = useFrappeDeleteDoc()

    const [paymentData, setPaymentData] = useState({});

    const [paymentScreenshot, setPaymentScreenshot] = useState(null);

    const handleFileChange = (event) => {
        setPaymentScreenshot(event.target.files[0]);
    };

    const { data: projects, isLoading: projectsLoading, error: projectsError } = useFrappeGetDocList("Projects", {
        fields: ["name", "project_name"],
        limit: 1000,
    });

    const { data: vendors, isLoading: vendorsLoading, error: vendorsError } = useFrappeGetDocList("Vendors", {
        fields: ["*"],
        limit: 10000,
    });

    const { data: projectPayments, isLoading: projectPaymentsLoading, error: projectPaymentsError, mutate: projectPaymentsMutate } = useFrappeGetDocList("Project Payments", {
        fields: ["*"],
        limit: 100000,
        orderBy: { field: "payment_date", order: "desc" }
    })

    const { data: serviceOrders, isLoading: srLoading, error: srError, mutate: srMutate } = useFrappeGetDocList("Service Requests", {
        fields: ["*"],
        filters: [["status", "=", "Approved"]],
        limit: 10000,
        orderBy: { field: "modified", order: "desc" },
    });

    useFrappeDocTypeEventListener("Project Payments", async () => {
        await projectPaymentsMutate();
    });

    const [fulFillPaymentDialog, setFulFillPaymentDialog] = useState(false);

    const toggleFulFillPaymentDialog = () => {
        setFulFillPaymentDialog((prevState) => !prevState);
    };

    const items = ["New Payments", "Fulfilled Payments"];

    const updateURL = (key, value) => {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.pushState({}, "", url);
    };

    const onClick = (value) => {
        if (tab === value) return; // Prevent redundant updates

        const newTab = value;
        setTab(newTab);
        updateURL("tab", newTab);
    };

    const FilfillPayment = async () => {
        try {

            await updateDoc("Project Payments", paymentData?.name, {
                status: "Paid",
                payment_date: paymentData?.payment_date,
                utr: paymentData?.utr,
                tds: paymentData?.tds,
                amount: tds ? paymentData?.amount - paymentData?.tds : paymentData?.amount
            })

            const fileArgs = {
                doctype: "Project Payments",
                docname: paymentData?.name,
                fieldname: "payment_attachment",
                isPrivate: true,
            };

            const uploadedFile = await upload(paymentScreenshot, fileArgs);

            await call({
                doctype: "Project Payments",
                name: paymentData?.name,
                fieldname: "payment_attachment",
                value: uploadedFile.file_url,
            });

            await projectPaymentsMutate()
            toggleFulFillPaymentDialog()

            toast({
                title: "Success!",
                description: "Payment updated successfully!",
                variant: "success",
            });

        } catch (error) {
            console.log("error", error)
            toast({
                title: "Failed!",
                description: "Failed to update Payment!",
                variant: "destructive",
            });
        }
    }

    const DeletePayment = async () => {
        try {
            await deleteDoc("Project Payments", paymentData?.name)

            await projectPaymentsMutate()

            toggleFulFillPaymentDialog()
            toast({
                title: "Success!",
                description: "Payment deleted successfully!",
                variant: "success",
            });
        } catch (error) {
            console.log("error", error);
            toast({
                title: "Failed!",
                description: "Failed to delete Payment!",
                variant: "destructive",
            });
        }
    }

    const getRowSelection = (vendor) => {
        const data = vendors?.find((item) => item.name === vendor);
        if (data?.account_number) {
            return false
        }
        return true;
    }

    const projectValues = projects?.map((item) => ({
        label: item.project_name,
        value: item.name,
    })) || [];

    const vendorValues = vendors?.map((item) => ({
        label: item.vendor_name,
        value: item.name,
    })) || [];

    const siteUrl = `${window.location.protocol}//${window.location.host}`;

    const columns = useMemo(
        () => [
                ...(tab === "New Payments" ? [
                    {
                        id: "select",
                        header: ({ table }) => {
                            const visibleRows = table.getRowModel().rows;
                            const selectableRows = visibleRows.filter(
                              (row) => !getRowSelection(row.original.vendor)
                            );
                        
                            const allSelected =
                              selectableRows.length > 0 &&
                              selectableRows.every((row) => row.getIsSelected());
                            const someSelected =
                              selectableRows.some((row) => row.getIsSelected()) && !allSelected;
                        
                            return (
                              <Checkbox
                                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                                disabled={selectableRows.length === 0}
                                onCheckedChange={(value) => {
                                  selectableRows.forEach((row) => {
                                    if (value) {
                                      if (!row.getIsSelected()) row.toggleSelected(true);
                                    } else {
                                      if (row.getIsSelected()) row.toggleSelected(false);
                                    }
                                  });
                                }}
                                aria-label="Select all"
                              />
                            );
                          },
                        cell: ({ row }) => {
                            const rowDisabled = getRowSelection(row.original.vendor)
                          return <Checkbox
                            checked={row.getIsSelected()}
                            disabled={rowDisabled}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="Select row"
                          />
                        },
                        enableSorting: false,
                        enableHiding: false,
                      },
                ] : []),
            ...(tab === "Fulfilled Payments" ? [
                {
                    accessorKey: "utr",
                    header: "UTR",
                    cell: ({ row }) => {
                        const data = row.original
                        return (
                            <div className="font-medium text-blue-500 underline hover:underline-offset-2">
                                {import.meta.env.MODE === "development" ? (
                                    <a href={`http://localhost:8000${data?.payment_attachment}`} target="_blank" rel="noreferrer">
                                        {data?.utr}
                                    </a>
                                ) : (
                                    <a href={`${siteUrl}${data?.payment_attachment}`} target="_blank" rel="noreferrer">
                                        {data?.utr}
                                    </a>
                                )}
                            </div>
                        );
                    },
                },
            ] : []),
            {
                accessorKey: "payment_date",
                header: ({ column }) => {
                    return (
                        <DataTableColumnHeader column={column} title="Date" />
                    )
                },
                cell: ({ row }) => {
                    const data = row.original
                    return <div className="font-medium">{formatDate(data?.payment_date || data?.creation)}</div>;
                },
            },
            {
                accessorKey: "document_name",
                header: "#PO",
                cell: ({ row }) => {
                    return <div className="font-medium">{row.getValue("document_name")}</div>;
                }
            },
            {
                accessorKey: "project",
                header: "Project",
                cell: ({ row }) => {
                    const project = projectValues.find(
                        (project) => project.value === row.getValue("project")
                    );
                    return project ? <div className="font-medium">{project.label}</div> : null;
                },
                filterFn: (row, id, value) => {
                    return value.includes(row.getValue(id))
                },
            },
            {
                accessorKey: "vendor",
                header: "Vendor",
                cell: ({ row }) => {
                    const vendor = vendorValues.find(
                        (vendor) => vendor.value === row.getValue("vendor")
                    );
                    return vendor ? <div className="font-medium text-blue-600 underline"><Link to={`/vendors/${vendor.value}`}>{vendor.label}</Link></div> : null;
                },
                filterFn: (row, id, value) => {
                    return value.includes(row.getValue(id))
                }
            },
            {
                accessorKey: "amount",
                header: ({ column }) => {
                    return (
                        <DataTableColumnHeader column={column} title={tab === "New Payments" ? "Amount Requested" : "Amount Paid"} />
                    )
                },
                cell: ({ row }) => {
                    return <div className="font-medium">
                        {formatToIndianRupee(parseFloat(row.original?.amount) + parseFloat(row.original?.tds || 0))}
                    </div>
                },
            },
            ...(tab === "New Payments" ? [
                {
                    id: "actions",
                    header: ({ column }) => {
                        return (
                            <DataTableColumnHeader column={column} title="Actions" />
                        )
                    },
                    cell: ({row}) => {
                        return (
                            <div className="flex items-center gap-3">
                                <Button onClick={() => {
                                    setDialogType("fulfill")
                                    setPaymentData(row.original)
                                    toggleFulFillPaymentDialog()
                                }} variant={"outline"} className="bg-[#00AC06] h-6 text-white">Pay</Button>
                                <Trash2
                                onClick={() => {
                                    setDialogType("delete")
                                    setPaymentData(row.original)
                                    toggleFulFillPaymentDialog()
                                }}
                                 className="text-red-500 cursor-pointer" />
                            </div>
                        )
                    }
                }
            ] : [])
        ],
        [projectValues, vendorValues, projectPayments, tab]
    );

    if (projectsError || vendorsError || projectPaymentsError) {
        toast({
            title: "Error!",
            description: `Error: ${vendorsError?.message || projectsError?.message || projectPaymentsError?.message}`,
            variant: "destructive",
        });
    }

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center max-sm:items-start gap-6 max-sm:flex-col">
            {items && (
                <Radio.Group
                    block
                    options={items}
                    defaultValue="New Payments"
                    optionType="button"
                    buttonStyle="solid"
                    value={tab}
                    onChange={(e) => onClick(e.target.value)}
                />
            )}
            <Radio.Group
                block
                options={["PO Wise"]}
                optionType="button"
                buttonStyle="solid"
                value={tab}
                onChange={(e) => onClick(e.target.value)}
            />
            </div>
            {["New Payments", "Fulfilled Payments"].includes(tab) ? (
                projectsLoading || vendorsLoading || projectPaymentsLoading ? (
                    <TableSkeleton />
                ) : (
                    <DataTable columns={columns} data={projectPayments?.filter(p => p?.status === (tab === "New Payments" ? "Approved" : "Paid")) || []} project_values={projectValues} vendorData={vendors} approvedQuotesVendors={vendorValues} isExport={tab === "New Payments"} />
                )
            ) : (
                <ProjectPaymentsList />
            )}

            <AlertDialog open={fulFillPaymentDialog} onOpenChange={toggleFulFillPaymentDialog}>
                <AlertDialogContent className="py-8 max-sm:px-12 px-16 text-start overflow-auto">
                    <AlertDialogHeader className="text-start">
                        <AlertDialogTitle className="text-center">
                            { dialogType === "fulfill" ? "Fulfill Payment" : "Delete Payment" }
                        </AlertDialogTitle>
                        {dialogType === "fulfill" ? (
                            <>
                            <div className="flex items-center justify-between">
                            <Label className=" text-red-700">Project:</Label>
                            <span className="">{projectValues?.find(i => i?.value === paymentData?.project)?.label}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className=" text-red-700">Vendor:</Label>
                            <span className="">{vendorValues?.find(i => i?.value === paymentData?.vendor)?.label}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className=" text-red-700">PO Number:</Label>
                            <span className="">{paymentData?.document_name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className=" text-red-700">Amount:</Label>
                            <span className="">{formatToIndianRupee(paymentData?.amount - paymentData?.tds)}</span>
                        </div>

                        <div className="flex flex-col gap-4 pt-4">
                            <div className="flex items-center gap-4 w-full">
                                <Label className="w-[40%]">UTR<sup className=" text-sm text-red-600">*</sup></Label>
                                <Input
                                    type="text"
                                    placeholder="Enter UTR"
                                    value={paymentData?.utr || ""}
                                    onChange={(e) => setPaymentData({ ...paymentData, utr: e.target.value })}
                                />
                            </div>
                            {(paymentData?.document_type === "Service Requests" && serviceOrders?.find(i => i?.name === paymentData?.document_name).gst === "true") && <div className="flex items-center gap-4 w-full">
                                <Label className="w-[40%]">TDS Deduction</Label>
                                <div className="w-full"> 
                                <Input
                                    type="number"
                                    placeholder="Enter TDS Amount"
                                    value={paymentData?.tds || ""}
                                    onChange={(e) => {
                                        const tdsValue = parseFloat(e.target.value || 0);
                                        setPaymentData({ ...paymentData, tds: tdsValue })
                                    }}
                                />
                                </div>
                            </div>}
                            <div className="flex items-center gap-4 w-full" >
                                <Label className="w-[40%]">Payment Date<sup className=" text-sm text-red-600">*</sup></Label>
                                <Input
                                        type="date"
                                        value={paymentData?.payment_date || ""}
                                        placeholder="DD/MM/YYYY"
                                        onChange={(e) => setPaymentData({...paymentData, payment_date: e.target.value})}
                                        max={new Date().toISOString().split("T")[0]}
                                        onKeyDown={(e) => e.preventDefault()}
                                     />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className={`text-blue-500 cursor-pointer flex gap-1 items-center justify-center border rounded-md border-blue-500 p-2 mt-4 ${paymentScreenshot && "opacity-50 cursor-not-allowed"}`}
                                onClick={() => document.getElementById("file-upload")?.click()}
                            >
                                <Paperclip size="15px" />
                                <span className="p-0 text-sm">Attach Screenshot</span>
                                <input
                                    type="file"
                                    id={`file-upload`}
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={paymentScreenshot ? true : false}
                                />
                            </div>
                            {(paymentScreenshot) && (
                                <div className="flex items-center justify-between bg-slate-100 px-4 py-1 rounded-md">
                                    <span className="text-sm">{paymentScreenshot?.name}</span>
                                    <button
                                        className="ml-1 text-red-500"
                                        onClick={() => setPaymentScreenshot(null)}
                                    >
                                        ✖
                                    </button>
                                </div>
                            )}
                        </div>
                            </>

                        ) : (
                            <AlertDialogDescription>Are you sure you want to delete this payment?</AlertDialogDescription>
                        )}
                        <div className="flex gap-2 items-center pt-4 justify-center">
                            {updateLoading || upload_loading || deleteLoading ? <TailSpin color="red" width={40} height={40} /> : (
                                <>
                                    <AlertDialogCancel className="flex-1" asChild>
                                        <Button variant={"outline"} className="border-primary text-primary">Cancel</Button>
                                    </AlertDialogCancel>
                                    {dialogType === "fulfill" ?
                                    <Button
                                        onClick={FilfillPayment}
                                        disabled={!paymentScreenshot || !paymentData.utr || !paymentData.payment_date}
                                        className="flex-1">Confirm
                                    </Button>
                                     :
                                     <Button
                                        onClick={DeletePayment}
                                        className="flex-1">
                                            Confirm
                                    </Button>
                                     }
                                </>
                            )}
                        </div>

                    </AlertDialogHeader>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};