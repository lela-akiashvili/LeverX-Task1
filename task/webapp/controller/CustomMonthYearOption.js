// File: task/controller/CustomMonthYearOption.js
sap.ui.define(
  [
    "sap/m/DynamicDateOption",
    "sap/m/DynamicDateValueHelpUIType",
    "sap/m/Label",
    "sap/m/Select",
    "sap/ui/core/Item",
    "sap/m/StepInput", // or sap.m.Input for year
    "sap/ui/core/LocaleData",
    "sap/ui/core/Locale",
    "sap/ui/core/date/UI5Date",
  ],
  function (
    DynamicDateOption,
    DynamicDateValueHelpUIType,
    Label,
    Select,
    Item,
    StepInput,
    LocaleData,
    Locale,
    UI5Date
  ) {
    "use strict";

    return DynamicDateOption.extend("task.controller.CustomMonthYearOption", {


      getValueHelpUITypes: function () {
        // Indicate two UI controls: a Select for month and an integer input for year
        return [
          new DynamicDateValueHelpUIType({ type: "select" }),
          new DynamicDateValueHelpUIType({ type: "int" }),
        ];
      },

      createValueHelpUI: function (oControl, fnControlsUpdated) {
       
        const oLabel = new Label({
          text: this.getKey(),
          width: "100%",
        });

        const oMonthSelect = new Select({
          width: "100%",
          change: function () {
            if (fnControlsUpdated) {
              fnControlsUpdated(this);
            }
          },
        });
        const oLocale = new Locale(
          Localization.getLanguageTag
            ? Localization.getLanguageTag()
            : sap.ui.getCore().getConfiguration().getLanguage()
        );
        const oLocaleData = LocaleData.getInstance(oLocale);
        const aMonthNames = oLocaleData.getMonthsStandAlone("wide");
        aMonthNames.forEach(function (sMonthName, iIndex) {
          oMonthSelect.addItem(
            new Item({ key: String(iIndex), text: sMonthName })
          );
        });

        const oYearInput = new StepInput({
          min: 1900,
          max: 2100,
          width: "100%",
        }).addStyleClass("sapUiSmallMarginTop");
        if (fnControlsUpdated) {
          oYearInput.attachChange(function () {
            fnControlsUpdated(this);
          });
        }

        // Store references so validateValueHelpUI/toDates can read values:
        oControl.aControlsByParameters = {};
        const sParamKey = this.getKey();
        oControl.aControlsByParameters[sParamKey] = [oMonthSelect, oYearInput];

        return [oLabel, oMonthSelect, oYearInput];
      },

      format: function (oValue) {
        if (
          !oValue ||
          !Array.isArray(oValue.values) ||
          oValue.values.length < 2
        ) {
          return "";
        }
        const iMonth = parseInt(oValue.values[0], 10);
        const iYear = parseInt(oValue.values[1], 10);
        if (isNaN(iMonth) || isNaN(iYear)) {
          return "";
        }
        // Format using locale month name + year
        const oLocale = new Locale(
          sap.ui.getCore().getConfiguration().getLanguage()
        );
        const oLocaleData = LocaleData.getInstance(oLocale);
        const sMonthName = oLocaleData.getMonthsStandAlone("wide")[iMonth];
        return sMonthName + " " + iYear;
      },

      parse: function (sValue) {
      
        const aParts = sValue.trim().split(" ");
        if (aParts.length < 2) {
          return null;
        }
        const sYearStr = aParts.pop();
        const sMonthName = aParts.join(" ");
        const iYear = parseInt(sYearStr, 10);
        if (isNaN(iYear)) {
          return null;
        }
        // Find month index by name (case-insensitive)
        const oLocale = new Locale(
          sap.ui.getCore().getConfiguration().getLanguage()
        );
        const oLocaleData = LocaleData.getInstance(oLocale);
        const aMonthNames = oLocaleData.getMonthsStandAlone("wide");
        const iMonth = aMonthNames.findIndex(function (m) {
          return m.toLowerCase() === sMonthName.toLowerCase();
        });
        if (iMonth < 0) {
          return null;
        }
        return {
          operator: "MONTHYEAR", 
          values: [String(iMonth), String(iYear)],
        };
      },

      validateValueHelpUI: function (oControl) {
        // Validate that month and year have valid values
        const aCtrls = oControl.aControlsByParameters[this.getKey()];
        if (!aCtrls || aCtrls.length < 2) {
          return false;
        }
        const [oMonthSelect, oYearInput] = aCtrls;
        const sMonth = oMonthSelect.getSelectedKey();
        const iYear = parseInt(oYearInput.getValue(), 10);
        return sMonth !== "" && !isNaN(iYear);
      },

      toDates: function (oValue) {
        // Compute [startDate, endDate] for that month-year
        if (
          !oValue ||
          !Array.isArray(oValue.values) ||
          oValue.values.length < 2
        ) {
          return [];
        }
        const iMonth = parseInt(oValue.values[0], 10);
        const iYear = parseInt(oValue.values[1], 10);
        if (isNaN(iMonth) || isNaN(iYear)) {
          return [];
        }
        const oStart = UI5Date.getInstance(iYear, iMonth, 1, 0, 0, 0);
        const oEnd = UI5Date.getInstance(iYear, iMonth + 1, 0, 23, 59, 59);
        return [oStart, oEnd];
      },

      getGroup: function () {
        return "Custom";
      },
    });
  }
);
