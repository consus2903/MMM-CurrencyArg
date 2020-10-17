Module.register("MMM-CurrencyArg", {
	defaults: {
		header: "Dolár hoy",
		url: "https://www.dolarsi.com/api/api.php?type=valoresprincipales",
		animationSpeed: 5000,
		updateInterval: 1000 * 5 * 60, //5 minutos
		initialLoadDelay: 0,
		types: ['oficial', 'blue', 'bolsa', 'turista']
	},

	getStyles: function() {
		return ['MMM-CurrencyArg.css'];
	},

	start: function() {
		Log.info("Starting module: " + this.name);
		this.loaded = false;
		this.scheduleUpdate(this.config.initialLoadDelay);

		var self = this;
		setInterval(function() {
			self.updateDom();
		}, this.config.animationSpeed)
	},

	getDom: function() {
		var wrapper = document.createElement("div");
		if (!this.loaded) {
			wrapper.innerHTML = this.translate('LOADING');
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		var table = document.createElement("table");

		Log.info(this.name + " : " + JSON.stringify(this.dolarTypes));

		this.dolarTypes.forEach((dolarType) => {
			var row = document.createElement('tr');

			var nameCell = document.createElement('td');
			var purchaseCell = document.createElement('td');
			var saleCell = document.createElement('td');

			[nameCell, purchaseCell, saleCell].forEach((td, i) => {
				td.className='small';
				if(i !== 0){
					td.className+=" bright align-right";
				}

			})

			nameCell.innerHTML = dolarType.name;
			purchaseCell.innerHTML = dolarType.purchase;
			saleCell.innerHTML = dolarType.sale;

			row.appendChild(nameCell);
			row.appendChild(purchaseCell);
			row.appendChild(saleCell);

			table.appendChild(row);
		});

		wrapper.appendChild(table);

		return wrapper;
	},

	getHeader: function() {
		return this.config.header;
	},

	notificationReceived: function() {
	},
	socketNotificationReceived: function() {
	},

	updateDolars: function() {
		var url = this.config.url;
		var self = this;

		Log.info(this.name + ": Updateando dolares (" + url + ")");
		var request = new XMLHttpRequest();
		request.open("GET", url, true);
		request.onreadystatechange = function() {
			Log.info(this.name + ": request status change");
			if (this.readyState === 4) {
				if (this.status === 200) {
					self.processDolars(JSON.parse(this.response));
				} else {
					Log.error(self.name + ": Fallo la pegada a la API");
				}
			}
		};
		request.send();
	},

	capitalize: function(str) {
		return  str[0].toUpperCase() + str.slice(1)
	},

	round: function(str) {
		const strNumber = (Math.round(Number(str.replace(',', '.')) * 100) / 100).toString().replace('.',',');
		let [part1, part2 = '0'] = strNumber.split(',');
		part2 = part2.padEnd(2, '0');
		return '$' + [part1, part2].join(',');
	},

	processDolars: function(data) {
		Log.info(this.name + ": procesando dolares");
		Log.info(data);
		if(!data) {
			return;
		}

		this.dolarTypes = data
			.filter(apiDolarType => this.config.types.some(type => apiDolarType.casa.nombre.toLowerCase().includes(type)))
			.map(apiDolarType => ({
			purchase: apiDolarType.casa.compra !== 'No Cotiza' ? this.round(apiDolarType.casa.compra): '-',
			sale: this.round(apiDolarType.casa.venta),
			name: this.capitalize(apiDolarType.casa.nombre.replace('Dolar ', '')),
		}));

		this.loaded = true;
		this.updateDom(this.config.animationSpeed)
	},

	scheduleUpdate: function(delay) {
		Log.info(this.name + ": Scheduleando");
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		setTimeout(function() {
			self.updateDolars();
		}, nextLoad);
	}
});
