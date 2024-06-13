const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const InventorySchema = mongoose.Schema({
    email: { type: String },
    supplierName: { type: String },
    drugName: { type: String },
    composition: { type: String },
    drugType: { type: String },
    batchID: { type: String },
    quantity: { type: Number },
    supplierLicenseNumber: {type: String},
    drugLicenseNumber: {type: String},
    expireDate: { type: Date },
    mrp: { type: Number },
    rate: { type: Number },
    amount: { type: Number },
    free: { type: Number },
    hsnCode: { type: String },
    discount: { type: String },
    box: { type: String },
    thresholdValue: { type: Number },
    previousQuantity:{type:String},
    createdby: { type: String },
    createdUserRole: [{ type: String }],
    createdDate: { type: Date },
    lastUPdatedDate: { type: Date },
  });
  const Inventory = mongoose.model('Inventory', InventorySchema);
module.exports = Inventory;