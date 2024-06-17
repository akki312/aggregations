const mongoose = require('mongoose');

const patientMedicineSchema = mongoose.Schema({
  orderID: { type: String },
  patientID: { type: String },
  patientName: { type: String },
  age: { type: String },
  mobileNumber: { type: String },
  gender: { type: String },
  patientEmail: { type: String },
  doctorName: { type: String },
  licenseNumber: { type: String },
  drugInfo: [
    {
      drugName: { type: String },
      composition: { type: String },
      drugType: { type: String },
      batchID: { type: String },
      quantity: { type: Number },
      totalQuantity: { type: Number },
      totalStripsCount: { type: Number },
      totalTabletsCount: { type: Number },
      expiryDate: { type: Date },
      mrp: { type: Number },
      supplierPrice:{type:Number},
      rate: { type: Number },
      amount: { type: Number },
      netAmount:{type:Number},
      scheduleType: { type: String },
      manufacturer: { type: String },
      orderID: { type: String },
      barCode: { type: String },
      licenseNumber: { type: String },
      packageType: { type: String },
      packSize: { type: String },
      gst: { type: Number },
      cGST: { type: Number },
      sGST: { type: Number },
      iGST: { type: Number },
      discount: { type: String }, 
      maxDiscount:{type:Number}
    },
  ],
  patientAddress: {
    addressType: {
      type: String,
      enum: ["WORK", "HOME", "OTHERS"],
      default: "HOME",
    },
    addressName: { type: String, default: "" },
    houseNumber: { type: String, default: "" },
    street: { type: String, default: "" },
    landMark: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: Number },
  },
  discount: { type: Number },
  totalAmount: { type: Number },
  taxAmount: { type: Number },
  netAmount: { type: Number },
  profit:{ type: Number },
  amountSaved:{type:Number},
  modeOfPayment: { type: String },
  paymentStatus: {
    type: String,
    enum: ["Pending", "created", "paid", "Success", "RefundedInitiated","Refunded", "Failed"],
    default: "Pending",
  },
  orderedOn: { type: Date },
  orderType: { type: String, enum: ["HOMEDELIVERY", "PICKATSTORE"] ,default:"PICKATSTORE"},
  orderFrom: { type: String, enum: ["DOCISN","DOCISN_FRONTDESK","IN_PHARMACY","DOCISN_PLUS"], default: "IN_PHARMACY" },
  purchaseType:{type: String, enum: ["ORDER_DRAFT", "POS_DONE"] },
  status: {
    type: String,
    enum: [
      "ORDER_PAYMENT_PENDING",
      "DRAFT",
      "ORDER_RECEIVED",
      "ORDER_CONFIRMED",
      "ORDER_DISPATCHED",
      "ORDER_READYTOPICK",
      "ORDER_DELIVERED",
      "ORDER_CANCELLED",
      "PAYMENT_FAILED"
    ],
    default:"ORDER_PAYMENT_PENDING"
  },
  reasonForCancellation: { type: String },
  paymentID: { type: String },
  trasactionID: { type: String },
  invoiceFileName: { type: String },
  invoiceBase64: { type: String },
  prescriptionID: { type: String, default: "" },
  billType:{type:String,enum:["NEW","RETURN"],default:"NEW"},
  deliveryAgentDetails: {
    deliveryPersonName: { type: String },
    deliveryPersonMobileNumber: { type: String },
    thirdPartyInfo: { type: String },
  },
  transactionID: { type: String, default: ""},
  // modeOfPayment: { type: String, enum: ["DOCISN", "CASH", "UPI", "DEBIT_CARD","CREDIT_CARD", "NETBANKING"] },
  orderedAt: { type: Date },
  orderConfirmedAt: { type: Date },
  orderDispatchedAt: { type: Date },
  orderReadyAt: { type: Date },
  orderDeliveredAt: { type: Date },
  orderCancelledAt: { type: Date },
  pharmaUserId: { type: String, default: "" },
  platFormDiscount: { type: Number, default: 0 },
  couponID: { type: String },
  couponCode: { type: String }
});
module.exports = mongoose.model('patients', patientMedicineSchema);