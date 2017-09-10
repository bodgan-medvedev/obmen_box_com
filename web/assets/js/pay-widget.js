function Wayforpay() {
    var frameName = 'WayforpayFrame';
    var formName = 'WayforpayForm';
}

Wayforpay.prototype.name = 'WFPWidget';

Wayforpay.prototype.getTargetHost = function () {
    var script = document.getElementById('widget-wfp-script');
    var url, l;

    if(this.target) {
        return this.target;
    } else if(!script) {
        return 'https://secure.wayforpay.com';
    } else {
        if (script.getAttribute.length !== undefined) {
            url = script.src;
        } else {
            url = script.getAttribute('src');
        }
        l = document.createElement("a");
        l.href = url;
        this.target =  l.protocol + '//' + l.hostname;
        return this.target;
    }
};

Wayforpay.prototype.isVerify = function () {
    return ('VERIFY' == this.requestType);
};

Wayforpay.prototype.getPayUrl = function () {
    if(this.isVerify()) {
        return this.getTargetHost() + '/verify/' + this.skin;
    } else {
        return this.getTargetHost() + '/pay/' + this.skin;
    }
};

Wayforpay.prototype.run = function (options, onApproved, onDeclined, onPending) {
    var that = this;
    var theme = options.hasOwnProperty('theme') ? options.theme : false;

    this.postFields  = options;
    this.requestType = options.hasOwnProperty('requestType') ? options.requestType : false;

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        this.skin = theme ? theme : (this.isVerify() ? 'verify_compact' : 'compact');
        this.submitData(false);
    } else {
        this.skin = theme ? theme : (this.isVerify() ? 'verify_compact' : 'compact');
        this.createContainer();
        this.createOverlay();
        this.createFrame();

        that.frame.contentWindow.focus();

        this.onApproved = onApproved;
        this.onDeclined = onDeclined;
        this.onPending  = onPending;

        window.addEventListener("message", function (event) {
            if(event.origin != that.getTargetHost()) {
                return;
            }
            if (event.data == 'WfpWidgetEventClose') {
                var cont = document.getElementById('wfp-container');
                if (cont) {
                    cont.parentNode.removeChild(cont);
                }
            } else if (event.data == 'WfpWidgetEventLoaded') {
                that.frame.style.backgroundImage = 'none';
            } else {
                that.handleResponse(event.data);
            }
        });
    }
};

Wayforpay.prototype.handleResponse = function (data) {
    var response;
    try {
        response = JSON.parse(data);
        if ('reasonCode' in response) {
            if (1100 == response.reasonCode) {
                if (typeof this.onApproved == 'function') {
                    this.onApproved(response);
                }
            } else if (1134 == response.reasonCode || 1131 == response.reasonCode) {
                if (typeof this.onPending == 'function') {
                    this.onPending(response);
                }
            } else if (typeof this.onDeclined == 'function') {
                this.onDeclined(response);
            }
        } else if('pay_way' in response && response.pay_way == 'privat24') {
            this.submitForm('https://api.privatbank.ua/p24api/ishop', response);
        } else if (typeof this.onDeclined == 'function') {
            this.onDeclined(response);
        }
    } catch (error) {
        //
    }

};

Wayforpay.prototype.closeit = function () {
    if (this.container) {
        this.container.parentNode.removeChild(this.container);
        this.container = null;
    }
};

Wayforpay.prototype.createContainer = function () {
    var cont = document.getElementById('wfp-container');
    if (cont) {
        cont.parentNode.removeChild(cont);
    }

    this.container = document.createElement('div');
    this.container.style.cssText = 'z-index: 9997; height: 100%; width: 100%; position: fixed; left: 0px; top: 0px;';
    this.container.setAttribute('id', 'wfp-container');
    document.body.appendChild(this.container);
};

Wayforpay.prototype.createOverlay = function () {
    this.over = document.createElement('div');
    this.over.style.cssText = '-ms-filter:"progid:DXImageTransform.Microsoft.Alpha(Opacity=50)";filter:alpha(opacity=50);-moz-opacity:0.5;-khtml-opacity:0.5;opacity:0.5;position:absolute;z-index:9997;background:black;top:0;left:0;width:100%;height:100%;';
    this.container.appendChild(this.over);
};

Wayforpay.prototype.createFrame = function () {
    this.frame = document.createElement('iframe');
    //this.frame.setAttribute('id', 'wfp-' + this.name + 'Frame');
    this.frame.setAttribute('name', this.name + 'Frame');
    this.frame.setAttribute('src', 'about:blank');
    this.frame.style.cssText = 'background: transparent; z-index: 9999; position: absolute; top: 0; left: 0; width: 100%; height: 100%;background-image:url("https://s3.eu-central-1.amazonaws.com/w4p-merch/logo/widget_preloader_light.gif");background-position: center center;background-repeat: no-repeat;';
    //this.frame.style.cssText = 'color: white; z-index: 9999; position: absolute; top: 50%; left: 50%; width: 500px; height: 550px; border-radius: 0; margin: -275px 0 0 -250px;overflow:hidden;background-color: #28324E;background-image:url("https://s3.eu-central-1.amazonaws.com/w4p-merch/logo/widget_preloader_dark.gif");background-position: center center;background-repeat: no-repeat;border-radius:10px;';
    this.frame.setAttribute('frameborder', '0');
    this.frame.setAttribute('scrolling', 'no');
    this.container.appendChild(this.frame);
    this.submitData(true);
};

Wayforpay.prototype.submitData = function (to_frame) {
    var form = document.createElement('form');
    var i, field, a, e, n;
    var body = document.getElementsByTagName('body')[0];

    form.style.cssText = 'display: none;';
    form.setAttribute('name', this.name + 'Form');
    form.setAttribute('action', this.getPayUrl()+(to_frame ? '?behavior=frame' : '?behavior=page'));
    form.setAttribute('method', 'POST');
    if (to_frame) {
        form.setAttribute('target', this.name + 'Frame');
    }
    i = document.createElement('input');
    i.setAttribute('type', 'submit');
    form.appendChild(i);

    for (field in this.postFields) {
        if (this.postFields.hasOwnProperty(field)) {
            if(this.postFields[field] instanceof Array) {
                n = 0;
                a = this.postFields[field];
                for (e in a) {
                    if (a.hasOwnProperty(e)) {
                        i = document.createElement('input');
                        i.setAttribute('type', 'text');
                        i.setAttribute('name', field + '[]');
                        i.setAttribute('value', a[e]);
                        form.appendChild(i);
                        n++;
                    }
                }
            } else {
                i = document.createElement('input');
                i.setAttribute('type', 'text');
                i.setAttribute('name', field);
                i.setAttribute('value', this.postFields[field]);
                form.appendChild(i);
            }
        }
    }

    if (to_frame) {
        this.container.appendChild(form);
    } else {
        body.appendChild(form);
    }

    form.submit();
};

Wayforpay.prototype.submitForm = function (url, data) {
    var form = document.createElement('form');
    var i, field, a, e, n;
    var body = document.getElementsByTagName('body')[0];

    //form.style.cssText = 'display: none;';
    form.setAttribute('name', this.name + 'FreeForm');
    form.setAttribute('action', url);
    form.setAttribute('method', 'POST');
    form.setAttribute('accept-charset', 'UTF-8');
    i = document.createElement('input');
    i.setAttribute('type', 'submit');
    form.appendChild(i);

    for (field in data) {
        if (data.hasOwnProperty(field)) {
            i = document.createElement('input');
            i.setAttribute('type', 'text');
            i.setAttribute('name', field);
            i.setAttribute('value', data[field]);
            form.appendChild(i);
        }
    }
    body.appendChild(form);
    form.submit();
};
