/**
 * @description Tab Grouper is a extension for Opera that groupes all tabs by site url
 * @author Andrey Starostin
 */

(function() {
	"use strict";

	var tabGrouper = new TabGrouper();
	window.addEventListener(
		"load",
		function()
		{
			tabGrouper.onLoad.call(tabGrouper);
		},
		false
	);

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
			autoGroup: false,
			openNewTabInsideCurrentGroup: false,
			hideToolbarButton: false
		};

		this.onLoad = function()
		{
			// opera 12 or greater has necessary API
			if (typeof opera.extension.tabs.getAll !== "function"
				|| typeof opera.extension.tabGroups.getAll !== "function")
			{
				return;
			}

			this._loadPreferences();

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
						_self._loadPreferences();

						if (_self._preferences.closeDuplicates)
							_self.closeDubplicateTabs.call(_self);

						_self.groupSimilarTabs.call(_self);
					}
				});
			}

			opera.contexts.toolbar.addItem(_self._groupButton);
		};

		this._loadPreferences = function()
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
		 * group similar tabs
		 */
		this.groupSimilarTabs = function()
		{
			var i = 0;
			var tab;
			var similar = _self.getSimilar();
			var tabGroups = opera.extension.tabGroups.getAll();
			for (i = 0; i < tabGroups.length; i++)
			{
				var tabGroup = tabGroups[i];
				var tabs = tabGroup.tabs.getAll();
				if (tabs.length > 0)
				{
					tab = tabs[0];
					if (!tab.browserWindow)
					{
						continue;
					}

					similar[this._getSign(tab.url)].group = tabGroup;
				}
			}

			for (var sign in similar)
			{
				if (!similar.hasOwnProperty(sign))
					continue;

				var element = similar[sign];
				if (element.list.length > 1)
				{
					if (!element.group)
					{
						opera.extension.tabGroups.create(element.list, {collapsed: true}, element.list[0]);
					} else {
						for (i = 0; i < element.list.length; i++)
						{
							tab = element.list[i];
							if (!tab.tabGroup)
								element.group.insert(tab);
						}
					}
				}
			}
		};

		/**
		 * close dublicate tabs
		 */
		this.closeDubplicateTabs = function()
		{
			var urls = {};
			var tabs = opera.extension.tabs.getAll();
			var closedNumber = 0;
			for (var i = 0; i < tabs.length; i++)
			{
				var tab = tabs[i];
				if (!tab.browserWindow)
				{
					continue;
				}

				if (!urls[tab.url])
				{
					urls[tab.url] = true;
				} else {
					closedNumber++;
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
				if (!tab.browserWindow)
				{
					continue;
				}

				var sign = this._getSign(tab.url);

				if (!similar[sign])
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
			if (typeof "url" !== "string")
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
