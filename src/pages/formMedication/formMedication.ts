import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, LoadingController, PopoverController } from 'ionic-angular';
import { Validators, FormGroup, FormControl, FormArray } from '@angular/forms';
import { RestService } from '../../app/services/restService.service';
import { MedicalEventModel, MedicalEvent } from '../../pages/listMedicalEvent/listMedicalEvent.model';
import { HistoryItemModel } from '../../pages/history/history.model';
import { DictionaryModel, DictionaryItem } from '../../pages/models/dictionary.model';
import { ListOrderService } from '../../pages/listOrder/listOrder.service';
import { MenuTreatment } from '../../pages/menuTreatment/menuTreatment';
import { FeedModel } from '../feed/feed.model';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/Rx';
import { CallNumber } from '@ionic-native/call-number';

var moment = require('moment-timezone');

@Component({
  selector: 'formExercise-page',
  templateUrl: 'formMedication.html'
})
export class FormMedication {
  loading: any;
  section: string;
  formName: string = "formMedication";
  recId: number;
  card_form: FormGroup;
  goal_array: FormArray;
  goal_schedule: FormGroup;
  curRec: any;
  newRec: boolean = false;
  saving: boolean = false;
  showTips: boolean = true;
  eventModelSave: MedicalEventModel  = new MedicalEventModel();
  eventSave: MedicalEvent = new MedicalEvent();
  category: HistoryItemModel = new HistoryItemModel();
  userTimezone: any;
  timeNow: any;
  hourNow: any;
  minuteNow: any;
  momentNow: any;
  categories_checkbox_open: boolean;
  categories_checkbox_result;
  feed: FeedModel = new FeedModel();
  eventHasFocus: boolean = false;
  visitInfo: any;

  medication: FormControl = new FormControl();
  listFilter: DictionaryModel = new DictionaryModel();
  eventTerm: string = '';
  items: any;

  constructor(public nav: NavController, public alertCtrl: AlertController, public RestService:RestService,
    public navParams: NavParams, public loadingCtrl: LoadingController, public list2Service: ListOrderService,
    public popoverCtrl:PopoverController, private callNumber: CallNumber
    ) {

    this.recId = navParams.get('recId');
    this.visitInfo = navParams.get('visit');
    this.feed.category = navParams.get('category');
    if (this.feed.category.title == undefined || this.feed.category.title == null) {
      this.feed.category.title = 'Medical Event';
    }
    console.log('visitInfo: ', this.visitInfo);

    this.curRec = RestService.results[this.recId];

    var self = this;
    this.RestService.curProfileObj(function (error, results) {
      if (!error) {
        self.userTimezone = results.timezone;
      }
    });
    this.momentNow = moment(new Date());
    if (this.userTimezone !== undefined && this.userTimezone !== null && this.userTimezone !== "") {
      this.hourNow = this.momentNow.tz(this.userTimezone).format('HH');
      this.minuteNow = this.momentNow.tz(this.userTimezone).format('mm');
      this.timeNow = this.momentNow.tz(this.userTimezone).format('HH:mm');
    } else {
      this.hourNow = this.momentNow.format('HH');
      this.minuteNow = this.momentNow.format('mm');
      this.timeNow = this.momentNow.format('HH:mm');
    }
    console.log('Init Medical Event - recId = ' + this.recId);

    this.medication.setValidators(Validators.required);
    if (this.recId !== undefined) {
      this.medication.setValue(this.curRec.medication);
      this.card_form = new FormGroup({
        recordid: new FormControl(this.curRec.recordid),
        packagename: new FormControl(),
        manufacturer: new FormControl(),
        startdate: new FormControl(this.curRec.startdate, Validators.max(this.timeNow)),
        enddate: new FormControl(this.curRec.enddate, Validators.max(this.timeNow)),
        eventdescription: new FormControl(this.curRec.eventdescription),
        dosage: new FormControl(),
        dosefrequency: new FormControl(),
        dateofmeasure: new FormControl(this.curRec.dateofmeasure),
        chronicoracute: new FormControl(),
        isallergy: new FormControl(),
        confirmed: new FormControl(),
        profileid: new FormControl(),
        userid: new FormControl()
      });
    } else {
      this.newRec = true;
      this.card_form = new FormGroup({
        recordid: new FormControl(),
        packagename: new FormControl(),
        manufacturer: new FormControl(),
        startdate: new FormControl(null, Validators.max(this.timeNow)),
        enddate: new FormControl(null, Validators.max(this.timeNow)),
        eventdescription: new FormControl(),
        dosage: new FormControl(),
        dosefrequency: new FormControl(),
        dateofmeasure: new FormControl(this.today()),
        chronicoracute: new FormControl(),
        isallergy: new FormControl(),
        confirmed: new FormControl(),
        profileid: new FormControl(),
        userid: new FormControl()
      });
    }
  }

  ionViewWillEnter() {
    var dtNow = moment(new Date());
    var dtExpiration = moment(this.RestService.AuthData.expiration);
    var self = this;

    if (dtNow < dtExpiration) {
      this.presentLoadingDefault();
      this.loadFilterList();
      this.medication.valueChanges.debounceTime(700).subscribe(search => {
        this.setFilteredItems();
      });
      this.loading.dismiss();
    } else {
      this.presentLoadingDefault();
      this.RestService.refreshCredentials(function(err, results) {
        if (err) {
          console.log('Need to login again!!! - Credentials expired from formMedication');
          self.loading.dismiss();
          self.RestService.appRestart();
        } else {
          console.log('From formMedication - Credentials refreshed!');
          self.loadFilterList();
          self.medication.valueChanges.debounceTime(700).subscribe(search => {
            self.setFilteredItems();
          });
          this.loading.dismiss();
        }
      });
    }
  }

  loadFilterList() {
    var self = this;
    var restURLFilter: string;
    restURLFilter="https://ap6oiuyew6.execute-api.us-east-1.amazonaws.com/dev/GetDictionariesByForm";
    var config2 = {
      invokeUrl: restURLFilter,
      accessKey: this.RestService.AuthData.accessKeyId,
      secretKey: this.RestService.AuthData.secretKey,
      sessionToken: this.RestService.AuthData.sessionToken,
      region:'us-east-1'
    };
    var apigClient2 = this.RestService.AWSRestFactory.newClient(config2);
    var params2 = {
      //email: accountInfo.getEmail()
    };
    var pathTemplate2 = '';
    var method2 = 'GET';
    var additionalParams2 = {
        queryParams: {
            profileid: this.RestService.currentProfile,
            formName: this.formName
        }
    };
    var body2 = '';
    apigClient2.invokeApi(params2, pathTemplate2, method2, additionalParams2, body2)
    .then(function(result){
      self.list2Service
      .getFilter()
      .then(data => {
        self.listFilter.items = result.data;
        console.log('Result data from loadFilterList: ', result.data);
        console.log('Filter items from formMedication.loadFilterList: ', self.listFilter.items);
        self.setFilteredItems();
        self.loading.dismiss();
      });
    }).catch( function(result){
        console.log(body2);
        self.loading.dismiss();
    });
  }

  deleteRecord(){
    var dtNow = moment(new Date());
    var dtExpiration = moment(this.RestService.AuthData.expiration);
    var self = this;

    if (dtNow < dtExpiration) {
      this.presentLoadingDefault();
      this.deleteRecordDo();
    } else {
      this.presentLoadingDefault();
      this.RestService.refreshCredentials(function(err, results) {
        if (err) {
          console.log('Need to login again!!! - Credentials expired from ' + self.formName + '.deleteRecord');
          self.loading.dismiss();
          self.RestService.appRestart();
        } else {
          console.log('From ' + self.formName + '.deleteRecord - Credentials refreshed!');
          self.deleteRecordDo();
        }
      });
    }
  }

  deleteRecordDo(){
    let alert = this.alertCtrl.create({
      title: 'Confirm Delete',
      message: 'Are you certain you want to delete this record?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            this.loading.dismiss();
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Delete',
          handler: () => {
            console.log('Delete clicked');
            this.saving = true;
            this.eventSave.recordid = this.card_form.get('recordid').value;
            this.eventSave.profileid = this.RestService.currentProfile;
            this.eventSave.userid = this.RestService.userId;
            this.eventSave.active = 'N';
              var restURL="https://ap6oiuyew6.execute-api.us-east-1.amazonaws.com/dev/MedicationByProfile";
              var config = {
                invokeUrl: restURL,
                accessKey: this.RestService.AuthData.accessKeyId,
                secretKey: this.RestService.AuthData.secretKey,
                sessionToken: this.RestService.AuthData.sessionToken,
                region:'us-east-1'
              };
              var apigClient = this.RestService.AWSRestFactory.newClient(config);
              var params = {
                //pathParameters: this.vaccineSave
              };
              var pathTemplate = '';
              var method = 'POST';
              var additionalParams = {
                  queryParams: {
                      profileid: this.RestService.currentProfile,
                  }
              };
              var body = JSON.stringify(this.eventSave);
              var self = this;
              console.log('Calling Post', this.eventSave);
              apigClient.invokeApi(params, pathTemplate, method, additionalParams, body)
              .then(function(result){
                self.RestService.results = result.data;
                console.log('Happy Path: ' + self.RestService.results);
                self.category.title = "Medical Event";
                self.loading.dismiss();
                self.nav.pop();
              }).catch( function(result){
                console.log('Error from formMedication.delete: ',result);
                self.loading.dismiss();
              });
          }
        }
      ]
    });
    alert.present();
  }

  saveRecord(){
    var dtNow = moment(new Date());
    var dtExpiration = moment(this.RestService.AuthData.expiration);
    var self = this;

    if (dtNow < dtExpiration) {
      this.presentLoadingDefault();
      this.saveRecordDo();
    } else {
      this.presentLoadingDefault();
      this.RestService.refreshCredentials(function(err, results) {
        if (err) {
          console.log('Need to login again!!! - Credentials expired from ' + self.formName + '.saveRecord');
          self.loading.dismiss();
          self.RestService.appRestart();
        } else {
          console.log('From ' + self.formName + '.saveRecord - Credentials refreshed!');
          self.saveRecordDo();
        }
      });
    }
  }

  saveRecordDo(){
    var dtDET;

    this.saving = true;
    if (this.card_form.get('recordid').value !==undefined && this.card_form.get('recordid').value !==null) {
      this.eventSave.recordid = this.card_form.get('recordid').value;
      this.eventSave.profileid = this.RestService.currentProfile;
      this.eventSave.userid = this.RestService.userId;
      this.eventSave.active = 'Y';
      if (this.card_form.get('onsetdate').dirty){
        this.eventSave.onsetdate = this.card_form.get('onsetdate').value;
      }
    } else {
      this.eventSave.profileid = this.RestService.currentProfile;
      this.eventSave.userid = this.RestService.userId;
      this.eventSave.active = 'Y';
      if (this.card_form.get('onsetdate').dirty){
        this.eventSave.onsetdate = this.card_form.get('onsetdate').value;
      }
      if (this.card_form.get('dateofmeasure').dirty){
        if (this.userTimezone !== undefined) {
          dtDET = moment.tz(this.card_form.get('dateofmeasure').value, this.userTimezone);
        } else {
          dtDET = moment(this.card_form.get('dateofmeasure').value);
        }
        console.log('Date of measure Sent: ' + dtDET.utc().format('MM-DD-YYYY HH:mm'));
        //this.eventSave.dateofmeasure = dtDET.utc().toISOString();
      }
    }
      var restURL="https://ap6oiuyew6.execute-api.us-east-1.amazonaws.com/dev/MedicationByProfile";
      var config = {
        invokeUrl: restURL,
        accessKey: this.RestService.AuthData.accessKeyId,
        secretKey: this.RestService.AuthData.secretKey,
        sessionToken: this.RestService.AuthData.sessionToken,
        region:'us-east-1'
      };
      var apigClient = this.RestService.AWSRestFactory.newClient(config);
      var params = {
        //pathParameters: this.vaccineSave
      };
      var pathTemplate = '';
      var method = 'POST';
      var additionalParams = {
          queryParams: {
              profileid: this.RestService.currentProfile
          }
      };
      var body = JSON.stringify(this.eventSave);
      var self = this;
      console.log('Calling Post', this.eventSave);
      apigClient.invokeApi(params, pathTemplate, method, additionalParams, body)
      .then(function(result){
        self.RestService.results = result.data;
        console.log('Happy Path: ' + self.RestService.results);
        self.category.title = "Sleep";
        self.loading.dismiss();
        self.nav.pop();
      }).catch( function(result){
        console.log('Error from formSleep.save: ',result);
        self.loading.dismiss();
      });
  }

  public today() {
    //Used as max day in date of measure control
    var momentNow;

    if (this.userTimezone !== undefined && this.userTimezone !== null && this.userTimezone !== "") {
      momentNow = this.momentNow.tz(this.userTimezone).format('YYYY-MM-DD');
    } else {
      momentNow = this.momentNow.format('YYYY-MM-DD');
    }
    //console.log('From Today momentNow: ' + momentNow);
    return momentNow;
  }

  formatDateTime(dateString) {
    if (this.userTimezone !== undefined && this.userTimezone !=="") {
      return moment(dateString).tz(this.userTimezone).format('dddd, MMMM DD');
    } else {
      return moment(dateString).format('dddd, MMMM DD');
    }
  }

  formatDateTime2(dateString) {
    if (this.userTimezone !== undefined && this.userTimezone !=="") {
      return moment(dateString).tz(this.userTimezone).format('MM-DD-YYYY hh:mm A');
    } else {
      return moment(dateString).format('MM-DD-YYYY hh:mm A');
    }
  }

  updateCalc() {
    if (this.card_form.get('starttime').value !== null && this.card_form.get('waketime').value !== null) {
      var startSplit = this.card_form.get('starttime').value.split(":");
      var startHour = Number(startSplit[0]);
      var startMinRatio = (Number(startSplit[1]))/60;
      var wakeSplit = this.card_form.get('waketime').value.split(":");
      var wakeHour = Number(wakeSplit[0]);
      var wakeMinRatio = (Number(wakeSplit[1]))/60;
      var duration;

      if ((wakeHour + wakeMinRatio) >=(startHour + startMinRatio)) {
        duration = (wakeHour + wakeMinRatio) - (startHour + startMinRatio);
      } else {
        duration = (24 - (startHour + startMinRatio)) + (wakeHour + wakeMinRatio);
      }
      this.card_form.get('hoursslept').setValue(duration);
    } else {
      if (this.card_form.get('starttime').value !== null || this.card_form.get('waketime').value !== null) {
        this.card_form.get('hoursslept').setValue(null);
      }
    }
  }

  async ionViewCanLeave() {
    if (!this.saving && this.card_form.dirty) {
      const shouldLeave = await this.confirmLeave();
      return shouldLeave;
    }
  }

  confirmLeave(): Promise<Boolean> {
    let resolveLeaving;
    const canLeave = new Promise<Boolean>(resolve => resolveLeaving = resolve);
    const alert = this.alertCtrl.create({
      title: 'Exit without Saving',
      message: 'Do you want to exit without saving?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          handler: () => resolveLeaving(false)
        },
        {
          text: 'Yes',
          handler: () => resolveLeaving(true)
        }
      ]
    });
    alert.present();
    return canLeave
  }

setFilteredItems() {
  this.items = this.filterItems(this.eventTerm);
  //alert('Search Term:' + this.searchTerm);
}

filterItems(searchTerm){
  if (this.listFilter.items !== undefined) {
    if (this.listFilter.items[0].dictionary.filter((item) => {return item.value.toLowerCase().indexOf(searchTerm.toLowerCase()) ===0;}).length ==1 &&
    this.listFilter.items[0].dictionary.filter((item) => {return item.value.toLowerCase().indexOf(searchTerm.toLowerCase()) ===0;})[0].value.toLowerCase() == searchTerm.toLowerCase() ){
      return [];
    } else {
      return this.listFilter.items[0].dictionary.filter((item) => {
        return item.value.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1;
      });
    }
  } else {
    return [];
  }
}

hasFocus() {
  this.eventHasFocus = true;
}

loseFocus() {
  this.eventHasFocus = false;
}

showList() {
  //console.log('Event Focus: ' + this.eventHasFocus + ', term length: ' + this.eventTerm.length);
  if (this.eventTerm.length > 1) {
    return true;
  } else {
    return false;
  }
}

searchListTerm(strValue) {
  console.log('SearchListTerm called');
  this.medication.setValue(strValue);
}

presentPopover(myEvent) {
  var self = this;
  var dataObj;
  let popover = this.popoverCtrl.create(MenuTreatment);
  popover.onDidDismiss(data => {
    console.log('From popover onDismiss: ', data);
    if (data !==undefined && data !== null) {
      dataObj = data.choosePage;
      self.loadMenu(dataObj);
    }
  });
  popover.present({
    ev: myEvent
  });
}

loadMenu(dataObj) {
  console.log('LoadMenu dataobj: ' + dataObj);
}

callContact(){
  var phoneNum = this.curRec.phone;
  this.callNumber.callNumber(phoneNum, true)
    .then(() => alert('Launched dialer!'))
    .catch(() => alert('This capability is only availabe through call-capable devices.  Please manually call: ' + phoneNum + ' to order.'));
}

doseNotComplete() {
  if (this.card_form.get('dosage').value !== null && this.card_form.get('dosefrequency').value !== null) {
    return false;
  } else {
    return true;
  }
}

  presentLoadingDefault() {
    this.loading = this.loadingCtrl.create({
    spinner: 'hide',
    content: `
      <div class="custom-spinner-container">
        <div class="custom-spinner-box">
           <img src="assets/images/stickManCursor3.gif" width="50" height="50" />
           Loading...
        </div>
      </div>`,
    });

    this.loading.present();

    setTimeout(() => {
      this.loading.dismiss();
      //console.log('Timeout for spinner called ' + this.formName);
    }, 15000);
  }

}
