sap.ui.define(
  [
    "task/controller/BaseController.controller",
    "task/utils/formatter",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/type/String",
    "task/model/models",
    "sap/ui/comp/library",
  ],
  function (
    BaseController,
    formatter,
    MessageToast,
    MessageBox,
    Filter,
    FilterOperator,
    TypeString,
    models,
    compLibrary
  ) {
    "use strict";

    return BaseController.extend("task.controller.ProductsList", {
      formatter: formatter,
      FILTERBAR_ID: "filterBar",
      PRODUCTS_TABLE_ID: "productsTable",
      GENERAL_SEARCH_FIELD_ID: "generalSearchField",
      PRODUCT_NAME_INPUT_ID: "productNameInput",
      RELEASE_DATE_RANGE_ID: "releaseDateRange",
      DISCONTINUED_DATE_RANGE_ID: "discontinuedDateRange",
      CATEGORY_FILTER_ID: "categoryFilter",
      DELETE_BUTTON_ID: "deleteButton",
      SUPPLIER_INPUT_ID: "supplierInput",

      onInit: function () {
        this.onInitBase();


        const oViewModel = models.createViewModel();
        oViewModel.setProperty("/productCount", 0);
        this.setModel(oViewModel, "viewModel");

        this._oMultipleConditionsInput = this.byId(this.SUPPLIER_INPUT_ID);

        // Set up filter bar clear handler
        const oFilterBar = this.byId(this.FILTERBAR_ID);
        oFilterBar.attachClear(this.onFilterClear, this);
      },

      onProductsTableUpdateFinished: function (oEvent) {
        const iTotal = oEvent.getParameter("total");
        const oViewModel = this.getModel("viewModel");
        if (oViewModel) {
          oViewModel.setProperty("/productCount", iTotal);
        }
      },

      onFilterSearch: function (oEvent) {
        let sQuery = "";
        if (oEvent && typeof oEvent.getParameter === "function") {
          const sParamQuery = oEvent.getParameter("query");
          if (sParamQuery !== undefined) {
            sQuery = sParamQuery;
          }
        }
        if (!sQuery) {
          const oSearchField = this.byId(this.GENERAL_SEARCH_FIELD_ID);
          if (oSearchField) {
            sQuery = oSearchField.getValue();
          }
        }
        this._applyAllFilters(sQuery);
      },

      onFilterClear: function () {
        const aFieldsToClear = [
          this.GENERAL_SEARCH_FIELD_ID,
          this.PRODUCT_NAME_INPUT_ID,
          this.RELEASE_DATE_RANGE_ID,
          this.DISCONTINUED_DATE_RANGE_ID,
          this.CATEGORY_FILTER_ID,
          this.SUPPLIER_INPUT_ID,
        ];

        this.clearFields(aFieldsToClear, this);

        this._applyAllFilters("");
      },

      onReleaseDateChange: function () {
        this._applyAllFilters();
      },

      onDiscontinuedDateChange: function () {
        this._applyAllFilters();
      },

      handleSelectionFinish: function (oEvent) {
        this._applyAllFilters();
      },

      _applyAllFilters: function (sQuery) {
        const oView = this.getView();
        const oTable = oView.byId(this.PRODUCTS_TABLE_ID);
        if (!oTable) {
          return;
        }
        const oBinding = oTable.getBinding("items");
        if (!oBinding) {
          return;
        }

        const sSearchQuery = this._getSearchQueryValue(sQuery);

        const aFilters = [
          this._createGeneralFilter(sSearchQuery),
          this._createProductNameFilter(),
          this._createDateCombinedFilter(),
          this._createCategoryFilter(),
          this._createSupplierFilter(),
        ].filter(function (f) {
          return f;
        });

        this.applyFiltersToBinding(oBinding, aFilters);
      },

      _getSearchQueryValue: function (sQuery) {
        const oView = this.getView();
        if (sQuery === undefined) {
          const oSearchField = oView.byId(this.GENERAL_SEARCH_FIELD_ID);
          sQuery = oSearchField ? oSearchField.getValue() : "";
        }
        return (sQuery || "").trim();
      },

      // general OR-filter over ID, Name, Supplier/Name, Categories
      _createGeneralFilter: function (sQuery) {
        const sQueryTrimmed = (sQuery || "").trim();
        if (!sQueryTrimmed) {
          return null;
        }
        const sQueryLower = sQueryTrimmed.toLowerCase();
        const aGeneralFilters = [
          new Filter("ID", FilterOperator.Contains, sQueryLower),
          new Filter("Name", FilterOperator.Contains, sQueryLower),
          new Filter("Supplier/Name", FilterOperator.Contains, sQueryLower),
          new Filter({
            path: "Categories",
            test: function (aCategories) {
              if (!Array.isArray(aCategories)) {
                return false;
              }
              return aCategories.some(function (oCat) {
                return (
                  oCat &&
                  oCat.Name &&
                  oCat.Name.toString().toLowerCase().includes(sQueryLower)
                );
              });
            },
          }),
        ];
        return new Filter({ filters: aGeneralFilters, and: false });
      },

      // product name input filter
      _createProductNameFilter: function () {
        const oView = this.getView();
        const oProductInput = oView.byId(this.PRODUCT_NAME_INPUT_ID);
        if (!oProductInput) {
          return null;
        }
        const sProductName = (oProductInput.getValue() || "").trim();
        if (!sProductName) {
          return null;
        }
        return new Filter("Name", FilterOperator.Contains, sProductName);
      },

      // date filters combined
      _createDateCombinedFilter: function () {
        const oView = this.getView();
        const oReleaseDate = oView.byId(this.RELEASE_DATE_RANGE_ID);
        const oDiscontinuedDate = oView.byId(this.DISCONTINUED_DATE_RANGE_ID);
        const oValRel = oReleaseDate ? oReleaseDate.getValue() : null;
        const oValDisc = oDiscontinuedDate
          ? oDiscontinuedDate.getValue()
          : null;

        const aDateFilters = [];
        // existing createDateFilter helper, returns Filter or null
        const oFilterRel = this.createDateFilter("ReleaseDate", oValRel);
        if (oFilterRel) {
          aDateFilters.push(oFilterRel);
        }
        const oFilterDisc = this.createDateFilter("DiscontinuedDate", oValDisc);
        if (oFilterDisc) {
          aDateFilters.push(oFilterDisc);
        }

        if (aDateFilters.length === 0) {
          return null;
        }
        if (aDateFilters.length === 1) {
          return aDateFilters[0];
        }
        return new Filter({ filters: aDateFilters, and: true });
      },

      // category MultiComboBox filter
      _createCategoryFilter: function () {
        const oView = this.getView();
        const oCategoryMCB = oView.byId(this.CATEGORY_FILTER_ID);
        if (!oCategoryMCB) {
          return null;
        }
        const aSelectedKeys = oCategoryMCB.getSelectedKeys();
        if (!Array.isArray(aSelectedKeys) || aSelectedKeys.length === 0) {
          return null;
        }
        return new Filter({
          path: "Categories",
          test: function (aCategories) {
            if (!Array.isArray(aCategories)) {
              return false;
            }
            return aCategories.some(function (oCat) {
              return oCat && aSelectedKeys.indexOf(oCat.ID) !== -1;
            });
          },
        });
      },

      // supplier ValueHelpDialog tokens filter
      _createSupplierFilter: function () {
        if (!this._oMultipleConditionsInput) {
          return null;
        }
        const aTokens = this._oMultipleConditionsInput.getTokens() || [];
        if (aTokens.length === 0) {
          return null;
        }
        const aRangeFilters = aTokens
          .map(function (oToken) {
            const oRange = oToken.data("range");
            if (!oRange || oRange.keyField !== "Name") {
              return null;
            }
            const sOp = oRange.operation;
            const v1 = oRange.value1;
            switch (sOp) {
              case compLibrary.valuehelpdialog.ValueHelpRangeOperation.Contains:
                return new Filter("Supplier/Name", FilterOperator.Contains, v1);
              case compLibrary
                .valuehelpdialog.ValueHelpRangeOperation.StartsWith:
                return new Filter(
                  "Supplier/Name",
                  FilterOperator.StartsWith,
                  v1
                );
              case compLibrary.valuehelpdialog.ValueHelpRangeOperation.EQ:
                return new Filter("Supplier/Name", FilterOperator.EQ, v1);
              case compLibrary.valuehelpdialog.ValueHelpRangeOperation.EndsWith:
                return new Filter("Supplier/Name", FilterOperator.EndsWith, v1);
              default:
                return null;
            }
          })
          .filter(function (f) {
            return f;
          });

        if (aRangeFilters.length === 0) {
          return null;
        }
        if (aRangeFilters.length === 1) {
          return aRangeFilters[0];
        }
        return new Filter({ filters: aRangeFilters, and: true });
      },
      onSupplierInputSubmit: function (oEvent) {
        const sValue = oEvent.getParameter("value") || "";
        const oMI = this._oMultipleConditionsInput;
        if (!oMI) {
          return;
        }
        const sTrim = sValue.trim();
        if (!sTrim) {
          return;
        }
        // support comma- or semicolon-separated multiple expressions
        const aExprs = sTrim
          .split(/[,;]+/)
          .map(function (item) {
            return item.trim();
          })
          .filter(function (item) {
            return item.length > 0;
          });

        const aNewTokens = [];
        aExprs.forEach((expr) => {
          const oToken = this._createSupplierTokenFromExpression(expr);
          if (oToken) {
            aNewTokens.push(oToken);
          } else {
            // if parsing fails show a toast
            MessageToast.show(
              `Could not parse supplier filter: "${expr}". Using contains.`
            );
            // fallback: treat expr as contains
            const oFallbackToken = this._createSupplierTokenFromExpression(
              `*${expr}*`
            );
            if (oFallbackToken) {
              aNewTokens.push(oFallbackToken);
            }
          }
        }, this);

        // Add tokens to MultiInput
        if (aNewTokens.length) {
          aNewTokens.forEach((tok) => oMI.addToken(tok));
          // Clear the typed input field
          oMI.setValue("");
          this._applyAllFilters();
        }
      },

      onSupplierTokenUpdate: function (oEvent) {
        this._applyAllFilters();
      },

      _createSupplierTokenFromExpression: function (expr) {
        let s = expr.trim();
        if (!s) {
          return null;
        }
        let sOp, sVal;
        // Not equal (!=) - optional
        if (s.indexOf("!=") === 0) {
          sOp = compLibrary.valuehelpdialog.ValueHelpRangeOperation.EQ;
          sVal = s.substring(2).trim();
          return null;
        }
        // Equals: starts with '='
        if (s.charAt(0) === "=") {
          sOp = compLibrary.valuehelpdialog.ValueHelpRangeOperation.EQ;
          sVal = s.substring(1).trim();
        }
        // Starts with: '^'
        else if (s.charAt(0) === "^") {
          sOp = compLibrary.valuehelpdialog.ValueHelpRangeOperation.StartsWith;
          sVal = s.substring(1).trim();
        }
        // Ends with: trailing '$'
        else if (s.charAt(s.length - 1) === "$") {
          sOp = compLibrary.valuehelpdialog.ValueHelpRangeOperation.EndsWith;
          sVal = s.substring(0, s.length - 1).trim();
        }
        // '*' around: *value* or *value or value*
        else if (s.startsWith("*") || s.endsWith("*")) {
          // If both start and end '*', contains
          if (s.startsWith("*") && s.endsWith("*") && s.length > 1) {
            sOp = compLibrary.valuehelpdialog.ValueHelpRangeOperation.Contains;
            sVal = s.substring(1, s.length - 1).trim();
          }
          // '*': endsWith
          else if (s.startsWith("*")) {
            sOp = compLibrary.valuehelpdialog.ValueHelpRangeOperation.EndsWith;
            sVal = s.substring(1).trim();
          }
          // '*': startsWith
          else if (s.endsWith("*")) {
            sOp =
              compLibrary.valuehelpdialog.ValueHelpRangeOperation.StartsWith;
            sVal = s.substring(0, s.length - 1).trim();
          } else {
            // fallback to contains
            sOp = compLibrary.valuehelpdialog.ValueHelpRangeOperation.Contains;
            sVal = s.replace(/\*/g, "").trim();
          }
        }
        // if no explicit operator treat as Contains
        else {
          sOp = compLibrary.valuehelpdialog.ValueHelpRangeOperation.Contains;
          sVal = s;
        }

        if (!sVal) {
          return null;
        }
        const sText = expr;
        const oToken = new sap.m.Token({
          key: expr,
          text: sText,
        });
        // data("range") object that _createSupplierFilter read:
        const oRange = {
          keyField: "Name",
          operation: sOp,
          value1: sVal,
        };
        oToken.data("range", oRange);
        return oToken;
      },

      _createSupplierFilter: function () {
        if (!this._oMultipleConditionsInput) {
          return null;
        }
        const aTokens = this._oMultipleConditionsInput.getTokens() || [];
        if (aTokens.length === 0) {
          return null;
        }
        const aRangeFilters = aTokens
          .map(function (oToken) {
            const oRange = oToken.data("range");
            if (!oRange || oRange.keyField !== "Name") {
              return null;
            }
            const sOp = oRange.operation;
            const v1 = oRange.value1;
            switch (sOp) {
              case compLibrary.valuehelpdialog.ValueHelpRangeOperation.Contains:
                return new Filter("Supplier/Name", FilterOperator.Contains, v1);
              case compLibrary
                .valuehelpdialog.ValueHelpRangeOperation.StartsWith:
                return new Filter(
                  "Supplier/Name",
                  FilterOperator.StartsWith,
                  v1
                );
              case compLibrary.valuehelpdialog.ValueHelpRangeOperation.EQ:
                return new Filter("Supplier/Name", FilterOperator.EQ, v1);
              case compLibrary.valuehelpdialog.ValueHelpRangeOperation.EndsWith:
                return new Filter("Supplier/Name", FilterOperator.EndsWith, v1);
              default:
                return null;
            }
          })
          .filter(function (f) {
            return f;
          });

        if (aRangeFilters.length === 0) {
          return null;
        }
        if (aRangeFilters.length === 1) {
          return aRangeFilters[0];
        }
        // Combine multiple conditions with AND
        return new Filter({ filters: aRangeFilters, and: true });
      },

      onRowPress: function (oEvent) {
        const oCtx = oEvent.getSource().getBindingContext("products");
        if (oCtx) {
          const sProductID = oCtx.getProperty("ID");
          this.getRouter().navTo("ProductDetails", {
            productId: sProductID,
          });
        }
      },

      onSelectionChange: function () {
        const oTable = this.byId(this.PRODUCTS_TABLE_ID);
        const aSelectedItems = oTable.getSelectedItems();
        const bHasSelections = aSelectedItems.length > 0;

        const oDeleteBtn = this.byId(this.DELETE_BUTTON_ID);
        if (oDeleteBtn) {
          oDeleteBtn.setEnabled(bHasSelections);
        }
      },
      onDelete: function () {
        const oTable = this.byId(this.PRODUCTS_TABLE_ID);
        const aSelectedItems = oTable.getSelectedItems();
        const aSelectedData = aSelectedItems.map(function (oItem) {
          return oItem.getBindingContext("products").getObject();
        });
        const aNames = aSelectedData.map(function (oProd) {
          return oProd.Name || oProd.ID;
        });

        let sMessage;
        if (aNames.length === 1) {
          sMessage = this.getText("confirmDeleteProduct", [aNames[0]]);
        } else {
          const sList = aNames
            .map(function (name) {
              return "- " + name;
            })
            .join("\n");
          sMessage = this.getText("confirmDeleteProducts", [sList]);
        }

        MessageBox.confirm(sMessage, {
          title: this.getText("confirmDeletionTitle"),
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          emphasizedAction: MessageBox.Action.OK,
          onClose: function (oAction) {
            if (oAction === MessageBox.Action.OK) {
              this._deleteProducts(aSelectedData);
            }
          }.bind(this),
        });
      },

      _deleteProducts: function (aSelectedData) {
        const oModel = this.getModel("products");
        const aProducts = oModel.getProperty("/Products") || [];
        const oIdsToDelete = new Set(
          aSelectedData.map(function (o) {
            return o.ID;
          })
        );
        const aRemaining = aProducts.filter(function (oProd) {
          return !oIdsToDelete.has(oProd.ID);
        });
        oModel.setProperty("/Products", aRemaining);

        // Reapply filters
        this.onFilterSearch();

        const oTable = this.byId(this.PRODUCTS_TABLE_ID);
        oTable.removeSelections(true);

        if (aSelectedData.length === 1) {
          const sName = aSelectedData[0].Name || aSelectedData[0].ID;
          MessageToast.show(this.getText("deleteProductSuccess", [sName]));
        } else {
          const iCount = aSelectedData.length;
          MessageToast.show(this.getText("deleteProductsSuccess", [iCount]));
        }
      },

      onCreatePress: function () {
        const sNewId = "P" + Date.now();
        const oNewProdModel = models.createNewProductData(sNewId);
        this.getOwnerComponent().setModel(oNewProdModel, "newProduct");
        this.getRouter().navTo("ProductDetails", {
          productId: sNewId,
        });
      },

      onVHRequested: function () {
        if (!this._oSupplierVHD) {
          this.loadFragment({
            name: "task.view.fragments.ValueHelpDialog",
          }).then(
            function (oDialog) {
              this._oSupplierVHD = oDialog;
              this.getView().addDependent(this._oSupplierVHD);

              this._oSupplierVHD.setRangeKeyFields([
                {
                  label: "Supplier Name",
                  key: "Name",
                  type: "string",
                  typeInstance: new TypeString({}, { maxLength: 100 }),
                },
              ]);

              // populate existing tokens so user sees previous conditions
              const aExistingTokens =
                this._oMultipleConditionsInput.getTokens() || [];
              this._oSupplierVHD.setTokens(aExistingTokens);

              this._oSupplierVHD.open();
            }.bind(this)
          );
        } else {
          const aExisting = this._oMultipleConditionsInput.getTokens() || [];
          this._oSupplierVHD.setTokens(aExisting);
          this._oSupplierVHD.open();
        }
      },

      onValueHelpOkPress: function (oEvent) {
        const aDialogTokens = oEvent.getParameter("tokens") || [];
        const oMI = this._oMultipleConditionsInput;
        const aExistingTokens = oMI.getTokens() || [];
        const aMergedTokens = [];
        // Add all existing tokens
        aExistingTokens.forEach((existingToken) => {
          aMergedTokens.push(existingToken);
        });
        //  only if not already existing (via range compare)
        aDialogTokens.forEach((dialogToken) => {
          const oRangeDialog = dialogToken.data("range");
          const bAlready = aMergedTokens.some((tok) => {
            return this._isSameRange(tok.data("range"), oRangeDialog);
          });
          if (!bAlready) {
            aMergedTokens.push(dialogToken);
          } else {
            MessageToast.show(
              `Filter "${dialogToken.getText()}" already exists and was not added again.`
            );
          }
        });

        //  merged unique tokens
        oMI.setTokens(aMergedTokens);
        this._applyAllFilters();
        this._oSupplierVHD.close();
      },
      _isSameRange: function (oRange1, oRange2) {
        if (!oRange1 || !oRange2) {
          return false;
        }
        if (oRange1.keyField !== oRange2.keyField) {
          return false;
        }
        if (oRange1.operation !== oRange2.operation) {
          return false;
        }
        // Compare
        const v1a = (oRange1.value1 || "").toString().trim();
        const v1b = (oRange2.value1 || "").toString().trim();
        if (v1a !== v1b) {
          return false;
        }
        if ("value2" in oRange1 || "value2" in oRange2) {
          const vv1 = (oRange1.value2 || "").toString().trim();
          const vv2 = (oRange2.value2 || "").toString().trim();
          if (vv1 !== vv2) {
            return false;
          }
        }
        return true;
      },

      onVHDCancelPress: function () {
        if (this._oSupplierVHD) {
          this._oSupplierVHD.close();
        }
      },

      onVHDAfterClose: function () {
        if (this._oSupplierVHD) {
          this._oSupplierVHD.destroy();
          this._oSupplierVHD = null;
        }
      },
    });
  }
);
