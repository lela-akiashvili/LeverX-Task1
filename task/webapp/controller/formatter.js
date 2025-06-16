sap.ui.define([], function () {
  "use strict";
  return {
    /**
     * Flatten an array of category objects to a comma-separated list of names.
     * @param {object[]} aCategories - array of category objects, each with at least a `Name` property
     * @returns {string} comma-separated category names or empty string
     */
    formatCategories: function (aCategories) {
      if (!Array.isArray(aCategories) || aCategories.length === 0) {
        return "";
      }
      const aNames = aCategories.map(function (oCat) {
        return oCat && oCat.Name ? oCat.Name : "";
      });
      return aNames.join(", ");
    },
    getCategoryKeys: function (aCategories) {
      if (!Array.isArray(aCategories)) {
        return [];
      } 
      return aCategories.map(function (oCat) {
        // If Key is not string, convert:
        return oCat.Key != null ? oCat.Key.toString() : "";
      });
    },
  };
});
