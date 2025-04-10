import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { useFrappeCreateDoc, useFrappeFileUpload, useFrappeGetDocList, useFrappePostCall, useFrappeUpdateDoc, useSWRConfig } from "frappe-react-sdk"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
    SheetClose
} from "@/components/ui/sheet"
import { Button } from "../ui/button";
import { ListChecks, MessageCircleMore, Paperclip } from "lucide-react";
import { toast } from "../ui/use-toast";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import { TailSpin } from "react-loader-spinner";
import { Label } from "../ui/label";
import ReactSelect, {components} from 'react-select';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Badge } from "../ui/badge";

interface Category {
    name: string;
}

export default function SentBackQuotationForm({ vendor_id, pr_id, sb_id }) {

    const { data: sent_back_list, isLoading: sent_back_list_loading, error: sent_back_list_error } = useFrappeGetDocList("Sent Back Category",
        {
            fields: ["*"],
            filters: [["name", "=", sb_id]],
            limit: 1000
        });

    const [orderData, setOrderData] = useState({
        project: '',
        category: ''
    })

    if (!orderData.project) {
        sent_back_list?.map(item => {
            if (item.name === sb_id) {
                setOrderData(item)
            }
        })
    }
    const { data: quotation_request_list, mutate: quotation_request_list_mutate  } = useFrappeGetDocList("Quotation Requests",
        {
            fields: ['name', 'lead_time', 'quote', 'item', 'category', 'vendor', 'procurement_task', 'quantity', 'makes'],
            filters: [["procurement_task", "=", pr_id], ["vendor", "=", vendor_id]],
            limit: 1000
        });

    const { data: vendor_list, isLoading: vendor_list_loading, error: vendor_list_error } = useFrappeGetDocList("Vendors",
        {
            fields: ["*"],
            filters: [["vendor_type", "in", ["Material", "Material & Service"]]],
            limit: 10000
        },
        "Material Vendors"
    );
    const { data: item_list, isLoading: item_list_loading, error: item_list_error } = useFrappeGetDocList("Items",
        {
            fields: ['name', 'item_name', 'unit_name'],
            limit: 100000
        });
    const { data: procurement_request_list, isLoading: procurement_request_list_loading, error: procurement_request_list_error } = useFrappeGetDocList("Procurement Requests",
        {
            fields: ["*"],
            limit: 10000
        },
        "Procurement Requests"
    );
    const { data: address_list, isLoading: address_list_loading, error: address_list_error } = useFrappeGetDocList("Address",
        {
            fields: ['name', 'address_title', 'address_line1', 'address_line2', 'city', 'state', 'pincode'],
            limit: 10000
        });
    
    const { data: prAttachment, mutate: prAttachmentMutate } = useFrappeGetDocList("PR Attachments",
        {
            fields: ["*"],
            filters: [["procurement_request", "=", pr_id], ["vendor", "=", vendor_id]],
            limit: 100000
    });

    const [categories, setCategories] = useState<{ list: Category[] }>({ list: [] });
    const [quotationData, setQuotationData] = useState({
        list: []
    });
    const [deliveryTime, setDeliveryTime] = useState<number | string | null>(null)
    const [selectedFile, setSelectedFile] = useState(null);

    const [mandatoryMakesQs, setMandatoryMakesQs] = useState([])

    const [saveEnabled, setSaveEnabled] = useState(false)

    useEffect(() => {
            const filteredMandatoryMakes = quotationData?.list?.filter(i => mandatoryMakesQs.includes(i?.qr_id))
            const allMakesChanged = filteredMandatoryMakes?.every(i => {
              if(i?.price !== undefined && i?.makes !== undefined) {
                return true
              } else if(i?.price === undefined && i?.makes !== undefined) {
                return true
              } else if(i?.price !== undefined && i?.makes === undefined) {
                return false
              }
              return false
            })
    
            setSaveEnabled(allMakesChanged)
    
    }, [quotationData, mandatoryMakesQs]);

    useEffect(() => {
      if(quotation_request_list && sent_back_list) {
        const cats = categories.list
        const sbCats = sent_back_list[0]?.category_list.list.map((item) => item.name)
        quotation_request_list.map((item) => {
            const categoryExists = cats.some(category => category.name === item.category );
            if (!categoryExists && (sbCats.includes(item.category))) {
                cats.push({ name: item.category })
            }
        })
        setCategories({
            list: cats
        })
      }

      if(quotation_request_list && !deliveryTime) {
        setDeliveryTime(quotation_request_list[0].lead_time)
      }
    }, [quotation_request_list, sent_back_list]);

    useEffect(() => {
      if(quotation_request_list && sent_back_list) {
        const sbCats = sent_back_list[0]?.category_list.list.map((item) => item.name)
        const mandatoryMakes = quotation_request_list?.map(item => (item?.makes?.list?.length > 0 && item?.makes?.list?.every(j => j?.enabled === "false")) && sbCats?.includes(item?.category)  && item?.name)?.filter(i => !!i) || []
        setMandatoryMakesQs(mandatoryMakes)
      }
    }, [quotation_request_list, sent_back_list])

    const getItem = (item: string) => {
        const item_name = item_list?.find(value => value.name === item).item_name;
        return item_name
    }
    const getUnit = (item: string) => {
        const item_unit = item_list?.find(value => value.name === item).unit_name;
        return item_unit
    }

    const getComment = (item) => {
        const procurement_list = procurement_request_list?.find(value => value.name === pr_id)?.procurement_list.list
        return procurement_list?.find((i) => i.name === item)?.comment || ""
    }

    const handlePriceChange = (new_qrid : string, item: string, value: number) => {
        // const new_qrid = quotation_request_list?.find(q => q.item === item)?.name;
        const existingIndex = quotationData.list.findIndex(q => q.qr_id === new_qrid);
        const newList = [...quotationData.list];

        if (existingIndex !== -1) {
            newList[existingIndex] = {
                ...newList[existingIndex],
                price: value
            };
        } else {
            newList.push({
                qr_id: new_qrid,
                price: value
            });
        }
        setQuotationData({list: newList});
    };

    const handleMakeChange = (new_qrid, makes, make) => {
      const newList = [...quotationData.list];
    
      const existingIndex = quotationData.list.findIndex(q => q.qr_id === new_qrid);
    
      if (existingIndex !== -1) {

        const filteredMakes = makes?.map(m => m?.make === make ? { make, enabled: "true" } : {make : m?.make, enabled: "false"});
    
        newList[existingIndex] = {
          ...newList[existingIndex],
          makes: filteredMakes,
        };
      } else {
        const updatedMakes = makes?.map((m) =>
          m.make === make ? { make, enabled:  "true" } : {make : m?.make, enabled: "false"}
        );
    
        newList.push({
          qr_id: new_qrid,
          makes: updatedMakes,
        });
      }

      setQuotationData({list: newList});
    };

    const handleDeliveryTimeChange = () => {
      if(orderData && quotation_request_list) {
        const filteredQuotationList = quotation_request_list?.filter((i) => orderData?.item_list?.list?.some((j) => j?.name === i?.item))
      
        const updatedList = filteredQuotationList.map(q => {
          const existingItem = quotationData.list.find(item => item.qr_id === q.name);

          if (existingItem) {
              return {
                  ...existingItem
              };
          }
          return {
              qr_id: q.name,
              price: parseFloat(q.quote || 0),
          };
      });
  
      setQuotationData({list: updatedList});
      }
  };

  useEffect(() => {
    if(deliveryTime && quotation_request_list[0].lead_time !== deliveryTime) {
      handleDeliveryTimeChange()
    }
  }, [deliveryTime])

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const { upload: upload, loading: upload_loading } = useFrappeFileUpload()
    const { call } = useFrappePostCall('frappe.client.set_value')


    useEffect(() => {
        if(prAttachment && prAttachment.length) {
            const url = prAttachment[0]?.rfq_pdf || ""
            const match = url.match(/file_name=([^&]+)/);
            const fileName = match ? match[1] : "selectedFile";
            setSelectedFile(fileName)
        }
    }, [prAttachment])

    const { createDoc: createDoc, loading: create_loading } = useFrappeCreateDoc()
    const { updateDoc: updateDoc, loading: update_loading } = useFrappeUpdateDoc()

    const {mutate} = useSWRConfig()

    const handleSubmit = async () => {
        try {
          const batchSize = 10; // Number of items per batch
          const promises = [];

          for (let i = 0; i < quotationData.list.length; i += batchSize) {
            const batch = quotationData.list.slice(i, i + batchSize);
            promises.push(
              Promise.all(
                batch.map(async (item) => {
                  if(item?.makes !== undefined && item?.price !== undefined) {
                    await updateDoc("Quotation Requests", item.qr_id, {
                      lead_time: deliveryTime,
                      quote: !item.price ? null : item.price,
                      makes: {list : item?.makes}
                    });
                  } else if(item?.makes === undefined && item?.price !== undefined){
                    await updateDoc("Quotation Requests", item.qr_id, {
                      lead_time: deliveryTime,
                      quote: !item.price ? null : item.price,
                    });
                  } else {
                    await updateDoc("Quotation Requests", item.qr_id, {
                      lead_time: deliveryTime,
                      makes: {list : item?.makes},
                    });
                  }
                })
              )
            );
          }
    
        // Wait for all the batches to complete.
        await Promise.all(promises);

        await quotation_request_list_mutate()

        await mutate(`Quotations Requests,Procurement_task=${pr_id}`)

        // Single success toast after all batches have completed.
        toast({
          title: "Success!",
          description: `All Quote(s) for ${vendor_name} have been updated successfully.`,
          variant: "success",
        });
      
          // Handle file upload if a file is selected.
          if (selectedFile) {
            // Check if the selected file is an object (newly uploaded file) or a string (existing file).
            if (typeof selectedFile === "object" || (typeof selectedFile === "string" && selectedFile !== prAttachment[0]?.rfq_pdf.split("/")[3])) {
              let docId;
      
              // If a PR attachment for this vendor already exists, update the document. Otherwise, create a new document.
              if (prAttachment && prAttachment?.length > 0) {
                docId = prAttachment[0].name;
              } else {
                const newDoc = await createDoc("PR Attachments", {
                  procurement_request: pr_id,
                  vendor: vendor_id,
                });
                docId = newDoc.name;
                await prAttachmentMutate();
              }
      
              // Upload the file and update the document's file URL.
              const fileArgs = {
                doctype: "PR Attachments",
                docname: docId,
                fieldname: "rfq_pdf",
                isPrivate: true,
              };
      
              const uploadedFile = await upload(selectedFile, fileArgs);
              await call({
                doctype: "PR Attachments",
                name: docId,
                fieldname: "rfq_pdf",
                value: uploadedFile.file_url,
              });
      
              console.log("File upload and document update successful");
              toast({
                title: "Success!",
                description: "File uploaded and updated successfully.",
                variant: "success",
              });
              await prAttachmentMutate();
            }
          }
      
          // Trigger the save button click if everything is completed successfully.
          const btn = document.getElementById("save-button");
          btn?.click();

        } catch (error) {
          console.error("Error during submission:", error);
          toast({
            title: "Submission Failed",
            description: "An error occurred while submitting the form. Please try again.",
            variant: "destructive",
          });
        } finally {
          // Clear the selected file after submission.
          setSelectedFile(null);
        }
      };

    const vendor_name = vendor_list?.find(vendor => vendor?.name === vendor_id)?.vendor_name;
    const vendor_address = vendor_list?.find(vendor => vendor?.name === vendor_id)?.vendor_address;
    const doc = address_list?.find(item => item?.name == vendor_address);
    const address = `${doc?.address_line1}, ${doc?.address_line2}, ${doc?.city}, ${doc?.state}-${doc?.pincode}`

    return (
        <div className="max-w-screen-lg mx-auto p-4 max-sm:p-1">
      {/* Vendor Info Card */}
      <Card className="mb-6">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-xl font-semibold text-black">{vendor_name}</CardTitle>
          <div className="text-gray-500 text-sm">{address}</div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="flex flex-col gap-2">
                <div className={`text-blue-500 cursor-pointer flex gap-1 items-center justify-center border rounded-md border-blue-500 p-2 mt-4 ${selectedFile && "opacity-50 cursor-not-allowed"}`}
                     onClick={() => document.getElementById("file-upload")?.click()}
                >
                    <Paperclip size="15px" />
                    <span className="p-0 text-sm">Attach</span>
                    <input
                        type="file"
                        id={`file-upload`}
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={selectedFile}
                    />
                </div>
                {(selectedFile) && (
                    <div className="flex items-center justify-between bg-slate-100 px-4 py-1 rounded-md">
                        <span className="text-sm">{typeof(selectedFile) === "object" ? selectedFile.name : selectedFile}</span>
                        <button
                            className="ml-1 text-red-500"
                            onClick={() => setSelectedFile(null)}
                        >
                            ✖
                        </button>
                    </div>
                )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Delivery Time (Days)<sup>*</sup></label>
              <Input type="number"  value={deliveryTime || ""} onChange={(e) => setDeliveryTime(e.target.value !== "" ? Number(e.target.value) : null)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {categories.list.map((cat, index) => (
        <Card key={index} className="mb-6">
          <CardHeader className="bg-gray-100 border-b">
            <CardTitle className="text-lg font-medium">Category: {cat.name}</CardTitle>
          </CardHeader>
          {/* <CardContent className="max-sm:p-2">
            {quotation_request_list?.map((q) => (
              (q.category === cat.name && q.vendor === vendor_id && orderData?.item_list?.list.some(item => item.name === q.item)) && (
                <div key={q.item} className="flex max-md:flex-col max-md:gap-2 items-center justify-between py-2 border-b last:border-none">
                  <div className="flex items-center max-md:justify-between">
                  <div className="w-1/2 font-semibold text-black inline items-baseline">
                  <span>{getItem(q.item)}</span>
                  {getComment(q.item) && (
                    <HoverCard>
                         <HoverCardTrigger><MessageCircleMore className="text-blue-400 w-5 h-5 ml-1 inline-block" /></HoverCardTrigger>
                        <HoverCardContent className="max-w-[300px bg-gray-800 text-white p-2 rounded-md shadow-lg">
                            <div className="relative pb-4">
                                <span className="block">{getComment(q.item)}</span>
                                <span className="text-xs absolute right-0 italic text-gray-200">-Comment by PL</span>
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                  )}
                  </div>
                  <div className="mx-1 px-1 text-xs shadow-sm text-gray-500 bg-gray-100 rounded-md py-1 flex items-center ">
                  {q?.makes?.list?.length > 0 ? (
                    <RadioGroup onValueChange={(e) => handleMakeChange(q.name, q?.makes?.list , e)}>
                    {q?.makes?.list?.map((i) => {
                      const makeData = quotationData?.list
                      ?.find((j) => j?.qr_id === q?.name)
                      ?.makes?.find((m) => m?.make === i?.make);
              
                    // Determine the checked state dynamically
                    const isChecked = makeData 
                      ? makeData?.enabled === "true" 
                      : i?.enabled === "true"; 

                      // return <div className="flex gap-2">
                      //       <input type="radio" checked={isChecked} onChange={(e) => handleMakeChange(q.name, q?.makes?.list , i?.make, e.target.checked)} />
                      //       <label>{i?.make}</label>
                      // </div>
                      return <div className="flex items-center space-x-2">
                        <RadioGroupItem checked={isChecked} value={i?.make} id={`${q?.name}-${i?.make}`} />
                        <Label htmlFor={`${q?.name}-${i?.make}`}>{i?.make}</Label>
                      </div>
                      })}
                    </RadioGroup>
                  ) : <span>make(s) not specified!</span>}
                  </div>
                  </div>
                  <div className="w-[50%] max-md:w-full flex gap-2">
                    <Input value={getUnit(q.item)} disabled />
                    <Input className="w-[45%]" value={q?.quantity} disabled />
                    <Input type="number" placeholder="Enter Price" defaultValue={q.quote} onChange={(e) => handlePriceChange(q?.name, q.item, Number(e.target.value))} />
                  </div>
                </div>
              )
            ))}
          </CardContent> */}
          <CardContent className="max-sm:p-2 bg-gray-50 rounded-md">
            {quotation_request_list?.map(
              (q) =>
                q.category === cat.name &&
                q.vendor === vendor_id &&
                orderData?.item_list?.list.some(item => item.name === q.item) &&  (
                  <div
                    key={q.item}
                    className="flex flex-col gap-4 p-4 m-2 bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Item and Comment Section */}
                    <div className="flex gap-4 items-start">
                      <div className="text-base font-semibold text-gray-800 flex-1">
                        <span>{getItem(q.item)}</span>
                        {getComment(q.item) && (
                          <HoverCard>
                            <HoverCardTrigger>
                              <MessageCircleMore className="text-blue-400 w-5 h-5 ml-2 inline-block cursor-pointer" />
                            </HoverCardTrigger>
                            <HoverCardContent className="max-w-[300px] bg-gray-800 text-white p-3 rounded-md shadow-lg">
                              <div className="relative pb-4">
                                <span className="block">{getComment(q.item)}</span>
                                <span className="text-xs absolute right-0 italic text-gray-400">
                                  - Comment by PL
                                </span>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        )}
                      </div>
                      <div className="text-sm flex-1">
                        {/* {q?.makes?.list?.length > 0 ? ( */}
                          <MakesSelection
                            q={q}
                            quotation_request_list_mutate={quotation_request_list_mutate}
                            quotationData={quotationData}
                            handleMakeChange={handleMakeChange}
                          />
                        {/* ) : (
                          <span className="text-gray-500 bg-gray-100 rounded-md px-3 py-1 shadow-sm">Make(s) not specified!</span>
                        )} */}
                      </div>
                    </div>
          
                    {/* Input Section */}
                    <div className="flex  gap-4">
                      <div className="w-1/4">
                        <Input
                          value={getUnit(q.item)}
                          disabled
                          className="w-full text-gray-700 bg-gray-50 border-gray-300 focus:ring-2 focus:ring-blue-300 rounded-md"
                        />
                      </div>
                      <div className="w-1/4">
                        <Input
                          value={q?.quantity}
                          disabled
                          className="w-full text-gray-700 bg-gray-50 border-gray-300 focus:ring-2 focus:ring-blue-300 rounded-md"
                        />
                      </div>
                      <div className="w-1/2">
                        <Input
                          type="number"
                          placeholder="Enter Price"
                          defaultValue={q?.quote}
                          onChange={(e) =>
                            handlePriceChange(q.name, q.item, Number(e.target.value))
                          }
                          className="w-full text-gray-700 bg-gray-50 border-gray-300 focus:ring-2 focus:ring-blue-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                )
            )}
          </CardContent>
        </Card>
      ))}
    <div className="flex justify-end">
        {(upload_loading || create_loading || update_loading) ? (
          <TailSpin visible={true} height="30" width="30" color="#D03B45" ariaLabel="tail-spin-loading" />
        ) : (
          <Button onClick={handleSubmit} disabled={!deliveryTime || !saveEnabled} className="flex items-center gap-1">
            <ListChecks className="h-4 w-4" />
            Save</Button>
        )}
        <SheetClose><Button id="save-button" className="hidden"></Button></SheetClose>
      </div>
        </div>
    )
}

const MakesSelection = ({ q, quotationData, handleMakeChange, quotation_request_list_mutate }) => {

  const [showAlert, setShowAlert] = useState(false);

  const [makeOptions, setMakeOptions] = useState([]);

  const [newSelectedMakes, setNewSelectedMakes] = useState([]);
  
  const {updateDoc, loading: updateLoading} = useFrappeUpdateDoc()

  const { data: categoryMakeList, isLoading: categoryMakeListLoading, mutate: categoryMakeListMutate } = useFrappeGetDocList("Category Makelist", {
    fields: ["*"],
    limit: 100000,
  })

  useEffect(() => {
    if (categoryMakeList?.length > 0) {
      const categoryMakes = categoryMakeList?.filter((i) => i?.category === q.category);
      const makeOptionsList = categoryMakes?.map((i) => ({ label: i?.make, value: i?.make })) || [];
      const filteredOptions = makeOptionsList?.filter(i => !q?.makes?.list?.some(j => j?.make === i?.value))
      setMakeOptions(filteredOptions)
    }

  }, [categoryMakeList, q, quotation_request_list_mutate])

  const toggleShowAlert = () => {
    setShowAlert((prevState) => !prevState);
  };

  const editMakeOptions = q?.makes?.list?.map((i) => ({
    value: i?.make,
    label: i?.make,
  }));

  const selectedMake = quotationData?.list
    ?.find((j) => j?.qr_id === q?.name)
    ?.makes?.find((m) => m?.enabled === "true");

  const selectedMakefromq = q?.makes?.list?.find((m) => m?.enabled === "true");

  const selectedMakeValue = selectedMake
    ? { value: selectedMake?.make, label: selectedMake?.make }
    : selectedMakefromq
    ? { value: selectedMakefromq?.make, label: selectedMakefromq?.make }
    : null;

  const handleSumbit = async () => {
    try {
      const reFormattedMakes = newSelectedMakes?.map(i => ({ make: i?.value, enabled: "false" }))

      const combinedMakes = [...q?.makes?.list, ...reFormattedMakes]

      await updateDoc("Quotation Requests", q?.name , {
        makes: {list : combinedMakes}
      })

      await quotation_request_list_mutate()

      toggleShowAlert()

      setNewSelectedMakes([])

      toast({
        title: "Success!",
        description: `Makes updated successfully!`,
        variant: "success",
      });
      
    } catch (error) {
      console.log("error while adding new makes to the item", error)
      toast({
        title: "Failed!",
        description: `Failed to update makes!`,
        variant: "destructive",
      });
    }
  }

  const CustomMenu = (props) => {
    const { MenuList } = components;

    return (
      <MenuList {...props}>
        {props.children}
        <div
          className="p-2 bg-gray-100 hover:bg-gray-200 text-center cursor-pointer"
          onClick={() => toggleShowAlert()}
        >
          <strong>Add New Make</strong>
        </div>
      </MenuList>
    );
  };

  return (
    <>
    <div className="w-full">
      <ReactSelect
        className="w-full"
        placeholder="Select Make..."
        value={selectedMakeValue}
        options={editMakeOptions}
        onChange={(selectedOption) => handleMakeChange(q?.name, q?.makes?.list, selectedOption?.value, true)}
        components={{ MenuList: CustomMenu }}
      />
    </div>

    <Dialog open={showAlert} onOpenChange={toggleShowAlert}>
      <DialogContent className="text-start">
        <DialogHeader>
          <DialogTitle>Add New Makes</DialogTitle>
        </DialogHeader>
        <DialogDescription>
        <div className="flex gap-1 flex-wrap mb-4">
          {editMakeOptions?.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="font-semibold">Existing Makes for this item:</h2>
              <div className="flex gap-1 flex-wrap">
              {editMakeOptions?.map((i) => (
                <Badge>{i?.value}</Badge>
              ))}
              </div>
            </div>
          )}
        </div>
        <div className="mb-4">
          <Label>
            Select New Make
          </Label>
          {categoryMakeList && (
            <ReactSelect options={makeOptions} value={newSelectedMakes} isMulti onChange={(selectedOptions) => setNewSelectedMakes(selectedOptions)} />
          )}
        </div>
        <div className="flex justify-end gap-2 items-center">
          {updateLoading ? (
            <TailSpin color="red" height={30} width={30} />
          ) : (
            <>
            <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSumbit} disabled={!newSelectedMakes?.length} className="flex items-center gap-1">
            <ListChecks className="h-4 w-4" />
            Confirm
          </Button>
          </>
          )}
        </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
    </>
  );
};
