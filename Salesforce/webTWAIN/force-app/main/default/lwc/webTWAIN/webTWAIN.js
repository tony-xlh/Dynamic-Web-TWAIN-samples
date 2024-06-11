import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import dwt from '@salesforce/resourceUrl/dwt';

export default class WebTWAIN extends LightningElement {
    dwtInitialized = false;
    dwtWidth = 320;
    dwtHeight = 480;
    curScannerIndex = -1;
    
    showMessage(title, msg, succeed) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: msg,
                variant: succeed ? 'ok' : 'error'
            })
        );
    }
    
    renderedCallback() {
        if (this.dwtInitialized) {
            return;
        }
        this.dwtInitialized = true;

        loadScript(this, dwt + '/dynamsoft.webtwain.config.js')
            .then(() => {
                Promise.all([
                    loadScript(this, dwt + '/dynamsoft.webtwain.initiate.js'),
                    loadStyle(this, dwt + '/src/dynamsoft.webtwain.css'),
                    loadStyle(this, dwt + '/src/dynamsoft.webtwain.viewer.css'),
                ])
                .then(() => { 
                    this.createDWT();
                });
            })
            .catch(error => {
                this.showMessage("loading dwt js", error.message);
            });
        }
    
    initDevices(devices) {
        this.curScannerIndex = -1;
        this.devices = devices;
        const devicesSelector = this.template.querySelector('lightning-select');
        let options = [];
        for (let index = 0; index < this.devices.length; index ++) {
            options.push({label: this.devices[index].displayName, value: index});
        }
        devicesSelector.options = options;
        // to select a default device
        if (this.devices && this.devices.length != 0) {
            this.curScannerIndex = 0;
        }
    }

    handleDeviceChange(event) {
        this.curScannerIndex = event.detail.value;
    }

    async createDWT() {
        if (this.DWTObject) {
            this.DWTObject = undefined;
            Dynamsoft.DWT.DeleteDWTObject('dwtObj');
        }
        try{
            let me = this;
            Dynamsoft.DWT.ResourcesPath = dwt;
            //request your trial license here: https://www.dynamsoft.com/customer/license/trialLicense/?product=dwt
            Dynamsoft.DWT.ProductKey = "t01898AUAABL9Dpoj+I6g/V6TaezNQ9c6V9CDtdWno1BkmuaS8/f8SuIuj9oSNQQWygCHd+5q5r6jwfWfYHT0/648j/UFVye/nOzg1PZOlfZOdHDyllNknIdx2e3hOy9PYAaeM6DbcdgA1MBSywF4ubU2WAAtQA1ArRpgAZerOP98yjEg9dd/NrQ42cGp7Z11QNo40cHJW84UEB9lmNJqpyUgqE/ODqAF6CWA9SI7BUSOAC1ATwBCYBzj8AGcaiqf";
            const container = me.template.querySelector('div.dwtContainer');
            Dynamsoft.DWT.RootNode = container;
            Dynamsoft.DWT.AutoLoadCSS = false;
            Dynamsoft.DWT.CreateDWTObjectEx({WebTwainId: 'dwtObj', container: container}, function (obj) {
                me.DWTObject = obj;
                const succeed = me.DWTObject.Viewer.bind(container);
                me.DWTObject.Viewer.width = me.dwtWidth;
                me.DWTObject.Viewer.height = me.dwtHeight;
                me.DWTObject.Viewer.show();

                me.DWTObject.GetDevicesAsync().then(devices=> { 
                    me.initDevices(devices);
                });
            }, function(error) { console.log(error.message);});
        }catch(error) {
            this.showMessage("creating dwt object", error.message);
        }
    }

    async acquire() {
        try {
            if (this.curScannerIndex >= 0 && this.devices) {
                await this.DWTObject.SelectDeviceAsync(this.devices[this.curScannerIndex]);
            }
            // await this.DWTObject.SelectSourceAsync(); // not support, ui has some problems
            await this.DWTObject.AcquireImageAsync({Resolution: 200, PixelType: 2, ShowUI: true});
        }catch(error) {
            this.showMessage('acquiring', error.message);
        }
    }

    async rotate() {
        try {
            await this.DWTObject.RotateAsync(this.DWTObject.CurrentImageIndexInBuffer, 90, true);
        }
        catch(error)
        {
            this.showMessage('rotating', error.message);
        }
    }

    deleteImage() {
        try {
            this.DWTObject.RemoveImage(this.DWTObject.CurrentImageIndexInBuffer);
        }
        catch(error)
        {
            this.showMessage('deleting', error.message);
        }
    }

    showEditor() {
        const me = this;
        try {
            const editorSettings = {
                /* Show the editor within the DIV 'imageEditor'*/
                element: this.template.querySelector('div.dwtContainer'),
                workMode: Dynamsoft.DWT.EnumDWT_WorkMode.balance,
                width: this.dwtWidth,
                height: this.dwtHeight
            }
            if (!this.imageEditor) {
                this.imageEditor = this.DWTObject.Viewer.createImageEditor(editorSettings);
                this.DWTObject.RegisterEvent('CloseImageEditorUI', function(){
                    me.DWTObject.Viewer.show();
                    me.imageEditor = undefined; // closed already, need recreate again
                });
            }
            this.DWTObject.Viewer.hide();
            this.imageEditor.show();
        }
        catch(error)
        {
            this.showMessage('showing editor', error.message);
        }
    }

    save() {
        const me = this;
        try {
            this.DWTObject.SaveAllAsPDF("output.pdf", function(){

            }, function(errorCode, errorString){
                me.showMessage('saving', errorString);
            });
        }
        catch(error)
        {
            this.showMessage('saving', error.message);
        }
    }
}