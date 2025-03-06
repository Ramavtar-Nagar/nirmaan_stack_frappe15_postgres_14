import frappe

@frappe.whitelist()
def send_back_items(project_id: str, pr_name: str, selected_items: list, comments: str = None):
    """
    Sends back selected items for vendor quotes and updates the Procurement Request.

    Args:
        project_id (str): The ID of the project.
        pr_name (str): The name of the Procurement Request.
        selected_items (list): A list of selected item names.
        comments (str, optional): Comments for the sent back items. Defaults to None.
    """
    try:
        pr_doc = frappe.get_doc("Procurement Requests", pr_name)
        if not pr_doc:
            raise frappe.ValidationError(f"Procurement Request {pr_name} not found.")

        procurement_list = frappe.parse_json(pr_doc.procurement_list).get('list', [])

        itemlist = []
        new_categories = []

        for item_name in selected_items:
            item = next((i for i in procurement_list if i["name"] == item_name), None)
            if item:
                itemlist.append({
                    "name": item["name"],
                    "item": item["item"],
                    "quantity": item["quantity"],
                    "tax": item["tax"],
                    "quote": item["quote"],
                    "unit": item["unit"],
                    "category": item["category"],
                    "status": "Pending",
                    "comment": item.get("comment")
                })

                if not any(cat["name"] == item["category"] for cat in new_categories):
                    category_info = next((cat for cat in frappe.parse_json(pr_doc.category_list).get('list', []) if cat["name"] == item["category"]), None)
                    makes = category_info.get("makes", []) if category_info else []
                    new_categories.append({"name": item["category"], "makes": makes})

        if itemlist:
            sent_back_doc = frappe.new_doc("Sent Back Category")
            sent_back_doc.procurement_request = pr_name
            sent_back_doc.project = project_id
            sent_back_doc.category_list = {"list": new_categories}
            sent_back_doc.item_list = {"list": itemlist}
            sent_back_doc.type = "Rejected"
            sent_back_doc.insert()

            if comments:
                comment_doc = frappe.new_doc("Nirmaan Comments")
                comment_doc.comment_type = "Comment"
                comment_doc.reference_doctype = "Sent Back Category"
                comment_doc.reference_name = sent_back_doc.name
                comment_doc.content = comments
                comment_doc.subject = "creating sent-back"
                comment_doc.insert()

        updated_procurement_list = []
        for item in procurement_list:
            if item["name"] in selected_items:
                item["status"] = "Sent Back"
            updated_procurement_list.append(item)

        total_items = len(procurement_list)
        sent_back_items = len(selected_items)
        all_items_sent_back = sent_back_items == total_items

        no_approved_items = all(item.get("status") != "Approved" for item in procurement_list)
        pending_items_count = sum(1 for item in procurement_list if item.get("status") == "Pending")

        if pr_doc.workflow_state == "Vendor Selected" and all_items_sent_back:
            pr_doc.workflow_state = "Sent Back"
        elif no_approved_items and sent_back_items == pending_items_count:
            pr_doc.workflow_state = "Sent Back"
        else:
            pr_doc.workflow_state = "Partially Approved"

        pr_doc.procurement_list = {"list": updated_procurement_list}
        pr_doc.save()

        return {"message": "Sent Back created and Procurement Request updated successfully.", "status": 200}

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "send_back_items")
        return {"error": str(e), "status": 400}