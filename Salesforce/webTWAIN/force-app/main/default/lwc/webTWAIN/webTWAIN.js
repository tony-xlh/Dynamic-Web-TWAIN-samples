import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class WebTWAIN extends LightningElement {
  @api scannerOptions = [];
  scanner;
  async connectedCallback() {
    await this.listScanners();
  }

  async listScanners(){
    try {
      const options = [];
      const url = "https://local.dynamsoft.com:18623/DWTAPI/Scanners";
      const response = await fetch(url, {"method":"GET", "mode":"cors", "credentials":"include"});
      const scanners = await response.json();
      for (let index = 0; index < scanners.length; index++) {
        const scanner = scanners[index];
        const scannerOption = {label:scanner.name,value:scanner};
        options.push(scannerOption);
      }
      if (scanners.length>0) {
        this.scanner = scanners[0];
      }
      this.scannerOptions = options;
    } catch (error) {
      console.log(error);
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: "Failed to connect to Dynamsoft Servce. Please visit https://demo.dynamsoft.com/web-twain/ and make sure it works.",
          variant: "error"
        })
      );
    }
  }

  handleScannerChange(event) {
    this.scanner = event.detail.value;
  }
}