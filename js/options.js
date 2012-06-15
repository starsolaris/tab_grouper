/**
 * @description load and save options
 * @author Andrey Starostin
 */

(function() {
	"use strict";

	var form;
	var checkboxList;

	window.addEventListener("DOMContentLoaded", function() {
		form = document.getElementById("preferences");
		checkboxList = form.querySelectorAll("input[type='checkbox']");

		document.getElementById("save").addEventListener("click", function() {
			savePreferences();
		}, false);

		loadPreferences();

	}, false);

	/**
	 * Get the preference values from the widget object
	 */
	function loadPreferences()
	{
		for (var i = 0; i < checkboxList.length; i++)
		{
			var checkbox = checkboxList[i];
			if (typeof widget.preferences[checkbox.name] !== "undefined")
			{
				checkbox.checked = (widget.preferences.getItem(checkbox.name) == "true");
			}
		}
	}

	/**
	 * Set the preference values for each field
	 */
	function savePreferences()
	{
		for (var i = 0; i < checkboxList.length; i++)
		{
			var checkbox = checkboxList[i];
			widget.preferences.setItem(checkbox.name, checkbox.checked);
		}
	}

})();
