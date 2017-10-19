dojo.provide("PrefilledInputbox.widget.PrefilledInputbox");

mxui.widget.declare('PrefilledInputbox.widget.PrefilledInputbox', {
	//DECLARATION
	addons: [
		dijit._Contained,
		dijit._Templated,
        mxui.addon._Scriptable
	],

	templateString: dojo.cache("PrefilledInputbox", "widget/ui/PrefilledInputbox.html"),

    inputargs: {
		name		: '',
		prefillText	: '',
		textareaBool : false,
		minSize : 5,
		maxSize : 0,
		onleavemf	: '',
		escapemf	: '',
		entermf		: '',
		inputmask	: '',
		attrType	: 'String',
		grabfocus	: false,
		invalidCause : '',
		leftOffset	: 5,
		topOffset	: 4,
        tabindex : 0
    },
	
	//CACHES
	_hasStarted		: null,
	inputBox		: null,
	inputOverlay	: null,
	relativeNode	: null,
	realMask		: null,
	eventsList		: null,
	isInactive      : false,
	secretTA 		: dojo.body().appendChild(mxui.dom.div({
		'class' : 'secretTA',
		'style' : 'left: -5000px; overflow: auto; top: -5000px; height: auto; position: absolute; word-wrap: break-word; white-space: pre-wrap',
		'tabIndex' : '-1'
	})),
	
	startup : function(){
		if (this._hasStarted)
			return;
		
		this._hasStarted = true;
        this.offerInterface("close");
		this.eventsList = [];

		this.renderInputbox();

		this.actLoaded();
	},
    update : function(obj, callback){
        this.contextGUID = obj.getGUID();
        this.mxobj = obj;

        this._handle = mx.data.subscribe({
            guid: this.mxobj.getGuid(),
            callback: dojo.hitch(this, function(obj){
                var value = this.mxobj.get(this.name);
                this.inputBox.value = value;
                                
                if ((value == "" || !value || value == 0) && (!dojo.isIE || dojo.isIE > 7)) {
                    dojo.style(this.inputOverlay, {
                        'opacity' :  0.3,
                        'display' : 'block'
                    });
                } else {
                    dojo.style(this.inputOverlay, {
                        'opacity' :  0,
                        'display' : 'none'
                    });
                }                
            })
        });

        callback && callback();
    },
	renderInputbox : function(value) {
		this.inputBox.tabIndex = this.tabindex;
		if (this.attrType == "Password") {
			dojo.destroy(this.inputBox);
			this.inputBox = mxui.dom.input({'class' : "mendixFormView_textBox", 'tabIndex': this.tabindex, 'type' : 'password'});
			dojo.place(this.inputBox, this.relativeNode, 'first');
		} else if (this.textareaBool) {
			dojo.destroy(this.inputBox);
			this.createTextArea();
		}
		
		this.connect(this.inputBox,'onchange', this.onChange);
		dojo.style(this.domNode, {
			'width' : '100%'
		});

		dojo.style(this.relativeNode, 'position', 'relative');
		dojo.style(this.inputOverlay, {
			'position'		: 'absolute',
			'top'			: this.topOffset+'px',
			'left'			: this.leftOffset+'px',
			'z-index'		: '100',
			'user-select'	: 'none',
			'-moz-user-select' : 'none', // can also be -moz-none
			'-webkit-user-select' : 'none',
			'-khtml-user-select' : 'none'
		});

		this.connect(this.inputOverlay, 'onclick', dojo.hitch(this, function(e) {
			this.inputOverlay.blur();
			this.inputBox.focus();
		}));
		this.inputOverlay.innerHTML = this.prefillText;

		if (this.inputmask != '')
			this.realMask = new mxui.lib.MxInputMask(this.inputBox, this.inputmask);
		
		this.inputBox.value = value || '';
		
		if ((value == "" || !value || value == 0) && (!dojo.isIE || dojo.isIE > 7)) {
			dojo.style(this.inputOverlay, {
				'opacity' :  0.3,
				'display' : 'block'
			});
		} else {
			dojo.style(this.inputOverlay, {
				'opacity' :  0,
				'display' : 'none'
			});
		}
		
		this.addEvents();
		mxui.dom.applyEnableStyle(this.inputBox);

		if (this.grabfocus)
            mxui.wm.focus.put(this.inputBox);
		
		this.connect(this.inputBox,'onchange','onChange');
	},
	createTextArea : function() {
		this.inputBox = mxui.dom.textarea({'class' : "mendixFormView_textBox", 'tabIndex': this.tabindex, 'rows' : this.minSize})
		
		dojo.style(this.inputBox, {
			'overflow' : 'hidden',
			'wordWrap' : 'break-word'
		});
		dojo.place(this.inputBox, this.relativeNode, 'first');
		this.lineSize = parseInt(dojo.style(this.inputBox, 'lineHeight'), 10) || 15;
		this.base = dojo.style(this.inputBox, 'paddingTop')
				  + dojo.style(this.inputBox, 'paddingBottom')
				  + dojo.style(this.inputBox, 'borderTopWidth')
				  + dojo.style(this.inputBox, 'borderBottomWidth');
	},
	getHeight : function () {
		if (dojo.marginBox(this.inputBox).w == 0)
			return;
		
		dojo.style(this.secretTA, {
			'width' :  dojo.marginBox(this.inputBox).w+'px',
			'padding' : dojo.style(this.inputBox, 'padding'),
			'fontSize' : dojo.style(this.inputBox, 'fontSize'),
			'fontFamily' : dojo.style(this.inputBox, 'fontFamily'),
			'fontWeight' : dojo.style(this.inputBox, 'fontWeight'),
			'lineHeight' : (dojo.style(this.inputBox, 'lineHeight') || 15)+'px',
			'textAlign' : dojo.style(this.inputBox, 'textAlign')
		});
		var secretText = this.inputBox.value.replace(/\n/gi, "<br />");
		this.secretTA.innerHTML = secretText+"<br />";
		dojo.style(this.secretTA, 'height', 'auto');
		
		var placeholder = dojo.marginBox(this.secretTA).h; // Chrome bug with first read.
		var secretHeight = dojo.marginBox(this.secretTA).h;
		var newH = secretHeight+this.base;
		var min = (this.minSize*this.lineSize)+this.base;
		var max = (this.maxSize*this.lineSize)+this.base;
		
		if (newH < min) {
			dojo.style(this.inputBox, {
				'height' : min+'px',
				'overflow' : 'hidden'
			});
		} else if (this.maxSize > 0 && newH > max) {
			dojo.style(this.inputBox, {
				'height' : max+'px',
				'overflow' : 'auto'
			});
		} else {
			dojo.style(this.inputBox, {
				'height' : newH+'px',
				'overflow' : 'hidden'
			});
		}
		this.secretTA.innerHTML = "";
	},
	addEvents : function () {
		this.removeEvents();
		this.eventsList.push(this.connect(this.inputBox, 'onkeypress', this.keyPressEvt));
		this.eventsList.push(this.connect(this.inputBox, 'onkeyup', this.keyUpEvt));
	},
	removeEvents : function () {
		for (var i = this.eventsList.length - 1; i >= 0; i--) {
			this.disconnect(this.eventsList[i]);
			this.eventsList[i].pop();
		};
	},
	keyUpEvt : function (e) {
		if (this.textareaBool) {
			this.getHeight();
		}
		if (this.inputBox.value == '') {
			this.overlayEvt = dojo.animateProperty({
				node : this.inputOverlay,
				properties : {
					'opacity' : 0.3
				},
				onBegin : dojo.hitch(this, function() {
					if (!dojo.isIE || dojo.isIE > 7)
						dojo.style(this.inputOverlay, 'display', 'block');
				})
			});
			this.overlayEvt.play();
		} else {
			this.overlayEvt && this.overlayEvt.stop();
			dojo.style(this.inputOverlay, 'opacity', 0);
			dojo.style(this.inputOverlay, 'display', 'none');
		}
	},
	keyPressEvt : function (e) {
		if (this.textareaBool) {
			this.getHeight();
		}
		if (this.inputBox.value != '') {
			this.overlayEvt && this.overlayEvt.stop();
			dojo.style(this.inputOverlay, 'opacity', 0);
			dojo.style(this.inputOverlay, 'display', 'none');
		}
		
		switch(e.keyCode) {
			case dojo.keys.ESCAPE :
				if (this.escapemf != '') {
                    this.mxobj.set(this.name, this.inputBox.value);
                    this.mxobj.save({ callback : function () {}});
	                
                    this.inputBox.blur();
	                this.executeMF(this.escapemf);
	                dojo.stopEvent(e);
				}
                break;
			case dojo.keys.ENTER :
				if (this.entermf != '') {
	                this.inputBox.blur();
	                this.executeMF(this.entermf);
	                dojo.stopEvent(e);
				}
                break;
            default :
            	break;
		}
	},
	executeMF : function (mf) {
		if (mf) {
            mx.processor.xasAction({
                error       : function() {
                    logger.error("PrefilledInputbox.widget.PrefilledInputbox.triggerMicroFlow: XAS error executing microflow")
                },
                actionname  : mf,
                caller      : this,
                applyto     : 'selection',
                guids       : [this.contextGUID]
            });
		}
	},
	
	// Attribute functions //
	
	_setValueAttr : function (value) {
		if (this.attrType == ( "DateTime"  || "Date" || "Time" )&& value) {
			newDate = new Date(value);
			var formattedDate = mx.parser.formatDate(newDate.getTime(), {
				selector: this.attrType.toLowerCase()
			});
			this.renderInputbox(formattedDate);
		} else if (this.attrType == "Number" && parseInt(value, 10) === 0) {
			this.inputBox.value = '';
		} else {
			this.inputBox.value = value;
		}
		this.keyUpEvt(null);
		if (this.textareaBool) {
			this.getHeight();
		}
	},
	_getValueAttr : function () {
		if (this.attrType == ( "DateTime"  || "Date" || "Time" )) {
			var parsedValue = mx.parser.parseDate(this.inputBox.value, {
				selector: this.attrType.toLowerCase()
			});
			return parsedValue;
		} else if (this.attrType == "Number") {
			if ((this.inputBox.value == this.prefillText) || (this.inputBox.value === ""))
				return 0;
			else
				return parseInt(this.inputBox.value, 10);
		} else
			return (this.inputBox.value == this.prefillText)?"":this.inputBox.value;
	},
	_setDisabledAttr : function (value) {
		if(/true/.test(value)) {
			/*
			mendix.dom.applyDisableStyle(this.domNode);
			if (this.inputBox)
				mendix.dom.applyDisableStyle(this.inputBox);
			this.isInactive = true;
			
			var length = this.eventsList.length;
			while(length--) {
				this.disconnect(this.eventsList.pop());	
			}
			*/
		} else {
			mxui.dom.applyEnableStyle(this.domNode);
			if (this.inputBox)
				mxui.dom.applyEnableStyle(this.inputBox);
			
			this.isInactive = false;
			
			var length = this.eventsList.length;
			if(length === 0 || length == null){
				this.addEvents();
			}
		}
	},
	getInvalidCause : function () {
		return this.invalidCause || 'Invalid input';
	},
	_onChange : function (e) {
		this.getHeight();
		this.onChange();
	},
	onChange : function (e) {
	},
	uninitialize : function(){
	},
    close : function() {
        this.disposeContent();   
    }
});