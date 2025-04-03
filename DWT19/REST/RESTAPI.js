const WebTWAINService = {
  endPoint: "http://127.0.0.1:18622",
  license: "",
  listScanners: async function() {
    let requestOptions = {
      method: 'GET',
      redirect: 'follow'
    };
    let response = await fetch(this.endPoint+"/api/device/scanners", requestOptions);
    scanners = await response.json();
    return scanners;
  },
  CreateScanJob: async function(device,config){
    let myHeaders = new Headers();
    myHeaders.append("X-DICS-LICENSE-KEY", this.license);
    myHeaders.append("Content-Type", "application/json");
    var raw = JSON.stringify({
      "autoRun": true,
      "device": device,
      "config": config
    });
    console.log(raw);
    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw
    };

    let response = await fetch(this.endPoint+"/api/device/scanners/jobs", requestOptions);
    console.log(response);
    if (response.status === 201) {
      let object = await response.json();
      console.log(object);
      jobuid = object.jobuid;
      return jobuid;
    }
    throw new Error("Failed to create scan job: " + response.status);
  },
  GetImage: async function (){
    var requestOptions = {
      method: 'GET',
      redirect: 'follow'
    };
    let response = await fetch(this.endPoint+"/api/device/scanners/jobs/"+jobuid+"/next-page", requestOptions);
    console.log(response);
    if (response.status === 200) {
      let blob = await response.blob();
      return blob;
    }
    return undefined;
  }
}
