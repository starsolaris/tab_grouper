(function() {

var tab = new Tab();
window.addEventListener(
	"load",
	function()
	{
		tab.onLoad.call(tab);
	},
	false
);

function Tab()
{
	var _self = this;
	this._groupButton = null;
	this._closeButton = null;

	this.onLoad = function()
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
				_self.closeDubplicateTabs.call(_self);
				_self.groupSimilarTabs.call(_self);
			}
		});

		opera.contexts.toolbar.addItem(_self._groupButton);
	};

	this.groupSimilarTabs = function()
	{
		var i = 0;
		var similar = _self.getSimilar();
		var tabGroups = opera.extension.tabGroups.getAll();
		for (i = 0; i < tabGroups.length; i++)
		{
			var tabGroup = tabGroups[i];
			var groupTabs = tabGroup.tabs.getAll();
			if (groupTabs.length > 0)
			{
				similar[this._getSign(groupTabs[0].url)].group = tabGroup;
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

		// _self._closeButton.badge.textContent = closedNumber;
	};

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

	this._getSign = function(url)
	{
		var sign = "";
		var match = [];
		if ((match = url.match(/https?:\/\/([^\/]*)\//)) != null)
		{
			sign = match[1];
		}

		return sign;
	};
}

})();
