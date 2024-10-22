import frappe
from frappe import _
from ..Notifications.pr_notifications import PrNotification, get_allowed_users
from .procurement_requests import get_user_name

def on_update(doc, method):
    """
    Manage Approved Quotations and Deletion of PO
    """
    doc = frappe.get_doc("Procurement Orders", doc.name)
    if(doc.status=="Dispatched"):
        try:
            vendor = frappe.get_doc("Vendors", doc.vendor)
            orders = doc.order_list
            for order in orders['list']:
                aq = frappe.new_doc('Approved Quotations')
                try:
                    item = frappe.get_doc("Items", order['name'])
                    aq.item_id=order['name']
                    aq.vendor=doc.vendor
                    aq.procurement_order=doc.name
                    aq.item_name=order['item']
                    aq.unit=order['unit']
                    aq.quantity=order['quantity']
                    aq.quote=order['quote']
                    aq.tax=order['tax']
                    aq.city=vendor.vendor_city
                    aq.state=vendor.vendor_state
                    aq.insert()
                except frappe.DoesNotExistError:
                    continue
        except frappe.DoesNotExistError:
            print("VENDOR NOT AVAILABLE IN DB")
    if(doc.status=="Cancelled"):
        frappe.delete_doc("Procurement Orders", doc.name)
    if(doc.status == "PO Amendment"):
        lead_admin_users = get_allowed_users(doc)
        pr = frappe.get_doc("Procurement Requests", doc.procurement_request)
        if lead_admin_users:
            for user in lead_admin_users:
                if user["push_notification"] == "true":
                    # Dynamically generate notification title/body for each lead
                    notification_title = f"PO: {doc.name} has been Amended"
                    notification_body = (
                        f"Hi {user['full_name']}, PO: {doc.name} for the {doc.project} "
                        f"project has been amended by {get_user_name(frappe.session.user)} and is awaiting your review."
                        )
                    click_action_url = f"{frappe.utils.get_url()}/frontend/approve-amended-po"
                    # Send notification for each lead
                    PrNotification(user, notification_title, notification_body, click_action_url)
                else:
                    print(f"push notifications were not enabled for user: {user['full_name']}")
        else:
            print("No project leads or admins found with push notifications enabled.")

        message = {
            "title": _("PO Status Update"),
            "description": _(f"PO: {doc.name} has been amended."),
            "project": doc.project,
            "work_package": pr.work_package,
            "sender": frappe.session.user,
            "docname": doc.name
        }
        # Emit the event to the allowed users
        for user in lead_admin_users:
            new_notification_doc = frappe.new_doc('Nirmaan Notifications')
            new_notification_doc.recipient = user['name']
            new_notification_doc.recipient_role = user['role_profile']
            if frappe.session.user != 'Administrator':
                new_notification_doc.sender = frappe.session.user
            new_notification_doc.title = message["title"]
            new_notification_doc.description = message["description"]
            new_notification_doc.document = 'Procurement Orders'
            new_notification_doc.docname = doc.name
            new_notification_doc.project = doc.project
            new_notification_doc.work_package = pr.work_package
            new_notification_doc.seen = "false"
            new_notification_doc.type = "info"
            new_notification_doc.event_id = "po:amended"
            action_url = doc.name.replace("/", "&=")
            new_notification_doc.action_url = f"approve-amended-po/{action_url}"
            new_notification_doc.insert()
            frappe.db.commit()

            message["notificationId"] = new_notification_doc.name
            print(f"running publish realtime for: {user}")

            frappe.publish_realtime(
                event="po:amended",  # Custom event name
                message=message,
                user=user['name']  # Notify only specific users
            )