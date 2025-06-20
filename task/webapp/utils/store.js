// onMultipleConditionsVHRequested: function (oEvent) {
//   const oView = this.getView();
//   // Reference to MultiInput
//   this._oMultipleConditionsInput = this.byId("supplierInput");

//   if (!this._oSupplierVhdPromise) {
//     this._oSupplierVhdPromise = Fragment.load({
//       name: "task.view.fragments.SuppliersValueHelpDialog",
//       controller: this,
//     }).then(
//       function (oDialog) {
//         oView.addDependent(oDialog);
//         this._oSupplierValueHelpDialog = oDialog;

//         // 1. Prepare supplier list data model
//         const oProductsModel = oView.getModel("products");
//         let aProducts = [];
//         if (oProductsModel) {
//           aProducts = oProductsModel.getProperty("/Products") || [];
//         }
//         const mSuppliers = {};
//         aProducts.forEach(function (oProd) {
//           const oSup = oProd.Supplier;
//           if (oSup && oSup.ID) {
//             mSuppliers[oSup.ID] = oSup.Name;
//           }
//         });
//         const aSuppliers = Object.keys(mSuppliers).map(function (sKey) {
//           return { ID: sKey, Name: mSuppliers[sKey] };
//         });
//         const oSupplierModel = new JSONModel({ Suppliers: aSuppliers });
//         oDialog.setModel(oSupplierModel, "suppliers");

//         // 2. Configure rangeKeyFields / filterFields
//         //    So the dialog’s “Ranges” panel shows fields Supplier ID or Name.
//         //    For example, allow ranges on ID (string) and Name (string).
//         oDialog.setRangeKeyFields([
//           {
//             key: "ID",
//             label: "Supplier ID",
//             type: "String",
//             // typeInstance: necessary for validation: create a sap.ui.model.type.String
//             // the constructor: new TypeString(formatOptions, constraints)
//             typeInstance: new TypeString({}, { maxLength: 64 }),
//           },
//           {
//             key: "Name",
//             label: "Supplier Name",
//             type: "String",
//             typeInstance: new TypeString({}, { maxLength: 128 }),
//           },
//         ]);
//         // Optionally also set filterFields, if you want search fields on table columns:
//         oDialog.setFilterFields([
//           {
//             key: "ID",
//             label: "Supplier ID",
//             type: "String",
//           },
//           {
//             key: "Name",
//             label: "Supplier Name",
//             type: "String",
//           },
//         ]);

//         // 3. Configure internal table to show supplier list and enable search/filter
//         const oTable = oDialog.getTable();
//         if (oTable.bindItems) {
//           // sap.m.Table
//           oTable.getColumns().forEach((col) => col.destroy());
//           oTable.addColumn(
//             new sap.m.Column({
//               header: new sap.m.Label({ text: "ID" }),
//             })
//           );
//           oTable.addColumn(
//             new sap.m.Column({
//               header: new sap.m.Label({ text: "Name" }),
//             })
//           );
//           oTable.bindItems({
//             path: "suppliers>/Suppliers",
//             template: new sap.m.ColumnListItem({
//               cells: [
//                 new sap.m.Text({ text: "{suppliers>ID}" }),
//                 new sap.m.Text({ text: "{suppliers>Name}" }),
//               ],
//             }),
//           });
//         } else if (oTable.bindRows) {
//           // sap.ui.table.Table
//           oTable.getColumns().forEach((col) => col.destroy());
//           oTable.addColumn(
//             new sap.ui.table.Column({
//               label: new sap.m.Label({ text: "ID" }),
//               template: new sap.m.Text({ text: "{suppliers>ID}" }),
//               sortProperty: "ID",
//               filterProperty: "ID",
//             })
//           );
//           oTable.addColumn(
//             new sap.ui.table.Column({
//               label: new sap.m.Label({ text: "Name" }),
//               template: new sap.m.Text({ text: "{suppliers>Name}" }),
//               sortProperty: "Name",
//               filterProperty: "Name",
//             })
//           );
//           oTable.bindRows("suppliers>/Suppliers");
//         }

//         // 4. Attach search/confirm event for filtering inside value help
//         //    When user types in the search field of the dialog, filter the table.
//         //    The ValueHelpDialog fires 'search' event with a parameter 'value'.
//         oDialog.attachSearch(function (evt) {
//           // evt.getParameter("value") is the search string
//           const sValue = evt.getParameter("value") || "";
//           const aFilters = [];
//           if (sValue) {
//             const sLower = sValue.toLowerCase();
//             // Filter by ID contains or Name contains
//             aFilters.push(
//               new Filter("ID", FilterOperator.Contains, sValue)
//             );
//             aFilters.push(
//               new Filter("Name", FilterOperator.Contains, sValue)
//             );
//             // OR combination
//             const oSearchFilter = new Filter({
//               filters: aFilters,
//               and: false,
//             });
//             if (oTable.bindItems) {
//               oTable.getBinding("items").filter(oSearchFilter);
//             } else if (oTable.bindRows) {
//               oTable.getBinding("rows").filter(oSearchFilter);
//             }
//           } else {
//             // clear filter
//             if (oTable.bindItems) {
//               oTable.getBinding("items").filter([]);
//             } else if (oTable.bindRows) {
//               oTable.getBinding("rows").filter([]);
//             }
//           }
//         });

//         return oDialog;
//       }.bind(this)
//     );
//   }

//   // Once loaded or loading, open it:
//   this._oSupplierVhdPromise.then(function (oDialog) {
//     oDialog.open();
//   });
// }

// onMultipleConditionsVHRequested: function () {
//   this._oMultipleConditionsInput = this.byId("supplierInput");

//   this.loadFragment({ name: "task.view.fragments.ValueHelpDialog" }).then(
//     function (oVHD) {
//       this._oMultipleConditionsDialog = oVHD;
//       this.getView().addDependent(oVHD);

//       // bind the dialog
//       const oProductsModel = this.getView().getModel("products");
//       oVHD.setModel(oProductsModel, "products");
//       oVHD.getTableAsync().then((oTable) => {
//         oTable.bindRows({ path: "products>/Products" });
//       });

//       // allow user to add single tokens
//       oVHD.setRangeKeyFields([
//         {
//           label: "Supplier Name",
//           key: "Name",
//           type: "string",
//         },
//       ]);

//       // reuse any existing tokens
//       const aTokens = this._oMultipleConditionsInput.getTokens();
//       if (aTokens.length) {
//         oVHD.setTokens(aTokens);
//       }

//       oVHD.open();
//     }.bind(this)
//   );
// },

// onMultipleConditionsVHRequested: function () {
//   this._oSupplierInput = this.byId("supplierInput");

//   if (!this._oSupplierConditionDialog) {
//     Fragment.load({
//       id: this.getView().getId(),
//       name: "task.view.fragments.ValueHelpDialog",
//       controller: this,
//     }).then(
//       function (oVHD) {
//         this._oSupplierConditionDialog = oVHD;
//         this.getView().addDependent(oVHD);

//         oVHD.setRangeKeyFields([
//           { label: "Supplier ID", key: "ID", type: "string" },
//           { label: "Supplier Name", key: "Name", type: "string" },
//         ]);

//         oVHD.open();
//       }.bind(this)
//     );
//   } else {
//     this._oSupplierConditionDialog.open();
//   }
// },
// onValueHelpOkPress: function (oEvent) {
//   const aTokens = oEvent.getParameter("tokens") || [];
//   const aFilters = aTokens.map((t) => {
//     const sKey = t.getKey();
//     return new Filter("Supplier/ID", FilterOperator.EQ, sKey);
//   });

//   // apply to productsTable
//   this.byId("productsTable")
//     .getBinding("items")
//     .filter(aFilters, FilterType.Application);

//   oEvent.getSource().close();
// },

// onValueHelpOkPress: function (oEvent) {
//   const oVHD = this._oSupplierConditionDialog;
//   const mConditions = oVHD.getConditions(); // <-- grab the user's ranges
//   const aSupplierConds = mConditions.ID || []; // keyed by "ID"

//   const aFilters = aSupplierConds
//     .map((oC) => {
//       switch (oC.operator) {
//         case "EQ":
//           return new Filter(
//             "Supplier/ID",
//             FilterOperator.EQ,
//             oC.values[0]
//           );
//         case "NE":
//           return new Filter(
//             "Supplier/ID",
//             FilterOperator.NE,
//             oC.values[0]
//           );
//         case "Contains":
//           return new Filter(
//             "Supplier/Name",
//             FilterOperator.Contains,
//             oC.values[0]
//           );
//         case "BT":
//           return new Filter(
//             "Supplier/ID",
//             FilterOperator.BT,
//             oC.values[0],
//             oC.values[1]
//           );
//         default:
//           return null;
//       }
//     })
//     .filter((f) => f);

//   this.byId("productsTable")
//     .getBinding("items")
//     .filter(aFilters, FilterType.Application);

//   oVHD.close();
// },
