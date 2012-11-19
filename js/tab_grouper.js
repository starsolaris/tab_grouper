/**
 * @description Tab Grouper is a extension for Opera that groupes all tabs by site url
 * @author Andrey Starostin
 */

(function() {
	"use strict";

	var tabGrouper = new TabGrouper();
	window.addEventListener("load", function() {
		tabGrouper.onLoad.call(tabGrouper);
	}, false);

	window.addEventListener("storage", function(e) {
		tabGrouper.loadPreferences();
		// tabGrouper.ungroupAll();

		tabGrouper.onButtonClick();
	}, false);

	function log(message)
	{
		opera.postError(message);
	}

	function TabGrouper()
	{
		var _self = this;
		this._groupButton = null;

		/**
		 *  list of options
		 * @type {Object}
		 * @private
		 */
		this._preferences = {
			closeDuplicates: false,
			groupBySecondLevelDomain: false, // *.second.com, second.com
			autoGrouping: false,
			openNewTabInsideCurrentGroup: false,
			hideToolbarButton: false,
			collapse_expand: false
		};

		this.onLoad = function()
		{
			// opera 12 or greater has necessary API
			if (typeof opera.extension.tabs.getAll !== "function"
				|| typeof opera.extension.tabGroups.getAll !== "function")
			{
				return;
			}

			this.loadPreferences();

			if (!this._preferences.hideToolbarButton)
			{
				this._groupButton = opera.contexts.toolbar.createItem({
					title: "Tab Grouper",
					icon: "icons/tab_group_button.png",
					badge: {
						backgroundColor: '#CC0000',
						color: '#FFFFFF'
					},
					onclick: function()
					{
						_self.onButtonClick.call(_self);
					}
				});
			}

			opera.contexts.toolbar.addItem(_self._groupButton);
		};

		this.onButtonClick = function()
		{
			if (this._preferences.closeDuplicates)
				this.closeDubplicateTabs();

			this.groupSimilarTabs();
		};

		this.loadPreferences = function()
		{
			for (var preference in this._preferences)
			{
				if (!this._preferences.hasOwnProperty(preference))
					continue;

				if (typeof widget.preferences[preference] !== "undefined")
				{
					this._preferences[preference] = (widget.preferences.getItem(preference) == "true");
				}
			}
		};

		/**
		 * ungroup tab group
		 *
		 * @param {BrowserTabGroup} tabGroup
		 */
		this.ungroup = function(tabGroup)
		{
			var tabs = tabGroup.tabs.getAll();

			for (var j = 0; j < tabs.length; j++)
			{
				var tab = tabs[j];
				if (typeof tab.browserWindow == "undefined" || typeof tabGroup.browserWindow == "undefined")
				{
					continue;
				}

				tab.browserWindow.insert(tab, tabGroup);
			}
		};

		/**
		 * ungroup all tab groups
		 */
		this.ungroupAll = function()
		{
			var tabGroups = opera.extension.tabGroups.getAll();
			for (var i = 0; i < tabGroups.length; i++)
			{
				var tabGroup = tabGroups[i];
				this.ungroup(tabGroup);
			}
		};

		/**
		 * group similar tabs
		 */
		this.groupSimilarTabs = function()
		{
			var i = 0;
			var tab;
			var similar;
			var similarList = _self.getSimilar();
			var tabGroup;
			var tabGroups = opera.extension.tabGroups.getAll();
			for (i = 0; i < tabGroups.length; i++)
			{
				tabGroup = tabGroups[i];
				var tabs = tabGroup.tabs.getAll();
				if (tabs.length > 0)
				{
					for (var j = 0; j < tabs.length; j++)
					{
						tab = tabs[j];
						if (typeof tab.browserWindow == "undefined")
						{
							continue;
						}

						similar = similarList[this._getSign(tab.url)];
						if (!similar.group)
						{
							similar.group = tabGroup;
						}
					}
				}
			}

			for (var sign in similarList)
			{
				if (!similarList.hasOwnProperty(sign))
					continue;

				similar = similarList[sign];
				if (similar.list.length > 1)
				{
					if (!similar.group)
					{
						opera.extension.tabGroups.create(similar.list, {collapsed: true}, similar.list[0]);
						continue;
					}

					for (i = 0; i < similar.list.length; i++)
					{
						tab = similar.list[i];
						if (!tab.tabGroup)
							similar.group.insert(tab);
					}
				}
			}

			// collapse/expande all tab groups
			if (this._preferences["collapse_expand"])
			{
				var collapsed = (widget.preferences.getItem("collapsed") == "true");
				tabGroups = opera.extension.tabGroups.getAll();
				for (i = 0; i < tabGroups.length; i++)
				{
					tabGroup = tabGroups[i];
					tabGroup.update({collapsed: collapsed});
				}
				widget.preferences.setItem("collapsed", String(!collapsed));
			}
		};

		/**
		 * close dublicate tabs
		 */
		this.closeDubplicateTabs = function()
		{
			var urls = {};
			var tabs = opera.extension.tabs.getAll();
			for (var i = 0; i < tabs.length; i++)
			{
				var tab = tabs[i];
				if (typeof tab.browserWindow == "undefined")
				{
					continue;
				}

				if (typeof urls[tab.url] == "undefined")
				{
					urls[tab.url] = true;
				} else {
					tab.close();
				}
			}
		};

		/**
		 * get list of similar tabs
		 *
		 * @return {Object}
		 */
		this.getSimilar = function()
		{
			var similar = {};
			var tabs = opera.extension.tabs.getAll();
			for (var i = 0; i < tabs.length; i++)
			{
				var tab = tabs[i];
				if (typeof tab.browserWindow == "undefined")
				{
					continue;
				}

				var sign = this._getSign(tab.url);

				if (typeof similar[sign] == "undefined")
				{
					similar[sign] = {
						group: null,
						list: []
					};
				}
				similar[sign].list.push(tab);
			}

			return similar;
		};

		/**
		 * get sign for grouping from url
		 *
		 * @param {String} url
		 * @return {String}
		 * @private
		 */
		this._getSign = function(url)
		{
			if (typeof url !== "string")
				url = "";

			var sign = "";
			var match = [];
			var regexp = /(https?|ftp|file):\/\/([^\/]*)\//;
			if (this._preferences.groupBySecondLevelDomain)
			{
				//regexp = /(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]/i;
				regexp = /(https?|ftp|file):\/\/([^\/]*\.)?([^\/]*\.[^\/]*)\//;
			}
			if ((match = url.match(regexp)) != null)
			{
				sign = match[match.length - 1];
			}

			return sign;
		};
	}

})();
