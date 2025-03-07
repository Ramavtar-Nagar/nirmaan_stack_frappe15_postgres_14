import { VendorsReactMultiSelect } from "@/components/helpers/VendorsReactSelect";
import { Vendor } from "@/components/service-request/select-service-vendor";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProcurementHeaderCard } from "@/components/ui/ProcurementHeaderCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { VendorHoverCard } from "@/components/ui/vendor-hover-card";
import { ProcurementItem, RFQData } from "@/types/NirmaanStack/ProcurementRequests";
import { SentBackCategory } from "@/types/NirmaanStack/SentBackCategory";
import { Vendors } from "@/types/NirmaanStack/Vendors";
import formatToIndianRupee from "@/utils/FormatPrice";
import { useFrappeGetDocList, useFrappeUpdateDoc } from "frappe-react-sdk";
import _ from "lodash";
import { CheckCheck, CircleMinus, CirclePlus, FolderPlus } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MakesSelection } from "../ProcurementRequests/VendorQuotesSelection/ProcurementProgress";

// Custom hook to persist state to localStorage
function usePersistentState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState] as [T, typeof setState];
}

const useProcurementUpdates = (sbId: string, mutate : any) => {
  const { updateDoc, loading: update_loading } = useFrappeUpdateDoc();

  const navigate = useNavigate()

  const updateProcurementData = async (formData: RFQData, updatedData : ProcurementItem[],  value : string) => {
    await updateDoc("Sent Back Category", sbId, {
      rfq_data: formData,
      item_list: { list: updatedData }
    });
    
    await mutate();

    if(value === "review") {
      toast({
        title: "Success!",
        description: `Quotes updated and saved successfully!`,
        variant: "success",
      })
      navigate(`/sent-back-requests/${sbId}?mode=review`)
      localStorage.removeItem(`sentBackDraft_${sbId}`)
    }
  };

  return { updateProcurementData, update_loading };
};

export const SentBackVendorQuotes : React.FC = () => {

  const { sbId } = useParams<{ sbId: string }>()
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("mode") || "edit")
  const [selectedVendors, setSelectedVendors] = useState<Vendor[]>([])
  const [selectedVendorQuotes, setSelectedVendorQuotes] = useState(new Map())
  const [isRedirecting, setIsRedirecting] = useState<string>("")
  const [addVendorsDialog, setAddVendorsDialog] = useState(false)

  const [formData, setFormData] = usePersistentState<RFQData>(`sentBackDraft_${sbId}`, {
      selectedVendors: [],
      details: {},
    });

  const { data: sent_back_list, isLoading: sent_back_list_loading, mutate: sent_back_list_mutate } = useFrappeGetDocList<SentBackCategory>("Sent Back Category", {
      fields: ["*"],
      filters: [["name", "=", sbId]]
    },
    sbId ? `Sent Back Category ${sbId}` : null
  );

  const {data: vendors, isLoading: vendors_loading, error: vendors_error} = useFrappeGetDocList<Vendors>("Vendors", {
      fields: ["vendor_name", "vendor_type", "name", "vendor_city", "vendor_state"],
      filters: [["vendor_type", "in", ["Material", "Material & Service"]]],
      limit: 10000,
      orderBy: { field: "vendor_name", order: "asc" },
    })

  const { updateProcurementData, update_loading } = useProcurementUpdates(sbId, sent_back_list_mutate)

  const [orderData, setOrderData] = useState<SentBackCategory | undefined>();

  useEffect(() => {
      if (sent_back_list) {
        const request = sent_back_list[0]
        const  itemToVendorMap = new Map()
        request.item_list.list.forEach((item) => {
          if(item?.vendor) {
            itemToVendorMap.set(item?.name, item?.vendor)
          }
        })
        if(!Object.keys(formData.details || {}).length && request.rfq_data && Object.keys(request.rfq_data).length) {
            setFormData(request.rfq_data)
        }
        setOrderData(request)
        setSelectedVendorQuotes(itemToVendorMap)
      }
    }, [sent_back_list])
  
    useEffect(() => {
      if (
        orderData && orderData.item_list.list.length > 0 &&
        Object.keys(formData.details).length === 0
      ) {
        const newDetails: RFQData['details'] = {};
        
        orderData.item_list.list.forEach((item) => {
          const matchingCategory = orderData.category_list.list.find(
            (cat) => cat.name === item.category
          );
          const defaultMakes = matchingCategory ? matchingCategory.makes : [];
          newDetails[item.name] = {
            vendorQuotes: {},
            makes: defaultMakes,
          };
        });
        setFormData((prev) => ({ ...prev, details: newDetails }));
      }
    }, [orderData, formData.details]);
  
    const useVendorOptions = (vendors : any, selectedVendors: Vendor[]) => 
      useMemo(() => vendors
        ?.filter(v => !selectedVendors.some(sv => sv.name === v.name))
        .map(v => ({
          label: v.vendor_name,
          value: v.name,
          city: v.vendor_city,
          state: v.vendor_state,
          ...v
        })),
      [vendors, selectedVendors]
    );
  
  const vendorOptions = useVendorOptions(vendors, formData.selectedVendors);

  const updateURL = (key : string, value : string) => {
      const url = new URL(window.location);
      url.searchParams.set(key, value);
      window.history.pushState({}, "", url);
  };
  
  
  const onClick = async (value : string) => {
      if (mode === value) return;
      if(value === "view" && JSON.stringify(formData) !== JSON.stringify(orderData?.rfq_data || {})) {
        setIsRedirecting("view")
        const updatedOrderList = orderData?.item_list?.list?.map((item) => {
          if (selectedVendorQuotes.has(item.name)) {
            const vendorId : string = selectedVendorQuotes.get(item.name);
            const vendorData = formData.details?.[item.name]?.vendorQuotes?.[vendorId];
            if (vendorData) {
              return {
                ...item,
                vendor: vendorId,
                quote: vendorData.quote,
                make: vendorData.make,
              };
            }
            return { ...item };
          } else {
            const { vendor, quote, make, ...rest } = item;
            return rest;
          }
        });
      
        setOrderData({ ...orderData, item_list: { list: updatedOrderList } });
        await updateProcurementData(formData, updatedOrderList, value)
      }
      setMode(value);
      updateURL("mode", value);
  };
  
  const removeVendor = useCallback((vendorId: string) => {
      setFormData((prev) => {
        const updatedSelectedVendors = prev.selectedVendors.filter(
          (v) => v?.name !== vendorId
        );
    
        const updatedDetails = Object.keys(prev.details).reduce(
          (acc, itemId) => {
            const itemDetails = prev.details[itemId];
            const updatedVendorQuotes = { ...itemDetails.vendorQuotes };
            delete updatedVendorQuotes[vendorId];
    
            acc[itemId] = {
              ...itemDetails,
              vendorQuotes: updatedVendorQuotes,
            };
            return acc;
          },
          {} as typeof prev.details
        );
    
        return {
          ...prev,
          selectedVendors: updatedSelectedVendors,
          details: updatedDetails,
        };
      });
  
      setSelectedVendorQuotes(prev => {
        const updatedQuotes = new Map(prev)
  
        for(const [itemId, vendor] of updatedQuotes) {
          if (vendor === vendorId) updatedQuotes.delete(itemId)
        }
        return updatedQuotes
      })
  
      setOrderData((prev) => ({
        ...prev,
        item_list: {
          list: prev?.item_list.list.map((item) => 
          item?.vendor === vendorId ? _.omit(item, ["vendor", "quote", "make"]) : item
          )
        }
      }))
    }, []);
  
    const handleVendorSelection = () => {
      setFormData((prev) => ({ ...prev, selectedVendors: [...prev.selectedVendors, ...selectedVendors] }));
      setSelectedVendors([]);
      setAddVendorsDialog(false);
    };
  
   const handleQuoteChange = useCallback((
    itemId: string,
    vendorId: string,
    quote: number | undefined,
  ) => {
    setFormData((prev) => ({
      ...prev,
      details: {
        ...prev.details,
        [itemId]: {
          ...prev.details[itemId],
          vendorQuotes: {
            ...prev.details[itemId].vendorQuotes,
            [vendorId]: { ...(prev.details[itemId].vendorQuotes[vendorId] || {}), quote: quote },
          },
        },
      },
    }))
  
  const isValidQuote = quote && quote > 0;
  if (!isValidQuote) {
    setSelectedVendorQuotes(prev => {
      const updated = new Map(prev);
      if (updated.get(itemId) === vendorId) {
        updated.delete(itemId);
      }
      return updated;
    });
  }
  }, []);
  
  const handleReviewChanges = async () => {
    const updatedOrderList = orderData?.item_list?.list?.map((item) => {
      if (selectedVendorQuotes.has(item.name)) {
        const vendorId : string = selectedVendorQuotes.get(item.name);
        const vendorData = formData.details?.[item.name]?.vendorQuotes?.[vendorId];
        if (vendorData) {
          return {
            ...item,
            vendor: vendorId,
            quote: vendorData.quote,
            make: vendorData.make,
          };
        }
        return { ...item };
      } else {
        const { vendor, quote, make, ...rest } = item;
        return rest;
      }
    });
  
    setOrderData({ ...orderData, item_list: { list: updatedOrderList } });
  
    setIsRedirecting("review");
  
    await updateProcurementData(formData, updatedOrderList, "review");
  };


  return (
    <div className="flex-1 space-y-4">
    <ProcurementHeaderCard orderData={orderData} sentBack />
    <div className="flex items-center max-sm:items-end justify-between">
    <div className="flex gap-4 max-sm:flex-col">
      <h2 className="text-lg font-semibold tracking-tight max-sm:text-base ml-2">RFQ List</h2>
      <div className="flex items-center border border-primary text-primary rounded-md text-xs cursor-pointer">
        <span  role="radio" tabIndex={0} aria-checked={mode === "edit"} onClick={() => onClick("edit")} className={`${mode === "edit" ? "bg-red-100" : ""} py-1 px-4 rounded-md`}>Edit</span>
        <span role="radio" tabIndex={0} aria-checked={mode === "view"}  onClick={() => onClick("view")}  className={`${mode === "view" ? "bg-red-100" : ""} py-1 px-4 rounded-md`}>View</span>
      </div>
    </div>

    <div className="flex gap-2 items-center">
      {mode === "edit" && (
        <Button onClick={() => setAddVendorsDialog(true)} variant={"outline"} className="text-primary border-primary flex gap-1">
        <CirclePlus className="w-4 h-4" />
        Add {formData?.selectedVendors?.length > 0 && "More"} Vendors
      </Button>
      )}

      <Button variant={"outline"} className="text-primary border-primary flex gap-1">
        <FolderPlus className="w-4 h-4" />
        Generate RFQ
        </Button>
    </div>

    </div>
    <div className="overflow-x-auto space-y-4 rounded-md border shadow-sm p-4">
            {orderData?.category_list?.list.map((cat: any, index) => {
              return <div key={cat.name} className="min-w-[400px]">
                <Table>
                  <TableHeader>
                    {index === 0 && (
                    <TableRow className="bg-red-100">
                      <TableHead className="min-w-[200px] w-[30%] text-red-700 font-bold">
                        Item Details
                      </TableHead>
                      <TableHead className="min-w-[80px] w-[10%] text-red-700 font-bold">QTY</TableHead>
                      <TableHead className="min-w-[80px] w-[10%] text-red-700 font-bold">UOM</TableHead>
                      {formData?.selectedVendors?.length === 0 ? (
                        <TableHead className="min-w-[300px] w-[50%] text-red-700">
                        <p className="border text-center border-gray-400 rounded-md py-1 font-medium">No Vendors Selected</p>
                      </TableHead>
                      ) : (
                        formData?.selectedVendors?.map((v, _) => <TableHead key={v?.name} className={`text-center w-[15%] text-red-700 text-xs font-medium`}>
                          <p className="min-w-[150px] max-w-[150px] border border-gray-400 rounded-md py-1 flex gap-1 items-center justify-center">
                              <div className="truncate text-left">
                                <VendorHoverCard vendor_id={v?.name} />
                              </div>
                          {mode === "edit" &&  (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <CircleMinus className="w-4 h-4 cursor-pointer" />
                              </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>Click on confirm to remove this vendor?</AlertDialogDescription>
                                <div className="flex items-end justify-end gap-2">
                                  <AlertDialogCancel asChild>
                                    <Button variant="outline" className="border-primary text-primary">Cancel</Button>
                                  </AlertDialogCancel>
                                  <Button onClick={() => removeVendor(v?.name || "")} className="flex items-center gap-1">
                                    <CheckCheck className="h-4 w-4" />
                                    Confirm
                                  </Button>
                                </div>
                              </AlertDialogHeader>

                            </AlertDialogContent>
                          </AlertDialog>
                          )}
                          </p>
                          </TableHead>)
                      )}
                    </TableRow>
                    )}
                    <TableRow className="bg-red-50">
                      <TableHead className="min-w-[200px] w-[30%] text-red-700">
                        {cat.name}
                      </TableHead>
                      <TableHead className="min-w-[80px] w-[10%]" />
                      <TableHead className="min-w-[80px] w-[10%]" />
                      {formData?.selectedVendors?.length === 0 ? (
                        <TableHead className="min-w-[300px] w-[50%]" />
                      ) : (
                        formData?.selectedVendors?.map((v, _, arr) => <TableHead className={`min-w-[150px] w-[15%] max-w-[150px]`} />)
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderData?.item_list?.list.map((item: any) => {
                      if (item.category === cat.name) {
                        return (
                          <TableRow key={`${cat.name}-${item.name}`}>
                            <TableCell className="py-8">
                            {item.item}
                            </TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            {formData?.selectedVendors?.map(v => {
                              const data = formData?.details?.[item.name]?.vendorQuotes?.[v?.name]
                              const quote = data?.quote
                              const make = data?.make
                              return (
                                <TableCell key={`${item.name}-${v?.name}`}>
                                  <div aria-disabled={mode === "edit" || !quote} aria-checked={mode === "view" && (selectedVendorQuotes?.get(item?.name) === v?.name)} 
                                  onClick={() => {
                                    if(mode === "edit") {
                                      return
                                    }
                                    setSelectedVendorQuotes(new Map(selectedVendorQuotes.set(item.name, v?.name)))
                                  }} role="radio" tabIndex={0} className={`min-w-[150px] max-w-[150px] space-y-2 p-2 border border-gray-400 rounded-md ${mode === "view" && !quote ? "aria-disabled:pointer-events-none aria-disabled:opacity-50" : ""} ${mode === "view" && selectedVendorQuotes?.get(item?.name) === v?.name ? "bg-red-100" : ""}`}>
                                    <div className="flex flex-col gap-1">
                                      <Label className="text-xs font-semibold text-primary">Make</Label>
                                      {mode === "edit" ? (
                                         <MakesSelection vendor={v} item={item} formData={formData} orderData={orderData} setFormData={setFormData} />
                                      ) : (
                                        <p>{make || "--"}</p>
                                      )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <Label className="text-xs font-semibold text-primary">Rate</Label>
                                      {mode === "edit" ? (
                                        <Input className="h-8" type="number" value={quote || ""} onChange={(e) => {
                                          const value = e.target.value === "" ? 0 : parseInt(e.target.value)
                                          handleQuoteChange(item.name, v?.name, value)
                                        }} />
                                      ) : (
                                        <p>{quote ?  formatToIndianRupee(quote) : "--"}</p>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        )
                      }
                    })}
                  </TableBody>
                </Table>
              </div>
            })}
    </div>  
  
  {update_loading && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
      <p className="text-lg font-semibold">{isRedirecting === "view" ? "Saving Changes... Please wait" : "Redirecting... Please wait"}</p>
    </div>
  </div>
  )}
    
    <div className="flex justify-end">
      <Button disabled={mode === "edit" || selectedVendorQuotes?.size !== orderData?.item_list?.list?.length} onClick={handleReviewChanges}>Continue</Button>
    </div>

    <AlertDialog open={addVendorsDialog} onOpenChange={() => setAddVendorsDialog(!addVendorsDialog)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">Add Vendors</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          <VendorsReactMultiSelect vendorOptions={vendorOptions || []} setSelectedVendors={setSelectedVendors} />
        </AlertDialogDescription>
        <div className="flex items-end gap-4">
          <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
          <Button onClick={handleVendorSelection} className="flex-1">Confirm</Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  </div>
  )
}