export const ACTION_LABELS: Record<string, string> = {
  "product.create": "Product created",
  "product.update": "Product updated",
  "product.delete": "Product deleted",
  "product.restore": "Product restored",
  "product.bulkDelete": "Products bulk deleted",
  "product.bulkRestore": "Products bulk restored",
  "product.bulkUpdateStock": "Stock bulk updated",
  "collection.create": "Collection created",
  "collection.update": "Collection updated",
  "collection.delete": "Collection deleted",
  "order.statusUpdate": "Order status updated",
  "order.deliveryStatusUpdate": "Delivery status updated",
  "order.refund": "Refund processed",
  "order.notesUpdate": "Order notes updated",
  "user.toggleDisabled": "User disabled/enabled",
  "user.updateProfile": "Customer profile edited",
  "coupon.create": "Coupon created",
  "coupon.update": "Coupon updated",
  "coupon.toggleStatus": "Coupon status toggled",
  "coupon.delete": "Coupon deleted",
  "settings.update": "Store settings updated",
  "review.delete": "Review deleted",
  "review.update": "Review approval updated",
  "review.reply": "Admin replied to review",
  "return.approve": "Return approved",
  "return.reject": "Return rejected",
  "return.schedulePickup": "Reverse pickup scheduled",
  "return.pickup": "Return picked up",
  "return.refund": "Return refunded",
  "return.replace": "Return replaced",
  "return.request": "Return requested",
};

export function formatAction(action: string) {
  return ACTION_LABELS[action] || action;
}

export function formatDate(date: Date) {
  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
