sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "task/model/models",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  function (Controller, models, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("task.BaseController", {
      /**
       * Initialize global models on the Component.
       * Call this from child controllers in onInit via this.onInitBase().
       */
      initModels: function () {
        const oComponent = this.getOwnerComponent();

        if (!oComponent.getModel("products")) {
          if (models.getProductModel) {
            const oProductModel = models.getProductModel();
            oComponent.setModel(oProductModel, "products");
          }
        }
      },

      /**
       * Convenience: get the products JSONModel from Component
       * @returns {sap.ui.model.Model}
       */
      getProductModel: function () {
        return this.getOwnerComponent().getModel("products");
      },

      /**
       * Convenience: get the router
       * @returns {sap.ui.core.routing.Router}
       */

      getRouter: function () {
        return this.getOwnerComponent().getRouter();
      },

      /**
       * Convenience to set a model on view (default) or globally on component.
       * @param {sap.ui.model.Model} oModel
       * @param {string} sName
       * @param {boolean} [bGlobal=false] if true: component, else: view
       */
      setModel: function (oModel, sName, bGlobal) {
        if (bGlobal) {
          this.getOwnerComponent().setModel(oModel, sName);
        } else {
          this.getView().setModel(oModel, sName);
        }
      },

      /**
       * Convenience to get a named model from view (default) or component.
       * @param {string} sName
       * @param {boolean} [bGlobal=false]
       * @returns {sap.ui.model.Model}
       */
      getModel: function (sName, bGlobal) {
        if (bGlobal) {
          return this.getOwnerComponent().getModel(sName);
        } else {
          return this.getView().getModel(sName);
        }
      },

      /**
       * Call this in child controllers' onInit() to run base initialization.
       */
      onInitBase: function () {
        this.initModels();
      },

      /**
       * Create a Filter for a date field based on the operator and values in oVal.
       * Can be used by child controllers for filter bars / ValueHelpDialogs.
       * @param {string} fieldName - the model property path for the date field
       * @param {object} oVal - object with { operator: string, values: [ ... ] }
       * @returns {sap.ui.model.Filter|null}
       */
      createDateFilter: function (fieldName, oVal) {
        if (!oVal || !oVal.operator) {
          return null;
        }
        const op = oVal.operator;
        const vals = oVal.values || [];
        const now = new Date();

        // Helpers for local start/end of day, month, etc.
        const startOfDay = (date) =>
          new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = (date) => {
          const d = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate() + 1
          );
          d.setMilliseconds(d.getMilliseconds() - 1);
          return d;
        };
        const startOfMonth = (date) =>
          new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = (date) => {
          const d = new Date(date.getFullYear(), date.getMonth() + 1, 1);
          d.setMilliseconds(d.getMilliseconds() - 1);
          return d;
        };
        const startOfQuarter = (date) => {
          const month = date.getMonth();
          const quarterStartMonth = Math.floor(month / 3) * 3;
          return new Date(date.getFullYear(), quarterStartMonth, 1);
        };
        const endOfQuarter = (date) => {
          const month = date.getMonth();
          const quarterStartMonth = Math.floor(month / 3) * 3;
          const d = new Date(date.getFullYear(), quarterStartMonth + 3, 1);
          d.setMilliseconds(d.getMilliseconds() - 1);
          return d;
        };
        const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);
        const endOfYear = (date) => {
          const d = new Date(date.getFullYear() + 1, 0, 1);
          d.setMilliseconds(d.getMilliseconds() - 1);
          return d;
        };
        const addDays = (date, n) => {
          const d = new Date(date);
          d.setDate(d.getDate() + n);
          return d;
        };
        const addMonths = (date, n) => {
          const y = date.getFullYear();
          const m = date.getMonth();
          const d = date.getDate();
          const newMonthIndex = m + n;
          const newDate = new Date(y, newMonthIndex, 1);
          // clamp day to last day of new month
          const daysInNewMonth = new Date(
            newDate.getFullYear(),
            newDate.getMonth() + 1,
            0
          ).getDate();
          newDate.setDate(Math.min(d, daysInNewMonth));
          return newDate;
        };
        const addYears = (date, n) => {
          const y = date.getFullYear() + n;
          const m = date.getMonth();
          const d = date.getDate();
          const newDate = new Date(y, m, 1);
          const daysInMonth = new Date(
            newDate.getFullYear(),
            newDate.getMonth() + 1,
            0
          ).getDate();
          newDate.setDate(Math.min(d, daysInMonth));
          return newDate;
        };

        switch (op) {
          // === Single-date filters ===
          case "DATE": {
            const dateObj = vals[0];
            if (!(dateObj instanceof Date)) return null;
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(dateObj),
              value2: endOfDay(dateObj),
            });
          }
          case "TODAY": {
            const today = now;
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(today),
              value2: endOfDay(today),
            });
          }
          case "YESTERDAY": {
            const yesterday = addDays(now, -1);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(yesterday),
              value2: endOfDay(yesterday),
            });
          }
          case "TOMORROW": {
            const tomorrow = addDays(now, 1);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(tomorrow),
              value2: endOfDay(tomorrow),
            });
          }

          // === Week-based filters ===
          case "FIRSTDAYTHISWEEK": {
            const day = now.getDay();
            const diffToMonday = (day + 6) % 7;
            const weekStart = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() - diffToMonday
            );
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(weekStart),
              value2: endOfDay(weekStart),
            });
          }
          case "LASTDAYTHISWEEK": {
            const day = now.getDay();
            const diffToMonday = (day + 6) % 7;
            const weekStart = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() - diffToMonday
            );
            const weekEnd = addDays(weekStart, 6);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(weekEnd),
              value2: endOfDay(weekEnd),
            });
          }
          case "THISWEEK": {
            const day = now.getDay();
            const diffToMonday = (day + 6) % 7;
            const weekStart = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() - diffToMonday
            );
            const weekEnd = addDays(weekStart, 6);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(weekStart),
              value2: endOfDay(weekEnd),
            });
          }
          case "LASTWEEK": {
            const day = now.getDay();
            const diffToMonday = (day + 6) % 7;
            const thisWeekStart = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() - diffToMonday
            );
            const lastWeekEnd = addDays(thisWeekStart, -1);
            const lastWeekStart = addDays(lastWeekEnd, -6);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(lastWeekStart),
              value2: endOfDay(lastWeekEnd),
            });
          }
          case "NEXTWEEK": {
            const day = now.getDay();
            const diffToMonday = (day + 6) % 7;
            const thisWeekStart = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() - diffToMonday
            );
            const nextWeekStart = addDays(thisWeekStart, 7);
            const nextWeekEnd = addDays(nextWeekStart, 6);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(nextWeekStart),
              value2: endOfDay(nextWeekEnd),
            });
          }

          // === Month-based filters ===
          case "FIRSTDAYTHISMONTH": {
            const som = startOfMonth(now);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(som),
              value2: endOfDay(som),
            });
          }
          case "LASTDAYTHISMONTH": {
            const lom = endOfMonth(now);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(lom),
              value2: endOfDay(lom),
            });
          }
          case "THISMONTH": {
            const som = startOfMonth(now);
            const lom = endOfMonth(now);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(som),
              value2: endOfDay(lom),
            });
          }
          case "LASTMONTH": {
            const sameDayLastMonth = addMonths(now, -1);
            const startLastMonth = startOfMonth(sameDayLastMonth);
            const endLastMonth = endOfMonth(sameDayLastMonth);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(startLastMonth),
              value2: endOfDay(endLastMonth),
            });
          }
          case "NEXTMONTH": {
            const sameDayNextMonth = addMonths(now, 1);
            const startNextMonth = startOfMonth(sameDayNextMonth);
            const endNextMonth = endOfMonth(sameDayNextMonth);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(startNextMonth),
              value2: endOfDay(endNextMonth),
            });
          }
          case "MONTHINYEAR": {
            // Expect vals = [monthNumber(1–12), year], like [5,2025]
            const m = vals[0];
            const y = vals[1];
            if (typeof m !== "number" || typeof y !== "number") return null;
            const monthZero = m - 1;
            const start = new Date(y, monthZero, 1);
            const end = endOfMonth(start);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(start),
              value2: endOfDay(end),
            });
          }

          // === Quarter-based filters ===
          case "FIRSTDAYTHISQUARTER": {
            const sq = startOfQuarter(now);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(sq),
              value2: endOfDay(sq),
            });
          }
          case "LASTDAYTHISQUARTER": {
            const eq = endOfQuarter(now);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(eq),
              value2: endOfDay(eq),
            });
          }
          case "THISQUARTER": {
            const sq = startOfQuarter(now);
            const eq = endOfQuarter(now);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(sq),
              value2: endOfDay(eq),
            });
          }
          case "LASTQUARTER": {
            const currSQ = startOfQuarter(now);
            const lastQuarterDate = addMonths(currSQ, -3);
            const sq = startOfQuarter(lastQuarterDate);
            const eq = endOfQuarter(lastQuarterDate);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(sq),
              value2: endOfDay(eq),
            });
          }
          case "NEXTQUARTER": {
            const currSQ = startOfQuarter(now);
            const nextQuarterDate = addMonths(currSQ, 3);
            const sq = startOfQuarter(nextQuarterDate);
            const eq = endOfQuarter(nextQuarterDate);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(sq),
              value2: endOfDay(eq),
            });
          }
          case "FIRSTQUARTER": {
            // Jan–Mar current year
            const start = new Date(now.getFullYear(), 0, 1);
            const end = endOfQuarter(start);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(start),
              value2: endOfDay(end),
            });
          }
          case "SECONDQUARTER": {
            const start = new Date(now.getFullYear(), 3, 1);
            const end = new Date(now.getFullYear(), 6, 1);
            end.setMilliseconds(end.getMilliseconds() - 1);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(start),
              value2: endOfDay(end),
            });
          }
          case "THIRDQUARTER": {
            const start = new Date(now.getFullYear(), 6, 1);
            const end = new Date(now.getFullYear(), 9, 1);
            end.setMilliseconds(end.getMilliseconds() - 1);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(start),
              value2: endOfDay(end),
            });
          }
          case "FOURTHQUARTER": {
            const start = new Date(now.getFullYear(), 9, 1);
            const end = new Date(now.getFullYear() + 1, 0, 1);
            end.setMilliseconds(end.getMilliseconds() - 1);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(start),
              value2: endOfDay(end),
            });
          }

          // === Year-based filters ===
          case "FIRSTDAYTHISYEAR": {
            const sy = startOfYear(now);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(sy),
              value2: endOfDay(sy),
            });
          }
          case "LASTDAYTHISYEAR": {
            const ey = endOfYear(now);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(ey),
              value2: endOfDay(ey),
            });
          }
          case "THISYEAR": {
            const sy = startOfYear(now);
            const ey = endOfYear(now);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(sy),
              value2: endOfDay(ey),
            });
          }
          case "LASTYEAR": {
            const lastYearDate = addYears(now, -1);
            const sy = startOfYear(lastYearDate);
            const ey = endOfYear(lastYearDate);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(sy),
              value2: endOfDay(ey),
            });
          }
          case "NEXTYEAR": {
            const nextYearDate = addYears(now, 1);
            const sy = startOfYear(nextYearDate);
            const ey = endOfYear(nextYearDate);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(sy),
              value2: endOfDay(ey),
            });
          }
          case "YEARTODATE": {
            const sy = startOfYear(now);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(sy),
              value2: endOfDay(now),
            });
          }
          case "DATETOYEAR": {
            const ey = endOfYear(now);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(now),
              value2: endOfDay(ey),
            });
          }

          // === Date and Time filters ===
          case "DATEANDTIME": {
            const dt = vals[0];
            if (!(dt instanceof Date)) return null;
            return new Filter(fieldName, FilterOperator.EQ, dt);
          }
          case "DATERANGETIME": {
            const [startDT, endDT] = vals;
            if (!(startDT instanceof Date) || !(endDT instanceof Date))
              return null;
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startDT,
              value2: endDT,
            });
          }
          case "FROMDATETIME": {
            const startDT = vals[0];
            if (!(startDT instanceof Date)) return null;
            return new Filter(fieldName, FilterOperator.GE, startDT);
          }
          case "TODATETIME": {
            const endDT = vals[0];
            if (!(endDT instanceof Date)) return null;
            return new Filter(fieldName, FilterOperator.LE, endDT);
          }

          // === From/To (date-only) aliases ===
          case "FROM": {
            const dateObj = vals[0];
            if (!(dateObj instanceof Date)) return null;
            return new Filter(
              fieldName,
              FilterOperator.GE,
              startOfDay(dateObj)
            );
          }
          case "TO": {
            const dateObj = vals[0];
            if (!(dateObj instanceof Date)) return null;
            return new Filter(fieldName, FilterOperator.LE, endOfDay(dateObj));
          }
          case "DATERANGE": {
            const [dateStart, dateEnd] = vals;
            if (!(dateStart instanceof Date) || !(dateEnd instanceof Date))
              return null;
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(dateStart),
              value2: endOfDay(dateEnd),
            });
          }
          case "FROMANDTO": {
            const [dateStart2, dateEnd2] = vals;
            if (!(dateStart2 instanceof Date) || !(dateEnd2 instanceof Date))
              return null;
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(dateStart2),
              value2: endOfDay(dateEnd2),
            });
          }
          case "FROMDATETIME_TO": {
            const [sd, ed] = vals;
            if (!(sd instanceof Date) || !(ed instanceof Date)) return null;
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: sd,
              value2: ed,
            });
          }

          // === Last X / Next X filters ===
          case "LASTXMINUTES": {
            const n = Number(vals[0]);
            if (isNaN(n) || n <= 0) return null;
            const end = now;
            const start = new Date(now.getTime() - n * 60 * 1000);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: start,
              value2: end,
            });
          }
          case "NEXTXMINUTES": {
            const n = Number(vals[0]);
            if (isNaN(n) || n <= 0) return null;
            const start = now;
            const end = new Date(now.getTime() + n * 60 * 1000);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: start,
              value2: end,
            });
          }
          case "LASTXHOURS": {
            const n = Number(vals[0]);
            if (isNaN(n) || n <= 0) return null;
            const end = now;
            const start = new Date(now.getTime() - n * 3600 * 1000);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: start,
              value2: end,
            });
          }
          case "NEXTXHOURS": {
            const n = Number(vals[0]);
            if (isNaN(n) || n <= 0) return null;
            const start = now;
            const end = new Date(now.getTime() + n * 3600 * 1000);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: start,
              value2: end,
            });
          }
          case "LASTXDAYS": {
            const n = Number(vals[0]);
            if (isNaN(n) || n <= 0) return null;
            // last n days inclusive: from startOfDay(now-(n-1)) to endOfDay(now)
            const start = startOfDay(addDays(now, -(n - 1)));
            const end = endOfDay(now);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: start,
              value2: end,
            });
          }
          case "NEXTXDAYS": {
            const n = Number(vals[0]);
            if (isNaN(n) || n <= 0) return null;
            const start = startOfDay(now);
            const end = endOfDay(addDays(now, n - 1));
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: start,
              value2: end,
            });
          }
          case "LASTXWEEKS": {
            const n = Number(vals[0]);
            if (isNaN(n) || n <= 0) return null;
            const day = now.getDay();
            const diffToMonday = (day + 6) % 7;
            const thisWeekStart = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() - diffToMonday
            );
            const start = startOfDay(addDays(thisWeekStart, -7 * (n - 1)));
            const end = endOfDay(addDays(thisWeekStart, 6));
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: start,
              value2: end,
            });
          }
          case "NEXTXWEEKS": {
            const n = Number(vals[0]);
            if (isNaN(n) || n <= 0) return null;
            const day = now.getDay();
            const diffToMonday = (day + 6) % 7;
            const thisWeekStart = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() - diffToMonday
            );
            const nextWeekStart = addDays(thisWeekStart, 7);
            const lastWeekEnd = addDays(nextWeekStart, 7 * (n - 1) + 6);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(nextWeekStart),
              value2: endOfDay(lastWeekEnd),
            });
          }
          case "LASTXMONTHS": {
            const n = Number(vals[0]);
            if (isNaN(n) || n <= 0) return null;
            const startMonth = addMonths(now, -(n - 1));
            const start = startOfDay(startOfMonth(startMonth));
            const end = endOfDay(now);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: start,
              value2: end,
            });
          }
          case "NEXTXMONTHS": {
            const n = Number(vals[0]);
            if (isNaN(n) || n <= 0) return null;
            const endMonth = addMonths(now, n - 1);
            const start = startOfDay(now);
            const end = endOfDay(endOfMonth(endMonth));
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: start,
              value2: end,
            });
          }
          case "LASTXQUARTERS": {
            const n = Number(vals[0]);
            if (isNaN(n) || n <= 0) return null;
            const currSQ = startOfQuarter(now);
            const startQuarterDate = addMonths(currSQ, -3 * (n - 1));
            const start = startOfDay(startQuarterDate);
            const end = endOfDay(now);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: start,
              value2: end,
            });
          }
          case "NEXTXQUARTERS": {
            const n = Number(vals[0]);
            if (isNaN(n) || n <= 0) return null;
            const currSQ = startOfQuarter(now);
            const nextQuarterStart = addMonths(currSQ, 3);
            const finalQuarterStart = addMonths(currSQ, 3 * n);
            const finalQuarterEnd = new Date(
              finalQuarterStart.getFullYear(),
              finalQuarterStart.getMonth(),
              1
            );
            finalQuarterEnd.setMilliseconds(
              finalQuarterEnd.getMilliseconds() - 1
            );
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(nextQuarterStart),
              value2: endOfDay(finalQuarterEnd),
            });
          }
          case "LASTXYEARS": {
            const n = Number(vals[0]);
            if (isNaN(n) || n <= 0) return null;
            const startYearDate = addYears(now, -(n - 1));
            const start = startOfDay(startOfYear(startYearDate));
            const end = endOfDay(now);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: start,
              value2: end,
            });
          }
          case "NEXTXYEARS": {
            const n = Number(vals[0]);
            if (isNaN(n) || n <= 0) return null;
            const endYearDate = addYears(now, n - 1);
            const start = startOfDay(now);
            const end = endOfDay(endOfYear(endYearDate));
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: start,
              value2: end,
            });
          }
          case "TODAYMINUSPLUS": {
            // Expect vals = [minusDays, plusDays]
            const m = Number(vals[0]);
            const p = Number(vals[1]);
            if (isNaN(m) || isNaN(p)) return null;
            const start = startOfDay(addDays(now, -Math.abs(m)));
            const end = endOfDay(addDays(now, Math.abs(p)));
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: start,
              value2: end,
            });
          }

          default:
            console.warn("Operator not handled in extended date filter:", op);
            return null;
        }
      },
    });
  }
);
