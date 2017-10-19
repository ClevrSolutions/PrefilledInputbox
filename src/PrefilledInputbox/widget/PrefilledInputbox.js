define([
	"dojo/_base/declare",
	"mxui/widget/_WidgetBase",
	"dijit/_TemplatedMixin",
	"mxui/dom",
	"dojo/_base/window",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/keys",
	"dojo/dom-construct",
	"dojo/dom-geometry",
	"dojo/_base/fx",
	"dojo/_base/event",
	"dojo/text!PrefilledInputbox/widget/ui/PrefilledInputbox.html",
	"dojo/has",
	"dojo/sniff"
], function (declare, _WidgetBase, _TemplatedMixin, dom, win, lang, domStyle, keys, domConstruct, domGeom, fx, event, widgetTemplate, has) {
	return declare("PrefilledInputbox.widget.PrefilledInputbox", [ _WidgetBase, _TemplatedMixin ], {
		templateString: widgetTemplate,

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
        tabindex : 0,

	
	//CACHES
	_hasStarted		: null,
	inputBox		: null,
	inputOverlay	: null,
	relativeNode	: null,
	realMask		: null,
	eventsList		: null,
	isInactive      : false,
	secretTA 		: false,
	
	postCreate : function(){
		secretTA = win.body().appendChild(dom.create("div",{
			'class': 'secretTA',
			'style': 'left: -5000px; overflow: auto; top: -5000px; height: auto; position: absolute; word-wrap: break-word; white-space: pre-wrap',
			'tabIndex': '-1'
		}));
		if (this._hasStarted)
			return;
		
		this._hasStarted = true;
        // this.offerInterface("close");
		this.eventsList = [];

		this.renderInputbox();
	},
    update : function(obj, callback){
        this.contextGUID = obj.getGuid();
        this.mxobj = obj;

        this._handle = mx.data.subscribe({
            guid: this.mxobj.getGuid(),
            callback: lang.hitch(this, function(obj){
                var value = this.mxobj.get(this.name);
                this.inputBox.value = value;
                                
                if ((value == "" || !value || value == 0) && (!has("ie") || has("ie") > 7)) {
                    domStyle.set(this.inputOverlay, {
                        'opacity' :  0.3,
                        'display' : 'block'
                    });
                } else {
                    domStyle.set(this.inputOverlay, {
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
			domConstruct.destroy(this.inputBox);
			this.inputBox = dom.create("input",{'class' : "mendixFormView_textBox", 'tabIndex': this.tabindex, 'type' : 'password'});
			domConstruct.place(this.inputBox, this.relativeNode, 'first');
		} else if (this.textareaBool) {
			domConstruct.destroy(this.inputBox);
			this.createTextArea();
		}
		
		this.connect(this.inputBox,'onchange', this.onChange);
		domStyle.set(this.domNode, {
			'width' : '100%'
		});

		domStyle.set(this.relativeNode, 'position', 'relative');
		domStyle.set(this.inputOverlay, {
			'position'		: 'absolute',
			'top'			: this.topOffset+'px',
			'left'			: this.leftOffset+'px',
			'z-index'		: '100',
			'user-select'	: 'none',
			'-moz-user-select' : 'none', // can also be -moz-none
			'-webkit-user-select' : 'none',
			'-khtml-user-select' : 'none'
		});

		this.connect(this.inputOverlay, 'onclick', lang.hitch(this, function(e) {
			this.inputOverlay.blur();
			this.inputBox.focus();
		}));
		this.inputOverlay.innerHTML = this.prefillText;

		if (this.inputmask != '')
			this.realMask = new mxui.lib.MxInputMask(this.inputBox, this.inputmask);
		
		this.inputBox.value = value || '';
		
		if ((value == "" || !value || value == 0) && (!has("ie") || has("ie") > 7)) {
			domStyle.set(this.inputOverlay, {
				'opacity' :  0.3,
				'display' : 'block'
			});
		} else {
			domStyle.set(this.inputOverlay, {
				'opacity' :  0,
				'display' : 'none'
			});
		}
		
		this.addEvents();
		// mxui.dom.applyEnableStyle(this.inputBox);

		if (this.grabfocus)
            mxui.wm.focus.put(this.inputBox);
		
		this.connect(this.inputBox,'onchange','onChange');
	},
	createTextArea : function() {
		this.inputBox = mxui.dom.textarea({'class' : "mendixFormView_textBox", 'tabIndex': this.tabindex, 'rows' : this.minSize})
		
		domStyle.set(this.inputBox, {
			'overflow' : 'hidden',
			'wordWrap' : 'break-word'
		});
		domConstruct.place(this.inputBox, this.relativeNode, 'first');
		this.lineSize = parseInt(domstyle.get(this.inputBox, 'lineHeight'), 10) || 15;
		this.base = domStyle.get(this.inputBox, 'paddingTop')
				  + domStyle.get(this.inputBox, 'paddingBottom')
				  + domStyle.get(this.inputBox, 'borderTopWidth')
				  + domStyle.get(this.inputBox, 'borderBottomWidth');
	},
	getHeight : function () {
		if (domGeom.getMarginBox(this.inputBox).w == 0)
			return;
		
			domStyle.set(this.secretTA, {
			'width' :  domGeom.getMarginBox(this.inputBox).w+'px',
			'padding' : domStyle.get(this.inputBox, 'padding'),
			'fontSize' : domStyle.get(this.inputBox, 'fontSize'),
			'fontFamily' : domStyle.get(this.inputBox, 'fontFamily'),
			'fontWeight' : domStyle.get(this.inputBox, 'fontWeight'),
			'lineHeight' : (domStyle.get(this.inputBox, 'lineHeight') || 15)+'px',
			'textAlign' : domStyle.get(this.inputBox, 'textAlign')
		});
		var secretText = this.inputBox.value.replace(/\n/gi, "<br />");
		this.secretTA.innerHTML = secretText+"<br />";
		domStyle.set(this.secretTA, 'height', 'auto');
		
		var placeholder = domGeom.getMarginBox(this.secretTA).h; // Chrome bug with first read.
		var secretHeight = domGeom.getMarginBox(this.secretTA).h;
		var newH = secretHeight+this.base;
		var min = (this.minSize*this.lineSize)+this.base;
		var max = (this.maxSize*this.lineSize)+this.base;
		
		if (newH < min) {
			domStyle.set(this.inputBox, {
				'height' : min+'px',
				'overflow' : 'hidden'
			});
		} else if (this.maxSize > 0 && newH > max) {
			domStyle.set(this.inputBox, {
				'height' : max+'px',
				'overflow' : 'auto'
			});
		} else {
			domStyle.set(this.inputBox, {
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
			this.overlayEvt = fx.animateProperty({
				node : this.inputOverlay,
				properties : {
					'opacity' : 0.3
				},
				onBegin : lang.hitch(this, function() {
					if (!has("ie") || has("ie") > 7)
						domStyle.set(this.inputOverlay, 'display', 'block');
				})
			});
			this.overlayEvt.play();
		} else {
			this.overlayEvt && this.overlayEvt.stop();
			domStyle.set(this.inputOverlay, 'opacity', 0);
			domStyle.set(this.inputOverlay, 'display', 'none');
		}
	},
	keyPressEvt : function (e) {
		if (this.textareaBool) {
			this.getHeight();
		}
		if (this.inputBox.value != '') {
			this.overlayEvt && this.overlayEvt.stop();
			domStyle.set(this.inputOverlay, 'opacity', 0);
			domStyle.set(this.inputOverlay, 'display', 'none');
		}
		
		switch(e.keyCode) {
			case keys.ESCAPE :
				if (this.escapemf != '') {
                    this.mxobj.set(this.name, this.inputBox.value);
                    mx.data.commit({
						mxobj: this.mxobj,
						callback : function () {}
					});
	                
                    this.inputBox.blur();
	                this.executeMF(this.escapemf);
	                event.stop(e);
				}
                break;
			case keys.ENTER :
				if (this.entermf != '') {
	                this.inputBox.blur();
	                this.executeMF(this.entermf);
	                event.stop(e);
				}
                break;
            default :
            	break;
		}
	},
	executeMF : function (mf) {
		if (mf) {
			mx.ui.action(mf, {
				context: new mendix.lib.MxContext(),
				callback: function() {},
				error : function() {
                    mx.ui.error(this.id + ": error executing microflow")
                },
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
			// mxui.dom.applyEnableStyle(this.domNode);
			if (this.inputBox)
				// mxui.dom.applyEnableStyle(this.inputBox);
			
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
});

require(["PrefilledInputbox/widget/PrefilledInputbox"], function() {
    "use strict";
});
